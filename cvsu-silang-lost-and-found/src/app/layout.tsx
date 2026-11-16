import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import  Navbar  from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lost and Found Management System | Cavite State University - Silang Campus',
  description:
    'Centralized web-based lost and found platform for Cavite State University - Silang Campus.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Navbar profile={profile} email={user?.email ?? null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
