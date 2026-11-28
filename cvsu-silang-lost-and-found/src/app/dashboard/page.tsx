import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BackButton from '@/components/BackButton';
import DashboardArchive from '@/components/DashboardArchive';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Campus User';
  const studentId = profile?.student_id || user.user_metadata?.student_id || 'N/A';

  const { data: reports } = await supabase
    .from('items')
    .select('*')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  const { data: claims } = await supabase
    .from('claims')
    .select('*, items(title, reference_code)')
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false });

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const safeReports = reports ?? [];
  const safeClaims = claims ?? [];
  const safeNotifications = notifications ?? [];

  const lostCount = safeReports.filter((r) => r.type === 'lost').length;
  const foundCount = safeReports.filter((r) => r.type === 'found').length;
  const pendingCount = safeReports.filter((r) => r.status === 'pending').length;
  const approvedCount = safeReports.filter((r) => r.status === 'approved').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/" label="Back to Home" />

      {/* Header Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Welcome, {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <span>• ID: {studentId}</span>
            <span>• {user.email}</span>
            <Link
              href="/account"
              className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              Edit Account Info
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
          <Link
            href="/report/lost"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Report Lost Item
          </Link>
          <Link
            href="/report/found"
            className="rounded-xl bg-emerald-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Report Found Item
          </Link>
        </div>
      </div>

      {/* Responsive Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Lost Reports
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{lostCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Found Reports
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{foundCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Pending Review
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600 sm:text-3xl">{pendingCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Approved Reports
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700 sm:text-3xl">{approvedCount}</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-1 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Claim Requests
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{safeClaims.length}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Archive & Claim Requests */}
        <div className="space-y-6 lg:col-span-2">
          <DashboardArchive reports={safeReports} />

          {/* My Claim Requests */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                My Claim Requests
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Claim Ref</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Staff Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeClaims.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                        No claim requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    safeClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                          {claim.claim_code ?? claim.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {claim.items?.title ?? 'Reported Item'}
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-700">{claim.status}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {claim.staff_notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Notifications */}
        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-900 sm:text-lg">Notifications</h2>
            {safeNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No notifications yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {safeNotifications.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">{note.title}</p>
                    <p className="mt-0.5 text-slate-600">{note.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}