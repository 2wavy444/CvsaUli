'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface ConfirmItemActionProps {
  itemId: string;
  referenceCode: string;
  itemTitle: string;
  itemType: 'lost' | 'found';
  currentStatus: string;
  reporterId: string;
  currentUserId: string | null;
}

export default function ConfirmItemAction({
  itemId,
  referenceCode,
  itemTitle,
  itemType,
  currentStatus,
  reporterId,
  currentUserId,
}: ConfirmItemActionProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [openForm, setOpenForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [handoverLocation, setHandoverLocation] = useState('OSAS / Campus Security Desk');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = Boolean(currentUserId && currentUserId === reporterId);
  const normalizedStatus = currentStatus.toLowerCase();
  const isAlreadyConfirmed =
    normalizedStatus.includes('confirmed') ||
    normalizedStatus.includes('recovered') ||
    normalizedStatus.includes('returned') ||
    normalizedStatus.includes('claimed');

  if (!currentUserId) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-medium text-slate-700">
          {itemType === 'lost'
            ? 'Found this lost item or own this report?'
            : 'Is this your missing item?'}
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Sign In to Confirm Item
        </Link>
      </div>
    );
  }

  // Owner marks their own lost item as recovered
  const handleOwnerConfirmRecovered = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'Recovered' })
        .eq('id', itemId);

      if (error) throw new Error(error.message);

      setSuccessMsg('Confirmed! Your lost item report has been marked as Recovered.');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to confirm item.');
    } finally {
      setSubmitting(false);
    }
  };

  // Finder confirms a lost item OR claimant claims a found item
  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!notes.trim()) {
      setErrorMsg(
        itemType === 'lost'
          ? 'Please enter details about where you found the item or how the owner can retrieve it.'
          : 'Please provide identifying details to verify ownership.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const prefix = itemType === 'lost' ? 'CNF' : 'CLM';
      const claimCode = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(
        10 + Math.random() * 89
      )}`;

      const combinedNotes =
        itemType === 'lost'
          ? `Turned over / Held at: ${handoverLocation} | Contact: ${contactPhone || 'See profile'} | Details: ${notes.trim()}`
          : `Contact: ${contactPhone || 'See profile'} | Ownership Proof: ${notes.trim()}`;

      // 1. Insert confirmation / claim record
      const { error: claimError } = await supabase.from('claims').insert({
        claim_code: claimCode,
        item_id: itemId,
        claimant_id: currentUserId,
        status: itemType === 'lost' ? 'Confirmed Found' : 'Pending Verification',
        staff_notes: combinedNotes,
      });

      if (claimError) throw new Error(claimError.message);

      // 2. Update item status if confirming a lost item
      if (itemType === 'lost') {
        const { error: updateError } = await supabase
          .from('items')
          .update({ status: 'Confirmed Found' })
          .eq('id', itemId);

        if (updateError) throw new Error(updateError.message);
      }

      // 3. Send notification to the original reporter
      if (reporterId && reporterId !== currentUserId) {
        await supabase.from('notifications').insert({
          user_id: reporterId,
          title:
            itemType === 'lost'
              ? `Lost Item Confirmed Found (${referenceCode})`
              : `New Claim Request (${referenceCode})`,
          message:
            itemType === 'lost'
              ? `Someone confirmed finding "${itemTitle}". Location: ${handoverLocation}. Details: ${notes.trim()}`
              : `A user submitted an ownership claim for "${itemTitle}".`,
        });
      }

      setSuccessMsg(
        itemType === 'lost'
          ? `Thank you! Confirmation (${claimCode}) recorded and the owner has been notified.`
          : `Claim request (${claimCode}) submitted! Track its status in your Dashboard.`
      );
      setOpenForm(false);
      setNotes('');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit confirmation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {successMsg}
        </div>
      )}

      {isAlreadyConfirmed && !successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900">
          Status Update: This item is currently marked as{' '}
          <span className="font-bold uppercase">{currentStatus}</span>.
        </div>
      )}

      {/* Owner Action for their own Lost Item */}
      {itemType === 'lost' && isOwner && !isAlreadyConfirmed && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Already found your lost item?</h3>
            <p className="text-xs text-slate-600">
              Confirm recovery to update this listing and close your lost report.
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleOwnerConfirmRecovered}
            className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Confirming...' : 'Confirm Item Recovered'}
          </button>
        </div>
      )}

      {/* Finder Action for a Lost Item OR Claimant Action for a Found Item */}
      {!(itemType === 'lost' && isOwner) && !openForm && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {itemType === 'lost'
                ? 'Did you find or turn over this lost item?'
                : 'Is this found item yours?'}
            </h3>
            <p className="text-xs text-slate-600">
              {itemType === 'lost'
                ? 'Confirm that you located this item so the owner and campus staff can coordinate return.'
                : 'Submit a claim request with identifying details for OSAS verification.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenForm(true)}
            className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            {itemType === 'lost' ? 'Confirm Lost Item Found' : 'Claim This Item'}
          </button>
        </div>
      )}

      {/* Confirmation / Claim Form */}
      {openForm && (
        <form
          onSubmit={handleSubmitConfirmation}
          className="space-y-4 rounded-2xl border border-emerald-200 bg-slate-50 p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {itemType === 'lost'
                ? 'Confirm Lost Item Found'
                : 'Submit Ownership Claim Request'}
            </h3>
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          {itemType === 'lost' && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Where is the item currently located / turned over? *
              </label>
              <select
                value={handoverLocation}
                onChange={(e) => setHandoverLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                <option value="OSAS / Campus Security Desk">
                  Turned over to OSAS / Campus Security Desk
                </option>
                <option value="Main Gate Guardhouse">Turned over to Main Gate Guardhouse</option>
                <option value="Department Faculty Office">
                  Turned over to Department Faculty Office
                </option>
                <option value="With Finder (Ready for Campus Meetup)">
                  Currently with me (Ready for OSAS handover)
                </option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
              Your Contact Number / Messenger
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g., 09171234567"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
              {itemType === 'lost'
                ? 'Confirmation Details (Where & when you found it) *'
                : 'Proof of Ownership (Unique marks, contents, serial number) *'}
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                itemType === 'lost'
                  ? 'Describe where on campus you found the item and who received it...'
                  : 'Describe specific details not visible in the photo to prove this item belongs to you...'
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting
                ? 'Submitting...'
                : itemType === 'lost'
                ? 'Submit Confirmation'
                : 'Submit Claim'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}