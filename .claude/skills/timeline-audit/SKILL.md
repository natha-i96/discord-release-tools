---
name: timeline-audit
description: Audit which GitHub PRs in a list exist in Notion Timeline DEV. Use when the user wants to know which PRs in a repo or release have not yet been tracked in Notion. Combines GitHub PR list with Notion Timeline DEV search.
---

# timeline-audit

Compare a list of GitHub PR numbers against Notion Timeline DEV. Report which PRs already have a task page and which are missing.

## Inputs

| Arg | Required | Description |
|-----|----------|-------------|
| `prs` | yes | Comma-separated PR numbers, e.g. `121,122,125,126,127,128` |
| `repo` | yes | `owner/repo` to fetch PR metadata |
| `features` | no | Filter Notion pages by Features tag (e.g. `CMCITY`) |
| `outFile` | no | Optional markdown path to write audit report |

## Workflow

1. **Parse PR list** — split `prs` arg into array of numbers.

2. **Fetch PR metadata** (parallel, batched) via GitHub MCP:
   - For each PR, call `mcp__plugin_github_github__pull_request_read` with `method=get`
   - Capture: `number`, `title`, `state`, `merged`, `merged_at`, `html_url`

3. **Query Notion** for matching pages:
   ```
   mcp__plugin_Notion_notion__notion-query-data-sources
   data_source_url: "collection://2d3afc80-d0cd-8091-bf9b-000bad33fb21"
   query: SELECT url, "Name" FROM "collection://..." WHERE "Name" LIKE '%#<n>%'
   ```
   Run once per PR number OR build a combined OR-query for efficiency.

4. **Build the matrix**:
   - For each PR, mark `in_notion: true/false`
   - Capture Notion page URL if present

5. **Render table**:
   ```
   | PR | Title | Status (GitHub) | Notion |
   |----|-------|-----------------|--------|
   | #121 | feat: ... | merged 2026-08-03 | [link](url) |
   | #125 | feat: ... | merged 2026-08-01 | (missing) |
   ```

6. **Summary line**:
   - `X/Y PRs already in Notion`
   - List missing PRs

7. **Optional `outFile`** — write the audit report using the Write tool.

## Output

- Markdown table with PR, title, GitHub status, Notion link
- "Missing" highlighted for PRs with no Notion page
- Optional follow-up: ask user to create missing pages via `notion-pr-task` skill

## Notes

- Merge state shown as `merged YYYY-MM-DD` / `open` / `closed`
- Notion URL only included if a matching page is found
- If `features` filter specified, only count pages with that Features tag

## Example

User: `/timeline-audit 121,122,125,126,127,128 natha-i96/app_payments`

Agent:
1. Fetches 6 PRs in parallel
2. Queries Notion for `#121`-`#128`
3. Returns:
   ```
   | PR | Title | Status | Notion |
   |----|-------|--------|--------|
   | #121 | feat: expose customer_data | merged 2026-08-03 | [link] |
   | #122 | feat: add change_by | merged 2026-08-03 | [link] |
   | #125 | feat: add has_slip | merged 2026-08-01 | [link] |
   | #126 | fix: isolate Docker | merged 2026-08-01 | [link] |
   | #127 | feat: filter customer_data | merged 2026-08-01 | [link] |
   | #128 | feat: expose expiry | merged 2026-08-03 | [link] |

   6/6 PRs already in Notion
   ```
