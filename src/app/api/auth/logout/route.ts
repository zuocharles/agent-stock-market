import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('agent_id');
  return response;
}

export async function GET() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('agent_id');
  return NextResponse.redirect(new URL('/', response.url));
}
