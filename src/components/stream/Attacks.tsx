import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../Shared';

/* ─── Two-Time Pad Visualizer ─── */
export function TwoTimePad() {
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const canvasCaRef = useRef<HTMLCanvasElement>(null);
  const canvasCbRef = useRef<HTMLCanvasElement>(null);
  const canvasXorRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const SIZE = 128;

  const render = useCallback(() => {
    const canvasA = canvasARef.current;
    const canvasB = canvasBRef.current;
    const canvasCa = canvasCaRef.current;
    const canvasCb = canvasCbRef.current;
    const canvasXor = canvasXorRef.current;
    if (!canvasA || !canvasB || !canvasCa || !canvasCb || !canvasXor) return;

    [canvasA, canvasB, canvasCa, canvasCb, canvasXor].forEach((c) => {
      c.width = SIZE; c.height = SIZE;
    });

    const ctxA = canvasA.getContext('2d')!;
    const ctxB = canvasB.getContext('2d')!;

    // Draw Image A: a white circle on black
    ctxA.fillStyle = '#000';
    ctxA.fillRect(0, 0, SIZE, SIZE);
    ctxA.fillStyle = '#fff';
    ctxA.beginPath();
    ctxA.arc(SIZE / 2, SIZE / 2, 40, 0, Math.PI * 2);
    ctxA.fill();
    ctxA.fillStyle = '#fff';
    ctxA.font = 'bold 14px monospace';
    ctxA.textAlign = 'center';
    ctxA.fillText('A', SIZE / 2, SIZE / 2 + 5);

    // Draw Image B: a white triangle on black
    ctxB.fillStyle = '#000';
    ctxB.fillRect(0, 0, SIZE, SIZE);
    ctxB.fillStyle = '#fff';
    ctxB.beginPath();
    ctxB.moveTo(SIZE / 2, 20);
    ctxB.lineTo(SIZE - 20, SIZE - 20);
    ctxB.lineTo(20, SIZE - 20);
    ctxB.closePath();
    ctxB.fill();
    ctxB.fillStyle = '#000';
    ctxB.font = 'bold 14px monospace';
    ctxB.textAlign = 'center';
    ctxB.fillText('B', SIZE / 2, SIZE - 35);

    const imgA = ctxA.getImageData(0, 0, SIZE, SIZE);
    const imgB = ctxB.getImageData(0, 0, SIZE, SIZE);

    // Generate keystream
    const keystream = new Uint8Array(SIZE * SIZE * 4);
    crypto.getRandomValues(keystream);

    // Encrypt A (XOR with keystream)
    const encA = new Uint8ClampedArray(imgA.data.length);
    for (let i = 0; i < imgA.data.length; i++) {
      if (i % 4 === 3) { encA[i] = 255; continue; } // alpha
      encA[i] = imgA.data[i] ^ keystream[i];
    }

    // Encrypt B (SAME keystream — the fatal mistake!)
    const encB = new Uint8ClampedArray(imgB.data.length);
    for (let i = 0; i < imgB.data.length; i++) {
      if (i % 4 === 3) { encB[i] = 255; continue; }
      encB[i] = imgB.data[i] ^ keystream[i];
    }

    // Display encrypted images
    canvasCa.getContext('2d')!.putImageData(new ImageData(encA, SIZE, SIZE), 0, 0);
    canvasCb.getContext('2d')!.putImageData(new ImageData(encB, SIZE, SIZE), 0, 0);

    // XOR ciphertexts together → reveals A ⊕ B (key cancels out!)
    const xorResult = new Uint8ClampedArray(encA.length);
    for (let i = 0; i < encA.length; i++) {
      if (i % 4 === 3) { xorResult[i] = 255; continue; }
      xorResult[i] = encA[i] ^ encB[i];
    }
    canvasXor.getContext('2d')!.putImageData(new ImageData(xorResult, SIZE, SIZE), 0, 0);

    setRendered(true);
  }, []);

  useEffect(() => { render(); }, [render]);

  return (
    <Card title='Attack: Two-Time Pad (Key Reuse)'>
      <p className="text-xs text-gray-500 mb-3">
        If the <strong>same keystream</strong> encrypts two different messages, XOR-ing the ciphertexts cancels the key:
        <code className="text-yellow-400 ml-1">(A⊕K) ⊕ (B⊕K) = A⊕B</code>
      </p>

      <div className="space-y-3">
        {/* Original images */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="text-center">
            <div className="text-xs text-blue-400 mb-1">Image A</div>
            <canvas ref={canvasARef} className="border border-blue-700/50 rounded-lg" style={{ imageRendering: 'pixelated', width: 100, height: 100 }} />
          </div>
          <div className="text-center">
            <div className="text-xs text-purple-400 mb-1">Image B</div>
            <canvas ref={canvasBRef} className="border border-purple-700/50 rounded-lg" style={{ imageRendering: 'pixelated', width: 100, height: 100 }} />
          </div>
        </div>

        <div className="text-xs text-gray-500">Both encrypted with the <span className="text-red-400 font-bold">same keystream</span>:</div>

        {/* Encrypted images */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Ciphertext A</div>
            <canvas ref={canvasCaRef} className="border border-gray-600 rounded-lg" style={{ imageRendering: 'pixelated', width: 100, height: 100 }} />
          </div>
          <div className="text-center text-xl text-yellow-400 self-center">⊕</div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Ciphertext B</div>
            <canvas ref={canvasCbRef} className="border border-gray-600 rounded-lg" style={{ imageRendering: 'pixelated', width: 100, height: 100 }} />
          </div>
          <div className="text-center text-xl text-yellow-400 self-center">=</div>
          <div className="text-center">
            <div className="text-xs text-red-400 mb-1 font-bold">A ⊕ B (Leaked!)</div>
            <canvas ref={canvasXorRef} className="border-2 border-red-600 rounded-lg" style={{ imageRendering: 'pixelated', width: 100, height: 100 }} />
          </div>
        </div>

        <button onClick={render} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg">
          🔄 Re-encrypt (new keystream)
        </button>

        {rendered && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-xs text-red-400">
            ⚠ The rightmost image shows both originals combined — the encryption is completely stripped away!
            This is why a One-Time Pad key must <strong>never</strong> be reused.
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Bit-Flipping (Malleability) Attack ─── */
export function BitFlippingAttack() {
  const originalMsg = 'Pay Bob $100';
  const [key] = useState(() => {
    const k = new Uint8Array(originalMsg.length);
    crypto.getRandomValues(k);
    return Array.from(k);
  });

  const msgBytes = useMemo(() => Array.from(originalMsg).map((c) => c.charCodeAt(0)), []);
  const cipherBytes = useMemo(() => msgBytes.map((b, i) => b ^ key[i]), [msgBytes, key]);
  const [modifiedCipher, setModifiedCipher] = useState<number[]>([...cipherBytes]);
  const [flippedBits, setFlippedBits] = useState<Set<string>>(new Set());

  // Decrypt with same key
  const decrypted = useMemo(() => {
    return modifiedCipher.map((b, i) => String.fromCharCode(b ^ key[i])).join('');
  }, [modifiedCipher, key]);

  const toBin = (n: number) => n.toString(2).padStart(8, '0');

  const flipBit = (byteIdx: number, bitIdx: number) => {
    const newCipher = [...modifiedCipher];
    newCipher[byteIdx] ^= (1 << (7 - bitIdx));
    setModifiedCipher(newCipher);
    const key = `${byteIdx},${bitIdx}`;
    const newFlipped = new Set(flippedBits);
    if (newFlipped.has(key)) newFlipped.delete(key); else newFlipped.add(key);
    setFlippedBits(newFlipped);
  };

  const isModified = (byteIdx: number) => cipherBytes[byteIdx] !== modifiedCipher[byteIdx];

  // Preset: Flip bits to change $100 → $900
  const presetAttack = () => {
    // '$100' → '$900': change '1' (0x31) to '9' (0x39) → XOR diff is 0x08 = bit 4
    const newCipher = [...cipherBytes];
    const targetIdx = originalMsg.indexOf('1');
    if (targetIdx >= 0) {
      // '1' = 0x31, '9' = 0x39, diff = 0x08
      newCipher[targetIdx] ^= 0x08;
    }
    setModifiedCipher(newCipher);
    setFlippedBits(new Set([`${targetIdx},4`]));
  };

  const reset = () => {
    setModifiedCipher([...cipherBytes]);
    setFlippedBits(new Set());
  };

  return (
    <Card title="Attack: Bit-Flipping (Malleability)">
      <p className="text-xs text-gray-500 mb-3">
        An attacker can't see the key, but flipping a bit in the ciphertext flips the <strong>same bit</strong> in the plaintext.
        Stream ciphers provide confidentiality, but <span className="text-red-400">not integrity</span>.
      </p>

      {/* Original message */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Original Message</div>
        <div className="font-mono text-sm text-green-400 bg-green-900/20 border border-green-700/50 rounded-lg px-3 py-2">
          {originalMsg}
        </div>
      </div>

      {/* Ciphertext (binary, clickable) */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Ciphertext (click any bit to flip)</div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {modifiedCipher.map((byte, bi) => (
              <div key={bi} className="flex flex-col items-center">
                <div className="text-[9px] text-gray-600 mb-0.5">{originalMsg[bi]}</div>
                <div className="flex gap-px">
                  {toBin(byte).split('').map((bit, bitIdx) => (
                    <button
                      key={bitIdx}
                      onClick={() => flipBit(bi, bitIdx)}
                      className={`w-4 h-5 text-[10px] font-mono rounded-sm border transition-all ${
                        flippedBits.has(`${bi},${bitIdx}`)
                          ? 'bg-red-600 border-red-400 text-white scale-110'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {bit}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={presetAttack}
          className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 rounded-lg">
          💰 Preset: $100 → $900
        </button>
        <button onClick={reset} className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">Reset</button>
      </div>

      {/* Decrypted result */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Decrypted Message (by recipient)</div>
        <div className="font-mono text-sm bg-gray-900 rounded-lg px-3 py-2">
          {Array.from(decrypted).map((ch, i) => (
            <span key={i} className={isModified(i) ? 'text-red-400 font-bold' : 'text-green-400'}>
              {ch}
            </span>
          ))}
        </div>
      </div>

      {decrypted !== originalMsg && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-xs text-red-400">
          ⚠ Message was altered from "{originalMsg}" to "{decrypted}" without breaking the encryption!
          <br />
          <span className="text-gray-500 mt-1 block">
            → This is why authenticated encryption (AES-GCM, ChaCha20-Poly1305) adds a MAC for integrity.
          </span>
        </div>
      )}
    </Card>
  );
}
