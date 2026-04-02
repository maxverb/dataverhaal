// ── ARTICLE SCRAPER ──────────────────────────────────────────────────────

const SCRAPER_PROXIES=[
  url=>`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url=>`https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function scrapeURL(){
  const urlInput=document.getElementById('scrape-url');
  const status=document.getElementById('scrape-status');
  const results=document.getElementById('scrape-results');
  const url=urlInput.value.trim();
  if(!url){status.textContent='Voer een URL in';return;}

  status.textContent='Ophalen...';status.style.color='var(--ac)';
  results.innerHTML='';

  let html=null;
  for(const proxyFn of SCRAPER_PROXIES){
    try{
      const resp=await fetch(proxyFn(url));
      if(resp.ok){html=await resp.text();break;}
    }catch(e){}
  }

  if(!html){
    status.textContent='Kon pagina niet ophalen. Probeer de HTML te plakken.';
    status.style.color='#f87171';
    return;
  }

  const article=parseArticle(html,url);
  renderArticle(article,results);
  status.textContent=`✓ Geparsed`;status.style.color='#4ade80';
}

function scrapeFromPaste(){
  const pasteArea=document.getElementById('scrape-paste');
  const status=document.getElementById('scrape-status');
  const results=document.getElementById('scrape-results');
  const html=pasteArea.value.trim();
  if(!html){status.textContent='Plak HTML broncode';return;}

  const article=parseArticle(html,'(geplakt)');
  renderArticle(article,results);
  status.textContent=`✓ Geparsed`;status.style.color='#4ade80';
}

function parseArticle(html,sourceUrl){
  const doc=new DOMParser().parseFromString(html,'text/html');

  // ── HEADLINE ──
  const headline=
    doc.querySelector('h1.article__title')?.textContent?.trim()||
    doc.querySelector('h1[class*="title"]')?.textContent?.trim()||
    doc.querySelector('article h1')?.textContent?.trim()||
    doc.querySelector('h1')?.textContent?.trim()||
    doc.querySelector('meta[property="og:title"]')?.content||
    '';

  // ── INTRO / LEAD ──
  const intro=
    doc.querySelector('.article__intro')?.textContent?.trim()||
    doc.querySelector('.article__lead')?.textContent?.trim()||
    doc.querySelector('[class*="intro"]')?.textContent?.trim()||
    doc.querySelector('[class*="lead"]')?.textContent?.trim()||
    doc.querySelector('meta[property="og:description"]')?.content||
    doc.querySelector('meta[name="description"]')?.content||
    '';

  // ── BODY TEXT ──
  const bodyEl=
    doc.querySelector('.article__body')||
    doc.querySelector('.article-body')||
    doc.querySelector('[class*="article__content"]')||
    doc.querySelector('[class*="article-content"]')||
    doc.querySelector('article')||
    doc.querySelector('.post-content')||
    doc.querySelector('main');

  let bodyParagraphs=[];
  if(bodyEl){
    bodyParagraphs=[...bodyEl.querySelectorAll('p')]
      .map(p=>p.textContent.trim())
      .filter(t=>t.length>20);
  }

  // ── IMAGES ──
  const images=[];
  const imgEls=doc.querySelectorAll('article img, .article__body img, [class*="article"] img, main img, meta[property="og:image"]');
  imgEls.forEach(el=>{
    let src=el.tagName==='META'?el.content:(el.src||el.getAttribute('data-src')||el.getAttribute('data-lazy-src')||'');
    if(!src||src.startsWith('data:'))return;
    // Make absolute
    if(src.startsWith('/')&&sourceUrl!=='(geplakt)'){
      try{const u=new URL(sourceUrl);src=u.origin+src;}catch(e){}
    }
    const alt=el.alt||el.title||'';
    if(!images.some(i=>i.src===src)) images.push({src,alt});
  });

  // Also check og:image
  const ogImg=doc.querySelector('meta[property="og:image"]');
  if(ogImg&&ogImg.content&&!images.some(i=>i.src===ogImg.content)){
    images.unshift({src:ogImg.content,alt:'OG afbeelding'});
  }

  // ── VIDEOS ──
  const videos=[];
  doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="brightcove"], [class*="video"]').forEach(el=>{
    const src=el.src||el.querySelector('source')?.src||'';
    const type=el.tagName==='IFRAME'?'embed':'video';
    if(src) videos.push({src,type});
  });

  // ── AUDIO ──
  const audios=[];
  doc.querySelectorAll('audio, iframe[src*="soundcloud"], iframe[src*="spotify"], [class*="audio"]').forEach(el=>{
    const src=el.src||el.querySelector('source')?.src||'';
    if(src) audios.push({src});
  });

  // ── EMBEDS ──
  const embeds=[];
  doc.querySelectorAll('iframe, blockquote[class*="twitter"], blockquote[class*="instagram"], [class*="embed"]').forEach(el=>{
    const src=el.src||'';
    const cls=el.className||'';
    let type='embed';
    if(src.includes('twitter')||cls.includes('twitter')) type='twitter';
    else if(src.includes('instagram')||cls.includes('instagram')) type='instagram';
    else if(src.includes('youtube')) type='youtube';
    else if(src.includes('vimeo')) type='vimeo';
    if(src&&!videos.some(v=>v.src===src)&&!audios.some(a=>a.src===src))
      embeds.push({src,type});
  });

  // ── META ──
  const author=doc.querySelector('meta[name="author"]')?.content||
    doc.querySelector('[class*="author"]')?.textContent?.trim()||'';
  const pubDate=doc.querySelector('meta[property="article:published_time"]')?.content||
    doc.querySelector('time')?.getAttribute('datetime')||
    doc.querySelector('time')?.textContent?.trim()||'';

  return {headline,intro,bodyParagraphs,images,videos,audios,embeds,author,pubDate,sourceUrl};
}

function renderArticle(a,container){
  let html='';

  // Header
  if(a.headline) html+=`<div class="sr-section"><div class="sr-label">KOP</div><div class="sr-headline">${esc(a.headline)}</div></div>`;
  if(a.author||a.pubDate) html+=`<div class="sr-section"><div class="sr-label">META</div><div class="sr-meta">${esc(a.author)}${a.author&&a.pubDate?' · ':''}${esc(a.pubDate)}</div></div>`;
  if(a.intro) html+=`<div class="sr-section"><div class="sr-label">INTRO</div><div class="sr-intro">${esc(a.intro)}</div></div>`;

  // Body
  if(a.bodyParagraphs.length){
    html+=`<div class="sr-section"><div class="sr-label">TEKST (${a.bodyParagraphs.length} alinea's)</div>`;
    a.bodyParagraphs.forEach((p,i)=>{
      html+=`<div class="sr-para">${esc(p)}</div>`;
    });
    html+=`</div>`;
  }

  // Images
  if(a.images.length){
    html+=`<div class="sr-section"><div class="sr-label">AFBEELDINGEN (${a.images.length})</div><div class="sr-images">`;
    a.images.forEach(img=>{
      html+=`<div class="sr-img"><img src="${esc(img.src)}" alt="${esc(img.alt)}" onerror="this.style.display='none'"><span>${esc(img.alt||img.src.split('/').pop())}</span></div>`;
    });
    html+=`</div></div>`;
  }

  // Videos
  if(a.videos.length){
    html+=`<div class="sr-section"><div class="sr-label">VIDEO (${a.videos.length})</div>`;
    a.videos.forEach(v=>{html+=`<div class="sr-embed">${esc(v.type)}: ${esc(v.src)}</div>`;});
    html+=`</div>`;
  }

  // Audio
  if(a.audios.length){
    html+=`<div class="sr-section"><div class="sr-label">AUDIO (${a.audios.length})</div>`;
    a.audios.forEach(au=>{html+=`<div class="sr-embed">${esc(au.src)}</div>`;});
    html+=`</div>`;
  }

  // Embeds
  if(a.embeds.length){
    html+=`<div class="sr-section"><div class="sr-label">EMBEDS (${a.embeds.length})</div>`;
    a.embeds.forEach(e=>{html+=`<div class="sr-embed">${esc(e.type)}: ${esc(e.src)}</div>`;});
    html+=`</div>`;
  }

  // Summary stats
  const wordCount=a.bodyParagraphs.join(' ').split(/\s+/).length;
  html+=`<div class="sr-section"><div class="sr-label">SAMENVATTING</div><div class="sr-stats">`;
  html+=`<span>${wordCount} woorden</span>`;
  html+=`<span>${a.bodyParagraphs.length} alinea's</span>`;
  html+=`<span>${a.images.length} afbeeldingen</span>`;
  html+=`<span>${a.videos.length} video's</span>`;
  html+=`<span>${a.audios.length} audio</span>`;
  html+=`<span>${a.embeds.length} embeds</span>`;
  html+=`</div></div>`;

  // Copy button
  html+=`<button class="btn btn-p" onclick="copyScrapeText()" style="margin-top:8px">📋 Kopieer tekst</button>`;

  container.innerHTML=html;

  // Store for copy
  container.dataset.headline=a.headline;
  container.dataset.intro=a.intro;
  container.dataset.body=a.bodyParagraphs.join('\n\n');
}

function copyScrapeText(){
  const r=document.getElementById('scrape-results');
  const text=[r.dataset.headline,r.dataset.intro,r.dataset.body].filter(Boolean).join('\n\n');
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.querySelector('#scrape-results .btn-p');
    btn.textContent='✓ Gekopieerd';setTimeout(()=>{btn.textContent='📋 Kopieer tekst';},1500);
  });
}

function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
