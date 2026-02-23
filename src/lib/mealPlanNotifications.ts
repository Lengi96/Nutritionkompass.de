const UNREAD_KEY = "mealPlansUnreadCount";
const UNREAD_EVENT = "mealPlansUnreadChanged";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getMealPlansUnreadCount(): number {
  if (!isBrowser()) return 0;
  const rawValue = window.localStorage.getItem(UNREAD_KEY);
  const parsed = Number(rawValue ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export function setMealPlansUnreadCount(value: number): void {
  if (!isBrowser()) return;
  const nextValue = Math.max(0, Math.floor(value));
  window.localStorage.setItem(UNREAD_KEY, String(nextValue));
  window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: nextValue }));
}

export function incrementMealPlansUnreadCount(delta = 1): void {
  const current = getMealPlansUnreadCount();
  setMealPlansUnreadCount(current + Math.max(0, Math.floor(delta)));
}

export function clearMealPlansUnreadCount(): void {
  setMealPlansUnreadCount(0);
}

export function subscribeMealPlansUnread(
  listener: (value: number) => void
): () => void {
  if (!isBrowser()) return () => undefined;

  const handleLocalEvent = (event: Event) => {
    const customEvent = event as CustomEvent<number>;
    if (typeof customEvent.detail === "number") {
      listener(customEvent.detail);
      return;
    }
    listener(getMealPlansUnreadCount());
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== UNREAD_KEY) return;
    listener(getMealPlansUnreadCount());
  };

  window.addEventListener(UNREAD_EVENT, handleLocalEvent as EventListener);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(UNREAD_EVENT, handleLocalEvent as EventListener);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
