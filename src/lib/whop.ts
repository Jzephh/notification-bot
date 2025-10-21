import { WhopServerSdk } from '@whop/api';

type WhopSdkShape = {
  verifyUserToken: (headers: Headers) => Promise<{ userId?: string }>
};

let cachedSdk: WhopSdkShape | null = null;

export function getWhopSdk(): WhopSdkShape {
  if (cachedSdk) return cachedSdk;

  const apiKey = process.env.WHOP_API_KEY;
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

  if (!apiKey || !appId) {
    // In development we may rely on DEV_USER_ID, but surface a clear error otherwise
    throw new Error('Missing WHOP credentials');
  }

  const sdk = new (WhopServerSdk as unknown as {
    new (args: { appId: string; appApiKey: string }): WhopSdkShape;
  })({
    appId,
    appApiKey: apiKey,
  });

  cachedSdk = sdk;
  return sdk;
}

export async function getUserIdFromRequest(headersObj: Headers): Promise<string | null> {
  // Prefer Whop verification when configured
  try {
    const sdk = getWhopSdk();
    const { userId } = await sdk.verifyUserToken(headersObj);
    if (userId) return userId;
  } catch {
    // ignore to allow DEV fallback
  }

  const devUser = process.env.DEV_USER_ID;
  return devUser ?? null;
}


