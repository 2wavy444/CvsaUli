'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { reportItemSchema, type ReportItemInput } from '@/lib/validations/schemas';
import { generateReferenceNumber } from '@/lib/utils/reference';
import type { ReportStatus } from '@/types/database';

export async function createItemReport(input: ReportItemInput, imageUrl: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required to submit a report.' };
  }

  const parsed = reportItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid report fields.' };
  }

  const data = parsed.data;
  const referenceNumber = generateReferenceNumber('LNF');

  const payload = {
    reference_number: referenceNumber,
    user_id: user.id,
    report_type: data.report_type,
    item_name: data.item_name,
    category_id: data.category_id,
    description: data.description,
    date_lost: data.report_type === 'lost' ? data.date_event : null,
    date_found: data.report_type === 'found' ? data.date_event : null,
    time_lost: data.report_type === 'lost' ? data.time_event || null : null,
    time_found: data.report_type === 'found' ? data.time_event || null : null,
    location: data.location,
    additional_information: data.additional_information || null,
    image_url: imageUrl,
    status: 'Pending Review' as ReportStatus,
  };

  const { data: inserted, error } = await supabase
    .from('item_reports')
    .insert(payload)
    .select('id, reference_number')
    .single();

  if (error) {
    return { error: 'Failed to save report to the database. Please try again.' };
  }

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'REPORT_SUBMITTED',
    description: `Submitted ${data.report_type} item report ${referenceNumber} (${data.item_name})`,
    related_record_id: inserted.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/lost-items');
  revalidatePath('/found-items');
  return { success: true, referenceNumber: inserted.reference_number };
}

export async function reviewItemReport(reportId: string, decision: 'Approved' | 'Rejected') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'personnel'].includes(profile.role)) {
    return { error: 'Insufficient permissions to review reports.' };
  }

  const { data: report, error } = await supabase
    .from('item_reports')
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select('id, user_id, reference_number, item_name')
    .single();

  if (error || !report) {
    return { error: 'Unable to update report status.' };
  }

  await supabase.from('notifications').insert({
    user_id: report.user_id,
    title: `Report ${decision}`,
    message: `Your report ${report.reference_number} (${report.item_name}) has been ${decision.toLowerCase()}.`,
    notification_type: `report_${decision.toLowerCase()}`,
    related_report_id: report.id,
  });

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: `REPORT_${decision.toUpperCase()}`,
    description: `Marked report ${report.reference_number} as ${decision}`,
    related_record_id: report.id,
  });

  revalidatePath('/admin');
  revalidatePath('/personnel');
  revalidatePath('/lost-items');
  revalidatePath('/found-items');
  return { success: true };
}
