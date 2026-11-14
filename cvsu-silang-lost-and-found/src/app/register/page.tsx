'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerSchema } from '@/lib/validations/schemas';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: '',
    student_employee_id: '',
    email: '',
    college_department: '',
    contact_number: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your registration details.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          student_employee_id: form.student_employee_id || null,
          contact_number: form.contact_number,
          college_department: form.college_department,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create Campus Account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Register as a student or regular user at Cavite State University – Silang Campus.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Complete Name *</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Student / Employee ID
              </label>
              <input
                type="text"
                value={form.student_employee_id}
                onChange={(e) => setForm({ ...form, student_employee_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                placeholder="202310452"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contact Number *</label>
              <input
                type="tel"
                required
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                placeholder="09171234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Institutional Email Address *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              placeholder="juan.delacruz@cvsu.edu.ph"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              College or Department *
            </label>
            <select
              required
              value={form.college_department}
              onChange={(e) => setForm({ ...form, college_department: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            >
              <option value="">Select Department</option>
              <option value="Department of Information Technology">Department of Information Technology</option>
              <option value="Department of Management">Department of Management</option>
              <option value="Department of Teacher Education">Department of Teacher Education</option>
              <option value="Department of Arts and Sciences">Department of Arts and Sciences</option>
              <option value="Administrative / Campus Personnel">Administrative / Campus Personnel</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password *</label>
              <input
                type="password"
                required
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cvsu-green py-2.5 text-sm font-semibold text-white hover:bg-cvsu-dark disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-cvsu-green hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
