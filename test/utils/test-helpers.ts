// test/utils/test-helpers.ts
export const normalizeCookies = (
  cookies: string | string[] | undefined,
): string[] => {
  if (cookies === undefined || cookies === null) return [];

  return Array.isArray(cookies)
    ? cookies
    : cookies
        .split(',')
        .map((cookie) => cookie.trim())
        .filter(Boolean);
};
