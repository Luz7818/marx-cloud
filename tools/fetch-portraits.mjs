/**
 * 从维基共享资源抓取人物肖像(头像与星尘掩膜的原料)。
 * 数据源:Wikidata P18(人物主图)→ Commons 缩略图(width=640)。
 * 产物:assets/portrait-src/<id>.jpg|png + assets/portrait-src/credits.json(署名与许可)。
 * 幂等:已存在的 <id> 跳过(--force 重抓)。仅教育演示用途,署名见 public/portraits/CREDITS.md。
 * 用法:node tools/fetch-portraits.mjs [--force] [--only=id1,id2]
 */
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'assets', 'portrait-src');
const UA = 'MarxCloud-portrait-fetch/1.0 (educational demo; https://github.com/Luz7818/marx-cloud)';
const WIDTH = 640;
const DELAY = 130;

const { figures } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));
const targets = figures.filter(f => f.wiki);

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const onlyArg = args.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1].split(',') : null;

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function getJSON(url) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (t === 2) throw e;
      await sleep(600 * (t + 1));
    }
  }
}

/** enwiki 标题 → Wikidata 实体(含 P18 文件名) */
async function resolveEntities(figs) {
  const map = new Map();
  for (let i = 0; i < figs.length; i += 20) {
    const batch = figs.slice(i, i + 20);
    const titles = batch.map(f => encodeURIComponent(f.wiki.replace(/ /g, '_'))).join('|');
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${titles}` +
      `&props=claims|sitelinks&format=json&formatversion=2`;
    const data = await getJSON(url);
    for (const ent of Object.values(data.entities || {})) {
      const en = ent.sitelinks && ent.sitelinks.enwiki;
      if (!en) continue;
      const p18 = ent.claims && ent.claims.P18 && ent.claims.P18[0];
      const file = p18 && p18.mainsnak && p18.mainsnak.snaktype === 'value' ? p18.mainsnak.datavalue.value : null;
      map.set(en.title, file);
    }
    await sleep(DELAY);
  }
  return map;
}

/** Commons 文件名 → {license, artist, thumbUrl} */
async function imageInfos(files) {
  const out = {};
  for (let i = 0; i < files.length; i += 20) {
    const batch = files.slice(i, i + 20).filter(Boolean);
    if (!batch.length) continue;
    const titles = batch.map(f => 'File:' + f).join('|');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo` +
      `&iiprop=extmetadata&iiurlwidth=${WIDTH}&titles=${encodeURIComponent(titles)}`;
    const data = await getJSON(url);
    for (const page of data.query && data.query.pages || []) {
      const ii = page.imageinfo && page.imageinfo[0];
      if (!ii) continue;
      const md = ii.extmetadata || {};
      out[page.title.replace(/^File:/, '')] = {
        license: (md.LicenseShortName && md.LicenseShortName.value) || '',
        artist: stripTags(md.Artist && md.Artist.value),
        thumbUrl: ii.thumburl || ii.url
      };
    }
    await sleep(DELAY);
  }
  return out;
}

async function download(url, dest) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 1200) throw new Error(`文件过小 ${buf.length}B`);
      writeFileSync(dest, buf);
      return buf.length;
    } catch (e) {
      if (t === 2) throw e;
      await sleep(800 * (t + 1));
    }
  }
}

console.log(`待处理 ${targets.length} 位(含 wiki 条目)`);
const entities = await resolveEntities(targets);
const fileNames = [...new Set([...entities.values()].filter(Boolean))];
console.log(`Wikidata P18 命中 ${fileNames.length} 张`);
const infos = await imageInfos(fileNames);

const credits = existsSync(join(OUT, 'credits.json')) ? JSON.parse(readFileSync(join(OUT, 'credits.json'), 'utf8')) : {};
let ok = 0, noP18 = [], failed = [];
for (const f of targets) {
  if (ONLY && !ONLY.includes(f.id)) continue;
  const dest = join(OUT, `${f.id}.jpg`);
  if (!FORCE && (existsSync(dest) || existsSync(join(OUT, `${f.id}.png`)))) { ok++; continue; }
  const file = entities.get(f.wiki);
  if (!file) { noP18.push(`${f.id}(${f.wiki})`); continue; }
  const info = infos['File:' + file] || infos[file] || {};
  const url = info.thumbUrl || `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${WIDTH}`;
  try {
    const size = await download(url, dest);
    credits[f.id] = { figure: f.name, file, license: info.license || '见文件页', artist: info.artist || '', url: `https://commons.wikimedia.org/wiki/${encodeURIComponent('File:' + file).replace(/%2F/gi, '/')}` };
    ok++;
    console.log(`  ✓ ${f.id} ← ${file} (${(size / 1024).toFixed(0)}KB, ${info.license || '?'})`);
    await sleep(DELAY);
  } catch (e) {
    failed.push(`${f.id}: ${e.message}`);
    console.log(`  × ${f.id} ${e.message}`);
  }
}
writeFileSync(join(OUT, 'credits.json'), JSON.stringify(credits, null, 1));
console.log(`\n完成 ${ok}/${targets.length};无 P18: ${noP18.length}${noP18.length ? ' → ' + noP18.join(' ') : ''};失败 ${failed.length}${failed.length ? ' → ' + failed.join(' ') : ''}`);
console.log('下一步:node tools/make-portraits.mjs');
