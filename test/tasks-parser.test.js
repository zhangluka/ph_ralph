import test from "node:test";
import assert from "node:assert/strict";
import {
  extractCompletedTaskNames,
  markTasksCompleted
} from "../src/tasks.js";

test("extractCompletedTaskNames parses section items", () => {
  const output = [
    "some logs",
    "COMPLETED_TASKS",
    "- Implement feature A",
    "- Add basic tests",
    "",
    "other notes"
  ].join("\n");

  const names = extractCompletedTaskNames(output);
  assert.deepEqual(names, ["Implement feature A", "Add basic tests"]);
});

test("markTasksCompleted checks matching pending items", () => {
  const lines = [
    "- [ ] Initialize project configuration",
    "- [ ] Implement feature A",
    "- [x] Already done task"
  ];

  const tasks = [
    {
      lineIndex: 0,
      line: lines[0],
      text: "Initialize project configuration",
      checked: false
    },
    {
      lineIndex: 1,
      line: lines[1],
      text: "Implement feature A",
      checked: false
    },
    {
      lineIndex: 2,
      line: lines[2],
      text: "Already done task",
      checked: true
    }
  ];

  const { updatedLines, marked } = markTasksCompleted(lines, tasks, [
    "Implement feature A"
  ]);

  assert.deepEqual(marked, ["Implement feature A"]);
  assert.equal(updatedLines[1], "- [x] Implement feature A");
});
