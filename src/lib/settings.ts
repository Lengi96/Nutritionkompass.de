export const DEFAULT_USER_SETTINGS = {
  defaultLandingPage: "DASHBOARD",
  uiDensity: "COMFORTABLE",
} as const;

export const LANDING_PAGE_OPTIONS = [
  { value: "DASHBOARD", label: "Dashboard", href: "/dashboard" },
  { value: "PATIENTS", label: "Bewohner:innen", href: "/patients" },
  { value: "MEAL_PLANS", label: "Ernährungspläne", href: "/meal-plans" },
  { value: "SHOPPING_LISTS", label: "Einkaufslisten", href: "/shopping-lists" },
] as const;

export const UI_DENSITY_OPTIONS = [
  { value: "COMFORTABLE", label: "Komfortabel" },
  { value: "COMPACT", label: "Kompakt" },
] as const;

export function getLandingPageHref(value: string): string {
  return (
    LANDING_PAGE_OPTIONS.find((option) => option.value === value)?.href ??
    "/dashboard"
  );
}

export function getUiDensityDataValue(value: string): "comfortable" | "compact" {
  return value === "COMPACT" ? "compact" : "comfortable";
}
