import { apiGet, ApiError } from "./api";
import { mockCommunitiesByZip } from "./mockData";
import type { CommunityDashboardData } from "./types";

/**
 * Fetches community dashboard data from the backend.
 * Falls back to bundled mock if the backend is unreachable so the demo never
 * shows an empty state.
 */
export async function getCommunityData(
  zip: string,
): Promise<CommunityDashboardData | null> {
  const normalized = zip.trim();
  try {
    return await apiGet<CommunityDashboardData>(
      `/community/${encodeURIComponent(normalized)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return mockCommunitiesByZip[normalized] ?? null;
    }
    return mockCommunitiesByZip[normalized] ?? null;
  }
}
