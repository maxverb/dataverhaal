// ── RSS MONITOR + RELEVANTIE SCORING ──

let monitorResults=[];
let monitorStopped=false;

// localStorage cache for scraped articles
const MON_CACHE_KEY='dataverhaal_monitor_cache';
function getMonCache(){try{return JSON.parse(localStorage.getItem(MON_CACHE_KEY)||'{}');}catch(e){return {};}}
function setMonCache(cache){try{localStorage.setItem(MON_CACHE_KEY,JSON.stringify(cache));}catch(e){}}


async function startMonitor(){
  const omroep=document.getElementById('mon-omroep').value;
  if(!omroep){document.getElementById('mon-status').textContent='Kies een omroep';return;}

  const entities=MONITOR_ENTITIES[omroep];
  if(!entities){document.getElementById('mon-status').textContent='Entiteiten niet gevonden';return;}

  const status=document.getElementById('mon-status');
  const bar=document.getElementById('mon-progress-bar');
  const fill=document.getElementById('mon-progress-fill');
  const out=document.getElementById('mon-results');
  const startBtn=document.getElementById('mon-start');
  const stopBtn=document.getElementById('mon-stop');

  monitorResults=[];
  monitorStopped=false;
  bar.style.display='block';
  startBtn.disabled=true;startBtn.textContent='Bezig...';
  stopBtn.style.display='';
  out.innerHTML='';

  // Get feeds — exclude own omroep
  const feeds=MONITOR_FEEDS.filter(f=>f.id!==omroep);
  const startTime=Date.now();

  // Step 1: Fetch all RSS feeds
  status.textContent='RSS feeds ophalen...';status.style.color='var(--ac)';
  const allArticles=[];

  for(const feed of feeds){
    if(monitorStopped) break;
    status.textContent=`RSS: ${feed.name}...`;
    try{
      const feedUrl=`https://dataverhaal-scraper.maxverb.workers.dev/?url=${encodeURIComponent(feed.url)}`;
      const resp=await fetch(feedUrl);
      if(!resp.ok) continue;
      const xml=await resp.text();
      const doc=new DOMParser().parseFromString(xml,'text/xml');
      const items=doc.querySelectorAll('item');
      items.forEach(item=>{
        const title=item.querySelector('title')?.textContent?.trim()||'';
        const link=item.querySelector('link')?.textContent?.trim()||'';
        const desc=item.querySelector('description')?.textContent?.trim()||'';
        const pubDate=item.querySelector('pubDate')?.textContent?.trim()||'';
        // Extract image from enclosure or media:content
        const enclosure=item.querySelector('enclosure');
        const mediaContent=item.querySelector('content');
        const image=enclosure?.getAttribute('url')||mediaContent?.getAttribute('url')||'';
        if(title&&link) allArticles.push({title,link,desc,pubDate,image,source:feed.name,sourceId:feed.id});
      });
    }catch(e){}
  }

  if(!allArticles.length){
    status.textContent='Geen artikelen gevonden in RSS feeds';status.style.color='var(--err)';
    startBtn.disabled=false;startBtn.textContent='▶ Start monitor';stopBtn.style.display='none';
    bar.style.display='none';return;
  }

  status.textContent=`${allArticles.length} artikelen gevonden, scraping + scoring...`;

  // Step 2: Score each article (first on RSS data, then optionally scrape)
  const scrapeEnabled=document.getElementById('mon-scrape').checked;

  // Load cache — only scrape articles not yet cached
  const cache=getMonCache();
  const currentUrls=new Set(allArticles.map(a=>a.link));
  // Remove cached items no longer in RSS
  Object.keys(cache).forEach(url=>{if(!currentUrls.has(url)) delete cache[url];});
  setMonCache(cache);

  let scraped=0, cached=0;
  for(let i=0;i<allArticles.length;i++){
    if(monitorStopped) break;
    const art=allArticles[i];

    // ETA
    const elapsed=(Date.now()-startTime)/1000;
    const perItem=i>0?elapsed/i:0.5;
    const remaining=Math.round(perItem*(allArticles.length-i));
    const eta=remaining>=60?Math.floor(remaining/60)+'m '+remaining%60+'s':remaining+'s';
    fill.style.width=Math.round((i/allArticles.length)*100)+'%';

    let fullText='';
    // Check cache first
    if(cache[art.link]){
      const c=cache[art.link];
      fullText=c.fullText||'';
      art.intro=c.intro||art.desc;
      art.fullTitle=c.fullTitle||art.title;
      cached++;
      status.textContent=`${i+1}/${allArticles.length} · ${eta} · ⚡ cache · ${art.source}`;
    } else if(scrapeEnabled){
      status.textContent=`${i+1}/${allArticles.length} · ${eta} · ${art.source}`;
      try{
        const html=await fetchHTML(art.link);
        if(html){
          const parsed=parseArticle(html,art.link);
          fullText=parsed.bodyText||'';
          art.intro=parsed.intro||art.desc;
          art.fullTitle=parsed.headline||art.title;
        }
      }catch(e){}
      // Save to cache
      cache[art.link]={fullText,intro:art.intro,fullTitle:art.fullTitle,ts:Date.now()};
      setMonCache(cache);
      scraped++;
      // Delay only for actual scrapes
      if(i<allArticles.length-1&&!monitorStopped) await new Promise(r=>setTimeout(r,300));
    } else {
      status.textContent=`${i+1}/${allArticles.length} · ${eta} · ${art.source}`;
    }

    // Score against entities
    const score=scoreArticle(art.fullTitle||art.title, art.intro||art.desc, fullText, entities);
    art.score=score.total;
    art.scoreDetails=score.details;
    art.fullText=fullText;

    if(score.total>0){
      monitorResults.push(art);
      renderMonitorResults(omroep);
    }
  }

  fill.style.width='100%';
  const totalSec=Math.round((Date.now()-startTime)/1000);
  const totalTime=totalSec>=60?Math.floor(totalSec/60)+'m '+totalSec%60+'s':totalSec+'s';
  status.textContent=monitorStopped
    ?`Gestopt (${totalTime})`
    :`✓ ${allArticles.length} gescand (${scraped} nieuw, ${cached} cache), ${monitorResults.length} relevant (${totalTime})`;
  status.style.color='var(--ok)';
  startBtn.disabled=false;startBtn.textContent='▶ Start monitor';
  stopBtn.style.display='none';
  if(monitorResults.length){
    if(typeof updateContext==='function'){
      const top=monitorResults.sort((a,b)=>b.score-a.score)[0];
      updateContext('monitor',
        `<div class="ctx-stat"><span>Relevant</span><span class="ctx-val">${monitorResults.length}</span></div>`+
        (top?`<div class="ctx-stat"><span>Hoogste</span><span class="ctx-val">${top.score}</span></div>`:''));
    }
  }
}

function stopMonitor(){monitorStopped=true;}

function scoreArticle(title,intro,text,entities){
  const details=[];
  let total=0;

  // Combine all entity lists
  const allTerms=[
    ...entities.gemeenten.map(t=>({term:t,cat:'gemeente',weight:3})),
    ...entities.wijken.map(t=>({term:t,cat:'wijk',weight:2})),
    ...entities.personen.map(t=>({term:t,cat:'persoon',weight:3})),
    ...entities.sport.map(t=>({term:t,cat:'sport',weight:2})),
    ...entities.landmarks.map(t=>({term:t,cat:'landmark',weight:2})),
    ...entities.overig.map(t=>({term:t,cat:'overig',weight:1})),
  ];

  const titleLower=(title||'').toLowerCase();
  const introLower=(intro||'').toLowerCase();
  const textLower=(text||'').toLowerCase();

  // Special terms: case-sensitive matching
  const caseSensitiveTerms=new Set(['Leiden']);
  // Terms that must match as whole word (word boundary)
  const wordBoundaryTerms=new Set(['Lisse']);

  allTerms.forEach(({term,cat,weight})=>{
    const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const isCaseSensitive=caseSensitiveTerms.has(term);
    const forceWordBoundary=wordBoundaryTerms.has(term)||term.length<=4;

    let regex;
    if(forceWordBoundary){
      regex=new RegExp('\\b'+escaped+'\\b',isCaseSensitive?'':'i');
    } else if(isCaseSensitive){
      regex=new RegExp(escaped);
    } else {
      regex=new RegExp(escaped,'i');
    }

    function matches(text){return text?regex.test(text):false;}

    let hits=0;
    if(matches(title)) hits+=3;
    if(matches(intro)) hits+=2;
    if(matches(text)) hits+=1;

    if(hits>0){
      const score=hits*weight;
      total+=score;
      details.push({term,cat,hits,score});
    }
  });

  // Sort details by score
  details.sort((a,b)=>b.score-a.score);

  return {total,details};
}

function renderMonitorResults(omroep){
  const out=document.getElementById('mon-results');
  // Sort by score descending
  const sorted=[...monitorResults].sort((a,b)=>b.score-a.score);

  // Track highest score ever in localStorage
  const hiKey='dataverhaal_monitor_highscore_'+omroep;
  let highScore=parseInt(localStorage.getItem(hiKey)||'0');
  if(sorted.length&&sorted[0].score>highScore){highScore=sorted[0].score;localStorage.setItem(hiKey,String(highScore));}

  let html='';
  sorted.forEach((art,i)=>{
    // Color based on score: >=10 green, 4-9 orange, <4 blue
    const clr=art.score>=10?'var(--green)':art.score>=4?'var(--warn)':'var(--ac)';
    const matchTags=art.scoreDetails.slice(0,5).map(d=>
      `<span class="mon-tag" onclick="event.stopPropagation();showMonDetail(${i})">${esc(d.term)}</span>`
    ).join('');
    html+=`<div class="mon-row">
      <div class="mon-score-num" style="color:${clr}">${art.score}</div>
      <div class="mon-source">${esc(art.source)}</div>
      <div class="mon-info">
        <a class="mon-title" href="${esc(art.link)}" target="_blank" onclick="event.stopPropagation()">${esc(art.fullTitle||art.title)}</a>
        <div class="mon-tags">${matchTags}</div>
      </div>
    </div>`;
  });

  out.innerHTML=html||'<div style="padding:20px;color:var(--pm)">Nog geen relevante artikelen gevonden...</div>';
}

function showMonDetail(idx){
  const sorted=[...monitorResults].sort((a,b)=>b.score-a.score);
  const art=sorted[idx];
  if(!art) return;
  const out=document.getElementById('mon-results');
  if(!out._monHTML) out._monHTML=out.innerHTML;

  let html=`<button class="btn btn-sm" onclick="backToMonList()" style="margin-bottom:10px">← Terug naar overzicht</button>`;
  html+=`<div class="mon-detail">`;
  html+=`<div class="mon-detail-score"><span class="sd-big">${art.score}</span><span class="sd-sub">relevantie-score</span></div>`;
  html+=`<h2 style="font-family:Sora;font-size:18px;color:var(--pt);margin:8px 0">${esc(art.fullTitle||art.title)}</h2>`;
  html+=`<div style="font-size:12px;color:var(--pm);margin-bottom:8px">${esc(art.source)} · <a href="${esc(art.link)}" target="_blank" style="color:var(--ac)">${esc(art.link)}</a></div>`;
  if(art.intro) html+=`<p style="font-size:13px;color:var(--pt);line-height:1.5;margin-bottom:12px">${esc(art.intro)}</p>`;

  // Score breakdown
  html+=`<div class="sd-card" style="margin-top:8px"><div class="sd-card-title">Score breakdown</div>`;
  html+=`<table class="sr-table" style="font-size:12px"><thead><tr><th>Term</th><th>Type</th><th>Hits</th><th>Score</th></tr></thead><tbody>`;
  art.scoreDetails.forEach(d=>{
    html+=`<tr><td>${esc(d.term)}</td><td style="color:var(--pm)">${d.cat}</td><td>${d.hits}</td><td style="color:var(--ac);font-weight:700">${d.score}</td></tr>`;
  });
  html+=`</tbody></table></div>`;
  html+=`</div>`;

  out.innerHTML=html;
}

function backToMonList(){
  const out=document.getElementById('mon-results');
  if(out._monHTML){out.innerHTML=out._monHTML;out._monHTML=null;}
}

function exportMonitorCSV(){
  if(!monitorResults.length) return;
  const sorted=[...monitorResults].sort((a,b)=>b.score-a.score);
  const headers=['rank','score','bron','titel','url','intro','matches','afbeelding'];
  function csvVal(v){const s=String(v).replace(/"/g,'""');return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s+'"':s;}
  const rows=sorted.map((a,i)=>[
    i+1,a.score,a.source,a.fullTitle||a.title,a.link,a.intro||a.desc,
    a.scoreDetails.map(d=>d.term+'('+d.score+')').join(' | '),
    (a.image||'').split('?')[0]
  ].map(csvVal).join(','));
  const csv=headers.join(',')+'\n'+rows.join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=`monitor_${document.getElementById('mon-omroep').value}_${monitorResults.length}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// esc() defined in scraper.js
