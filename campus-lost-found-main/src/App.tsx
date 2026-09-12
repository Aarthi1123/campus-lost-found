import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertCircle,
  Loader2,
  Target,
  CheckCircle2,
  X,
  Bell,
  Inbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LostItem, FoundItem, MatchResult } from '@/types';
import { findMatchesForFoundItem, findMatchesForLostItem } from '@/lib/matching';
import { ItemForm, type ItemFormData } from '@/components/ItemForm';
import { FoundItemCard } from '@/components/FoundItemCard';
import { LostItemCard } from '@/components/LostItemCard';
import { MatchDetailModal } from '@/components/MatchDetailModal';
import { MatchBadge } from '@/components/MatchBadge';

type View = 'found-log' | 'add-found' | 'lost-log' | 'add-lost' | 'matches';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'match';
  matchResult?: MatchResult;
}

export default function App() {
  const [view, setView] = useState<View>('found-log');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedLostForMatches, setSelectedLostForMatches] = useState<string>('');

  // ── Data fetching ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lostRes, foundRes] = await Promise.all([
        supabase.from('lost_items').select('*').order('created_at', { ascending: false }),
        supabase.from('found_items').select('*').order('created_at', { ascending: false }),
      ]);
      if (lostRes.error) throw lostRes.error;
      if (foundRes.error) throw foundRes.error;
      setLostItems(lostRes.data ?? []);
      setFoundItems(foundRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Notifications ───────────────────────────────────────
  function pushNotification(n: Omit<Notification, 'id'>) {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { ...n, id }]);
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  // ── Add Found Item ──────────────────────────────────────
  async function handleAddFound(data: ItemFormData) {
    setSubmitting(true);
    setError('');
    try {
      const insertData = {
        finder_name: data.name,
        finder_contact: data.contact,
        item_name: data.itemName,
        category: data.category,
        color: data.color,
        brand: data.brand,
        tags: data.tags,
        description: data.description,
        location: data.location,
        found_date: data.date ? new Date(data.date).toISOString() : null,
        photo_url: data.photoUrl,
        status: 'active',
      };
      const { data: inserted, error: insertError } = await supabase
        .from('found_items')
        .insert(insertData)
        .select()
        .single();
      if (insertError) throw insertError;

      const newFound: FoundItem = inserted;
      setFoundItems((prev) => [newFound, ...prev]);

      // Calculate matches against all active lost items
      const matches = findMatchesForFoundItem(newFound, lostItems);
      const significantMatches = matches.filter((m) => m.confidence >= 40);

      if (significantMatches.length > 0) {
        const topMatch = significantMatches[0];
        pushNotification({
          message: `This might be your item! "${newFound.item_name}" matches "${topMatch.lostItem.item_name}" at ${topMatch.confidence}% confidence.`,
          type: 'match',
          matchResult: topMatch,
        });
      } else {
        pushNotification({
          message: `Found item "${newFound.item_name}" logged successfully. No strong matches yet — we'll keep comparing.`,
          type: 'success',
        });
      }
      setView('found-log');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add found item');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Add Lost Item ───────────────────────────────────────
  async function handleAddLost(data: ItemFormData) {
    setSubmitting(true);
    setError('');
    try {
      const insertData = {
        reporter_name: data.name,
        reporter_contact: data.contact,
        item_name: data.itemName,
        category: data.category,
        color: data.color,
        brand: data.brand,
        tags: data.tags,
        description: data.description,
        location: data.location,
        lost_date: data.date ? new Date(data.date).toISOString() : null,
        photo_url: data.photoUrl,
        status: 'active',
      };
      const { data: inserted, error: insertError } = await supabase
        .from('lost_items')
        .insert(insertData)
        .select()
        .single();
      if (insertError) throw insertError;

      const newLost: LostItem = inserted;
      setLostItems((prev) => [newLost, ...prev]);

      // Check if any existing found items match this lost item
      const matches = findMatchesForLostItem(newLost, foundItems);
      const significantMatches = matches.filter((m) => m.confidence >= 40);

      if (significantMatches.length > 0) {
        const topMatch = significantMatches[0];
        pushNotification({
          message: `Good news! A found item "${topMatch.foundItem.item_name}" might be your "${newLost.item_name}" — ${topMatch.confidence}% match.`,
          type: 'match',
          matchResult: topMatch,
        });
      } else {
        pushNotification({
          message: `Lost item "${newLost.item_name}" reported successfully. We'll notify you when a matching found item is logged.`,
          type: 'success',
        });
      }
      setView('lost-log');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lost item');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Match view: compute matches for selected lost item ──
  const activeLostItems = useMemo(() => lostItems.filter((l) => l.status === 'active'), [lostItems]);

  useEffect(() => {
    if (view === 'matches') {
      if (!selectedLostForMatches && activeLostItems.length > 0) {
        setSelectedLostForMatches(activeLostItems[0].id);
        return;
      }
      if (selectedLostForMatches) {
        const lost = lostItems.find((l) => l.id === selectedLostForMatches);
        if (lost) {
          setMatchResults(findMatchesForLostItem(lost, foundItems));
        } else {
          setMatchResults([]);
        }
      }
    }
  }, [view, selectedLostForMatches, lostItems, foundItems, activeLostItems]);

  const visibleMatches = useMemo(
    () => matchResults.filter((m) => m.confidence > 0),
    [matchResults]
  );

  // ── Render ──────────────────────────────────────────────
  const navItems: { key: View; label: string; icon: typeof Search }[] = [
    { key: 'found-log', label: 'Found Log', icon: Inbox },
    { key: 'add-found', label: 'Add Found', icon: Plus },
    { key: 'lost-log', label: 'Lost Log', icon: Search },
    { key: 'add-lost', label: 'Report Lost', icon: Plus },
    { key: 'matches', label: 'My Matches', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 sm:text-lg">Campus Lost & Found</h1>
              <p className="hidden text-xs text-gray-500 sm:block">Find what's lost. Return what's found.</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (notifications.length > 0) setNotifications([]);
            }}
            className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        <nav className="mx-auto max-w-6xl px-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ── Notification toasts ───────────────────────── */}
      {notifications.length > 0 && (
        <div className="fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-xl border p-3 shadow-lg ${
                n.type === 'match'
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-emerald-200 bg-emerald-50'
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  n.type === 'match' ? 'bg-teal-500' : 'bg-emerald-500'
                }`}
              >
                {n.type === 'match' ? (
                  <Target className="h-4 w-4 text-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{n.message}</p>
                {n.matchResult && (
                  <button
                    onClick={() => {
                      setSelectedMatch(n.matchResult ?? null);
                      dismissNotification(n.id);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-teal-700"
                  >
                    View Details
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissNotification(n.id)}
                className="shrink-0 rounded p-0.5 text-gray-400 transition hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content ───────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="mt-3 text-sm text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* ── Found Log ───────────────────────────── */}
            {view === 'found-log' && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Found Items Log</h2>
                    <p className="text-sm text-gray-500">
                      {foundItems.length} item{foundItems.length !== 1 ? 's' : ''} logged as found
                    </p>
                  </div>
                  <button
                    onClick={() => setView('add-found')}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4" /> Add Found
                  </button>
                </div>
                {foundItems.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No found items yet"
                    message="When someone logs a found item, it will appear here. The system will automatically compare it against all lost-item reports."
                    actionLabel="Log a Found Item"
                    onAction={() => setView('add-found')}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {foundItems.map((item) => (
                      <FoundItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Add Found Item ──────────────────────── */}
            {view === 'add-found' && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Log a Found Item</h2>
                  <p className="text-sm text-gray-500">
                    Fill in as many details as possible — the system will automatically match it
                    against all lost-item reports.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <ItemForm type="found" onSubmit={handleAddFound} submitting={submitting} />
                </div>
              </div>
            )}

            {/* ── Lost Log ────────────────────────────── */}
            {view === 'lost-log' && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Lost Items Log</h2>
                    <p className="text-sm text-gray-500">
                      {lostItems.length} item{lostItems.length !== 1 ? 's' : ''} reported as lost
                    </p>
                  </div>
                  <button
                    onClick={() => setView('add-lost')}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    <Plus className="h-4 w-4" /> Report Lost
                  </button>
                </div>
                {lostItems.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No lost items reported"
                    message="Report a lost item and the system will automatically compare it against all found items in the log."
                    actionLabel="Report a Lost Item"
                    onAction={() => setView('add-lost')}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {lostItems.map((item) => (
                      <LostItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Add Lost Item ───────────────────────── */}
            {view === 'add-lost' && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Report a Lost Item</h2>
                  <p className="text-sm text-gray-500">
                    Provide as much detail as you can. The system will automatically match it
                    against all found items in the log.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <ItemForm type="lost" onSubmit={handleAddLost} submitting={submitting} />
                </div>
              </div>
            )}

            {/* ── My Matches ──────────────────────────── */}
            {view === 'matches' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Match Confidence</h2>
                  <p className="text-sm text-gray-500">
                    Select one of your lost items to see how it matches against all found items.
                    Confidence is calculated from the actual data — not random.
                  </p>
                </div>

                {activeLostItems.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="No active lost items"
                    message="Report a lost item first, then come back here to see match confidence scores."
                    actionLabel="Report a Lost Item"
                    onAction={() => setView('add-lost')}
                  />
                ) : foundItems.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No found items to compare"
                    message="Once someone logs a found item, the system will automatically calculate match confidence against your lost items."
                  />
                ) : (
                  <>
                    {/* Lost item selector */}
                    <div className="mb-5 flex flex-wrap gap-2">
                      {activeLostItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedLostForMatches(item.id)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            selectedLostForMatches === item.id
                              ? 'border-teal-600 bg-teal-50 text-teal-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {item.item_name}
                        </button>
                      ))}
                    </div>

                    {/* Match results */}
                    {visibleMatches.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                        <Target className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm font-medium text-gray-600">
                          No matches found for this item yet.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          New found items will be compared automatically.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleMatches.map((match) => (
                          <FoundItemCard
                            key={match.foundItem.id}
                            item={match.foundItem}
                            matchConfidence={match.confidence}
                            matchLevel={match.level}
                            onViewDetails={() => setSelectedMatch(match)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Match detail modal ──────────────────────────── */}
      <MatchDetailModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: typeof Search;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
