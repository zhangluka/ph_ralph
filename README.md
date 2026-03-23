# ph_ralph

`ph_ralph` 是一个基于 npm 的命令行工具，用于循环读取 `tasks.md`（OpenSpec 风格 checklist）并调用 Claude Code 推进任务。

## 快速开始

```bash
cd ./new
npm install
npm run start -- --dry-run
```

## 命令

```bash
ph_ralph --tasks-file ./tasks.md --max-iterations 10 --agent claude
```

参数说明：

- `--tasks-file <path>`：任务文件路径，默认 `./tasks.md`
- `--max-iterations <n>`：最大循环轮次，默认 `10`
- `--agent <name>`：当前仅支持 `claude`
- `--model <name>`：透传给 `claude --model`
- `--dry-run`：只读取并打印未完成任务，不执行 Agent

## Agent 输出格式要求

工具依赖 Claude 的输出中包含以下段落来标记已完成任务：

```text
COMPLETED_TASKS
- task text A
- task text B
```

任务文本必须与 `tasks.md` 中的任务文本一致，工具才会把对应任务自动回写为 `[x]`。
