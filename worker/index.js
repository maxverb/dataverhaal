// ── MetaMax Cloudflare Worker ──
// Handles: CORS proxy, RSS cache (cron), BB media extraction
//
// Setup:
// 1. Create KV namespace "RSS_CACHE" in Cloudflare dashboard
// 2. Bind it to this Worker as variable RSS_CACHE
// 3. Add cron trigger: 0 * * * * (every hour)
// 4. Deploy with: wrangler deploy

const FEEDS = [
  {id:'l1',name:'L1',url:'https://www.l1nieuws.nl/rss/index.xml'},
  {id:'west',name:'Omroep West',url:'https://www.omroepwest.nl/rss/index.xml'},
  {id:'rijnmond',name:'Rijnmond',url:'https://www.rijnmond.nl/rss/index.xml'},
  {id:'drenthe',name:'RTV Drenthe',url:'https://www.rtvdrenthe.nl/rss/index.xml'},
  {id:'gld',name:'Omroep Gelderland',url:'https://www.gld.nl/rss/index.xml'},
  {id:'noord',name:'RTV Noord',url:'https://www.rtvnoord.nl/rss/index.xml'},
  {id:'zeeland',name:'Omroep Zeeland',url:'https://www.omroepzeeland.nl/rss/nieuws.xml'},
  {id:'oost',name:'RTV Oost',url:'https://www.oost.nl/rss/nieuws.xml'},
  {id:'fryslan',name:'Omroep Fryslân',url:'https://www.omropfryslan.nl/rss/nieuws.xml'},
  {id:'utrecht',name:'RTV Utrecht',url:'https://www.rtvutrecht.nl/rss/nieuws.xml'},
  {id:'brabant',name:'Omroep Brabant',url:'https://www.omroepbrabant.nl/rss'},
  {id:'nh',name:'NH Nieuws',url:'https://rss.nhnieuws.nl/rss'},
  {id:'flevoland',name:'Omroep Flevoland',url:'https://www.omroepflevoland.nl/RSS/rss.aspx'},
  {id:'nos',name:'NOS',url:'https://feeds.nos.nl/nosnieuwsalgemeen'},
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── CRON: fetch all RSS feeds, store in KV ──

async function fetchAllFeeds() {
  const allArticles = [];

  for (const feed of FEEDS) {
    try {
      const resp = await fetch(feed.url, {
        headers: { 'User-Agent': 'MetaMax/1.0 RSS Reader' },
        cf: { cacheTtl: 300 } // 5 min edge cache
      });
      if (!resp.ok) continue;
      const xml = await resp.text();

      // Parse RSS items with regex (no DOM in Workers)
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
      for (const m of items) {
        const block = m[1];
        const title = decodeEntities(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
        const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ||
                     block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || '';
        const desc = decodeEntities(block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || '');
        const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
        const encUrl = block.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1] || '';
        const mediaUrl = block.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] || '';

        if (title && link) {
          allArticles.push({
            title: title.trim(),
            link: link.trim(),
            desc: desc.trim().substring(0, 500), // cap description size
            pubDate,
            image: encUrl || mediaUrl || '',
            source: feed.name,
            sourceId: feed.id
          });
        }
      }
    } catch (e) {
      // Skip failed feeds silently
    }
  }

  return allArticles;
}

function decodeEntities(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ''); // strip HTML tags from descriptions
}

// ── CORS PROXY (existing functionality) ──

async function handleProxy(targetUrl) {
  const resp = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MetaMax/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  let body = await resp.text();

  // BB media ID extraction: search for sourceid patterns in raw HTML
  const mediaIds = new Set();
  const patterns = [
    /sourceid_string[_:]?\s*["']?(\d{4,})/gi,
    /srcid[_:]?\s*["']?(\d{4,})/gi,
    /displayId['":\s]+(\d{4,})/gi,
  ];
  for (const pat of patterns) {
    let match;
    while ((match = pat.exec(body)) !== null) {
      mediaIds.add(match[1]);
    }
  }

  if (mediaIds.size > 0) {
    const metaTag = `<meta name="dataverhaal-media" content="${[...mediaIds].join(',')}">`;
    body = body.replace('</head>', metaTag + '</head>');
  }

  return new Response(body, {
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'text/html',
      ...CORS_HEADERS,
    },
  });
}

// ── MAIN HANDLER ──

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // RSS Cache endpoint
    if (url.pathname === '/rss-cache') {
      if (!env.RSS_CACHE) {
        return new Response(JSON.stringify({ error: 'KV not configured', articles: [] }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      const cached = await env.RSS_CACHE.get('all_articles');
      return new Response(cached || JSON.stringify({ articles: [], updated: null }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Force refresh endpoint (manual trigger)
    if (url.pathname === '/rss-refresh') {
      if (!env.RSS_CACHE) {
        return new Response(JSON.stringify({ error: 'KV not configured' }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      const articles = await fetchAllFeeds();
      const data = JSON.stringify({ articles, updated: new Date().toISOString(), count: articles.length });
      await env.RSS_CACHE.put('all_articles', data, { expirationTtl: 172800 }); // 48h
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // CORS proxy (existing)
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response(JSON.stringify({
        endpoints: {
          proxy: '/?url=<target>',
          rssCache: '/rss-cache',
          rssRefresh: '/rss-refresh'
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    return handleProxy(targetUrl);
  },

  // Cron trigger: runs every hour
  async scheduled(event, env, ctx) {
    if (!env.RSS_CACHE) return;
    const articles = await fetchAllFeeds();
    const data = JSON.stringify({
      articles,
      updated: new Date().toISOString(),
      count: articles.length
    });
    await env.RSS_CACHE.put('all_articles', data, { expirationTtl: 172800 }); // 48h
  }
};
