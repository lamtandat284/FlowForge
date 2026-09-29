# FlowForge run artifact contract

Each generated result uses this structure:

```text
runs/<run-id>/
├── sprint-input.md
├── sprint-input/
│   └── <copied source files>
├── canonical-spec.json
├── ui-blueprint.json
├── review-decisions.md
└── output/
    ├── index.html
    ├── styles.css or style.css
    ├── app.js
    ├── traceability.json
    └── qa-report.json
```

`canonical-spec.json` must conform to `schemas/canonical-spec.schema.json`.

`ui-blueprint.json` must conform to `schemas/ui-blueprint.schema.json`. If the current validator supports only a lower-detail abstraction of a complex screen, preserve the true requirements and document the implementation gap in `review-decisions.md`.

`traceability.json` maps every UI-relevant requirement ID to its screen, component, action, or implementation location. Unmapped requirements require a reason.

`qa-report.json` records each check as `passed`, `failed`, or `not-run`, with concise evidence. Browser QA must include the interactions exercised and whether console warnings or errors were observed.

Revision runs must identify their source run in `sprint-input.md` and preserve the source run unchanged.
