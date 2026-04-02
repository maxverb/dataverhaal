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

  // ── OG IMAGE ──
  const ogImageRaw=doc.querySelector('meta[property="og:image"]')?.content||'';
  const ogImage=ogImageRaw.split('?')[0];

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
      if(src&&!src.includes('avatar.png')) rawParts.push('[AFBEELDING] '+src.split('?')[0]+(desc?' — '+desc:'')+(cr?' '+cr:''));
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
    // Strip query params for cleaner URLs
    const cleanSrc=src.split('?')[0];
    // Skip if same base image as OG
    if(ogImage&&ogImage.split('?')[0]===cleanSrc) return;
    if(!images.some(i=>i.src===cleanSrc)) images.push({src:cleanSrc,desc:desc||''});
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

  // Instagram — try DOM first, then raw HTML regex
  const igFound=new Set();
  root.querySelectorAll('[__component="api.api-instagram"], [type="instagram"], .api-instagram').forEach(el=>{
    const iframe=el.querySelector('iframe');
    if(iframe?.src){
      const match=iframe.src.match(/instagram\.com\/(reel|p)\/([^/]+)/);
      if(match){const url=`https://www.instagram.com/${match[1]}/${match[2]}/`;igFound.add(url);addEmbed('instagram',url,'Instagram embed');}
      else{igFound.add(iframe.src);addEmbed('instagram',iframe.src,'Instagram embed');}
      return;
    }
    const link=el.querySelector('a[href*="instagram.com"]');
    if(link){igFound.add(link.href);addEmbed('instagram',link.href,'Instagram embed');return;}
    // Component exists but no iframe/link — mark for raw HTML fallback
    addEmbed('instagram','instagram embed gedetecteerd','');
  });
  // Raw HTML fallback: search for instagram.com/reel/ or /p/ URLs in the entire page
  const igMatches=[...rawHtml.matchAll(/instagram\.com\/(reel|p)\/([A-Za-z0-9_-]+)/g)];
  igMatches.forEach(m=>{
    const url=`https://www.instagram.com/${m[1]}/${m[2]}/`;
    if(!igFound.has(url)){igFound.add(url);addEmbed('instagram',url,'Instagram (uit pagina-data)');}
  });

  // ── ARTIKEL-ID uit URL ──
  const urlArticleId=(sourceUrl.match(/\/nieuws\/(\d+)\//)||[])[1]||'';

  // ── Audio/Video — Blue Billywig (search ENTIRE document, not just component) ──
  // Scan all BB wrapper divs in the full document for sourceids
  const bbPlayers=[];
  doc.querySelectorAll('[id*="sourceid_string_"]').forEach(el=>{
    const m=el.id.match(/sourceid_string_(\d+)/);
    if(!m) return;
    const mediaId=m[1];
    const wrapper=el.closest('.bb-media')||el.querySelector('.bb-media')||el;
    const dataSid=wrapper.getAttribute('data-sid')||'';
    const dur=wrapper.getAttribute('data-duration');
    const durStr=dur?Math.floor(dur/60)+'m'+('0'+dur%60).slice(-2)+'s':'';
    // Find audio/video src
    const audioEl=el.querySelector('audio')||doc.querySelector(`#${el.id} audio`);
    const videoEl=el.querySelector('video')||doc.querySelector(`#${el.id} video`);
    const mediaSrc=audioEl?.src||audioEl?.getAttribute('src')||videoEl?.src||videoEl?.getAttribute('src')||'';
    const type=el.id.includes('audioplayer')?'audio':'video';
    // Poster image
    const posterEl=el.querySelector('.bb-poster-image')||el.querySelector('img[class*="poster"]');
    const poster=posterEl?.src||posterEl?.getAttribute('src')||'';
    // Also search via raw HTML regex for this specific ID
    let cdnUrl=mediaSrc;
    if(!cdnUrl){
      const cdnMatch=rawHtml.match(new RegExp(`https?://[^"'\\s]*/${mediaId}_[^"'\\s]*\\.mp[34]`));
      if(cdnMatch) cdnUrl=cdnMatch[0];
    }
    if(!poster){
      const posterMatch=rawHtml.match(new RegExp(`https?://[^"'\\s]*mediaclip/\\d+/pthumbnail[^"'\\s]*`));
      if(posterMatch) bbPlayers.poster=posterMatch[0];
    }
    bbPlayers.push({mediaId,type,mediaSrc:cdnUrl,dataSid,durStr,poster});
  });

  // Also scan raw HTML for sourceid patterns not in DOM
  if(!bbPlayers.length){
    const rawMatches=[...rawHtml.matchAll(/sourceid_string_(\d+)/g)];
    const seen=new Set();
    rawMatches.forEach(m=>{
      if(seen.has(m[1]))return;seen.add(m[1]);
      const type=rawHtml.includes(m[1]+'.*audioplayer')||rawHtml.includes('audioplayer.*'+m[1])?'audio':'audio';
      const cdnMatch=rawHtml.match(new RegExp(`https?://[^"'\\s]*/${m[1]}_[^"'\\s]*\\.mp[34]`));
      const sidMatch=rawHtml.match(new RegExp(`data-sid="([^"]+)"[^>]*${m[1]}|${m[1]}[^>]*data-sid="([^"]+)"`));
      const durMatch=rawHtml.match(new RegExp(`data-duration="(\\d+)"[^>]*${m[1]}|${m[1]}[^>]*data-duration="(\\d+)"`));
      const posterMatch=rawHtml.match(/mediaclip\/\d+\/pthumbnail\/[^"'\s]+/);
      bbPlayers.push({
        mediaId:m[1],type,
        mediaSrc:cdnMatch?cdnMatch[0]:'',
        dataSid:sidMatch?(sidMatch[1]||sidMatch[2]):'',
        durStr:durMatch?Math.floor((durMatch[1]||durMatch[2])/60)+'m'+('0'+(durMatch[1]||durMatch[2])%60).slice(-2)+'s':'',
        poster:posterMatch?'https://rijnmond.bbvms.com/'+posterMatch[0]:''
      });
    });
  }

  // Match BB players to audio/video components
  let bbIdx=0;
  root.querySelectorAll('[__component="api.api-audio"], [type="audio"]').forEach(el=>{
    const desc=el.querySelector('.figcaption .description, .description')?.textContent?.trim()||
      el.querySelector('.figcaption')?.textContent?.trim()||'';
    const bb=bbPlayers[bbIdx++]||{};
    const parts=[];
    if(desc) parts.push(desc);
    if(bb.mediaId) parts.push('Media-ID: '+bb.mediaId);
    if(bb.mediaSrc) parts.push('URL: '+bb.mediaSrc);
    if(bb.dataSid) parts.push('SID: '+bb.dataSid);
    if(bb.durStr) parts.push('Duur: '+bb.durStr);
    if(bb.poster) parts.push('Thumbnail: '+bb.poster);
    addEmbed('audio',parts.join('\n'),desc||'Audio fragment');
  });
  root.querySelectorAll('[__component="api.api-video"], [type="video"]').forEach(el=>{
    const desc=el.querySelector('.figcaption .description, .description')?.textContent?.trim()||
      el.querySelector('.figcaption')?.textContent?.trim()||'';
    const bb=bbPlayers[bbIdx++]||{};
    const parts=[];
    if(desc) parts.push(desc);
    if(bb.mediaId) parts.push('Media-ID: '+bb.mediaId);
    if(bb.mediaSrc) parts.push('URL: '+bb.mediaSrc);
    if(bb.dataSid) parts.push('SID: '+bb.dataSid);
    if(bb.durStr) parts.push('Duur: '+bb.durStr);
    if(bb.poster) parts.push('Thumbnail: '+bb.poster);
    addEmbed('video',parts.join('\n'),desc||'Video fragment');
  });

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

  return {headline,author,pubDate,ogImage,intro,bodyText,links,images,embeds,related,urlArticleId,rawText:rawParts.join('\n')};
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
  if(a.urlArticleId) html+=srRow('Artikel-ID',a.urlArticleId);
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
