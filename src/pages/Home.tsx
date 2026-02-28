import { Link } from 'react-router-dom';
import { ScrollySection } from '../components/Shared';

const sections = [
  {
    path: '/caesar',
    title: 'Historic Ciphers & Modular Arithmetic',
    desc: 'Caesar cipher, frequency analysis, and modular arithmetic visualized on a clock.',
    icon: '🔤',
    color: 'from-amber-500 to-orange-600',
  },
  {
    path: '/stream',
    title: 'Stream Ciphers & Randomness',
    desc: 'XOR operations, LFSR feedback shifts, and ChaCha20 quarter-round state updates.',
    icon: '🌊',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    path: '/block',
    title: 'Block Ciphers (DES & AES)',
    desc: 'Feistel networks, SubBytes S-Box, ShiftRows, MixColumns, and full key schedule.',
    icon: '🧱',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    path: '/modes',
    title: 'Modes of Operation',
    desc: 'ECB vs CBC bitmap rendering, error propagation, and why patterns matter.',
    icon: '🔲',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    path: '/number-theory',
    title: 'Number Theory (RSA & DH)',
    desc: 'Euclidean algorithm, Diffie-Hellman color mixing, and small-scale RSA calculator.',
    icon: '🔢',
    color: 'from-purple-500 to-pink-600',
  },
  {
    path: '/ecc',
    title: 'Elliptic Curves (ECC)',
    desc: 'Curve plotting, interactive point addition/doubling, and scalar multiplication.',
    icon: '📈',
    color: 'from-green-500 to-emerald-600',
  },
  {
    path: '/hashing',
    title: 'Hashing (SHA-256)',
    desc: 'Avalanche effect comparator, diff highlighter, and compression function diagram.',
    icon: '#️⃣',
    color: 'from-red-500 to-rose-600',
  },
  {
    path: '/protocols',
    title: 'Protocols (TLS & Signatures)',
    desc: 'TLS handshake sequence diagram and digital signature verification flow.',
    icon: '🤝',
    color: 'from-teal-500 to-cyan-600',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="text-center py-12 lg:py-20">
        <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Interactive Cryptography
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
          Visualize, interact with, and understand every major cryptographic algorithm — from ancient ciphers to modern protocols.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/caesar"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Start Exploring →
          </Link>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {sections.map((s, i) => (
          <ScrollySection key={s.path} id={`section-${i}`}>
            <Link to={s.path} className="block group">
              <div className="bg-crypto-card border border-crypto-border rounded-xl p-5 hover:border-gray-600 transition-all group-hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-lg shrink-0`}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">{s.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          </ScrollySection>
        ))}
      </div>
    </div>
  );
}
