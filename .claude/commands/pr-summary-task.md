---
description: Summarize a PR then create its Notion Timeline DEV task page. Chains /pr-summary + /notion-pr-task. Args: <pr-url> [features=CMCITY] [project=features] [epic=<repo> <tag>] [select=BE - Nat] [priority=High] [status=auto] [dry]
---

Chain two skills in one call:

1. **`pr-summary`** — render caveman-style report (Summary / What's New / Files / Tests / Deploy / Merge)
2. **`notion-pr-task`** — create Timeline DEV page for the same PR, with PR footer linking back to the Notion row

Required arguments:

1. `<pr-url>` — GitHub PR URL (e.g. `https://github.com/owner/repo/pull/123`)

Optional (passed through to `notion-pr-task`):
- `features` — multi-select tags (default `CMCITY`). Comma-separated: `CMCITY,V2,Payment`
- `project` — multi-select project tags (default same as `features`)
- `epic` — release group `<repo> <tag>`; omit when unassigned
- `select` — owner (default `BE - Nat`)
- `priority` — `block` / `High` / `Medium` / `Low` (default `High`)
- `status` — `Done` / `In progress` / `Back log` / `Not started` (default auto: merged → `Done`, open → `In progress`)
- `dry` — preview only, do not create page

The workflow:
1. Parse `<pr-url>` → extract `owner`, `repo`, `pullNumber`
2. Invoke `pr-summary` skill with `prUrl=<pr-url>` → render report to user (no file write unless asked)
3. Invoke `notion-pr-task` skill with same `prUrl` + passed-through extras → create Notion page
4. Print both report + new page URL

If `dry=true`, run step 2 only, skip Notion creation.

Example invocation:
```
/pr-summary-task https://github.com/natha-i96/cho_rest_api/pull/174
/pr-summary-task https://github.com/natha-i96/cho_rest_api/pull/210 CMCITY "cho_rest_api v1.3.0-rc8"
/pr-summary-task https://github.com/natha-i96/app_payments/pull/130 CMCITY,Payment "app_payments v1.1.25" dry
```
