'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CreatePage() {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', date_of_death: '', tribute_text: '' });

  useEffect(() => {
    // Dev bypass (skip payment if /create?dev=1 in dev mode)
    if (process.env.NODE_ENV === 'development') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === '1') {
        setPaid(true);
        return;
      }
    }

    // Normal payment verification
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get('session_id');
    if (!session_id) return;

    fetch(`/api/checkout/verify?session_id=${session_id}`)
      .then(r => r.json())
      .then(({ paid }) => setPaid(!!paid));
  }, []);

  async function startCheckout() {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!paid) return alert('Please complete payment first.');
    if (!form.full_name || !form.date_of_death || !file) return alert('Fill all required fields.');
    setLoading(true);

    try {
      // 1) Create unique filename
      const filename = `${crypto.randomUUID()}-${file.name}`;

      // 2) Upload file to Supabase Storage
      const { error: upErr } = await supabase
        .storage
        .from('memorial-photos')
        .upload(filename, file);

      if (upErr) {
        setLoading(false);
        return alert('Upload failed: ' + upErr.message);
      }

      // 3) Insert record into DB with bucket prefix in path
      const { error: dbErr } = await supabase.from('memorials').insert({
        full_name: form.full_name,
        date_of_death: form.date_of_death,
        tribute_text: form.tribute_text,
        photo_path: `memorial-photos/${filename}`, // ✅ bucket prefix included
        status: 'approved'
      });

      setLoading(false);
      if (dbErr) return alert('Save failed: ' + dbErr.message);

      alert('Submitted! It will appear each year on that date.');
      window.location.href = '/';
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        alert('Unexpected error: ' + err.message);
      } else {
        alert('Unexpected error');
      }
    }
  }

  return (
    <div className="create-container">
      <h1 className="create-title">Create a Memorial</h1>
      <p className="create-subtitle">
        Honor and remember your loved one with a lasting digital memorial. Share their story and keep their memory alive.
      </p>

      {/* Step 1: Payment */}
      {!paid && (
        <div className="mb-6 text-center">
          <p className="mb-2">Step 1: Pay a one-time fee to unlock the form.</p>
          <button onClick={startCheckout} className="submit-button">
            Pay & Continue
          </button>
        </div>
      )}

      {/* Step 2: Form */}
      <form
        onSubmit={submit}
        className={`memorial-form ${!paid ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="form-group">
          <label>Full Name</label>
          <div className="description">Enter the full name as it should appear on the memorial</div>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Date of Passing</label>
          <div className="description">The date will be used to display the memorial on its anniversary</div>
          <input
            type="date"
            value={form.date_of_death}
            onChange={e => setForm({ ...form, date_of_death: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Memorial Photo</label>
          <div className="description">Choose a meaningful photo (JPG/PNG)</div>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0] ?? null;
              setFile(file);
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => setPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              } else {
                setPreview(null);
              }
            }}
            required
          />
          <div className="photo-preview">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "250px",
                  objectFit: "contain",
                  borderRadius: "8px"
                }}
              />
            ) : (
              "Click or drag a photo here"
            )}
          </div>

        </div>

        {/* <div className="form-group">
          <label>Tribute (Optional)</label>
          <textarea
            rows={3}
            value={form.tribute_text}
            onChange={e => setForm({ ...form, tribute_text: e.target.value })}
          />
        </div> */}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Saving...' : 'Submit Memorial'}
        </button>
      </form>

      <div className="price-info">
        Memorial Entry Fee: $10.00 USD
        <br />
        Your memorial will be displayed every year on the anniversary date
      </div>
    </div>
  );
}
