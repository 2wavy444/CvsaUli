export function generateReferenceNumber(prefix: 'LNF' | 'CLM'): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${randomDigits}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
