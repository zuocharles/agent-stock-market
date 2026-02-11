import { NextResponse } from 'next/server';

const SECONDME_CLIENT_ID = process.env.SECONDME_CLIENT_ID || '';
const SECONDME_REDIRECT_URI = process.env.SECONDME_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

export async function GET() {
  // SecondMe OAuth authorization URL
  // Based on SecondMe OAuth2 flow
  const authUrl = new URL('https://api.secondme.io/oauth/authorize');
  authUrl.searchParams.set('client_id', SECONDME_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', SECONDME_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'profile');
  authUrl.searchParams.set('state', crypto.randomUUID());

  return NextResponse.redirect(authUrl.toString());
}
