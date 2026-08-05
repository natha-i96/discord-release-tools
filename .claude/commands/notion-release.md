---
description: Create a Notion Timeline DEV release task page from a GitHub release tag. Links to existing PR Notion pages. Args: <release-url> [features=CMCITY] [select=BE - Nat] [priority=High] [status=Done] [dry]
---

Use the `notion-release` skill workflow. Required arguments:

1. `<release-url>` — GitHub release URL (e.g. `https://github.com/owner/repo/releases/tag/v1.3.0-rc3`)

Optional:
- `features` — multi-select tags (default `CMCITY`)
- `select` — owner (default `BE - Nat`)
- `priority` — `block` / `High` / `Medium` / `Low` (default `High`)
- `status` — `Done` / `Staging` / `Prod` / `In progress` (default `Done`)
- `dry` — preview only

The skill will:
1. Fetch release via `mcp__plugin_github_github__get_release_by_tag`
2. Extract PR numbers from `## PRs Included` table
3. Query Notion for each PR's existing page (`mcp__plugin_Notion_notion__notion-query-data-sources`)
4. Build release page with summary, endpoints, files, migration, deployment, rollback
5. Create page in Timeline DEV via `mcp__plugin_Notion_notion__notion-create-pages`
6. Return the new page URL

Example invocation:
```
/notion-release https://github.com/natha-i96/cho_rest_api/releases/tag/v1.3.0-rc3
/notion-release https://github.com/natha-i96/app_payments/releases/tag/v1.1.23 CMCITY,Payment
/notion-release https://github.com/natha-i96/cho_rest_api/releases/tag/v1.3.0-rc3 CMCITY,V2 dry
```
