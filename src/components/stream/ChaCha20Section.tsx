import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useCryptoStore } from '../../store/cryptoStore';
import { Card, StepControls } from '../Shared';

/* ─── ChaCha20 helpers ─── */
function rotl32(v: number, n: number): number {
  return ((v << n) | (v >>> (32 - n))) >>> 0;
}

function add32(a: number, b: number): number {
  return (a + b) >>> 0;
}

interface QrStep {
  label: string;
  desc: string;
  op: 'add' | 'xor' | 'rotate';
  target: string;   // which of a,b,c,d changes
  operands: string[];
  rotAmount?: number;
}

const QR_STEPS: QrStep[] = [
  { label: 'a += b',     desc: 'Add b into a (mod 2³²)',         op: 'add',    target: 'a', operands: ['a', 'b'] },
  { label: 'd ^= a',     desc: 'XOR a into d',                   op: 'xor',    target: 'd', operands: ['d', 'a'] },
  { label: 'd <<<= 16',  desc: 'Rotate d left by 16 bits',       op: 'rotate', target: 'd', operands: ['d'], rotAmount: 16 },
  { label: 'c += d',     desc: 'Add d into c (mod 2³²)',         op: 'add',    target: 'c', operands: ['c', 'd'] },
  { label: 'b ^= c',     desc: 'XOR c into b',                   op: 'xor',    target: 'b', operands: ['b', 'c'] },
  { label: 'b <<<= 12',  desc: 'Rotate b left by 12 bits',       op: 'rotate', target: 'b', operands: ['b'], rotAmount: 12 },
  { label: 'a += b',     desc: 'Add b into a again (mod 2³²)',   op: 'add',    target: 'a', operands: ['a', 'b'] },
  { label: 'd ^= a',     desc: 'XOR a into d again',             op: 'xor',    target: 'd', operands: ['d', 'a'] },
  { label: 'd <<<= 8',   desc: 'Rotate d left by 8 bits',        op: 'rotate', target: 'd', operands: ['d'], rotAmount: 8 },
  { label: 'c += d',     desc: 'Add d into c again (mod 2³²)',   op: 'add',    target: 'c', operands: ['c', 'd'] },
  { label: 'b ^= c',     desc: 'XOR c into b again',             op: 'xor',    target: 'b', operands: ['b', 'c'] },
  { label: 'b <<<= 7',   desc: 'Rotate b left by 7 bits',        op: 'rotate', target: 'b', operands: ['b'], rotAmount: 7 },
];

function computeQrStates(a0: number, b0: number, c0: number, d0: number): Array<{ a: number; b: number; c: number; d: number }> {
  const snapshots: Array<{ a: number; b: number; c: number; d: number }> = [];
  let a = a0, b = b0, c = c0, d = d0;
  snapshots.push({ a, b, c, d });

  // step 0: a += b
  a = add32(a, b); snapshots.push({ a, b, c, d });
  // step 1: d ^= a
  d = (d ^ a) >>> 0; snapshots.push({ a, b, c, d });
  // step 2: d <<<= 16
  d = rotl32(d, 16); snapshots.push({ a, b, c, d });
  // step 3: c += d
  c = add32(c, d); snapshots.push({ a, b, c, d });
  // step 4: b ^= c
  b = (b ^ c) >>> 0; snapshots.push({ a, b, c, d });
  // step 5: b <<<= 12
  b = rotl32(b, 12); snapshots.push({ a, b, c, d });
  // step 6: a += b
  a = add32(a, b); snapshots.push({ a, b, c, d });
  // step 7: d ^= a
  d = (d ^ a) >>> 0; snapshots.push({ a, b, c, d });
  // step 8: d <<<= 8
  d = rotl32(d, 8); snapshots.push({ a, b, c, d });
  // step 9: c += d
  c = add32(c, d); snapshots.push({ a, b, c, d });
  // step 10: b ^= c
  b = (b ^ c) >>> 0; snapshots.push({ a, b, c, d });
  // step 11: b <<<= 7
  b = rotl32(b, 7); snapshots.push({ a, b, c, d });

  return snapshots;
}

/* ─── Quarter Round Animator ─── */
export function QuarterRoundAnimator() {
  const [step, setStep] = useState(0);
  const init = { a: 0x11111111, b: 0x01020304, c: 0x9b8d6f43, d: 0x01234567 };
  const snapshots = useMemo(() => computeQrStates(init.a, init.b, init.c, init.d), []);

  const current = snapshots[step + 1] || snapshots[snapshots.length - 1];
  const prev = snapshots[step] || snapshots[0];
  const activeStep = step < QR_STEPS.length ? QR_STEPS[step] : null;

  const wordColor = (name: string) => {
    if (!activeStep) return '';
    if (activeStep.target === name) return 'bg-yellow-900/50 border-yellow-500 text-yellow-300 glow-blue scale-105';
    if (activeStep.operands.includes(name)) return 'bg-blue-900/50 border-blue-500 text-blue-300';
    return '';
  };

  const toBin = (n: number) => n.toString(2).padStart(32, '0');

  return (
    <Card title="ChaCha20 Quarter Round — Step by Step">
      <StepControls
        currentStep={step}
        totalSteps={QR_STEPS.length}
        onStepChange={setStep}
        labels={QR_STEPS.map((s) => s.label)}
      />
      <div className="mt-4 flex flex-col lg:flex-row gap-6">
        {/* 4 words */}
        <div className="space-y-2 shrink-0">
          {(['a', 'b', 'c', 'd'] as const).map((name) => {
            const val = current[name];
            const prevVal = prev[name];
            const changed = val !== prevVal;
            return (
              <div key={name} className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-500 ${wordColor(name) || 'bg-gray-800 border-gray-700'}`}>
                <span className="text-sm font-bold w-4">{name}</span>
                <span className="font-mono text-sm">{val.toString(16).padStart(8, '0')}</span>
                {changed && <span className="text-[10px] text-yellow-400">← updated</span>}
              </div>
            );
          })}
        </div>

        {/* Operation detail */}
        <div className="flex-1 space-y-3">
          {activeStep && (
            <>
              <div className="p-3 bg-gray-900 rounded-xl">
                <div className="text-sm font-semibold text-yellow-400 mb-1">{activeStep.label}</div>
                <div className="text-xs text-gray-400">{activeStep.desc}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    activeStep.op === 'add' ? 'bg-green-900/50 text-green-300' :
                    activeStep.op === 'xor' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-purple-900/50 text-purple-300'
                  }`}>
                    {activeStep.op === 'add' ? 'ADD' : activeStep.op === 'xor' ? 'XOR' : `ROT${activeStep.rotAmount}`}
                  </span>
                </div>
              </div>

              {/* Bit-level detail for rotate steps */}
              {activeStep.op === 'rotate' && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Before rotation:</div>
                  <div className="font-mono text-[10px] text-gray-500 break-all bg-gray-900 rounded p-1">
                    {toBin(prev[activeStep.target as keyof typeof prev])}
                  </div>
                  <div className="text-xs text-gray-500">After rotating left by {activeStep.rotAmount}:</div>
                  <div className="font-mono text-[10px] text-purple-400 break-all bg-gray-900 rounded p-1">
                    {toBin(current[activeStep.target as keyof typeof current])}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── Full Matrix with Column vs Diagonal highlighting ─── */
export function MatrixStateFlow() {
  const [phase, setPhase] = useState(0);

  const INITIAL_STATE = [
    [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574],
    [0x03020100, 0x07060504, 0x0b0a0908, 0x0f0e0d0c],
    [0x13121110, 0x17161514, 0x1b1a1918, 0x1f1e1d1c],
    [0x00000001, 0x09000000, 0x4a000000, 0x00000000],
  ];

  const ROW_LABELS = ['constants', 'key', 'key', 'counter/nonce'];

  const phases = [
    { label: 'Initial State', cells: [] as number[][], color: '' },
    { label: 'Column Round — Col 0', cells: [[0,0],[1,0],[2,0],[3,0]], color: 'blue' },
    { label: 'Column Round — Col 1', cells: [[0,1],[1,1],[2,1],[3,1]], color: 'blue' },
    { label: 'Column Round — Col 2', cells: [[0,2],[1,2],[2,2],[3,2]], color: 'blue' },
    { label: 'Column Round — Col 3', cells: [[0,3],[1,3],[2,3],[3,3]], color: 'blue' },
    { label: 'Diagonal Round — Diag 0', cells: [[0,0],[1,1],[2,2],[3,3]], color: 'purple' },
    { label: 'Diagonal Round — Diag 1', cells: [[0,1],[1,2],[2,3],[3,0]], color: 'purple' },
    { label: 'Diagonal Round — Diag 2', cells: [[0,2],[1,3],[2,0],[3,1]], color: 'purple' },
    { label: 'Diagonal Round — Diag 3', cells: [[0,3],[1,0],[2,1],[3,2]], color: 'purple' },
  ];

  const activePhase = phases[phase];
  const activeCells = new Set(activePhase.cells.map(([r, c]) => `${r},${c}`));

  return (
    <Card title="ChaCha20 Matrix — Column vs Diagonal Rounds">
      <StepControls
        currentStep={phase}
        totalSteps={phases.length}
        onStepChange={setPhase}
        labels={phases.map((p) => p.label)}
      />
      <div className="mt-4 flex flex-col lg:flex-row gap-6">
        <div>
          <div className="text-xs text-gray-500 mb-2">{activePhase.label}</div>
          <div className="grid grid-cols-4 gap-2">
            {INITIAL_STATE.flat().map((val, idx) => {
              const r = Math.floor(idx / 4), c = idx % 4;
              const isActive = activeCells.has(`${r},${c}`);
              const colorClass = isActive
                ? activePhase.color === 'blue'
                  ? 'bg-blue-900/50 border-blue-500 text-blue-300 scale-105 glow-blue'
                  : 'bg-purple-900/50 border-purple-500 text-purple-300 scale-105 glow-purple'
                : 'bg-gray-800 border-gray-700 text-gray-400';
              return (
                <div key={idx} className={`px-2 py-3 text-center font-mono text-[11px] rounded-lg border-2 transition-all duration-500 ${colorClass}`}>
                  {val.toString(16).padStart(8, '0')}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {ROW_LABELS.map((l, i) => (
              <div key={i} className="text-[9px] text-gray-600 text-center col-span-4 first:col-span-4">
                {i === 0 && 'Row 0: constants | Row 1-2: key | Row 3: counter + nonce'}
              </div>
            )).slice(0, 1)}
          </div>
        </div>

        <div className="flex-1 space-y-2 text-xs text-gray-400">
          <div className="p-3 bg-gray-900 rounded-xl">
            <p className="mb-2">Each <strong>double round</strong> consists of:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li className="text-blue-400">4 column quarter-rounds (process each column)</li>
              <li className="text-purple-400">4 diagonal quarter-rounds (process each diagonal)</li>
            </ol>
            <p className="mt-2 text-gray-500">This alternation ensures every word influences every other word after a full double round.</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Column</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Diagonal</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Counter/Nonce Visualization ─── */
export function CounterNonceViz() {
  const [counter, setCounter] = useState(0);

  // Simulate a very simplified "keystream" that changes with counter
  const keystream = useMemo(() => {
    // Simple hash-like mixing to show avalanche
    let h = 0x6a09e667 ^ (counter * 0x9e3779b9);
    for (let i = 0; i < 8; i++) {
      h = ((h << 5) | (h >>> 27)) ^ (h * 0x85ebca6b);
      h = (h + 0x2654435769) >>> 0;
    }
    return Array.from({ length: 16 }, (_, i) => {
      let v = h ^ (i * 0xc2b2ae35);
      v = ((v >>> 16) ^ v) * 0x45d9f3b;
      v = ((v >>> 16) ^ v) >>> 0;
      return v;
    });
  }, [counter]);

  const prevKeystream = useMemo(() => {
    if (counter === 0) return null;
    let h = 0x6a09e667 ^ ((counter - 1) * 0x9e3779b9);
    for (let i = 0; i < 8; i++) {
      h = ((h << 5) | (h >>> 27)) ^ (h * 0x85ebca6b);
      h = (h + 0x2654435769) >>> 0;
    }
    return Array.from({ length: 16 }, (_, i) => {
      let v = h ^ (i * 0xc2b2ae35);
      v = ((v >>> 16) ^ v) * 0x45d9f3b;
      v = ((v >>> 16) ^ v) >>> 0;
      return v;
    });
  }, [counter]);

  return (
    <Card title="Counter / Nonce — Avalanche Effect">
      <p className="text-xs text-gray-500 mb-3">
        Incrementing the counter by 1 completely changes the keystream block. This is the avalanche effect at work.
      </p>

      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setCounter(Math.max(0, counter - 1))}
          className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg" disabled={counter === 0}>−</button>
        <div className="text-center">
          <div className="text-xs text-gray-500">Counter</div>
          <div className="text-2xl font-mono text-yellow-400 font-bold">{counter}</div>
        </div>
        <button onClick={() => setCounter(counter + 1)}
          className="px-3 py-1.5 text-xs bg-blue-600 rounded-lg">+</button>
      </div>

      {/* Show the matrix with counter highlighted */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Matrix Row 3 (counter + nonce):</div>
        <div className="flex gap-2">
          <div className="px-3 py-2 bg-yellow-900/50 border-2 border-yellow-500 rounded-lg font-mono text-xs text-yellow-300 transition-all">
            {counter.toString(16).padStart(8, '0')}
            <div className="text-[9px] text-yellow-500 mt-0.5">counter ↑</div>
          </div>
          <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-xs text-gray-400">
            09000000
            <div className="text-[9px] text-gray-600 mt-0.5">nonce</div>
          </div>
          <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-xs text-gray-400">
            4a000000
            <div className="text-[9px] text-gray-600 mt-0.5">nonce</div>
          </div>
          <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg font-mono text-xs text-gray-400">
            00000000
            <div className="text-[9px] text-gray-600 mt-0.5">nonce</div>
          </div>
        </div>
      </div>

      {/* Resulting keystream */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Resulting Keystream Block:</div>
        <div className="grid grid-cols-4 gap-1.5">
          {keystream.map((v, i) => {
            const changed = prevKeystream ? v !== prevKeystream[i] : false;
            return (
              <div key={i} className={`px-2 py-1.5 text-center font-mono text-[10px] rounded border transition-all duration-500 ${
                changed ? 'bg-red-900/40 border-red-500 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}>
                {v.toString(16).padStart(8, '0')}
              </div>
            );
          })}
        </div>
        {prevKeystream && (
          <p className="text-xs text-red-400 mt-2">
            {keystream.filter((v, i) => v !== prevKeystream![i]).length} of 16 words changed from counter {counter - 1} → {counter}
          </p>
        )}
      </div>
    </Card>
  );
}
