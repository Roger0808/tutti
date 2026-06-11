import type { AppCenterViewModel } from "../contracts/viewModel.ts";

export function sortMyAppsByCreatedDesc(
  apps: readonly AppCenterViewModel["apps"][number][]
): AppCenterViewModel["apps"] {
  return [...apps].sort((left, right) => {
    const createdOrder =
      (right.createdAtUnixMs ?? 0) - (left.createdAtUnixMs ?? 0);
    if (createdOrder !== 0) {
      return createdOrder;
    }
    const nameOrder = left.name.localeCompare(right.name);
    if (nameOrder !== 0) {
      return nameOrder;
    }
    return left.id.localeCompare(right.id);
  });
}

export function sortRecommendedApps(
  apps: readonly AppCenterViewModel["apps"][number][]
): AppCenterViewModel["apps"] {
  return [...apps].sort((left, right) => {
    const categoryOrder =
      getRecommendedAppCategoryRank(left) -
      getRecommendedAppCategoryRank(right);
    if (categoryOrder !== 0) {
      return categoryOrder;
    }
    const comingSoonOrder =
      getRecommendedAppComingSoonRank(left) -
      getRecommendedAppComingSoonRank(right);
    if (comingSoonOrder !== 0) {
      return comingSoonOrder;
    }
    return left.name.localeCompare(right.name);
  });
}

export function sortRecommendedAppsForAllTab(
  apps: readonly AppCenterViewModel["apps"][number][]
): AppCenterViewModel["apps"] {
  return [...apps].sort((left, right) => {
    const comingSoonOrder =
      getRecommendedAppComingSoonRank(left) -
      getRecommendedAppComingSoonRank(right);
    if (comingSoonOrder !== 0) {
      return comingSoonOrder;
    }
    const categoryOrder =
      getRecommendedAppCategoryRank(left) -
      getRecommendedAppCategoryRank(right);
    if (categoryOrder !== 0) {
      return categoryOrder;
    }
    return left.name.localeCompare(right.name);
  });
}

function getRecommendedAppComingSoonRank(
  app: AppCenterViewModel["apps"][number]
): number {
  return app.statusLabelKey === "status.comingSoon" ||
    app.tags.some((tag) => tag.trim().toLowerCase() === "coming-soon")
    ? 1
    : 0;
}

function getRecommendedAppCategoryRank(
  app: AppCenterViewModel["apps"][number]
): number {
  const category = app.category?.trim().toLowerCase() ?? "";
  if (category === "产品与设计" || category === "product and design") {
    return 0;
  }
  if (category === "办公" || category === "office") {
    return 1;
  }
  if (
    category === "工具" ||
    category === "tools" ||
    category === "productivity"
  ) {
    return 2;
  }
  if (category === "内容创作" || category === "content creation") {
    return 3;
  }

  const searchableText = [app.id, app.name, app.description, ...app.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /\b(automation|schedule|recurring|productivity|efficiency|workflow|task)\b/.test(
      searchableText
    )
  ) {
    return 0;
  }

  if (
    /\b(media|canvas|video|edit|design|prototype|creative|creation)\b/.test(
      searchableText
    )
  ) {
    return 1;
  }

  return 2;
}
