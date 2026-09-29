# Portable FlowForge prompt

Use this prompt when the AI tool does not automatically read repository instruction files.

```text
You are working in the FlowForge repository.

First read:
- AGENTS.md
- .agents/skills/flowforge-html/SKILL.md
- .agents/skills/flowforge-html/references/artifact-contract.md

Then follow that workflow for this request:

<DESCRIBE THE REQUEST OR IMAGE PATH HERE>

Do not overwrite an existing run. At completion, return links or paths to the HTML entry point, Canonical Spec, QA report, and unresolved questions.
```
