---
description: Audit which GitHub PRs already exist in Notion Timeline DEV. Args: <pr-list> <owner/repo> [features=CMCITY] [out-file]
---

Use the `timeline-audit` skill workflow. Required arguments:

1. `<pr-list>` — comma-separated PR numbers, e.g. `121,122,125,126,127,128`
2. `<owner/repo>` — GitHub repo slug, e.g. `natha-i96/app_payments`

Optional:
- `features` — filter Notion pages by Features tag (default `CMCITY`)
- `out-file` — write audit report to markdown file

The skill will:
1. Fetch PR metadata via `mcp__plugin_github_github__pull_request_read` (method=`get`) for each PR
2. Query Notion via `mcp__plugin_Notion_notion__notion-query-data-sources` to find matching pages
3. Render a table: PR | Title | Status (GitHub) | Notion link
4. Summarize: `<existing>/<total> PRs already in Notion`, list missing
5. Optionally write to `out-file`

Example invocation:
```
/timeline-audit 121,122,125,126,127,128 natha-i96/app_payments
/timeline-audit 175,176,178,179 natha-i96/cho_rest_api CMCITY
/timeline-audit 121,122,125,126,127,128 natha-i96/app_payments CMCITY audit.md
```
