import {
  getChildCategories,
  getRootCategories,
} from "@/lib/menu-store";
import type { MenuCategory, MenuItem } from "@/types/domain";

export type GuestMenuSection = {
  category: MenuCategory;
  direct: MenuItem[];
  children: { category: MenuCategory; items: MenuItem[] }[];
};

export function buildGuestMenuSections(
  categories: MenuCategory[],
  items: MenuItem[],
): GuestMenuSection[] {
  const active = items.filter((item) => item.active);
  return getRootCategories(categories)
    .map((category) => {
      const direct = active.filter((item) => item.categoryId === category.id);
      const children = getChildCategories(categories, category.id)
        .map((child) => ({
          category: child,
          items: active.filter((item) => item.categoryId === child.id),
        }))
        .filter((block) => block.items.length > 0);
      return { category, direct, children };
    })
    .filter((block) => block.direct.length > 0 || block.children.length > 0);
}
