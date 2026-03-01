import { PageHeader, ScrollySection } from '../components/Shared';

/* ─── Sub-section Imports ─── */
import { StateMatrixTranslator, GaloisFieldCalculator } from '../components/block/AesStateFields';
import { SubBytesViz, ShiftRowsViz, MixColumnsViz, AddRoundKeyViz } from '../components/block/AesRounds';
import { KeyExpansionViz } from '../components/block/AesKeySchedule';
import { FeistelLadder, ExpansionPBox, DesSBox } from '../components/block/DesFeistel';
import { AvalancheEffect, DifferentialLinearViz } from '../components/block/BlockAttacks';
import { TimingAttackSim } from '../components/block/SideChannel';

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
export default function BlockCiphers() {
  return (
    <div className="space-y-12">
      <PageHeader
        icon="🧱"
        title="Block Ciphers (DES & AES)"
        description="A deep dive into AES internals — from the state matrix and Galois Field arithmetic through every round transformation, key expansion, the DES Feistel structure, avalanche properties, and side-channel attacks."
      />

      {/* ── 1. The AES State & Finite Fields ── */}
      <section>
        <SectionHeading
          number={1}
          title='The AES "State" & Finite Fields'
          subtitle="How plaintext maps to a 4×4 matrix and the polynomial arithmetic underneath."
        />
        <div className="space-y-6">
          <ScrollySection id="state-matrix">
            <StateMatrixTranslator />
          </ScrollySection>
          <ScrollySection id="galois-field">
            <GaloisFieldCalculator />
          </ScrollySection>
        </div>
      </section>

      {/* ── 2. AES Round Transformations ── */}
      <section>
        <SectionHeading
          number={2}
          title="AES Round Transformations"
          subtitle="The four atomic operations applied each round: SubBytes, ShiftRows, MixColumns, AddRoundKey."
        />
        <div className="space-y-6">
          <ScrollySection id="subbytes">
            <SubBytesViz />
          </ScrollySection>
          <ScrollySection id="shiftrows">
            <ShiftRowsViz />
          </ScrollySection>
          <ScrollySection id="mixcolumns">
            <MixColumnsViz />
          </ScrollySection>
          <ScrollySection id="addroundkey">
            <AddRoundKeyViz />
          </ScrollySection>
        </div>
      </section>

      {/* ── 3. AES Key Schedule ── */}
      <section>
        <SectionHeading
          number={3}
          title="AES Key Schedule (Key Expansion)"
          subtitle="How a 128-bit key expands into 44 words, with the g-function detail: RotWord → SubWord → Rcon."
        />
        <div className="space-y-6">
          <ScrollySection id="key-expansion">
            <KeyExpansionViz />
          </ScrollySection>
        </div>
      </section>

      {/* ── 4. DES & Feistel Networks ── */}
      <section>
        <SectionHeading
          number={4}
          title="DES & Feistel Networks"
          subtitle="The Feistel ladder, expansion permutation, and the 6-to-4 bit S-Box selection logic."
        />
        <div className="space-y-6">
          <ScrollySection id="feistel-ladder">
            <FeistelLadder />
          </ScrollySection>
          <ScrollySection id="expansion-pbox">
            <ExpansionPBox />
          </ScrollySection>
          <ScrollySection id="des-sbox">
            <DesSBox />
          </ScrollySection>
        </div>
      </section>

      {/* ── 5. Block Cipher Properties & Attacks ── */}
      <section>
        <SectionHeading
          number={5}
          title="Block Cipher Properties & Attacks"
          subtitle="Avalanche effect, differential distribution, and linear approximation tables."
        />
        <div className="space-y-6">
          <ScrollySection id="avalanche">
            <AvalancheEffect />
          </ScrollySection>
          <ScrollySection id="diff-linear">
            <DifferentialLinearViz />
          </ScrollySection>
        </div>
      </section>

      {/* ── 6. Implementation Considerations ── */}
      <section>
        <SectionHeading
          number={6}
          title="Implementation Considerations (Side-Channels)"
          subtitle="Why constant-time code matters — a timing attack simulator."
        />
        <div className="space-y-6">
          <ScrollySection id="timing-attack">
            <TimingAttackSim />
          </ScrollySection>
        </div>
      </section>
    </div>
  );
}
