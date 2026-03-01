import { useState, useMemo, useCallback } from 'react';
import { Card } from '../Shared';

/* ─── Full AES S-Box ─── */
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

const INV_SBOX: number[] = (() => {
  const inv = new Array(256);
  for (let i = 0; i < 256; i++) inv[SBOX[i]] = i;
  return inv;
})();

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

const hex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase();

/* ─── SubBytes Visualizer ─── */
export function SubBytesViz() {
  const [selectedByte, setSelectedByte] = useState(0x9a);
  const [inverse, setInverse] = useState(false);
  const activeSbox = inverse ? INV_SBOX : SBOX;

  const row = (selectedByte >> 4) & 0xf;
  const col = selectedByte & 0xf;
  const result = activeSbox[selectedByte];

  // Demo state
  const demoState: number[][] = [
    [0x32, 0x88, 0x31, 0xe0],
    [0x43, 0x5a, 0x31, 0x37],
    [0xf6, 0x30, 0x98, 0x07],
    [0xa8, 0x8d, 0xa2, 0x34],
  ];

  const [activeCell, setActiveCell] = useState<number | null>(null);
  const activeCellByte = activeCell !== null ? demoState[Math.floor(activeCell / 4)][activeCell % 4] : selectedByte;
  const activeCellRow = (activeCellByte >> 4) & 0xf;
  const activeCellCol = activeCellByte & 0xf;
  const activeCellResult = activeSbox[activeCellByte];

  return (
    <Card title={inverse ? 'InvSubBytes (Reverse S-Box Lookup)' : 'SubBytes (S-Box Substitution)'}>
      <p className="text-xs text-gray-500 mb-3">
        Each byte is replaced using the S-Box lookup table. The high nibble selects the <span className="text-blue-400">row</span>,
        the low nibble selects the <span className="text-purple-400">column</span>.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInverse(false)}
          className={`px-3 py-1.5 text-xs rounded-lg ${!inverse ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          SubBytes (Forward)
        </button>
        <button
          onClick={() => setInverse(true)}
          className={`px-3 py-1.5 text-xs rounded-lg ${inverse ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          InvSubBytes (Inverse)
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* State grid */}
        <div>
          <div className="text-xs text-gray-500 mb-1">State Grid (click a cell)</div>
          <div className="grid grid-cols-4 gap-1.5">
            {demoState.flat().map((val, idx) => {
              const isActive = activeCell === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCell(isActive ? null : idx)}
                  className={`w-14 h-14 flex flex-col items-center justify-center font-mono text-sm rounded-lg border transition-all ${
                    isActive
                      ? 'bg-blue-900/60 border-blue-400 text-blue-200 scale-110 ring-2 ring-blue-500'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span>{hex(val)}</span>
                  <span className="text-[8px] text-gray-500">→{hex(activeSbox[val])}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* S-Box grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="text-xs text-gray-500 mb-1">
            16×16 {inverse ? 'Inverse ' : ''}S-Box
          </div>
          {/* Column headers */}
          <div className="flex gap-px mb-px ml-7">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className={`w-7 h-5 flex items-center justify-center text-[8px] font-mono ${
                i === activeCellCol ? 'text-purple-400 font-bold' : 'text-gray-600'
              }`}>
                {i.toString(16).toUpperCase()}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-px">
            {Array.from({ length: 16 }, (_, r) => (
              <div key={r} className="flex gap-px">
                {/* Row header */}
                <div className={`w-6 h-6 flex items-center justify-center text-[8px] font-mono ${
                  r === activeCellRow ? 'text-blue-400 font-bold' : 'text-gray-600'
                }`}>
                  {r.toString(16).toUpperCase()}
                </div>
                {Array.from({ length: 16 }, (_, c) => {
                  const idx = r * 16 + c;
                  const isTarget = r === activeCellRow && c === activeCellCol;
                  const isRow = r === activeCellRow;
                  const isCol = c === activeCellCol;
                  return (
                    <div
                      key={c}
                      className={`w-7 h-6 flex items-center justify-center text-[9px] font-mono rounded-sm transition-all ${
                        isTarget
                          ? 'bg-yellow-600 border border-yellow-400 text-white font-bold scale-125 z-10 shadow-lg'
                          : isRow
                          ? 'bg-blue-900/40 border border-blue-700/40 text-blue-400'
                          : isCol
                          ? 'bg-purple-900/40 border border-purple-700/40 text-purple-400'
                          : 'bg-gray-800/60 text-gray-500'
                      }`}
                    >
                      {hex(activeSbox[idx])}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result callout */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-xl text-xs">
        <span className="text-gray-400">Byte </span>
        <span className="text-blue-400 font-mono font-bold">{hex(activeCellByte)}</span>
        <span className="text-gray-400"> → Row </span>
        <span className="text-blue-400 font-bold">{activeCellRow.toString(16).toUpperCase()}</span>
        <span className="text-gray-400">, Col </span>
        <span className="text-purple-400 font-bold">{activeCellCol.toString(16).toUpperCase()}</span>
        <span className="text-gray-400"> → </span>
        <span className="text-yellow-400 font-mono font-bold">{hex(activeCellResult)}</span>
      </div>
    </Card>
  );
}

/* ─── ShiftRows Visualizer ─── */
export function ShiftRowsViz() {
  const [shifted, setShifted] = useState(false);

  const state: number[][] = [
    [0x63, 0xa0, 0xe1, 0x38],
    [0x1a, 0xc9, 0x77, 0xd2],
    [0xf6, 0x30, 0x98, 0x07],
    [0xa8, 0x8d, 0xa2, 0x34],
  ];

  // Colors per column for tracking movement
  const colColors = ['text-red-400', 'text-green-400', 'text-blue-400', 'text-yellow-400'];
  const colBgs = ['bg-red-900/30 border-red-700/50', 'bg-green-900/30 border-green-700/50', 'bg-blue-900/30 border-blue-700/50', 'bg-yellow-900/30 border-yellow-700/50'];

  const getShiftedRow = (row: number[], shift: number) => {
    if (!shifted) return row;
    return [...row.slice(shift), ...row.slice(0, shift)];
  };

  return (
    <Card title="ShiftRows (Permutation)">
      <p className="text-xs text-gray-500 mb-3">
        Each row is cyclically shifted left by its row number. This scatters bytes across <strong>columns</strong>,
        enabling inter-column diffusion in the next MixColumns step.
      </p>

      <button
        onClick={() => setShifted(s => !s)}
        className={`px-4 py-2 text-sm rounded-lg mb-4 transition-all ${
          shifted ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {shifted ? '↩ Reset' : '→ Apply ShiftRows'}
      </button>

      <div className="space-y-2">
        {state.map((row, r) => {
          const displayed = getShiftedRow(row, r);
          return (
            <div key={r} className="flex items-center gap-3">
              <div className="w-24 text-xs text-gray-500 text-right">
                Row {r}: shift {r}
                {r === 0 && <span className="text-green-400 ml-1">(none)</span>}
              </div>
              <div className="flex gap-1.5">
                {displayed.map((val, c) => {
                  // Find original column index
                  const origCol = shifted ? (c + r) % 4 : c;
                  return (
                    <div
                      key={c}
                      className={`w-14 h-14 flex items-center justify-center font-mono text-sm rounded-lg border transition-all duration-700 ${colBgs[origCol]} ${colColors[origCol]}`}
                      style={{
                        transform: shifted && r > 0 ? `translateX(0px)` : undefined,
                      }}
                    >
                      {hex(val)}
                    </div>
                  );
                })}
              </div>
              {shifted && r > 0 && (
                <span className="text-yellow-400 text-xs">← {r}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-600">
        Color-coding tracks where each byte originated. Notice how columns are now <em>scattered</em>.
      </div>
    </Card>
  );
}

/* ─── MixColumns Visualizer ─── */
export function MixColumnsViz() {
  const [selectedCol, setSelectedCol] = useState(0);
  const [hoverOutput, setHoverOutput] = useState<number | null>(null);

  const state: number[][] = [
    [0xdb, 0xf2, 0x01, 0xc6],
    [0x13, 0x0a, 0x01, 0xc6],
    [0x53, 0x22, 0x01, 0xc6],
    [0x45, 0x5c, 0x01, 0xc6],
  ];

  const MIX_MATRIX = [
    [2, 3, 1, 1],
    [1, 2, 3, 1],
    [1, 1, 2, 3],
    [3, 1, 1, 2],
  ];

  const inputCol = [state[0][selectedCol], state[1][selectedCol], state[2][selectedCol], state[3][selectedCol]];

  const outputCol = useMemo(() => {
    return MIX_MATRIX.map(row =>
      row.reduce((acc, coeff, i) => acc ^ gmul(coeff, inputCol[i]), 0)
    );
  }, [selectedCol, inputCol]);

  return (
    <Card title="MixColumns (Diffusion)">
      <p className="text-xs text-gray-500 mb-3">
        Each column is multiplied by a fixed matrix in GF(2⁸). Hover over an output byte to see which
        input bytes contribute — <strong>changing 1 input byte changes all 4 output bytes</strong>.
      </p>

      {/* Column selector */}
      <div className="flex gap-2 mb-4">
        {[0, 1, 2, 3].map(c => (
          <button
            key={c}
            onClick={() => setSelectedCol(c)}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              selectedCol === c ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Column {c}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Mix matrix */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Mix Matrix</div>
          <div className="grid grid-cols-4 gap-1">
            {MIX_MATRIX.flat().map((v, idx) => {
              const outRow = Math.floor(idx / 4);
              const inRow = idx % 4;
              const isHighlight = hoverOutput !== null && outRow === hoverOutput;
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-xs rounded border transition-all ${
                    isHighlight
                      ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {v}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-2xl text-gray-500 self-center">×</div>

        {/* Input column */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Input Col {selectedCol}</div>
          <div className="flex flex-col gap-1">
            {inputCol.map((v, i) => {
              const isHighlight = hoverOutput !== null;
              return (
                <div
                  key={i}
                  className={`w-14 h-8 flex items-center justify-center font-mono text-xs rounded border transition-all ${
                    isHighlight
                      ? 'bg-blue-900/60 border-blue-400 text-blue-200 ring-1 ring-blue-500'
                      : 'bg-gray-800 border-gray-600 text-gray-300'
                  }`}
                >
                  {hex(v)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-2xl text-gray-500 self-center">=</div>

        {/* Output column */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Output</div>
          <div className="flex flex-col gap-1">
            {outputCol.map((v, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoverOutput(i)}
                onMouseLeave={() => setHoverOutput(null)}
                className={`w-14 h-8 flex items-center justify-center font-mono text-xs rounded border cursor-pointer transition-all ${
                  hoverOutput === i
                    ? 'bg-yellow-900/60 border-yellow-400 text-yellow-200 scale-110 font-bold'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {hex(v)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail when hovering */}
      {hoverOutput !== null && (
        <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-800 rounded-xl text-xs font-mono">
          <span className="text-yellow-400">{hex(outputCol[hoverOutput])}</span>
          <span className="text-gray-400"> = </span>
          {MIX_MATRIX[hoverOutput].map((coeff, i) => (
            <span key={i}>
              {i > 0 && <span className="text-gray-500"> ⊕ </span>}
              <span className="text-cyan-400">{coeff}</span>
              <span className="text-gray-500">·</span>
              <span className="text-blue-400">{hex(inputCol[i])}</span>
            </span>
          ))}
          <span className="text-gray-500 ml-2">(all in GF(2⁸))</span>
        </div>
      )}
    </Card>
  );
}

/* ─── AddRoundKey Visualizer ─── */
export function AddRoundKeyViz() {
  const [merged, setMerged] = useState(false);

  const state: number[][] = [
    [0xdb, 0xf2, 0x01, 0xc6],
    [0x13, 0x0a, 0x01, 0xc6],
    [0x53, 0x22, 0x01, 0xc6],
    [0x45, 0x5c, 0x01, 0xc6],
  ];

  const roundKey: number[][] = [
    [0x2b, 0x28, 0xab, 0x09],
    [0x7e, 0xae, 0xf7, 0xcf],
    [0x15, 0xd2, 0x15, 0x4f],
    [0x16, 0xa6, 0x88, 0x3c],
  ];

  const result = state.map((row, r) => row.map((v, c) => v ^ roundKey[r][c]));

  return (
    <Card title="AddRoundKey (XOR with Key)">
      <p className="text-xs text-gray-500 mb-3">
        The State is XOR'd with the Round Key, bit-by-bit. This is the only step that introduces the <strong>secret key</strong>.
      </p>

      <button
        onClick={() => setMerged(m => !m)}
        className={`px-4 py-2 text-sm rounded-lg mb-4 ${
          merged ? 'bg-yellow-600' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {merged ? '↩ Separate' : '⊕ Merge (XOR)'}
      </button>

      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* State */}
        <div>
          <div className="text-xs text-gray-500 mb-1">State</div>
          <div className="grid grid-cols-4 gap-1.5">
            {state.flat().map((v, idx) => (
              <div key={idx} className={`w-14 h-12 flex items-center justify-center font-mono text-xs rounded-lg border transition-all duration-500 ${
                merged ? 'opacity-30 scale-90' : 'bg-blue-900/30 border-blue-600/50 text-blue-300'
              }`}>
                {hex(v)}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xl text-yellow-400 self-center">⊕</div>

        {/* Round Key */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Round Key</div>
          <div className="grid grid-cols-4 gap-1.5">
            {roundKey.flat().map((v, idx) => (
              <div key={idx} className={`w-14 h-12 flex items-center justify-center font-mono text-xs rounded-lg border transition-all duration-500 ${
                merged ? 'opacity-30 scale-90' : 'bg-red-900/30 border-red-600/50 text-red-300'
              }`}>
                {hex(v)}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xl text-gray-500 self-center">=</div>

        {/* Result */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Result</div>
          <div className="grid grid-cols-4 gap-1.5">
            {result.flat().map((v, idx) => {
              const r = Math.floor(idx / 4);
              const c = idx % 4;
              const stateVal = state[r][c];
              const keyVal = roundKey[r][c];
              const flipped = stateVal ^ keyVal;
              const bitsFlipped = flipped.toString(2).split('').filter(b => b === '1').length;
              return (
                <div key={idx} className={`w-14 h-12 flex flex-col items-center justify-center font-mono rounded-lg border transition-all duration-500 ${
                  merged
                    ? 'bg-green-900/40 border-green-500 text-green-300 scale-105'
                    : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  <span className="text-xs">{hex(v)}</span>
                  {merged && <span className="text-[8px] text-green-500">{bitsFlipped} flipped</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
