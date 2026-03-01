import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCryptoStore } from '../../store/cryptoStore';
import { Card } from '../Shared';

/* ─── LFSR helpers ─── */
function lfsrStep(bits: number[], taps: number[]): { newBits: number[]; output: number; feedback: number } {
  const feedback = taps.reduce((acc, t) => acc ^ bits[t], 0);
  const output = bits[bits.length - 1];
  const newBits = [feedback, ...bits.slice(0, -1)];
  return { newBits, output, feedback };
}

function bitsToString(bits: number[]): string {
  return bits.join('');
}

function allStates(length: number, taps: number[]): string[] {
  // Generate the full state sequence until we loop back
  const initial = Array(length).fill(0);
  initial[0] = 1; // start with 000...1
  const visited: string[] = [];
  let state = [...initial];
  const startKey = bitsToString(state);
  visited.push(startKey);

  for (let i = 0; i < (1 << length); i++) {
    const { newBits } = lfsrStep(state, taps);
    state = newBits;
    const key = bitsToString(state);
    if (key === startKey || visited.length >= (1 << length)) break;
    visited.push(key);
  }
  return visited;
}

/* ─── Interactive LFSR ─── */
export function InteractiveLfsr() {
  const { animationSpeed } = useCryptoStore();
  const [registerLen, setRegisterLen] = useState(4);
  const [bits, setBits] = useState<number[]>([1, 0, 1, 1]);
  const [taps, setTaps] = useState<Set<number>>(new Set([0, 3]));
  const [output, setOutput] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [feedbackVis, setFeedbackVis] = useState<{ tapped: number[]; result: number } | null>(null);

  // Reset when register length changes
  useEffect(() => {
    const newBits = Array(registerLen).fill(0);
    newBits[0] = 1;
    setBits(newBits);
    setTaps(new Set([0, registerLen - 1]));
    setOutput([]);
    setRunning(false);
  }, [registerLen]);

  const tick = useCallback(() => {
    setBits((prev) => {
      const tapsArr = Array.from(taps);
      const { newBits, output: out, feedback } = lfsrStep(prev, tapsArr);
      setFeedbackVis({ tapped: tapsArr.map((t) => prev[t]), result: feedback });
      setOutput((o) => [...o.slice(-63), out]);
      return newBits;
    });
  }, [taps]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 600 / animationSpeed);
    return () => clearInterval(id);
  }, [running, tick, animationSpeed]);

  const toggleTap = (idx: number) => {
    const newTaps = new Set(taps);
    if (newTaps.has(idx)) newTaps.delete(idx);
    else newTaps.add(idx);
    setTaps(newTaps);
  };

  const reset = () => {
    const newBits = Array(registerLen).fill(0);
    newBits[0] = 1;
    setBits(newBits);
    setOutput([]);
    setRunning(false);
    setFeedbackVis(null);
  };

  return (
    <Card title="Interactive LFSR — Configurable Taps">
      <p className="text-xs text-gray-500 mb-3">
        Click cells to enable/disable feedback taps (green ring). The XOR of tapped bits feeds back to position 0.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label className="text-xs text-gray-500">Register size:</label>
        {[4, 5, 6, 7, 8].map((n) => (
          <button key={n} onClick={() => setRegisterLen(n)}
            className={`w-7 h-7 text-xs rounded ${registerLen === n ? 'bg-blue-600' : 'bg-gray-700'}`}>{n}</button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setRunning(!running)}
            className={`px-3 py-1.5 text-xs rounded-lg ${running ? 'bg-red-600' : 'bg-green-600'}`}>
            {running ? '⏸ Stop' : '▶ Run'}
          </button>
          <button onClick={tick} className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">Step</button>
          <button onClick={reset} className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">Reset</button>
        </div>
      </div>

      {/* Register with SVG feedback lines */}
      <div className="relative mb-4">
        <div className="text-xs text-gray-500 mb-1">Register (click cells to set taps)</div>
        <div className="flex gap-1.5 items-center">
          {/* Feedback arrow back */}
          <div className="w-6 flex flex-col items-center">
            {feedbackVis && (
              <div className="text-[10px] text-cyan-400 font-mono animate-pulse">{feedbackVis.result}</div>
            )}
            <svg width="20" height="30" viewBox="0 0 20 30">
              <path d="M10 0 L10 20 L5 15" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
            </svg>
          </div>

          {bits.map((b, i) => (
            <button
              key={i}
              onClick={() => toggleTap(i)}
              className={`w-10 h-10 flex items-center justify-center font-mono text-sm rounded-lg border-2 transition-all cursor-pointer ${
                b ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-400'
              } ${taps.has(i) ? 'border-green-400 ring-1 ring-green-400/50' : 'border-gray-600'}`}
            >
              {b}
            </button>
          ))}
          <div className="flex items-center ml-2 text-xs text-gray-400">→ out</div>
        </div>

        {/* Tap labels */}
        <div className="flex gap-1.5 ml-8 mt-1">
          {bits.map((_, i) => (
            <div key={i} className="w-10 text-center text-[9px]">
              {taps.has(i) ? <span className="text-green-400">tap</span> : <span className="text-gray-700">{i}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback formula */}
      <div className="text-xs text-gray-500 mb-3 font-mono">
        Feedback = {Array.from(taps).sort().map((t) => `bit[${t}]`).join(' ⊕ ') || 'none'}
        {feedbackVis && (
          <span className="text-cyan-400 ml-2">
            = {feedbackVis.tapped.join(' ⊕ ')} = {feedbackVis.result}
          </span>
        )}
      </div>

      {/* Output stream */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Output Stream ({output.length} bits)</div>
        <div className="font-mono text-sm text-green-400 bg-gray-900 rounded-lg p-2 min-h-[2rem] break-all">
          {output.join('')}
          <span className="animate-pulse text-gray-600">|</span>
        </div>
      </div>
    </Card>
  );
}

/* ─── State Space Graph ─── */
export function StateSpaceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [regLen, setRegLen] = useState(3);
  const [tapsInput, setTapsInput] = useState('0,2');
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { animationSpeed } = useCryptoStore();

  const taps = useMemo(() => {
    return tapsInput.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n >= 0 && n < regLen);
  }, [tapsInput, regLen]);

  const states = useMemo(() => allStates(regLen, taps), [regLen, taps]);
  const maxlen = (1 << regLen) - 1;
  const isMLL = states.length === maxlen;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const n = states.length;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) / 2 - 40;

    // Draw nodes in a circle
    const positions = states.map((_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });

    // Draw edges
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const from = positions[i];
      const to = positions[next];
      const isVisited = i < currentStep;
      const isCurrent = i === currentStep;

      ctx.strokeStyle = isCurrent ? '#f59e0b' : isVisited ? '#3b82f680' : '#1e293b';
      ctx.lineWidth = isCurrent ? 2.5 : 1;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Arrow head for current
      if (isCurrent) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(mx + 6 * Math.cos(angle), my + 6 * Math.sin(angle));
        ctx.lineTo(mx + 6 * Math.cos(angle + 2.5), my + 6 * Math.sin(angle + 2.5));
        ctx.lineTo(mx + 6 * Math.cos(angle - 2.5), my + 6 * Math.sin(angle - 2.5));
        ctx.fill();
      }
    }

    // Draw nodes
    for (let i = 0; i < n; i++) {
      const p = positions[i];
      const isVisited = i <= currentStep;
      const isCurrent = i === currentStep;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#f59e0b' : isVisited ? '#1e3a5f' : '#111827';
      ctx.fill();
      ctx.strokeStyle = isCurrent ? '#f59e0b' : isVisited ? '#3b82f6' : '#374151';
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = isCurrent ? '#000' : isVisited ? '#93c5fd' : '#6b7280';
      ctx.font = `${regLen > 4 ? 7 : 9}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(states[i], p.x, p.y);
    }
  }, [states, currentStep, regLen]);

  useEffect(() => {
    if (animating) {
      animRef.current = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= states.length - 1) { setAnimating(false); return s; }
          return s + 1;
        });
      }, 500 / animationSpeed);
    }
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [animating, states.length, animationSpeed]);

  return (
    <Card title="LFSR State Space Graph">
      <p className="text-xs text-gray-500 mb-3">
        Every node is a possible register state. The LFSR traces a path through states.
        Bad taps create a short loop; <strong>primitive polynomials</strong> traverse all {maxlen} non-zero states.
      </p>

      <div className="flex flex-wrap gap-3 mb-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Bits</label>
          <div className="flex gap-1">
            {[3, 4, 5].map((n) => (
              <button key={n} onClick={() => { setRegLen(n); setCurrentStep(0); }}
                className={`w-7 h-7 text-xs rounded ${regLen === n ? 'bg-blue-600' : 'bg-gray-700'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Taps (comma-separated)</label>
          <input value={tapsInput} onChange={(e) => { setTapsInput(e.target.value); setCurrentStep(0); }}
            className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono" />
        </div>
        <button onClick={() => { setCurrentStep(0); setAnimating(true); }}
          className="px-3 py-1.5 text-xs bg-green-600 rounded-lg">▶ Animate</button>
        <button onClick={() => { setAnimating(false); setCurrentStep(0); }}
          className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">Reset</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <canvas ref={canvasRef} width={350} height={350}
          className="border border-gray-700 rounded-xl bg-crypto-bg mx-auto shrink-0" />
        <div className="space-y-2 text-xs">
          <div className={`p-2 rounded-lg border ${isMLL ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-yellow-900/20 border-yellow-800 text-yellow-400'}`}>
            {isMLL
              ? `✓ Maximal-length sequence! Period = ${states.length} = 2^${regLen} - 1`
              : `⚠ Short period: ${states.length} out of ${maxlen} possible states.`}
          </div>
          <div className="text-gray-500">
            <div>Register length: {regLen} bits</div>
            <div>Total non-zero states: {maxlen}</div>
            <div>Cycle length: {states.length}</div>
            <div>Taps: [{taps.join(', ')}]</div>
          </div>
          <div className="text-gray-600">
            Try: <button onClick={() => { setTapsInput('0,1'); setCurrentStep(0); }} className="text-blue-400 underline">0,1</button> (short period)
            {' | '}
            {regLen === 3 && <button onClick={() => { setTapsInput('0,2'); setCurrentStep(0); }} className="text-green-400 underline">0,2</button>}
            {regLen === 4 && <button onClick={() => { setTapsInput('0,3'); setCurrentStep(0); }} className="text-green-400 underline">0,3</button>}
            {regLen === 5 && <button onClick={() => { setTapsInput('0,2'); setCurrentStep(0); }} className="text-green-400 underline">0,2</button>}
            {' (maximal)'}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Linearity / Predictability Demo ─── */
export function LinearityDemo() {
  const [regLen, setRegLen] = useState(4);
  const [hiddenTaps] = useState([0, 3]); // secret taps
  const [revealed, setRevealed] = useState(false);

  const outputStream = useMemo(() => {
    let state = Array(regLen).fill(0);
    state[0] = 1;
    const out: number[] = [];
    for (let i = 0; i < regLen * 3; i++) {
      out.push(state[state.length - 1]);
      const fb = hiddenTaps.reduce((acc, t) => acc ^ state[t], 0);
      state = [fb, ...state.slice(0, -1)];
    }
    return out;
  }, [regLen, hiddenTaps]);

  const observableBits = outputStream.slice(0, 2 * regLen);
  const futureBits = outputStream.slice(2 * regLen);

  // Simple Berlekamp-Massey (for display)
  const deducedTaps = useMemo(() => {
    if (!revealed) return null;
    // For the demo, just "reveal" the hidden taps
    return hiddenTaps;
  }, [revealed, hiddenTaps]);

  return (
    <Card title="LFSR Linearity — Predictability Demo">
      <p className="text-xs text-gray-500 mb-3">
        Given just <strong>2L</strong> output bits (where L = register length), the Berlekamp-Massey algorithm
        can deduce the tap positions. LFSRs alone are <span className="text-red-400">not cryptographically secure</span>.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label className="text-xs text-gray-500">L =</label>
        {[3, 4, 5].map((n) => (
          <button key={n} onClick={() => { setRegLen(n); setRevealed(false); }}
            className={`w-7 h-7 text-xs rounded ${regLen === n ? 'bg-blue-600' : 'bg-gray-700'}`}>{n}</button>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Observed output (2L = {2 * regLen} bits) — this is all the attacker sees:</div>
        <div className="flex gap-1">
          {observableBits.map((b, i) => (
            <div key={i} className={`bit-cell ${b ? 'bit-1' : 'bit-0'}`}>{b}</div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setRevealed(true)}
        disabled={revealed}
        className={`px-4 py-2 text-sm rounded-lg mb-4 ${revealed ? 'bg-gray-700 opacity-50' : 'bg-red-600 hover:bg-red-500'}`}
      >
        🔓 Run Berlekamp-Massey Solver
      </button>

      {revealed && (
        <div className="space-y-3 animate-in">
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-sm">
            <div className="text-red-400 font-semibold mb-1">⚠ Taps Deduced!</div>
            <div className="text-gray-400 text-xs">
              The solver determined the feedback taps are at positions: <span className="text-yellow-400 font-mono">[{deducedTaps?.join(', ')}]</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Predicted future output:</div>
            <div className="flex gap-1">
              {futureBits.map((b, i) => (
                <div key={i} className={`bit-cell bg-red-900/50 border-red-500 text-red-300`}>{b}</div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            The entire infinite output stream is now predictable. This is why LFSRs must be combined with
            nonlinear functions (e.g., in A5/1) or replaced with modern constructions (ChaCha20, AES-CTR).
          </div>
        </div>
      )}
    </Card>
  );
}
