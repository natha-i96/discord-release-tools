---
description: Send a Discord release announcement. Args: <notion-url> <release-url> [service] [env] [version] [webhook]
---

Use the `discord-release` skill workflow. Required arguments:

1. `<notion-url>` — Notion page URL containing full release notes
2. `<release-url>` — GitHub release notes URL

Optional: `service`, `env`, `version`, `webhook`, `color`, `dry`.

The skill will:
1. Fetch the Notion page via `mcp__plugin_Notion_notion__notion-fetch`
2. Summarize into `summary` / `highlights` / `breaking`
3. Extract `version` from Notion title or release URL
4. Render the `release` template via `tools/discord-webhook/send.js release`
5. Show preview then send

After the command runs, report the resolved variables and the final send status (e.g. `status=204`).

Example invocation:
```
/discord-release https://www.notion.so/Release-v1-3-0-abc https://github.com/org/repo/releases/tag/v1.3.0
```
