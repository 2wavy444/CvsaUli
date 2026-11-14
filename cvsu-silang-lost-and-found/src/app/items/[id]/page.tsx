import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/reference';

export default async function ItemDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('item_reports')
    .select(
      'id, reference_number, report_type, item_name, description, date_lost, date_found, time_lost, time_found, location, image_url, status, created_at, categories(name)'
    )
    .eq('id', params.id)
    .single();

  if (!item) notFound();

  const canClaim = item.report_type === 'found' && item.status === 'Approved';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {item.image_url && (
          <div className="max-h-96 w-full bg-slate-100">
            <img src={item.image_url} alt={item.item_name} className="h-full max-h-96 w-full object-contain" />
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-700">
              Ref: {item.reference_number}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Status: {item.status}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">{item.item_name}</h1>
          <p className="mt-1 text-sm font-medium text-cvsu-green">
            {(item as any).categories?.name ?? 'General'} &bull;{' '}
            {item.report_type === 'lost' ? 'Lost Item Report' : 'Found Item Report'}
          </p>

          <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 text-sm text-slate-700">
            <div>
              <h2 className="font-semibold text-slate-900">Public Description</h2>
              <p className="mt-1 leading-relaxed">{item.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Campus Location</p>
                <p className="mt-1 font-medium text-slate-900">{item.location}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Date {item.report_type === 'lost' ? 'Lost' : 'Found'}
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatDate(item.report_type === 'lost' ? item.date_lost : item.date_found)}
                </p>
              </div>
            </div>
          </div>

          {canClaim && (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="text-base font-bold text-emerald-950">Is this your missing belonging?</h3>
              <p className="mt-1 text-sm text-emerald-800">
                Submit a claim request with specific identifying proof. Campus personnel will review
                your verification details before releasing the item.
              </p>
              <Link
                href={`/claim/${item.id}`}
                className="mt-4 inline-block rounded-lg bg-cvsu-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-cvsu-dark"
              >
                Submit Ownership Claim Request
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
