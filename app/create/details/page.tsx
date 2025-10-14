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
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // ✅ Verify Stripe session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");
    if (!session_id) return;

    setSessionId(session_id);
    fetch(`/api/checkout/verify?session_id=${session_id}`)
      .then((r) => r.json())
      .then(({ paid, code }) => {
        setSessionValid(!!paid);
        if (paid && code) setEditCode(code);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.date_of_death || !file) {
      alert("Please complete all required fields.");
      return;
    }
    if (imageError) {
      alert(imageError);
      return;
    }
    setLoading(true);

    try {
      const filename = `${crypto.randomUUID()}-${file.name}`;

      // Upload photo
      const { error: upErr } = await supabase.storage
        .from("memorial-photos")
        .upload(filename, file, { contentType: file.type });

      if (upErr) throw upErr;

      // Save memorial and get new ID
      const { data, error: dbErr } = await supabase
        .from("memorials")
        .insert({
          full_name: form.full_name,
          date_of_death: form.date_of_death,
          photo_path: `memorial-photos/${filename}`,
          status: "draft",
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;

      // Ensure the session row links to this memorial
      if (sessionId) {
        await supabase
          .from("memorial_sessions")
          .update({ memorial_id: data.id })
          .eq("session_id", sessionId);
      }

      // Redirect to success page using session_id so the edit code shows
      if (sessionId) {
        window.location.href = `/create/success?session_id=${sessionId}`;
      } else {
        window.location.href = `/create/success?id=${data.id}`;
      }
    } catch (err: unknown) {
      const anyErr = err as any;
      const message = anyErr?.message || anyErr?.error_description || JSON.stringify(anyErr);
      alert("Error: " + message);
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

      {editCode && (
        <div className="edit-code-box" style={{ textAlign: "center" }}>
          <p className="description">Your edit code: <span className="edit-code">{editCode}</span></p>
          <p className="description">Use this code any time at the <a href="/edit">Edit page</a> to resume your memorial.</p>
        </div>
      )}

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
                setImageError(null);
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const dataUrl = ev.target?.result as string;
                  setPreview(dataUrl);
                  // Validate image dimensions (passport-like min), and max bounds
                  const img = document.createElement('img');
                  img.onload = () => {
                    const w = (img as HTMLImageElement).naturalWidth;
                    const h = (img as HTMLImageElement).naturalHeight;
                    const minW = 300; // min passport-ish width
                    const minH = 400; // min passport-ish height
                    const maxW = 3000;
                    const maxH = 3000;
                    if (w < minW || h < minH) {
                      setImageError(`Image too small. Minimum ${minW}x${minH}px.`);
                    } else if (w > maxW || h > maxH) {
                      setImageError(`Image too large. Maximum ${maxW}x${maxH}px.`);
                    } else if (f.size > 5 * 1024 * 1024) {
                      setImageError("Image file too big. Max 5 MB.");
                    } else {
                      setImageError(null);
                    }
                  };
                  img.src = dataUrl;
                };
                reader.readAsDataURL(f);
              }
            }}
            required
          />
          {imageError && <div className="error-message">{imageError}</div>}
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
              <div className="create-subtitle" style={{ marginTop: "0.5rem" }}>Centered caption under the image</div>
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
