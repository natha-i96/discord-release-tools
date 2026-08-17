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
| `project` | no (default same as `features`) | Multi-select project tags; keep aligned with `Features` for now |
| `epic` | no (default `<repo> <tag>`) | Shared Epic assigned to release row and every confirmed PR row (multi-select — appends to existing Epic arrays) |
| `select` | no (default `BE - Nat`) | Owner select |
| `priority` | no (default `High`) | `block` / `High` / `Medium` / `Low` |
| `status` | no (default `Done`) | Status |
| `dry` | no (default `false`) | Preview only |

## Database

- **Data source ID:** `collection://2d3afc80-d0cd-8091-bf9b-000bad33fb21`
- **Schema:** `Name`, `Status`, `Priority`, `Select`, `Features[]`, `Project[]`, `Epic`, `Period (start)`

## Workflow

1. **Parse release URL** — extract `owner`, `repo`, `tag`:
   - `https://github.com/{owner}/{repo}/releases/tag/{tag}`

2. **Fetch release body** via GitHub MCP:
   - `mcp__plugin_github_github__get_release_by_tag` with `{owner, repo, tag}` → markdown body

3. **Extract PR list** from body:
   - Find PR table in `## PRs Included` or `## Pull requests` section
   - Parse `#NNN` numbers
   - For each PR, find existing page via Notion **search** (preferred) or **fetch** GitHub PR list:
     ```
     mcp__plugin_Notion_notion__notion-search  query: "#NNN <repo>"  query_type: internal  page_size: 5
     ```
     Pick page whose title = `fix|feat|chore: ... (#NNN)` matching the PR.

     **Avoid `notion-query-data-sources`** — in some environments the harness rejects `data` object shape with `data: Invalid input`. Fall back to search.

4. **Build page properties**:
   - `Name`: `release: <repo> <tag> — <short summary from release body>`
   - `Status`: from `status` arg (default `Staging` for new RC, `Done` for production-tagged releases)
   - `Priority`: from `priority` arg
   - `Select`: from `select` arg
   - `Features`: from `features` arg
   - `Project`: from `project` arg; default to exact `Features` value
   - `Epic`: from `epic` arg; default to exact `<repo> <tag>` value. Multi-select — write JSON-array string. Release row uses `["<repo> <tag>"]`; PR rows must **merge** with their existing Epic array (append new value, dedupe, never overwrite)
   - `Period.start`: release `published_at` date in `YYYY-MM-DD`
   - `Is_feature`: `"0"` on the release row — marks the epic-level flag

   Before writing properties, fetch the data source schema. Every `Project` value must exist as a `Project` option, and the release Epic must exist as an `Epic` option. Add missing options through `notion-update-data-source`, preserving every existing option and color; never replace the option list with only new values. **Color rotation hint**: existing cho_rest_api rc1-4=`red`, rc5=`purple`, rc7=`blue` — pick the next unused color when adding a new option.

   After finding each confirmed PR page in step 3, **merge** `<repo> <tag>` into its existing `Epic` array (read current Epic, append if absent, write dedup array). Set `Project` from that row's current `Features`. Do not infer or update unrelated pages. If a PR already belongs to other releases, all of those Epic values are preserved.

5. **Build page content** — order matters. PR references go **last**, named `## Pull requests`:
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

   ## Migration Notes
   <list from release body>

   ## Deployment Checklist
   <powershell commands from release body>

   ## Rollback
   <powershell commands from release body>

   ## GitHub Release
   <release url>

   ## Pull requests
   - #NNN [<title>](<pr url>) → [Notion](<notion page url>)
   - #NNN [<title>](<pr url>) (no Notion page)
   ```

   **PR-reference footer rules**:
   - Section heading MUST be `## Pull requests` (matches other release pages in Timeline DEV)
   - It is the **last section** — place GitHub Release URL **before** it
   - Each line: `- #NNN [title](pr-url) → [Notion](notion-url)` when the PR row exists in Timeline DEV
   - When no Notion page exists for the PR: `- #NNN [title](pr-url) (no Notion page)` — never fabricate links
   - Sort by PR number ascending
   - Group label-style (`## Pull requests`) not table — to match sibling release pages

6. **Create page** via Notion MCP — preferred path is **duplicate + update**, NOT `notion-create-pages`:

   > `notion-create-pages` is unreliable in this environment. The XML harness rejects every shape of `properties` and `parent` with `pages.0.properties.$text: Invalid input, parent: Invalid input`. Skip it. See **Fallback: clone-and-replace** below.

   **Fallback: clone-and-replace** (works reliably):

   1. Find a recent release page in Timeline DEV that the integration can edit (any page returned by `notion-search` for "release: app_payments" or similar — e.g. the prior release `v1.1.24`):
      ```
      mcp__plugin_Notion_notion__notion-search  query: "release: <repo> v<prev-major-or-prior>"  query_type: internal  page_size: 5
      ```
   2. Duplicate it (returns new page ID + URL immediately):
      ```
      mcp__plugin_Notion_notion__notion-duplicate-page  page_id: <prior-release-id>
      ```
      **Stale-orphan recovery**: if `notion-update-page` on the returned id errors `Object ... is not a page or database and cannot be updated`, re-duplicate the anchor and use the new id — first duplicate sometimes returns an orphan before properties are committed.
   3. Update the new clone's **properties** to release values:
      ```
      mcp__plugin_Notion_notion__notion-update-page
        page_id: <new-id>
        command: update_properties
        properties: { "Name": "...", "Status": "Staging", "Priority": "High",
                      "Select": "BE - Nat", "Features": "[\"Payment\"]",
                      "Project": "[\"Payment\"]", "Epic": "[\"app_payments v1.1.25\"]",
                      "Is_feature": "0",
                      "date:Period:start": "YYYY-MM-DD" }
      ```
      Note: `Features`, `Project`, `Epic` are JSON array strings per SQLite schema; multi-select values quoted inside. `Epic` is a multi-select — release row uses `["<repo> <tag>"]`. `Is_feature="0"` on release row only; leave blank on PR subtasks.
   4. Replace the **body** with the new release markdown:
      ```
      mcp__plugin_Notion_notion__notion-update-page
        page_id: <new-id>
        command: replace_content
        new_str: <full v1.1.25 release markdown>
      ```
      `replace_content` overwrites everything. Body content from step 5 stays; no leftover from the cloned page.

   **Verify** by fetching the new page:
   ```
   mcp__plugin_Notion_notion__notion-fetch  id: <new-id>
   ```

7. **Return** the page URL.

## Notes

- PRs with no Notion page are listed as `(no Notion page)` — do not fabricate
- `Project` defaults to exact `Features` value until project taxonomy diverges
- `Epic` uses exact `<repo> <tag>` multi-select values (JSON array). Release row written as `["<repo> <tag>"]`. PR rows merge new release into existing array — never overwrite
- Update only confirmed PR pages listed by the release; never infer membership from date proximity alone
- Preserve Thai content from release body
- Use `published_at` date for Period; fall back to `created_at` if missing
- If `dry=true`, preview only
- **`Features` value is JSON-array-string**: `Features: "[\"Payment\"]"` per data source SQLite schema — even when passing via `update_properties`
- **Default `features` for `app_payments` series is `Payment`**, not `CMCITY` — match the most recent prior release's Features to stay consistent in Timeline DEV views
- **Do NOT call `notion-create-pages`** — use `duplicate-page` + `update-page` (see step 6)
- **`notion-update-page` on PR pages may return 404** if the integration lacks access to the PR row. Skip the link step or use search to verify access first
- **Mutation cleanup**: if you ever temporarily updated a wrong page's title/properties as a side effect (test call, recovery attempt), restore it from the original data in this session's earlier `notion-fetch` output before continuing
- **`Is_feature="0"` only on release rows** — PR subtasks leave blank. Sending `properties: {}` clears previously-set fields
- **Register Epic option first**: `notion-update-data-source` with `ALTER COLUMN "Epic" SET MULTI_SELECT(...)` to add `<repo> <tag>` before any release PR/footer work. Throw `validation_error` if option missing
- **Color rotation for new Epic options**: cho_rest_api rc1-4=`red`, rc5=`purple`, rc7=`blue` — alternate when adding new tags
- **Stale-orphan duplicate recovery**: first `duplicate-page` sometimes returns an id that fails `update_properties` with `Object ... is not a page or database`. Re-duplicate and use the new id. Orphan stays in workspace — clean up via Notion UI

## Example

User: `/notion-release https://github.com/natha-i96/app_payments/releases/tag/v1.1.25`

Agent:
1. Fetches release v1.1.25 → 1 PR (#130)
2. Searches Notion for each PR's page → finds #130 row
3. Searches Notion for prior release `app_payments v1.1.24` → finds clone source
4. `duplicate-page` on v1.1.24 → new page id
5. `update_properties` on clone → v1.1.25 metadata
6. `replace_content` on clone → v1.1.25 release body
7. Returns page URL
