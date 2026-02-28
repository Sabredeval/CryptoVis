import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCryptoStore } from '../store/cryptoStore';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/caesar', label: 'Historic Ciphers', icon: '🔤' },
  { path: '/stream', label: 'Stream Ciphers', icon: '🌊' },
  { path: '/block', label: 'Block Ciphers', icon: '🧱' },
  { path: '/modes', label: 'Modes of Operation', icon: '🔲' },
  { path: '/number-theory', label: 'Number Theory', icon: '🔢' },
  { path: '/ecc', label: 'Elliptic Curves', icon: '📈' },
  { path: '/hashing', label: 'Hashing', icon: '#️⃣' },
  { path: '/protocols', label: 'Protocols', icon: '🤝' },
];

export default function Layout() {
  const { animationSpeed, setAnimationSpeed } = useCryptoStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-crypto-card border-r border-crypto-border flex flex-col z-50 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-crypto-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              CV
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CryptoViz
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${
                location.pathname === item.path
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-crypto-border">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
            Animation Speed
          </label>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>{animationSpeed}x</span>
            <span>Fast</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-crypto-bg/80 backdrop-blur border-b border-crypto-border p-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="font-semibold text-sm">CryptoViz</span>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
