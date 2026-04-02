// ── ARTICLE SCRAPER ──────────────────────────────────────────────────────

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

  // ── Find main content container ──
  // Priority: Rijnmond/West specific → generic article selectors
  const contentEl=
    doc.querySelector('.article-content')||
    doc.querySelector('.layout-components-group.article-content')||
    doc.querySelector('[class*="article-content"]')||
    doc.querySelector('.article__body')||
    doc.querySelector('.article-body')||
    doc.querySelector('[class*="article__content"]')||
    doc.querySelector('article')||
    doc.querySelector('main')||
    doc.body;

  // ── HEADLINE ──
  const headline=
    doc.querySelector('h1')?.textContent?.trim()||
    doc.querySelector('meta[property="og:title"]')?.content||'';

  // ── INTRO ──
  const intro=
    doc.querySelector('.article__intro')?.textContent?.trim()||
    doc.querySelector('[class*="intro"]')?.textContent?.trim()||
    doc.querySelector('[class*="lead"]')?.textContent?.trim()||
    doc.querySelector('meta[property="og:description"]')?.content||
    doc.querySelector('meta[name="description"]')?.content||'';

  // ── BODY TEXT — all text content from paragraphs within content container ──
  const paragraphs=[];
  contentEl.querySelectorAll('p').forEach(p=>{
    const t=p.textContent.trim();
    if(t.length>15) paragraphs.push(t);
  });
  // Also grab text from divs that might contain article text (Rijnmond uses divs)
  if(paragraphs.length<2){
    contentEl.querySelectorAll('div').forEach(div=>{
      // Skip containers that have many child elements (layout divs)
      if(div.children.length>3) return;
      const t=div.textContent.trim();
      if(t.length>30&&!paragraphs.includes(t)) paragraphs.push(t);
    });
  }
  const bodyText=paragraphs.join('\n\n');

  // ── IMAGES — search everywhere in content container + og:image ──
  const images=[];
  function addImg(src){
    if(!src||src.startsWith('data:')) return;
    if(src.startsWith('/')&&sourceUrl!=='(geplakt)'){try{src=new URL(sourceUrl).origin+src;}catch(e){}}
    if(!images.includes(src)) images.push(src);
  }
  const ogImg=doc.querySelector('meta[property="og:image"]');
  if(ogImg?.content) addImg(ogImg.content);
  contentEl.querySelectorAll('img').forEach(el=>{
    addImg(el.src||el.getAttribute('data-src')||el.getAttribute('data-lazy-src')||el.getAttribute('srcset')?.split(' ')[0]||'');
  });
  // Also check outside content container for hero images
  doc.querySelectorAll('.article-header img, .hero img, [class*="hero"] img, [class*="header"] img').forEach(el=>{
    addImg(el.src||el.getAttribute('data-src')||'');
  });

  // ── EMBEDS — everything that's not plain text/images ──
  const embeds=[];
  function addEmbed(type,val){
    if(val&&!embeds.some(e=>e.val===val)) embeds.push({type,val});
  }

  // Search in content container AND the whole document (embeds can be outside)
  const searchRoots=[contentEl,doc.body];
  searchRoots.forEach(root=>{
    // iframes
    root.querySelectorAll('iframe').forEach(el=>{
      const src=el.src||el.getAttribute('data-src')||'';
      if(!src) return;
      let type='iframe';
      if(src.includes('youtube')||src.includes('youtu.be')) type='youtube';
      else if(src.includes('vimeo')) type='vimeo';
      else if(src.includes('twitter')||src.includes('x.com')) type='twitter';
      else if(src.includes('instagram')) type='instagram';
      else if(src.includes('tiktok')) type='tiktok';
      else if(src.includes('soundcloud')||src.includes('spotify')) type='audio';
      else if(src.includes('facebook')) type='facebook';
      addEmbed(type,src);
    });

    // Blockquotes (Twitter/Instagram embeds)
    root.querySelectorAll('blockquote').forEach(el=>{
      const cls=(el.className||'').toLowerCase();
      const html=el.innerHTML||'';
      if(cls.includes('twitter')||cls.includes('tweet')||html.includes('twitter.com')||html.includes('x.com')){
        const link=el.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
        addEmbed('twitter',link?.href||el.textContent.trim().slice(0,200));
      } else if(cls.includes('instagram')||html.includes('instagram.com')){
        const link=el.querySelector('a[href*="instagram.com"]');
        addEmbed('instagram',link?.href||el.textContent.trim().slice(0,200));
      } else if(cls.includes('tiktok')||html.includes('tiktok.com')){
        const link=el.querySelector('a[href*="tiktok.com"]');
        addEmbed('tiktok',link?.href||'tiktok embed');
      }
    });

    // Video/audio elements
    root.querySelectorAll('video').forEach(el=>{
      const src=el.src||el.querySelector('source')?.src||'';
      addEmbed('video',src||'video element');
    });
    root.querySelectorAll('audio').forEach(el=>{
      const src=el.src||el.querySelector('source')?.src||'';
      addEmbed('audio',src||'audio element');
    });

    // Social embed scripts/containers (Rijnmond uses these)
    root.querySelectorAll('[class*="embed"], [class*="social"], [data-type]').forEach(el=>{
      const dataType=(el.getAttribute('data-type')||'').toLowerCase();
      const cls=(el.className||'').toLowerCase();
      if(dataType.includes('instagram')||cls.includes('instagram')){
        const link=el.querySelector('a[href*="instagram.com"]');
        addEmbed('instagram',link?.href||'instagram embed');
      } else if(dataType.includes('twitter')||cls.includes('twitter')){
        const link=el.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
        addEmbed('twitter',link?.href||'twitter embed');
      } else if(dataType.includes('youtube')||cls.includes('youtube')){
        addEmbed('youtube',el.querySelector('iframe')?.src||'youtube embed');
      }
    });
  });

  return {headline,intro,bodyText,images,embeds};
}

function renderTable(a){
  const out=document.getElementById('scrape-results');
  let html=`<table class="sr-table">
    <thead><tr><th>Element</th><th>Inhoud</th><th></th></tr></thead><tbody>`;
  html+=srRow('Kop',a.headline);
  html+=srRow('Intro',a.intro);
  html+=srRow('Tekst',a.bodyText);
  html+=srRow('Afbeeldingen',a.images.join('\n'));
  a.embeds.forEach(e=>{ html+=srRow(e.type.toUpperCase(),e.val); });
  html+=`</tbody></table>`;
  out.innerHTML=html;
}

function srRow(label,content){
  if(!content) return `<tr class="sr-row"><td class="sr-td-label">${esc(label)}</td><td class="sr-td-content sr-empty">—</td><td class="sr-td-copy"></td></tr>`;
  const id='sr-'+Math.random().toString(36).slice(2,8);
  const short=content.length>300?content.slice(0,300)+'…':content;
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
