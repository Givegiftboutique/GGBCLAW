# OpenClaw Dashboard Local Release Folder

This folder is for local static release planning records only.

Do not commit large generated build bundles, zipped releases, production deploy artifacts, deploy credentials, or public hosting output here. Sprint 12A records a small local release index and generated manifest so operators can review a static read-only Dashboard handoff before any separate manual release step.

Safety boundary:

- static-read-only mode
- safetyMode read-only
- mutationEnabled false
- productionWiring disabled
- no production deploy
- no GitHub Actions or CI
- no production API or Gateway
- no secrets, auth tokens, or browser session handling
