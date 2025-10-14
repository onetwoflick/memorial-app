"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";


export default function EditPage() {
  const params = useParams();
  const code = params.code as string; // ✅ correct for App Router
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    date_of_death: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [memorialId, setMemorialId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // 🔹 Load existing data
  useEffect(() => {
    async function loadSession() {
      if (!code) return;

      // Get session by code
      const { data: session, error: sessionErr } = await supabase
        .from("memorial_sessions")
        .select("memorial_id, used")
        .eq("code", code)
        .single();

      if (sessionErr || !session) {
        alert("Invalid or expired edit link.");
        router.push("/");
        return;
      }

      if (session.used) {
        setLocked(true);
      }

      // If a memorial already exists, load it; otherwise stay with blank form
      if (session.memorial_id) {
        const { data: memorial, error: memorialErr } = await supabase
          .from("memorials")
          .select("*")
          .eq("id", session.memorial_id)
          .single();

        if (memorialErr || !memorial) return;

        setMemorialId(memorial.id);
        setForm({
          full_name: memorial.full_name,
          date_of_death: memorial.date_of_death,
        });
        setExistingPhoto(memorial.photo_path || null);
      }
    }

    loadSession();
  }, [code, router]);

  // 🔹 Handle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) {
      alert("This memorial has been submitted. Please contact an administrator for further changes.");
      return;
    }
    setLoading(true);

    try {
      let photo_path = existingPhoto; // keep old image by default

      // Upload new photo if provided
      if (file) {
        const filename = `${crypto.randomUUID()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("memorial-photos")
          .upload(filename, file, { contentType: file.type });
        if (uploadErr) throw uploadErr;
        photo_path = `memorial-photos/${filename}`;
      }

      // Update memorial
      const upsertPayload: { id?: string; full_name: string; date_of_death: string; photo_path: string | null } = {
        full_name: form.full_name,
        date_of_death: form.date_of_death,
        photo_path: photo_path ?? null,
      };
      if (memorialId) upsertPayload.id = memorialId; // include id only if exists

      const { data, error: dbErr } = await supabase
        .from("memorials")
        .upsert(upsertPayload)
        .select("id")
        .single();

      if (dbErr) throw dbErr;

      // Ensure the session links to this memorial
      await supabase
        .from("memorial_sessions")
        .update({ memorial_id: data.id })
        .eq("code", code);

      alert("✅ Memorial saved successfully!");
      router.push(`/create/success?id=${data.id}`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; error_description?: string };
      const message = errorObj?.message || errorObj?.error_description || "Unknown error";
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function finalizeSubmit() {
    // Double-check that session is not already locked
    const { data: sessionCheck } = await supabase
      .from("memorial_sessions")
      .select("used")
      .eq("code", code)
      .single();
    
    if (sessionCheck?.used) {
      alert("This memorial has already been submitted and is locked.");
      setLocked(true);
      return;
    }

    // Always save latest changes (create or update) first
    try {
      let photo_path = existingPhoto;
      if (file) {
        const filename = `${crypto.randomUUID()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("memorial-photos")
          .upload(filename, file, { contentType: file.type });
        if (uploadErr) throw uploadErr;
        photo_path = `memorial-photos/${filename}`;
      }
      const payload: { id?: string; full_name: string; date_of_death: string; photo_path: string | null } = {
        full_name: form.full_name,
        date_of_death: form.date_of_death,
        photo_path: photo_path ?? null,
      };
      if (memorialId) payload.id = memorialId;
      const { data, error: dbErr } = await supabase
        .from("memorials")
        .upsert(payload)
        .select("id")
        .single();
      if (dbErr) throw dbErr;
      if (!memorialId) {
        await supabase
          .from("memorial_sessions")
          .update({ memorial_id: data.id })
          .eq("code", code);
        setMemorialId(data.id);
      }
    } catch (e: unknown) {
      const errorObj = e as { message?: string };
      alert(errorObj.message || "Failed to save changes before final submit.");
      return;
    }

    if (!confirm("After submitting, you cannot edit without administrator help. Continue?")) return;
    // Mark memorial as approved/final and lock the session
    const { error: memErr } = await supabase
      .from("memorials")
      .update({ status: "approved" })
      .eq("id", memorialId);
    if (memErr) {
      alert(memErr.message);
      return;
    }
    await supabase
      .from("memorial_sessions")
      .update({ used: true })
      .eq("code", code);
    setLocked(true);
    alert("Submitted. Further edits require administrator assistance.");
  }

  // 🔹 Render
  return (
    <div className="create-container">
      <h1 className="create-title">Edit Memorial</h1>
      <p className="create-subtitle">
        Update your loved one’s information and photo below.
      </p>

      <form onSubmit={handleSubmit} className="memorial-form">
        {/* Name */}
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label>Date of Passing</label>
          <input
            type="date"
            value={form.date_of_death}
            onChange={(e) =>
              setForm({ ...form, date_of_death: e.target.value })
            }
            required
          />
        </div>

        {/* Photo */}
        <div className="form-group">
          <label>Memorial Photo</label>
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
                  const img = document.createElement('img');
                  img.onload = () => {
                    const w = (img as HTMLImageElement).naturalWidth;
                    const h = (img as HTMLImageElement).naturalHeight;
                    const minW = 300;
                    const minH = 400;
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
          />
          {imageError && (
            <div className="error-message">{imageError}</div>
          )}

          {/* Existing image */}
          {existingPhoto && !preview && (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${existingPhoto}`}
              alt="Existing memorial photo"
              style={{
                maxWidth: "100%",
                maxHeight: "250px",
                objectFit: "contain",
                borderRadius: "8px",
                marginTop: "1rem",
              }}
            />
          )}

          {/* New preview */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "250px",
                objectFit: "contain",
                borderRadius: "8px",
                marginTop: "1rem",
              }}
            />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="submit-button"
          disabled={loading}
          style={{ marginTop: "1rem" }}
        >
          {loading ? "Saving..." : "Save Memorial"}
        </button>

        <button
          type="button"
          className="submit-button"
          style={{ marginTop: "0.5rem", backgroundColor: locked ? "#7f8c8d" : undefined }}
          onClick={finalizeSubmit}
          disabled={locked}
        >
          {locked ? "Submitted (Locked)" : "Submit Final (Lock Edits)"}
        </button>
      </form>
    </div>
  );
}
