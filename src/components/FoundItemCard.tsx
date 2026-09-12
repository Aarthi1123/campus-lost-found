import { MapPin, Calendar, Package, Eye, Target } from 'lucide-react';
import type { FoundItem } from '@/types';
import { MatchBadge } from './MatchBadge';

interface Props {
  item: FoundItem;
  matchConfidence?: number;
  matchLevel?: 'Very High' | 'High' | 'Possible' | 'Low';
  onViewDetails?: () => void;
}

export function FoundItemCard({ item, matchConfidence, matchLevel, onViewDetails }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Photo */}
      {item.photo_url ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={item.photo_url}
            alt={item.item_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {matchConfidence !== undefined && matchLevel && (
            <div className="absolute left-3 top-3">
              <MatchBadge confidence={matchConfidence} level={matchLevel} size="sm" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-teal-50 to-gray-100">
          <Package className="h-12 w-12 text-teal-300" />
          {matchConfidence !== undefined && matchLevel && (
            <div className="absolute left-3 top-3">
              <MatchBadge confidence={matchConfidence} level={matchLevel} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900">{item.item_name}</h3>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {item.category}
          </span>
        </div>

        <div className="space-y-1 text-xs text-gray-500">
          {item.color && (
            <p>
              <span className="font-medium text-gray-600">Color:</span> {item.color}
            </p>
          )}
          {item.brand && (
            <p>
              <span className="font-medium text-gray-600">Brand:</span> {item.brand}
            </p>
          )}
          {item.location && (
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {item.location}
            </p>
          )}
          {item.found_date && (
            <p className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.found_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {item.description && (
          <p className="mt-2 line-clamp-2 text-xs text-gray-500">{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Confidence + action */}
        {matchConfidence !== undefined && matchLevel && (matchLevel === 'Very High' || matchLevel === 'High') && (
          <div className="mt-3 rounded-lg bg-teal-50 border border-teal-200 p-2.5">
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-semibold text-teal-800">This might be your item!</span>
            </div>
          </div>
        )}

        {onViewDetails && matchConfidence !== undefined && (
          <button
            onClick={onViewDetails}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" /> View Details
          </button>
        )}
      </div>
    </div>
  );
}
