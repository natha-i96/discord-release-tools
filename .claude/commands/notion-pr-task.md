---
description: Create a Notion Timeline DEV task page for a GitHub PR. Args: <pr-url> [features=CMCITY] [project=features] [epic=<repo> <tag>] [select=BE - Nat] [priority=High] [status=Done] [dry]
---

Use the `notion-pr-task` skill workflow. Required arguments:

1. `<pr-url>` — GitHub PR URL (e.g. `https://github.com/owner/repo/pull/123`)

Optional:
- `features` — multi-select tags (default `CMCITY`). Comma-separated: `CMCITY,V2,Payment`
- `project` — multi-select project tags (default same as `features`)
- `epic` — release group in `<repo> <tag>` format; omit when unassigned
- `select` — owner (default `BE - Nat`)
- `priority` — `block` / `High` / `Medium` / `Low` (default `High`)
- `status` — `Done` / `In progress` / `Back log` / `Not started` (default auto: merged → `Done`)
- `dry` — preview only, do not create page

The skill will:
1. Fetch PR via `mcp__plugin_github_github__pull_request_read` (methods `get` + `get_files`)
2. Build page properties + content, setting `Project` from `Features` and optional `Epic` (multi-select JSON array — merge with existing Epic values on update, never overwrite). Leave `Is_feature` blank — it's the epic-level flag, set only on release rows
3. If `epic` is provided, register the new `<repo> <tag>` Epic option first via `notion-update-data-source` (preserving every existing option + color, alternate red/purple/blue for cho_rest_api)
4. Clone an accessible Timeline DEV row, update properties, and replace its content. If `duplicate-page` returns an id that fails `update_properties` with `Object ... is not a page or database`, re-duplicate and use the new id
5. Return the new page URL

Example invocation:
```
/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/174
/notion-pr-task https://github.com/natha-i96/app_payments/pull/129 CMCITY,Payment
/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/175 CMCITY dry
```
