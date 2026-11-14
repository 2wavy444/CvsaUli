import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/reference';

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: reports }, { data: claims }, { data: notifications }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('item_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('claim_requests')
        .select('*, item_reports(item_name, reference_number)')
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  const lostCount = reports?.filter((r) => r.report_type === 'lost').length ?? 0;
  const foundCount = reports?.filter((r) => r.report_type === 'found').length ?? 0;
  const pendingCount = reports?.filter((r) => r.status === 'Pending Review').length ?? 0;
  const approvedCount = reports?.filter((r) => r.status === 'Approved').length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile?.full_name ?? 'Campus User'}
          </h1>
          <p className="text-sm text-slate-600">
            {profile?.college_department} &bull; ID: {profile?.student_employee_id ?? 'N/A'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/report/lost"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Report Lost Item
          </Link>
          <Link
            href="/report/found"
            className="rounded-lg bg-cvsu-green px-4 py-2 text-sm font-semibold text-white hover:bg-cvsu-dark"
          >
            Report Found Item
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Lost Reports', value: lostCount },
          { label: 'Found Reports', value: foundCount },
          { label: 'Pending Review', value: pendingCount },
          { label: 'Approved Reports', value: approvedCount },
          { label: 'Claim Requests', value: claims?.length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* My Reports */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">My Submitted Reports</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ref #</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports && reports.length > 0 ? (
                  reports.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono text-xs">{r.reference_number}</td>
                      <td className="px-4 py-3 font-medium">{r.item_name}</td>
                      <td className="px-4 py-3 uppercase text-xs">{r.report_type}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No reports submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="pt-4 text-lg font-bold text-slate-900">My Claim Requests</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Claim Ref</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Staff Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims && claims.length > 0 ? (
                  claims.map((c: any) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-mono text-xs">{c.reference_number}</td>
                      <td className="px-4 py-3 font-medium">{c.item_reports?.item_name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{c.review_notes ?? '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No claim requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
          <div className="mt-4 space-y-3">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{n.message}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(n.created_at)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
