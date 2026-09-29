# FlowForge agent instructions

All AI coding agents working in this repository must read and follow `.agents/skills/flowforge-html/SKILL.md`. It is the provider-neutral source of truth.

- Use Image mode for screenshots and reference images.
- Use Spec mode for natural-language sprint descriptions and source documents.
- Use Revision mode when changing an existing FlowForge run.

Do not require a web server, package installation, or a separate API key. Verify Node.js 20+ on the first run in a copied workspace. Create each new result under a distinct `runs/<run-id>/` directory and preserve prior runs.

Provider-specific files may improve automatic discovery, but they must not duplicate or override the canonical workflow.

