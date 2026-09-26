import { afterEach, expect, it, vi } from 'vitest';
import { extensionApi } from '../../src/shared/webextension';

afterEach(() => vi.unstubAllGlobals());

it('uses Firefox browser promises when both WebExtension namespaces exist', async () => {
  const chromium = vi.fn(async () => 'chromium');
  const firefox = vi.fn(async () => 'firefox');
  vi.stubGlobal('chrome', { runtime: { sendMessage: chromium } });
  vi.stubGlobal('browser', { runtime: { sendMessage: firefox } });

  expect(await extensionApi.runtime.sendMessage('ping')).toBe('firefox');
  expect(firefox).toHaveBeenCalledOnce();
  expect(chromium).not.toHaveBeenCalled();
});

it('falls back to Chromium and does not require a namespace at import time', async () => {
  const sendMessage = vi.fn(async () => 'chromium');
  vi.stubGlobal('chrome', { runtime: { sendMessage } });

  expect(await extensionApi.runtime.sendMessage('ping')).toBe('chromium');
});
