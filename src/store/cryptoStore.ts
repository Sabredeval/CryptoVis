import { create } from 'zustand';

interface CryptoStore {
  // Global controls
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isAutoPlaying: boolean;
  setAutoPlaying: (v: boolean) => void;

  // Caesar cipher
  caesarShift: number;
  setCaesarShift: (k: number) => void;
  caesarInput: string;
  setCaesarInput: (s: string) => void;

  // AES state
  aesState: number[][];
  setAesState: (s: number[][]) => void;
  aesStep: number;
  setAesStep: (n: number) => void;

  // DES state
  desStep: number;
  setDesStep: (n: number) => void;

  // Hash
  hashInput1: string;
  setHashInput1: (s: string) => void;
  hashInput2: string;
  setHashInput2: (s: string) => void;

  // RSA
  rsaP: number;
  rsaQ: number;
  setRsaP: (n: number) => void;
  setRsaQ: (n: number) => void;
  rsaMessage: number;
  setRsaMessage: (n: number) => void;

  // ECC
  eccA: number;
  eccB: number;
  setEccA: (n: number) => void;
  setEccB: (n: number) => void;

  // ChaCha20
  chachaStep: number;
  setChachaStep: (n: number) => void;

  // TLS
  tlsStep: number;
  setTlsStep: (n: number) => void;

  // Modes
  modeStep: number;
  setModeStep: (n: number) => void;
}

export const useCryptoStore = create<CryptoStore>((set) => ({
  animationSpeed: 1,
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  isAutoPlaying: false,
  setAutoPlaying: (v) => set({ isAutoPlaying: v }),

  caesarShift: 3,
  setCaesarShift: (k) => set({ caesarShift: k }),
  caesarInput: 'HELLO WORLD',
  setCaesarInput: (s) => set({ caesarInput: s }),

  aesState: Array(4).fill(null).map(() => Array(4).fill(0)),
  setAesState: (s) => set({ aesState: s }),
  aesStep: 0,
  setAesStep: (n) => set({ aesStep: n }),

  desStep: 0,
  setDesStep: (n) => set({ desStep: n }),

  hashInput1: 'Hello',
  setHashInput1: (s) => set({ hashInput1: s }),
  hashInput2: 'hello',
  setHashInput2: (s) => set({ hashInput2: s }),

  rsaP: 3,
  rsaQ: 11,
  setRsaP: (n) => set({ rsaP: n }),
  setRsaQ: (n) => set({ rsaQ: n }),
  rsaMessage: 7,
  setRsaMessage: (n) => set({ rsaMessage: n }),

  eccA: -1,
  eccB: 1,
  setEccA: (n) => set({ eccA: n }),
  setEccB: (n) => set({ eccB: n }),

  chachaStep: 0,
  setChachaStep: (n) => set({ chachaStep: n }),

  tlsStep: 0,
  setTlsStep: (n) => set({ tlsStep: n }),

  modeStep: 0,
  setModeStep: (n) => set({ modeStep: n }),
}));
