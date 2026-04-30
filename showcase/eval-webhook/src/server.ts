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
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
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

const port = Number(process.env.PORT ?? 3000);
console.log(`eval-webhook listening on :${port}`);
serve({ fetch: app.fetch, port });
