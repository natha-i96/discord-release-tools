---
name: pr-summary
description: Summarize a GitHub PR into a caveman-style report covering purpose, files changed, tests, deploy notes, and merge state. Use when user provides a PR URL and asks for a summary, recap, or "what does this PR do".
---

# pr-summary

Summarize any GitHub PR into a tight report. Use the GitHub MCP server.

## Inputs

| Arg | Required | Description |
|-----|----------|-------------|
| `prUrl` | yes | GitHub PR URL, e.g. `https://github.com/owner/repo/pull/123` |
| `includeFiles` | no (default `true`) | Include file list with size summary |
| `outFile` | no | Optional markdown path to write summary |

## Workflow

1. **Parse PR URL** — extract `owner`, `repo`, `pullNumber`:
   - Pattern: `https://github.com/{owner}/{repo}/pull/{number}`
   - Use `mcp__plugin_github_github__pull_request_read` with `method=get` to fetch PR metadata
   - Use `mcp__plugin_github_github__pull_request_read` with `method=get_files` to fetch changed files

2. **Build the report** in this exact order:
   - **Summary** (1-2 sentences from PR body `## Summary` section if present)
   - **What's New** — typed changes:
     - `feat` / `fix` / `refactor` / `perf` / `test` / `docs` / `chore` / `ci` from PR body
   - **Files Changed** — count + highlight notable files (top 5 by `additions + deletions`)
   - **Tests** — passing test count from body, new test files, untested changes
   - **Deploy / Migration** — extract from PR body or report `none`
   - **Merge state** — `merged` / `open` / `closed`, branch + base, merge date
   - **PR link** — original URL

3. **Output format** — use caveman-style fragments. Code/PR identifiers verbatim:
   ```
   ## Summary
   <1-2 sentences>

   ## What's New
   - feat: ...
   - fix: ...

   ## Files Changed
   <N> files, +<additions> -<deletions>
   Notable:
   - `path/file.php` (+X -Y)

   ## Tests
   <assertions> passed, 0 failed
   New tests: ...

   ## Deploy / Migration
   <note or 'none'>

   ## Merge
   <branch> → <base> (<date>)
   PR: <url>
   ```

4. **Optional `outFile`** — write the report to the given path using the Write tool.

## Notes

- If PR body missing sections, infer from code but do not fabricate numbers
- Pull request title may include the `feat:`/`fix:` prefix — preserve it
- Preserve Thai / non-ASCII content verbatim

## Example

User: `/pr-summary https://github.com/natha-i96/cho_rest_api/pull/174`

Agent:
1. Fetches PR #174 via GitHub MCP
2. Reads files (13 files, +611 -48)
3. Renders caveman-style summary
