---
name: notion-pr-task
description: Create a Timeline DEV task page for a GitHub PR. Use when the user wants to track a PR in Notion Timeline DEV. The skill fetches PR details from GitHub, then writes a structured page with summary, files, tests, and deploy notes.
---

# notion-pr-task

Create a Notion task page in the **Timeline DEV** database for a GitHub PR.

## Inputs

| Arg | Required | Description |
|-----|----------|-------------|
| `prUrl` | yes | GitHub PR URL |
| `features` | yes (default `CMCITY`) | Multi-select tags, e.g. `CMCITY`, `V2`, `Payment`, `Platform` |
| `project` | no (default same as `features`) | Multi-select project tags; keep aligned with `Features` for now |
| `epic` | no | Release group in `<repo> <tag>` format; omit when PR has not been assigned to a release (multi-select — one PR may belong to several releases) |
| `select` | no (default `BE - Nat`) | Owner select: `BE - Nat` / `FE - Toto` / `FE - Job` / `UXUI - Fa` |
| `priority` | no (default `High`) | `block` / `High` / `Medium` / `Low` |
| `status` | no (default `Done` if PR merged, else `In progress`) | Status select |
| `dry` | no (default `false`) | Preview only, do not create page |

## Database

- **Data source ID:** `collection://2d3afc80-d0cd-8091-bf9b-000bad33fb21`
- **Schema:** `Name`, `Status`, `Priority`, `Select`, `Features[]`, `Project[]`, `Epic`, `Period (start)`

## Workflow

1. **Parse PR URL** — extract `owner`, `repo`, `pullNumber`:
   - `https://github.com/{owner}/{repo}/pull/{number}`

2. **Fetch PR via GitHub MCP**:
   - `mcp__plugin_github_github__pull_request_read` with `method=get` → metadata
   - `mcp__plugin_github_github__pull_request_read` with `method=get_files` → file list

3. **Build page properties**:
   - `Name`: `<pr title> (#<number>)` — preserve Thai/ASCII
   - `Status`: from `status` arg or auto (merged → `Done`, open → `In progress`)
   - `Priority`: from `priority` arg
   - `Select`: from `select` arg
   - `Features`: multi-select array from `features`
   - `Project`: multi-select array from `project`; default to exact `Features` value
   - `Epic`: optional multi-select from `epic`; pass JSON-array string. When writing, **merge** with existing Epic values: read current Epic, append new `<repo> <tag>` only if absent, write dedup array. Never overwrite prior release membership.
   - `Period.start`: PR merged_at date (or created_at if open) in `YYYY-MM-DD`
   - `Is_feature`: **omit / leave blank** for PR subtasks — Is_feature is the epic-level marker, only release rows set it (`"0"`)

   Before writing properties, fetch the data source schema. Every `Project` value must exist as a `Project` option. If `epic` is provided, it must exist as an `Epic` option. Add missing options through `notion-update-data-source`, preserving every existing option and color; never replace the option list with only new values. **Color rotation hint**: existing cho_rest_api rc1-4=`red`, rc5=`purple`, rc7=`blue` — pick the next unused color when adding a new option.

4. **Build page content** (markdown body):
   ```
   ## สรุปงาน
   <1-2 sentences from PR body>

   ## สิ่งที่เปลี่ยน
   <bulleted list from PR body Changes section>

   ## Files Changed (<N> ไฟล์, +<additions> -<deletions>)
   <table: path | change type>

   ## การทดสอบ
   <tests summary from PR body>

   ## Deploy / Migration
   <note from PR body or 'ไม่มี'>

   ## Type
   - [x] feat / fix / chore / ...

   merged: <head branch> → <base branch> (<date>)
   PR: <url>
   ```

5. **Create page** via Notion MCP — **clone-and-update** flow, NOT `notion-create-pages`:

   > `notion-create-pages` is unreliable in this environment. The XML harness rejects every shape of `properties` and `parent` with `pages.0.properties.$text: Invalid input, parent: Invalid input`. Skip it. See fallback below.

   **Fallback: clone-and-replace**:

   1. Find any existing Timeline DEV page the integration can edit. Easiest anchor: the same author/series prior PR (e.g. PR #N-1 for same repo, or the most recent row in the data source returned by search):
      ```
      mcp__plugin_Notion_notion__notion-search  query: "#<number-1> <repo>"  query_type: internal  page_size: 5
      ```
      Or search by PR title keywords. Pick any accessible page.
   2. Duplicate it:
      ```
      mcp__plugin_Notion_notion__notion-duplicate-page  page_id: <anchor-page-id>
      ```
      Returns new page ID + URL immediately. **Stale-orphan recovery**: if `notion-update-page` on the returned id errors `Object ... is not a page or database and cannot be updated`, re-duplicate the anchor and use the new id — first duplicate sometimes returns an orphan before properties are committed.
   3. Update the new clone's **properties**:
      ```
      mcp__plugin_Notion_notion__notion-update-page
        page_id: <new-id>
        command: update_properties
        properties: { "Name": "<pr title> (#<number>)", "Status": "Done"|"In progress",
                      "Priority": "High", "Select": "BE - Nat",
                      "Features": "[\"<feature>\"]", "Project": "[\"<feature>\"]",
                      "Epic": "[\"<repo> <tag>\"]", "date:Period:start": "YYYY-MM-DD" }
      ```
      `Features`, `Project`, `Epic` values are JSON array strings per data source SQLite schema. `Epic` is a multi-select array — write `["<repo> <tag>"]`. Omit `Epic` when release membership is unknown. When the page already has Epic values (e.g. duplicated from prior release), **merge** with the new release instead of overwriting.
   4. Replace the **body** with the new PR markdown from step 4:
      ```
      mcp__plugin_Notion_notion__notion-update-page
        page_id: <new-id>
        command: replace_content
        new_str: <full PR markdown>
      ```
   5. **Verify** by fetching:
      ```
      mcp__plugin_Notion_notion__notion-fetch  id: <new-id>
      ```

6. **Return** the created page URL.

## Notes

- Multi-select via JSON array of strings
- `Project` defaults to exact `Features` value until project taxonomy diverges
- `Epic` uses exact `<repo> <tag>` multi-select values (JSON array). Merge with existing Epic array when adding a new release; leave empty instead of guessing release membership
- `Priority` requires the value to be in the schema options list
- Preserve Thai in `Name` and content
- If `dry=true`, print the would-be page and skip creation
- **`Features` is JSON-array-string** in `update_properties`: `Features: "[\"Payment\"]"` per data source SQLite schema
- **Do NOT call `notion-create-pages`** — clone-and-update path is the only reliable flow
- **Default `features`**: pick based on repo — `app_payments` → `Payment`, `cho_rest_api` → `CMCITY`, `cho_redis_*` → etc. Match the most recent prior PR's Features in the same repo
- **Auto Status**: merged → `Done`, open → `In progress`, draft → `Back log`
- **The duplicated anchor page's body must be fully replaced** — `replace_content` overwrites everything; do not call `update_content` with edits, use `replace_content` with `new_str` only
- **`Is_feature` is the epic-level flag, not a per-PR flag** — leave it blank on PR subtasks. Release rows set `Is_feature="0"`. To clear a previously-set value, send `update_properties` with `properties: {}` (empty object) — omitted fields get cleared
- **Register Epic option before writing** — first `notion-update-data-source` with `ALTER COLUMN "Epic" SET MULTI_SELECT(...)` to add `<repo> <tag>` (preserving every existing option + color, pick next unused color), then `update_properties` with `Epic: "[...]"`. Writing an unregistered option throws `validation_error`
- **Color rotation for new Epic options**: cho_rest_api rc1-4=`red`, rc5=`purple`, rc7=`blue` — alternate when adding new tags
- **Stale-orphan duplicate recovery**: `notion-update-page` may fail with `Object <id> is not a page or database` if called immediately after `duplicate-page` on a slow commit. Re-duplicate the anchor and use the new id. The orphan page persists in workspace — clean up via Notion UI if needed

## Example

User: `/notion-pr-task https://github.com/natha-i96/app_payments/pull/130`

Agent:
1. Fetches PR #130 (commit, files, body)
2. Searches Notion for PR #129 (prior) → finds anchor page
3. `duplicate-page` on #129 → new page id
4. `update_properties` on clone → v1.1.25-style metadata: Name=`fix: rename bankAccount ptser to ser... (#130)`, Status=`In progress`, Features=`["Payment"]`
5. `replace_content` on clone → markdown body สรุปงาน + สิ่งที่เปลี่ยน + Files Changed + การทดสอบ + Deploy/Migration + Type
6. Returns `https://app.notion.com/p/<id>`
