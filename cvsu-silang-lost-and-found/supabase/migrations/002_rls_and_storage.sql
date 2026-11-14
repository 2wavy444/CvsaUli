-- ============================================================================
-- Row Level Security (RLS) Policies & Storage Buckets
-- ============================================================================

-- Helper function to fetch current user's role safely
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_returns ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_user_role(auth.uid()) IN ('admin', 'personnel'));

CREATE POLICY "Users can update own profile non-role fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- CATEGORIES POLICIES
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins manage categories" ON public.categories
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- ITEM REPORTS POLICIES
CREATE POLICY "Public can view approved/claimed/returned reports" ON public.item_reports
  FOR SELECT USING (
    status IN ('Approved', 'Claimed', 'Returned')
    OR auth.uid() = user_id
    OR public.get_user_role(auth.uid()) IN ('admin', 'personnel')
  );

CREATE POLICY "Authenticated users create own reports" ON public.item_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'Pending Review');

CREATE POLICY "Users edit own pending reports" ON public.item_reports
  FOR UPDATE USING (auth.uid() = user_id AND status = 'Pending Review')
  WITH CHECK (auth.uid() = user_id AND status = 'Pending Review');

CREATE POLICY "Users delete own pending reports" ON public.item_reports
  FOR DELETE USING (auth.uid() = user_id AND status = 'Pending Review');

CREATE POLICY "Staff manage all reports" ON public.item_reports
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'personnel'));

-- CLAIM REQUESTS POLICIES
CREATE POLICY "Users view own claims and staff view all" ON public.claim_requests
  FOR SELECT USING (
    auth.uid() = claimant_id
    OR public.get_user_role(auth.uid()) IN ('admin', 'personnel')
  );

CREATE POLICY "Users submit claims for approved found items" ON public.claim_requests
  FOR INSERT WITH CHECK (
    auth.uid() = claimant_id
    AND status = 'Pending'
    AND EXISTS (
      SELECT 1 FROM public.item_reports
      WHERE id = item_report_id
        AND report_type = 'found'
        AND status = 'Approved'
        AND user_id <> auth.uid()
    )
  );

CREATE POLICY "Only staff update claim decisions" ON public.claim_requests
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'personnel'));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Recipients view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Recipients mark own notifications read" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System and staff insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ACTIVITY LOGS POLICIES (Append-only, immutable)
CREATE POLICY "Admins view activity logs" ON public.activity_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated users append logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Public view published announcements" ON public.announcements
  FOR SELECT USING (is_published = TRUE OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- ITEM RETURNS POLICIES
CREATE POLICY "Staff and involved parties view returns" ON public.item_returns
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'personnel')
    OR EXISTS (
      SELECT 1 FROM public.claim_requests
      WHERE id = claim_request_id AND claimant_id = auth.uid()
    )
  );

CREATE POLICY "Only personnel and admin record item returns" ON public.item_returns
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'personnel'));

-- SUPABASE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('item-images', 'item-images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('claim-attachments', 'claim-attachments', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated upload item images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users delete own item images" ON storage.objects
  FOR DELETE USING (bucket_id = 'item-images' AND auth.uid() = owner);
