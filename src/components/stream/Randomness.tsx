import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '../Shared';

/* ─── LCG (Linear Congruential Generator) — intentionally bad ─── */
function lcg(seed: number, a = 1103515245, c = 12345, m = 2147483648) {
  return (a * seed + c) % m;
}

/* ─── TRNG vs PRNG Heatmap ─── */
export function RandomnessHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'bad' | 'csprng'>('bad');
  const [seed, setSeed] = useState(42);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 200, H = 200;
    canvas.width = W;
    canvas.height = H;
    const img = ctx.createImageData(W, H);

    if (mode === 'bad') {
      let s = seed;
      for (let i = 0; i < W * H; i++) {
        s = lcg(s);
        // Use low bits → reveals structure / stripes
        const v = (s & 0xff) > 127 ? 255 : 0;
        const idx = i * 4;
        img.data[idx] = v;
        img.data[idx + 1] = v;
        img.data[idx + 2] = v;
        img.data[idx + 3] = 255;
      }
    } else {
      const buf = new Uint8Array(W * H);
      crypto.getRandomValues(buf);
      for (let i = 0; i < W * H; i++) {
        const v = buf[i] > 127 ? 255 : 0;
        const idx = i * 4;
        img.data[idx] = v;
        img.data[idx + 1] = v;
        img.data[idx + 2] = v;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [mode, seed]);

  useEffect(() => { render(); }, [render]);

  return (
    <Card title="TRNG vs PRNG Heatmap">
      <p className="text-xs text-gray-500 mb-3">
        A 200×200 pixel grid where each pixel is black or white based on a random bit.
        Bad generators show visible patterns; CSPRNG looks like static noise.
      </p>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="space-y-3 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('bad')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${mode === 'bad' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              ⚠ Bad Randomness (LCG)
            </button>
            <button
              onClick={() => setMode('csprng')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${mode === 'csprng' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              ✓ CSPRNG
            </button>
          </div>
          <button
            onClick={() => { setSeed((s) => s + 1); render(); }}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg w-full"
          >
            🔄 Regenerate
          </button>
          {mode === 'bad' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">LCG Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-mono text-gray-300"
              />
            </div>
          )}
          <div className={`text-xs p-2 rounded-lg border ${mode === 'bad' ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-green-900/20 border-green-800 text-green-400'}`}>
            {mode === 'bad'
              ? '⚠ LCG output — notice visible stripes and patterns in low bits.'
              : '✓ crypto.getRandomValues() — indistinguishable from true noise.'}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className="border border-gray-600 rounded-lg mx-auto"
          style={{ imageRendering: 'pixelated', width: 300, height: 300 }}
        />
      </div>
    </Card>
  );
}

/* ─── Periodicity Graph ─── */
export function PeriodicityGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [genType, setGenType] = useState<'weak' | 'strong'>('weak');
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ seed: 1, count: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const WEAK_MOD = 31; // tiny period

  const tick = useCallback(() => {
    setDataPoints((prev) => {
      if (prev.length > 500) return prev; // cap
      let val: number;
      if (genType === 'weak') {
        stateRef.current.seed = (stateRef.current.seed * 7 + 3) % WEAK_MOD;
        val = stateRef.current.seed;
      } else {
        const a = new Uint8Array(1);
        crypto.getRandomValues(a);
        val = a[0];
      }
      return [...prev, val];
    });
  }, [genType]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 30);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (dataPoints.length < 2) return;

    const maxVal = genType === 'weak' ? WEAK_MOD : 256;
    ctx.strokeStyle = genType === 'weak' ? '#ef4444' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const visiblePoints = dataPoints.slice(-W);
    for (let i = 0; i < visiblePoints.length; i++) {
      const x = (i / visiblePoints.length) * W;
      const y = H - (visiblePoints[i] / maxVal) * H;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [dataPoints, genType]);

  const reset = () => {
    setDataPoints([]);
    stateRef.current = { seed: 1, count: 0 };
    setRunning(false);
  };

  return (
    <Card title="Periodicity Graph">
      <p className="text-xs text-gray-500 mb-3">
        Watch the output values over time. A weak generator repeats its cycle quickly (short period);
        a strong one creates a non-repeating, unpredictable stream.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => { reset(); setGenType('weak'); }}
          className={`px-3 py-1.5 text-xs rounded-lg ${genType === 'weak' ? 'bg-red-600' : 'bg-gray-700'}`}>
          Weak (mod {WEAK_MOD})
        </button>
        <button onClick={() => { reset(); setGenType('strong'); }}
          className={`px-3 py-1.5 text-xs rounded-lg ${genType === 'strong' ? 'bg-green-600' : 'bg-gray-700'}`}>
          Strong (CSPRNG)
        </button>
        <button onClick={() => setRunning(!running)}
          className={`px-3 py-1.5 text-xs rounded-lg ${running ? 'bg-yellow-600' : 'bg-blue-600'}`}>
          {running ? '⏸ Pause' : '▶ Run'}
        </button>
        <button onClick={reset} className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">Reset</button>
        <span className="text-xs text-gray-500 ml-auto self-center">{dataPoints.length} samples</span>
      </div>
      <canvas ref={canvasRef} width={600} height={180}
        className="w-full border border-gray-700 rounded-xl bg-crypto-bg" />
      {genType === 'weak' && dataPoints.length > WEAK_MOD && (
        <p className="text-xs text-red-400 mt-2">
          ⚠ Notice the repeating pattern — period = {WEAK_MOD - 1}. The output is completely predictable!
        </p>
      )}
    </Card>
  );
}
