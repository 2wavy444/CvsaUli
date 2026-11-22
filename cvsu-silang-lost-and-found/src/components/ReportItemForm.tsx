'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BackButton from '@/components/BackButton';

interface ReportItemFormProps {
  initialType?: 'lost' | 'found';
}

const CAMPUS_LOCATIONS = [
  'Main Gate / Guardhouse',
  'Administration Building',
  'CEIT / Engineering Building',
  'CAFENR Building',
  'CAS / Arts & Sciences Building',
  'University Library',
  'Student Center / Cafeteria',
  'Gymnasium / Covered Court',
  'Other Campus Area',
];

const CATEGORIES = [
  'ID / Wallet / Cards',
  'Electronics / Phone / Charger',
  'Keys / Lanyard',
  'Books / Notebooks / School Supplies',
  'Bag / Pouch / Umbrella',
  'Clothing / Accessories',
  'Other Item',
];

export default function ReportItemForm({ initialType = 'lost' }: ReportItemFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [reportType, setReportType] = useState<'lost' | 'found'>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setReportType(initialType);
  }, [initialType]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, or GIF).');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      setErrorMsg('Image size must be 5 MB or less.');
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please fill in both the item title and description.');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      let uploadedImageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('item-images').getPublicUrl(filePath);

        uploadedImageUrl = publicUrl;
      }

      const prefix = reportType === 'lost' ? 'LST' : 'FND';
      const referenceCode = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(
        10 + Math.random() * 89
      )}`;

      const payload: Record<string, unknown> = {
        reference_code: referenceCode,
        reporter_id: user.id,
        type: reportType,
        title: title.trim(),
        category,
        location,
        incident_date: new Date(incidentDate).toISOString(),
        description: description.trim(),
        contact_info: contactInfo.trim() || user.email || null,
        status: 'pending',
        image_url: uploadedImageUrl,
      };

      const { error: insertError } = await supabase.from('items').insert(payload);

      if (insertError) {
        // Fallback in case schema uses photo_url instead of image_url
        if (insertError.message.includes('image_url')) {
          delete payload.image_url;
          payload.photo_url = uploadedImageUrl;
          const { error: retryError } = await supabase.from('items').insert(payload);
          if (retryError) throw new Error(retryError.message);
        } else {
          throw new Error(insertError.message);
        }
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to submit report.';
      setErrorMsg(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/dashboard" label="Back to Dashboard" />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {reportType === 'lost' ? 'Report a Lost Item' : 'Report a Found Item'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              CvSU – Silang Campus Lost &amp; Found Verification &amp; Custody Log
            </p>
          </div>

          {/* Type Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setReportType('lost')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                reportType === 'lost'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Item
            </button>
            <button
              type="button"
              onClick={() => setReportType('found')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                reportType === 'found'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Item
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Title & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Item Name / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  reportType === 'lost'
                    ? 'e.g., Black Scientific Calculator or Student ID'
                    : 'e.g., Blue Tumbler or Umbrella'
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Date/Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Campus Location *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Date &amp; Time {reportType === 'lost' ? 'Lost' : 'Found'} *
              </label>
              <input
                type="datetime-local"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Preferred Contact (Phone / Email)
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g., 09171234567 or your cvsu.edu.ph email"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          {/* Picture Upload Box */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Item Picture (Optional — JPG, PNG, WebP up to 5 MB)
            </label>

            {!imagePreview ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40">
                <svg
                  className="mb-2 h-9 w-9 text-emerald-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-semibold text-slate-800">
                  Click to choose a photo of the {reportType} item
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Clear photos help campus staff and owners verify items faster
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={imagePreview}
                    alt="Selected item preview"
                    className="h-40 w-full rounded-xl border border-slate-200 object-cover sm:w-56"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-slate-900">{imageFile?.name}</p>
                    <p className="text-xs text-slate-500">
                      Size: {((imageFile?.size ?? 0) / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                        Change Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Detailed Description &amp; Identifying Marks *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include color, brand, size, stickers, serial/case details, or where exactly you left or found it..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting
                ? 'Submitting & Uploading...'
                : `Submit ${reportType === 'lost' ? 'Lost' : 'Found'} Report`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}