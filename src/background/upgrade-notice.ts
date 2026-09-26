import { extensionApi } from '../shared/webextension';
import { UPGRADE_NOTICE_PAGE, UPGRADE_NOTICE_VERSION } from '../shared/upgrade-notice';
export { UPGRADE_NOTICE_PAGE, UPGRADE_NOTICE_VERSION } from '../shared/upgrade-notice';
export const UPGRADE_NOTICE_KEY = 'routeInspectorNotice108Shown';

export function isNoticeUpgrade(current: string, details: chrome.runtime.InstalledDetails): boolean {
  if (current !== UPGRADE_NOTICE_VERSION || details.reason !== 'update' ||
    !details.previousVersion || !/^\d+(?:\.\d+){0,3}$/.test(details.previousVersion)) return false;
  const previous = details.previousVersion.split('.').map(Number);
  const target = [1, 0, 8, 0];
  for (let index = 0; index < target.length; index++) {
    const value = previous[index] ?? 0;
    if (value !== target[index]) return value < target[index]!;
  }
  return false;
}

let opening: Promise<void> | null = null;

/** This local marker intentionally lives outside clearable route history. */
export async function handleInstallation(details: chrome.runtime.InstalledDetails): Promise<void> {
  if (details.reason === 'install') {
    await extensionApi.tabs.create({ url: extensionApi.runtime.getURL('ui/onboarding/index.html') });
    return;
  }
  if (!isNoticeUpgrade(extensionApi.runtime.getManifest().version, details)) return;
  if (opening) return opening;
  opening = (async () => {
    const stored = await extensionApi.storage.local.get(UPGRADE_NOTICE_KEY);
    if (stored[UPGRADE_NOTICE_KEY] === true) return;
    await extensionApi.tabs.create({ url: extensionApi.runtime.getURL(UPGRADE_NOTICE_PAGE), active: true });
    await extensionApi.storage.local.set({ [UPGRADE_NOTICE_KEY]: true });
  })();
  try { await opening; }
  finally { opening = null; }
}
