export function getSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

import type { DialogStatusFilter } from "../model/dialog-status";
import { DIALOG_STATUSES } from "../model/dialog-status";
import { DIALOG_ASSIGNEE_FILTERS, type DialogAssigneeFilter } from "../model/dialog-assignee-filter";

export function parseDialogStatusFilter(value: string | undefined): DialogStatusFilter {
  if (!value) {
    return "all";
  }
  if (value === "all") {
    return "all";
  }
  if ((DIALOG_STATUSES as readonly string[]).includes(value)) {
    return value as DialogStatusFilter;
  }
  return "all";
}

export function parseDialogAssigneeFilter(value: string | undefined): DialogAssigneeFilter {
  if (!value) return "all";
  if ((DIALOG_ASSIGNEE_FILTERS as readonly string[]).includes(value)) {
    return value as DialogAssigneeFilter;
  }
  return "all";
}

export function parsePositiveInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}
