import { GIF_CATEGORIES, type GifSearchItem } from "@chit/shared";

/**
 * Proxies Tenor search. Uses TENOR_API_KEY if set (Google Cloud / Tenor),
 * otherwise the public Tenor demo key so the free deploy still works.
 * Browse millions of GIFs via search — https://tenor.com
 */
const TENOR_KEY = process.env.TENOR_API_KEY || "LIVETESTKEY";
const CLIENT_KEY = "star_chit_game";

type TenorV1Result = {
  id: string;
  title?: string;
  content_description?: string;
  media?: Array<Record<string, { url?: string; dims?: number[] }>>;
};

type TenorV1Response = {
  results?: TenorV1Result[];
  next?: string;
};

function pickUrl(m: Record<string, { url?: string }> | undefined, keys: string[]): string {
  if (!m) return "";
  for (const k of keys) {
    const url = m[k]?.url;
    if (url) return url;
  }
  return "";
}

function mapV1(results: TenorV1Result[]): GifSearchItem[] {
  const out: GifSearchItem[] = [];
  for (const r of results) {
    const media = r.media?.[0];
    const gifUrl = pickUrl(media, ["tinygif", "gif", "mediumgif", "nanogif"]);
    const previewUrl = pickUrl(media, ["nanogif", "tinygif", "gif"]) || gifUrl;
    if (!gifUrl) continue;
    out.push({
      id: String(r.id),
      label: (r.title || r.content_description || "GIF").slice(0, 60),
      gifUrl,
      previewUrl,
    });
  }
  return out;
}

export async function searchTenorGifs(opts: {
  q: string;
  limit?: number;
  pos?: string;
}): Promise<{ items: GifSearchItem[]; next: string | null }> {
  const q = opts.q.trim() || "telugu";
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 50);
  const params = new URLSearchParams({
    q,
    key: TENOR_KEY,
    client_key: CLIENT_KEY,
    limit: String(limit),
    media_filter: "minimal",
  });
  if (opts.pos) params.set("pos", opts.pos);

  const url = `https://g.tenor.com/v1/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Tenor search failed (${res.status})`);
  }
  const data = (await res.json()) as TenorV1Response;
  return {
    items: mapV1(data.results ?? []),
    next: data.next ?? null,
  };
}

export function resolveCategoryQuery(categoryId: string | undefined): string | null {
  if (!categoryId) return null;
  const cat = GIF_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.query ?? null;
}

export { GIF_CATEGORIES };
