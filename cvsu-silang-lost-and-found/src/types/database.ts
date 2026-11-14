export type UserRole = 'student' | 'personnel' | 'admin';

export type ReportType = 'lost' | 'found';

export type ReportStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Claimed'
  | 'Returned'
  | 'Archived';

export type ClaimStatus =
  | 'Pending'
  | 'Under Verification'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

export interface Profile {
  id: string;
  full_name: string;
  student_employee_id: string | null;
  email: string;
  contact_number: string | null;
  college_department: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ItemReport {
  id: string;
  reference_number: string;
  user_id: string;
  report_type: ReportType;
  item_name: string;
  category_id: string | null;
  description: string;
  date_lost: string | null;
  date_found: string | null;
  time_lost: string | null;
  time_found: string | null;
  location: string;
  additional_information?: string | null;
  image_url: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
}

export interface ClaimRequest {
  id: string;
  reference_number: string;
  item_report_id: string;
  claimant_id: string;
  ownership_description: string;
  contact_information: string;
  supporting_information: string | null;
  status: ClaimStatus;
  reviewed_by: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  item_reports?: ItemReport;
  profiles?: Pick<Profile, 'full_name' | 'email' | 'student_employee_id' | 'college_department'>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  related_report_id: string | null;
  related_claim_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
