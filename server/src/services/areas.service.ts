import { AREAS } from "../config/areas";

const OREF_ALERTS_URL = "https://www.oref.org.il/WarningMessages/alert/alerts.json";
const LIVE_AREAS_TTL_MS = 60 * 1000;

type OrefAlertsResponse = {
  data?: string[];
};

let lastFetchAt = 0;
let cachedAreas: string[] = [];
const discoveredAreas = new Set<string>();

function normalizeArea(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function fetchLiveAreas(): Promise<string[]> {
  const response = await fetch(OREF_ALERTS_URL, {
    method: "GET",
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://www.oref.org.il/",
      "User-Agent": "HornServer/1.0",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    throw new Error(`Oref source returned ${response.status}`);
  }

  const raw = (await response.text()).replace(/^\uFEFF/, "").trim();
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as OrefAlertsResponse;
  const areas = (parsed.data ?? [])
    .map(normalizeArea)
    .filter(Boolean);

  return Array.from(new Set(areas));
}

export async function getAvailableAreas(): Promise<string[]> {
  const now = Date.now();
  if (now - lastFetchAt < LIVE_AREAS_TTL_MS && cachedAreas.length > 0) {
    return cachedAreas;
  }

  try {
    const liveAreas = await fetchLiveAreas();
    for (const area of liveAreas) {
      discoveredAreas.add(area);
    }

    const merged = [...discoveredAreas, ...AREAS];
    const unique = Array.from(new Set(merged.map(normalizeArea).filter(Boolean)));
    cachedAreas = unique;
    lastFetchAt = now;
    return cachedAreas;
  } catch (error) {
    if (cachedAreas.length > 0) {
      return cachedAreas;
    }
    return AREAS;
  }
}
