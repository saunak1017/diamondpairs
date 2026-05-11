'use client';

import { useState, useRef } from 'react';
import type { DiamondPair, DiamondStone } from '@/lib/types';

// ── Excel parsing ──────────────────────────────────────────────────────────────

async function parseExcel(file: File): Promise<DiamondPair[]> {
  const xlsx = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = xlsx.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  // Find header row (first row where col A looks like "Shape")
  let dataStart = 1;
  const firstCell = String(rows[0]?.[0] ?? '').toLowerCase();
  if (firstCell.includes('shape') || firstCell.includes('lot') || firstCell.includes('set')) {
    dataStart = 1;
  }

  const pairsMap = new Map<string, DiamondStone[]>();

  for (const row of rows.slice(dataStart)) {
    const setNumber = String(row[2] ?? '').trim();
    if (!setNumber) continue;

    const stone: DiamondStone = {
      shape: String(row[0] ?? '').trim(),
      lotNumber: String(row[1] ?? '').trim(),
      measurements: String(row[3] ?? '').trim(),
      length: Number(row[4]) || 0,
      width: Number(row[5]) || 0,
      ratio: Number(row[6]) || 0,
      color: String(row[7] ?? '').trim(),
      clarity: String(row[8] ?? '').trim(),
      stoneWeight: Number(row[9]) || 0,
      pricePerCarat: Number(row[10]) || 0,
      totalPrice: Number(row[11]) || 0,
    };

    if (!pairsMap.has(setNumber)) pairsMap.set(setNumber, []);
    pairsMap.get(setNumber)!.push(stone);
  }

  return Array.from(pairsMap.entries()).map(([setNumber, stones]) => ({
    setNumber,
    stones,
    totalWeight: stones.reduce((s, st) => s + st.stoneWeight, 0),
    pricePerCarat: stones[0]?.pricePerCarat ?? 0,
    totalPrice: stones.reduce((s, st) => s + st.totalPrice, 0),
  }));
}

// ── QR code generation ─────────────────────────────────────────────────────────

async function generateQRDataURL(url: string): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(url, { width: 180, margin: 1 });
}

// ── Output Excel generation ────────────────────────────────────────────────────

async function buildOutputExcel(pairs: DiamondPair[], baseUrl: string): Promise<Blob> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Diamond Pairs');

  // Column definitions
  sheet.columns = [
    { header: 'Set #', key: 'set', width: 16 },
    { header: 'URL', key: 'url', width: 48 },
    { header: 'QR Code', key: 'qr', width: 14 },
    { header: 'Total Weight (ct)', key: 'tw', width: 18 },
    { header: '$/ct', key: 'ppc', width: 12 },
    { header: 'Total Price', key: 'tp', width: 14 },
    { header: 'Stone 1 Lot#', key: 's1l', width: 14 },
    { header: 'Stone 1 Shape', key: 's1sh', width: 14 },
    { header: 'Stone 1 Meas.', key: 's1m', width: 16 },
    { header: 'Stone 1 Color', key: 's1c', width: 13 },
    { header: 'Stone 1 Clarity', key: 's1cl', width: 14 },
    { header: 'Stone 1 Wt (ct)', key: 's1w', width: 15 },
    { header: 'Stone 2 Lot#', key: 's2l', width: 14 },
    { header: 'Stone 2 Shape', key: 's2sh', width: 14 },
    { header: 'Stone 2 Meas.', key: 's2m', width: 16 },
    { header: 'Stone 2 Color', key: 's2c', width: 13 },
    { header: 'Stone 2 Clarity', key: 's2cl', width: 14 },
    { header: 'Stone 2 Wt (ct)', key: 's2w', width: 15 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
  headerRow.height = 20;

  const QR_SIZE = 90; // pixels in Excel
  const ROW_HEIGHT = 72; // Excel row height units (~96px)

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const rowNum = i + 2;
    const url = `${baseUrl}/${pair.setNumber}`;
    const s1 = pair.stones[0];
    const s2 = pair.stones[1];

    const row = sheet.getRow(rowNum);
    row.height = ROW_HEIGHT;

    row.getCell('set').value = pair.setNumber;
    row.getCell('url').value = { text: url, hyperlink: url };
    row.getCell('url').font = { color: { argb: 'FF0563C1' }, underline: true };
    row.getCell('tw').value = parseFloat(pair.totalWeight.toFixed(3));
    row.getCell('ppc').value = pair.pricePerCarat;
    row.getCell('tp').value = pair.totalPrice;
    row.getCell('tp').numFmt = '$#,##0.00';
    row.getCell('s1l').value = s1?.lotNumber ?? '';
    row.getCell('s1sh').value = s1?.shape ?? '';
    row.getCell('s1m').value = s1?.measurements ?? '';
    row.getCell('s1c').value = s1?.color ?? '';
    row.getCell('s1cl').value = s1?.clarity ?? '';
    row.getCell('s1w').value = s1 ? parseFloat(s1.stoneWeight.toFixed(3)) : '';
    row.getCell('s2l').value = s2?.lotNumber ?? '';
    row.getCell('s2sh').value = s2?.shape ?? '';
    row.getCell('s2m').value = s2?.measurements ?? '';
    row.getCell('s2c').value = s2?.color ?? '';
    row.getCell('s2cl').value = s2?.clarity ?? '';
    row.getCell('s2w').value = s2 ? parseFloat(s2.stoneWeight.toFixed(3)) : '';

    // Align all cells vertically centered
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: false };
    });

    // Embed QR code image in column C (index 2, 0-based)
    try {
      const dataUrl = await generateQRDataURL(url);
      const base64 = dataUrl.split(',')[1];
      const imageId = workbook.addImage({ base64, extension: 'png' });
      sheet.addImage(imageId, {
        tl: { col: 2, row: rowNum - 1 },
        ext: { width: QR_SIZE, height: QR_SIZE },
      });
    } catch {
      row.getCell('qr').value = url;
    }
  }

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

type Status = 'idle' | 'parsing' | 'uploading' | 'generating' | 'done' | 'error';

export default function AdminClient() {
  const [pairs, setPairs] = useState<DiamondPair[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://pairs.shivanigems.com');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    setStatusMsg('Reading Excel…');
    setPairs([]);

    try {
      const parsed = await parseExcel(file);
      setPairs(parsed);
      setStatus('idle');
      setStatusMsg(`Parsed ${parsed.length} pairs from ${file.name}`);
    } catch (err) {
      setStatus('error');
      setStatusMsg(`Parse error: ${String(err)}`);
    }
  }

  async function handleUpload() {
    if (!pairs.length) return;
    setStatus('uploading');
    setStatusMsg('Saving to database…');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pairs),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const { count } = await res.json();
      setStatus('done');
      setStatusMsg(`✓ ${count} pairs saved. QR links are live.`);
    } catch (err) {
      setStatus('error');
      setStatusMsg(`Upload failed: ${String(err)}`);
    }
  }

  async function handleDownloadExcel() {
    if (!pairs.length) return;
    setStatus('generating');
    setStatusMsg('Generating Excel with QR codes…');

    try {
      const blob = await buildOutputExcel(pairs, baseUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diamond-pairs-qr-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('done');
      setStatusMsg('✓ Excel downloaded.');
    } catch (err) {
      setStatus('error');
      setStatusMsg(`Excel error: ${String(err)}`);
    }
  }

  function handlePrintQR() {
    if (!pairs.length) return;
    const w = window.open('', '_blank');
    if (!w) return;

    const cards = pairs
      .map((p) => {
        const url = `${baseUrl}/${p.setNumber}`;
        return `
        <div class="card">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}" alt="QR ${p.setNumber}" />
          <div class="label">${p.setNumber}</div>
        </div>`;
      })
      .join('');

    w.document.write(`<!DOCTYPE html>
<html><head><title>QR Codes — Diamond Pairs</title>
<style>
  body { font-family: sans-serif; margin: 0; padding: 16px; }
  .grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .card { display: flex; flex-direction: column; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; width: 180px; }
  img { width: 160px; height: 160px; }
  .label { margin-top: 6px; font-size: 13px; font-weight: 600; color: #111; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h2 style="margin-bottom:16px;font-size:16px;color:#444;">QR Codes — ${pairs.length} pairs</h2>
<div class="grid">${cards}</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  const busy = status === 'parsing' || status === 'uploading' || status === 'generating';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diamond Pairs Admin</h1>
            <p className="text-gray-500 text-sm mt-1">
              Upload your inventory Excel to publish pairs and generate QR codes.
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/admin-logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline mt-1 shrink-0"
          >
            Log out
          </button>
        </div>

        {/* Config + Upload card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value.replace(/\/$/, ''))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="https://pairs.shivanigems.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              QR codes will link to <span className="font-mono">{baseUrl}/[Set#]</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inventory Excel
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              disabled={busy}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-700 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              Expected columns: A=Shape, B=Lot#P, C=Set, D=Measurements, E=Length, F=Width, G=Ratio, H=Color, I=Clarity, J=Stone Weight, K=$/ct, L=Total Price
            </p>
          </div>
        </div>

        {/* Status bar */}
        {statusMsg && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              status === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : status === 'done'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {busy && (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />
            )}
            {statusMsg}
          </div>
        )}

        {/* Action buttons */}
        {pairs.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleUpload}
              disabled={busy}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 transition"
            >
              Publish to site ({pairs.length} pairs)
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={busy}
              className="px-5 py-2.5 bg-gold text-white text-sm font-medium rounded-xl hover:bg-gold-dark disabled:opacity-50 transition"
            >
              Download Excel + QR codes
            </button>
            <button
              onClick={handlePrintQR}
              disabled={busy}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Print QR sheet
            </button>
          </div>
        )}

        {/* Preview table */}
        {pairs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                Preview — {pairs.length} pairs
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Set #</th>
                    <th className="px-4 py-3">Stones</th>
                    <th className="px-4 py-3">Shapes</th>
                    <th className="px-4 py-3">Colors</th>
                    <th className="px-4 py-3">Clarities</th>
                    <th className="px-4 py-3">Total Wt</th>
                    <th className="px-4 py-3">$/ct</th>
                    <th className="px-4 py-3">Total Price</th>
                    <th className="px-4 py-3">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pairs.map((pair) => (
                    <tr key={pair.setNumber} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900 font-mono">
                        {pair.setNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pair.stones.map((s) => s.lotNumber).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pair.stones.map((s) => s.shape).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pair.stones.map((s) => s.color).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pair.stones.map((s) => s.clarity).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {pair.totalWeight.toFixed(3)} ct
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        ${pair.pricePerCarat.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ${pair.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`${baseUrl}/${pair.setNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs font-mono"
                        >
                          {pair.setNumber} ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
