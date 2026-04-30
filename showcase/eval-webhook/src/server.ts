import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import crypto from "node:crypto";

const app = new Hono();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "";
const APP_ID = process.env.GITHUB_APP_ID ?? "1108748";
const PRIVATE_KEY = (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(
  /\\n/g,
  "\n",
);
const INSTALLATION_ID = process.env.GITHUB_APP_INSTALLATION_ID ?? "";

function verifySignature(payload: string, signature: string): boolean {
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

function getOctokit(): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      installationId: Number(INSTALLATION_ID),
    },
  });
}

app.get("/health", (c) => c.json({ ok: true }));

app.post("/webhooks/github", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("x-hub-signature-256") ?? "";

  if (!verifySignature(body, signature)) {
    return c.json({ error: "invalid signature" }, 401);
  }

  const event = c.req.header("x-github-event");
  if (event !== "check_run") {
    return c.json({ ignored: true }, 200);
  }

  const payload = JSON.parse(body);
  if (
    payload.action !== "requested_action" ||
    payload.requested_action?.identifier !== "run-eval"
  ) {
    return c.json({ ignored: true }, 200);
  }

  const checkRun = payload.check_run;
  const prNumber =
    checkRun.external_id || checkRun.pull_requests?.[0]?.number?.toString();

  if (!prNumber) {
    return c.json({ error: "no PR number found" }, 422);
  }

  const octokit = getOctokit();

  await octokit.checks.update({
    owner: "CopilotKit",
    repo: "CopilotKit",
    check_run_id: checkRun.id,
    status: "in_progress",
  });

  await octokit.actions.createWorkflowDispatch({
    owner: "CopilotKit",
    repo: "CopilotKit",
    workflow_id: "showcase_eval.yml",
    ref: "main",
    inputs: {
      pr_number: prNumber,
      check_run_id: String(checkRun.id),
    },
  });

  console.log(
    `Dispatched eval for PR #${prNumber}, check_run_id=${checkRun.id}`,
  );
  return c.json({ dispatched: true, pr: prNumber }, 200);
});

// ---------------------------------------------------------------------------
// Signed trigger link — clicked from the bot comment on the PR
// ---------------------------------------------------------------------------

const TRIGGER_SECRET = WEBHOOK_SECRET; // reuse the same secret for HMAC signing

export function signTriggerUrl(pr: string, checkRunId: string): string {
  const payload = `${pr}:${checkRunId}`;
  const sig = crypto
    .createHmac("sha256", TRIGGER_SECRET)
    .update(payload)
    .digest("hex");
  return sig;
}

function verifyTriggerSig(
  pr: string,
  checkRunId: string,
  sig: string,
): boolean {
  const expected = signTriggerUrl(pr, checkRunId);
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(sig);
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

app.get("/trigger/eval", async (c) => {
  const pr = c.req.query("pr") ?? "";
  const checkRunId = c.req.query("check_run_id") ?? "";
  const sig = c.req.query("sig") ?? "";

  if (!pr || !sig) {
    return c.html("<h2>Invalid request</h2><p>Missing parameters.</p>", 400);
  }

  if (!verifyTriggerSig(pr, checkRunId, sig)) {
    return c.html("<h2>Unauthorized</h2><p>Invalid signature.</p>", 403);
  }

  const octokit = getOctokit();

  if (checkRunId) {
    await octokit.checks.update({
      owner: "CopilotKit",
      repo: "CopilotKit",
      check_run_id: Number(checkRunId),
      status: "in_progress",
      output: {
        title: "Showcase Eval — running...",
        summary: "Evaluation in progress.",
      },
    });
  }

  await octokit.actions.createWorkflowDispatch({
    owner: "CopilotKit",
    repo: "CopilotKit",
    workflow_id: "showcase_eval.yml",
    ref: "main",
    inputs: {
      pr_number: pr,
      check_run_id: checkRunId || "",
    },
  });

  console.log(
    `Trigger link: dispatched eval for PR #${pr}, check_run_id=${checkRunId}`,
  );

  const prUrl = `https://github.com/CopilotKit/CopilotKit/pull/${pr}`;
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="2;url=${prUrl}">
      <style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0d1117;color:#e6edf3;}div{text-align:center;}h2{color:#3fb950;}a{color:#58a6ff;}</style>
    </head>
    <body>
      <div>
        <h2>Showcase Eval triggered</h2>
        <p>PR #${pr} — evaluation dispatched.</p>
        <p>Redirecting to <a href="${prUrl}">the PR</a>...</p>
      </div>
    </body>
    </html>
  `);
});

const port = Number(process.env.PORT ?? 3000);
console.log(`eval-webhook listening on :${port}`);
serve({ fetch: app.fetch, port });
