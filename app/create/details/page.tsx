"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function DetailsPage() {
  const [sessionValid, setSessionValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    date_of_death: "",
    tribute_text: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ✅ Verify Stripe session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");
    if (!session_id) return;

    fetch(`/api/checkout/verify?session_id=${session_id}`)
      .then((r) => r.json())
      .then(({ paid }) => setSessionValid(!!paid));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.date_of_death || !file) {
      alert("Please complete all required fields.");
      return;
    }
    setLoading(true);

    try {
      const filename = `${crypto.randomUUID()}-${file.name}`;

      // Upload photo
      const { error: upErr } = await supabase.storage
        .from("memorial-photos")
        .upload(filename, file);

      if (upErr) throw upErr;

      // Save memorial and get new ID
      const { data, error: dbErr } = await supabase
        .from("memorials")
        .insert({
          full_name: form.full_name,
          date_of_death: form.date_of_death,
          tribute_text: form.tribute_text,
          photo_path: `memorial-photos/${filename}`,
          status: "approved",
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;

      // Redirect to success page with ID
      window.location.href = `/create/success?id=${data.id}`;
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Error: " + err.message);
      } else {
        alert("Unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!sessionValid) {
    return <p className="create-subtitle">Validating your payment…</p>;
  }

  return (
    <div className="create-container">
      <h1 className="create-title">Add Memorial Details</h1>
      <p className="create-subtitle">
        Please provide your loved one’s information and upload a meaningful photo.
      </p>

      <form onSubmit={submit} className="memorial-form">
        <div className="form-group">
          <label>Full Name</label>
          <div className="description">
            Enter the full name as it should appear on the memorial
          </div>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Date of Passing</label>
          <div className="description">
            The date will be used to display the memorial on its anniversary
          </div>
          <input
            type="date"
            value={form.date_of_death}
            onChange={(e) => setForm({ ...form, date_of_death: e.target.value })}
            required
          />
        </div>


        <div className="form-group">
          <label>Memorial Photo</label>
          <div className="description">
            Choose a meaningful photo (JPG/PNG)
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) {
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setPreview(ev.target?.result as string);
                reader.readAsDataURL(f);
              }
            }}
            required
          />
          {preview && (
            <div className="photo-preview">
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={300}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "Saving..." : "Submit Memorial"}
        </button>
      </form>

      <div className="price-info">
        Your memorial will be displayed every year on the anniversary date.
      </div>
    </div>
  );
}
