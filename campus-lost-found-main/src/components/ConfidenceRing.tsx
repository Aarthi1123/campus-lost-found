import type { MatchLevel } from '@/types';

interface Props {
  confidence: number;
  level: MatchLevel;
  size?: number;
}

const COLORS: Record<MatchLevel, { stroke: string; glow: string }> = {
  'Very High': { stroke: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  High: { stroke: '#14b8a6', glow: 'rgba(20,184,166,0.25)' },
  Possible: { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  Low: { stroke: '#9ca3af', glow: 'rgba(156,163,175,0.25)' },
};

export function ConfidenceRing({ confidence, level, size = 120 }: Props) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;
  const color = COLORS[level];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 6px ${color.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{confidence}%</span>
        <span className="text-xs font-medium text-gray-500">{level}</span>
      </div>
    </div>
  );
}
