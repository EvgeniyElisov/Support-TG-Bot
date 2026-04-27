import type { DialogStatusFilter } from "../model/dialog-status";
import type { DialogAssigneeFilter } from "../model/dialog-assignee-filter";

export function buildDashboardUrl(params: {
  chat?: number | null;
  page?: number;
  status?: DialogStatusFilter;
  assignee?: DialogAssigneeFilter;
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
  if (params.assignee != null && params.assignee !== "all") {
    sp.set("assignee", params.assignee);
  }
  const q = sp.toString();
  return q ? `/dashboard?${q}` : "/dashboard";
}
