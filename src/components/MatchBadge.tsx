import type { MatchLevel } from '@/types';

const LEVEL_STYLES: Record<MatchLevel, { bg: string; text: string; ring: string; label: string }> = {
  'Very High': {
    bg: 'bg-emerald-500',
    text: 'text-white',
    ring: 'ring-emerald-400',
    label: 'Very High Match',
  },
  High: {
    bg: 'bg-teal-500',
    text: 'text-white',
    ring: 'ring-teal-400',
    label: 'High Match',
  },
  Possible: {
    bg: 'bg-amber-500',
    text: 'text-white',
    ring: 'ring-amber-400',
    label: 'Possible Match',
  },
  Low: {
    bg: 'bg-gray-400',
    text: 'text-white',
    ring: 'ring-gray-300',
    label: 'Low Match',
  },
};

interface Props {
  confidence: number;
  level: MatchLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function MatchBadge({ confidence, level, size = 'md' }: Props) {
  const style = LEVEL_STYLES[level];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${style.bg} ${style.text} ${sizeClasses[size]} shadow-sm`}
    >
      <span className={`rounded-full bg-white/40 ${dotSize[size]}`} />
      {style.label} · {confidence}%
    </span>
  );
}

export { LEVEL_STYLES };
