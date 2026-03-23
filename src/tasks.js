import { readFile, writeFile } from "node:fs/promises";

const CHECKBOX_LINE_REGEX = /^(\s*(?:[-*]|\d+\.)\s+\[)([ xX])(\]\s+)(.*)$/;

function parseTaskLine(line, lineIndex) {
  const match = line.match(CHECKBOX_LINE_REGEX);
  if (!match) {
    return null;
  }

  const [, prefix, checked, spacer, rawText] = match;
  return {
    lineIndex,
    line,
    text: rawText.trim(),
    checked: checked.toLowerCase() === "x",
    parts: { prefix, spacer, rawText }
  };
}

export async function loadTasksFile(tasksFilePath) {
  const content = await readFile(tasksFilePath, "utf8");
  const lines = content.split(/\r?\n/);
  const tasks = [];

  for (let i = 0; i < lines.length; i += 1) {
    const task = parseTaskLine(lines[i], i);
    if (task) {
      tasks.push(task);
    }
  }

  return { content, lines, tasks };
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.checked);
}

function normalizeTaskText(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function extractCompletedTaskNames(agentOutput) {
  const lines = agentOutput.split(/\r?\n/);
  const completed = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inSection && /^COMPLETED_TASKS\s*:?\s*$/i.test(trimmed)) {
      inSection = true;
      continue;
    }

    if (!inSection) {
      continue;
    }

    if (trimmed === "") {
      if (completed.length > 0) {
        break;
      }
      continue;
    }

    const itemMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (!itemMatch) {
      break;
    }

    completed.push(itemMatch[1].trim());
  }

  return completed;
}

export function markTasksCompleted(lines, tasks, completedTaskNames) {
  if (completedTaskNames.length === 0) {
    return { updatedLines: lines, marked: [] };
  }

  const normalizedWanted = new Set(completedTaskNames.map(normalizeTaskText));
  const updatedLines = [...lines];
  const marked = [];

  for (const task of tasks) {
    if (task.checked) {
      continue;
    }

    const normalizedTask = normalizeTaskText(task.text);
    if (!normalizedWanted.has(normalizedTask)) {
      continue;
    }

    const nextLine = task.line.replace(CHECKBOX_LINE_REGEX, "$1x$3$4");
    updatedLines[task.lineIndex] = nextLine;
    marked.push(task.text);
  }

  return { updatedLines, marked };
}

export async function writeTasksFile(tasksFilePath, lines) {
  await writeFile(tasksFilePath, `${lines.join("\n")}\n`, "utf8");
}
