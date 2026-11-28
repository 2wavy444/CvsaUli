'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface DashboardReportItem {
  id: string;
  reference_code: string;
  title: string;
  type: 'lost' | 'found' | string;
  status: string;
  location?: string | null;
  category?: string | null;
  incident_date?: string | null;
  created_at: string;
}

interface DashboardArchiveProps {
  reports: DashboardReportItem[];
}

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function getItemDate(report: DashboardReportItem): Date {
  return new Date(report.incident_date || report.created_at);
}

/**
 * Computes Philippine / CvSU Academic Year (August to July).
 * Example: Aug 2026 - Jul 2027 -> "AY 2026-2027"
 */
function getAcademicYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1 = Jan, 8 = Aug
  const startYear = month >= 8 ? year : year - 1;
  return `AY ${startYear}-${startYear + 1}`;
}

function formatDisplayDate(report: DashboardReportItem): string {
  const d = getItemDate(report);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusBadgeStyle(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('approved') || s.includes('confirmed') || s.includes('recovered')) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (s.includes('rejected') || s.includes('declined')) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-amber-100 text-amber-800';
}

export default function DashboardArchive({ reports }: DashboardArchiveProps) {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Build available Academic Years (always includes current & previous AY + any from reports)
  const availableAcademicYears = useMemo(() => {
    const now = new Date();
    const currentAyStart = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const aySet = new Set<string>([
      `AY ${currentAyStart}-${currentAyStart + 1}`,
      `AY ${currentAyStart - 1}-${currentAyStart}`,
    ]);

    for (const r of reports) {
      const d = getItemDate(r);
      if (!Number.isNaN(d.getTime())) {
        aySet.add(getAcademicYear(d));
      }
    }

    return Array.from(aySet).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  // Build available calendar years
  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    for (const r of reports) {
      const d = getItemDate(r);
      if (!Number.isNaN(d.getTime())) {
        years.add(d.getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const d = getItemDate(report);
      if (Number.isNaN(d.getTime())) return false;

      if (selectedAcademicYear !== 'all' && getAcademicYear(d) !== selectedAcademicYear) {
        return false;
      }
      if (selectedYear !== 'all' && d.getFullYear() !== Number(selectedYear)) {
        return false;
      }
      if (selectedMonth !== 'all' && d.getMonth() + 1 !== Number(selectedMonth)) {
        return false;
      }
      if (selectedDay !== 'all' && d.getDate() !== Number(selectedDay)) {
        return false;
      }
      if (selectedType !== 'all' && report.type.toLowerCase() !== selectedType) {
        return false;
      }
      if (q) {
        const hay = `${report.reference_code} ${report.title} ${report.location ?? ''} ${report.category ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    reports,
    selectedAcademicYear,
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedType,
    searchQuery,
  ]);

  const hasActiveFilters =
    selectedAcademicYear !== 'all' ||
    selectedYear !== 'all' ||
    selectedMonth !== 'all' ||
    selectedDay !== 'all' ||
    selectedType !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedAcademicYear('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDay('all');
    setSelectedType('all');
    setSearchQuery('');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header + Archive Count */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            My Submitted Reports Archive
          </h2>
          <p className="text-xs text-slate-500">
            Filter reports by academic year, day, month, year, or report type.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Showing {filteredReports.length} of {reports.length}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Archive Filter Controls (Academic Year, Day, Month, Year, Type, Search) */}
      <div className="border-b border-slate-100 bg-slate-50/80 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Academic Year */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              aria-label="Filter by academic year"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none sm:text-sm"
            >
              <option value="all">All Academic Years</option>
              {availableAcademicYears.map((ay) => (
                <option key={ay} value={ay}>
                  {ay}
                </option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              aria-label="Filter by day"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none sm:text-sm"
            >
              <option value="all">All Days</option>
              {days.map((d) => (
                <option key={d} value={String(d)}>
                  Day {d}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Filter by month"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none sm:text-sm"
            >
              <option value="all">All Months</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Filter by year"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none sm:text-sm"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by report type"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ref # or item..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Ref #</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Academic Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  {hasActiveFilters
                    ? 'No reports match the selected academic year, day, month, year, or filter.'
                    : 'No reports submitted yet.'}
                </td>
              </tr>
            ) : (
              filteredReports.map((item) => {
                const itemDate = getItemDate(item);
                const ayLabel = Number.isNaN(itemDate.getTime())
                  ? 'N/A'
                  : getAcademicYear(itemDate);

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      <Link
                        href={`/items/${item.id}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {item.reference_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/items/${item.id}`} className="hover:text-emerald-700">
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{item.type}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{ayLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadgeStyle(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDisplayDate(item)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}