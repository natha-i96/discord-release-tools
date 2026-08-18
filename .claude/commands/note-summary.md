---
description: Summarize a plain-text or markdown file (Obsidian daily log, release notes draft, meeting notes). Args: <file-path> [out-file] [max-section-lines=5]
---

Use the `note-summary` skill workflow. Required arguments:

1. `<file-path>` — path to `.md` / `.txt` / `.markdown` file (e.g. `@example.txt`, `01_Daily_Logs/Trairat_DEV/2026/2026-07/Week_of_2026-07-27/2026-07-28.md`). Leading `@` stripped automatically.

Optional:
- `out-file` — write the summary to a markdown file
- `max-section-lines` — cap each breakdown section (default `5`)

The skill will:
1. Read file via `Read` tool
2. Detect format (Obsidian daily log / plain markdown / plain text)
3. Extract TL;DR + per-🔧 / per-`##` breakdown + open items + code/commit refs
4. Render caveman-style summary
5. Optionally write to `out-file` if provided

Example invocation:
```
/note-summary @example.txt
/note-summary 01_Daily_Logs/Trairat_DEV/2026/2026-07/Week_of_2026-07-27/2026-07-28.md
/note-summary @daily_log.md daily_summary.md 8
```
