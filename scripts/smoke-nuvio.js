const movies=require('../ket_qua_1500_phim.json');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:7000';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(path){const r=await fetch(base+path);if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json();}
(async()=>{
  let up=false;
  for(let i=0;i<30;i++){try{const h=await get('/healthz');if(h.ok){up=true;break}}catch{} await sleep(300);}
  if(!up)throw new Error('server did not become ready');
  const manifest=await get('/manifest.json');
  if(!Array.isArray(manifest.resources)||!manifest.resources.includes('stream'))throw new Error('manifest missing stream resource');
  const cat=await get('/catalog/movie/xiec_latest_movies.json');
  if(!Array.isArray(cat.metas)||!cat.metas.length)throw new Error('catalog empty');
  const candidates=movies.filter(m=>(Array.isArray(m.streams)&&m.streams.some(s=>s&&s.url))||m.manifest_url||m.mp4_url).slice(0,20);
  if(!candidates.length)throw new Error('dataset has no movie with playback source');
  let checked=null;
  for(const candidate of candidates){
    const main=await get('/stream/movie/'+encodeURIComponent(candidate.id)+'.json');
    if(!Array.isArray(main.streams)||!main.streams.length)continue;
    if(main.streams.some(s=>/trailer/i.test(String(s.name||'')+' '+String(s.title||''))))throw new Error('trailer leaked into main player stream list for '+candidate.id);
    if(main.streams.some(s=>String(s.url||'').includes('javtrailers.com')))throw new Error('JAV trailer URL leaked into main player for '+candidate.id);
    checked={id:candidate.id,count:main.streams.length,first:main.streams[0].title||main.streams[0].name||''};
    break;
  }
  if(!checked)throw new Error('no movie returned a real player stream');
  console.log('[SMOKE] OK id='+checked.id+' streams='+checked.count+' first='+checked.first);
})().catch(e=>{console.error('[SMOKE] FAIL',e.message);process.exit(1)});