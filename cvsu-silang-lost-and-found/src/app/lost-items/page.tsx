import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/reference';

export default async function LostItemsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const supabase = await createClient();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 9;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('item_reports')
    .select(
      'id, reference_number, item_name, description, date_lost, location, status, created_at, image_url, categories(name)',
      { count: 'exact' }
    )
    .eq('report_type', 'lost')
    .in('status', ['Approved', 'Claimed', 'Returned'])
    .order('created_at', { ascending: false })
    .range(from, to);

  if (searchParams.q) {
    query = query.or(
      `item_name.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%,location.ilike.%${searchParams.q}%`
    );
  }
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category);
  }

  const [{ data: items, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('id, name').order('name'),
  ]);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lost Items Directory</h1>
          <p className="mt-1 text-sm text-slate-600">
            Approved missing belongings reported by students and staff.
          </p>
        </div>
        <Link
          href="/report/lost"
          className="rounded-lg bg-cvsu-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-cvsu-dark"
        >
          + Report Lost Item
        </Link>
      </div>

      {/* Filter Bar */}
      <form className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search keyword or location..."
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={searchParams.category}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Apply Filters
        </button>
      </form>

      {/* Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item: any) => (
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-cvsu-green"
          >
            <div className="aspect-video bg-slate-100">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No Image
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500">{item.reference_number}</span>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-700">
                  {item.status}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{item.item_name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>Location: {item.location}</p>
                <p>Date Lost: {formatDate(item.date_lost)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/lost-items?page=${p}&q=${searchParams.q ?? ''}&category=${searchParams.category ?? ''}`}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${
                p === page ? 'bg-cvsu-green text-white' : 'border border-slate-300 bg-white text-slate-700'
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
