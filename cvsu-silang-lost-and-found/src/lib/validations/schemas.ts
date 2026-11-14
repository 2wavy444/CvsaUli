import { z } from 'zod';

export const registerSchema = z
  .object({
    full_name: z.string().min(3, 'Complete name must be at least 3 characters'),
    student_employee_id: z.string().optional(),
    email: z.string().email('Please enter a valid institutional email address'),
    college_department: z.string().min(2, 'Please select or enter your college/department'),
    contact_number: z.string().min(10, 'Enter a valid Philippine contact number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const reportItemSchema = z.object({
  report_type: z.enum(['lost', 'found']),
  item_name: z.string().min(2, 'Item name is required').max(120),
  category_id: z.string().uuid('Please select a valid category'),
  description: z.string().min(10, 'Please provide a clear description (min 10 chars)'),
  date_event: z.string().min(1, 'Date is required'),
  time_event: z.string().optional(),
  location: z.string().min(3, 'Campus location is required'),
  additional_information: z.string().optional(),
});

export const claimRequestSchema = z.object({
  item_report_id: z.string().uuid('Invalid item report'),
  ownership_description: z
    .string()
    .min(15, 'Provide specific identifying details proving ownership (min 15 chars)'),
  contact_information: z.string().min(7, 'Valid contact number or email is required'),
  supporting_information: z.string().optional(),
});

export const itemReturnSchema = z.object({
  claim_request_id: z.string().uuid(),
  item_report_id: z.string().uuid(),
  received_by: z.string().min(3, 'Recipient full name is required'),
  release_notes: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ReportItemInput = z.infer<typeof reportItemSchema>;
export type ClaimRequestInput = z.infer<typeof claimRequestSchema>;
export type ItemReturnInput = z.infer<typeof itemReturnSchema>;
