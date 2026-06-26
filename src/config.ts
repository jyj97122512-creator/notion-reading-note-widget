const STORAGE_KEY = "reading_notes_config";

export interface WidgetConfig {
  token: string;
  notesDatabaseId: string;
  recordsDatabaseId: string;
  recordStatusProperty: string;
  currentReadingStatus: string;
  noteTypeProperty: string;
  noteStatusProperty: string;
  noteRelationProperty: string;
}

export const DEFAULT_CONFIG: Omit<WidgetConfig, "token" | "notesDatabaseId" | "recordsDatabaseId"> = {
  recordStatusProperty: "읽기 상태",
  currentReadingStatus: "읽는중",
  noteTypeProperty: "유형",
  noteStatusProperty: "상태",
  noteRelationProperty: "독서기록"
};

export function loadConfig(): WidgetConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetConfig;
    if (!parsed.token || !parsed.notesDatabaseId || !parsed.recordsDatabaseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConfig(config: WidgetConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function configToEmbedHash(config: WidgetConfig): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))));
}

export function configFromEmbedHash(hash: string): WidgetConfig | null {
  try {
    const raw = hash.startsWith("#c=") ? hash.slice(3) : hash.startsWith("c=") ? hash.slice(2) : null;
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw)))) as WidgetConfig;
    if (!parsed.token || !parsed.notesDatabaseId || !parsed.recordsDatabaseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildEmbedUrl(config: WidgetConfig): string {
  return `${window.location.origin}/#c=${configToEmbedHash(config)}`;
}

export function configToHeaders(config: WidgetConfig): Record<string, string> {
  return {
    "Authorization": `Bearer ${config.token}`,
    "x-notes-db-id": config.notesDatabaseId,
    "x-records-db-id": config.recordsDatabaseId,
    "x-status-prop": encodeURIComponent(config.recordStatusProperty),
    "x-status-value": encodeURIComponent(config.currentReadingStatus),
    "x-type-prop": encodeURIComponent(config.noteTypeProperty),
    "x-note-status-prop": encodeURIComponent(config.noteStatusProperty),
    "x-relation-prop": encodeURIComponent(config.noteRelationProperty)
  };
}
