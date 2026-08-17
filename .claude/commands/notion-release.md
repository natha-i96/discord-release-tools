---
description: Create a Notion Timeline DEV release task page from a GitHub release tag. Links to existing PR Notion pages. Args: <release-url> [features=CMCITY] [project=features] [epic=<repo> <tag>] [select=BE - Nat] [priority=High] [status=Done] [dry]
---

Use the `notion-release` skill workflow. Required arguments:

1. `<release-url>` — GitHub release URL (e.g. `https://github.com/owner/repo/releases/tag/v1.3.0-rc3`)

Optional:
- `features` — multi-select tags (default `CMCITY`)
- `project` — multi-select project tags (default same as `features`)
- `epic` — shared release group (default `<repo> <tag>`)
- `select` — owner (default `BE - Nat`)
- `priority` — `block` / `High` / `Medium` / `Low` (default `High`)
- `status` — `Done` / `Staging` / `Prod` / `In progress` (default `Done`)
- `dry` — preview only

The skill will:
1. Fetch release via `mcp__plugin_github_github__get_release_by_tag`
2. Extract PR numbers from release body
3. Search Notion for each confirmed PR page
4. Register the new `<repo> <tag>` Epic option first via `notion-update-data-source` (preserving every existing option + color, alternate red/purple/blue for cho_rest_api)
5. Build release page with `Project`, shared `Epic`, and `Is_feature="0"` (release-row marker)
6. Clone an accessible release row, update properties (Epic written as JSON-array string `["<repo> <tag>"]`), replace content, then **merge** the same Epic into each confirmed PR row's existing Epic array. If `duplicate-page` returns an id that fails `update_properties`, re-duplicate and use the new id
7. Return the new page URL

Example invocation:
```
/notion-release https://github.com/natha-i96/cho_rest_api/releases/tag/v1.3.0-rc3
/notion-release https://github.com/natha-i96/app_payments/releases/tag/v1.1.23 CMCITY,Payment
/notion-release https://github.com/natha-i96/cho_rest_api/releases/tag/v1.3.0-rc3 CMCITY,V2 dry
```
