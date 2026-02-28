import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { PageHeader, Card, ScrollySection } from '../components/Shared';

/* ─── Simple block cipher (XOR with key) for demo ─── */
function xorEncryptBlock(block: number[], key: number[]): number[] {
  return block.map((b, i) => b ^ key[i % key.length]);
}

/* ─── ECB vs CBC ─── */
function EcbCbcRenderer() {
  const canvasEcbRef = useRef<HTMLCanvasElement>(null);
  const canvasCbcRef = useRef<HTMLCanvasElement>(null);
  const canvasOrigRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  const processImage = useCallback((img: HTMLImageElement) => {
    const w = Math.min(img.width, 256);
    const h = Math.min(img.height, 256);
    
    // Draw original
    const origCtx = canvasOrigRef.current?.getContext('2d');
    if (origCtx && canvasOrigRef.current) {
      canvasOrigRef.current.width = w;
      canvasOrigRef.current.height = h;
      origCtx.drawImage(img, 0, 0, w, h);
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(img, 0, 0, w, h);
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    const key = [0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0, 0x11, 0x22, 0x33, 0x44, 0x55];
    const blockSize = 16;

    // ECB mode
    const ecbData = new Uint8ClampedArray(pixels);
    for (let i = 0; i < ecbData.length; i += blockSize) {
      const block = Array.from(ecbData.slice(i, i + blockSize));
      const enc = xorEncryptBlock(block, key);
      for (let j = 0; j < enc.length; j++) {
        if (i + j < ecbData.length) ecbData[i + j] = enc[j];
      }
    }
    // Keep alpha
    for (let i = 3; i < ecbData.length; i += 4) ecbData[i] = 255;

    const ecbCtx = canvasEcbRef.current?.getContext('2d');
    if (ecbCtx && canvasEcbRef.current) {
      canvasEcbRef.current.width = w;
      canvasEcbRef.current.height = h;
      ecbCtx.putImageData(new ImageData(ecbData, w, h), 0, 0);
    }

    // CBC mode
    const cbcData = new Uint8ClampedArray(pixels);
    let prevBlock = new Array(blockSize).fill(0x42); // IV
    for (let i = 0; i < cbcData.length; i += blockSize) {
      const block = Array.from(cbcData.slice(i, i + blockSize));
      const xored = block.map((b, j) => b ^ prevBlock[j]);
      const enc = xorEncryptBlock(xored, key);
      for (let j = 0; j < enc.length; j++) {
        if (i + j < cbcData.length) cbcData[i + j] = enc[j];
      }
      prevBlock = enc;
    }
    for (let i = 3; i < cbcData.length; i += 4) cbcData[i] = 255;

    const cbcCtx = canvasCbcRef.current?.getContext('2d');
    if (cbcCtx && canvasCbcRef.current) {
      canvasCbcRef.current.width = w;
      canvasCbcRef.current.height = h;
      cbcCtx.putImageData(new ImageData(cbcData, w, h), 0, 0);
    }

    setLoaded(true);
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  // Load default pattern
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    // Draw a recognizable pattern (checkerboard with circles)
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const checker = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0);
        ctx.fillStyle = checker ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0, Math.PI * 2);
    ctx.fill();

    const img = new Image();
    img.onload = () => processImage(img);
    img.src = canvas.toDataURL();
  }, [processImage]);

  return (
    <Card title="ECB vs CBC Mode – Bitmap Visualization">
      <div className="mb-4">
        <label className="text-xs text-gray-500 block mb-1">Upload an image (or use default pattern)</label>
        <input type="file" accept="image/*" onChange={handleFile} className="text-sm text-gray-400" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">Original</div>
          <canvas ref={canvasOrigRef} className="border border-gray-600 rounded-lg mx-auto" style={{ imageRendering: 'pixelated' }} />
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">ECB Mode (patterns visible!)</div>
          <canvas ref={canvasEcbRef} className="border border-red-600/50 rounded-lg mx-auto" style={{ imageRendering: 'pixelated' }} />
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">CBC Mode (looks random)</div>
          <canvas ref={canvasCbcRef} className="border border-green-600/50 rounded-lg mx-auto" style={{ imageRendering: 'pixelated' }} />
        </div>
      </div>
      {loaded && (
        <p className="text-xs text-gray-500 mt-3">
          Notice how ECB preserves patterns from the original image, while CBC produces noise-like output.
        </p>
      )}
    </Card>
  );
}

/* ─── Error Propagation ─── */
function ErrorPropagation() {
  const blockCount = 6;
  const bitsPerBlock = 8;
  const [cipherBlocks, setCipherBlocks] = useState<number[][]>(
    Array.from({ length: blockCount }, () => Array.from({ length: bitsPerBlock }, () => Math.round(Math.random())))
  );
  const [flippedBit, setFlippedBit] = useState<{ block: number; bit: number } | null>(null);
  const [mode, setMode] = useState<'ecb' | 'cbc' | 'cfb'>('cbc');

  const affectedBlocks = useMemo(() => {
    if (!flippedBit) return new Set<number>();
    const affected = new Set<number>();
    affected.add(flippedBit.block);
    if (mode === 'cbc') {
      affected.add(flippedBit.block + 1); // error propagates to next block
    } else if (mode === 'cfb') {
      for (let i = flippedBit.block; i < blockCount; i++) affected.add(i);
    }
    return affected;
  }, [flippedBit, mode]);

  const flipBit = (blockIdx: number, bitIdx: number) => {
    const newBlocks = cipherBlocks.map(b => [...b]);
    newBlocks[blockIdx][bitIdx] ^= 1;
    setCipherBlocks(newBlocks);
    setFlippedBit({ block: blockIdx, bit: bitIdx });
  };

  return (
    <Card title="Error Propagation Interactive">
      <p className="text-xs text-gray-500 mb-3">Click any ciphertext bit to flip it and see which plaintext blocks are affected.</p>
      <div className="flex gap-2 mb-4">
        {(['ecb', 'cbc', 'cfb'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setFlippedBit(null); }}
            className={`px-3 py-1 text-xs rounded-lg uppercase ${mode === m ? 'bg-blue-600' : 'bg-gray-700'}`}>
            {m}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-500">Ciphertext Blocks (click to flip a bit):</div>
        <div className="flex flex-wrap gap-3">
          {cipherBlocks.map((block, bi) => (
            <div key={bi} className="flex flex-col items-center gap-1">
              <div className="text-[10px] text-gray-500">Block {bi}</div>
              <div className="flex gap-px">
                {block.map((bit, bitIdx) => (
                  <button
                    key={bitIdx}
                    onClick={() => flipBit(bi, bitIdx)}
                    className={`w-6 h-6 text-xs font-mono rounded border transition-all ${
                      flippedBit?.block === bi && flippedBit?.bit === bitIdx
                        ? 'bg-red-600 border-red-400 text-white scale-110'
                        : bit ? 'bg-blue-900/50 border-blue-600 text-blue-300'
                        : 'bg-gray-800 border-gray-600 text-gray-400'
                    }`}
                  >
                    {bit}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">Affected Plaintext Blocks:</div>
        <div className="flex flex-wrap gap-3">
          {cipherBlocks.map((_, bi) => (
            <div
              key={bi}
              className={`w-16 h-10 rounded-lg border flex items-center justify-center text-xs transition-all ${
                affectedBlocks.has(bi)
                  ? 'bg-red-900/50 border-red-500 text-red-300 glow-blue'
                  : 'bg-gray-800 border-gray-600 text-gray-500'
              }`}
            >
              {affectedBlocks.has(bi) ? '⚠ Corrupted' : `P${bi}`}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function ModesOfOperation() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="🔲"
        title="Modes of Operation"
        description="See why ECB mode is insecure, how CBC chains blocks together, and how errors propagate."
      />
      <ScrollySection id="ecb-cbc">
        <EcbCbcRenderer />
      </ScrollySection>
      <ScrollySection id="error-prop">
        <ErrorPropagation />
      </ScrollySection>
    </div>
  );
}
