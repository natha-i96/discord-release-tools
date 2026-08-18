---
description: Smart router — GitHub PR URL → /pr-summary + Notion page. Plain-text/file path → /note-summary only. Args: <input> [priority=High] [status=auto] [dry]
---

Smart router for input type:

- **GitHub PR URL** (`https://github.com/{owner}/{repo}/pull/{number}`) → `pr-summary` skill → `notion-pr-task` skill → Notion page
- **Plain-text file path** (`@example.txt`, `*.md`, `*.txt`, `./path/...`) → `note-summary` skill only (no Notion auto-create — paste summary manually or pass `--create-note-page` flag)

Required arguments:

1. `<input>` — either GitHub PR URL or local file path

Optional positional:
- `priority` — `block` / `High` / `Medium` / `Low` (default `High`, GitHub only)
- `status` — `Done` / `In progress` / `Back log` / `Not started` (default auto: merged → `Done`, GitHub only)
- `dry` — preview only (GitHub only)
- `--create-note-page` — file-path mode only; build Notion Timeline DEV page from note summary (asks confirmation)

Detection:
- Regex `^https?://github\.com/[^/]+/[^/]+/pull/\d+` → GitHub branch
- Starts with `@` or ends with `.md` / `.txt` / `.markdown` or contains `/` or `\` and file exists locally → file branch

Interactive prompts (GitHub branch only, via `AskUserQuestion` unless positional passed):

1. **`features`** — multi-select. Options: `CMCITY`, `V2`, `Payment`, `Platform`, `cho_rest_api v1.3.0` (default `CMCITY`)
2. **`project`** — multi-select. Same options as features (default same as `features`)
3. **`epic`** — single-select. Options: existing release tags from Timeline DEV Epic multi-select + `Skip` (default `Skip`)
4. **`select`** — single-select. Options: `BE - Nat`, `FE - Toto`, `FE - Job`, `UXUI - Fa` (default `BE - Nat`)

GitHub branch workflow:
1. Fetch PR via `mcp__plugin_github_github__pull_request_read` (methods `get` + `get_files`)
2. Run `pr-summary` skill → render caveman report (TL;DR / What's New / Files / Tests / Deploy / Merge)
3. Build page properties + content, setting `Project` from `Features` and optional `Epic` (multi-select JSON array — merge with existing Epic values on update, never overwrite). Leave `Is_feature` blank — it's the epic-level flag, set only on release rows
4. If `epic` provided, register new `<repo> <tag>` Epic option first via `notion-update-data-source` (preserving every existing option + color, alternate red/purple/blue for cho_rest_api)
5. Clone an accessible Timeline DEV row, update properties, replace content. If `duplicate-page` returns an id that fails `update_properties` with `Object ... is not a page or database`, re-duplicate and use the new id
6. Return new page URL

File branch workflow:
1. Read file via `Read` tool
2. Detect format (Obsidian daily log / plain markdown / plain text)
3. Run `note-summary` skill → render caveman report (TL;DR / Breakdown / Open Items / Refs)
4. Print report inline. If `--create-note-page` flag set, prompt for `select` owner + ask which existing page to use as clone anchor, then build Notion page from summary (uses same clone-and-replace flow as `notion-pr-task`, but property schema adapted for non-PR rows: `Name` = summary title from TL;DR, no `Epic` unless user adds one, `Features`/`Project` from user prompt)

Example invocation:
```
# GitHub PR
/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/174
/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/210 High

# Plain-text file
/notion-pr-task @example.txt
/notion-pr-task @01_Daily_Logs/.../2026-07-28.md
/notion-pr-task @daily_log.md --create-note-page
```
