// src/app/api/chat/status/route.ts
import { NextResponse } from 'next/server';
import {
  FREE_MESSAGE_LIMIT,
  getClientIdentifiers,
  getServerTracking,
  resetServerTracking,
} from '@/lib/server-tracking';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientFp = url.searchParams.get('fp');

  const keys = getClientIdentifiers(req, clientFp);
  const serverRec = getServerTracking(keys);

  // Also read cookies if present
  const cookieHeader = req.headers.get('cookie') || '';
  const countMatch = cookieHeader.match(/(?:^|; )fastfolio_message_count=([^;]*)/);
  const extraMatch = cookieHeader.match(/(?:^|; )fastfolio_extra_messages=([^;]*)/);
  const cookieCount = countMatch ? parseInt(decodeURIComponent(countMatch[1]), 10) : 0;
  const cookieExtra = extraMatch ? parseInt(decodeURIComponent(extraMatch[1]), 10) : 0;

  const count = Math.max(serverRec.count, isNaN(cookieCount) ? 0 : cookieCount);
  const extra = Math.max(serverRec.extra, isNaN(cookieExtra) ? 0 : cookieExtra);
  const totalAllowed = FREE_MESSAGE_LIMIT + extra;
  const hasReachedLimit = count >= totalAllowed;
  const remaining = Math.max(0, totalAllowed - count);

  const res = NextResponse.json({
    count,
    extra,
    totalAllowed,
    hasReachedLimit,
    remaining,
  });

  // Set synchronized cookies
  res.cookies.set('fastfolio_message_count', count.toString(), {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  });
  if (extra > 0) {
    res.cookies.set('fastfolio_extra_messages', extra.toString(), {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    });
  }

  return res;
}

export async function POST(req: Request) {
  // Allow manual reset for testing if requested
  const url = new URL(req.url);
  const isReset = url.searchParams.get('reset') === 'true';

  if (isReset) {
    const clientFp = url.searchParams.get('fp');
    const keys = getClientIdentifiers(req, clientFp);
    resetServerTracking(keys);

    const res = NextResponse.json({ success: true, message: 'Reset successfully' });
    res.cookies.delete('fastfolio_message_count');
    res.cookies.delete('fastfolio_extra_messages');
    res.cookies.delete('fastfolio_rate_limit_reached');
    return res;
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
