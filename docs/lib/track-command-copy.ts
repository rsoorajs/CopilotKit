import type { PostHog } from "posthog-js";

const KNOWN_INSTALL_TYPES = [
  "npx",
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "pip",
  "uv",
  "poetry",
  "cargo",
  "go",
  "docker",
  "curl",
  "brew",
] as const;

export type InstallType = (typeof KNOWN_INSTALL_TYPES)[number] | "code";

const MAX_COMMAND_LENGTH = 240;

function inferInstallType(command: string): InstallType {
  const firstToken = command.trim().split(/\s+/)[0]?.toLowerCase();
  if (!firstToken) return "code";
  return (KNOWN_INSTALL_TYPES as readonly string[]).includes(firstToken)
    ? (firstToken as InstallType)
    : "code";
}

export type TrackCommandCopyArgs = {
  command: string;
  product?: string;
  location?: string;
};

export function trackCommandCopy(
  posthog: PostHog | undefined,
  { command, product, location }: TrackCommandCopyArgs,
) {
  if (!posthog) return;
  const trimmed = command.trim();
  if (!trimmed) return;
  const truncated =
    trimmed.length > MAX_COMMAND_LENGTH
      ? trimmed.slice(0, MAX_COMMAND_LENGTH) + "…"
      : trimmed;
  posthog.capture("cli_command_copied", {
    command: truncated,
    install_type: inferInstallType(trimmed),
    ...(product ? { product } : {}),
    ...(location ? { location } : {}),
  });
}
