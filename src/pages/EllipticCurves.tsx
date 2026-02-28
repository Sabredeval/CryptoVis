import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, ScrollySection } from '../components/Shared';

/* ─── Curve math (real numbers) ─── */
function evalCurve(x: number, a: number, b: number): number {
  return x * x * x + a * x + b;
}

/* ─── Curve Plotter ─── */
function CurvePlotter() {
  const { eccA, eccB, setEccA, setEccB } = useCryptoStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const scale = 30;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = -10; x <= 10; x++) {
      ctx.beginPath();
      ctx.moveTo(cx + x * scale, 0);
      ctx.lineTo(cx + x * scale, H);
      ctx.stroke();
    }
    for (let y = -10; y <= 10; y++) {
      ctx.beginPath();
      ctx.moveTo(0, cy + y * scale);
      ctx.lineTo(W, cy + y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();

    // Curve y² = x³ + ax + b
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    const step = 0.05;
    for (let x = -10; x <= 10; x += step) {
      const rhs = evalCurve(x, eccA, eccB);
      if (rhs >= 0) {
        const y1 = Math.sqrt(rhs);
        const y2 = -y1;

        const sx = cx + x * scale;
        const sy1 = cy - y1 * scale;
        const sy2 = cy - y2 * scale;

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(sx, sy1, 1.5, 1.5);
        ctx.fillRect(sx, sy2, 1.5, 1.5);
      }
    }

    // Label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText(`y² = x³ + ${eccA}x + ${eccB}`, 10, 20);
  }, [eccA, eccB]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <Card title="Elliptic Curve Plotter">
      <div className="flex flex-col lg:flex-row gap-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-gray-700 rounded-xl bg-crypto-bg mx-auto"
        />
        <div className="space-y-4 min-w-[200px]">
          <div>
            <label className="text-xs text-gray-500 block mb-1">a = {eccA}</label>
            <input type="range" min={-5} max={5} step={0.5} value={eccA}
              onChange={e => setEccA(parseFloat(e.target.value))} className="w-full accent-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">b = {eccB}</label>
            <input type="range" min={-5} max={5} step={0.5} value={eccB}
              onChange={e => setEccB(parseFloat(e.target.value))} className="w-full accent-blue-500" />
          </div>
          <div className="text-sm text-gray-400 font-mono">
            y² = x³ {eccA >= 0 ? '+' : ''} {eccA}x {eccB >= 0 ? '+' : ''} {eccB}
          </div>
          <div className="text-xs text-gray-500">
            The discriminant Δ = -16(4a³ + 27b²) must be non-zero for a valid curve.
          </div>
          <div className="text-xs">
            <span className={4 * eccA ** 3 + 27 * eccB ** 2 !== 0 ? 'text-green-400' : 'text-red-400'}>
              Δ = {(-16 * (4 * eccA ** 3 + 27 * eccB ** 2)).toFixed(1)}
              {4 * eccA ** 3 + 27 * eccB ** 2 !== 0 ? ' ✓ Valid' : ' ✗ Singular!'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Point Addition ─── */
function PointAddition() {
  const { eccA, eccB } = useCryptoStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [px, setPx] = useState(-1.5);
  const [py, setPy] = useState(0);
  const [qx, setQx] = useState(1);
  const [qy, setQy] = useState(0);

  // Snap to curve
  useEffect(() => {
    const rhs = evalCurve(px, eccA, eccB);
    if (rhs >= 0) setPy(Math.sqrt(rhs));
  }, [px, eccA, eccB]);

  useEffect(() => {
    const rhs = evalCurve(qx, eccA, eccB);
    if (rhs >= 0) setQy(Math.sqrt(rhs));
  }, [qx, eccA, eccB]);

  // Point addition
  const result = useMemo(() => {
    if (px === qx && py === qy) {
      // Point doubling
      if (py === 0) return null;
      const m = (3 * px * px + eccA) / (2 * py);
      const rx = m * m - 2 * px;
      const ry = -(py + m * (rx - px));
      return { x: rx, y: ry, m };
    } else {
      if (px === qx) return null; // vertical line
      const m = (qy - py) / (qx - px);
      const rx = m * m - px - qx;
      const ry = -(py + m * (rx - px));
      return { x: rx, y: ry, m };
    }
  }, [px, py, qx, qy, eccA, eccB]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const scale = 40;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Grid + axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = -10; x <= 10; x++) {
      ctx.beginPath(); ctx.moveTo(cx + x * scale, 0); ctx.lineTo(cx + x * scale, H); ctx.stroke();
    }
    for (let y = -10; y <= 10; y++) {
      ctx.beginPath(); ctx.moveTo(0, cy + y * scale); ctx.lineTo(W, cy + y * scale); ctx.stroke();
    }
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

    // Curve
    ctx.fillStyle = '#3b82f680';
    for (let x = -10; x <= 10; x += 0.05) {
      const rhs = evalCurve(x, eccA, eccB);
      if (rhs >= 0) {
        const y1 = Math.sqrt(rhs);
        ctx.fillRect(cx + x * scale, cy - y1 * scale, 2, 2);
        ctx.fillRect(cx + x * scale, cy + y1 * scale, 2, 2);
      }
    }

    // Secant/tangent line
    if (result) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx + (px - 5) * scale, cy - (py + result.m * (-5)) * scale);
      ctx.lineTo(cx + (px + 5) * scale, cy - (py + result.m * (5)) * scale);
      ctx.stroke();
      ctx.setLineDash([]);

      // Intersection point (before reflection)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + result.x * scale, cy + result.y * scale, 5, 0, Math.PI * 2);
      ctx.fill();

      // Reflection line
      ctx.strokeStyle = '#f59e0b40';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx + result.x * scale, cy + result.y * scale);
      ctx.lineTo(cx + result.x * scale, cy - result.y * scale);
      ctx.stroke();
      ctx.setLineDash([]);

      // R point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx + result.x * scale, cy - result.y * scale, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('R', cx + result.x * scale + 10, cy - result.y * scale);
    }

    // P point
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx + px * scale, cy - py * scale, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('P', cx + px * scale + 10, cy - py * scale);

    // Q point
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(cx + qx * scale, cy - qy * scale, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Q', cx + qx * scale + 10, cy - qy * scale);
  }, [px, py, qx, qy, eccA, eccB, result]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <Card title="Point Addition / Doubling">
      <div className="flex flex-col lg:flex-row gap-4">
        <canvas
          ref={canvasRef}
          width={450}
          height={400}
          className="border border-gray-700 rounded-xl bg-crypto-bg mx-auto"
        />
        <div className="space-y-3 min-w-[200px]">
          <div>
            <label className="text-xs text-green-400 block mb-1">P.x = {px.toFixed(2)}</label>
            <input type="range" min={-4} max={4} step={0.1} value={px}
              onChange={e => setPx(parseFloat(e.target.value))} className="w-full accent-green-500" />
          </div>
          <div>
            <label className="text-xs text-purple-400 block mb-1">Q.x = {qx.toFixed(2)}</label>
            <input type="range" min={-4} max={4} step={0.1} value={qx}
              onChange={e => setQx(parseFloat(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div className="text-xs text-gray-400 space-y-1 font-mono">
            <div className="text-green-400">P = ({px.toFixed(2)}, {py.toFixed(2)})</div>
            <div className="text-purple-400">Q = ({qx.toFixed(2)}, {qy.toFixed(2)})</div>
            {result && (
              <div className="text-red-400">R = P + Q = ({result.x.toFixed(2)}, {result.y.toFixed(2)})</div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Drag P and Q along the curve. When P=Q, the tangent line is used (point doubling).
            The yellow line intersects the curve, and R is the reflection.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Scalar Multiplication ─── */
function ScalarMultiplication() {
  const { eccA, eccB } = useCryptoStore();
  const [n, setN] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fixed base point
  const baseX = -1;
  const baseRhs = evalCurve(baseX, eccA, eccB);
  const baseY = baseRhs >= 0 ? Math.sqrt(baseRhs) : 0;

  const points = useMemo(() => {
    if (baseRhs < 0) return [];
    const pts: Array<{ x: number; y: number }> = [{ x: baseX, y: baseY }];
    let curX = baseX;
    let curY = baseY;

    for (let i = 1; i < n; i++) {
      // Add base point (doubling if same)
      let m: number;
      if (curX === baseX && curY === baseY) {
        if (curY === 0) break;
        m = (3 * curX * curX + eccA) / (2 * curY);
      } else {
        if (curX === baseX) break;
        m = (baseY - curY) / (baseX - curX);
      }
      const rx = m * m - curX - baseX;
      const ry = -(curY + m * (rx - curX));
      pts.push({ x: rx, y: ry });
      curX = rx;
      curY = ry;
    }
    return pts;
  }, [baseX, baseY, baseRhs, eccA, eccB, n]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const scale = 35;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = -10; x <= 10; x++) {
      ctx.beginPath(); ctx.moveTo(cx + x * scale, 0); ctx.lineTo(cx + x * scale, H); ctx.stroke();
    }
    for (let y = -10; y <= 10; y++) {
      ctx.beginPath(); ctx.moveTo(0, cy + y * scale); ctx.lineTo(W, cy + y * scale); ctx.stroke();
    }

    // Curve
    ctx.fillStyle = '#3b82f640';
    for (let x = -10; x <= 10; x += 0.05) {
      const rhs = evalCurve(x, eccA, eccB);
      if (rhs >= 0) {
        const y1 = Math.sqrt(rhs);
        ctx.fillRect(cx + x * scale, cy - y1 * scale, 2, 2);
        ctx.fillRect(cx + x * scale, cy + y1 * scale, 2, 2);
      }
    }

    // Trajectory lines
    for (let i = 0; i < points.length - 1; i++) {
      ctx.strokeStyle = `hsl(${120 + i * 40}, 70%, 50%)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx + points[i].x * scale, cy - points[i].y * scale);
      ctx.lineTo(cx + points[i + 1].x * scale, cy - points[i + 1].y * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Points
    points.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#10b981' : `hsl(${120 + i * 40}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(cx + p.x * scale, cy - p.y * scale, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`${i + 1}G`, cx + p.x * scale + 8, cy - p.y * scale - 5);
    });
  }, [points, eccA, eccB]);

  return (
    <Card title="Scalar Multiplication (nG)">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">n = {n} (number of additions)</label>
          <input type="range" min={1} max={10} value={n}
            onChange={e => setN(parseInt(e.target.value))} className="w-full accent-green-500" />
        </div>
        <canvas
          ref={canvasRef}
          width={450}
          height={350}
          className="border border-gray-700 rounded-xl bg-crypto-bg mx-auto"
        />
        <p className="text-xs text-gray-500">
          The "billiard ball" bounces {n} times. Each step adds the generator point G to itself.
        </p>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function EllipticCurves() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="📈"
        title="Elliptic Curve Cryptography"
        description="Plot curves, drag points to see addition/doubling, and watch scalar multiplication trace its path."
      />
      <ScrollySection id="curve-plot">
        <CurvePlotter />
      </ScrollySection>
      <ScrollySection id="point-add">
        <PointAddition />
      </ScrollySection>
      <ScrollySection id="scalar-mul">
        <ScalarMultiplication />
      </ScrollySection>
    </div>
  );
}
