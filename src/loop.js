import { runAgent } from "./agents/index.js";
import {
  extractCompletedTaskNames,
  getPendingTasks,
  loadTasksFile,
  markTasksCompleted,
  writeTasksFile
} from "./tasks.js";

function buildPrompt({ iteration, pendingTasks }) {
  const taskList = pendingTasks
    .map((task, index) => `- [ ] ${index + 1}. ${task.text}`)
    .join("\n");

  return [
    "You are working on tasks from an OpenSpec-style tasks.md file.",
    "Please execute the necessary coding work in the current repository.",
    "",
    `Current iteration: ${iteration}`,
    "",
    "Pending tasks:",
    taskList,
    "",
    "When you complete one or more tasks in this iteration, respond in this exact format:",
    "COMPLETED_TASKS",
    "- exact task text here",
    "- exact task text here",
    "",
    "Use the exact task text from the list above."
  ].join("\n");
}

export async function runLoop({
  tasksFile,
  maxIterations,
  agent = "claude",
  model,
  dryRun = false
}) {
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const { lines, tasks } = await loadTasksFile(tasksFile);
    const pending = getPendingTasks(tasks);

    if (pending.length === 0) {
      return { done: true, iterations: iteration - 1, reason: "all-tasks-completed" };
    }

    if (dryRun) {
      return {
        done: false,
        iterations: 0,
        reason: "dry-run",
        pending: pending.map((task) => task.text)
      };
    }

    const prompt = buildPrompt({ iteration, pendingTasks: pending });
    const result = await runAgent({ agent, prompt, model });

    if (result.code !== 0) {
      throw new Error(
        `Agent command failed with exit code ${result.code}. stderr: ${result.stderr || "(empty)"}`
      );
    }

    const completedTaskNames = extractCompletedTaskNames(result.stdout);
    const { updatedLines, marked } = markTasksCompleted(lines, tasks, completedTaskNames);

    if (marked.length > 0) {
      await writeTasksFile(tasksFile, updatedLines);
      continue;
    }

    if (iteration === maxIterations) {
      return {
        done: false,
        iterations: iteration,
        reason: "max-iterations-reached"
      };
    }
  }

  return { done: false, iterations: maxIterations, reason: "max-iterations-reached" };
}
