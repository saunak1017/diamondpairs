import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import type { DiamondPair } from '@/lib/types';

export const runtime = 'edge';

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default async function PairPage({ params }: { params: { set: string } }) {
  const { env } = getRequestContext();
  const row = await env.DB.prepare('SELECT data FROM pairs WHERE set_number = ?')
    .bind(params.set)
    .first<{ data: string }>();

  if (!row) notFound();

  const pair: DiamondPair = JSON.parse(row.data);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <p className="text-xs font-semibold tracking-widest text-gold uppercase mb-1">
          Shivani Gems
        </p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Lot {pair.setNumber}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Diamond Pair</p>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        {/* Stone cards */}
        {pair.stones.map((stone, i) => (
          <div key={stone.lotNumber} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Stone {i + 1}</span>
              <span className="text-gray-400 text-xs font-mono">#{stone.lotNumber}</span>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Shape" value={stone.shape} />
              <Field label="Measurements" value={stone.measurements} />
              <Field label="Length" value={`${fmt(stone.length)} mm`} />
              <Field label="Width" value={`${fmt(stone.width)} mm`} />
              <Field label="Ratio" value={fmt(stone.ratio, 3)} />
              <Field label="Color" value={stone.color} />
              <Field label="Clarity" value={stone.clarity} />
              <Field label="Stone Weight" value={`${fmt(stone.stoneWeight, 3)} ct`} highlight />
            </div>
          </div>
        ))}

        {/* Pair summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gold px-4 py-2.5">
            <span className="text-white text-sm font-semibold">Pair Summary</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            <SummaryRow label="Total Weight" value={`${fmt(pair.totalWeight, 3)} ct`} />
            <div className="border-t border-gray-100" />
            <SummaryRow label="Price per Carat" value={fmtPrice(pair.pricePerCarat)} />
            <SummaryRow label="Total Price" value={fmtPrice(pair.totalPrice)} large />
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 py-8">
        Shivani Gems &mdash; Lot {pair.setNumber}
      </p>
    </main>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-gold-dark' : 'text-gray-900'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function SummaryRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-bold ${large ? 'text-lg text-gray-900' : 'text-sm text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}
