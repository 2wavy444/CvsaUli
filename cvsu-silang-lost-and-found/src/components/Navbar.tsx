'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface UserProfile {
  email: string;
  full_name: string;
  student_id: string;
  department: string;
  role: string;
}

type ProfileInput = {
  full_name?: string | null;
  student_id?: string | null;
  department?: string | null;
  role?: string | null;
  email?: string | null;
} | null;

interface NavbarProps {
  /** Profile row loaded on the server (layout.tsx). Optional. */
  profile?: ProfileInput;
  /** Auth email loaded on the server (layout.tsx). Optional. */
  email?: string | null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function buildProfile(
  data: ProfileInput,
  email: string,
  meta: Record<string, unknown> = {}
): UserProfile {
  return {
    email,
    full_name:
      str(data?.full_name) ||
      str(meta.full_name) ||
      email.split('@')[0] ||
      'Campus User',
    student_id: str(data?.student_id) || str(meta.student_id) || 'N/A',
    department:
      str(data?.department) || str(meta.department) || 'CvSU - Silang',
    role: str(data?.role) || 'student',
  };
}

const PUBLIC_LINKS = [
  { href: '/lost-items', label: 'Lost Items' },
  { href: '/found-items', label: 'Found Items' },
];

export function Navbar({
  profile: initialProfile = null,
  email: initialEmail = null,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';

  // Primitive values from the server so effects don't depend on object identity
  const hasServerProfile = initialProfile !== null;
  const srvName = initialProfile?.full_name ?? null;
  const srvStudentId = initialProfile?.student_id ?? null;
  const srvDepartment = initialProfile?.department ?? null;
  const srvRole = initialProfile?.role ?? null;
  const srvEmail = initialEmail ?? initialProfile?.email ?? '';

  const startedWithServerProfile = useRef(hasServerProfile);

  const [profile, setProfile] = useState<UserProfile | null>(() =>
    initialProfile
      ? buildProfile(initialProfile, initialEmail ?? initialProfile.email ?? '')
      : null
  );
  const [loading, setLoading] = useState(!hasServerProfile);
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

  // Load the signed-in user + profile from the browser
  const loadUser = useCallback(async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, student_id, department, role')
        .eq('id', user.id)
        .single();

      setProfile(
        buildProfile(
          data as ProfileInput,
          user.email ?? '',
          (user.user_metadata ?? {}) as Record<string, unknown>
        )
      );
    } catch (err) {
      console.error('Error loading user profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Keep in sync when the server re-renders the layout (e.g. after router.refresh)
  useEffect(() => {
    if (!hasServerProfile) return;
    setProfile(
      buildProfile(
        {
          full_name: srvName,
          student_id: srvStudentId,
          department: srvDepartment,
          role: srvRole,
        },
        srvEmail
      )
    );
    setLoading(false);
  }, [hasServerProfile, srvName, srvStudentId, srvDepartment, srvRole, srvEmail]);

  // Initial client load (only when the server did not give us a profile) + auth listener
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!startedWithServerProfile.current) {
      void loadUser();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      const e: string = event;

      if (e === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (e === 'SIGNED_IN' || e === 'USER_UPDATED') {
        // Defer: calling Supabase inside this callback can deadlock
        timer = setTimeout(() => {
          void loadUser();
        }, 0);
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [supabase, loadUser]);

  // Close the account dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Close the mobile menu if the screen grows to desktop size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

  const closeAll = () => {
    setMenuOpen(false);
    setMobileNavOpen(false);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const desktopLink = (href: string) =>
    `text-sm font-medium transition ${
      isActive(href)
        ? 'font-semibold text-emerald-700'
        : 'text-slate-600 hover:text-emerald-700'
    }`;

  const mobileLink = (href: string) =>
    `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive(href)
        ? 'bg-emerald-50 text-emerald-800'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  const isStaff = profile?.role === 'admin' || profile?.role === 'personnel';
  const staffHref = profile?.role === 'admin' ? '/admin' : '/personnel';
  const staffLabel =
    profile?.role === 'admin' ? 'Admin Control Panel' : 'Personnel Desk';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href={profile ? '/dashboard' : '/'}
          onClick={closeAll}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <div className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold text-slate-900 sm:text-base">
              CvSU - Silang Campus
            </span>
            <span className="block truncate text-[11px] font-medium text-emerald-700 sm:text-xs">
              Lost &amp; Found Management System
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Main navigation"
        >
          {profile && (
            <Link href="/dashboard" className={desktopLink('/dashboard')}>
              Dashboard
            </Link>
          )}

          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={desktopLink(link.href)}
            >
              {link.label}
            </Link>
          ))}

          {loading ? (
            <div
              className="h-9 w-24 animate-pulse rounded-xl bg-slate-100"
              aria-hidden="true"
            />
          ) : profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
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
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                >
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

                  <div className="mt-2 space-y-1">
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={closeAll}
                      className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Account Info &amp; Profile Settings
                    </Link>

                    {isStaff && (
                      <Link
                        href={staffHref}
                        role="menuitem"
                        onClick={closeAll}
                        className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
                      >
                        {staffLabel}
                      </Link>
                    )}

                    <hr className="my-1 border-slate-100" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
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

      {/* Mobile navigation drawer */}
      {mobileNavOpen && (
        <div
          id="mobile-nav"
          className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden"
        >
          {profile && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="truncate text-sm font-bold text-slate-900">
                {profile.full_name}
              </p>
              <p className="truncate text-xs text-slate-500">{profile.email}</p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                ID: {profile.student_id} &bull; {profile.role.toUpperCase()}
              </p>
            </div>
          )}

          <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
            {profile && (
              <Link
                href="/dashboard"
                onClick={closeAll}
                className={mobileLink('/dashboard')}
              >
                Dashboard
              </Link>
            )}

            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeAll}
                className={mobileLink(link.href)}
              >
                {link.label}
              </Link>
            ))}

            {profile ? (
              <>
                <Link
                  href="/account"
                  onClick={closeAll}
                  className={mobileLink('/account')}
                >
                  Account Info &amp; Settings
                </Link>

                {isStaff && (
                  <Link
                    href={staffHref}
                    onClick={closeAll}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
                  >
                    {staffLabel}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              !loading && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="rounded-lg border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeAll}
                    className="rounded-lg bg-emerald-800 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
