// ── ARTICLE SCRAPER — optimized for regiogroei CMS (Rijnmond/West/DHFM) ──

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

function parseArticle(html,sourceUrl){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const root=doc.querySelector('.article-content')||doc.querySelector('article')||doc.querySelector('main')||doc.body;

  // ── KOP ──
  const headline=(root.querySelector('h1.heading')||root.querySelector('h1')||doc.querySelector('h1'))?.textContent?.trim()||
    doc.querySelector('meta[property="og:title"]')?.content||'';

  // ── AUTEUR ──
  const author=(root.querySelector('.groei-wa-author-links a')||root.querySelector('[class*="author"] a')||doc.querySelector('meta[name="author"]'))?.textContent?.trim()||
    doc.querySelector('meta[name="author"]')?.content||'';

  // ── DATUM ──
  const dateEl=root.querySelector('.groei-wa-article-info');
  const pubDate=dateEl?dateEl.textContent.replace(/\s+/g,' ').trim():'';

  // ── INTRO — first highlight text block ──
  const introEl=root.querySelector('.layout-component.highlight .api-text .text')||
    root.querySelector('.layout-component.highlight .text')||
    root.querySelector('[class*="intro"]');
  const intro=introEl?.textContent?.trim()||
    doc.querySelector('meta[property="og:description"]')?.content||'';

  // ── TEKST — all api-text .text blocks (excluding the intro) ──
  const textBlocks=[];
  root.querySelectorAll('.api-text .text, [__component="api.api-text"] .text').forEach(el=>{
    if(el===introEl) return;
    const t=el.textContent.trim();
    if(t.length>10) textBlocks.push(t);
  });
  if(!textBlocks.length){
    root.querySelectorAll('p').forEach(p=>{
      const t=p.textContent.trim();
      if(t.length>20) textBlocks.push(t);
    });
  }
  const bodyText=textBlocks.join('\n\n');

  // ── TUSSENKOPPEN ──
  const subheadings=[];
  root.querySelectorAll('.modern-header .heading, h2.heading, h2').forEach(el=>{
    const t=el.textContent.trim();
    if(t&&t!==headline) subheadings.push(t);
  });

  // ── AFBEELDINGEN — URLs + beschrijving ──
  const images=[];
  function addImg(src,desc){
    if(!src||src.startsWith('data:')) return;
    if(src.includes('avatar.png')||src.includes('placeholder')) return; // skip avatars
    if(src.startsWith('/')&&sourceUrl!=='(geplakt)'){try{src=new URL(sourceUrl).origin+src;}catch(e){}}
    if(!images.some(i=>i.src===src)) images.push({src,desc:desc||''});
  }
  const ogImg=doc.querySelector('meta[property="og:image"]');
  if(ogImg?.content) addImg(ogImg.content,'OG afbeelding');
  root.querySelectorAll('[__component="api.api-image"], figure.responsive-image').forEach(fig=>{
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

  // Instagram — multiple detection methods
  root.querySelectorAll('[__component="api.api-instagram"], [type="instagram"], .api-instagram, [class*="instagram"]').forEach(el=>{
    // Try iframe first (client-side rendered)
    const iframe=el.querySelector('iframe');
    if(iframe?.src){
      const match=iframe.src.match(/instagram\.com\/(reel|p)\/([^/]+)/);
      addEmbed('instagram',match?`https://www.instagram.com/${match[1]}/${match[2]}/`:iframe.src,'Instagram embed');
      return;
    }
    // Try data attributes (server-side)
    const dataUrl=el.getAttribute('data-url')||el.getAttribute('data-href')||'';
    if(dataUrl&&dataUrl.includes('instagram')){addEmbed('instagram',dataUrl,'Instagram embed');return;}
    // Try any link inside
    const link=el.querySelector('a[href*="instagram.com"]');
    if(link){addEmbed('instagram',link.href,'Instagram embed');return;}
    // Try embedo container (regiogroei uses embedo)
    const embedo=el.querySelector('[data-embedo-source="instagram"]');
    if(embedo){
      const id=el.id||el.querySelector('[id]')?.id||'';
      addEmbed('instagram','instagram embed (id: '+id+')','Instagram embed — iframe niet geladen door proxy');
      return;
    }
    // Fallback: just note it exists
    addEmbed('instagram','instagram embed gedetecteerd','Embed niet volledig geladen — check de pagina');
  });

  root.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach(el=>{
    addEmbed('youtube',el.src,'YouTube video');
  });

  root.querySelectorAll('blockquote[class*="twitter"], [class*="twitter-tweet"]').forEach(el=>{
    const link=el.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
    addEmbed('twitter',link?.href||'twitter embed','Twitter/X post');
  });

  root.querySelectorAll('blockquote[class*="tiktok"], [class*="tiktok"]').forEach(el=>{
    const link=el.querySelector('a[href*="tiktok.com"]');
    addEmbed('tiktok',link?.href||'tiktok embed','TikTok video');
  });

  root.querySelectorAll('video').forEach(el=>{
    addEmbed('video',el.src||el.querySelector('source')?.src||'video','Video');
  });
  root.querySelectorAll('audio').forEach(el=>{
    addEmbed('audio',el.src||el.querySelector('source')?.src||'audio','Audio');
  });

  root.querySelectorAll('iframe').forEach(el=>{
    const src=el.src||'';
    if(!src||embeds.some(e=>e.val===src)) return;
    if(src.includes('instagram')||src.includes('youtube')||src.includes('twitter')) return;
    addEmbed('iframe',src,'Overig embed');
  });

  // ── GERELATEERD ──
  const related=[];
  root.querySelectorAll('.news-category-list .groei-wa-news-article a, .news-list-item a').forEach(a=>{
    const title=a.querySelector('h3')?.textContent?.trim();
    let href=a.getAttribute('href')||'';
    if(href.startsWith('/')&&sourceUrl!=='(geplakt)'){try{href=new URL(sourceUrl).origin+href;}catch(e){}}
    if(title&&!related.some(r=>r.title===title)) related.push({title,href});
  });

  return {headline,author,pubDate,intro,bodyText,subheadings,images,embeds,related};
}

function renderTable(a){
  const out=document.getElementById('scrape-results');
  let html=`<table class="sr-table">
    <thead><tr><th>Element</th><th>Inhoud</th><th></th></tr></thead><tbody>`;
  html+=srRow('Kop',a.headline);
  if(a.author||a.pubDate) html+=srRow('Meta',[a.author,a.pubDate].filter(Boolean).join(' · '));
  html+=srRow('Intro',a.intro);
  if(a.subheadings.length) html+=srRow('Tussenkoppen',a.subheadings.join(' | '));
  html+=srRow('Tekst',a.bodyText);
  html+=srRow('Afbeeldingen',a.images.map(i=>i.src+(i.desc?' — '+i.desc:'')).join('\n'));
  a.embeds.forEach(e=>html+=srRow(e.type.toUpperCase(),e.val));
  if(a.related.length) html+=srRow('Gerelateerd',a.related.map(r=>r.title+' → '+r.href).join('\n'));
  html+=`</tbody></table>`;
  out.innerHTML=html;
}

function srRow(label,content){
  if(!content) return `<tr class="sr-row"><td class="sr-td-label">${esc(label)}</td><td class="sr-td-content sr-empty">—</td><td class="sr-td-copy"></td></tr>`;
  const id='sr-'+Math.random().toString(36).slice(2,8);
  const short=content; // show full content, cell is scrollable via CSS
  return `<tr class="sr-row">
    <td class="sr-td-label">${esc(label)}</td>
    <td class="sr-td-content" id="${id}">${esc(short).replace(/\n/g,'<br>')}</td>
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
