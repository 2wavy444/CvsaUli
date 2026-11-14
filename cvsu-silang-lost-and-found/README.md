# Cavite State University – Silang Campus
## Web-Based Lost and Found Management System

A production-ready, full-stack Lost and Found Management System built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Zod + React Hook Form**, and **Supabase (PostgreSQL, Auth, Storage, RLS)**, ready for deployment on **Vercel**.

---

### 1. Project Features & Role Architecture
- **Student / Regular User (`student`)**: Register/login, submit Lost & Found reports with photo uploads, track status, submit ownership claim requests, receive persistent in-app notifications, and manage profile.
- **Authorized Campus Personnel (`personnel`)**: Review and verify submitted reports, verify ownership claims with confidential item details, update claim status (`Pending` -> `Under Verification` -> `Approved`/`Rejected`), and record physical item releases (`item_returns`).
- **Administrator (`admin`)**: Full system oversight, statistics & analytics dashboard, report moderation, user role management, category & announcement management, and immutable audit logs.

---

### 2. Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Run Database Migrations in Supabase**
   - Open your Supabase Project Dashboard -> **SQL Editor**.
   - Execute `supabase/migrations/001_initial_schema.sql`.
   - Execute `supabase/migrations/002_rls_and_storage.sql`.

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

### 3. Supabase Authentication & Storage Configuration
1. Go to **Authentication -> URL Configuration** in Supabase:
   - Set **Site URL** to your production Vercel URL (e.g., `https://cvsu-silang-lnf.vercel.app`).
   - Add Redirect URLs: `http://localhost:3000/auth/callback` and `https://your-domain.vercel.app/auth/callback`.
2. Verify that the `item-images` (public read, authenticated upload) and `claim-attachments` (private) buckets were created by `002_rls_and_storage.sql`.
3. To promote your first Admin user, update their role in Supabase Table Editor (`profiles` table -> set `role = 'admin'`).

---

### 4. Vercel Deployment Guide
1. Push this repository to GitHub (ensure `.env.local` is ignored).
2. Import the repository into **Vercel**.
3. In **Vercel Project Settings -> Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your deployed Vercel URL)
4. Click **Deploy**.
