'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  claimRequestSchema,
  itemReturnSchema,
  type ClaimRequestInput,
  type ItemReturnInput,
} from '@/lib/validations/schemas';
import { generateReferenceNumber } from '@/lib/utils/reference';
import type { ClaimStatus } from '@/types/database';

export async function submitClaimRequest(input: ClaimRequestInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in to submit a claim request.' };

  const parsed = claimRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid claim submission.' };
  }

  const referenceNumber = generateReferenceNumber('CLM');

  const { data: claim, error } = await supabase
    .from('claim_requests')
    .insert({
      reference_number: referenceNumber,
      item_report_id: parsed.data.item_report_id,
      claimant_id: user.id,
      ownership_description: parsed.data.ownership_description,
      contact_information: parsed.data.contact_information,
      supporting_information: parsed.data.supporting_information || null,
      status: 'Pending',
    })
    .select('id, reference_number')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already submitted a claim request for this item.' };
    }
    return { error: 'Unable to submit claim request. Ensure the item is eligible.' };
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Claim Request Received',
    message: `Your claim request ${referenceNumber} has been logged and awaits campus personnel verification.`,
    notification_type: 'claim_received',
    related_report_id: parsed.data.item_report_id,
    related_claim_id: claim.id,
  });

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'CLAIM_SUBMITTED',
    description: `Submitted claim ${referenceNumber}`,
    related_record_id: claim.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/personnel');
  return { success: true, referenceNumber: claim.reference_number };
}

export async function updateClaimDecision(
  claimId: string,
  status: Extract<ClaimStatus, 'Under Verification' | 'Approved' | 'Rejected'>,
  reviewNotes: string
) {
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
    return { error: 'Only authorized campus personnel can review claim requests.' };
  }

  const { data: claim, error } = await supabase
    .from('claim_requests')
    .update({
      status,
      review_notes: reviewNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', claimId)
    .select('id, claimant_id, item_report_id, reference_number')
    .single();

  if (error || !claim) {
    return { error: 'Failed to update claim status.' };
  }

  if (status === 'Approved') {
    await supabase
      .from('item_reports')
      .update({ status: 'Claimed' })
      .eq('id', claim.item_report_id);
  }

  await supabase.from('notifications').insert({
    user_id: claim.claimant_id,
    title: `Claim ${status}`,
    message: `Your claim ${claim.reference_number} is now marked as ${status}. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
    notification_type: 'claim_updated',
    related_report_id: claim.item_report_id,
    related_claim_id: claim.id,
  });

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'CLAIM_REVIEWED',
    description: `Updated claim ${claim.reference_number} to ${status}`,
    related_record_id: claim.id,
  });

  revalidatePath('/personnel');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function recordItemReturn(input: ItemReturnInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = itemReturnSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid release details.' };
  }

  const { error: returnErr } = await supabase.from('item_returns').insert({
    claim_request_id: parsed.data.claim_request_id,
    item_report_id: parsed.data.item_report_id,
    released_by: user.id,
    received_by: parsed.data.received_by,
    release_notes: parsed.data.release_notes || null,
  });

  if (returnErr) {
    return { error: 'Failed to record physical item release.' };
  }

  await supabase
    .from('claim_requests')
    .update({ status: 'Completed' })
    .eq('id', parsed.data.claim_request_id);

  const { data: report } = await supabase
    .from('item_reports')
    .update({ status: 'Returned' })
    .eq('id', parsed.data.item_report_id)
    .select('id, user_id, reference_number, item_name')
    .single();

  if (report) {
    await supabase.from('notifications').insert({
      user_id: report.user_id,
      title: 'Item Officially Returned',
      message: `Found item ${report.reference_number} (${report.item_name}) has been verified and physically released to its owner.`,
      notification_type: 'item_returned',
      related_report_id: report.id,
    });
  }

  revalidatePath('/personnel');
  revalidatePath('/admin');
  revalidatePath('/found-items');
  return { success: true };
}
