export interface ArchiveReportItem {
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function getItemDate(report: ArchiveReportItem): Date {
  return new Date(report.incident_date || report.created_at);
}

export function getAcademicYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 8 ? year : year - 1;
  return `AY ${startYear}-${startYear + 1}`;
}

export function isUnclaimedOverMonth(
  report: ArchiveReportItem,
  nowMs: number = Date.now()
): boolean {
  const s = report.status.toLowerCase();
  const isAlreadyResolved =
    s.includes('recovered') ||
    s.includes('returned') ||
    s.includes('claimed') ||
    s.includes('confirmed');
  if (isAlreadyResolved) return false;

  const d = getItemDate(report);
  if (Number.isNaN(d.getTime())) return false;
  return nowMs - d.getTime() >= THIRTY_DAYS_MS;
}

export function formatArchiveDate(report: ArchiveReportItem): string {
  const d = getItemDate(report);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}