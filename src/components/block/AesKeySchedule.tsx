import { useState, useMemo } from 'react';
import { Card } from '../Shared';

/* ─── Full AES S-Box ─── */
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

const RCON: number[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
const hex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase();

function subWord(w: number[]): number[] {
  return w.map(b => SBOX[b & 0xff]);
}
function rotWord(w: number[]): number[] {
  return [w[1], w[2], w[3], w[0]];
}

/* ─── Key Expansion Visualizer ("Worm") ─── */
export function KeyExpansionViz() {
  const [activeWord, setActiveWord] = useState(0);

  // AES-128 key: 16 bytes → 4 initial words, expand to 44
  const initialKey = [0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c];

  const words = useMemo(() => {
    const ws: number[][] = [];
    // First 4 words from original key
    for (let i = 0; i < 4; i++) ws.push(initialKey.slice(i * 4, i * 4 + 4));

    for (let i = 4; i < 44; i++) {
      let temp = [...ws[i - 1]];
      if (i % 4 === 0) {
        temp = rotWord(temp);
        temp = subWord(temp);
        temp[0] ^= RCON[(i / 4) - 1];
      }
      ws.push(ws[i - 4].map((b, j) => b ^ temp[j]));
    }
    return ws;
  }, []);

  const isGFunc = activeWord >= 4 && activeWord % 4 === 0;
  const roundNum = Math.floor(activeWord / 4);

  return (
    <Card title="AES Key Schedule (Key Expansion)">
      <p className="text-xs text-gray-500 mb-3">
        The 128-bit key expands into <strong>44 words</strong> (4 per round × 11 round keys).
        Every 4th word passes through the <span className="text-yellow-400">g-function</span> (RotWord → SubWord → Rcon XOR).
      </p>

      {/* Word strip */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Expanded Key (44 words) — click any word</div>
        <div className="flex flex-wrap gap-1">
          {words.map((w, i) => {
            const isActive = i === activeWord;
            const isG = i >= 4 && i % 4 === 0;
            const isOriginal = i < 4;
            const round = Math.floor(i / 4);
            return (
              <button
                key={i}
                onClick={() => setActiveWord(i)}
                className={`px-1.5 py-1 text-[8px] font-mono rounded transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-400'
                    : isOriginal
                    ? 'bg-green-900/40 border border-green-700/50 text-green-400'
                    : isG
                    ? 'bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/60'
                    : 'bg-gray-800 border border-gray-700 text-gray-500 hover:bg-gray-700'
                }`}
                title={`W[${i}] — Round ${round}`}
              >
                W{i}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-1 text-[9px]">
          <span className="text-green-400">■ Original key</span>
          <span className="text-yellow-400">■ g-function applied</span>
          <span className="text-gray-500">■ Simple XOR</span>
        </div>
      </div>

      {/* Derivation detail */}
      <div className="p-4 bg-gray-800/60 border border-gray-700 rounded-xl space-y-3">
        <div className="text-xs text-gray-400">
          <strong>W[{activeWord}]</strong> — Round {roundNum}
        </div>

        {activeWord < 4 ? (
          <div className="text-sm text-green-400 font-mono">
            Original key bytes: [{words[activeWord].map(hex).join(' ')}]
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-gray-500">W[{activeWord}] =</span>
              <span className="text-blue-400 px-2 py-1 bg-blue-900/30 rounded">W[{activeWord - 4}]</span>
              <span className="text-gray-500">⊕</span>
              {isGFunc ? (
                <span className="text-yellow-400 px-2 py-1 bg-yellow-900/30 rounded">g(W[{activeWord - 1}])</span>
              ) : (
                <span className="text-gray-400 px-2 py-1 bg-gray-700 rounded">W[{activeWord - 1}]</span>
              )}
            </div>

            {/* Show values */}
            <div className="grid grid-cols-1 gap-1 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-20">W[{activeWord - 4}]:</span>
                <span className="text-blue-400">[{words[activeWord - 4].map(hex).join(' ')}]</span>
              </div>
              {isGFunc ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-20">W[{activeWord - 1}]:</span>
                    <span className="text-gray-400">[{words[activeWord - 1].map(hex).join(' ')}]</span>
                  </div>
                  <div className="pl-4 border-l-2 border-yellow-700 space-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 w-16">RotWord:</span>
                      <span className="text-yellow-400">[{rotWord(words[activeWord - 1]).map(hex).join(' ')}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 w-16">SubWord:</span>
                      <span className="text-yellow-400">[{subWord(rotWord(words[activeWord - 1])).map(hex).join(' ')}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 w-16">Rcon:</span>
                      <span className="text-yellow-400">[{hex(RCON[roundNum - 1])} 00 00 00]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 w-16">g(…):</span>
                      {(() => {
                        const temp = subWord(rotWord(words[activeWord - 1]));
                        temp[0] ^= RCON[roundNum - 1];
                        return <span className="text-yellow-300 font-bold">[{temp.map(hex).join(' ')}]</span>;
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">W[{activeWord - 1}]:</span>
                  <span className="text-gray-400">[{words[activeWord - 1].map(hex).join(' ')}]</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                <span className="text-gray-300 w-20 font-bold">Result:</span>
                <span className="text-green-400 font-bold">[{words[activeWord].map(hex).join(' ')}]</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
