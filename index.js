'use strict';

const express = require('express');
const movies = require('./ket_qua_1500_phim.json');
const categoryData = require('./site-categories.json');

const app = express();
const PORT = Number(process.env.PORT || 7000);
const PAGE_SIZE = 100;

const text = v => String(v ?? '').trim();
const cleanTitle = v => text(v).replace(/\s*-\s*VLXX\.COM\s*$/i, '').trim();
const normalize = v => text(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const list = v => Array.isArray(v) ? v.map(text).filter(Boolean) : text(v).split(/[,|]/).map(text).filter(Boolean);
const unique = a => [...new Set(a.filter(Boolean))];
const safeDecode = v => { try { return decodeURIComponent(text(v)); } catch { return text(v); } };
const canonicalUrl = v => { try { const u = new URL(v); u.search = ''; u.hash = ''; return u.href; } catch { return text(v); } };

const categories = (categoryData.categories || []).map(c => ({
  name: text(c.name),
  path: text(c.path),
  urls: new Set((c.page_urls || []).map(canonicalUrl))
}));
const categoryId = c => 'site_' + (c.path || Buffer.from(c.name).toString('base64url'));
const categoryById = new Map(categories.map(c => [categoryId(c), c]));
const categoryNames = categories.map(c => c.name).filter(Boolean);

const extras = [
  { name: 'genre', isRequired: false, options: categoryNames },
  { name: 'actor', isRequired: false },
  { name: 'skip', isRequired: false },
  { name: 'search', isRequired: false }
];

const manifest = {
  id: 'community.xemxiec.catalog',
  version: '2.0.0',
  name: 'XemXiec',
  description: 'XemXiec movie catalog',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['movie_'],
  behaviorHints: { configurable: false },
  catalogs: [
    { type: 'movie', id: 'xemxiec_latest_movies', name: '🔥 PHIM SEX MỚI', extra: extras },
    ...categories.map(c => ({ type: 'movie', id: categoryId(c), name: c.name, extra: extras }))
  ]
};

function categoryGenres(movie) {
  const url = canonicalUrl(movie.page_url);
  return categories.filter(c => c.urls.has(url)).map(c => c.name);
}
function genresOf(movie) {
  return unique([...list(movie.genres), ...categoryGenres(movie)]);
}
function isVietsub(movie) {
  return movie.vietsub === true || genresOf(movie).some(g => normalize(g) === normalize('Phim sex Vietsub'));
}
function actorSearchLink(name, req) {
  const base = process.env.ADDON_MANIFEST_URL || (req ? `${req.protocol}://${req.get('host')}/manifest.json` : '');
  return base ? `stremio:///discover/${encodeURIComponent(base)}/movie/xemxiec_latest_movies?actor=${encodeURIComponent(name)}` : undefined;
}

function javAssets(code) {
  const match = cleanTitle(code).toLowerCase().match(/^([a-z]+)[-_ ]?(\d+)$/i);
  if (!match) return [];
  const prefix = match[1];
  const n = String(Number(match[2]));
  const numbers = unique([n.padStart(5, '0'), n.padStart(4, '0'), n.padStart(3, '0')]);
  const dirs = unique([`${prefix[0]}/${prefix.slice(0,3)}`, `${prefix[0]}/${prefix}`]);
  return numbers.flatMap(num => dirs.map(dir => {
    const cid = prefix + num;
    return {
      cid,
      trailer: `https://media.javtrailers.com/hlsvideo/freepv/${dir}/${cid}/playlist.m3u8`,
      poster: `https://images.javtrailers.com/digital/video/${cid}/${cid}ps.w360.webp`,
      scene: i => `https://images.javtrailers.com/digital/video/${cid}/${cid}jp-${i}.b800.webp`
    };
  }));
}

const trailerCache = new Map();
const posterCache = new Map();
const sceneCache = new Map();

async function exists(url, kind) {
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0', accept: kind === 'image' ? 'image/*,*/*' : 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*' },
      signal: AbortSignal.timeout(3500)
    });
    if (!r.ok) return false;
    if (kind === 'image') return (r.headers.get('content-type') || '').toLowerCase().startsWith('image/');
    return (await r.text()).trimStart().startsWith('#EXTM3U');
  } catch { return false; }
}

async function trailerFor(movie) {
  const key = text(movie.code).toUpperCase();
  if (!key) return null;
  if (trailerCache.has(key)) return trailerCache.get(key);
  if (key === 'PGD-932') {
    const url = 'https://media.javtrailers.com/litevideo/freepv/p/pgd/pgd00932/pgd00932_dmb_w.mp4';
    trailerCache.set(key, url); return url;
  }
  for (const a of javAssets(movie.code)) {
    if (await exists(a.trailer, 'hls')) { trailerCache.set(key, a.trailer); return a.trailer; }
  }
  trailerCache.set(key, null); return null;
}

async function posterFor(movie) {
  const key = text(movie.code).toUpperCase();
  if (!key) return movie.poster || null;
  if (posterCache.has(key)) return posterCache.get(key);
  for (const a of javAssets(movie.code)) {
    if (await exists(a.poster, 'image')) { posterCache.set(key, a.poster); return a.poster; }
  }
  const fallback = movie.poster || null;
  posterCache.set(key, fallback); return fallback;
}

async function scenesFor(movie) {
  const key = text(movie.code).toUpperCase();
  if (!key) return Array.isArray(movie.scene_images) ? movie.scene_images : [];
  if (sceneCache.has(key)) return sceneCache.get(key);
  for (const a of javAssets(movie.code)) {
    const found = [];
    await Promise.all(Array.from({ length: 20 }, (_, n) => n + 1).map(async i => {
      const url = a.scene(i);
      if (await exists(url, 'image')) found[i - 1] = url;
    }));
    const result = found.filter(Boolean);
    if (result.length) { sceneCache.set(key, result); return result; }
  }
  const fallback = Array.isArray(movie.scene_images) ? movie.scene_images : [];
  sceneCache.set(key, fallback); return fallback;
}

function movieMeta(movie, req, media = {}) {
  const actors = list(movie.actors);
  const genres = genresOf(movie);
  const description = cleanTitle(movie.description || '');
  const code = cleanTitle(movie.code || '');
  const released = /^\d{4}-\d{2}-\d{2}/.test(text(movie.releaseInfo)) ? text(movie.releaseInfo).slice(0,10) + 'T00:00:00.000Z' : '2026-01-01T00:00:00.000Z';
  const meta = {
    id: movie.id,
    type: 'movie',
    name: (isVietsub(movie) ? '🇻🇳 ' : '') + cleanTitle(movie.title),
    poster: media.poster || movie.poster || undefined,
    background: (media.scenes && media.scenes[0]) || movie.background || movie.backdrop || movie.preview || undefined,
    description: code && !normalize(description).includes(normalize(code)) ? `Mã phim: ${code}${description ? '\n\n' + description : ''}` : description,
    website: movie.page_url || undefined,
    posterShape: 'poster'
  };
  if (genres.length) meta.genres = genres;
  if (actors.length) {
    meta.cast = actors;
    meta.links = actors.map(name => ({ name, category: 'actor', url: actorSearchLink(name, req) })).filter(x => x.url);
  }
  if (movie.country) meta.country = Array.isArray(movie.country) ? movie.country.join(', ') : text(movie.country);
  if (movie.runtime || movie.duration) meta.runtime = text(movie.runtime || movie.duration);
  if (movie.releaseInfo || movie.year) meta.releaseInfo = text(movie.releaseInfo || movie.year);
  if (movie.director) meta.director = list(movie.director);

  const videos = [];
  if (media.trailer) videos.push({ id: movie.id + ':trailer', title: 'Trailer', released, season: 1, episode: 0, thumbnail: media.poster || movie.poster, overview: code + ' • Trailer', available: true });
  (media.scenes || []).forEach((thumbnail, i) => videos.push({ id: movie.id + ':image:' + (i + 1), title: 'Ảnh ' + (i + 1), released, season: 1, episode: i + 1, thumbnail, overview: code + ' • Ảnh cảnh ' + (i + 1), available: true }));
  if (videos.length) meta.videos = videos;
  return meta;
}

function parseExtras(pathPart, query) {
  const out = {};
  for (const part of text(pathPart).split('/')) {
    if (!part.includes('=')) continue;
    const [k, ...rest] = part.split('=');
    out[k] = safeDecode(rest.join('='));
  }
  for (const k of ['genre','actor','skip','search']) if (query[k] !== undefined) out[k] = text(query[k]);
  return out;
}
function catalogMovies(id) {
  if (id === 'xemxiec_latest_movies') return movies;
  const category = categoryById.get(id);
  return category ? movies.filter(m => category.urls.has(canonicalUrl(m.page_url))) : [];
}
function catalogResponse(id, pathPart, query, req) {
  const e = parseExtras(pathPart, query);
  let items = catalogMovies(id);
  if (e.genre) {
    const category = categories.find(c => c.name === e.genre);
    if (category) items = items.filter(m => category.urls.has(canonicalUrl(m.page_url)));
  }
  if (e.actor) {
    const actor = normalize(e.actor);
    items = items.filter(m => list(m.actors).some(a => normalize(a) === actor));
  }
  if (e.search) {
    const q = normalize(e.search);
    items = items.filter(m => normalize([m.title,m.code,m.description,...list(m.actors)].join(' ')).includes(q));
  }
  const skip = Math.max(0, parseInt(e.skip || '0', 10) || 0);
  return { metas: items.slice(skip, skip + PAGE_SIZE).map(m => movieMeta(m, req)) };
}

app.get('/', (req,res) => res.json({ ok:true, service:'XemXiec', version:'2.0.0', movies:movies.length, manifest:'/manifest.json', actorImageScraping:false }));
app.get('/healthz', (req,res) => res.json({ ok:true, version:'2.0.0', movies:movies.length, actorImageScraping:false }));
app.get('/manifest.json', (req,res) => res.json(manifest));
app.get('/catalog/:type/:id.json', (req,res) => res.json(req.params.type === 'movie' ? catalogResponse(req.params.id, '', req.query, req) : { metas:[] }));
app.get('/catalog/:type/:id/:rest(*)', (req,res) => res.json(req.params.type === 'movie' ? catalogResponse(req.params.id, text(req.params.rest).replace(/\.json$/i,''), req.query, req) : { metas:[] }));

app.get('/meta/:type/:id.json', async (req,res) => {
  if (req.params.type !== 'movie') return res.json({ meta:null });
  const id = text(req.params.id).split(':')[0];
  const movie = movies.find(m => m.id === id);
  if (!movie) return res.json({ meta:null });
  const [trailer, poster, scenes] = await Promise.all([trailerFor(movie), posterFor(movie), scenesFor(movie)]);
  return res.json({ meta:movieMeta(movie, req, { trailer, poster, scenes }) });
});

app.get('/stream/:type/:id.json', async (req,res) => {
  if (req.params.type !== 'movie') return res.json({ streams:[] });
  const rawId = text(req.params.id);
  const movie = movies.find(m => m.id === rawId.split(':')[0]);
  if (!movie) return res.json({ streams:[] });

  if (rawId.includes(':image:')) return res.json({ streams:[] });

  if (rawId.endsWith(':trailer')) {
    const url = await trailerFor(movie);
    return res.json({ streams:url ? [{ name:'XemXiec Trailer', title:'🎬 Trailer • ' + cleanTitle(movie.code), url, behaviorHints:{ notWebReady:true } }] : [] });
  }

  const streams = [];
  const seen = new Set();
  for (const source of movie.streams || []) {
    if (!source || !source.url || seen.has(source.url)) continue;
    seen.add(source.url);
    streams.push({ name:'XemXiec', title:'XemXiec • ' + (source.name || '#' + (streams.length + 1)), url:source.url, behaviorHints:{ notWebReady:true } });
  }
  if (movie.manifest_url && !seen.has(movie.manifest_url)) {
    seen.add(movie.manifest_url);
    streams.push({ name:'XemXiec', title:'XemXiec • ' + (streams.length ? 'Nguồn chính' : '#1'), url:movie.manifest_url, behaviorHints:{ notWebReady:true } });
  }
  if (movie.mp4_url && !seen.has(movie.mp4_url)) {
    streams.push({ name:'XemXiec', title:'XemXiec • MP4', url:movie.mp4_url, behaviorHints:{ notWebReady:true } });
  }
  console.log('[PLAY]', rawId, 'sources=' + streams.length);
  return res.json({ streams });
});

app.listen(PORT, '0.0.0.0', () => console.log(`XemXiec v2.0.0 listening on ${PORT}; movies=${movies.length}; actor images=OFF`));
