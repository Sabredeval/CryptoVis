import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../Shared';

const hex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase();

/* ─── Feistel Ladder Diagram ─── */
export function FeistelLadder() {
  const [round, setRound] = useState(0);
  const ROUNDS = 16;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 420;
  const H = 520;

  // Simulate L/R halves
  const [leftInit] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [rightInit] = useState(() => Math.floor(Math.random() * 0xffffffff));

  const rounds = useMemo(() => {
    const rs: Array<{ L: number; R: number; K: number }> = [];
    let L = leftInit;
    let R = rightInit;
    for (let i = 0; i < ROUNDS; i++) {
      const K = ((i * 0x13579bdf + 0xdeadbeef) >>> 0);
      rs.push({ L, R, K });
      const fOut = ((R ^ K) * 0x9e3779b9) >>> 0;
      const newR = (L ^ fOut) >>> 0;
      L = R;
      R = newR;
    }
    rs.push({ L, R, K: 0 }); // final
    return rs;
  }, [leftInit, rightInit]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const colL = 100, colR = 300;
    const startY = 30;
    const rowH = Math.min(28, (H - 80) / (round + 2));

    // Draw up to current round
    for (let i = 0; i <= Math.min(round, ROUNDS - 1); i++) {
      const y = startY + i * rowH;
      const isActive = i === round;
      const alpha = isActive ? 1.0 : 0.4;

      // L box
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#1e3a5f';
      ctx.strokeStyle = isActive ? '#3b82f6' : '#374151';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.fillRect(colL - 40, y, 80, 20);
      ctx.strokeRect(colL - 40, y, 80, 20);
      ctx.fillStyle = '#60a5fa';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L${i}: ${(rounds[i].L >>> 0).toString(16).padStart(8, '0').slice(0, 8)}`, colL, y + 14);

      // R box
      ctx.fillStyle = '#1a3d2e';
      ctx.strokeStyle = isActive ? '#10b981' : '#374151';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.fillRect(colR - 40, y, 80, 20);
      ctx.strokeRect(colR - 40, y, 80, 20);
      ctx.fillStyle = '#34d399';
      ctx.fillText(`R${i}: ${(rounds[i].R >>> 0).toString(16).padStart(8, '0').slice(0, 8)}`, colR, y + 14);

      // Crossover lines
      if (i < round) {
        const ny = startY + (i + 1) * rowH;
        ctx.globalAlpha = 0.3;
        // L → next L (becomes R of current)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colL, y + 20);
        ctx.lineTo(colL, ny);
        ctx.stroke();

        // R → crosses to next R
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(colR, y + 20);
        ctx.lineTo(colR, ny);
        ctx.stroke();

        // F-function
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(colR, y + 10);
        ctx.lineTo(colR + 60, y + 10);
        ctx.lineTo(colR + 60, y + rowH / 2);
        ctx.lineTo(colL, y + rowH / 2 + 5);
        ctx.stroke();
        ctx.setLineDash([]);

        // XOR circle
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(colL, y + rowH / 2 + 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('⊕', colL, y + rowH / 2 + 9);
      }

      ctx.globalAlpha = 1;
    }

    // Active round detail
    if (round <= ROUNDS - 1) {
      const y = startY + round * rowH;
      // F function box
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      const fX = colR + 50, fY = y - 2;
      ctx.fillRect(fX, fY, 30, 24);
      ctx.strokeRect(fX, fY, 30, 24);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('F', fX + 15, fY + 16);

      // Key arrow into F
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(fX + 15, fY - 8);
      ctx.lineTo(fX + 15, fY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '9px monospace';
      ctx.fillText(`K${round + 1}`, fX + 15, fY - 12);
    }

    // Final state
    const finalY = startY + (round + 1) * rowH;
    ctx.fillStyle = '#3b1d6e';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.fillRect(colL - 40, finalY, 80, 20);
    ctx.strokeRect(colL - 40, finalY, 80, 20);
    ctx.fillRect(colR - 40, finalY, 80, 20);
    ctx.strokeRect(colR - 40, finalY, 80, 20);
    ctx.fillStyle = '#c084fc';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    const fi = Math.min(round + 1, ROUNDS);
    ctx.fillText(`L${fi}: ${(rounds[fi].L >>> 0).toString(16).padStart(8, '0').slice(0, 8)}`, colL, finalY + 14);
    ctx.fillText(`R${fi}: ${(rounds[fi].R >>> 0).toString(16).padStart(8, '0').slice(0, 8)}`, colR, finalY + 14);
  }, [round, rounds]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <Card title="Feistel Network Ladder (DES Structure)">
      <p className="text-xs text-gray-500 mb-3">
        A Feistel round: <code className="text-blue-400">L{'{i+1}'} = R{'{i}'}</code>,{' '}
        <code className="text-green-400">R{'{i+1}'} = L{'{i}'} ⊕ F(R{'{i}'}, K{'{i}'})</code>.
        The crossover ensures <strong>invertibility</strong> — you can decrypt without inverting F!
      </p>

      <canvas ref={canvasRef} className="w-full max-w-[420px] rounded-lg border border-gray-700 mb-3" />

      <div className="flex items-center gap-3">
        <button onClick={() => setRound(r => Math.max(0, r - 1))} disabled={round === 0}
          className="px-3 py-1.5 text-xs bg-gray-700 disabled:opacity-30 rounded-lg">← Prev</button>
        <span className="text-xs text-gray-400">Round {round + 1} / {ROUNDS}</span>
        <button onClick={() => setRound(r => Math.min(ROUNDS - 1, r + 1))} disabled={round >= ROUNDS - 1}
          className="px-3 py-1.5 text-xs bg-gray-700 disabled:opacity-30 rounded-lg">Next →</button>
        <button onClick={() => setRound(0)} className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg ml-auto">Reset</button>
      </div>
    </Card>
  );
}

/* ─── DES Expansion Permutation & P-Box ─── */
export function ExpansionPBox() {
  // DES expansion table (32 → 48 bits)
  const E_TABLE = [
    32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9,10,11,
    12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,
    22,23,24,25,24,25,26,27,28,29,28,29,30,31,32, 1,
  ];

  const [hoverInput, setHoverInput] = useState<number | null>(null);
  const [hoverOutput, setHoverOutput] = useState<number | null>(null);

  // Which output positions use input bit X?
  const inputHighlights = useMemo(() => {
    if (hoverInput === null) return new Set<number>();
    return new Set(E_TABLE.map((v, i) => v === hoverInput + 1 ? i : -1).filter(v => v >= 0));
  }, [hoverInput]);

  // Which input bit does output position Y use?
  const outputSource = hoverOutput !== null ? E_TABLE[hoverOutput] - 1 : null;

  return (
    <Card title="DES Expansion Permutation (32 → 48 bits)">
      <p className="text-xs text-gray-500 mb-3">
        The 32-bit half-block is expanded to 48 bits. Some bits are <span className="text-yellow-400">duplicated</span> — hover
        to see the wire crossings.
      </p>

      <div className="space-y-4">
        {/* 32-bit input */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Input (32 bits)</div>
          <div className="flex flex-wrap gap-0.5">
            {Array.from({ length: 32 }, (_, i) => {
              const isDuplicated = E_TABLE.filter(v => v === i + 1).length > 1;
              const isSourced = outputSource === i;
              const isHovered = hoverInput === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => { setHoverInput(i); setHoverOutput(null); }}
                  onMouseLeave={() => setHoverInput(null)}
                  className={`w-6 h-6 flex items-center justify-center text-[9px] font-mono rounded-sm border cursor-pointer transition-all ${
                    isHovered || isSourced
                      ? 'bg-blue-600 border-blue-400 text-white scale-110'
                      : isDuplicated
                      ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400'
                      : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wires indicator */}
        {hoverInput !== null && (
          <div className="text-xs text-blue-400">
            Bit {hoverInput + 1} → Output positions: [{Array.from(inputHighlights).map(v => v + 1).join(', ')}]
            {inputHighlights.size > 1 && <span className="text-yellow-400 ml-2">(duplicated!)</span>}
          </div>
        )}

        {/* 48-bit output */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Output (48 bits)</div>
          <div className="flex flex-wrap gap-0.5">
            {E_TABLE.map((srcBit, i) => {
              const isDup = E_TABLE.filter(v => v === srcBit).length > 1;
              const isHighlighted = inputHighlights.has(i);
              const isHovered = hoverOutput === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => { setHoverOutput(i); setHoverInput(null); }}
                  onMouseLeave={() => setHoverOutput(null)}
                  className={`w-6 h-6 flex items-center justify-center text-[9px] font-mono rounded-sm border cursor-pointer transition-all ${
                    isHighlighted || isHovered
                      ? 'bg-green-600 border-green-400 text-white scale-110'
                      : isDup
                      ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400'
                      : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}
                >
                  {srcBit}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── DES 6-to-4 Bit S-Box ─── */
export function DesSBox() {
  const [inputBits, setInputBits] = useState('101101');

  // DES S-Box 1
  const S1 = [
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],
    [0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],
    [4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],
    [15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
  ];

  const bits = inputBits.padEnd(6, '0').slice(0, 6).split('').map(Number);
  const row = (bits[0] << 1) | bits[5];
  const col = (bits[1] << 3) | (bits[2] << 2) | (bits[3] << 1) | bits[4];
  const output = S1[row]?.[col] ?? 0;
  const outputBits = output.toString(2).padStart(4, '0');

  return (
    <Card title="DES S-Box (6 → 4 bits)">
      <p className="text-xs text-gray-500 mb-3">
        The 6-bit input is split: <span className="text-red-400">outer bits</span> (bit 1 & 6) select the row,
        <span className="text-blue-400 ml-1">inner bits</span> (bits 2-5) select the column. This is the <strong>only non-linear</strong> part of DES.
      </p>

      {/* Input bit selector */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">6-bit Input (click to toggle)</div>
        <div className="flex gap-1">
          {bits.map((b, i) => {
            const isOuter = i === 0 || i === 5;
            return (
              <button
                key={i}
                onClick={() => {
                  const newBits = [...bits];
                  newBits[i] = 1 - newBits[i];
                  setInputBits(newBits.join(''));
                }}
                className={`w-10 h-12 flex flex-col items-center justify-center font-mono text-lg rounded-lg border transition-all ${
                  isOuter
                    ? b ? 'bg-red-900/60 border-red-500 text-red-300' : 'bg-red-900/20 border-red-700/50 text-red-500'
                    : b ? 'bg-blue-900/60 border-blue-500 text-blue-300' : 'bg-blue-900/20 border-blue-700/50 text-blue-500'
                }`}
              >
                {b}
                <span className="text-[8px] text-gray-500">{isOuter ? 'outer' : 'inner'}</span>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Row = <span className="text-red-400 font-mono">{bits[0]}{bits[5]}</span> = <span className="text-red-300 font-bold">{row}</span>,
          Col = <span className="text-blue-400 font-mono">{bits[1]}{bits[2]}{bits[3]}{bits[4]}</span> = <span className="text-blue-300 font-bold">{col}</span>
        </div>
      </div>

      {/* S-Box table */}
      <div className="overflow-x-auto">
        <div className="text-xs text-gray-500 mb-1">S-Box 1 (S₁)</div>
        <table className="text-[10px] font-mono">
          <thead>
            <tr>
              <th className="w-8"></th>
              {Array.from({ length: 16 }, (_, c) => (
                <th key={c} className={`w-6 text-center ${c === col ? 'text-blue-400 font-bold' : 'text-gray-600'}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {S1.map((srow, r) => (
              <tr key={r}>
                <td className={`text-center ${r === row ? 'text-red-400 font-bold' : 'text-gray-600'}`}>{r}</td>
                {srow.map((v, c) => (
                  <td
                    key={c}
                    className={`text-center py-0.5 rounded-sm ${
                      r === row && c === col
                        ? 'bg-yellow-600 text-white font-bold text-xs'
                        : r === row
                        ? 'bg-red-900/30 text-red-400'
                        : c === col
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Output */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-xl text-xs">
        <span className="text-gray-400">S₁(</span>
        <span className="text-red-400">{bits[0]}</span>
        <span className="text-blue-400">{bits[1]}{bits[2]}{bits[3]}{bits[4]}</span>
        <span className="text-red-400">{bits[5]}</span>
        <span className="text-gray-400">) → Row {row}, Col {col} → </span>
        <span className="text-yellow-400 font-bold">{output}</span>
        <span className="text-gray-400"> = </span>
        <span className="text-yellow-400 font-mono font-bold">{outputBits}</span>
        <span className="text-gray-500 ml-1">(4-bit output)</span>
      </div>
    </Card>
  );
}
