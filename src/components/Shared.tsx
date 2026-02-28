import { ReactNode, useState, useEffect, useRef } from 'react';
import { useCryptoStore } from '../store/cryptoStore';

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  labels?: string[];
}

export function StepControls({ currentStep, totalSteps, onStepChange, labels }: StepControlsProps) {
  const { animationSpeed, isAutoPlaying, setAutoPlaying } = useCryptoStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        onStepChange(currentStep >= totalSteps - 1 ? 0 : currentStep + 1);
      }, 2000 / animationSpeed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, currentStep, totalSteps, animationSpeed, onStepChange]);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-crypto-card border border-crypto-border rounded-xl">
      <button
        onClick={() => onStepChange(Math.max(0, currentStep - 1))}
        disabled={currentStep === 0}
        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg transition-colors"
      >
        ← Prev
      </button>
      <button
        onClick={() => setAutoPlaying(!isAutoPlaying)}
        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
          isAutoPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {isAutoPlaying ? '⏸ Pause' : '▶ Auto'}
      </button>
      <button
        onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
        disabled={currentStep >= totalSteps - 1}
        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg transition-colors"
      >
        Next →
      </button>
      <span className="text-xs text-gray-400 ml-auto">
        Step {currentStep + 1} / {totalSteps}
        {labels && labels[currentStep] && ` – ${labels[currentStep]}`}
      </span>
    </div>
  );
}

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-crypto-card border border-crypto-border rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-crypto-border">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  icon: string;
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{icon}</span>
        <h1 className="text-2xl lg:text-3xl font-bold">{title}</h1>
      </div>
      <p className="text-gray-400 max-w-2xl">{description}</p>
    </div>
  );
}

export function BitGrid({ bits, label, highlight }: { bits: number[]; label?: string; highlight?: Set<number> }) {
  return (
    <div>
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <div className="flex flex-wrap gap-1">
        {bits.map((b, i) => (
          <div
            key={i}
            className={`bit-cell ${b ? 'bit-1' : 'bit-0'} ${
              highlight?.has(i) ? 'ring-2 ring-yellow-400 scale-110' : ''
            }`}
          >
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScrollySection({ children, id }: { children: ReactNode; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  );
}
