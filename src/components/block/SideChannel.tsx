import { useState, useRef, useCallback } from 'react';
import { Card } from '../Shared';

/* ─── Timing Attack Simulator ─── */
export function TimingAttackSim() {
  const SECRET = 'A3F5'; // 4 hex chars
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<Array<{ guess: string; time: number; matchLen: number }>>([]);
  const [running, setRunning] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const BASE_TIME = 50;   // base μs
  const PER_BYTE = 120;   // extra μs per matching byte

  const naiveCompare = useCallback((input: string): { match: boolean; time: number; matchLen: number } => {
    let matchLen = 0;
    for (let i = 0; i < SECRET.length; i++) {
      if (i >= input.length || input[i].toUpperCase() !== SECRET[i]) {
        return { match: false, time: BASE_TIME + matchLen * PER_BYTE, matchLen };
      }
      matchLen++;
    }
    return { match: input.length === SECRET.length, time: BASE_TIME + matchLen * PER_BYTE, matchLen };
  }, []);

  const tryGuess = () => {
    if (!guess) return;
    const result = naiveCompare(guess);
    setAttempts(prev => [...prev, { guess: guess.toUpperCase(), time: result.time, matchLen: result.matchLen }]);
    setGuess('');
  };

  // Auto-attack: try all hex chars for each position
  const autoAttack = async () => {
    setRunning(true);
    setAttempts([]);
    const HEX = '0123456789ABCDEF';
    let found = '';

    for (let pos = 0; pos < SECRET.length; pos++) {
      let bestChar = '0';
      let bestTime = 0;
      const posAttempts: Array<{ guess: string; time: number; matchLen: number }> = [];

      for (const ch of HEX) {
        const testGuess = found + ch + '0'.repeat(SECRET.length - pos - 1);
        const result = naiveCompare(testGuess);
        posAttempts.push({ guess: testGuess, time: result.time, matchLen: result.matchLen });
        if (result.time > bestTime) {
          bestTime = result.time;
          bestChar = ch;
        }
      }

      setAttempts(prev => [...prev, ...posAttempts]);
      found += bestChar;

      // Visual delay
      await new Promise(r => setTimeout(r, 300));
    }

    setRunning(false);
  };

  const maxTime = Math.max(BASE_TIME, ...attempts.map(a => a.time));

  return (
    <Card title="Timing Attack Simulator">
      <p className="text-xs text-gray-500 mb-3">
        A <strong>naive</strong> comparison function returns <em>early</em> on the first mismatched byte.
        An attacker measures response time: longer = more bytes matched. This leaks the secret byte-by-byte.
      </p>

      <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-xl mb-4 text-xs font-mono">
        <span className="text-gray-500">// Vulnerable comparison (DO NOT use for secrets!)</span>
        <br />
        <span className="text-purple-400">function</span> <span className="text-blue-400">compare</span>(<span className="text-yellow-300">a</span>, <span className="text-yellow-300">b</span>) {'{'}<br />
        <span className="ml-4 text-purple-400">for</span> (<span className="text-purple-400">let</span> i = 0; i &lt; a.length; i++) {'{'}<br />
        <span className="ml-8 text-purple-400">if</span> (a[i] !== b[i]) <span className="text-red-400">return false</span>; <span className="text-gray-600">// ← early exit leaks info!</span><br />
        <span className="ml-4">{'}'}</span><br />
        <span className="ml-4 text-green-400">return true</span>;<br />
        {'}'}
      </div>

      {/* Manual guess */}
      <div className="flex gap-2 mb-4">
        <input
          value={guess}
          onChange={e => setGuess(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 4))}
          placeholder="Hex guess (e.g. A3F5)"
          className="flex-1 max-w-xs px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
          maxLength={4}
          onKeyDown={e => e.key === 'Enter' && tryGuess()}
        />
        <button onClick={tryGuess} disabled={!guess}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg">
          Try
        </button>
        <button onClick={autoAttack} disabled={running}
          className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-lg">
          {running ? '⏳ Running…' : '🔓 Auto-Attack'}
        </button>
        <button onClick={() => setAttempts([])}
          className="px-3 py-1.5 text-xs bg-gray-700 rounded-lg">
          Clear
        </button>
      </div>

      {/* Secret (hidden until revealed) */}
      <div className="mb-4 text-xs">
        <span className="text-gray-500">Secret: </span>
        <span className="font-mono text-gray-600 select-none" title="Try to discover it!">
          {attempts.some(a => a.matchLen === SECRET.length) ? (
            <span className="text-green-400">{SECRET}</span>
          ) : (
            '****'
          )}
        </span>
      </div>

      {/* Timeline bars */}
      {attempts.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          <div className="flex items-center gap-2 text-[9px] text-gray-600 sticky top-0 bg-crypto-card pb-1">
            <span className="w-16">Guess</span>
            <span className="flex-1">Response Time</span>
            <span className="w-12 text-right">μs</span>
          </div>
          {attempts.map((a, i) => {
            const barWidth = (a.time / maxTime) * 100;
            const isLong = a.matchLen > 0;
            const isMatch = a.matchLen === SECRET.length;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-16 font-mono text-[10px] ${isMatch ? 'text-green-400' : 'text-gray-400'}`}>
                  {a.guess}
                </span>
                <div className="flex-1 h-4 bg-gray-800 rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ${
                      isMatch
                        ? 'bg-green-500'
                        : isLong
                        ? 'bg-yellow-600'
                        : 'bg-gray-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`w-12 text-right text-[10px] font-mono ${
                  isLong ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  {a.time}μs
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Lesson */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-xl text-xs text-blue-400">
        <strong>Lesson:</strong> Constant-time comparison (e.g., <code>crypto.timingSafeEqual</code>)
        always processes <em>every</em> byte, making all response times identical regardless of match length.
      </div>
    </Card>
  );
}
