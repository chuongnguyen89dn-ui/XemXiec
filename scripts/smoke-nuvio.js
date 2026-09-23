const movies=require('../ket_qua_1500_phim.json');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:7000';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(path){const r=await fetch(base+path);if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json();}
(async()=>{
  let up=false;
  for(let i=0;i<30;i++){try{const h=await get('/healthz');if(h.ok){up=true;break}}catch{} await sleep(500);}
  if(!up)throw new Error('server did not become ready');
  const manifest=await get('/manifest.json');
  if(!Array.isArray(manifest.resources)||!manifest.resources.includes('stream'))throw new Error('manifest missing stream resource');
  const cat=await get('/catalog/movie/xiec_latest_movies.json');
  if(!Array.isArray(cat.metas)||!cat.metas.length)throw new Error('catalog empty');
  const candidate=movies.find(m=>(Array.isArray(m.streams)&&m.streams.some(s=>s&&s.url))||m.manifest_url||m.mp4_url);
  if(!candidate)throw new Error('dataset has no movie with playback source');
  const main=await get('/stream/movie/'+encodeURIComponent(candidate.id)+'.json');
  if(!Array.isArray(main.streams)||main.streams.length<1)throw new Error('main player has no stream for '+candidate.id);
  if(main.streams.some(s=>/trailer/i.test(String(s.name||'')+' '+String(s.title||''))))throw new Error('trailer leaked into main player stream list');
  if(main.streams.some(s=>String(s.url||'').includes('javtrailers.com')))throw new Error('JAV trailer URL leaked into main player stream list');
  const meta=await get('/meta/movie/'+encodeURIComponent(candidate.id)+'.json');
  if(!meta.meta||meta.meta.id!==candidate.id)throw new Error('meta lookup failed');
  console.log('[SMOKE] OK id='+candidate.id+' streams='+main.streams.length+' first='+(main.streams[0].title||main.streams[0].name||''));
})().catch(e=>{console.error('[SMOKE] FAIL',e.message);process.exit(1)});