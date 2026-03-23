import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { runLoop } from "./loop.js";

function printHelp() {
  console.log(`ph_ralph - iterative OpenSpec task runner

Usage:
  ph_ralph [options]

Options:
  --tasks-file <path>      Path to tasks markdown file (default: ./tasks.md)
  --max-iterations <n>     Maximum loop rounds (default: 10)
  --agent <name>           Agent name (default: claude)
  --model <name>           Model name passed to the agent
  --dry-run                Parse tasks and print pending items only
  -h, --help               Show this help message
`);
}

function parseArgs(argv) {
  const options = {
    tasksFile: "./tasks.md",
    maxIterations: 10,
    agent: "claude",
    model: undefined,
    dryRun: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--tasks-file") {
      options.tasksFile = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--max-iterations") {
      options.maxIterations = Number.parseInt(argv[i + 1], 10);
      i += 1;
      continue;
    }

    if (arg === "--agent") {
      options.agent = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--model") {
      options.model = argv[i + 1];
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.tasksFile) {
    throw new Error("Missing value for --tasks-file");
  }

  if (!Number.isFinite(options.maxIterations) || options.maxIterations <= 0) {
    throw new Error("--max-iterations must be a positive integer");
  }

  return options;
}

async function ensureReadableFile(filePath) {
  await access(filePath, constants.R_OK);
}

export async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  await ensureReadableFile(options.tasksFile);
  const result = await runLoop(options);

  if (result.reason === "dry-run") {
    console.log("[ph_ralph] Dry run pending tasks:");
    for (const task of result.pending) {
      console.log(`- ${task}`);
    }
    return;
  }

  if (result.done) {
    console.log(`[ph_ralph] Completed. iterations=${result.iterations}`);
    return;
  }

  console.log(`[ph_ralph] Stopped. reason=${result.reason}, iterations=${result.iterations}`);
}
