import { useState, useMemo } from 'react';
import { Card } from '../Shared';

/* ─── Perfect Secrecy Simulator ─── */
export function PerfectSecrecySimulator() {
  const [message, setMessage] = useState('ATTACK AT DAWN');
  const [key, setKey] = useState('MYSECRETKE');

  const msgBytes = useMemo(() => Array.from(message).map((c) => c.charCodeAt(0)), [message]);
  const keyBytes = useMemo(() => Array.from(key).map((c) => c.charCodeAt(0)), [key]);

  const encrypted = useMemo(() => {
    return msgBytes.map((b, i) => {
      if (i < keyBytes.length) return b ^ keyBytes[i];
      return b; // unsecured — key ran out
    });
  }, [msgBytes, keyBytes]);

  const decrypted = useMemo(() => {
    return encrypted.map((b, i) => {
      if (i < keyBytes.length) return String.fromCharCode(b ^ keyBytes[i]);
      return String.fromCharCode(b);
    }).join('');
  }, [encrypted, keyBytes]);

  const keyExhausted = message.length > key.length;

  return (
    <Card title="One-Time Pad — Perfect Secrecy Simulator">
      <p className="text-xs text-gray-500 mb-4">
        The OTP requires a key <strong>at least as long</strong> as the message. Characters beyond the key length are <span className="text-red-400">unsecured</span>.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Message ({message.length} chars)</label>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Key ({key.length} chars)</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Character-by-character breakdown */}
      <div className="mb-4 overflow-x-auto">
        <div className="text-xs text-gray-500 mb-1">Character-Level Encryption</div>
        <div className="flex gap-px min-w-max">
          {Array.from(message).map((ch, i) => {
            const secured = i < key.length;
            const kChar = key[i] || '?';
            const encByte = encrypted[i];
            return (
              <div key={i} className="flex flex-col items-center w-8">
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-mono rounded border ${secured ? 'bg-blue-900/40 border-blue-600 text-blue-300' : 'bg-red-900/40 border-red-600 text-red-300'}`}>
                  {ch}
                </div>
                <div className="text-[9px] text-gray-600">⊕</div>
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-mono rounded border ${secured ? 'bg-purple-900/40 border-purple-600 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-600'}`}>
                  {secured ? kChar : '—'}
                </div>
                <div className="text-[9px] text-gray-600">=</div>
                <div className={`w-7 h-7 flex items-center justify-center text-[10px] font-mono rounded border ${secured ? 'bg-green-900/40 border-green-600 text-green-300' : 'bg-red-900/40 border-red-600 text-red-300 animate-pulse'}`}>
                  {encByte.toString(16).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning */}
      {keyExhausted && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-xs text-red-400 mb-3">
          ⚠ Key is only {key.length} characters but message is {message.length} characters!
          The last {message.length - key.length} characters are <strong>not encrypted</strong> — they are sent as plaintext.
          A true OTP requires key ≥ message length.
        </div>
      )}
      {!keyExhausted && (
        <div className="p-3 bg-green-900/20 border border-green-800 rounded-xl text-xs text-green-400 mb-3">
          ✓ Key is long enough. With a truly random, never-reused key this achieves <strong>perfect secrecy</strong> (information-theoretically secure).
        </div>
      )}

      {/* Decryption */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Decrypted</div>
        <div className="font-mono text-sm bg-gray-900 rounded-lg p-2">
          {Array.from(decrypted).map((ch, i) => (
            <span key={i} className={i < key.length ? 'text-green-400' : 'text-red-400'}>
              {ch}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─── Modulo 2 / XOR Reversibility Visualizer ─── */
export function Mod2Visualizer() {
  const [bits, setBits] = useState([1, 0, 1, 1, 0, 1, 0, 0]);
  const [keyBits, setKeyBits] = useState([0, 1, 1, 0, 1, 0, 1, 1]);

  const encrypted = bits.map((b, i) => b ^ keyBits[i]);
  const decrypted = encrypted.map((b, i) => b ^ keyBits[i]);

  const toggleBit = (arr: number[], setArr: (a: number[]) => void, idx: number) => {
    const n = [...arr];
    n[idx] ^= 1;
    setArr(n);
  };

  return (
    <Card title='XOR Reversibility — "Modulo 2" Addition'>
      <p className="text-xs text-gray-500 mb-4">
        XOR is its own inverse: <code className="text-yellow-400">M ⊕ K ⊕ K = M</code>.
        Encrypting and decrypting use the <strong>same</strong> operation. Click bits to toggle.
      </p>

      <div className="space-y-4">
        {/* Truth table */}
        <div className="flex gap-6 mb-2">
          <div className="text-xs text-gray-500">
            <div className="font-bold mb-1 text-gray-400">XOR Truth Table</div>
            <div className="grid grid-cols-3 gap-x-3 font-mono">
              <span>A</span><span>B</span><span>A⊕B</span>
              <span className="text-gray-400">0</span><span className="text-gray-400">0</span><span className="text-blue-400">0</span>
              <span className="text-gray-400">0</span><span className="text-yellow-400">1</span><span className="text-yellow-400">1</span>
              <span className="text-yellow-400">1</span><span className="text-gray-400">0</span><span className="text-yellow-400">1</span>
              <span className="text-yellow-400">1</span><span className="text-yellow-400">1</span><span className="text-blue-400">0</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 self-end">
            <span className="text-yellow-300">1 + 1 = 0</span> (mod 2)<br />
            Adding the key = Subtracting the key
          </div>
        </div>

        {/* Three rows: Message → Encrypt → Decrypt */}
        <div className="space-y-2">
          <div>
            <div className="text-xs text-blue-400 mb-1">Message (click to toggle)</div>
            <div className="flex gap-1">
              {bits.map((b, i) => (
                <button key={i} onClick={() => toggleBit(bits, setBits, i)}
                  className={`bit-cell cursor-pointer hover:scale-110 ${b ? 'bit-1' : 'bit-0'}`}>{b}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <span className="w-8 text-center">⊕</span>
            <span>Key (click to toggle)</span>
          </div>

          <div>
            <div className="flex gap-1">
              {keyBits.map((b, i) => (
                <button key={i} onClick={() => toggleBit(keyBits, setKeyBits, i)}
                  className={`bit-cell cursor-pointer hover:scale-110 ${b ? 'bg-purple-900/50 border-purple-500 text-purple-300' : 'bit-0'}`}>{b}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <span className="w-8 text-center">=</span>
            <span>Ciphertext (Encrypted)</span>
          </div>

          <div className="flex gap-1">
            {encrypted.map((b, i) => (
              <div key={i} className={`bit-cell ${b ? 'bg-yellow-900/50 border-yellow-500 text-yellow-300' : 'bit-0'}`}>{b}</div>
            ))}
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <span className="w-8 text-center">⊕</span>
            <span>Same Key again</span>
          </div>

          <div className="flex gap-1">
            {keyBits.map((b, i) => (
              <div key={i} className={`bit-cell ${b ? 'bg-purple-900/50 border-purple-500 text-purple-300' : 'bit-0'}`}>{b}</div>
            ))}
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <span className="w-8 text-center">=</span>
            <span>Decrypted (original recovered!)</span>
          </div>

          <div className="flex gap-1">
            {decrypted.map((b, i) => (
              <div key={i} className={`bit-cell ${b === bits[i] ? 'bg-green-900/50 border-green-500 text-green-300' : 'bg-red-900/50 border-red-500 text-red-300'}`}>{b}</div>
            ))}
          </div>
        </div>

        <div className="p-2 bg-green-900/10 border border-green-800/50 rounded-lg text-xs text-green-400">
          ✓ Decrypted matches original: [{decrypted.join('')}] = [{bits.join('')}]
        </div>
      </div>
    </Card>
  );
}
