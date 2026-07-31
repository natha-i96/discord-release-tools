#!/usr/bin/env node
// discord-webhook: send Discord messages via webhook URL with selectable templates.
// No deps. Node 18+ (native fetch).

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m',
};

const TEMPLATES_PATH = path.join(__dirname, 'templates.json');
const WEBHOOK_PATH   = path.join(__dirname, 'webhook.json');

const SEVERITY_COLOR = { info: 3447003, warn: 15105570, error: 15158332, ok: 3066993 };
const PR_STATE_COLOR = { open: 3447003, merged: 16234447, closed: 15158332 };

// ---- arg parsing ----------------------------------------------------------

function parseArgs(argv) {
  const args = {
    template: null,
    webhook: null,
    url: null,
    var: {},
    list: false,
    dry: false,
    help: false,
    version: false,
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h')        args.help = true;
    else if (a === '--list' || a === '-l')    args.list = true;
    else if (a === '--dry' || a === '-n')    args.dry = true;
    else if (a === '--version' || a === '-V') args.version = true;
    else if (a === '--template')              args.template = argv[++i];
    else if (a === '-t')                      args.template = argv[++i];
    else if (a === '--webhook')               args.webhook = argv[++i];
    else if (a === '-w')                      args.webhook = argv[++i];
    else if (a === '--url')                   args.url = argv[++i];
    else if (a.startsWith('--var='))          parseVar(a.slice(6), args.var);
    else if (a === '--var')                   parseVar(argv[++i], args.var);
    else if (a.startsWith('--'))              die(`unknown flag: ${a}`);
    else                                      positional.push(a);
  }
  if (positional.length && !args.template) args.template = positional.shift();
  args.message = positional.join(' ').trim() || null;
  return args;
}

function parseVar(spec, bag) {
  const idx = spec.indexOf('=');
  if (idx < 0) die(`bad --var (need key=value): ${spec}`);
  bag[spec.slice(0, idx)] = spec.slice(idx + 1);
}

// ---- file loading ---------------------------------------------------------

function readJson(p, allowMissing = false) {
  if (!fs.existsSync(p)) {
    if (allowMissing) return null;
    die(`file not found: ${p}`);
  }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { die(`invalid JSON in ${p}: ${e.message}`); }
}

function loadTemplates() { return readJson(TEMPLATES_PATH); }

function loadWebhooks() { return readJson(WEBHOOK_PATH, true) ?? {}; }

// ---- template render ------------------------------------------------------

function resolveColor(value, vars) {
  if (typeof value !== 'string') return value;
  const rendered = renderString(value, vars).trim();
  if (/^\d+$/.test(rendered)) return Number(rendered);
  const k = rendered.toLowerCase();
  if (SEVERITY_COLOR[k] != null) return SEVERITY_COLOR[k];
  if (PR_STATE_COLOR[k] != null)  return PR_STATE_COLOR[k];
  return 0;
}

function lookup(key, vars) {
  if (key in vars) return vars[key];
  if (key === 'isoNow') return new Date().toISOString();
  if (key === 'now')    return new Date().toString();
  return '';
}

function renderString(str, vars) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = lookup(key, vars);
    return v == null ? '' : String(v);
  });
}

function renderNode(node, vars) {
  if (node == null) return node;
  if (typeof node === 'string')  return renderString(node, vars);
  if (typeof node === 'number')  return node;
  if (typeof node === 'boolean') return node;
  if (Array.isArray(node))       return node.map(n => renderNode(n, vars));
  if (typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'color') {
        const rendered = typeof v === 'string' ? renderString(v, vars).trim() : v;
        out[k] = resolveColor(rendered, vars);
      } else {
        out[k] = renderNode(v, vars);
      }
    }
    return out;
  }
  return node;
}

function renderTemplate(tpl, vars) { return renderNode(tpl, vars); }

// ---- webhook resolution ---------------------------------------------------

function resolveUrl(args) {
  if (args.url) return args.url;
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL;
  const map = loadWebhooks();
  const name = args.webhook || 'default';
  if (map[name]) return map[name];
  const known = Object.keys(map).filter(k => !k.startsWith('_')).join(', ');
  die(`webhook "${name}" not found. set DISCORD_WEBHOOK_URL, use --url, or add to webhook.json (known: ${known || 'none'})`);
}

// ---- HTTP -----------------------------------------------------------------

async function postWebhook(url, payload, dry) {
  if (dry) return { dryRun: true, payload };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    die(`webhook ${res.status}: ${text || res.statusText}`);
  }
  return { status: res.status };
}

// ---- output ---------------------------------------------------------------

function printList(templates) {
  console.log(`${C.bold}Templates:${C.reset}`);
  for (const [name, tpl] of Object.entries(templates)) {
    const desc = [];
    if (tpl.content)   desc.push('text');
    if (tpl.embeds)    desc.push(`${tpl.embeds.length} embed`);
    if (tpl.username)  desc.push(`as ${tpl.username}`);
    console.log(`  ${C.cyan}${name.padEnd(12)}${C.reset} ${C.gray}${desc.join(', ')}${C.reset}`);
  }
  console.log(`\n${C.dim}vars: pass --var key=value (repeat). Special: {{isoNow}}, {{now}}${C.reset}`);
}

function printHelp() {
  console.log(`${C.bold}discord-send${C.reset} — send Discord webhook from template

${C.bold}Usage:${C.reset}
  node send.js <template> [message...] [flags]
  node send.js --list
  node send.js --help

${C.bold}Flags:${C.reset}
  -t, --template <name>    template name (or pass as first positional)
  -w, --webhook <name>     named webhook from webhook.json (default: "default")
      --url <url>          override webhook URL directly
      --var k=v             template variable (repeatable). {{isoNow}} and {{now}} auto
  -n, --dry                print payload, do not send
  -l, --list               list available templates
  -h, --help               this help
  -V, --version            version

${C.bold}Webhook resolution:${C.reset}
  1. --url
  2. env DISCORD_WEBHOOK_URL
  3. webhook.json[<--webhook name>]  (default name: "default")

${C.bold}Examples:${C.reset}
  node send.js simple "hello world"
  node send.js alert --var severity=error --var title="DB down" --var service=api --var env=prod --var description="timeout" --var color=error
  node send.js deploy --var service=cmcity --var env=staging --var version=v1.3.0-rc1 --var sha=abc1234 --var author=alice --var notes="checklist snapshot" --webhook deploys
  node send.js simple "ping" --dry`);
}

function die(msg) {
  console.error(`${C.red}error${C.reset}: ${msg}`);
  process.exit(1);
}

// ---- main -----------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  if (args.help)    return printHelp();
  if (args.version) return console.log('discord-webhook 1.0.0');
  if (args.list)    return printList(loadTemplates());

  if (!args.template) die('no template. use --list or --help.');

  const templates = loadTemplates();
  const tpl = templates[args.template];
  if (!tpl) die(`template "${args.template}" not found. available: ${Object.keys(templates).join(', ')}`);

  // simple template: stuff --message (or positional text) into {{message}}
  const vars = { ...args.var };
  if (args.template === 'simple') vars.message = vars.message ?? args.message ?? '';

  const payload = renderTemplate(tpl, vars);

  if (args.dry) {
    console.log(`${C.yellow}[dry-run]${C.reset} ${JSON.stringify(payload, null, 2)}`);
    return;
  }

  const url = resolveUrl(args);
  const res = await postWebhook(url, payload, false);
  console.log(`${C.green}sent${C.reset} template=${C.cyan}${args.template}${C.reset} status=${res.status}`);
}

main().catch(e => die(e.stack || e.message));
