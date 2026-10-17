import en from '../../data/strings/en.json';

export type StringVars = Record<string, string | number>;

type NestedStrings = { [key: string]: string | NestedStrings };

const catalogs: Record<string, NestedStrings> = { en: en as unknown as NestedStrings };
let currentLocale = 'en';

function lookup(path: string): string | undefined {
  let node: string | NestedStrings | undefined = catalogs[currentLocale];
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === undefined) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Translate a dotted key, e.g. t('card.lastUpdated', { version: '7.3' }).
 * All user-facing text must flow through this function (see data/strings/en.json).
 */
export function t(key: string, vars?: StringVars): string {
  const template = lookup(key);
  if (template === undefined) {
    if (import.meta.env.DEV) console.warn(`[strings] missing key: ${key}`);
    return key;
  }
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  );
}

/**
 * Swap the active language file later by registering another catalog —
 * components never import strings directly, so this requires zero refactoring.
 */
export function registerLocale(locale: string, catalog: NestedStrings): void {
  catalogs[locale] = catalog;
  currentLocale = locale;
}
