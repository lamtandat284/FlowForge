# AI compatibility

FlowForge separates the workflow from provider discovery.

## Canonical agent package

All providers use:

```text
.agents/skills/flowforge-html/
├── SKILL.md
└── references/
    └── artifact-contract.md
```

This package defines modes, run isolation, required artifacts, implementation constraints, validation, and handoff.

## Provider adapters

| Provider | Entry file | Typical invocation |
|---|---|---|
| Codex | `.codex/skills/image-to-html/SKILL.md` | `Dùng $image-to-html với ảnh: inputs/screen.png` |
| Codex | `.codex/skills/sprint-to-mockup/SKILL.md` | `Dùng $sprint-to-mockup cho sprint sau: ...` |
| Claude Code | `CLAUDE.md` | Describe the task after starting Claude in the repo |
| Gemini CLI | `GEMINI.md` | Describe the task after starting Gemini in the repo |
| Cursor | `.cursor/rules/flowforge-html.mdc` | Ask the Agent to build or revise a mockup |
| GitHub Copilot | `.github/copilot-instructions.md` | Ask the coding agent to build or revise a mockup |
| Other terminal agent | `prompts/portable-html-agent.md` | Paste the portable prompt |

Automatic discovery depends on the AI tool. The portable prompt works whenever an agent can read repository files, inspect the input, edit files, and run Node.js commands.

## Required capabilities

- Filesystem read and write access to the cloned repository.
- Image understanding for Image mode.
- Command execution with Node.js 20 or newer.
- Browser control is optional; when unavailable, browser QA remains `not-run`.

An ordinary chat interface without workspace access can discuss the design but cannot complete the full artifact and validation workflow by itself.
