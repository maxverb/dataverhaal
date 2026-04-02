// ── ARTICLE SCRAPER — regiogroei CMS (Rijnmond/West/DHFM) ──

const SCRAPER_PROXIES=[
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

  // ── TEKST — walk layout-components in order, interleave headers ──
  const textParts=[];
  const links=[];
  root.querySelectorAll('.layout-component').forEach(lc=>{
    // Header → prefix in text
    const header=lc.querySelector('.modern-header .heading, h2.heading');
    if(header){
      const t=header.textContent.trim();
      if(t&&t!==headline) textParts.push('\n[TUSSENKOP] '+t+'\n');
      return;
    }
    // Text block
    const textEl=lc.querySelector('.api-text .text');
    if(textEl){
      if(textEl===introEl) return; // skip intro
      const t=textEl.textContent.trim();
      if(t.length>10) textParts.push(t);
      // Extract hyperlinks
      textEl.querySelectorAll('a[href]').forEach(a=>{
        let href=a.getAttribute('href')||'';
        href=makeAbs(href,sourceUrl);
        const linkText=a.textContent.trim();
        if(href&&linkText) links.push({text:linkText,href});
      });
    }
  });
  const bodyText=textParts.join('\n\n');

  // ── AFBEELDINGEN ──
  const images=[];
  function addImg(src,desc){
    src=makeAbs(src,sourceUrl);
    if(!src||src.includes('avatar.png')||src.includes('placeholder')) return;
    if(!images.some(i=>i.src===src)) images.push({src,desc:desc||''});
  }
  const ogImg=doc.querySelector('meta[property="og:image"]');
  if(ogImg?.content) addImg(ogImg.content,'OG afbeelding');
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

  // Audio — Blue Billywig player (regiogroei)
  root.querySelectorAll('[__component="api.api-audio"], [type="audio"]').forEach(el=>{
    const audioEl=el.querySelector('audio');
    const audioSrc=audioEl?.src||audioEl?.getAttribute('src')||'';
    const dataSid=el.querySelector('[data-sid]')?.getAttribute('data-sid')||'';
    const poster=el.querySelector('.bb-poster-image')?.src||'';
    const desc=el.querySelector('.figcaption .description, .description')?.textContent?.trim()||'';
    const duration=el.querySelector('[data-duration]')?.getAttribute('data-duration');
    const durStr=duration?Math.floor(duration/60)+'m'+('0'+duration%60).slice(-2)+'s':'';
    const parts=[desc];
    if(audioSrc) parts.push('URL: '+audioSrc);
    if(dataSid) parts.push('ID: '+dataSid);
    if(durStr) parts.push('Duur: '+durStr);
    if(poster) parts.push('Thumbnail: '+poster);
    addEmbed('audio',parts.join('\n'),desc||'Audio fragment');
  });

  // Video — Blue Billywig or native
  root.querySelectorAll('[__component="api.api-video"], [type="video"]').forEach(el=>{
    const videoEl=el.querySelector('video');
    const videoSrc=videoEl?.src||videoEl?.querySelector('source')?.src||'';
    const dataSid=el.querySelector('[data-sid]')?.getAttribute('data-sid')||'';
    const poster=el.querySelector('.bb-poster-image')?.src||'';
    const desc=el.querySelector('.figcaption .description, .description')?.textContent?.trim()||'';
    const parts=[desc];
    if(videoSrc) parts.push('URL: '+videoSrc);
    if(dataSid) parts.push('ID: '+dataSid);
    if(poster) parts.push('Thumbnail: '+poster);
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

  return {headline,author,pubDate,intro,bodyText,links,images,embeds,related};
}

function renderTable(a){
  const out=document.getElementById('scrape-results');
  let html=`<table class="sr-table">
    <thead><tr><th>Element</th><th>Inhoud</th><th></th></tr></thead><tbody>`;
  html+=srRow('Kop',a.headline);
  if(a.author||a.pubDate) html+=srRow('Meta',[a.author,a.pubDate].filter(Boolean).join(' · '));
  html+=srRow('Intro',a.intro);
  html+=srRow('Tekst',a.bodyText);
  if(a.links.length) html+=srRow('Links',a.links.map(l=>l.text+' → '+l.href).join('\n'));
  html+=srRow('Afbeeldingen',a.images.map(i=>i.src+(i.desc?' — '+i.desc:'')).join('\n'));
  a.embeds.forEach(e=>html+=srRow(e.type.toUpperCase(),e.val));
  if(a.related.length) html+=srRow('Gerelateerd',a.related.map(r=>r.title+' → '+r.href).join('\n'));
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
