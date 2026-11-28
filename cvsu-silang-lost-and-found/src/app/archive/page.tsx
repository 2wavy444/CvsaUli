import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BackButton from '@/components/BackButton';
import DashboardArchive, {
  isUnclaimedOverMonth,
  type DashboardReportItem,
} from '@/components/DashboardArchive';

export default async function TambakanStorageArchivePage() {
  const supabase = await createClient();

  const { data: allItems } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  const nowMs = Date.now();
  const storageItems: DashboardReportItem[] = (allItems ?? []).filter((item) =>
    isUnclaimedOverMonth(item, nowMs)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/dashboard" label="Back to Dashboard" />

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <span className="inline-block rounded-full bg-amber-200/80 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900">
            Tambakan / Storage Archive (30+ Days Unclaimed)
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Unclaimed &amp; Unrecovered Items Storage
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Reports that have remained unrecovered or unclaimed for more than a month (30 days), organized across current and previous academic years.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/lost-items"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Lost Items
          </Link>
          <Link
            href="/found-items"
            className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Found Items
          </Link>
        </div>
      </div>

      <DashboardArchive reports={storageItems} />
    </div>
  );
}