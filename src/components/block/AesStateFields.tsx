import { useState, useMemo } from 'react';
import { Card } from '../Shared';

/* ─── Helpers ─── */
function byteToPoly(b: number): string {
  if (b === 0) return '0';
  const terms: string[] = [];
  for (let i = 7; i >= 0; i--) {
    if (b & (1 << i)) {
      if (i === 0) terms.push('1');
      else if (i === 1) terms.push('x');
      else terms.push(`x${superscript(i)}`);
    }
  }
  return terms.join(' + ');
}

function superscript(n: number): string {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map(c => map[c] || c).join('');
}

/* ─── State Matrix Translator ─── */
export function StateMatrixTranslator() {
  const [input, setInput] = useState('Hello World!!!!!');

  // Pad/truncate to 16 bytes
  const bytes = useMemo(() => {
    const raw = Array.from(input).map(c => c.charCodeAt(0) & 0xff);
    while (raw.length < 16) raw.push(0x00);
    return raw.slice(0, 16);
  }, [input]);

  // AES fills column-major: state[row][col] = bytes[row + 4*col]
  const state = useMemo(() => {
    const m: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let col = 0; col < 4; col++)
      for (let row = 0; row < 4; row++)
        m[row][col] = bytes[row + 4 * col];
    return m;
  }, [bytes]);

  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const hoverByte = hover ? state[hover.r][hover.c] : null;
  const hoverChar = hoverByte !== null ? (hoverByte >= 32 && hoverByte < 127 ? String.fromCharCode(hoverByte) : '·') : null;

  return (
    <Card title="State Matrix Translator">
      <p className="text-xs text-gray-500 mb-3">
        Type text below — watch it fill a 4×4 state grid in <span className="text-blue-400">column-major</span> order,
        just like AES does internally.
      </p>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm mb-4 focus:outline-none focus:border-blue-500"
        placeholder="Type up to 16 characters…"
        maxLength={16}
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Grid */}
        <div>
          <div className="text-xs text-gray-500 mb-1">4×4 State (hex)</div>
          <div className="grid grid-cols-4 gap-1.5">
            {state.flat().map((val, idx) => {
              const r = Math.floor(idx / 4);
              const c = idx % 4;
              const isHover = hover?.r === r && hover?.c === c;
              // column-major index
              const srcIdx = r + 4 * c;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseLeave={() => setHover(null)}
                  className={`w-16 h-16 flex flex-col items-center justify-center font-mono text-sm rounded-lg border cursor-pointer transition-all ${
                    isHover
                      ? 'bg-blue-900/60 border-blue-400 text-blue-200 scale-110 shadow-lg shadow-blue-900/40'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="text-xs">{val.toString(16).padStart(2, '0').toUpperCase()}</span>
                  <span className="text-[9px] text-gray-500 mt-0.5">idx {srcIdx}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-gray-600 mt-1 flex gap-3">
            <span>Col 0</span><span>Col 1</span><span>Col 2</span><span>Col 3</span>
          </div>
        </div>

        {/* Hover tooltip */}
        <div className="flex-1 min-w-[220px]">
          {hover && hoverByte !== null ? (
            <div className="p-4 bg-gray-800/80 border border-blue-700/50 rounded-xl space-y-2 text-sm">
              <div className="text-xs text-gray-500">
                Cell [{hover.r}, {hover.c}] — Source byte {hover.r + 4 * hover.c}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Char:</span>
                <span className="font-mono text-green-400 text-lg">'{hoverChar}'</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Hex:</span>
                <span className="font-mono text-blue-400">0x{hoverByte.toString(16).padStart(2, '0').toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Decimal:</span>
                <span className="font-mono text-purple-400">{hoverByte}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Binary:</span>
                <span className="font-mono text-yellow-400">{hoverByte.toString(2).padStart(8, '0')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Poly:</span>
                <span className="font-mono text-cyan-400 text-xs">{byteToPoly(hoverByte)}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-800/40 border border-gray-700 rounded-xl text-xs text-gray-600 italic">
              Hover over a cell to see its Char, Hex, Binary, and Polynomial representations.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── GF(2^8) Calculator (xtime) ─── */
export function GaloisFieldCalculator() {
  const [value, setValue] = useState(0x57);
  const IRREDUCIBLE = 0x1b; // x^8 + x^4 + x^3 + x + 1

  const xtime = (v: number) => {
    const shifted = (v << 1) & 0xff;
    const highBit = v & 0x80;
    return highBit ? shifted ^ IRREDUCIBLE : shifted;
  };

  const result = xtime(value);
  const highBitSet = !!(value & 0x80);
  const shifted = (value << 1) & 0xff;

  return (
    <Card title="Galois Field GF(2⁸) — xtime Operation">
      <p className="text-xs text-gray-500 mb-3">
        In AES, multiplication by <span className="text-blue-400">x</span> (called <em>xtime</em>) is a left shift.
        If the high bit was 1, XOR with the irreducible polynomial <code className="text-yellow-400">0x1B</code>{' '}
        to keep the result within the field.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-xs text-gray-500">Input byte (hex):</label>
        <input
          value={value.toString(16).padStart(2, '0').toUpperCase()}
          onChange={e => {
            const v = parseInt(e.target.value, 16);
            if (!isNaN(v) && v >= 0 && v <= 255) setValue(v);
          }}
          className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm text-center focus:outline-none focus:border-blue-500"
          maxLength={2}
        />
        <span className="text-xs text-gray-600">({value.toString(10)})</span>
      </div>

      {/* Step-by-step */}
      <div className="space-y-3 text-sm font-mono">

        {/* Original bits */}
        <div className="flex items-center gap-3">
          <span className="text-gray-500 w-20 text-xs text-right">Input:</span>
          <div className="flex gap-px">
            {value.toString(2).padStart(8, '0').split('').map((b, i) => (
              <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-sm border text-xs ${
                i === 0 && highBitSet
                  ? 'bg-red-900/60 border-red-500 text-red-300'
                  : b === '1' ? 'bg-blue-900/40 border-blue-600 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}>
                {b}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-600">= 0x{value.toString(16).padStart(2, '0').toUpperCase()}</span>
        </div>

        {/* Shift left */}
        <div className="flex items-center gap-3">
          <span className="text-gray-500 w-20 text-xs text-right">≪ 1:</span>
          <div className="flex gap-px">
            {shifted.toString(2).padStart(8, '0').split('').map((b, i) => (
              <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-sm border text-xs ${
                b === '1' ? 'bg-green-900/40 border-green-600 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}>
                {b}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-600">= 0x{shifted.toString(16).padStart(2, '0').toUpperCase()}</span>
        </div>

        {/* Conditional XOR */}
        {highBitSet && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-yellow-500 w-20 text-xs text-right">⊕ 0x1B:</span>
              <div className="flex gap-px">
                {IRREDUCIBLE.toString(2).padStart(8, '0').split('').map((b, i) => (
                  <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-sm border text-xs ${
                    b === '1' ? 'bg-yellow-900/40 border-yellow-600 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}>
                    {b}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-600">(irreducible)</span>
            </div>
          </>
        )}

        {/* Result */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
          <span className="text-gray-300 w-20 text-xs text-right font-bold">Result:</span>
          <div className="flex gap-px">
            {result.toString(2).padStart(8, '0').split('').map((b, i) => (
              <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-sm border text-xs font-bold ${
                b === '1' ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}>
                {b}
              </span>
            ))}
          </div>
          <span className="text-xs text-cyan-400 font-bold">= 0x{result.toString(16).padStart(2, '0').toUpperCase()}</span>
        </div>
      </div>

      {/* Explanation */}
      <div className={`mt-4 p-3 rounded-xl text-xs ${
        highBitSet
          ? 'bg-red-900/20 border border-red-800 text-red-400'
          : 'bg-green-900/20 border border-green-800 text-green-400'
      }`}>
        {highBitSet
          ? <>High bit was <strong>1</strong> → shifted value overflows the field, so we XOR with 0x1B (x⁸+x⁴+x³+x+1) to reduce back into GF(2⁸).</>
          : <>High bit was <strong>0</strong> → no overflow; the left shift alone gives the correct result in GF(2⁸).</>
        }
      </div>

      {/* Polynomial view */}
      <div className="mt-3 text-xs text-gray-500">
        <span className="text-gray-400">As polynomials:</span>{' '}
        <span className="text-blue-400">({byteToPoly(value)})</span> × <span className="text-blue-400">x</span> ={' '}
        <span className="text-cyan-400">{byteToPoly(result)}</span>
      </div>
    </Card>
  );
}
