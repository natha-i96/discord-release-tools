---
name: notion-release
description: Create a Timeline DEV release task page from a GitHub release tag. The page links to all PR Notion pages that already exist in Timeline DEV. Use when announcing a release — combines GitHub release notes with Notion PR entries.
---

# notion-release

Create a release task page in the **Timeline DEV** database for a GitHub release tag.

## Inputs

| Arg | Required | Description |
|-----|----------|-------------|
| `releaseUrl` | yes | GitHub release URL, e.g. `https://github.com/owner/repo/releases/tag/v1.3.0-rc3` |
| `features` | yes (default `CMCITY`) | Multi-select tags |
| `select` | no (default `BE - Nat`) | Owner select |
| `priority` | no (default `High`) | `block` / `High` / `Medium` / `Low` |
| `status` | no (default `Done`) | Status |
| `dry` | no (default `false`) | Preview only |

## Database

- **Data source ID:** `collection://2d3afc80-d0cd-8091-bf9b-000bad33fb21`
- **Schema:** `Name`, `Status`, `Priority`, `Select`, `Features[]`, `Period (start)`

## Workflow

1. **Parse release URL** — extract `owner`, `repo`, `tag`:
   - `https://github.com/{owner}/{repo}/releases/tag/{tag}`

2. **Fetch release body** via GitHub MCP:
   - `mcp__plugin_github_github__get_release_by_tag` with `{owner, repo, tag}` → markdown body

3. **Extract PR list** from body:
   - Find PR table in `## PRs Included` or `## Pull requests` section
   - Parse `#NNN` numbers
   - For each PR, query Notion to find existing pages:
     ```
     mcp__plugin_Notion_notion__notion-query-data-sources
     data_source_url: "collection://2d3afc80-d0cd-8091-bf9b-000bad33fb21"
     query: SELECT url, "Name" FROM "collection://..." WHERE "Name" LIKE '%#NNN%'
     ```

4. **Build page properties**:
   - `Name`: `release: <repo> <tag> — <short summary from release body>`
   - `Status`: from `status` arg
   - `Priority`: from `priority` arg
   - `Select`: from `select` arg
   - `Features`: from `features` arg
   - `Period.start`: release `published_at` date in `YYYY-MM-DD`

5. **Build page content**:
   ```
   ## สรุปงาน
   Release <tag> — <staging image> — <published date>
   - Previous tag: <prev>
   - <1-line summary>

   ## What's New
   ### Features
   - <list from release body>
   ### Fixes
   - <list from release body>

   ## Endpoints / Interface Changes
   <table from release body>

   ## Files Changed
   <highlights from release body>

   ## Pull requests
   - #NNN [<title>](<pr url>) → [Notion](<notion page url>)
   - #NNN [<title>](<pr url>) (no Notion page)

   ## Migration Notes
   <list from release body>

   ## Deployment Checklist
   <powershell commands from release body>

   ## Rollback
   <powershell commands from release body>

   ## GitHub Release
   <release url>
   ```

6. **Create page** via Notion MCP:
   ```
   mcp__plugin_Notion_notion__notion-create-pages
   pages: [{properties: {...}, content: "..."}]
   parent: {data_source_id: "2d3afc80-d0cd-8091-bf9b-000bad33fb21"}
   ```

7. **Return** the page URL.

## Notes

- PRs with no Notion page are listed as `(no Notion page)` — do not fabricate
- Preserve Thai content from release body
- Use `published_at` date for Period; fall back to `created_at` if missing
- If `dry=true`, preview only

## Example

User: `/notion-release https://github.com/natha-i96/cho_rest_api/releases/tag/v1.3.0-rc3`

Agent:
1. Fetches release v1.3.0-rc3 → 4 PRs (175, 176, 178, 179)
2. Queries Notion for each PR's page
3. Builds release page with links to all 4 PR Notion pages
4. Returns page URL
