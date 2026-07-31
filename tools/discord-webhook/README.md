# discord-webhook

CLI ส่งข้อความ Discord ผ่าน webhook พร้อมเลือก template ได้ ไม่พึ่ง dependency ภายนอก (Node 18+)

## โครงสร้าง

```
tools/discord-webhook/
├── send.js               # main script (CLI)
├── templates.json        # templates ทั้งหมด
├── webhook.json          # URLs ตามชื่อ (gitignored)
├── webhook.json.example  # template สำหรับ webhook.json
└── package.json
```

## ติดตั้ง

ไม่ต้อง `npm install` ใช้ `fetch` ในตัว Node 18+

```bash
cp webhook.json.example webhook.json
# แก้ไฟล์ webhook.json ใส่ URL จริง
```

## ใช้งาน

```bash
# ดู template ทั้งหมด
node send.js --list

# ดู help
node send.js --help

# ส่งข้อความ
node send.js simple "hello world"

# ส่ง alert พร้อมตัวแปร
node send.js alert \
  --var severity=error \
  --var title="DB down" \
  --var service=api \
  --var env=prod \
  --var description="timeout spike" \
  --var color=error

# ส่ง deploy
node send.js deploy \
  --var service=cmcity \
  --var env=staging \
  --var version=v1.3.0-rc1 \
  --var sha=abc1234 \
  --var author=alice \
  --var notes="checklist snapshot" \
  --webhook deploys

# ส่ง PR notification
node send.js pr \
  --var number=42 \
  --var state=open \
  --var title="Add checklist" \
  --var url=https://github.com/org/repo/pull/42 \
  --var author=alice \
  --var repo=org/repo \
  --var base=main \
  --var head=feat/checklist \
  --var color=open

# Dry-run (ไม่ส่งจริง ดู payload JSON)
node send.js simple "ping" --dry
```

## ตัวแปรพิเศษ (auto-render)

- `{{isoNow}}` — ISO 8601 timestamp ปัจจุบัน
- `{{now}}` — Date.toString()

## ตัวแปร color

ใช้ชื่อแทนตัวเลขได้:

| Key (severity) | Decimal | Hex      |
|----------------|---------|----------|
| `info`         | 3447003 | `#3b9bff`|
| `ok`           | 3066993 | `#2ecc71`|
| `warn`         | 15105570| `#e67e22`|
| `error`        | 15158332| `#e74c3c`|

| Key (pr state) | Decimal  | Hex      |
|----------------|----------|----------|
| `open`         | 3447003  | `#3b9bff`|
| `merged`       | 16234447 | `#f7c948`|
| `closed`       | 15158332 | `#e74c3c`|

หรือใส่ตัวเลข decimal ตรงๆ: `--var color=15105570`

## Webhook URL resolution

ลำดับการหา URL:

1. `--url <url>` (override ตรง)
2. env `DISCORD_WEBHOOK_URL`
3. `webhook.json[name]` ตาม `--webhook <name>` (default: `default`)

## เพิ่ม template ใหม่

แก้ `templates.json` ใช้ `{{varName}}` แทนค่าที่จะแทนที่:

```json
{
  "myTemplate": {
    "content": "**{{title}}**",
    "embeds": [{
      "title": "{{title}}",
      "description": "{{body}}",
      "color": "{{color}}",
      "timestamp": "{{isoNow}}"
    }]
  }
}
```

แล้วเรียก: `node send.js myTemplate --var title="..." --var body="..." --var color=info`

## npm scripts

```bash
npm run send -- simple "hello"
npm run list
npm run help
```

## Security

- `webhook.json` gitignored — ห้าม commit URL จริง
- ใช้ `webhook.json.example` สำหรับ template เท่านั้น
