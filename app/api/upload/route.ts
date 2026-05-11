import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import type { DiamondPair } from '@/lib/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = getRequestContext();
  const pairs: DiamondPair[] = await request.json();

  const stmt = env.DB.prepare(
    'INSERT OR REPLACE INTO pairs (set_number, data, updated_at) VALUES (?, ?, datetime(\'now\'))'
  );
  await env.DB.batch(pairs.map((p) => stmt.bind(p.setNumber, JSON.stringify(p))));

  return NextResponse.json({ success: true, count: pairs.length });
}
