'use client';

import Link from 'next/link';
import { ShieldCheck, Search, PlusCircle, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/database';

export function Navbar({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cvsu-green text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">
              CvSU – Silang Campus
            </p>
            <p className="text-xs font-medium text-cvsu-green">
              Lost &amp; Found Management System
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/lost-items" className="text-sm font-medium text-slate-700 hover:text-cvsu-green">
            Lost Items
          </Link>
          <Link href="/found-items" className="text-sm font-medium text-slate-700 hover:text-cvsu-green">
            Found Items
          </Link>
          {profile ? (
            <>
              <Link
                href="/report/lost"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-cvsu-green"
              >
                <PlusCircle className="h-4 w-4" />
                Report Item
              </Link>
              <Link
                href={
                  profile.role === 'admin'
                    ? '/admin'
                    : profile.role === 'personnel'
                    ? '/personnel'
                    : '/dashboard'
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-cvsu-green px-3.5 py-2 text-sm font-semibold text-white hover:bg-cvsu-dark"
              >
                <LayoutDashboard className="h-4 w-4" />
                {profile.role === 'admin'
                  ? 'Admin Portal'
                  : profile.role === 'personnel'
                  ? 'Personnel Desk'
                  : 'My Dashboard'}
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-600"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-cvsu-green">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-cvsu-green px-4 py-2 text-sm font-semibold text-white hover:bg-cvsu-dark"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <Link href="/lost-items" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Browse Lost Items
          </Link>
          <Link href="/found-items" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Browse Found Items
          </Link>
          {profile ? (
            <>
              <Link href="/report/lost" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Report Lost Item
              </Link>
              <Link href="/report/found" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Report Found Item
              </Link>
              <Link href="/dashboard" className="block rounded-md bg-cvsu-green px-3 py-2 text-sm font-semibold text-white">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600">
                Log Out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="w-1/2 rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold">
                Sign In
              </Link>
              <Link href="/register" className="w-1/2 rounded-lg bg-cvsu-green py-2 text-center text-sm font-semibold text-white">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
