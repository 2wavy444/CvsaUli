
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface UserProfile {
  email: string;
  full_name: string;
  student_id: string;
  department: string;
  role: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create Supabase client once
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Load authenticated user and profile
  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!active) return;

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, student_id, department, role')
            .eq('id', user.id)
            .single();

          if (!active) return;

          setProfile({
            email: user.email ?? '',
            full_name:
              data?.full_name ||
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'Campus User',
            student_id:
              data?.student_id ||
              user.user_metadata?.student_id ||
              'N/A',
            department:
              data?.department ||
              user.user_metadata?.department ||
              'CvSU – Silang',
            role: data?.role || 'student',
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);

        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, supabase]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sign out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return;
    }

    setProfile(null);
    setMenuOpen(false);
    setMobileNavOpen(false);

    router.push('/login');
    router.refresh();
  };

  // Active navigation styling
  const navClass = (path: string) =>
    `text-sm font-medium transition ${
      pathname === path
        ? 'text-emerald-700 font-semibold'
        : 'text-slate-600 hover:text-emerald-700'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link
          href={profile ? '/dashboard' : '/'}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <div className="leading-tight">
            <span className="block text-sm font-bold text-slate-900 sm:text-base">
              CvSU – Silang Campus
            </span>

            <span className="block text-xs font-medium text-emerald-700">
              Lost &amp; Found Management System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">

          {profile && (
            <Link href="/dashboard" className={navClass('/dashboard')}>
              Dashboard
            </Link>
          )}

          <Link href="/lost-items" className={navClass('/lost-items')}>
            Lost Items
          </Link>

          <Link href="/found-items" className={navClass('/found-items')}>
            Found Items
          </Link>

          {!loading && profile ? (
            <div className="relative" ref={dropdownRef}>

              {/* Account Button */}
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold uppercase text-white">
                  {profile.full_name.charAt(0)}
                </div>

                <div className="hidden lg:block">
                  <p className="max-w-[140px] truncate text-xs font-semibold text-slate-900">
                    {profile.full_name}
                  </p>

                  <p className="text-[11px] capitalize text-slate-500">
                    {profile.role}
                  </p>
                </div>

                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Account Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">

                  {/* Account Summary */}
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {profile.full_name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {profile.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-800">
                        {profile.role}
                      </span>

                      <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        ID: {profile.student_id}
                      </span>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="mt-2 space-y-1">

                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Account Info &amp; Profile Settings
                    </Link>

                    {(profile.role === 'admin' ||
                      profile.role === 'personnel') && (
                      <Link
                        href={
                          profile.role === 'admin'
                            ? '/admin'
                            : '/personnel'
                        }
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
                      >
                        {profile.role === 'admin'
                          ? 'Admin Control Panel'
                          : 'Personnel Desk'}
                      </Link>
                    )}

                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Switch Account / Login Settings
                    </Link>

                    <hr className="my-1 border-slate-100" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            !loading && (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-emerald-700"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Register
                </Link>
              </div>
            )
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-label="Toggle Menu"
          aria-expanded={mobileNavOpen}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            {mobileNavOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden">

          {/* Mobile User Profile */}
          {profile && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">
                {profile.full_name}
              </p>

              <p className="text-xs text-slate-500">
                {profile.email}
              </p>

              <p className="mt-1 text-xs font-medium text-emerald-700">
                ID: {profile.student_id} • {profile.role.toUpperCase()}
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-2">

            {profile && (
              <Link
                href="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
            )}

            <Link
              href="/lost-items"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Lost Items
            </Link>

            <Link
              href="/found-items"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Found Items
            </Link>

            {profile ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Account Info &amp; Settings
                </Link>

                {(profile.role === 'admin' ||
                  profile.role === 'personnel') && (
                  <Link
                    href={
                      profile.role === 'admin'
                        ? '/admin'
                        : '/personnel'
                    }
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
                  >
                    {profile.role === 'admin'
                      ? 'Admin Control Panel'
                      : 'Personnel Desk'}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-700"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg bg-emerald-800 py-2 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
