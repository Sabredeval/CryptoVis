import { useState, useMemo } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, StepControls, ScrollySection } from '../components/Shared';

/* ─── AES S-Box (first 32 entries for demo) ─── */
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

function subBytes(state: number[][]): number[][] {
  return state.map(row => row.map(v => SBOX[v & 0xff]));
}

function shiftRows(state: number[][]): number[][] {
  return state.map((row, i) => [...row.slice(i), ...row.slice(0, i)]);
}

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

function mixColumns(state: number[][]): number[][] {
  const out = state.map(r => [...r]);
  for (let c = 0; c < 4; c++) {
    const s = [state[0][c], state[1][c], state[2][c], state[3][c]];
    out[0][c] = gmul(2, s[0]) ^ gmul(3, s[1]) ^ s[2] ^ s[3];
    out[1][c] = s[0] ^ gmul(2, s[1]) ^ gmul(3, s[2]) ^ s[3];
    out[2][c] = s[0] ^ s[1] ^ gmul(2, s[2]) ^ gmul(3, s[3]);
    out[3][c] = gmul(3, s[0]) ^ s[1] ^ s[2] ^ gmul(2, s[3]);
  }
  return out;
}

/* ─── Feistel Network ─── */
function FeistelNetwork() {
  const { desStep, setDesStep } = useCryptoStore();
  const totalRounds = 8;

  return (
    <Card title="Feistel Network (DES Structure)">
      <StepControls
        currentStep={desStep}
        totalSteps={totalRounds}
        onStepChange={setDesStep}
        labels={Array.from({ length: totalRounds }, (_, i) => `Round ${i + 1}`)}
      />
      <div className="mt-4 flex flex-col items-center">
        {/* Data path */}
        <div className="flex gap-8 mb-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Left (32 bits)</div>
            <div className="w-28 h-10 bg-blue-900/40 border border-blue-600 rounded-lg flex items-center justify-center text-xs font-mono text-blue-300">
              L{desStep}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Right (32 bits)</div>
            <div className="w-28 h-10 bg-green-900/40 border border-green-600 rounded-lg flex items-center justify-center text-xs font-mono text-green-300">
              R{desStep}
            </div>
          </div>
        </div>

        {/* Rounds */}
        {Array.from({ length: totalRounds }, (_, i) => (
          <div key={i} className={`flex flex-col items-center transition-all duration-500 ${i <= desStep ? 'opacity-100' : 'opacity-20'}`}>
            <svg width="280" height="60" viewBox="0 0 280 60">
              {/* Left line goes straight down */}
              <line x1="70" y1="0" x2="70" y2="60" stroke={i <= desStep ? '#3b82f6' : '#374151'} strokeWidth="2" />
              {/* Right line goes straight down */}
              <line x1="210" y1="0" x2="210" y2="60" stroke={i <= desStep ? '#10b981' : '#374151'} strokeWidth="2" />
              {/* Cross-over XOR */}
              <line x1="210" y1="30" x2="70" y2="30" stroke={i === desStep ? '#f59e0b' : '#4b5563'} strokeWidth="2" strokeDasharray={i === desStep ? '0' : '4'} />
              {/* F-function box */}
              <rect x="115" y="15" width="50" height="30" rx="6" fill={i === desStep ? '#f59e0b' : '#1f2937'} stroke={i === desStep ? '#f59e0b' : '#4b5563'} strokeWidth="1" />
              <text x="140" y="35" textAnchor="middle" className="text-xs fill-white font-mono">F</text>
              {/* Key input */}
              <line x1="140" y1="0" x2="140" y2="15" stroke={i === desStep ? '#ef4444' : '#374151'} strokeWidth="1" strokeDasharray="3" />
              <text x="145" y="10" className="text-[9px] fill-red-400">K{i + 1}</text>
            </svg>
          </div>
        ))}

        <div className="flex gap-8 mt-3">
          <div className="w-28 h-10 bg-green-900/40 border border-green-600 rounded-lg flex items-center justify-center text-xs font-mono text-green-300">
            L' = R{desStep}
          </div>
          <div className="w-28 h-10 bg-blue-900/40 border border-blue-600 rounded-lg flex items-center justify-center text-xs font-mono text-blue-300">
            R' = L⊕F
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── AES Grid ─── */
function AesGrid() {
  const { aesStep, setAesStep } = useCryptoStore();

  const initialState: number[][] = [
    [0x32, 0x88, 0x31, 0xe0],
    [0x43, 0x5a, 0x31, 0x37],
    [0xf6, 0x30, 0x98, 0x07],
    [0xa8, 0x8d, 0xa2, 0x34],
  ];

  const steps = [
    { label: 'Initial State', transform: (s: number[][]) => s },
    { label: 'SubBytes', transform: subBytes },
    { label: 'ShiftRows', transform: (s: number[][]) => shiftRows(subBytes(s)) },
    { label: 'MixColumns', transform: (s: number[][]) => mixColumns(shiftRows(subBytes(s))) },
  ];

  const currentState = steps[aesStep].transform(initialState);
  const highlightRow = aesStep === 2 ? aesStep : -1;
  const highlightCol = aesStep === 3 ? 0 : -1;

  return (
    <Card title="AES 4×4 State Matrix">
      <StepControls
        currentStep={aesStep}
        totalSteps={steps.length}
        onStepChange={setAesStep}
        labels={steps.map(s => s.label)}
      />
      <div className="mt-4 flex flex-col lg:flex-row gap-6 items-start">
        {/* State Grid */}
        <div>
          <div className="text-xs text-gray-500 mb-2">State ({steps[aesStep].label})</div>
          <div className="grid grid-cols-4 gap-1.5">
            {currentState.flat().map((val, idx) => {
              const r = Math.floor(idx / 4);
              const c = idx % 4;
              const isHighlightRow = aesStep === 2 && r > 0;
              const isHighlightCol = aesStep === 3 && c === 0;
              const isSubstituted = aesStep === 1;
              return (
                <div
                  key={idx}
                  className={`w-14 h-14 flex items-center justify-center font-mono text-sm rounded-lg border transition-all duration-500 ${
                    isSubstituted
                      ? 'bg-purple-900/50 border-purple-500 text-purple-300'
                      : isHighlightRow
                      ? 'bg-yellow-900/50 border-yellow-500 text-yellow-300'
                      : isHighlightCol
                      ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300'
                      : 'bg-gray-800 border-gray-600 text-gray-300'
                  }`}
                  style={isHighlightRow ? { transform: `translateX(${-r * 15}px)` } : undefined}
                >
                  {val.toString(16).padStart(2, '0')}
                </div>
              );
            })}
          </div>
        </div>

        {/* S-Box lookup (SubBytes view) */}
        {aesStep === 1 && (
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-2">S-Box Lookup Table (first 4 rows)</div>
            <div className="grid grid-cols-16 gap-px text-[9px] font-mono">
              {SBOX.slice(0, 64).map((v, i) => (
                <div key={i} className="w-6 h-6 flex items-center justify-center bg-gray-800 text-gray-500 rounded-sm">
                  {v.toString(16).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ShiftRows explanation */}
        {aesStep === 2 && (
          <div className="flex-1 text-sm text-gray-400 space-y-1">
            <p>Row 0: no shift</p>
            <p className="text-yellow-400">Row 1: shift left by 1</p>
            <p className="text-yellow-400">Row 2: shift left by 2</p>
            <p className="text-yellow-400">Row 3: shift left by 3</p>
          </div>
        )}

        {/* MixColumns explanation */}
        {aesStep === 3 && (
          <div className="flex-1 text-sm text-gray-400 space-y-1">
            <p className="text-cyan-400">Matrix multiplication in GF(2⁸):</p>
            <pre className="text-xs text-gray-500 font-mono mt-2">
{`[2 3 1 1]   [s0]
[1 2 3 1] × [s1]
[1 1 2 3]   [s2]
[3 1 1 2]   [s3]`}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Key Schedule ─── */
function KeySchedule() {
  const roundKeys = Array.from({ length: 11 }, (_, i) => {
    // Generate pseudo round key data for visualization
    return Array.from({ length: 4 }, (_, j) => 
      ((i * 37 + j * 13 + 0xab) & 0xff).toString(16).padStart(2, '0')
    ).join(' ');
  });

  return (
    <Card title="AES Key Schedule">
      <p className="text-xs text-gray-500 mb-3">The 128-bit key expands into 11 round keys (one initial + 10 rounds).</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {roundKeys.map((key, i) => (
          <div
            key={i}
            className="shrink-0 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-center"
          >
            <div className="text-[10px] text-gray-500 mb-1">Round {i}</div>
            <div className="font-mono text-xs text-blue-400 whitespace-nowrap">{key}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        ← Scroll horizontally to see all round keys →
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function BlockCiphers() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="🧱"
        title="Block Ciphers (DES & AES)"
        description="Watch data flow through Feistel networks, S-Box substitutions, row shifts, column mixing, and key expansion."
      />
      <ScrollySection id="feistel">
        <FeistelNetwork />
      </ScrollySection>
      <ScrollySection id="aes-grid">
        <AesGrid />
      </ScrollySection>
      <ScrollySection id="key-schedule">
        <KeySchedule />
      </ScrollySection>
    </div>
  );
}
