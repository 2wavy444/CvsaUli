import Link from 'next/link';
import { Search, FileWarning, PackageCheck, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/reference';

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: recentItems }, { data: categories }, { data: announcements }] = await Promise.all([
    supabase
      .from('item_reports')
      .select('id, reference_number, report_type, item_name, location, status, created_at, image_url, categories(name)')
      .in('status', ['Approved', 'Claimed', 'Returned'])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('categories').select('*').order('name'),
    supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  return (
    <div>
      {/* Announcements Banner */}
      {announcements && announcements.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="font-medium">
              <span className="mr-2 rounded bg-amber-200 px-2 py-0.5 text-xs font-bold uppercase">
                Campus Notice
              </span>
              {announcements[0].title}: {announcements[0].content}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-950 via-cvsu-dark to-cvsu-green py-20 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            Cavite State University – Silang Campus
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Lost Something on Campus? Let&apos;s Help You Find It.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-emerald-100 sm:text-lg">
            A centralized lost and found platform for Cavite State University – Silang Campus. Report
            missing belongings, browse found items, and reconnect with your belongings through a
            secure and organized process.
          </p>

          {/* Search Bar */}
          <form action="/found-items" method="GET" className="mx-auto mt-8 flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="Search by item name, location (e.g., Library, New Building), or keyword..."
                className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-lg focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-400"
            >
              Search
            </button>
          </form>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/lost-items"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-cvsu-dark shadow hover:bg-slate-100"
            >
              <FileWarning className="h-4 w-4 text-red-600" />
              Browse Lost Items
            </Link>
            <Link
              href="/found-items"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-800/60 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <PackageCheck className="h-4 w-4 text-emerald-300" />
              Browse Found Items
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Reported Items */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recently Verified Reports</h2>
            <p className="mt-1 text-sm text-slate-600">
              Approved lost and found records across Cavite State University – Silang Campus.
            </p>
          </div>
          <Link
            href="/found-items"
            className="inline-flex items-center gap-1 text-sm font-semibold text-cvsu-green hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentItems && recentItems.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.map((item: any) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-cvsu-green hover:shadow-md"
              >
                <div className="aspect-video w-full bg-slate-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
                      No Photo Provided
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        item.report_type === 'lost'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.report_type}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{item.reference_number}</span>
                  </div>
                  <h3 className="mt-2.5 text-lg font-bold text-slate-900 group-hover:text-cvsu-green">
                    {item.item_name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {item.categories?.name ?? 'Uncategorized'} &bull; {item.location}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>Reported {formatDate(item.created_at)}</span>
                    <span className="font-semibold text-cvsu-green">{item.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm font-medium text-slate-600">
              No approved reports published yet. Log in to submit the first campus report.
            </p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How Campus Custody &amp; Claiming Works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Submit Report',
                desc: 'Log in with your student or employee account to file a Lost or Found report with photo evidence.',
              },
              {
                step: '02',
                title: 'Staff Review',
                desc: 'Authorized campus personnel review submissions to prevent duplicates and protect sensitive details.',
              },
              {
                step: '03',
                title: 'Ownership Claim',
                desc: 'Owners submit a claim request providing private identifying details only the true owner knows.',
              },
              {
                step: '04',
                title: 'Verified Release',
                desc: 'Campus personnel verify ownership in person and record the official return in the registry.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <span className="text-xs font-extrabold tracking-widest text-cvsu-green">
                  STEP {item.step}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Item Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">Browse by Category</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/found-items?category=${cat.id}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-cvsu-green"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cvsu-green" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
