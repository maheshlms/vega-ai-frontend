/**
 * downloadHeyGenAvatars.ts
 *
 * Run once (or when HeyGen adds new avatars) to cache avatar images locally.
 *
 * Usage (Windows):
 *   set VITE_HEYGEN_API_KEY=your_key && npx tsx scripts/downloadHeyGenAvatars.ts
 *
 * Usage (Mac/Linux):
 *   VITE_HEYGEN_API_KEY=your_key npx tsx scripts/downloadHeyGenAvatars.ts
 *
 * Output:
 *   public/avatars/<avatar_id>.webp  ← cached image (served as /avatars/*.webp)
 *   src/data/avatarManifest.json     ← id → local path mapping used by the form
 */

import fs    from 'fs';
import path  from 'path';
import https from 'https';
import http  from 'http';

// ─── Config ──────────────────────────────────────────────────────────────────
const HEYGEN_API_KEY  = process.env.VITE_HEYGEN_API_KEY ?? '';
const OUTPUT_DIR      = path.resolve('public/avatars');
const MANIFEST_PATH   = path.resolve('src/data/avatarManifest.json');
const HEYGEN_LIST_URL = 'https://api.heygen.com/v1/streaming/avatar.list';
const MAX_AVATARS     = 200; // safely covers all avatars
const CONCURRENCY     = 5;   // parallel downloads

// ─── Download a single file (follows redirects) ───────────────────────────────
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(); return; } // skip if already cached

    const proto  = url.startsWith('https') ? https : http;
    const file   = fs.createWriteStream(dest);
    let resolved = false;

    const cleanup = (err?: Error) => {
      if (resolved) return;
      resolved = true;
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      if (err) reject(err); else resolve();
    };

    proto.get(url, res => {
      // Follow redirects (301/302/307/308)
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

// ─── Pick the best image URL from a HeyGen avatar object ─────────────────────
function pickImageUrl(avatar: Record<string, unknown>): string {
  const candidates = [
    avatar.normal_preview,       // ✅ confirmed field name from HeyGen API
    avatar.preview_image_url,
    avatar.thumbnail_image_url,
    avatar.headshot_image_url,
    avatar.image_url,
    avatar.thumbnail,
    avatar.preview,
  ];

  for (const c of candidates) {
    if (!c || typeof c !== 'string') continue;
    // Accept image formats: jpg, jpeg, png, webp, gif, avif
    // Reject video formats: mp4, webm, mov, avi
    if (/\.(mp4|webm|mov|avi)(\?|$)/i.test(c)) continue;
    return c;
  }
  return '';
}

// ─── Sanitize avatar ID for use as a filename ─────────────────────────────────
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

// ─── Run tasks with limited concurrency ───────────────────────────────────────
async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  concurrency: number,
): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try { await tasks[i](); } catch { /* errors already logged inside task */ }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!HEYGEN_API_KEY) {
    console.error('❌  VITE_HEYGEN_API_KEY is not set.');
    console.error('    Windows : set VITE_HEYGEN_API_KEY=your_key && npx tsx scripts/downloadHeyGenAvatars.ts');
    console.error('    Mac/Linux: VITE_HEYGEN_API_KEY=your_key npx tsx scripts/downloadHeyGenAvatars.ts');
    process.exit(1);
  }

  // 1. Fetch avatar list
  console.log('📡  Fetching avatar list from HeyGen…');
  const listRes = await fetch(HEYGEN_LIST_URL, {
    headers: { 'x-api-key': HEYGEN_API_KEY },
  });

  if (!listRes.ok) {
    console.error(`❌  HeyGen API returned HTTP ${listRes.status}`);
    process.exit(1);
  }

  const data = await listRes.json() as Record<string, unknown>;
  const rawAvatars: Array<Record<string, unknown>> =
    Array.isArray(data?.data)                      ? data.data as Array<Record<string, unknown>> :
    Array.isArray((data?.data as any)?.avatars)    ? (data.data as any).avatars :
    Array.isArray(data?.avatars)                   ? data.avatars as Array<Record<string, unknown>> :
    [];

  console.log(`✅  Got ${rawAvatars.length} avatars from HeyGen`);

  // Show which image field HeyGen is using (helpful for debugging)
  if (rawAvatars[0]) {
    const imageFields = ['normal_preview','preview_image_url','thumbnail_image_url','headshot_image_url','image_url','thumbnail','preview'];
    const found = imageFields.filter(k => rawAvatars[0][k]);
    console.log(`🖼️   Image fields present: ${found.length ? found.join(', ') : 'NONE — API may have changed!'}`);
    if (found[0]) console.log(`     Example: ${rawAvatars[0][found[0]]}`);
  }

  // 2. Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  // 3. Load existing manifest (so re-runs skip already-cached files)
  const manifest: Record<string, string> = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try { Object.assign(manifest, JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))); } catch { /* fresh start */ }
  }

  // 4. Build + run download tasks
  let downloaded = 0;
  let skipped    = 0;
  let failed     = 0;
  let noUrl      = 0;

  const toProcess = rawAvatars.slice(0, MAX_AVATARS);

  const tasks = toProcess.map(avatar => async () => {
    const id = String(avatar.avatar_id ?? avatar.id ?? avatar.pose_id ?? '').trim();
    if (!id) return;

    const imgUrl = pickImageUrl(avatar);
    if (!imgUrl) {
      console.warn(`  ⚠️  No image URL for: ${id}`);
      noUrl++;
      return;
    }

    // Detect extension from URL; default to webp (what HeyGen uses)
    const extMatch = imgUrl.match(/\.(jpe?g|png|webp|gif|avif)(\?|$)/i);
    const ext      = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'webp';
    const filename = `${sanitizeId(id)}.${ext}`;
    const destPath = path.join(OUTPUT_DIR, filename);
    const pubPath  = `/avatars/${filename}`;

    if (fs.existsSync(destPath)) {
      manifest[id] = pubPath;
      skipped++;
      return;
    }

    try {
      await downloadFile(imgUrl, destPath);
      manifest[id] = pubPath;
      downloaded++;
      console.log(`  ✅  ${id} → ${pubPath}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ❌  Failed ${id}: ${msg} — storing CDN URL as fallback`);
      manifest[id] = imgUrl; // CDN URL fallback so the form still shows something
      failed++;
    }
  });

  console.log(`\n📥  Processing ${toProcess.length} avatars (${CONCURRENCY} at a time)…\n`);
  await runWithConcurrency(tasks, CONCURRENCY);

  // 5. Save manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const total = downloaded + skipped + failed;
  console.log('\n🎉  Done!');
  console.log(`   ✅  Downloaded : ${downloaded}`);
  console.log(`   ⏭️  Skipped    : ${skipped} (already cached)`);
  console.log(`   ❌  Failed     : ${failed}`);
  console.log(`   ⚠️  No URL     : ${noUrl}`);
  console.log(`   📦  Total      : ${total}`);
  console.log(`\n   📄  Manifest  : ${MANIFEST_PATH}`);
  console.log(`   📁  Images    : ${OUTPUT_DIR}`);
  console.log('\n✨  Restart Vite — avatars will now load from local files (no CORS, no CDN).');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});