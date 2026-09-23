const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const puppeteer=require('puppeteer-core');

const ROOT=path.resolve(__dirname,'..');
const MOVIES=require(path.join(ROOT,'ket_qua_1500_phim.json'));
const OUT=path.join(ROOT,'javsb_metadata.json');
const PROFILE=path.join(ROOT,'.javsb-browser-profile');
const BASE='https://jav.sb';
const argv=process.argv.slice(2);
const arg=(name,def=null)=>{const i=argv.indexOf('--'+name);return i>=0&&argv[i+1]?argv[i+1]:def};
const has=name=>argv.includes('--'+name);
const onlyCode=(arg('code','')||'').trim().toUpperCase();
const start=Math.max(0,Number(arg('start','0'))||0);
const limit=Math.max(1,Number(arg('limit','3225'))||3225);
const delay=Math.max(800,Number(arg('delay','1400'))||1400);
const headless=has('headless');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const normCode=s=>clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
function chromeCandidates(){
  const e=process.env.CHROME_PATH||process.env.CHROMIUM_PATH;
  const p=process.env.LOCALAPPDATA||'';
  const pf=process.env.PROGRAMFILES||'C:\\Program Files';
  const pfx=process.env['PROGRAMFILES(X86)']||'C:\\Program Files (x86)';
  const home=process.env.USERPROFILE||'';
  return [e,
    path.join(p,'Google','Chrome','Application','chrome.exe'),
    path.join(p,'Chromium','Application','chrome.exe'),
    path.join(p,'browser-harness','chromium','chrome.exe'),
    path.join(home,'.cache','ms-playwright','chromium','chrome-win','chrome.exe'),
    path.join(home,'.cache','ms-playwright','chromium_headless_shell','chrome-win','chrome.exe'),
    path.join(pf,'Google','Chrome','Application','chrome.exe'),
    path.join(pfx,'Google','Chrome','Application','chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean);
}
function findChrome(){
  for(const p of chromeCandidates())if(fs.existsSync(p))return p;
  try{
    const r=spawnSync('where',['chrome.exe'],{encoding:'utf8'});
    const p=String(r.stdout||'').split(/\r?\n/).find(Boolean);if(p&&fs.existsSync(p))return p;
  }catch{}
  throw new Error('Không tìm thấy Chromium/Chrome. Đặt CHROME_PATH tới chrome.exe rồi chạy lại.');
}
function loadOut(){try{const x=JSON.parse(fs.readFileSync(OUT,'utf8'));return x&&typeof x==='object'?x:{};}catch{return {};}}
function saveOut(db){fs.writeFileSync(OUT,JSON.stringify(db,null,2)+'\n','utf8');}
function textValue(lines,labels){
  for(let i=0;i<lines.length;i++){
    for(const re of labels){
      const m=lines[i].match(re);
      if(m){
        const inline=clean(m[1]||'');
        if(inline)return inline;
        if(lines[i+1])return clean(lines[i+1]);
      }
    }
  }
  return '';
}
function listValue(v){return [...new Set(clean(v).split(/[,|/]|\s{2,}/).map(clean).filter(Boolean))];}
async function candidateDetail(page,code){
  const variants=[code,code.replace('-',''),code.replace(/([A-Z]+)(\d+)/,'$1-$2')];

  // JAVSB detail URLs follow a stable pattern such as /jav/ntr-057-1-1.html.
  const slug=code.toLowerCase().replace(/\s+/g,'').replace(/_/g,'-');
  const direct=BASE+'/jav/'+slug+'-1-1.html';
  try{
    await page.goto(direct,{waitUntil:'domcontentloaded',timeout:30000});
    await sleep(500);
    const state=await page.evaluate((vars)=>{
      const title=(document.title||'').toUpperCase();
      const body=(document.body?.innerText||'').toUpperCase();
      const url=location.href;
      const ok=vars.some(v=>{
        const x=v.toUpperCase();
        return title.includes(x)||body.includes(x);
      });
      const notFound=/404|NOT FOUND|找不到|頁面不存在/i.test(title+' '+body);
      return {ok,notFound,url};
    },variants);
    if(state.ok&&!state.notFound)return state.url;
  }catch{}

  const urls=[
    BASE+'/?s='+encodeURIComponent(code),
    BASE+'/search?q='+encodeURIComponent(code),
    BASE+'/search/'+encodeURIComponent(code)
  ];
  // Fallback: site's own search box from home.
  try{
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
    await sleep(700);
    const box=await page.$('input[type="search"],input[name="s"],input[name="q"],input[placeholder*="Search" i]');
    if(box){
      await box.click({clickCount:3});await box.type(code,{delay:35});
      await page.keyboard.press('Enter');await page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}).catch(()=>{});
      urls.unshift(page.url());
    }
  }catch{}
  for(const u of [...new Set(urls)]){
    try{
      if(page.url()!==u)await page.goto(u,{waitUntil:'domcontentloaded',timeout:30000});
      await sleep(500);
      const found=await page.evaluate((vars)=>{
        const score=a=>{
          const t=((a.textContent||'')+' '+(a.getAttribute('href')||'')).toUpperCase().replace(/[^A-Z0-9]/g,'');
          return vars.some(v=>t.includes(v.toUpperCase().replace(/[^A-Z0-9]/g,'')));
        };
        const a=[...document.querySelectorAll('a[href]')].find(score);
        return a?new URL(a.href,location.href).href:null;
      },variants);
      if(found&&found.startsWith(BASE))return found;
      const body=normCode(await page.evaluate(()=>document.body?.innerText||''));
      if(variants.some(v=>body.includes(normCode(v))))return page.url();
    }catch{}
  }
  return null;
}
async function parseDetail(page,code,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await sleep(700);
  return await page.evaluate((code)=>{
    const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
    const lines=(document.body?.innerText||'').split(/\n+/).map(clean).filter(Boolean);
    const pick=(patterns)=>{
      for(let i=0;i<lines.length;i++)for(const src of patterns){
        const re=new RegExp(src,'i'),m=lines[i].match(re);
        if(m){if(clean(m[1]))return clean(m[1]);if(lines[i+1])return clean(lines[i+1]);}
      }return '';
    };
    const list=v=>[...new Set(clean(v).split(/[,|/]|\s{2,}/).map(clean).filter(Boolean))];
    const lds=[];
    for(const el of document.querySelectorAll('script[type="application/ld+json"]')){
      try{const v=JSON.parse(el.textContent);Array.isArray(v)?lds.push(...v):lds.push(v)}catch{}
    }
    const ld=lds.find(x=>x&&(/Movie|VideoObject/i.test(String(x['@type']||''))))||lds.find(x=>x&&x.name)||{};
    const meta=(name)=>document.querySelector(`meta[property="${name}"],meta[name="${name}"]`)?.content||'';
    const title=clean(ld.name||meta('og:title')||document.querySelector('h1')?.textContent||document.title);
    const poster=clean(ld.image?.url||ld.image?.[0]||ld.thumbnailUrl||meta('og:image'));
    const description=clean(ld.description||meta('og:description')||meta('description'));
    const actorLd=Array.isArray(ld.actor)?ld.actor.map(x=>clean(x?.name||x)).filter(Boolean):[];
    const genreLd=Array.isArray(ld.genre)?ld.genre:list(ld.genre||'');
    const actors=actorLd.length?actorLd:list(pick(['^(?:Actress|Actor|Cast|Starring|出演者|女優)\\s*[:：]?\\s*(.*)$']));
    const genres=genreLd.length?genreLd:list(pick(['^(?:Genre|Genres|Tags|ジャンル)\\s*[:：]?\\s*(.*)$']));
    const director=clean(ld.director?.name||ld.director||pick(['^(?:Director|監督)\\s*[:：]?\\s*(.*)$']));
    const studio=pick(['^(?:Studio|Maker|Label|メーカー|レーベル)\\s*[:：]?\\s*(.*)$']);
    const series=pick(['^(?:Series|シリーズ)\\s*[:：]?\\s*(.*)$']);
    const releaseDate=clean(ld.datePublished||pick(['^(?:Release Date|Released|Date|発売日)\\s*[:：]?\\s*(.*)$']));
    const runtime=clean(ld.duration||pick(['^(?:Runtime|Duration|Length|収録時間)\\s*[:：]?\\s*(.*)$']));
    return {code,title,description,poster,actors,genres,director,studio,series,releaseDate,runtime,sourceUrl:location.href,scannedAt:new Date().toISOString()};
  },code);
}
(async()=>{
  const chrome=findChrome();
  console.log('[JAVSB] Chromium:',chrome);
  console.log('[JAVSB] profile:',PROFILE);
  const browser=await puppeteer.launch({
    executablePath:chrome,headless,userDataDir:PROFILE,
    defaultViewport:{width:1280,height:800},
    args:['--start-maximized','--host-resolver-rules=MAP jav.sb 104.26.8.13']
  });
  const page=(await browser.pages())[0]||await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  const db=loadOut();
  let rows=MOVIES.filter(m=>m&&m.code);
  if(onlyCode)rows=rows.filter(m=>normCode(m.code)===normCode(onlyCode));
  else rows=rows.slice(start,start+limit);
  let ok=0,miss=0;
  for(let i=0;i<rows.length;i++){
    const code=clean(rows[i].code).toUpperCase();
    process.stdout.write(`[JAVSB] ${i+1}/${rows.length} ${code} ... `);
    try{
      const detail=await candidateDetail(page,code);
      if(!detail){console.log('NOT FOUND');miss++;await sleep(delay);continue;}
      const meta=await parseDetail(page,code,detail);
      if(!meta.title&&!meta.description&&!meta.actors?.length){console.log('EMPTY');miss++;await sleep(delay);continue;}
      db[code]=meta;saveOut(db);ok++;
      console.log('OK',meta.title||detail);
    }catch(e){console.log('ERR',e.message);miss++;}
    await sleep(delay);
  }
  console.log(`[JAVSB] DONE ok=${ok} miss=${miss} totalSaved=${Object.keys(db).length}`);
  await browser.close();
})().catch(e=>{console.error('[JAVSB] FATAL',e);process.exit(1)});
