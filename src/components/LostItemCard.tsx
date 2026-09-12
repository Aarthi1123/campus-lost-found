import { MapPin, Calendar, Package, User } from 'lucide-react';
import type { LostItem } from '@/types';

interface Props {
  item: LostItem;
}

export function LostItemCard({ item }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {item.photo_url ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={item.photo_url}
            alt={item.item_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                item.status === 'active'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {item.status === 'active' ? 'Lost' : 'Recovered'}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-rose-50 to-gray-100">
          <Package className="h-12 w-12 text-rose-300" />
          <div className="absolute right-3 top-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                item.status === 'active'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {item.status === 'active' ? 'Lost' : 'Recovered'}
            </span>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900">{item.item_name}</h3>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {item.category}
          </span>
        </div>

        <div className="space-y-1 text-xs text-gray-500">
          <p className="flex items-center gap-1">
            <User className="h-3 w-3" /> {item.reporter_name}
          </p>
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
          {item.lost_date && (
            <p className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.lost_date).toLocaleDateString()}
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
                className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
