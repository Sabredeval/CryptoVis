import { useState, useMemo } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, StepControls, ScrollySection } from '../components/Shared';

/* ─── Math helpers ─── */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function extendedGcd(a: number, b: number): { gcd: number; x: number; y: number } {
  if (b === 0) return { gcd: a, x: 1, y: 0 };
  const r = extendedGcd(b, a % b);
  return { gcd: r.gcd, x: r.y, y: r.x - Math.floor(a / b) * r.y };
}

function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  base %= mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

function euclideanSteps(a: number, b: number): Array<{ a: number; b: number; q: number; r: number }> {
  const steps: Array<{ a: number; b: number; q: number; r: number }> = [];
  while (b > 0) {
    const q = Math.floor(a / b);
    const r = a % b;
    steps.push({ a, b, q, r });
    a = b;
    b = r;
  }
  return steps;
}

/* ─── Euclidean Algorithm Stepper ─── */
function EuclideanStepper() {
  const [numA, setNumA] = useState(252);
  const [numB, setNumB] = useState(105);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => euclideanSteps(numA, numB), [numA, numB]);

  return (
    <Card title="Euclidean Algorithm (GCD)">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">a</label>
            <input type="number" value={numA} onChange={e => { setNumA(+e.target.value); setCurrentStep(0); }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">b</label>
            <input type="number" value={numB} onChange={e => { setNumB(+e.target.value); setCurrentStep(0); }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {steps.length > 0 && (
          <StepControls currentStep={currentStep} totalSteps={steps.length} onStepChange={setCurrentStep} />
        )}

        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm transition-all ${
              i === currentStep ? 'bg-blue-900/40 border border-blue-600 text-blue-300' :
              i < currentStep ? 'text-gray-500' : 'text-gray-600 opacity-30'
            }`}>
              <span className="text-gray-500 text-xs w-8">#{i + 1}</span>
              <span>{s.a} = {s.q} × {s.b} + <span className={i === currentStep ? 'text-yellow-400 font-bold' : ''}>{s.r}</span></span>
            </div>
          ))}
        </div>

        <div className="text-sm font-mono">
          GCD({numA}, {numB}) = <span className="text-green-400 font-bold">{gcd(numA, numB)}</span>
        </div>

        {/* Visual rectangles */}
        <div className="flex items-end gap-1 h-20">
          {steps.slice(0, currentStep + 1).map((s, i) => (
            <div
              key={i}
              className="bg-blue-600/30 border border-blue-500 rounded"
              style={{
                width: Math.max(10, (s.b / Math.max(numA, numB)) * 200),
                height: Math.max(10, (s.b / Math.max(numA, numB)) * 80),
              }}
              title={`${s.b}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─── DH Color Mixing ─── */
function DhColorMixing() {
  const [publicColor, setPublicColor] = useState('#f59e0b');
  const [aliceSecret, setAliceSecret] = useState('#3b82f6');
  const [bobSecret, setBobSecret] = useState('#ef4444');

  // Simple color "mixing" by averaging RGB
  function mixColors(c1: string, c2: string): string {
    const parse = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const [r1, g1, b1] = parse(c1);
    const [r2, g2, b2] = parse(c2);
    const r = Math.floor((r1 + r2) / 2);
    const g = Math.floor((g1 + g2) / 2);
    const b = Math.floor((b1 + b2) / 2);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  const aliceMix = mixColors(publicColor, aliceSecret);
  const bobMix = mixColors(publicColor, bobSecret);
  const sharedSecret = mixColors(
    mixColors(publicColor, aliceSecret),
    bobSecret
  );
  const sharedSecret2 = mixColors(
    mixColors(publicColor, bobSecret),
    aliceSecret
  );

  return (
    <Card title="Diffie-Hellman Color Mixing Analogy">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Alice's Secret</label>
            <input type="color" value={aliceSecret} onChange={e => setAliceSecret(e.target.value)} className="w-16 h-16 rounded-full cursor-pointer border-2 border-gray-600" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Public Color</label>
            <input type="color" value={publicColor} onChange={e => setPublicColor(e.target.value)} className="w-16 h-16 rounded-full cursor-pointer border-2 border-gray-600" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Bob's Secret</label>
            <input type="color" value={bobSecret} onChange={e => setBobSecret(e.target.value)} className="w-16 h-16 rounded-full cursor-pointer border-2 border-gray-600" />
          </div>
        </div>

        {/* Mixing arrows */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
          <span>↓ mix with public ↓</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-2">Alice sends (public + secret)</div>
            <div className="w-16 h-16 rounded-full mx-auto border-2 border-gray-600" style={{ backgroundColor: aliceMix }} />
            <div className="text-xs text-gray-500 mt-1 font-mono">{aliceMix}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">Bob sends (public + secret)</div>
            <div className="w-16 h-16 rounded-full mx-auto border-2 border-gray-600" style={{ backgroundColor: bobMix }} />
            <div className="text-xs text-gray-500 mt-1 font-mono">{bobMix}</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
          <span>↓ each mixes with own secret ↓</span>
        </div>

        <div className="text-center">
          <div className="text-xs text-green-400 mb-2">Shared Secret (both arrive at same color!)</div>
          <div className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 glow-green" style={{ backgroundColor: sharedSecret }} />
          <div className="text-xs text-gray-500 mt-2 font-mono">{sharedSecret}</div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Small Scale RSA ─── */
function SmallRsa() {
  const { rsaP, rsaQ, rsaMessage, setRsaP, setRsaQ, setRsaMessage } = useCryptoStore();

  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

  const n = rsaP * rsaQ;
  const phi = (rsaP - 1) * (rsaQ - 1);

  // Find e coprime to phi
  const e = useMemo(() => {
    for (let candidate = 3; candidate < phi; candidate += 2) {
      if (gcd(candidate, phi) === 1) return candidate;
    }
    return 3;
  }, [phi]);

  // Find d = e^-1 mod phi
  const d = useMemo(() => {
    const result = extendedGcd(e, phi);
    return ((result.x % phi) + phi) % phi;
  }, [e, phi]);

  const m = rsaMessage % n;
  const ciphertext = modPow(m, e, n);
  const decrypted = modPow(ciphertext, d, n);

  return (
    <Card title="Small-Scale RSA Calculator">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Prime p</label>
            <select value={rsaP} onChange={e => setRsaP(+e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm">
              {primes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Prime q</label>
            <select value={rsaQ} onChange={e => setRsaQ(+e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm">
              {primes.filter(p => p !== rsaP).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Message m (0 to {n - 1})</label>
          <input type="range" min={0} max={n - 1} value={m} onChange={e => setRsaMessage(+e.target.value)}
            className="w-full accent-blue-500" />
          <span className="text-sm text-blue-400 font-mono">{m}</span>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 space-y-2 font-mono text-sm">
          <div className="text-gray-400">
            n = p × q = {rsaP} × {rsaQ} = <span className="text-white">{n}</span>
          </div>
          <div className="text-gray-400">
            φ(n) = (p-1)(q-1) = {rsaP - 1} × {rsaQ - 1} = <span className="text-white">{phi}</span>
          </div>
          <div className="text-gray-400">
            e = <span className="text-yellow-400">{e}</span> (coprime to φ)
          </div>
          <div className="text-gray-400">
            d = e⁻¹ mod φ = <span className="text-yellow-400">{d}</span>
          </div>
          <hr className="border-gray-700" />
          <div className="text-blue-400">
            Encrypt: c = m<sup>e</sup> mod n = {m}<sup>{e}</sup> mod {n} = <span className="text-green-400 font-bold">{ciphertext}</span>
          </div>
          <div className="text-purple-400">
            Decrypt: m = c<sup>d</sup> mod n = {ciphertext}<sup>{d}</sup> mod {n} = <span className="text-green-400 font-bold">{decrypted}</span>
          </div>
          <div className={`text-xs ${decrypted === m ? 'text-green-400' : 'text-red-400'}`}>
            {decrypted === m ? '✓ Decryption matches original message!' : '✗ Error (try different primes)'}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function NumberTheory() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="🔢"
        title="Number Theory (RSA & Diffie-Hellman)"
        description="Visualize the Euclidean algorithm, understand Diffie-Hellman through color mixing, and compute RSA with small primes."
      />
      <ScrollySection id="euclidean">
        <EuclideanStepper />
      </ScrollySection>
      <ScrollySection id="dh-color">
        <DhColorMixing />
      </ScrollySection>
      <ScrollySection id="rsa">
        <SmallRsa />
      </ScrollySection>
    </div>
  );
}
