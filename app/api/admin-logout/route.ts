import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_auth');
  return res;
}
