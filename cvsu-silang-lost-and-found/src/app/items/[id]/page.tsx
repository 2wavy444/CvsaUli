import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BackButton from '@/components/BackButton';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) {
    notFound();
  }

  const imgSrc = item.image_url || item.photo_url;
  const backHref = item.type === 'found' ? '/found-items' : '/lost-items';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <BackButton
        fallbackHref={backHref}
        label={item.type === 'found' ? 'Back to Found Items' : 'Back to Lost Items'}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {imgSrc && (
          <div className="max-h-96 w-full overflow-hidden bg-slate-100">
            <img src={imgSrc} alt={item.title} className="h-full w-full object-contain" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-slate-500">
              {item.reference_code}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                item.type === 'found'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {item.type} • {item.status}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{item.title}</h1>
          {item.category && (
            <p className="mt-1 text-sm font-medium text-emerald-700">{item.category}</p>
          )}

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700 sm:text-base">
            {item.description}
          </p>

          <div className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold uppercase text-slate-500">Location</span>
              <span className="font-medium text-slate-900">{item.location || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase text-slate-500">
                Date {item.type === 'found' ? 'Found' : 'Lost'}
              </span>
              <span className="font-medium text-slate-900">
                {new Date(item.incident_date || item.created_at).toLocaleString('en-PH')}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase text-slate-500">
                Contact Information
              </span>
              <span className="font-medium text-slate-900">{item.contact_info || 'OSAS / Security Desk'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase text-slate-500">
                Custody Office
              </span>
              <span className="font-medium text-slate-900">
                Office of Student Affairs and Services (OSAS)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}