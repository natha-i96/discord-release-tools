---
description: Summarize a GitHub PR into a tight report. Args: <pr-url> [out-file]
---

Use the `pr-summary` skill workflow. Required arguments:

1. `<pr-url>` — GitHub PR URL (e.g. `https://github.com/owner/repo/pull/123`)

Optional: `out-file` to write the summary to a markdown file.

The skill will:
1. Fetch PR metadata via `mcp__plugin_github_github__pull_request_read` (method=`get`)
2. Fetch changed files via `mcp__plugin_github_github__pull_request_read` (method=`get_files`)
3. Render caveman-style summary: summary, what's new, files changed, tests, deploy, merge state
4. Optionally write to `out-file` if provided

Example invocation:
```
/pr-summary https://github.com/natha-i96/cho_rest_api/pull/174
/pr-summary https://github.com/natha-i96/app_payments/pull/129 release_summary.md
```
