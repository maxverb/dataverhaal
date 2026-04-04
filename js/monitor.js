// ── RSS MONITOR — fetch all, filter per regio ──

let monAllArticles=[]; // all fetched articles with scraped text
let monStopped=false;

const MON_CACHE_KEY='metamax_rss_cache';
const MON_CACHE_TTL=48*60*60*1000; // 48 hours

function monGetCache(){try{return JSON.parse(localStorage.getItem(MON_CACHE_KEY)||'{}');}catch(e){return {};}}
function monSetCache(c){try{localStorage.setItem(MON_CACHE_KEY,JSON.stringify(c));}catch(e){}}

// Purge entries older than 48h
function monPurgeCache(){
  const cache=monGetCache();
  const now=Date.now();
  let purged=0;
  Object.keys(cache).forEach(url=>{
    if(now-cache[url].ts>MON_CACHE_TTL){delete cache[url];purged++;}
  });
  if(purged) monSetCache(cache);
  return cache;
}

function monShowCacheInfo(){
  const cache=monGetCache();
  const n=Object.keys(cache).length;
  const el=document.getElementById('mon-cache-info');
  if(!n){el.textContent='';return;}
  // Find oldest
  let oldest=Date.now();
  Object.values(cache).forEach(c=>{if(c.ts<oldest) oldest=c.ts;});
  const ageH=Math.round((Date.now()-oldest)/3600000);
  el.textContent=`Cache: ${n} artikelen (oudste: ${ageH}u geleden)`;
}

// ── FETCH ALL FEEDS ──

async function monFetchAll(){
  monStopped=false;
  const status=document.getElementById('mon-status');
  const bar=document.getElementById('mon-progress-bar');
  const fill=document.getElementById('mon-progress-fill');
  const startBtn=document.getElementById('mon-start');
  const stopBtn=document.getElementById('mon-stop');

  startBtn.disabled=true;startBtn.textContent='Bezig...';
  stopBtn.style.display='';
  bar.style.display='block';fill.style.width='0%';

  // Purge old cache
  const cache=monPurgeCache();
  const scrapeEnabled=document.getElementById('mon-scrape').checked;

  // Fetch ALL feeds (no omroep filter)
  const feeds=MONITOR_FEEDS;
  monAllArticles=[];
  const startTime=Date.now();

  // Step 1: Fetch RSS
  status.textContent='RSS feeds ophalen...';status.style.color='var(--ac)';
  const rssArticles=[];

  for(let fi=0;fi<feeds.length;fi++){
    if(monStopped) break;
    const feed=feeds[fi];
    status.textContent=`RSS ${fi+1}/${feeds.length}: ${feed.name}...`;
    fill.style.width=Math.round((fi/feeds.length)*30)+'%';
    try{
      const feedUrl=`https://dataverhaal-scraper.maxverb.workers.dev/?url=${encodeURIComponent(feed.url)}`;
      const resp=await fetch(feedUrl);
      if(!resp.ok) continue;
      const xml=await resp.text();
      const doc=new DOMParser().parseFromString(xml,'text/xml');
      doc.querySelectorAll('item').forEach(item=>{
        const title=item.querySelector('title')?.textContent?.trim()||'';
        const link=item.querySelector('link')?.textContent?.trim()||'';
        const desc=item.querySelector('description')?.textContent?.trim()||'';
        const pubDate=item.querySelector('pubDate')?.textContent?.trim()||'';
        const enclosure=item.querySelector('enclosure');
        const mediaContent=item.querySelector('content');
        const image=enclosure?.getAttribute('url')||mediaContent?.getAttribute('url')||'';
        if(title&&link) rssArticles.push({title,link,desc,pubDate,image,source:feed.name,sourceId:feed.id});
      });
    }catch(e){}
  }

  if(!rssArticles.length&&!monStopped){
    status.textContent='Geen artikelen gevonden';status.style.color='var(--err)';
    startBtn.disabled=false;startBtn.textContent='▶ Ophalen';stopBtn.style.display='none';
    bar.style.display='none';return;
  }

  status.textContent=`${rssArticles.length} artikelen, scraping...`;

  // Step 2: Scrape + cache each article
  let scraped=0,cached=0;
  for(let i=0;i<rssArticles.length;i++){
    if(monStopped) break;
    const art=rssArticles[i];
    const elapsed=(Date.now()-startTime)/1000;
    const perItem=i>0?elapsed/i:0.5;
    const remaining=Math.round(perItem*(rssArticles.length-i));
    const eta=remaining>=60?Math.floor(remaining/60)+'m '+remaining%60+'s':remaining+'s';
    fill.style.width=Math.round(30+(i/rssArticles.length)*70)+'%';

    let fullText='';
    if(cache[art.link]){
      const c=cache[art.link];
      fullText=c.fullText||'';
      art.intro=c.intro||art.desc;
      art.fullTitle=c.fullTitle||art.title;
      cached++;
      status.textContent=`${i+1}/${rssArticles.length} · ${eta} · ⚡ cache · ${art.source}`;
    } else if(scrapeEnabled){
      status.textContent=`${i+1}/${rssArticles.length} · ${eta} · ${art.source}`;
      try{
        const html=await fetchHTML(art.link);
        if(html){
          const parsed=parseArticle(html,art.link);
          fullText=parsed.bodyText||'';
          art.intro=parsed.intro||art.desc;
          art.fullTitle=parsed.headline||art.title;
        }
      }catch(e){}
      cache[art.link]={fullText,intro:art.intro||art.desc,fullTitle:art.fullTitle||art.title,source:art.source,sourceId:art.sourceId,ts:Date.now()};
      monSetCache(cache);
      scraped++;
      if(i<rssArticles.length-1&&!monStopped) await new Promise(r=>setTimeout(r,300));
    } else {
      status.textContent=`${i+1}/${rssArticles.length} · ${eta} · ${art.source}`;
    }

    art.fullText=fullText;
    monAllArticles.push(art);
  }

  fill.style.width='100%';
  const totalSec=Math.round((Date.now()-startTime)/1000);
  const totalTime=totalSec>=60?Math.floor(totalSec/60)+'m '+totalSec%60+'s':totalSec+'s';
  status.textContent=monStopped
    ?`Gestopt (${totalTime})`
    :`✓ ${rssArticles.length} artikelen (${scraped} nieuw, ${cached} cache) in ${totalTime}`;
  status.style.color='var(--ok)';
  startBtn.disabled=false;startBtn.textContent='▶ Ophalen';
  stopBtn.style.display='none';
  monShowCacheInfo();

  // Auto-filter with current omroep selection
  monFilter();
}

function monStop(){monStopped=true;}

// ── FILTER + SCORE per regio ──

function monFilter(){
  const omroep=document.getElementById('mon-omroep').value;
  const hideZero=document.getElementById('mon-hide-zero').checked;

  if(!monAllArticles.length){
    // Try loading from cache if we haven't fetched yet
    monLoadFromCache();
    if(!monAllArticles.length) return;
  }

  // Score all articles against selected entity set
  const results=[];
  monAllArticles.forEach(art=>{
    if(omroep){
      // Skip articles from the omroep itself (you don't monitor yourself)
      if(art.sourceId===omroep) return;
      const entities=MONITOR_ENTITIES[omroep];
      if(!entities) return;
      const score=scoreArticle(art.fullTitle||art.title,art.intro||art.desc,art.fullText||'',entities);
      if(hideZero&&score.total===0) return;
      results.push({...art,score:score.total,scoreDetails:score.details});
    } else {
      // No filter — show all with score 0
      results.push({...art,score:0,scoreDetails:[]});
    }
  });

  results.sort((a,b)=>b.score-a.score);
  monRenderResults(results,omroep);
}

// Load articles from cache without re-fetching
function monLoadFromCache(){
  const cache=monPurgeCache();
  const n=Object.keys(cache).length;
  if(!n) return;

  // Reconstruct articles from cache
  Object.entries(cache).forEach(([url,c])=>{
    monAllArticles.push({
      title:c.fullTitle||'',link:url,desc:'',
      fullTitle:c.fullTitle||'',intro:c.intro||'',
      fullText:c.fullText||'',
      source:c.source||'',sourceId:c.sourceId||'',
      image:c.image||'',pubDate:c.pubDate||''
    });
  });
  monShowCacheInfo();
}

// ── RENDER ──

function monRenderResults(results,omroep){
  const out=document.getElementById('mon-results');

  if(!results.length){
    out.innerHTML='<div style="padding:20px;color:var(--pm)">Geen '+(omroep?'relevante ':'')+'artikelen gevonden</div>';
    return;
  }

  let html='';
  results.forEach((art,i)=>{
    const clr=art.score>=10?'var(--green)':art.score>=4?'var(--warn)':art.score>0?'var(--ac)':'var(--pm)';
    const matchTags=art.scoreDetails.slice(0,5).map(d=>
      `<span class="mon-tag">${esc(d.term)}</span>`
    ).join('');
    html+=`<div class="mon-row" onclick="monShowDetail(${i})">
      <div class="mon-score-num" style="color:${clr}">${art.score}</div>
      <div class="mon-source">${esc(art.source)}</div>
      <div class="mon-info">
        <a class="mon-title" href="${esc(art.link)}" target="_blank" onclick="event.stopPropagation()">${esc(art.fullTitle||art.title)}</a>
        <div class="mon-tags">${matchTags}</div>
      </div>
    </div>`;
  });

  out.innerHTML=html;
  out._monResults=results;
}

function monShowDetail(idx){
  const out=document.getElementById('mon-results');
  const results=out._monResults;
  if(!results||!results[idx]) return;
  const art=results[idx];
  if(!out._monHTML) out._monHTML=out.innerHTML;

  let html=`<button class="btn btn-sm" onclick="monBackToList()" style="margin-bottom:10px">&#8592; Terug</button>`;
  html+=`<div class="mon-detail">`;
  html+=`<div class="mon-detail-score"><span class="sd-big">${art.score}</span><span class="sd-sub">relevantie-score</span></div>`;
  html+=`<h2 style="font-family:Sora;font-size:18px;color:var(--pt);margin:8px 0">${esc(art.fullTitle||art.title)}</h2>`;
  html+=`<div style="font-size:12px;color:var(--pm);margin-bottom:8px">${esc(art.source)} · <a href="${esc(art.link)}" target="_blank" style="color:var(--ac)">${esc(art.link)}</a></div>`;
  if(art.intro) html+=`<p style="font-size:13px;color:var(--pt);line-height:1.5;margin-bottom:12px">${esc(art.intro)}</p>`;

  if(art.scoreDetails.length){
    html+=`<div class="sd-card" style="margin-top:8px"><div class="sd-card-title">Score breakdown</div>`;
    html+=`<table class="sr-table" style="font-size:12px"><thead><tr><th>Term</th><th>Type</th><th>Hits</th><th>Score</th></tr></thead><tbody>`;
    art.scoreDetails.forEach(d=>{
      html+=`<tr><td>${esc(d.term)}</td><td style="color:var(--pm)">${d.cat}</td><td>${d.hits}</td><td style="color:var(--ac);font-weight:700">${d.score}</td></tr>`;
    });
    html+=`</tbody></table></div>`;
  }
  html+=`</div>`;
  out.innerHTML=html;
}

function monBackToList(){
  const out=document.getElementById('mon-results');
  if(out._monHTML){out.innerHTML=out._monHTML;out._monHTML=null;}
}

function scoreArticle(title,intro,text,entities){
  const details=[];
  let total=0;

  const allTerms=[
    ...entities.gemeenten.map(t=>({term:t,cat:'gemeente',weight:3})),
    ...entities.wijken.map(t=>({term:t,cat:'wijk',weight:2})),
    ...entities.personen.map(t=>({term:t,cat:'persoon',weight:3})),
    ...entities.sport.map(t=>({term:t,cat:'sport',weight:2})),
    ...entities.landmarks.map(t=>({term:t,cat:'landmark',weight:2})),
    ...entities.overig.map(t=>({term:t,cat:'overig',weight:1})),
  ];

  const caseSensitiveTerms=new Set(['Leiden']);
  const wordBoundaryTerms=new Set(['Lisse']);

  allTerms.forEach(({term,cat,weight})=>{
    const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const isCaseSensitive=caseSensitiveTerms.has(term);
    const forceWordBoundary=wordBoundaryTerms.has(term)||term.length<=4;

    let regex;
    if(forceWordBoundary) regex=new RegExp('\\b'+escaped+'\\b',isCaseSensitive?'':'i');
    else if(isCaseSensitive) regex=new RegExp(escaped);
    else regex=new RegExp(escaped,'i');

    let hits=0;
    if(title&&regex.test(title)) hits+=3;
    if(intro&&regex.test(intro)) hits+=2;
    if(text&&regex.test(text)) hits+=1;

    if(hits>0){
      const score=hits*weight;
      total+=score;
      details.push({term,cat,hits,score});
    }
  });

  details.sort((a,b)=>b.score-a.score);
  return {total,details};
}

// Show cache info on page load
(function(){setTimeout(monShowCacheInfo,500);})();

// esc() defined in scraper.js
