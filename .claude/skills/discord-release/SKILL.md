---
name: discord-release
description: Send a Discord release announcement by summarizing a Notion page (full release notes) and combining it with a GitHub release URL. Use when the user wants to announce a backend service release to Discord and provides a Notion link plus a git release link. Do NOT use for plain Slack/webhook messages unrelated to releases.
---

# discord-release

Send a Discord release announcement. User provides only two URLs: a Notion page with the full release notes, and a GitHub release URL.

## Inputs

| Arg | Required | Description |
|-----|----------|-------------|
| `notionUrl` | yes | Notion page URL with full release content |
| `releaseUrl` | yes | GitHub release notes URL |
| `service`   | no (default `cmcity`) | Service name shown in embed |
| `env`       | no (default `prod`) | Target environment (`prod`/`staging`/`dev`) |
| `version`   | no (auto-extract from releaseUrl or Notion title) | Version tag |
| `webhook`   | no (default `deploys`) | Named webhook from `tools/discord-webhook/webhook.json` |
| `color`     | no (default `ok`) | `ok`/`info`/`warn`/`error` |
| `dry`       | no (default `false`) | Print payload, do not send |

## Workflow

1. **Fetch Notion page** via Notion MCP:
   - Extract page UUID from URL (last 32 hex chars of path, with or without dashes)
   - Call `mcp__plugin_Notion_notion__notion-fetch` with the page ID
   - Read the full page content

2. **Summarize content** — distill into these fields:
   - `summary`: 1-2 sentence overview of the release
   - `highlights`: bullet list of new features/improvements (use `• ` prefix, `\n` separator)
   - `breaking`: breaking changes section, or `none` if absent

3. **Extract metadata**:
   - `version`: from Notion title (e.g. `Service CMCITY v1.3.0-rc1 Release` → `v1.3.0-rc1`) or from GitHub release URL tag (e.g. `/releases/tag/v1.3.0` → `v1.3.0`)
   - `service`: from Notion title or use `service` arg
   - `env`: from `env` arg

4. **Render release template** via existing tool:
   ```bash
   node tools/discord-webhook/send.js release \
     --var service=<service> \
     --var version=<version> \
     --var env=<env> \
     --var summary="<summary>" \
     --var notionUrl=<notionUrl> \
     --var releaseUrl=<releaseUrl> \
     --var commitUrl=<commitUrl-if-known> \
     --var sha=<sha-if-known> \
     --var author=<author-if-known> \
     --var highlights="<highlights>" \
     --var breaking=<breaking> \
     --var color=<color> \
     --webhook <webhook>
   ```

5. **Show preview before sending** — render dry-run first if `dry` is unset, then send.

## Output

- Confirm with user before sending (unless they explicitly say "send it" in the original prompt)
- Print the resolved variables + the final send status

## Example

User: `/discord-release https://www.notion.so/Release-v1-3-0 https://github.com/org/repo/releases/tag/v1.3.0`

Agent:
1. Fetches Notion page → reads content
2. Extracts `service=cmcity`, `version=v1.3.0`, `env=prod`
3. Summarizes:
   - summary: `Checklist snapshot + multi-round inspection review + prepayment API`
   - highlights: `• Checklist snapshot\n• Inspection multi-round\n• Prepayment date API`
   - breaking: `none`
4. Runs:
   ```bash
   node tools/discord-webhook/send.js release \
     --var service=cmcity --var version=v1.3.0 --var env=prod \
     --var summary="Checklist snapshot + multi-round inspection review + prepayment API" \
     --var notionUrl=https://www.notion.so/Release-v1-3-0 \
     --var releaseUrl=https://github.com/org/repo/releases/tag/v1.3.0 \
     --var highlights="• Checklist snapshot\n• Inspection multi-round\n• Prepayment date API" \
     --var breaking=none --var color=ok --webhook deploys
   ```

## Notes

- Notion URL → page ID: take the last segment, strip dashes, format as `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` if 32 hex chars without dashes
- If summary/highlights cannot be extracted, ask the user — do not fabricate
- All summary content must come from the Notion page, not invented
