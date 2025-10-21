import { WhopServerSdk } from '@whop/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedSdk: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWhopSdk(): any {
  if (cachedSdk) return cachedSdk;
  
  const apiKey = process.env.WHOP_API_KEY;
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  
  if (!apiKey || !appId) {
    throw new Error('Missing WHOP credentials - check your environment variables');
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdk = new (WhopServerSdk as any)({
    appId,
    appApiKey: apiKey
  });

  cachedSdk = sdk;
  return sdk;
}
