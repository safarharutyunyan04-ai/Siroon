import type { Locale, MenuCategory, MenuItem } from "@/types/domain";

export type MenuItemTexts = {
  name: string;
  description: string;
};

export function itemTexts(item: MenuItem, locale: Locale): MenuItemTexts {
  const localized = item.i18n?.[locale];
  return {
    name: localized?.name?.trim() || item.name,
    description: localized?.description?.trim() || item.description,
  };
}

export function categoryName(category: MenuCategory, locale: Locale): string {
  return category.i18n?.[locale]?.trim() || category.name;
}
