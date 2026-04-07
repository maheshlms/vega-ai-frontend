/**
 * downloadLiveAvatarAvatars.ts
 *
 * Run once (or when LiveAvatar adds new avatars) to cache avatar images locally.
 *
 * Usage:
 *   npx tsx scripts/downloadLiveAvatarAvatars.ts
 *
 * Note: Requires LIVEAVATAR_API_KEY to be set in Frontend/.env file
 *
 * Output:
 *   public/avatars/<avatar_id>.webp      ← cached image (served as /avatars/*.webp)
 *   src/data/avatarManifest.json         ← id → local path mapping used by the form
 *   src/data/avatarUuidMap.json          ← name_id → { uuid, img } for LiveAvatar API
 */

import fs    from 'fs';
import path  from 'path';
import https from 'https';
import http  from 'http';
import 'dotenv/config';

// ─── Config ──────────────────────────────────────────────────────────────────
const LIVEAVATAR_API_KEY =
  process.env.LIVEAVATAR_API_KEY ||
  process.env.VITE_LIVEAVATAR_API_KEY ||
  '';
const OUTPUT_DIR       = path.resolve('public/avatars');
const MANIFEST_PATH    = path.resolve('src/data/avatarManifest.json');
// NEW: UUID map stores { nameId -> { uuid, img } } so AgentCreationForm can
// pass the real LiveAvatar UUID when creating a session token.
const UUID_MAP_PATH    = path.resolve('src/data/avatarUuidMap.json');
const LIVEAVATAR_LIST_URL = 'https://api.liveavatar.com/v1/avatars/public';
const MAX_AVATARS   = 200;
const CONCURRENCY   = 5;
const PAGE_SIZE     = 50;

// ─── Download a single file (follows redirects) ───────────────────────────────
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(); return; }

    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(dest);
    let resolved = false;

    const cleanup = (err?: Error) => {
      if (resolved) return;
      resolved = true;
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      if (err) reject(err); else resolve();
    };

    proto.get(url, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        cleanup(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { resolved = true; file.close(() => resolve()); });
      file.on('error', cleanup);
    }).on('error', cleanup);
  });
}

// ─── Pick the best image URL ─────────────────────────────────────────────────
function pickImageUrl(avatar: Record<string, unknown>): string {
  const candidates = [
    avatar.preview_url,
    avatar.preview_image_url,
    avatar.thumbnail_image_url,
    avatar.headshot_image_url,
    avatar.image_url,
    avatar.thumbnail,
    avatar.preview,
  ];
  for (const c of candidates) {
    if (!c || typeof c !== 'string') continue;
    if (/\.(mp4|webm|mov|avi)(\?|$)/i.test(c)) continue;
    return c;
  }
  return '';
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try { await tasks[i](); } catch { }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

async function fetchAllAvatars(): Promise<Array<Record<string, unknown>>> {
  let allAvatars: Array<Record<string, unknown>> = [];
  let page = 1;

  while (true) {
    const url = `${LIVEAVATAR_LIST_URL}?page=${page}&page_size=${PAGE_SIZE}`;
    const res = await fetch(url, { headers: { 'X-API-KEY': LIVEAVATAR_API_KEY } });
    if (!res.ok) throw new Error(`Failed fetching page ${page}: ${res.status}`);
    const json = await res.json() as any;
    const results = Array.isArray(json?.data?.results) ? json.data.results : [];
    if (!results.length) break;
    allAvatars.push(...results);
    if (!json?.data?.next) break;
    page++;
    if (allAvatars.length >= MAX_AVATARS) break;
  }

  return allAvatars.slice(0, MAX_AVATARS);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!LIVEAVATAR_API_KEY) {
    console.error('❌  LIVEAVATAR_API_KEY is not set in Frontend/.env file.');
    process.exit(1);
  }

  console.log('📡  Fetching avatars from LiveAvatar…');
  const rawAvatars = await fetchAllAvatars();
  console.log(`✅  Got ${rawAvatars.length} avatars`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  // Load existing manifests
  const manifest: Record<string, string> = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try { Object.assign(manifest, JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))); } catch {}
  }

  // NEW: UUID map — keyed by the avatar_id / name string from the API
  // Value: { uuid: string (the real LiveAvatar UUID), img: string (local or CDN path) }
  const uuidMap: Record<string, { uuid: string; img: string }> = {};
  if (fs.existsSync(UUID_MAP_PATH)) {
    try { Object.assign(uuidMap, JSON.parse(fs.readFileSync(UUID_MAP_PATH, 'utf-8'))); } catch {}
  }

  let downloaded = 0, skipped = 0, failed = 0, noUrl = 0;

  const tasks = rawAvatars.map(avatar => async () => {
    // The "name id" is what we use as key in avatarManifest (e.g. Pedro_ProfessionalLook_public)
    const nameId = String(avatar.avatar_id ?? avatar.id ?? avatar.pose_id ?? '').trim();
    if (!nameId) return;

    // NEW: The "uuid" is the actual LiveAvatar session UUID — this is what must be
    // passed to /v1/sessions/token to get the correct avatar video stream.
    // Some APIs return both an avatar_id (name string) and a separate uuid field.
    const uuid = String(
      avatar.uuid ?? avatar.id_uuid ?? avatar.session_id ?? nameId
    ).trim();

    const imgUrl = pickImageUrl(avatar);
    if (!imgUrl) {
      noUrl++;
      console.warn(`⚠️ No image URL for ${nameId}`);
      // Still record UUID even without image
      uuidMap[nameId] = { uuid, img: '' };
      return;
    }

    const extMatch = imgUrl.match(/\.(jpe?g|png|webp|gif|avif)(\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'webp';
    const filename = `${sanitizeId(nameId)}.${ext}`;
    const destPath = path.join(OUTPUT_DIR, filename);
    const pubPath = `/avatars/${filename}`;

    if (fs.existsSync(destPath)) {
      manifest[nameId] = pubPath;
      uuidMap[nameId] = { uuid, img: pubPath };
      skipped++;
      return;
    }

    try {
      await downloadFile(imgUrl, destPath);
      manifest[nameId] = pubPath;
      uuidMap[nameId] = { uuid, img: pubPath };
      downloaded++;
      console.log(`✅ ${nameId} (uuid: ${uuid}) → ${pubPath}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`❌ Failed ${nameId}: ${msg} — using CDN fallback`);
      manifest[nameId] = imgUrl;
      uuidMap[nameId] = { uuid, img: imgUrl };
      failed++;
    }
  });

  console.log(`\n📥 Processing ${rawAvatars.length} avatars (${CONCURRENCY} at a time)…\n`);
  await runWithConcurrency(tasks, CONCURRENCY);

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(UUID_MAP_PATH, JSON.stringify(uuidMap, null, 2));

  const total = downloaded + skipped + failed + noUrl;
  console.log('\n🎉 Done!');
  console.log(`   ✅ Downloaded : ${downloaded}`);
  console.log(`   ⏭️ Skipped    : ${skipped} (already cached)`);
  console.log(`   ❌ Failed     : ${failed}`);
  console.log(`   ⚠️ No URL     : ${noUrl}`);
  console.log(`   📦 Total      : ${total}`);
  console.log(`\n   📄 Manifest  : ${MANIFEST_PATH}`);
  console.log(`   🔑 UUID Map  : ${UUID_MAP_PATH}`);
  console.log(`   📁 Images    : ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});