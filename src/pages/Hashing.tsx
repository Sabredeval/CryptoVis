import { useState, useMemo, useEffect } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, ScrollySection, StepControls } from '../components/Shared';

/* ─── SHA-256 Implementation (simplified but functional) ─── */
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rightRotate(n: number, d: number): number {
  return ((n >>> d) | (n << (32 - d))) >>> 0;
}

function sha256(message: string): string {
  // Encode to bytes
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(message);
  const bitLen = msgBytes.length * 8;

  // Padding
  const padded = new Uint8Array(Math.ceil((msgBytes.length + 9) / 64) * 64);
  padded.set(msgBytes);
  padded[msgBytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen, false);

  // Initial hash values
  let h0 = 0x6a09e667 >>> 0;
  let h1 = 0xbb67ae85 >>> 0;
  let h2 = 0x3c6ef372 >>> 0;
  let h3 = 0xa54ff53a >>> 0;
  let h4 = 0x510e527f >>> 0;
  let h5 = 0x9b05688c >>> 0;
  let h6 = 0x1f83d9ab >>> 0;
  let h7 = 0x5be0cd19 >>> 0;

  // Process blocks
  for (let i = 0; i < padded.length; i += 64) {
    const w = new Uint32Array(64);
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

function hexToBinary(hex: string): string {
  return hex
    .split('')
    .map((h) => parseInt(h, 16).toString(2).padStart(4, '0'))
    .join('');
}

/* ─── Avalanche Comparator ─── */
function AvalancheComparator() {
  const { hashInput1, setHashInput1, hashInput2, setHashInput2 } = useCryptoStore();

  const hash1 = useMemo(() => sha256(hashInput1), [hashInput1]);
  const hash2 = useMemo(() => sha256(hashInput2), [hashInput2]);
  const bin1 = hexToBinary(hash1);
  const bin2 = hexToBinary(hash2);

  const diffBits = useMemo(() => {
    let count = 0;
    const diffs = new Set<number>();
    for (let i = 0; i < bin1.length; i++) {
      if (bin1[i] !== bin2[i]) {
        count++;
        diffs.add(i);
      }
    }
    return { count, diffs };
  }, [bin1, bin2]);

  const diffPercent = ((diffBits.count / 256) * 100).toFixed(1);

  return (
    <Card title="Avalanche Effect Comparator">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Input 1</label>
            <input value={hashInput1} onChange={e => setHashInput1(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Input 2</label>
            <input value={hashInput2} onChange={e => setHashInput2(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Hash outputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-blue-400 mb-1">SHA-256 Hash 1</div>
            <div className="text-[10px] font-mono text-blue-300 bg-blue-900/20 rounded-lg p-2 break-all">{hash1}</div>
          </div>
          <div>
            <div className="text-xs text-purple-400 mb-1">SHA-256 Hash 2</div>
            <div className="text-[10px] font-mono text-purple-300 bg-purple-900/20 rounded-lg p-2 break-all">{hash2}</div>
          </div>
        </div>

        {/* Binary diff */}
        <div>
          <div className="text-xs text-gray-500 mb-2">
            Binary Diff: <span className="text-yellow-400">{diffBits.count}</span> / 256 bits differ ({diffPercent}%)
          </div>
          <div className="flex flex-wrap gap-px">
            {bin1.split('').map((bit, i) => {
              const differs = diffBits.diffs.has(i);
              return (
                <div
                  key={i}
                  className={`w-2 h-4 rounded-sm transition-colors ${
                    differs ? 'bg-red-500' : 'bg-green-900/50'
                  }`}
                  title={`Bit ${i}: ${bit} vs ${bin2[i]}`}
                />
              );
            })}
          </div>
          <div className="flex gap-4 mt-1 text-xs">
            <span className="text-green-600">■ Same</span>
            <span className="text-red-500">■ Different</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-300"
            style={{ width: `${diffPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          Ideal avalanche: ~50% of bits should change. Current: {diffPercent}%
        </p>
      </div>
    </Card>
  );
}

/* ─── Compression Function Diagram ─── */
function CompressionFunction() {
  const [step, setStep] = useState(0);
  const registers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const steps = [
    { label: 'Initial state', desc: 'Load initial hash values into registers A-H.' },
    { label: 'Σ1(E)', desc: 'Compute Σ1 = ROTR⁶(E) ⊕ ROTR¹¹(E) ⊕ ROTR²⁵(E)' },
    { label: 'Ch(E,F,G)', desc: 'Choice function: (E AND F) XOR (NOT E AND G)' },
    { label: 'T1 = H+Σ1+Ch+K+W', desc: 'Compute temporary word T1' },
    { label: 'Σ0(A)', desc: 'Compute Σ0 = ROTR²(A) ⊕ ROTR¹³(A) ⊕ ROTR²²(A)' },
    { label: 'Maj(A,B,C)', desc: 'Majority function: (A AND B) XOR (A AND C) XOR (B AND C)' },
    { label: 'T2 = Σ0 + Maj', desc: 'Compute temporary word T2' },
    { label: 'Shift & Update', desc: 'Shift registers: H←G, G←F, F←E, E←D+T1, D←C, C←B, B←A, A←T1+T2' },
  ];

  const activeRegs = useMemo(() => {
    switch (step) {
      case 1: return new Set(['E']);
      case 2: return new Set(['E', 'F', 'G']);
      case 3: return new Set(['H']);
      case 4: return new Set(['A']);
      case 5: return new Set(['A', 'B', 'C']);
      case 7: return new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
      default: return new Set<string>();
    }
  }, [step]);

  return (
    <Card title="SHA-256 Compression Function">
      <StepControls
        currentStep={step}
        totalSteps={steps.length}
        onStepChange={setStep}
        labels={steps.map(s => s.label)}
      />
      <div className="mt-4 flex flex-col lg:flex-row gap-6">
        {/* Register visualization */}
        <div className="flex gap-2">
          {registers.map(reg => (
            <div key={reg} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-16 rounded-lg border-2 flex items-center justify-center font-mono text-sm font-bold transition-all duration-500 ${
                activeRegs.has(reg)
                  ? 'bg-blue-900/60 border-blue-400 text-blue-300 scale-110 glow-blue'
                  : 'bg-gray-800 border-gray-600 text-gray-400'
              }`}>
                {reg}
              </div>
              <div className="text-[9px] text-gray-600 font-mono">32 bits</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-400 mb-1">{steps[step].label}</div>
          <p className="text-sm text-gray-400">{steps[step].desc}</p>
          <div className="mt-3 text-xs text-gray-500">
            <p>This compression function runs 64 rounds for each 512-bit message block.</p>
            <p className="mt-1">Each round mixes the registers using rotations, XOR, addition mod 2³², and round constants K[i].</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function Hashing() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="#️⃣"
        title="Hashing (SHA-256)"
        description="Compare hash outputs, visualize the avalanche effect, and step through the SHA-256 compression function."
      />
      <ScrollySection id="avalanche">
        <AvalancheComparator />
      </ScrollySection>
      <ScrollySection id="compression">
        <CompressionFunction />
      </ScrollySection>
    </div>
  );
}
