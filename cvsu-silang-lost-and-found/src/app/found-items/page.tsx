import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BackButton from '@/components/BackButton';

const CATEGORIES = [
  'ID / Wallet / Cards',
  'Electronics / Phone / Charger',
  'Keys / Lanyard',
  'Books / Notebooks / School Supplies',
  'Bag / Pouch / Umbrella',
  'Clothing / Accessories',
  'Other Item',
];

function formatIncidentDate(dateStr?: string | null) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function FoundItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, Number(resolvedParams.page ?? 1));
  const pageSize = 9;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('items')
    .select('*', { count: 'exact' })
    .eq('type', 'found')
    .in('status', ['approved', 'Approved', 'claimed', 'Claimed', 'returned', 'Returned'])
    .order('created_at', { ascending: false })
    .range(from, to);

  if (resolvedParams.q) {
    query = query.or(
      `title.ilike.%${resolvedParams.q}%,description.ilike.%${resolvedParams.q}%,location.ilike.%${resolvedParams.q}%`
    );
  }
  if (resolvedParams.category) {
    query = query.eq('category', resolvedParams.category);
  }

  const { data: items, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/dashboard" label="Back to Dashboard" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Found Items Directory</h1>
          <p className="mt-1 text-sm text-slate-600">
            Verified items turned over or reported on campus. Submit a claim request to verify ownership.
          </p>
        </div>
        <Link
          href="/report/found"
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + Report Found Item
        </Link>
      </div>

      {/* Filter Bar */}
      <form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <input
          type="text"
          name="q"
          defaultValue={resolvedParams.q}
          placeholder="Search keyword or location..."
          className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
        />
        <select
          name="category"
          defaultValue={resolvedParams.category}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Apply Filters
        </button>
      </form>

      {/* Items Grid */}
      {!items || items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-base font-semibold text-slate-700">No found items posted yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your filters or submit a new found item report.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => {
            const imgSrc = item.image_url || item.photo_url;
            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700 hover:shadow-md"
              >
                <div className="aspect-video overflow-hidden bg-slate-100">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
                      No Image Uploaded
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-500">
                      {item.reference_code}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold capitalize text-emerald-800">
                      {item.status}
                    </span>
                  </div>
                  {item.category && (
                    <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {item.category}
                    </span>
                  )}
                  <h2 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-emerald-800">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p>
                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <p>
                      <span className="font-semibold text-slate-700">Found at:</span> {item.location}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Date Found:</span>{' '}
                      {formatIncidentDate(item.incident_date || item.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/found-items?page=${p}&q=${resolvedParams.q ?? ''}&category=${resolvedParams.category ?? ''}`}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold ${
                p === page
                  ? 'bg-emerald-800 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}