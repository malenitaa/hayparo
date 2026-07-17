const SEARCH_QUERY = "paro colectivos OR paro subte OR paro trenes Buenos Aires";
const FEED_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(
  SEARCH_QUERY
)}&hl=es-419&gl=AR&ceid=AR:es-419`;

const RELEVANT_KEYWORDS = [
  "paro",
  "huelga",
  "colectivo",
  "subte",
  "tren",
  "gremio",
  "uta",
];

const LOOKBACK_HOURS = 24;

export type NewsItem = {
  title: string;
  pubDate: string;
  source: string;
};

export async function fetchCandidateHeadlines(): Promise<NewsItem[]> {
  const res = await fetch(FEED_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; HayParoBot/1.0; +https://www.hayparo.net.ar)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google News RSS respondió ${res.status}`);
  }

  const xml = await res.text();
  return parseItems(xml);
}

export function filterRecentRelevant(items: NewsItem[]): NewsItem[] {
  const cutoff = Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000;

  return items.filter((item) => {
    const published = Date.parse(item.pubDate);
    const isRecent = Number.isNaN(published) ? true : published >= cutoff;
    const lowerTitle = item.title.toLowerCase();
    const isRelevant = RELEVANT_KEYWORDS.some((kw) => lowerTitle.includes(kw));
    return isRecent && isRelevant;
  });
}

function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = extractTag(block, "title");
    if (!title) continue;

    items.push({
      title: decodeEntities(title),
      pubDate: extractTag(block, "pubDate"),
      source: decodeEntities(extractTag(block, "source")),
    });
  }

  return items;
}

function extractTag(block: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
  if (!match) return "";
  return match[1].replace("<![CDATA[", "").replace("]]>", "").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
