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
| `select` | no (default `BE - Nat`) | Owner select: `BE - Nat` / `FE - Toto` / `FE - Job` / `UXUI - Fa` |
| `priority` | no (default `High`) | `block` / `High` / `Medium` / `Low` |
| `status` | no (default `Done` if PR merged, else `In progress`) | Status select |
| `dry` | no (default `false`) | Preview only, do not create page |

## Database

- **Data source ID:** `collection://2d3afc80-d0cd-8091-bf9b-000bad33fb21`
- **Schema:** `Name`, `Status`, `Priority`, `Select`, `Features[]`, `Period (start)`

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
   - `Period.start`: PR merged_at date (or created_at if open) in `YYYY-MM-DD`

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

5. **Create page** via Notion MCP:
   ```
   mcp__plugin_Notion_notion__notion-create-pages
   pages: [{properties: {...}, content: "..."}]
   parent: {data_source_id: "2d3afc80-d0cd-8091-bf9b-000bad33fb21"}
   ```

6. **Return** the created page URL.

## Notes

- Multi-select via JSON array of strings
- `Priority` requires the value to be in the schema options list
- Preserve Thai in `Name` and content
- If `dry=true`, print the would-be page and skip creation

## Example

User: `/notion-pr-task https://github.com/natha-i96/cho_rest_api/pull/174`

Agent:
1. Fetches PR #174
2. Builds page props: Name=`feat: request_customers snapshot + admin document-submission flow (#174)`, Features=`[CMCITY]`, Status=`Done`
3. Creates page in Timeline DEV
4. Returns `https://app.notion.com/p/<id>`
