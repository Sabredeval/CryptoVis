import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card } from '../Shared';

/* ─── AES S-Box for internal use ─── */
const SBOX: number[] = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
];

function gmul(a: number, b: number): number {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

function aesRound(state: number[]): number[] {
  // SubBytes
  let s = state.map(b => SBOX[b & 0xff]);
  // ShiftRows (column-major: state[row + 4*col])
  const sr = [...s];
  for (let row = 1; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      sr[row + 4 * col] = s[row + 4 * ((col + row) % 4)];
    }
  }
  s = sr;
  // MixColumns
  const mc = [...s];
  for (let col = 0; col < 4; col++) {
    const b = [s[0 + 4 * col], s[1 + 4 * col], s[2 + 4 * col], s[3 + 4 * col]];
    mc[0 + 4 * col] = gmul(2, b[0]) ^ gmul(3, b[1]) ^ b[2] ^ b[3];
    mc[1 + 4 * col] = b[0] ^ gmul(2, b[1]) ^ gmul(3, b[2]) ^ b[3];
    mc[2 + 4 * col] = b[0] ^ b[1] ^ gmul(2, b[2]) ^ gmul(3, b[3]);
    mc[3 + 4 * col] = gmul(3, b[0]) ^ b[1] ^ b[2] ^ gmul(2, b[3]);
  }
  // AddRoundKey with a pseudo key
  return mc.map((b, i) => b ^ ((i * 0x37 + 0xab) & 0xff));
}

function countDiffBits(a: number[], b: number[]): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    let diff = a[i] ^ b[i];
    while (diff) { count += diff & 1; diff >>= 1; }
  }
  return count;
}

/* ─── Avalanche Effect Comparator ─── */
export function AvalancheEffect() {
  const [flipBit, setFlipBit] = useState(0);
  const MAX_ROUNDS = 10;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Two 128-bit blocks differing by 1 bit
  const block1 = useMemo(() => {
    const b = new Array(16).fill(0);
    for (let i = 0; i < 16; i++) b[i] = (i * 0x11 + 0x32) & 0xff;
    return b;
  }, []);

  const block2 = useMemo(() => {
    const b = [...block1];
    const byteIdx = Math.floor(flipBit / 8);
    const bitIdx = flipBit % 8;
    b[byteIdx] ^= (1 << (7 - bitIdx));
    return b;
  }, [block1, flipBit]);

  const avalancheData = useMemo(() => {
    const data: Array<{ round: number; diffBits: number; pct: number }> = [];
    let s1 = [...block1];
    let s2 = [...block2];
    data.push({ round: 0, diffBits: countDiffBits(s1, s2), pct: countDiffBits(s1, s2) / 128 * 100 });

    for (let r = 1; r <= MAX_ROUNDS; r++) {
      s1 = aesRound(s1);
      s2 = aesRound(s2);
      const diff = countDiffBits(s1, s2);
      data.push({ round: r, diffBits: diff, pct: diff / 128 * 100 });
    }
    return data;
  }, [block1, block2]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 500, H = 220;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const padL = 50, padR = 20, padT = 20, padB = 35;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = padT + plotH - (pct / 100) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, padL - 5, y + 3);
    }

    // 50% target line
    const y50 = padT + plotH - 0.5 * plotH;
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y50);
    ctx.lineTo(padL + plotW, y50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('50% (ideal)', padL + plotW - 60, y50 - 5);

    // Plot line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    avalancheData.forEach((d, i) => {
      const x = padL + (i / MAX_ROUNDS) * plotW;
      const y = padT + plotH - (d.pct / 100) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    avalancheData.forEach((d, i) => {
      const x = padL + (i / MAX_ROUNDS) * plotW;
      const y = padT + plotH - (d.pct / 100) * plotH;
      ctx.fillStyle = d.pct > 40 && d.pct < 60 ? '#10b981' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Round label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`R${d.round}`, x, padT + plotH + 15);

      // Value label
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(`${d.pct.toFixed(0)}`, x, y - 10);
    });

    // Axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Round Number', padL + plotW / 2, H - 5);
  }, [avalancheData]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <Card title="Avalanche Effect Comparator">
      <p className="text-xs text-gray-500 mb-3">
        Two 128-bit blocks differ by <strong>exactly 1 bit</strong>. Watch the percentage of differing bits
        climb toward ~50% ("complete diffusion") after just a few AES rounds.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs text-gray-500">Flip bit position:</label>
        <input
          type="range"
          min={0}
          max={127}
          value={flipBit}
          onChange={e => setFlipBit(Number(e.target.value))}
          className="flex-1 max-w-xs accent-blue-500"
        />
        <span className="text-xs text-blue-400 font-mono">bit {flipBit}</span>
      </div>

      <canvas ref={canvasRef} className="w-full max-w-[500px] rounded-lg border border-gray-700 mb-3" />

      <div className="text-xs text-gray-600">
        After round 3–4, ~50% of bits differ — a single bit change propagates fully.
      </div>
    </Card>
  );
}

/* ─── S-Box Difference Distribution Table ─── */
export function DifferentialLinearViz() {
  const [mode, setMode] = useState<'differential' | 'linear'>('differential');

  // Difference Distribution Table for AES S-Box (first 16×16 corner)
  const diffTable = useMemo(() => {
    const table: number[][] = Array.from({ length: 16 }, () => Array(16).fill(0));
    for (let inputDiff = 0; inputDiff < 16; inputDiff++) {
      for (let x = 0; x < 256; x++) {
        const outDiff = SBOX[x] ^ SBOX[x ^ inputDiff];
        if (outDiff < 16) table[inputDiff][outDiff]++;
      }
    }
    return table;
  }, []);

  // Linear Approximation Table (partial, first 16×16)
  const latTable = useMemo(() => {
    const table: number[][] = Array.from({ length: 16 }, () => Array(16).fill(0));
    for (let inputMask = 0; inputMask < 16; inputMask++) {
      for (let outputMask = 0; outputMask < 16; outputMask++) {
        let count = 0;
        for (let x = 0; x < 256; x++) {
          const inputParity = parity(x & inputMask);
          const outputParity = parity(SBOX[x] & outputMask);
          if (inputParity === outputParity) count++;
        }
        table[inputMask][outputMask] = count - 128; // bias from 128
      }
    }
    return table;
  }, []);

  function parity(x: number): number {
    let p = 0;
    while (x) { p ^= x & 1; x >>= 1; }
    return p;
  }

  const table = mode === 'differential' ? diffTable : latTable;
  const maxVal = Math.max(...table.flat().map(Math.abs));

  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  return (
    <Card title={mode === 'differential' ? 'Difference Distribution Table' : 'Linear Approximation Table'}>
      <p className="text-xs text-gray-500 mb-3">
        {mode === 'differential'
          ? <>Shows how input differences map to output differences through the S-Box. Uniformly low values = good resistance to <strong>differential cryptanalysis</strong>.</>
          : <>Shows the bias of linear approximations through the S-Box. Values near 0 = good resistance to <strong>linear cryptanalysis</strong>.</>
        }
      </p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('differential')}
          className={`px-3 py-1.5 text-xs rounded-lg ${mode === 'differential' ? 'bg-red-600' : 'bg-gray-700'}`}>
          Differential
        </button>
        <button onClick={() => setMode('linear')}
          className={`px-3 py-1.5 text-xs rounded-lg ${mode === 'linear' ? 'bg-purple-600' : 'bg-gray-700'}`}>
          Linear
        </button>
      </div>

      <div className="overflow-x-auto">
        {/* Column headers */}
        <div className="flex gap-px ml-6 mb-px">
          {Array.from({ length: 16 }, (_, c) => (
            <div key={c} className={`w-6 text-center text-[8px] font-mono ${
              hoverCell?.c === c ? 'text-blue-400' : 'text-gray-600'
            }`}>
              {c.toString(16).toUpperCase()}
            </div>
          ))}
        </div>

        {table.map((row, r) => (
          <div key={r} className="flex gap-px">
            <div className={`w-5 text-center text-[8px] font-mono self-center ${
              hoverCell?.r === r ? 'text-blue-400' : 'text-gray-600'
            }`}>
              {r.toString(16).toUpperCase()}
            </div>
            {row.map((val, c) => {
              const absVal = Math.abs(val);
              const intensity = maxVal > 0 ? absVal / maxVal : 0;
              const isHover = hoverCell?.r === r && hoverCell?.c === c;
              return (
                <div
                  key={c}
                  onMouseEnter={() => setHoverCell({ r, c })}
                  onMouseLeave={() => setHoverCell(null)}
                  className={`w-6 h-6 flex items-center justify-center text-[8px] font-mono rounded-sm cursor-pointer transition-all ${
                    isHover ? 'scale-150 z-10 ring-1 ring-white shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: mode === 'differential'
                      ? `rgba(239, 68, 68, ${intensity * 0.8})`
                      : val > 0
                      ? `rgba(168, 85, 247, ${intensity * 0.8})`
                      : val < 0
                      ? `rgba(59, 130, 246, ${intensity * 0.8})`
                      : 'rgba(31, 41, 55, 0.3)',
                    color: intensity > 0.5 ? '#fff' : '#9ca3af',
                  }}
                >
                  {val}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hoverCell && (
        <div className="mt-3 text-xs text-gray-400">
          {mode === 'differential'
            ? <>Input diff <span className="text-red-400">Δ=0x{hoverCell.r.toString(16).toUpperCase()}</span> → Output diff <span className="text-red-400">Δ=0x{hoverCell.c.toString(16).toUpperCase()}</span>: <strong className="text-white">{table[hoverCell.r][hoverCell.c]}</strong> out of 256 pairs</>
            : <>Input mask <span className="text-purple-400">0x{hoverCell.r.toString(16).toUpperCase()}</span>, Output mask <span className="text-purple-400">0x{hoverCell.c.toString(16).toUpperCase()}</span>: bias = <strong className="text-white">{table[hoverCell.r][hoverCell.c]}</strong>/256</>
          }
        </div>
      )}
    </Card>
  );
}
