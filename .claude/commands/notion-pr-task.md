---
description: Create a Notion Timeline DEV task page for a GitHub PR. Args: <pr-url> [features=CMCITY] [select=BE - Nat] [priority=High] [status=Done] [dry]
---

Use the `notion-pr-task` skill workflow. Required arguments:

1. `<pr-url>` — GitHub PR URL (e.g. `https://github.com/owner/repo/pull/123`)

Optional:
- `features` — multi-select tags (default `CMCITY`). Comma-separated: `CMCITY,V2,Payment`
- `select` — owner (default `BE - Nat`)
- `priority` — `block` / `High` / `Medium` / `Low` (default `High`)
- `status` — `Done` / `In progress` / `Back log` / `Not started` (default auto: merged → `Done`)
- `dry` — preview only, do not create page

The skill will:
1. Fetch PR via `mcp__plugin_github_github__pull_request_read` (methods `get` + `get_files`)
2. Build page properties + content (Thai summary, files, tests, deploy)
3. Create page in Timeline DEV via `mcp__plugin_Notion_notion__notion-create-pages`
4. Return the new page URL

Example invocation:
```
/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/174
/notion-pr-task https://github.com/natha-i96/app_payments/pull/129 CMCITY,Payment
/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/175 CMCITY dry
```
