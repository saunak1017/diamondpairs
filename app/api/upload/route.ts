import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import type { DiamondPair } from '@/lib/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = getRequestContext();
  const pairs: DiamondPair[] = await request.json();

  const writes = pairs.map((pair) =>
    env.DIAMOND_KV.put(`pair:${pair.setNumber}`, JSON.stringify(pair))
  );
  await Promise.all(writes);

  // Keep an index of all set numbers so admin can list them later
  const existing = await env.DIAMOND_KV.get('index:sets');
  const existingSets: string[] = existing ? JSON.parse(existing) : [];
  const newSetNumbers = pairs.map((p) => p.setNumber);
  const merged = Array.from(new Set([...existingSets, ...newSetNumbers])).sort();
  await env.DIAMOND_KV.put('index:sets', JSON.stringify(merged));

  return NextResponse.json({ success: true, count: pairs.length });
}
