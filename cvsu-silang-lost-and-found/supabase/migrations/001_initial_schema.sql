-- ============================================================================
-- Cavite State University - Silang Campus
-- Lost and Found Management System - Initial PostgreSQL Schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_employee_id TEXT,
  email TEXT UNIQUE NOT NULL,
  contact_number TEXT,
  college_department TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'personnel', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Campus Categories
INSERT INTO public.categories (name, description) VALUES
  ('Electronics & Gadgets', 'Smartphones, laptops, tablets, chargers, earphones, power banks'),
  ('IDs & Campus Cards', 'Student IDs, employee IDs, library cards, registration forms'),
  ('Bags & Wallets', 'Backpacks, purses, wallets, coin purses, cardholders'),
  ('Books & Academic Supplies', 'Textbooks, notebooks, lab manuals, calculators, drawing tubes'),
  ('Keys & Access Cards', 'Dorm keys, motorcycle/car keys, padlocks, keychains'),
  ('Clothing & Personal Accessories', 'Jackets, tumblers, eyeglasses, watches, umbrellas'),
  ('Documents & Certificates', 'COR, receipts, clearances, personal folders');

-- 3. ITEM REPORTS TABLE
CREATE TABLE public.item_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('lost', 'found')),
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  date_lost DATE,
  date_found DATE,
  time_lost TIME,
  time_found TIME,
  location TEXT NOT NULL,
  additional_information TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending Review'
    CHECK (status IN ('Pending Review', 'Approved', 'Rejected', 'Claimed', 'Returned', 'Archived')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CLAIM REQUESTS TABLE
CREATE TABLE public.claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL,
  item_report_id UUID NOT NULL REFERENCES public.item_reports(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ownership_description TEXT NOT NULL,
  contact_information TEXT NOT NULL,
  supporting_information TEXT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Under Verification', 'Approved', 'Rejected', 'Completed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_report_id, claimant_id)
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  related_report_id UUID REFERENCES public.item_reports(id) ON DELETE SET NULL,
  related_claim_id UUID REFERENCES public.claim_requests(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ACTIVITY LOGS TABLE
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  related_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ITEM RETURNS TABLE
CREATE TABLE public.item_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_request_id UUID UNIQUE NOT NULL REFERENCES public.claim_requests(id) ON DELETE RESTRICT,
  item_report_id UUID UNIQUE NOT NULL REFERENCES public.item_reports(id) ON DELETE RESTRICT,
  released_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  received_by TEXT NOT NULL,
  release_notes TEXT,
  returned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR SEARCH & FILTERING PERFORMANCE
CREATE INDEX idx_item_reports_type_status ON public.item_reports(report_type, status);
CREATE INDEX idx_item_reports_category ON public.item_reports(category_id);
CREATE INDEX idx_item_reports_user ON public.item_reports(user_id);
CREATE INDEX idx_item_reports_created ON public.item_reports(created_at DESC);
CREATE INDEX idx_claim_requests_item ON public.claim_requests(item_report_id);
CREATE INDEX idx_claim_requests_claimant ON public.claim_requests(claimant_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

-- AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.item_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON public.claim_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- AUTOMATIC PROFILE CREATION ON AUTH SIGNUP (Forces 'student' role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, student_employee_id, email, contact_number, college_department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'CvSU User'),
    NEW.raw_user_meta_data->>'student_employee_id',
    NEW.email,
    NEW.raw_user_meta_data->>'contact_number',
    NEW.raw_user_meta_data->>'college_department',
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
