import { spawn } from "node:child_process";

export async function runClaudePrompt({ prompt, model }) {
  const args = ["-p", prompt];
  if (model) {
    args.push("--model", model);
  }

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Failed to execute claude command. Ensure Claude Code is installed and available in PATH. Original error: ${error.message}`
        )
      );
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}
