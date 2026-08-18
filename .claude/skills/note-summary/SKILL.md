---
name: note-summary
description: Summarize a plain-text or markdown file (e.g. Obsidian daily log, release notes draft, meeting notes) into a caveman-style report. Use when input is a file path like `@example.txt` or `01_Daily_Logs/.../2026-07-28.md` — not a GitHub PR.
---

# note-summary

Summarize a local text or markdown file into a tight report. File-path input, no GitHub fetch.

## Inputs

| Arg | Required | Description |
|-----|----------|-------------|
| `filePath` | yes | Path to `.md`, `.txt`, or `.markdown` file (e.g. `@example.txt`, `01_Daily_Logs/.../2026-07-28.md`) |
| `outFile` | no | Optional markdown path to write summary |
| `maxSectionLines` | no (default `5`) | Cap each breakdown section to N lines |
| `preserveFileLocation` | no (default `true`) | Echo the `<!-- File location -->` HTML comment if present |

## Workflow

1. **Parse file path** — strip leading `@` if present, resolve relative to working dir. Use `Read` tool.

2. **Detect format**:
   - **Obsidian daily log** — top `<!-- File location -->` comment + `## ⚡ สรุปวันนี้ / Today Summary` + nested `> [!abstract]+ ...` callout blocks + per-project `**🔧 <repo>**` sections
   - **Plain markdown** — top-level `##` / `###` headings, bullets, code blocks
   - **Plain text** — fallback: bullet-by-line or paragraph-by-paragraph chunking

3. **Extract sections**:
   - **File location** (if comment present)
   - **TL;DR** — first callout block under summary heading, or first 3-5 bullets of first content section
   - **Per-🔧 / per-`##` breakdown** — each project or top-level section becomes its own block; trim to `maxSectionLines` bullets, preserve `code/commit/file path` lines verbatim
   - **Open items / next steps** — bullets containing `ยังไม่`, `TODO`, `next`, `still`, `pending`, `❌`, `⚠`, or trailing "..." 
   - **Code / commit / file refs** — collect inline `commit <hash>`, file paths, command snippets into a separate quick-scan list

4. **Render caveman-style report**:
   ```
   ## TL;DR
   <3-5 fragment lines, no fluff>

   ## File Location
   <echo the HTML comment if preserved>

   ## Breakdown
   ### <🔧 repo or ## heading>
   <trimmed bullets, code/file lines verbatim>

   ### <next � or ## heading>
   ...

   ## Open Items
   - <incomplete/TODO/next bullets verbatim>

   ## Refs
   - commit `<hash>` — <context>
   - `<file/path>` — <context>
   ```

5. **Optional `outFile`** — write the report via `Write` tool.

## Notes

- Preserve Thai / non-ASCII verbatim
- Preserve `�` `⚡` `❌` `⚠` `>` markdown markers as written — they carry meaning in Obsidian logs
- Don't fabricate sections — if no `🔧` breakdown, output single TL;DR + Open Items
- Inline code spans (`` `commit 2379b9f` ``, `` `payment_intents_v2` ``, file paths) stay verbatim
- If `outFile` exists, confirm before overwrite (AskUserQuestion not needed for new files — Write replaces silently only on existing files; safe to Write to fresh path)

## Example

User: `/note-summary @example.txt`

Agent:
1. Reads `example.txt`
2. Detects Obsidian daily log (file-location comment + `⚡ สรุปวันนี้` + 3x `🔧 repo` callouts)
3. Renders caveman summary grouped by `🔧` repo + Open Items + commit refs
