import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../Shared';

/* ─── Synchronous Stream Cipher Model ─── */
export function SynchronousStreamModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const plaintext = 'HELLO CRYPTO';
  const W = 700;
  const H = 240;

  const keyBytes = useMemo(() => {
    const k = new Uint8Array(plaintext.length);
    for (let i = 0; i < k.length; i++) k[i] = ((i * 37 + 13) & 0xff);
    return Array.from(k);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const tapeY = { plain: 40, key: 120, cipher: 200 };
    const cellW = 44;
    const startX = 60;
    const xorX = startX + step * cellW + cellW / 2;

    // Labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Plaintext', startX - 10, tapeY.plain + 14);
    ctx.fillText('Keystream', startX - 10, tapeY.key + 14);
    ctx.fillText('Ciphertext', startX - 10, tapeY.cipher + 14);

    // Draw tapes
    for (let i = 0; i < plaintext.length; i++) {
      const x = startX + i * cellW;
      const isActive = i === step;
      const isProcessed = i < step;

      // Plaintext tape
      ctx.fillStyle = isActive ? '#2563eb' : isProcessed ? '#1e3a5f' : '#1f2937';
      ctx.strokeStyle = isActive ? '#3b82f6' : '#374151';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.fillRect(x, tapeY.plain, cellW - 2, 24);
      ctx.strokeRect(x, tapeY.plain, cellW - 2, 24);
      ctx.fillStyle = isActive ? '#fff' : isProcessed ? '#60a5fa' : '#9ca3af';
      ctx.font = isActive ? 'bold 13px monospace' : '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(plaintext[i], x + cellW / 2 - 1, tapeY.plain + 16);

      // Keystream tape
      const keyHex = keyBytes[i].toString(16).padStart(2, '0').toUpperCase();
      ctx.fillStyle = isActive ? '#7c3aed' : isProcessed ? '#3b1d6e' : '#1f2937';
      ctx.strokeStyle = isActive ? '#8b5cf6' : '#374151';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.fillRect(x, tapeY.key, cellW - 2, 24);
      ctx.strokeRect(x, tapeY.key, cellW - 2, 24);
      ctx.fillStyle = isActive ? '#fff' : isProcessed ? '#a78bfa' : '#6b7280';
      ctx.font = isActive ? 'bold 11px monospace' : '10px monospace';
      ctx.fillText(keyHex, x + cellW / 2 - 1, tapeY.key + 16);

      // Ciphertext tape
      if (i < step) {
        const cByte = plaintext.charCodeAt(i) ^ keyBytes[i];
        const cHex = cByte.toString(16).padStart(2, '0').toUpperCase();
        ctx.fillStyle = '#1e3a5f';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.fillRect(x, tapeY.cipher, cellW - 2, 24);
        ctx.strokeRect(x, tapeY.cipher, cellW - 2, 24);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '11px monospace';
        ctx.fillText(cHex, x + cellW / 2 - 1, tapeY.cipher + 16);
      } else if (i === step) {
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillRect(x, tapeY.cipher, cellW - 2, 24);
        ctx.strokeRect(x, tapeY.cipher, cellW - 2, 24);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        const cByte = plaintext.charCodeAt(i) ^ keyBytes[i];
        ctx.fillText(cByte.toString(16).padStart(2, '0').toUpperCase(), x + cellW / 2 - 1, tapeY.cipher + 16);
      } else {
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.fillRect(x, tapeY.cipher, cellW - 2, 24);
        ctx.strokeRect(x, tapeY.cipher, cellW - 2, 24);
        ctx.fillStyle = '#374151';
        ctx.fillText('??', x + cellW / 2 - 1, tapeY.cipher + 16);
      }
    }

    // XOR head arrows
    if (step < plaintext.length) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      // Plain → XOR
      ctx.beginPath();
      ctx.moveTo(xorX, tapeY.plain + 24);
      ctx.lineTo(xorX, tapeY.key - 12);
      ctx.stroke();
      // Key → XOR
      ctx.beginPath();
      ctx.moveTo(xorX, tapeY.key + 24);
      ctx.lineTo(xorX, tapeY.cipher - 12);
      ctx.stroke();
      ctx.setLineDash([]);

      // XOR symbol
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⊕', xorX, tapeY.key - 2);
      ctx.fillText('↓', xorX, tapeY.cipher - 2);
    }
  }, [step, keyBytes]);

  useEffect(() => { draw(); }, [draw]);

  const advance = () => setStep((s) => Math.min(s + 1, plaintext.length));
  const resetSteps = () => setStep(0);

  return (
    <Card title="Synchronous Stream Cipher Model">
      <p className="text-xs text-gray-500 mb-3">
        Two parallel tapes — <span className="text-blue-400">plaintext</span> and
        <span className="text-purple-400 ml-1">keystream</span> — pass through a central
        <span className="text-yellow-400 ml-1">⊕ XOR head</span> producing ciphertext byte-by-byte.
      </p>
      <canvas ref={canvasRef} className="w-full max-w-[700px] rounded-lg border border-gray-700 mb-3" />
      <div className="flex gap-2">
        <button onClick={advance} disabled={step >= plaintext.length}
          className="px-3 py-1.5 text-xs bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded-lg">
          ▶ Step ({step}/{plaintext.length})
        </button>
        <button onClick={resetSteps} className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">Reset</button>
      </div>
    </Card>
  );
}

/* ─── Resynchronization Failure ─── */
export function ResyncFailure() {
  const originalMsg = 'STREAM CIPHERS NEED SYNC';
  const keyBytes = useMemo(() => {
    const k: number[] = [];
    for (let i = 0; i < originalMsg.length; i++) k.push(((i * 53 + 17) & 0x7f) | 0x20);
    return k;
  }, []);

  const cipherBytes = useMemo(() =>
    Array.from(originalMsg).map((c, i) => c.charCodeAt(0) ^ keyBytes[i]),
    [keyBytes]
  );

  const [deletedIndex, setDeletedIndex] = useState<number | null>(null);
  const [modifiedCipher, setModifiedCipher] = useState<number[]>(cipherBytes);

  const deleteBit = (idx: number) => {
    const newCipher = [...cipherBytes];
    newCipher.splice(idx, 1); // remove one byte
    setModifiedCipher(newCipher);
    setDeletedIndex(idx);
  };

  const reset = () => {
    setModifiedCipher([...cipherBytes]);
    setDeletedIndex(null);
  };

  // Decrypt: key still applied at original positions, but cipher has shifted
  const decrypted = useMemo(() => {
    return modifiedCipher.map((b, i) => {
      const ch = b ^ keyBytes[i];
      // Keep printable
      if (ch >= 32 && ch < 127) return String.fromCharCode(ch);
      return '·';
    });
  }, [modifiedCipher, keyBytes]);

  return (
    <Card title='Resynchronization Failure'>
      <p className="text-xs text-gray-500 mb-3">
        In a <strong>synchronous</strong> stream cipher, the keystream position must stay perfectly aligned.
        If even <span className="text-red-400">one byte is dropped</span> in transit, <em>every subsequent byte</em> decrypts incorrectly.
      </p>

      {/* Original message */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Original Message</div>
        <div className="flex flex-wrap gap-0.5 font-mono text-sm">
          {originalMsg.split('').map((ch, i) => (
            <span key={i} className="w-6 h-7 flex items-center justify-center bg-green-900/30 border border-green-700/40 rounded text-green-400 text-xs">
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* Ciphertext — clickable to delete */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">
          Ciphertext (click a byte to <span className="text-red-400">drop</span> it in transit)
        </div>
        {deletedIndex === null ? (
          <div className="flex flex-wrap gap-0.5 font-mono text-xs">
            {cipherBytes.map((b, i) => (
              <button key={i} onClick={() => deleteBit(i)}
                className="w-6 h-7 flex items-center justify-center bg-gray-800 border border-gray-600 rounded hover:border-red-500 hover:bg-red-900/30 text-gray-400 transition-all"
                title={`Click to drop byte ${i}`}>
                {b.toString(16).padStart(2, '0').toUpperCase()}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-0.5 font-mono text-xs">
            {modifiedCipher.map((b, i) => (
              <span key={i} className={`w-6 h-7 flex items-center justify-center rounded text-xs ${
                i >= deletedIndex
                  ? 'bg-red-900/30 border border-red-700/60 text-red-400'
                  : 'bg-gray-800 border border-gray-600 text-gray-400'
              }`}>
                {b.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            ))}
            <span className="w-6 h-7 flex items-center justify-center rounded text-xs bg-red-900/40 border-2 border-red-500 text-red-300 font-bold">
              ✕
            </span>
          </div>
        )}
      </div>

      {/* Decrypted output */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Decrypted Output (applying same keystream positions)</div>
        <div className="flex flex-wrap gap-0.5 font-mono text-sm">
          {decrypted.map((ch, i) => {
            const isWrong = deletedIndex !== null && i >= deletedIndex;
            return (
              <span key={i} className={`w-6 h-7 flex items-center justify-center rounded text-xs ${
                isWrong
                  ? 'bg-red-900/40 border border-red-600 text-red-400 font-bold'
                  : 'bg-green-900/30 border border-green-700/40 text-green-400'
              }`}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      {deletedIndex !== null && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-xs text-red-400 mb-3">
          ⚠ Byte {deletedIndex} was dropped! All bytes from position {deletedIndex} onward are XOR'd with the <em>wrong</em> keystream byte.
          <br />
          <span className="text-gray-500">
            {decrypted.filter((_, i) => i >= deletedIndex).length} of {originalMsg.length} characters corrupted.
            Self-synchronizing stream ciphers (e.g., CFB mode) can recover, but synchronous ones (ChaCha20, RC4) cannot.
          </span>
        </div>
      )}

      <button onClick={reset} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg">Reset</button>
    </Card>
  );
}
