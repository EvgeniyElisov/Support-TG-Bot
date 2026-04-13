import type { DialogStatusFilter } from "../model/dialog-status";

export function buildDashboardUrl(params: {
  chat?: number | null;
  page?: number;
  status?: DialogStatusFilter;
}): string {
  const sp = new URLSearchParams();
  if (params.chat != null && params.chat > 0) {
    sp.set("chat", String(params.chat));
  }
  if (params.page != null && params.page > 1) {
    sp.set("page", String(params.page));
  }
  if (params.status != null && params.status !== "all") {
    sp.set("status", params.status);
  }
  const q = sp.toString();
  return q ? `/dashboard?${q}` : "/dashboard";
}
