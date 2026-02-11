import { NextResponse } from 'next/server';
import { AgentStockDB } from '@/lib/db';

const SECONDME_CLIENT_ID = process.env.SECONDME_CLIENT_ID || '';
const SECONDME_CLIENT_SECRET = process.env.SECONDME_CLIENT_SECRET || '';
const SECONDME_REDIRECT_URI = process.env.SECONDME_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // const state = searchParams.get('state'); // TODO: Verify state for CSRF protection
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.secondme.io/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SECONDME_CLIENT_ID,
        client_secret: SECONDME_CLIENT_SECRET,
        code,
        redirect_uri: SECONDME_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/?error=token_exchange', request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile from SecondMe
    const profileResponse = await fetch('https://api.secondme.io/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(new URL('/?error=profile_fetch', request.url));
    }

    const profile = await profileResponse.json();
    const secondmeId = profile.id;
    const name = profile.name || profile.username || 'Anonymous Agent';
    const avatar = profile.avatar_url;

    // Check if agent already exists
    let agent = AgentStockDB.getAgentBySecondMeId(secondmeId);

    if (!agent) {
      // Create new agent
      agent = AgentStockDB.createAgent(name, secondmeId, avatar);
    }

    // Set session cookie
    const response = NextResponse.redirect(new URL(`/agent/${agent.id}`, request.url));
    response.cookies.set('agent_id', agent.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_error', request.url));
  }
}
