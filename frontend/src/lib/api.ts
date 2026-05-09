/**
 * Central API client. Server-cached via Next.js ISR for low-latency reads.
 *
 * Usage:
 *   const data = await apiGet<MyType>("/community/91001");
 *   const data = await apiGet<MyType>("/community/91001", { revalidate: 10 });
 *   const data = await apiPost<Out, In>("/sms/inbound", { phone, message });
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEFAULT_REVALIDATE_S = 30;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function apiGet<T>(
  path: string,
  opts: { revalidate?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const revalidate = opts.revalidate ?? DEFAULT_REVALIDATE_S;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate },
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function apiPost<TOut, TIn = unknown>(
  path: string,
  body: TIn,
  opts: { signal?: AbortSignal } = {},
): Promise<TOut> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed (${res.status})`);
  }
  return (await res.json()) as TOut;
}
