import { useEffect } from 'react';
import { X, Check, X as XIcon, Target, MapPin, Calendar, Tag, Palette, Package, FileText, User } from 'lucide-react';
import type { MatchResult } from '@/types';
import { ConfidenceRing } from './ConfidenceRing';
import { MatchBadge } from './MatchBadge';

interface Props {
  match: MatchResult | null;
  onClose: () => void;
}

const FIELD_ICONS: Record<string, typeof Package> = {
  itemName: Package,
  category: Package,
  color: Palette,
  brand: Tag,
  tags: Tag,
  description: FileText,
  location: MapPin,
  date: Calendar,
};

export function MatchDetailModal({ match, onClose }: Props) {
  useEffect(() => {
    if (match) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [match]);

  if (!match) return null;

  const { lostItem, foundItem, confidence, level, fieldMatches, summary } = match;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Match Details</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Confidence ring + summary */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <ConfidenceRing confidence={confidence} level={level} size={130} />
            <div className="flex-1 text-center sm:text-left">
              <MatchBadge confidence={confidence} level={level} size="lg" />
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{summary}</p>
            </div>
          </div>

          {/* Item comparison */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Lost item card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                  <User className="h-4 w-4 text-rose-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Your Lost Item</span>
              </div>
              {lostItem.photo_url && (
                <img
                  src={lostItem.photo_url}
                  alt={lostItem.item_name}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <h3 className="font-bold text-gray-900">{lostItem.item_name}</h3>
              <p className="text-xs text-gray-500">Reported by {lostItem.reporter_name}</p>
            </div>

            {/* Found item card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                  <Package className="h-4 w-4 text-teal-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Found Item</span>
              </div>
              {foundItem.photo_url && (
                <img
                  src={foundItem.photo_url}
                  alt={foundItem.item_name}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <h3 className="font-bold text-gray-900">{foundItem.item_name}</h3>
              <p className="text-xs text-gray-500">
                {foundItem.location ? `Found at ${foundItem.location}` : ''}
              </p>
            </div>
          </div>

          {/* Why this matches */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
              Why This Matches
            </h3>
            <div className="space-y-2">
              {fieldMatches.map((fm) => {
                const Icon = FIELD_ICONS[fm.field] ?? Package;
                return (
                  <div
                    key={fm.field}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                      fm.matched
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        fm.matched ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      {fm.matched ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <XIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">{fm.label}</span>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            fm.score >= 50 ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {fm.score}%
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-gray-500 sm:flex-row sm:gap-2">
                        <span className="truncate">
                          <span className="font-medium text-gray-600">Lost:</span> {fm.lostValue || '—'}
                        </span>
                        <span className="truncate">
                          <span className="font-medium text-gray-600">Found:</span> {fm.foundValue || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          {level === 'Very High' || level === 'High' ? (
            <div className="mt-6 rounded-xl bg-teal-50 border border-teal-200 p-4">
              <p className="text-sm font-semibold text-teal-800">This might be your item!</p>
              <p className="mt-1 text-xs text-teal-600">
                Contact the finder at{' '}
                <span className="font-bold">{foundItem.finder_contact}</span> to arrange pickup.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
