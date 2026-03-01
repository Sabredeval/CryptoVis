import { PageHeader, ScrollySection } from '../components/Shared';

/* ─── Sub-section Imports ─── */
import { RandomnessHeatmap, PeriodicityGraph } from '../components/stream/Randomness';
import { PerfectSecrecySimulator, Mod2Visualizer } from '../components/stream/OneTimePad';
import { InteractiveLfsr, StateSpaceGraph, LinearityDemo } from '../components/stream/LfsrSection';
import { QuarterRoundAnimator, MatrixStateFlow, CounterNonceViz } from '../components/stream/ChaCha20Section';
import { TwoTimePad, BitFlippingAttack } from '../components/stream/Attacks';
import { SynchronousStreamModel, ResyncFailure } from '../components/stream/KeystreamArchitecture';

/* ─── Section Header ─── */
function SectionHeading({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="relative pl-12 mb-6">
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-sm font-bold text-blue-400">
        {number}
      </div>
      <h2 className="text-xl font-bold text-gray-100">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function StreamCiphers() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon="🌊"
        title="Stream Ciphers & Randomness"
        description="A deep dive into stream cipher design — from raw randomness through LFSR structure, the ChaCha20 construction, real-world attacks, and the synchronous stream model."
      />

      {/* ── 1. Fundamentals of Randomness ── */}
      <section>
        <SectionHeading
          number={1}
          title="Fundamentals of Randomness"
          subtitle="TRNG vs PRNG, statistical quality, and why periodicity is fatal."
        />
        <div className="space-y-6">
          <ScrollySection id="heatmap">
            <RandomnessHeatmap />
          </ScrollySection>
          <ScrollySection id="periodicity">
            <PeriodicityGraph />
          </ScrollySection>
        </div>
      </section>

      {/* ── 2. One-Time Pad ── */}
      <section>
        <SectionHeading
          number={2}
          title="One-Time Pad"
          subtitle="Perfect secrecy, modular arithmetic, and why the key must be as long as the message."
        />
        <div className="space-y-6">
          <ScrollySection id="otp-sim">
            <PerfectSecrecySimulator />
          </ScrollySection>
          <ScrollySection id="mod2">
            <Mod2Visualizer />
          </ScrollySection>
        </div>
      </section>

      {/* ── 3. Linear Feedback Shift Registers ── */}
      <section>
        <SectionHeading
          number={3}
          title="Linear Feedback Shift Registers (LFSR)"
          subtitle="Configurable taps, state-space graphs, maximal-length sequences, and the linearity flaw."
        />
        <div className="space-y-6">
          <ScrollySection id="lfsr-interactive">
            <InteractiveLfsr />
          </ScrollySection>
          <ScrollySection id="lfsr-states">
            <StateSpaceGraph />
          </ScrollySection>
          <ScrollySection id="lfsr-linearity">
            <LinearityDemo />
          </ScrollySection>
        </div>
      </section>

      {/* ── 4. ChaCha20 Construction ── */}
      <section>
        <SectionHeading
          number={4}
          title="ChaCha20 Construction"
          subtitle="Quarter-round internals, column-then-diagonal mixing, and the counter/nonce design."
        />
        <div className="space-y-6">
          <ScrollySection id="chacha-qr">
            <QuarterRoundAnimator />
          </ScrollySection>
          <ScrollySection id="chacha-matrix">
            <MatrixStateFlow />
          </ScrollySection>
          <ScrollySection id="chacha-counter">
            <CounterNonceViz />
          </ScrollySection>
        </div>
      </section>

      {/* ── 5. Attacks & Vulnerabilities ── */}
      <section>
        <SectionHeading
          number={5}
          title="Attacks & Vulnerabilities"
          subtitle="What goes wrong when stream cipher rules are broken."
        />
        <div className="space-y-6">
          <ScrollySection id="two-time-pad">
            <TwoTimePad />
          </ScrollySection>
          <ScrollySection id="bit-flip">
            <BitFlippingAttack />
          </ScrollySection>
        </div>
      </section>

      {/* ── 6. Keystream Architecture ── */}
      <section>
        <SectionHeading
          number={6}
          title="Keystream Architecture"
          subtitle="The synchronous stream model and why byte-level sync is non-negotiable."
        />
        <div className="space-y-6">
          <ScrollySection id="sync-model">
            <SynchronousStreamModel />
          </ScrollySection>
          <ScrollySection id="resync">
            <ResyncFailure />
          </ScrollySection>
        </div>
      </section>
    </div>
  );
}
