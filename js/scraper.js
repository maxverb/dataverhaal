// ── ARTICLE SCRAPER — regiogroei CMS (Rijnmond/West/DHFM) ──

const SCRAPER_PROXIES=[
  url=>`https://dataverhaal-scraper.maxverb.workers.dev/?url=${encodeURIComponent(url)}`,
  url=>`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url=>`https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function scrapeURL(){
  const url=document.getElementById('scrape-url').value.trim();
  const status=document.getElementById('scrape-status');
  if(!url){status.textContent='Voer een URL in';return;}
  status.textContent='Ophalen...';status.style.color='var(--ac)';
  let html=null;
  for(const proxyFn of SCRAPER_PROXIES){
    try{const r=await fetch(proxyFn(url));if(r.ok){html=await r.text();break;}}catch(e){}
  }
  if(!html){status.textContent='Kon pagina niet ophalen. Plak HTML.';status.style.color='#f87171';return;}
  renderTable(parseArticle(html,url));
  status.textContent='✓ Geparsed';status.style.color='#4ade80';
}

function scrapeFromPaste(){
  const html=document.getElementById('scrape-paste').value.trim();
  const status=document.getElementById('scrape-status');
  if(!html){status.textContent='Plak HTML broncode';return;}
  renderTable(parseArticle(html,'(geplakt)'));
  status.textContent='✓ Geparsed';status.style.color='#4ade80';
}

function makeAbs(src,sourceUrl){
  if(!src||src.startsWith('data:')) return '';
  if(src.startsWith('/')&&sourceUrl!=='(geplakt)'){try{return new URL(sourceUrl).origin+src;}catch(e){}}
  return src;
}

function parseArticle(html,sourceUrl){
  const rawHtml=html; // keep raw string for regex fallbacks
  const doc=new DOMParser().parseFromString(html,'text/html');
  const root=doc.querySelector('.article-content')||doc.querySelector('article')||doc.querySelector('main')||doc.body;

  // ── KOP ──
  const headline=(root.querySelector('h1.heading')||root.querySelector('h1')||doc.querySelector('h1'))?.textContent?.trim()||
    doc.querySelector('meta[property="og:title"]')?.content||'';

  // ── AUTEUR ──
  const author=(root.querySelector('.groei-wa-author-links a')||root.querySelector('[class*="author"] a'))?.textContent?.trim()||
    doc.querySelector('meta[name="author"]')?.content||'';

  // ── DATUM ──
  const dateEl=root.querySelector('.groei-wa-article-info');
  const pubDate=dateEl?dateEl.textContent.replace(/\s+/g,' ').trim():'';

  // ── INTRO — first highlight block ──
  const introEl=root.querySelector('.layout-component.highlight .api-text .text')||
    root.querySelector('.layout-component.highlight .text')||
    root.querySelector('[class*="intro"]');
  const intro=introEl?.textContent?.trim()||
    doc.querySelector('meta[property="og:description"]')?.content||'';

  // ── OG IMAGE (declare early so rawParts can use it) ──
  const ogImage=doc.querySelector('meta[property="og:image"]')?.content||'';

  // ── TEKST — walk layout-components in order, interleave headers ──
  const textParts=[];
  const links=[];
  const rawParts=[]; // unified raw output with tags

  // Start with headline + OG + intro
  if(headline) rawParts.push('[KOP] '+headline);
  if(ogImage) rawParts.push('[OG AFBEELDING] '+ogImage);
  if(author||pubDate) rawParts.push('[META] '+[author,pubDate].filter(Boolean).join(' · '));
  if(intro) rawParts.push('[INTRO] '+intro);

  root.querySelectorAll('.layout-component').forEach(lc=>{
    // Header
    const header=lc.querySelector('.modern-header .heading, h2.heading');
    if(header){
      const t=header.textContent.trim();
      if(t&&t!==headline){
        textParts.push('\n[TUSSENKOP] '+t+'\n');
        rawParts.push('[TUSSENKOP] '+t);
      }
      return;
    }
    // Text block
    const textEl=lc.querySelector('.api-text .text');
    if(textEl){
      if(textEl===introEl) return;
      const t=textEl.textContent.trim();
      if(t.length>10){
        textParts.push(t);
        rawParts.push('[TEKST] '+t);
      }
      textEl.querySelectorAll('a[href]').forEach(a=>{
        let href=a.getAttribute('href')||'';
        href=makeAbs(href,sourceUrl);
        const linkText=a.textContent.trim();
        if(href&&linkText){
          links.push({text:linkText,href});
          rawParts.push('[LINK] '+linkText+' → '+href);
        }
      });
      return;
    }
    // Image
    const imgComp=lc.querySelector('[__component="api.api-image"], figure.responsive-image');
    if(imgComp&&!lc.closest('.news-category-list')){
      const img=imgComp.querySelector('img');
      const src=makeAbs(img?.getAttribute('data-src')||img?.src||'',sourceUrl);
      const desc=imgComp.querySelector('.description')?.textContent?.trim()||img?.alt||'';
      const cr=imgComp.querySelector('.copyright')?.textContent?.trim()||'';
      if(src&&!src.includes('avatar.png')) rawParts.push('[AFBEELDING] '+src+(desc?' — '+desc:'')+(cr?' '+cr:''));
      return;
    }
    // Audio
    if(lc.querySelector('[__component="api.api-audio"], [type="audio"]')){
      const desc=lc.querySelector('.figcaption .description, .description')?.textContent?.trim()||'audio';
      rawParts.push('[AUDIO] '+desc);
      return;
    }
    // Video
    if(lc.querySelector('[__component="api.api-video"], [type="video"]')){
      const desc=lc.querySelector('.figcaption .description, .description')?.textContent?.trim()||'video';
      rawParts.push('[VIDEO] '+desc);
      return;
    }
    // Instagram
    if(lc.querySelector('[__component="api.api-instagram"], [type="instagram"]')){
      rawParts.push('[EMBED INSTAGRAM]');
      return;
    }
    // Related articles (Lees ook)
    const related=lc.querySelector('.news-category-list');
    if(related){
      related.querySelectorAll('.groei-wa-news-article a').forEach(a=>{
        const title=a.querySelector('h3')?.textContent?.trim();
        let href=makeAbs(a.getAttribute('href')||'',sourceUrl);
        if(title) rawParts.push('[LEES OOK] '+title+' → '+href);
      });
      return;
    }
  });
  const bodyText=textParts.join('\n\n');

  // ── AFBEELDINGEN ──
  const images=[];
  function addImg(src,desc){
    src=makeAbs(src,sourceUrl);
    if(!src||src.includes('avatar.png')||src.includes('placeholder')) return;
    // Skip if same base image as OG (different size params)
    if(ogImage){const ogBase=ogImage.split('?')[0];const srcBase=src.split('?')[0];if(ogBase===srcBase)return;}
    if(!images.some(i=>i.src===src)) images.push({src,desc:desc||''});
  }
  // Article images (excluding OG duplicate)
  root.querySelectorAll('[__component="api.api-image"], figure.responsive-image').forEach(fig=>{
    // Skip images inside news-category-list (related articles)
    if(fig.closest('.news-category-list')) return;
    const img=fig.querySelector('img');
    const src=img?.getAttribute('data-src')||img?.src||'';
    const desc=fig.querySelector('.description')?.textContent?.trim()||img?.alt||'';
    const cr=fig.querySelector('.copyright')?.textContent?.trim()||'';
    addImg(src,desc+(cr?' '+cr:''));
  });

  // ── EMBEDS ──
  const embeds=[];
  function addEmbed(type,val,detail){
    if(val&&!embeds.some(e=>e.val===val)) embeds.push({type,val,detail:detail||''});
  }

  // Instagram
  root.querySelectorAll('[__component="api.api-instagram"], [type="instagram"], .api-instagram, [class*="instagram"]').forEach(el=>{
    const iframe=el.querySelector('iframe');
    if(iframe?.src){
      const match=iframe.src.match(/instagram\.com\/(reel|p)\/([^/]+)/);
      addEmbed('instagram',match?`https://www.instagram.com/${match[1]}/${match[2]}/`:iframe.src,'Instagram embed');
      return;
    }
    const link=el.querySelector('a[href*="instagram.com"]');
    if(link){addEmbed('instagram',link.href,'Instagram embed');return;}
    const embedo=el.querySelector('[data-embedo-source="instagram"]');
    if(embedo){addEmbed('instagram','instagram embed (embedo)','Instagram — niet volledig geladen door proxy');return;}
    addEmbed('instagram','instagram embed gedetecteerd','Embed niet volledig geladen');
  });

  // Audio/Video — Blue Billywig player (regiogroei)
  // First: scan entire raw HTML for ALL BB media IDs (works regardless of rendering)
  const bbMediaIds=[];
  const bbPatterns=[
    /sourceid_string_(\d+)/g,
    /\/(\d{7,})_(?:audio|video)[^"']*/g,
    /mediaclip\/(\d+)/g,
    /data-src="[^"]*\/(\d{7,})_/g,
  ];
  bbPatterns.forEach(p=>{let m;while((m=p.exec(rawHtml))!==null){if(!bbMediaIds.includes(m[1]))bbMediaIds.push(m[1]);}});

  // Also find all BB CDN URLs
  const bbUrls=[];
  const urlPattern=/https?:\/\/[^"'\s]*bluebillywig[^"'\s]*\.mp[34][^"'\s]*/g;
  let um;while((um=urlPattern.exec(rawHtml))!==null){if(!bbUrls.includes(um[0]))bbUrls.push(um[0]);}
  // Also regiogroei CDN
  const rgUrlPattern=/https?:\/\/[^"'\s]*regiogroei[^"'\s]*\.mp[34][^"'\s]*/g;
  while((um=rgUrlPattern.exec(rawHtml))!==null){if(!bbUrls.includes(um[0]))bbUrls.push(um[0]);}

  // Extract article ID from source URL as ultimate fallback for media IDs
  const urlArticleId=(sourceUrl.match(/\/nieuws\/(\d+)\//)||[])[1]||'';

  function parseBBMedia(el,type,idx){
    let mediaId='', mediaSrc='', dataSid='', poster='', durStr='';

    // DOM methods (work when HTML is pasted from browser)
    const mediaEl=el.querySelector(type==='audio'?'audio':'video');
    if(mediaEl) mediaSrc=mediaEl.src||mediaEl.getAttribute('src')||'';
    const wrapperEl=el.querySelector('[id*="sourceid_string_"]');
    if(wrapperEl){const m=wrapperEl.id.match(/sourceid_string_(\d+)/);if(m)mediaId=m[1];}
    if(!mediaId&&mediaSrc){const m=mediaSrc.match(/\/(\d{5,})_/);if(m)mediaId=m[1];}
    dataSid=el.querySelector('[data-sid]')?.getAttribute('data-sid')||'';
    poster=el.querySelector('.bb-poster-image')?.src||el.querySelector('img[class*="poster"]')?.src||'';
    const dur=el.querySelector('[data-duration]')?.getAttribute('data-duration');
    if(dur) durStr=Math.floor(dur/60)+'m'+('0'+dur%60).slice(-2)+'s';

    // Fallback 1: pre-scanned IDs/URLs from raw HTML
    if(!mediaId&&bbMediaIds[idx]) mediaId=bbMediaIds[idx];
    if(!mediaSrc&&bbUrls[idx]) mediaSrc=bbUrls[idx];

    // Fallback 2: try the component's own ID attribute — regiogroei sometimes uses
    // the article ID as the BB sourceid for the audio player
    if(!mediaId){
      const compId=el.id||'';
      // Search for any numeric sequence in nearby script tags or data attrs
      const elHtml=el.outerHTML||'';
      const numMatch=elHtml.match(/(?:sourceid|sourceId|clipid|clip_id|mediaId|media_id|playout_id)[\W]*['"]?(\d{5,})/i);
      if(numMatch) mediaId=numMatch[1];
    }

    // Fallback 3: article URL ID — regiogroei often uses the same ID
    if(!mediaId&&urlArticleId) mediaId=urlArticleId;

    // Construct URLs from media ID
    if(!mediaSrc&&mediaId){
      mediaSrc=`https://s-aefc8d5f.b.cdn.bluebillywig.com/2026/video/${mediaId}_audio-mp3.mp3`;
    }
    // BB thumbnail URL pattern
    if(!poster&&mediaId){
      poster=`https://rijnmond.bbvms.com/mediaclip/${mediaId}/pthumbnail/576/324.webp`;
    }

    const desc=el.querySelector('.figcaption .description, .description')?.textContent?.trim()||
      el.querySelector('.figcaption')?.textContent?.trim()||'';

    const parts=[];
    if(desc) parts.push(desc);
    if(mediaId) parts.push('Media-ID: '+mediaId);
    if(mediaSrc) parts.push('URL: '+mediaSrc);
    if(dataSid) parts.push('SID: '+dataSid);
    if(durStr) parts.push('Duur: '+durStr);
    if(poster) parts.push('Thumbnail: '+poster);
    if(!parts.length) parts.push(type+' embed gedetecteerd');
    addEmbed(type,parts.join('\n'),desc||type+' fragment');
  }
  let bbIdx=0;
  root.querySelectorAll('[__component="api.api-audio"], [type="audio"]').forEach(el=>parseBBMedia(el,'audio',bbIdx++));
  root.querySelectorAll('[__component="api.api-video"], [type="video"]').forEach(el=>parseBBMedia(el,'video',bbIdx++));

  // YouTube
  root.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach(el=>{
    addEmbed('youtube',el.src,'YouTube video');
  });

  // Twitter/X
  root.querySelectorAll('blockquote[class*="twitter"], [class*="twitter-tweet"]').forEach(el=>{
    const link=el.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
    addEmbed('twitter',link?.href||'twitter embed','Twitter/X post');
  });

  // TikTok
  root.querySelectorAll('blockquote[class*="tiktok"], [class*="tiktok"]').forEach(el=>{
    const link=el.querySelector('a[href*="tiktok.com"]');
    addEmbed('tiktok',link?.href||'tiktok embed','TikTok video');
  });

  // ── GERELATEERD ──
  const related=[];
  root.querySelectorAll('.news-category-list .groei-wa-news-article a, .news-list-item a').forEach(a=>{
    const title=a.querySelector('h3')?.textContent?.trim();
    let href=makeAbs(a.getAttribute('href')||'',sourceUrl);
    if(title&&!related.some(r=>r.title===title)) related.push({title,href});
  });

  return {headline,author,pubDate,ogImage,intro,bodyText,links,images,embeds,related,rawText:rawParts.join('\n')};
}

function renderTable(a){
  const out=document.getElementById('scrape-results');

  // ── STATS DASHBOARD ──
  const kopWoorden=a.headline?a.headline.split(/\s+/).length:0;
  const introWoorden=a.intro?a.intro.split(/\s+/).length:0;
  const tekstWoorden=a.bodyText?a.bodyText.replace(/\[TUSSENKOP\][^\n]*/g,'').split(/\s+/).filter(w=>w).length:0;
  const tussenkoppen=(a.bodyText.match(/\[TUSSENKOP\]/g)||[]).length;
  const alineas=a.bodyText.split(/\n\n+/).filter(p=>p.trim()&&!p.includes('[TUSSENKOP]')).length;
  const audioCount=a.embeds.filter(e=>e.type==='audio').length;
  const videoCount=a.embeds.filter(e=>e.type==='video').length;
  const embedCount=a.embeds.filter(e=>e.type!=='audio'&&e.type!=='video').length;

  function stat(num,lbl){return `<div class="sr-stat"><span class="sr-stat-num">${num}</span><span class="sr-stat-lbl">${lbl}</span></div>`;}
  let html=`<div class="sr-stats">`;
  html+=stat(kopWoorden,'wrd kop');
  html+=stat(introWoorden,'wrd intro');
  html+=stat(tekstWoorden,'wrd tekst');
  html+=stat(alineas,"alinea's");
  html+=stat(tussenkoppen,'tussenkoppen');
  html+=stat(a.images.length,'afbeeldingen');
  html+=stat(a.links.length,'links');
  html+=stat(a.related.length,'lees ook');
  if(audioCount) html+=stat(audioCount,'audio');
  if(videoCount) html+=stat(videoCount,'video');
  if(embedCount) html+=stat(embedCount,'embeds');
  html+=`</div>`;

  // ── TABLE ──
  html+=`<table class="sr-table">
    <thead><tr><th>Element</th><th>Inhoud</th><th></th></tr></thead><tbody>`;
  html+=srRow('Kop',a.headline);
  if(a.ogImage) html+=srRow('OG Image',a.ogImage);
  if(a.author||a.pubDate) html+=srRow('Meta',[a.author,a.pubDate].filter(Boolean).join(' · '));
  html+=srRow('Intro',a.intro);
  html+=srRow('Tekst',a.bodyText);
  if(a.links.length) html+=srRow('Links',a.links.map(l=>l.text+' → '+l.href).join('\n'));
  html+=srRow('Afbeeldingen',a.images.map(i=>i.src+(i.desc?' — '+i.desc:'')).join('\n'));
  a.embeds.forEach(e=>html+=srRow(e.type.toUpperCase(),e.val));
  if(a.related.length) html+=srRow('Gerelateerd',a.related.map(r=>r.title+' → '+r.href).join('\n'));
  html+=srRow('Alles (ruw)',a.rawText);
  html+=`</tbody></table>`;
  out.innerHTML=html;
}

function srRow(label,content){
  if(!content) return `<tr class="sr-row"><td class="sr-td-label">${esc(label)}</td><td class="sr-td-content sr-empty">—</td><td class="sr-td-copy"></td></tr>`;
  const id='sr-'+Math.random().toString(36).slice(2,8);
  return `<tr class="sr-row">
    <td class="sr-td-label">${esc(label)}</td>
    <td class="sr-td-content" id="${id}">${esc(content).replace(/\n/g,'<br>')}</td>
    <td class="sr-td-copy"><button class="btn btn-sm" onclick="copySrCell('${id}','${btoa(unescape(encodeURIComponent(content)))}',this)">📋</button></td>
  </tr>`;
}

function copySrCell(id,b64,btn){
  const text=decodeURIComponent(escape(atob(b64)));
  navigator.clipboard.writeText(text).then(()=>{
    btn.textContent='✓';setTimeout(()=>{btn.textContent='📋';},1000);
  });
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
