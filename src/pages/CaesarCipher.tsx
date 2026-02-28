import { useState, useMemo } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, ScrollySection } from '../components/Shared';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ─── helpers ─── */
function caesarEncrypt(text: string, shift: number): string {
  return text
    .split('')
    .map((ch) => {
      if (ch >= 'A' && ch <= 'Z') return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
      if (ch >= 'a' && ch <= 'z') return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97);
      return ch;
    })
    .join('');
}

function affineEncrypt(text: string, a: number, b: number): string {
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      if (ch >= 'A' && ch <= 'Z') return String.fromCharCode(((a * (ch.charCodeAt(0) - 65) + b) % 26) + 65);
      return ch;
    })
    .join('');
}

function letterFreq(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (let i = 0; i < 26; i++) freq[String.fromCharCode(65 + i)] = 0;
  const upper = text.toUpperCase();
  let total = 0;
  for (const ch of upper) {
    if (ch >= 'A' && ch <= 'Z') { freq[ch]++; total++; }
  }
  if (total > 0) for (const k of Object.keys(freq)) freq[k] = parseFloat(((freq[k] / total) * 100).toFixed(1));
  return freq;
}

const ENGLISH_FREQ: Record<string, number> = {
  A: 8.2, B: 1.5, C: 2.8, D: 4.3, E: 13.0, F: 2.2, G: 2.0, H: 6.1,
  I: 7.0, J: 0.15, K: 0.77, L: 4.0, M: 2.4, N: 6.7, O: 7.5, P: 1.9,
  Q: 0.095, R: 6.0, S: 6.3, T: 9.1, U: 2.8, V: 0.98, W: 2.4, X: 0.15,
  Y: 2.0, Z: 0.074,
};

/* ─── Modular Clock ─── */
function ModularClock() {
  const [modN, setModN] = useState(12);
  const [a, setA] = useState(3);
  const [b, setB] = useState(7);
  const [op, setOp] = useState<'add' | 'mul'>('add');
  const result = op === 'add' ? (a + b) % modN : (a * b) % modN;
  const r = 110;
  const cx = 150, cy = 150;

  const points = Array.from({ length: modN }, (_, i) => {
    const angle = (i / modN) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const getPos = (v: number) => points[v % modN];

  return (
    <Card title="Modular Clock">
      <div className="flex flex-col lg:flex-row gap-4">
        <svg viewBox="0 0 300 300" className="w-64 h-64 mx-auto shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth="2" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={12} fill={i === result ? '#3b82f6' : i === a ? '#10b981' : i === b ? '#f59e0b' : '#1e293b'} stroke="#475569" strokeWidth="1" />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="text-xs fill-white font-mono">{i}</text>
            </g>
          ))}
          {/* lines */}
          <line x1={getPos(a).x} y1={getPos(a).y} x2={getPos(b).x} y2={getPos(b).y} stroke="#10b981" strokeWidth="2" strokeDasharray="4" opacity={0.5} />
          <line x1={getPos(b).x} y1={getPos(b).y} x2={getPos(result).x} y2={getPos(result).y} stroke="#3b82f6" strokeWidth="2" />
        </svg>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-gray-500">Modulus n</label>
            <input type="range" min={2} max={26} value={modN} onChange={e => setModN(+e.target.value)} className="w-full accent-blue-500" />
            <span className="text-gray-300">{modN}</span>
          </div>
          <div>
            <label className="text-xs text-gray-500">a (green)</label>
            <input type="range" min={0} max={modN - 1} value={a} onChange={e => setA(+e.target.value)} className="w-full accent-green-500" />
            <span className="text-green-400">{a}</span>
          </div>
          <div>
            <label className="text-xs text-gray-500">b (yellow)</label>
            <input type="range" min={0} max={modN - 1} value={b} onChange={e => setB(+e.target.value)} className="w-full accent-yellow-500" />
            <span className="text-yellow-400">{b}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOp('add')} className={`px-3 py-1 rounded ${op === 'add' ? 'bg-blue-600' : 'bg-gray-700'}`}>Add</button>
            <button onClick={() => setOp('mul')} className={`px-3 py-1 rounded ${op === 'mul' ? 'bg-blue-600' : 'bg-gray-700'}`}>Multiply</button>
          </div>
          <p className="font-mono text-blue-400">
            {a} {op === 'add' ? '+' : '×'} {b} ≡ <span className="text-white font-bold">{result}</span> (mod {modN})
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function CaesarCipher() {
  const { caesarInput, setCaesarInput, caesarShift, setCaesarShift } = useCryptoStore();
  const [affineA, setAffineA] = useState(5);
  const [affineB, setAffineB] = useState(8);

  const ciphertext = caesarEncrypt(caesarInput, caesarShift);
  const affineCipher = affineEncrypt(caesarInput, affineA, affineB);

  const inputFreq = letterFreq(caesarInput);
  const cipherFreq = letterFreq(ciphertext);
  const freqData = Object.keys(inputFreq).map((letter) => ({
    letter,
    input: inputFreq[letter],
    cipher: cipherFreq[letter],
    english: ENGLISH_FREQ[letter],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        icon="🔤"
        title="Historic Ciphers & Modular Arithmetic"
        description="Explore classical substitution ciphers, visualize letter frequency distributions, and understand modular arithmetic on a clock."
      />

      {/* Caesar / Affine */}
      <ScrollySection id="caesar-tool">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="Caesar Cipher">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Plaintext</label>
                <input
                  value={caesarInput}
                  onChange={(e) => setCaesarInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Shift (k = {caesarShift})</label>
                <input
                  type="range" min={0} max={25} value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ciphertext</label>
                <div className="px-3 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg font-mono text-sm text-blue-300 tracking-wider">
                  {ciphertext}
                </div>
              </div>
              {/* Visual alphabet mapping */}
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Alphabet Mapping</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 26 }, (_, i) => {
                    const plain = String.fromCharCode(65 + i);
                    const cipher = String.fromCharCode(((i + caesarShift) % 26) + 65);
                    return (
                      <div key={i} className="flex flex-col items-center w-7">
                        <span className="text-xs text-gray-400">{plain}</span>
                        <span className="text-[10px] text-gray-600">↓</span>
                        <span className="text-xs text-blue-400 font-bold">{cipher}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Affine Cipher">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Plaintext (same input)</label>
                <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm text-gray-300">
                  {caesarInput.toUpperCase()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">a = {affineA}</label>
                  <input type="range" min={1} max={25} value={affineA}
                    onChange={(e) => setAffineA(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">b = {affineB}</label>
                  <input type="range" min={0} max={25} value={affineB}
                    onChange={(e) => setAffineB(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">E(x) = ({affineA}·x + {affineB}) mod 26</p>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ciphertext</label>
                <div className="px-3 py-2 bg-purple-900/30 border border-purple-700/50 rounded-lg font-mono text-sm text-purple-300 tracking-wider">
                  {affineCipher}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </ScrollySection>

      {/* Frequency Histogram */}
      <ScrollySection id="frequency">
        <Card title="Letter Frequency Analysis">
          <p className="text-xs text-gray-500 mb-3">Comparing your input frequency (blue) vs. ciphertext frequency (purple) vs. standard English (dashed).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqData} barCategoryGap="15%">
                <XAxis dataKey="letter" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="input" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Input" />
                <Bar dataKey="cipher" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Cipher" />
                <Bar dataKey="english" fill="#374151" radius={[2, 2, 0, 0]} name="English" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </ScrollySection>

      {/* Modular Clock */}
      <ScrollySection id="mod-clock">
        <ModularClock />
      </ScrollySection>
    </div>
  );
}
