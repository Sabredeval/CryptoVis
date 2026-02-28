import { useState, useEffect, useCallback } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, StepControls, BitGrid, ScrollySection } from '../components/Shared';

/* ─── XOR Visualizer ─── */
function XorVisualizer() {
  const [a, setA] = useState('10110011');
  const [b, setB] = useState('01101010');

  const xorResult = a
    .split('')
    .map((bit, i) => (parseInt(bit) ^ parseInt(b[i] || '0')).toString())
    .join('');

  return (
    <Card title="XOR Visualizer">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Binary String A</label>
          <input
            value={a}
            onChange={(e) => setA(e.target.value.replace(/[^01]/g, '').slice(0, 16))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
            maxLength={16}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Binary String B</label>
          <input
            value={b}
            onChange={(e) => setB(e.target.value.replace(/[^01]/g, '').slice(0, 16))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
            maxLength={16}
          />
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {a.split('').map((bit, i) => {
            const bBit = b[i] || '0';
            const res = (parseInt(bit) ^ parseInt(bBit)).toString();
            const highlight = bit !== bBit;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`bit-cell ${bit === '1' ? 'bit-1' : 'bit-0'}`}>{bit}</div>
                <div className="text-xs text-gray-500">⊕</div>
                <div className={`bit-cell ${bBit === '1' ? 'bit-1' : 'bit-0'}`}>{bBit}</div>
                <div className={`w-px h-3 ${highlight ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                <div className={`bit-cell ${highlight ? 'bg-yellow-900/50 border-yellow-500 text-yellow-300' : res === '1' ? 'bit-1' : 'bit-0'}`}>
                  {res}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500">Yellow highlights where bits differ (0⊕1=1)</p>
      </div>
    </Card>
  );
}

/* ─── LFSR Animation ─── */
function LfsrAnimation() {
  const { animationSpeed } = useCryptoStore();
  const [bits, setBits] = useState([1, 0, 1, 1, 0, 0, 1, 0]);
  const [taps, setTaps] = useState([0, 2, 3, 5]); // tap positions
  const [output, setOutput] = useState<number[]>([]);
  const [running, setRunning] = useState(false);

  const tick = useCallback(() => {
    setBits((prev) => {
      const fb = taps.reduce((acc, t) => acc ^ prev[t], 0);
      const newBits = [fb, ...prev.slice(0, -1)];
      setOutput((o) => [...o.slice(-31), prev[prev.length - 1]]);
      return newBits;
    });
  }, [taps]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 800 / animationSpeed);
    return () => clearInterval(id);
  }, [running, tick, animationSpeed]);

  return (
    <Card title="LFSR (Linear Feedback Shift Register)">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setRunning(!running)}
            className={`px-3 py-1.5 text-sm rounded-lg ${running ? 'bg-red-600' : 'bg-green-600'}`}
          >
            {running ? '⏸ Stop' : '▶ Run'}
          </button>
          <button onClick={tick} className="px-3 py-1.5 text-sm bg-gray-700 rounded-lg">
            Step
          </button>
          <button
            onClick={() => { setBits([1, 0, 1, 1, 0, 0, 1, 0]); setOutput([]); }}
            className="px-3 py-1.5 text-sm bg-gray-700 rounded-lg"
          >
            Reset
          </button>
        </div>

        {/* Register */}
        <div className="relative">
          <div className="text-xs text-gray-500 mb-1">Register (shift →)</div>
          <div className="flex gap-1">
            {bits.map((b, i) => (
              <div
                key={i}
                className={`bit-cell ${b ? 'bit-1' : 'bit-0'} ${
                  taps.includes(i) ? 'ring-2 ring-green-400' : ''
                }`}
              >
                {b}
                {taps.includes(i) && (
                  <div className="absolute -top-5 text-[9px] text-green-400">tap</div>
                )}
              </div>
            ))}
            <div className="flex items-center ml-2 text-xs text-gray-400">→ out</div>
          </div>
        </div>

        {/* Feedback visualization */}
        <div className="text-xs text-gray-500">
          Feedback: XOR of taps at positions [{taps.join(', ')}]
        </div>

        {/* Output stream */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Output Stream</div>
          <div className="font-mono text-sm text-green-400 bg-gray-900 rounded-lg p-2 min-h-[2rem] break-all">
            {output.join('')}
            <span className="animate-pulse">|</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── ChaCha20 State ─── */
function ChaCha20State() {
  const { chachaStep, setChachaStep, animationSpeed } = useCryptoStore();

  // 4x4 grid of 32-bit words (showing as hex)
  const initialState = [
    [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574],
    [0x03020100, 0x07060504, 0x0b0a0908, 0x0f0e0d0c],
    [0x13121110, 0x17161514, 0x1b1a1918, 0x1f1e1d1c],
    [0x00000001, 0x09000000, 0x4a000000, 0x00000000],
  ];

  const quarterRoundSets = [
    { label: 'Column 0', cells: [[0,0],[1,0],[2,0],[3,0]] },
    { label: 'Column 1', cells: [[0,1],[1,1],[2,1],[3,1]] },
    { label: 'Column 2', cells: [[0,2],[1,2],[2,2],[3,2]] },
    { label: 'Column 3', cells: [[0,3],[1,3],[2,3],[3,3]] },
    { label: 'Diagonal 0', cells: [[0,0],[1,1],[2,2],[3,3]] },
    { label: 'Diagonal 1', cells: [[0,1],[1,2],[2,3],[3,0]] },
    { label: 'Diagonal 2', cells: [[0,2],[1,3],[2,0],[3,1]] },
    { label: 'Diagonal 3', cells: [[0,3],[1,0],[2,1],[3,2]] },
  ];

  const activeSet = quarterRoundSets[chachaStep % quarterRoundSets.length];
  const activeCells = new Set(activeSet.cells.map(([r, c]) => `${r},${c}`));

  return (
    <Card title="ChaCha20 Quarter Round">
      <StepControls
        currentStep={chachaStep}
        totalSteps={quarterRoundSets.length}
        onStepChange={setChachaStep}
        labels={quarterRoundSets.map(s => s.label)}
      />
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-2">Active: {activeSet.label}</div>
        <div className="grid grid-cols-4 gap-2 max-w-md">
          {initialState.flat().map((val, idx) => {
            const r = Math.floor(idx / 4);
            const c = idx % 4;
            const isActive = activeCells.has(`${r},${c}`);
            return (
              <div
                key={idx}
                className={`px-2 py-3 text-center font-mono text-xs rounded-lg border transition-all duration-500 ${
                  isActive
                    ? 'bg-blue-900/50 border-blue-500 text-blue-300 scale-105 glow-blue'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {val.toString(16).padStart(8, '0')}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <p>Quarter round: a += b; d ^= a; d &lt;&lt;&lt;= 16;</p>
          <p>c += d; b ^= c; b &lt;&lt;&lt;= 12;</p>
          <p>a += b; d ^= a; d &lt;&lt;&lt;= 8;</p>
          <p>c += d; b ^= c; b &lt;&lt;&lt;= 7;</p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function StreamCiphers() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="🌊"
        title="Stream Ciphers & Randomness"
        description="Explore XOR operations, linear feedback shift registers, and the ChaCha20 state matrix."
      />
      <ScrollySection id="xor">
        <XorVisualizer />
      </ScrollySection>
      <ScrollySection id="lfsr">
        <LfsrAnimation />
      </ScrollySection>
      <ScrollySection id="chacha">
        <ChaCha20State />
      </ScrollySection>
    </div>
  );
}
