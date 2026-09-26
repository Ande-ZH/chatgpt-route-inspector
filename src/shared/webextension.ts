/** Prefer Firefox's promise-based namespace, falling back to Chromium's MV3 API. */
export const extensionApi = new Proxy({} as typeof chrome, {
  get(_target, key: keyof typeof chrome) {
    // Resolve at use time so importing pure helpers also works outside an extension (e.g. tests).
    const api = (globalThis as typeof globalThis & { browser?: typeof chrome }).browser ?? globalThis.chrome;
    return api?.[key];
  }
});
