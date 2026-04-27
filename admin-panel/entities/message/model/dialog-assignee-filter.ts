export const DIALOG_ASSIGNEE_FILTERS = ["all", "mine", "unassigned", "others"] as const;

export type DialogAssigneeFilter = (typeof DIALOG_ASSIGNEE_FILTERS)[number];

export const DIALOG_ASSIGNEE_FILTER_LABELS: Record<DialogAssigneeFilter, string> = {
  all: "Все",
  mine: "Мои",
  unassigned: "Без менеджера",
  others: "Чужие",
};

