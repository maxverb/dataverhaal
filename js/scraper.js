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

  const headline=
    doc.querySelector('h1.article__title')?.textContent?.trim()||
    doc.querySelector('h1[class*="title"]')?.textContent?.trim()||
    doc.querySelector('article h1')?.textContent?.trim()||
    doc.querySelector('h1')?.textContent?.trim()||
    doc.querySelector('meta[property="og:title"]')?.content||'';

  const intro=
    doc.querySelector('.article__intro')?.textContent?.trim()||
    doc.querySelector('.article__lead')?.textContent?.trim()||
    doc.querySelector('[class*="intro"]')?.textContent?.trim()||
    doc.querySelector('[class*="lead"]')?.textContent?.trim()||
    doc.querySelector('meta[property="og:description"]')?.content||
    doc.querySelector('meta[name="description"]')?.content||'';

  const bodyEl=doc.querySelector('.article__body')||doc.querySelector('.article-body')||
    doc.querySelector('[class*="article__content"]')||doc.querySelector('[class*="article-content"]')||
    doc.querySelector('article')||doc.querySelector('main');
  const bodyText=bodyEl?[...bodyEl.querySelectorAll('p')].map(p=>p.textContent.trim()).filter(t=>t.length>20).join('\n\n'):'';

  // Images — only URLs
  const images=[];
  const imgEls=doc.querySelectorAll('article img, .article__body img, [class*="article"] img, main img');
  imgEls.forEach(el=>{
    let src=el.src||el.getAttribute('data-src')||el.getAttribute('data-lazy-src')||'';
    if(!src||src.startsWith('data:'))return;
    if(src.startsWith('/')&&sourceUrl!=='(geplakt)'){try{src=new URL(sourceUrl).origin+src;}catch(e){}}
    if(!images.includes(src)) images.push(src);
  });
  const ogImg=doc.querySelector('meta[property="og:image"]');
  if(ogImg?.content&&!images.includes(ogImg.content)) images.unshift(ogImg.content);

  // Embeds
  const embeds=[];
  doc.querySelectorAll('video, audio, iframe, blockquote[class*="twitter"], blockquote[class*="instagram"]').forEach(el=>{
    const src=el.src||el.querySelector('source')?.src||'';
    const cls=(el.className||'').toLowerCase();
    const tag=el.tagName.toLowerCase();
    let type=tag;
    if(src.includes('youtube')||cls.includes('youtube')) type='youtube';
    else if(src.includes('vimeo')) type='vimeo';
    else if(src.includes('twitter')||cls.includes('twitter')) type='twitter';
    else if(src.includes('instagram')||cls.includes('instagram')) type='instagram';
    else if(src.includes('soundcloud')||src.includes('spotify')) type='audio';
    else if(tag==='video') type='video';
    else if(tag==='audio') type='audio';
    const val=src||el.outerHTML.slice(0,200);
    if(val&&!embeds.some(e=>e.val===val)) embeds.push({type,val});
  });

  return {headline,intro,bodyText,images,embeds};
}

function renderTable(a){
  const out=document.getElementById('scrape-results');
  let html=`<table class="sr-table">
    <thead><tr><th>Element</th><th>Inhoud</th><th></th></tr></thead><tbody>`;

  // Row 1: Kop
  html+=srRow('Kop',a.headline);
  // Row 2: Intro
  html+=srRow('Intro',a.intro);
  // Row 3: Tekst
  html+=srRow('Tekst',a.bodyText);
  // Row 4: Afbeeldingen (URLs only)
  html+=srRow('Afbeeldingen',a.images.join('\n'));
  // Row 5+: Embeds
  a.embeds.forEach(e=>{
    html+=srRow(e.type.toUpperCase(),e.val);
  });

  html+=`</tbody></table>`;
  out.innerHTML=html;
}

function srRow(label,content){
  if(!content)return `<tr class="sr-row"><td class="sr-td-label">${esc(label)}</td><td class="sr-td-content sr-empty">—</td><td class="sr-td-copy"></td></tr>`;
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
