import { runClaudePrompt } from "./claude.js";

export async function runAgent({ agent, prompt, model }) {
  if (agent !== "claude") {
    throw new Error(`Unsupported agent: ${agent}`);
  }

  return runClaudePrompt({ prompt, model });
}
