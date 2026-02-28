import { useState } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { PageHeader, Card, StepControls, ScrollySection } from '../components/Shared';

/* ─── TLS Handshake ─── */
function TlsHandshake() {
  const { tlsStep, setTlsStep } = useCryptoStore();

  const steps = [
    {
      label: 'Client Hello',
      from: 'client',
      desc: 'Client sends supported TLS versions, cipher suites, and a random number.',
      color: '#3b82f6',
    },
    {
      label: 'Server Hello',
      from: 'server',
      desc: 'Server selects TLS version, cipher suite, and sends its random number.',
      color: '#10b981',
    },
    {
      label: 'Certificate',
      from: 'server',
      desc: 'Server sends its X.509 certificate containing the public key.',
      color: '#10b981',
    },
    {
      label: 'Key Exchange',
      from: 'server',
      desc: 'Server sends key exchange parameters (e.g., ECDHE public key).',
      color: '#10b981',
    },
    {
      label: 'Server Hello Done',
      from: 'server',
      desc: 'Server signals it has finished the Hello phase.',
      color: '#10b981',
    },
    {
      label: 'Client Key Exchange',
      from: 'client',
      desc: 'Client sends its key exchange parameters (e.g., ECDHE public key).',
      color: '#3b82f6',
    },
    {
      label: 'Change Cipher Spec',
      from: 'client',
      desc: 'Client signals it will now use the negotiated keys for encryption.',
      color: '#3b82f6',
    },
    {
      label: 'Finished (Client)',
      from: 'client',
      desc: 'Client sends encrypted verification message with all handshake data.',
      color: '#3b82f6',
    },
    {
      label: 'Change Cipher Spec',
      from: 'server',
      desc: 'Server signals it will now use the negotiated keys for encryption.',
      color: '#10b981',
    },
    {
      label: 'Finished (Server)',
      from: 'server',
      desc: 'Server sends encrypted verification. Handshake complete!',
      color: '#10b981',
    },
  ];

  return (
    <Card title="TLS 1.2 Handshake">
      <StepControls
        currentStep={tlsStep}
        totalSteps={steps.length}
        onStepChange={setTlsStep}
        labels={steps.map(s => s.label)}
      />
      <div className="mt-6 relative">
        {/* Timeline */}
        <div className="flex justify-between mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-900/40 border-2 border-blue-500 rounded-xl flex items-center justify-center text-2xl">
              💻
            </div>
            <div className="text-xs text-blue-400 mt-1 font-semibold">Client</div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-px bg-gray-700 w-full" />
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-900/40 border-2 border-green-500 rounded-xl flex items-center justify-center text-2xl">
              🖥️
            </div>
            <div className="text-xs text-green-400 mt-1 font-semibold">Server</div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {steps.map((step, i) => {
            const isActive = i <= tlsStep;
            const isCurrent = i === tlsStep;
            const isClient = step.from === 'client';

            return (
              <div
                key={i}
                className={`flex items-center gap-2 transition-all duration-500 ${
                  isActive ? 'opacity-100' : 'opacity-15'
                }`}
              >
                {/* Client side */}
                <div className="w-16 flex justify-center">
                  {isClient && isCurrent && (
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-1 relative">
                  <div className={`flex items-center ${isClient ? '' : 'flex-row-reverse'}`}>
                    <div className={`flex-1 h-px ${isCurrent ? 'bg-yellow-400' : isActive ? 'bg-gray-500' : 'bg-gray-800'}`} />
                    <div className={`text-xs mx-2 px-2 py-1 rounded-lg whitespace-nowrap font-mono ${
                      isCurrent
                        ? 'bg-yellow-900/40 border border-yellow-600 text-yellow-300'
                        : isActive
                        ? 'bg-gray-800 text-gray-400'
                        : 'text-gray-700'
                    }`}>
                      {isClient ? '→' : '←'} {step.label}
                    </div>
                    <div className={`flex-1 h-px ${isCurrent ? 'bg-yellow-400' : isActive ? 'bg-gray-500' : 'bg-gray-800'}`} />
                  </div>
                </div>

                {/* Server side */}
                <div className="w-16 flex justify-center">
                  {!isClient && isCurrent && (
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current step description */}
        <div className="mt-4 p-3 bg-gray-900 rounded-xl text-sm text-gray-400">
          <span className="text-yellow-400 font-semibold">{steps[tlsStep].label}:</span>{' '}
          {steps[tlsStep].desc}
        </div>
      </div>
    </Card>
  );
}

/* ─── Digital Signature ─── */
function DigitalSignature() {
  const [signStep, setSignStep] = useState(0);

  const steps = [
    {
      label: 'Hash Document',
      icon: '📄',
      desc: 'The document is hashed using SHA-256 to produce a fixed-size digest.',
      visual: { from: 'Document', to: 'Hash(Doc)', color: '#3b82f6' },
    },
    {
      label: 'Sign with Private Key',
      icon: '🔐',
      desc: 'The hash is encrypted/signed using the signer\'s private key to produce the digital signature.',
      visual: { from: 'Hash(Doc)', to: 'Signature', color: '#8b5cf6' },
    },
    {
      label: 'Verify with Public Key',
      icon: '🔓',
      desc: 'The recipient decrypts the signature with the signer\'s public key and compares it to their own hash of the document.',
      visual: { from: 'Signature', to: 'Verified ✓', color: '#10b981' },
    },
  ];

  return (
    <Card title="Digital Signature Flow">
      <StepControls
        currentStep={signStep}
        totalSteps={steps.length}
        onStepChange={setSignStep}
        labels={steps.map(s => s.label)}
      />
      <div className="mt-6">
        {/* Visual flow */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-500 min-w-[140px] ${
                  i <= signStep
                    ? i === signStep
                      ? 'border-yellow-500 bg-yellow-900/20 scale-105'
                      : 'border-gray-500 bg-gray-800'
                    : 'border-gray-700 bg-gray-900 opacity-30'
                }`}
              >
                <span className="text-3xl">{step.icon}</span>
                <span className="text-xs font-semibold text-center">{step.label}</span>
                <span className="text-[10px] text-gray-500 text-center">{step.visual.from} → {step.visual.to}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`text-2xl transition-all ${i < signStep ? 'text-green-400' : 'text-gray-700'}`}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mt-6 p-3 bg-gray-900 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{steps[signStep].icon}</span>
            <span className="text-sm font-semibold text-yellow-400">{steps[signStep].label}</span>
          </div>
          <p className="text-sm text-gray-400">{steps[signStep].desc}</p>
        </div>

        {/* Detailed diagram */}
        <div className="mt-4 bg-gray-900 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-3">Detailed Flow:</div>
          <svg viewBox="0 0 600 180" className="w-full max-w-xl mx-auto">
            {/* Document */}
            <rect x="20" y="60" width="80" height="60" rx="8" fill={signStep >= 0 ? '#1e3a5f' : '#1f2937'} stroke={signStep >= 0 ? '#3b82f6' : '#374151'} strokeWidth="2" />
            <text x="60" y="85" textAnchor="middle" className="text-xs fill-blue-300">Document</text>
            <text x="60" y="100" textAnchor="middle" className="text-[9px] fill-gray-500">"Hello..."</text>

            {/* Arrow 1 */}
            <line x1="100" y1="90" x2="160" y2="90" stroke={signStep >= 0 ? '#3b82f6' : '#374151'} strokeWidth="2" markerEnd="url(#arrowBlue)" />
            <text x="130" y="80" textAnchor="middle" className="text-[9px] fill-gray-400">SHA-256</text>

            {/* Hash */}
            <rect x="160" y="60" width="80" height="60" rx="8" fill={signStep >= 1 ? '#3b1f5f' : '#1f2937'} stroke={signStep >= 1 ? '#8b5cf6' : '#374151'} strokeWidth="2" />
            <text x="200" y="85" textAnchor="middle" className="text-xs fill-purple-300">Hash</text>
            <text x="200" y="100" textAnchor="middle" className="text-[9px] fill-gray-500">a7f3b...</text>

            {/* Arrow 2 */}
            <line x1="240" y1="90" x2="300" y2="90" stroke={signStep >= 1 ? '#8b5cf6' : '#374151'} strokeWidth="2" />
            <text x="270" y="80" textAnchor="middle" className="text-[9px] fill-gray-400">Priv Key</text>

            {/* Signature */}
            <rect x="300" y="60" width="80" height="60" rx="8" fill={signStep >= 2 ? '#1f3f2f' : '#1f2937'} stroke={signStep >= 2 ? '#10b981' : '#374151'} strokeWidth="2" />
            <text x="340" y="85" textAnchor="middle" className="text-xs fill-green-300">Signature</text>
            <text x="340" y="100" textAnchor="middle" className="text-[9px] fill-gray-500">3e8f1...</text>

            {/* Arrow 3 */}
            <line x1="380" y1="90" x2="440" y2="90" stroke={signStep >= 2 ? '#10b981' : '#374151'} strokeWidth="2" />
            <text x="410" y="80" textAnchor="middle" className="text-[9px] fill-gray-400">Pub Key</text>

            {/* Verified */}
            <rect x="440" y="60" width="100" height="60" rx="8" fill={signStep >= 2 ? '#1a3f2f' : '#1f2937'} stroke={signStep >= 2 ? '#10b981' : '#374151'} strokeWidth="2" />
            <text x="490" y="85" textAnchor="middle" className={`text-xs ${signStep >= 2 ? 'fill-green-300' : 'fill-gray-500'}`}>
              {signStep >= 2 ? '✓ Verified' : 'Pending...'}
            </text>
            <text x="490" y="100" textAnchor="middle" className="text-[9px] fill-gray-500">Hash match?</text>

            <defs>
              <marker id="arrowBlue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function Protocols() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="🤝"
        title="Protocols (TLS & Digital Signatures)"
        description="Step through a TLS handshake and trace the digital signature creation and verification flow."
      />
      <ScrollySection id="tls">
        <TlsHandshake />
      </ScrollySection>
      <ScrollySection id="signature">
        <DigitalSignature />
      </ScrollySection>
    </div>
  );
}
