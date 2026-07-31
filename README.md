# Release Tools — Discord Webhook + Notion Summarizer

ชุดเครื่องมือส่ง release announcement ไป Discord โดยดึงเนื้อหาจาก Notion (full notes) + GitHub release URL มาสรุปอัตโนมัติ

ประกอบด้วย 3 ส่วน:

1. **`tools/discord-webhook/`** — Node.js CLI ส่ง Discord webhook (เลือก template ได้)
2. **`.claude/skills/discord-release/`** — Skill สำหรับ Claude Code (fetch Notion → summarize → ส่ง)
3. **`.claude/commands/discord-release.md`** — Slash command `/discord-release`

---

## Prerequisites

- **Node.js ≥ 18** (ใช้ `fetch` ในตัว)
- **Claude Code** (สำหรับ skill + slash command)
- **Discord webhook URL** — สร้างจาก Server Settings → Integrations → Webhooks
- **Notion integration** (optional, สำหรับใช้ slash command) — ต้อง share page ที่จะ fetch ให้ integration

---

## Install (ครั้งแรก)

### 1. Clone repo + ใส่ webhook URL

```bash
git clone <this-repo-url>
cd <repo>

# copy webhook config + ใส่ URL จริง
cp tools/discord-webhook/webhook.json.example tools/discord-webhook/webhook.json
# แก้ tools/discord-webhook/webhook.json ใส่ URL จริงของแต่ละ channel
```

`webhook.json` format:

```json
{
  "default": "https://discord.com/api/webhooks/xxx/yyy",
  "deploys":  "https://discord.com/api/webhooks/xxx/yyy",
  "alerts":   "https://discord.com/api/webhooks/xxx/yyy"
}
```

### 2. Verify CLI ใช้งานได้

```bash
node tools/discord-webhook/send.js --help
node tools/discord-webhook/send.js --list
node tools/discord-webhook/send.js simple "hello" --dry
```

### 3. Verify slash command ใช้งานได้

ใน Claude Code:

```
/discord-release https://www.notion.so/page-url https://github.com/org/repo/releases/tag/v1.0.0 dry
```

ถ้าเห็น payload preview แสดงว่า flow ทำงาน

---

## Reinstall (เครื่องใหม่ / clone ใหม่)

### แบบ A — fresh clone

```bash
git clone <this-repo-url>
cd <repo>
cp tools/discord-webhook/webhook.json.example tools/discord-webhook/webhook.json
# ใส่ webhook URL
```

### แบบ B — pull ใหม่บนเครื่องเดิม

```bash
cd <repo>
git pull
# webhook.json ไม่ถูกแตะ (gitignored) — ไม่ต้องใส่ URL ใหม่
```

### แบบ C — copy แค่ tool ไป repo อื่น

ถ้าจะใช้ใน project อื่น:

```bash
# ใน repo ต้นทาง
git archive --format=tar --output=tools.tar \
  tools/discord-webhook/ \
  .claude/skills/discord-release/ \
  .claude/commands/discord-release.md

# ใน repo ปลายทาง
tar -xf tools.tar -C /path/to/target-repo
```

แล้วสร้าง `tools/discord-webhook/webhook.json` ใหม่ (copy `.example`)

---

## Verify หลัง install

### CLI

```bash
# list templates
node tools/discord-webhook/send.js --list
# คาดหวัง: simple, info, alert, deploy, pr, release

# dry-run release
node tools/discord-webhook/send.js release \
  --var service=test --var version=v0.0.1 --var env=dev \
  --var summary="smoke test" --var notionUrl=https://example.com \
  --var releaseUrl=https://github.com/x/y/releases/tag/v0.0.1 \
  --var highlights="• test" --var breaking=none --var color=info \
  --dry
# คาดหวัง: พิมพ์ JSON payload, ไม่ error

# send จริง
node tools/discord-webhook/send.js simple "install ok" --webhook default
# คาดหวัง: status=204
```

### Slash command

ใน Claude Code:

```
/discord-release <notion-url> <github-release-url> dry
```

คาดหวัง: Notion fetched → summarized → payload preview → ไม่ส่ง

---

## Templates ที่มี

| Name | ใช้สำหรับ |
|---|---|
| `simple` | ข้อความ plain |
| `info` | embed ข่าวสาร |
| `alert` | แจ้งเตือน severity พร้อม fields |
| `deploy` | deploy notification |
| `pr` | GitHub PR notification |
| `release` | release announcement (Notion + GitHub release) |

เพิ่ม template ใหม่: แก้ `tools/discord-webhook/templates.json` ใช้ `{{var}}` แทนค่า

---

## Webhook URL resolution

ลำดับการหา URL:

1. `--url <url>` (override ตรง)
2. env `DISCORD_WEBHOOK_URL`
3. `webhook.json[<--webhook name>]` (default: `default`)

---

## Troubleshooting

### `Cannot find module ... send.js`

รันจาก root ของ repo หรือใช้ path เต็ม:

```bash
# ผิด
node send.js simple "x"   # ไม่เจอ send.js

# ถูก
node tools/discord-webhook/send.js simple "x"
```

### `webhook "X" not found`

- เช็คว่า key มีใน `webhook.json` (ไม่ใช่ `.example`)
- เช็ค value ไม่ใช่ empty string (`""`)
- ลอง env var: `DISCORD_WEBHOOK_URL=... node ...`

### Slash command ไม่ขึ้น

1. รัน `/reload-skills` ใน Claude Code
2. เช็ค `.claude/commands/discord-release.md` มี frontmatter `description:`
3. เช็ค `.claude/skills/discord-release/SKILL.md` มี frontmatter `name:` + `description:`

### Notion fetch ไม่ได้

- เช็คว่า Notion page share ให้ integration แล้ว (Share → Add connection)
- เช็ค URL ต้องเป็น public page หรือ share กับ integration ที่ Claude Code ใช้

---

## File map

```
.
├── tools/discord-webhook/
│   ├── send.js               # CLI (Node 18+, no deps)
│   ├── templates.json        # Discord message templates
│   ├── webhook.json          # URLs (gitignored)
│   ├── webhook.json.example  # template สำหรับ webhook.json
│   ├── package.json
│   └── README.md             # usage guide
├── .claude/
│   ├── skills/discord-release/
│   │   └── SKILL.md          # Claude Code skill
│   └── commands/
│       └── discord-release.md # /discord-release slash command
└── README.md                 # ← this file
```

---

## Security

- **`webhook.json` gitignored** — ห้าม commit URL จริง
- ใช้ `webhook.json.example` สำหรับ template เท่านั้น
- ถ้า URL หลุด commit ไปแล้ว → **revoke ทันที** ใน Discord (Server Settings → Integrations → Webhooks → regenerate) แล้วใส่ใหม่
