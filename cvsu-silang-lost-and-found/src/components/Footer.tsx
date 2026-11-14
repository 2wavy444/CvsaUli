import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-base font-bold text-white">
            Cavite State University – Silang Campus
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Official Campus Lost and Found Management System. Coordinating transparent item reporting,
            custody verification, and rightful owner returns.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/lost-items" className="hover:text-white">Lost Items Directory</Link></li>
            <li><Link href="/found-items" className="hover:text-white">Found Items Directory</Link></li>
            <li><Link href="/report/lost" className="hover:text-white">Submit Lost Report</Link></li>
            <li><Link href="/report/found" className="hover:text-white">Submit Found Report</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Custody &amp; Verification Office</h4>
          <p className="mt-3 text-sm text-slate-400">
            Office of Student Affairs and Services (OSAS) / Campus Security Desk<br />
            Biga I, Silang, Cavite<br />
            Mon – Fri: 8:00 AM – 5:00 PM
          </p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Cavite State University – Silang Campus. All rights reserved.
      </div>
    </footer>
  );
}
