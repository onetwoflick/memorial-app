"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [memorialId, setMemorialId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [existingMemorial, setExistingMemorial] = useState<{id: string; full_name: string; date_of_death: string; photo_path: string} | null>(null);

  // ✅ Verify Stripe session and check for existing memorial
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");
    if (!session_id) return;

    setSessionId(session_id);
    
    async function checkSessionAndMemorial() {
      // First verify payment
      const verifyResponse = await fetch(`/api/checkout/verify?session_id=${session_id}`);
      const { paid, code }: { paid?: boolean; code?: string } = await verifyResponse.json();
      
      if (!paid) return;
      
      setSessionValid(true);
      if (code) setEditCode(code);

      // Check if memorial already exists for this session
      const { data: sessionData } = await supabase
        .from("memorial_sessions")
        .select("memorial_id, used")
        .eq("session_id", session_id)
        .single();

      // If session is locked (used: true), redirect to success page
      if (sessionData?.used) {
        window.location.href = `/create/success?session_id=${session_id}`;
        return;
      }

      if (sessionData?.memorial_id) {
        // Load existing memorial
        const { data: memorialData } = await supabase
          .from("memorials")
          .select("*")
          .eq("id", sessionData.memorial_id)
          .single();

        if (memorialData) {
          setExistingMemorial(memorialData);
          setMemorialId(memorialData.id);
          setForm({
            full_name: memorialData.full_name,
            date_of_death: memorialData.date_of_death,
          });
          setPreview(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${memorialData.photo_path}`);
        }
      }
    }

    checkSessionAndMemorial();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.date_of_death || (!file && !existingMemorial)) {
      alert("Please complete all required fields.");
      return;
    }
    if (imageError) {
      alert(imageError);
      return;
    }
    setLoading(true);

    try {
      let photo_path = existingMemorial?.photo_path;

      // Upload new photo if provided
      if (file) {
        const filename = `${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("memorial-photos")
          .upload(filename, file, { contentType: file.type });

        if (upErr) throw upErr;
        photo_path = `memorial-photos/${filename}`;
      }

      // Update existing memorial or create new one
      if (memorialId) {
        // Update existing memorial
        const { error: dbErr } = await supabase
          .from("memorials")
          .update({
            full_name: form.full_name,
            date_of_death: form.date_of_death,
            photo_path,
          })
          .eq("id", memorialId);

        if (dbErr) throw dbErr;
        alert("✅ Memorial updated! Click 'Submit Final' to make it live on the website.");
      } else {
        // Create new memorial
        const { data, error: dbErr } = await supabase
          .from("memorials")
          .insert({
            full_name: form.full_name,
            date_of_death: form.date_of_death,
            photo_path,
            status: "draft",
          })
          .select("id")
          .single();

        if (dbErr) throw dbErr;

        // Link session to memorial
        if (sessionId) {
          await supabase
            .from("memorial_sessions")
            .update({ memorial_id: data.id })
            .eq("session_id", sessionId);
        }

        setMemorialId(data.id);
        alert("✅ Memorial saved! Click 'Submit Final' to make it live on the website.");
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; error_description?: string };
      const message = errorObj?.message || errorObj?.error_description || "Unknown error";
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
          <p className="description">Use this code any time at the <Link href="/edit">Edit page</Link> to resume your memorial.</p>
        </div>
      )}

      {existingMemorial && (
        <div className="edit-code-box" style={{ textAlign: "center", backgroundColor: "#e8f5e8", border: "1px solid #4caf50" }}>
          <p className="description">📝 <strong>Editing existing memorial</strong></p>
          <p className="description">You can update the details below. Changes will be saved to your existing memorial.</p>
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
            {existingMemorial ? "Choose a new photo to replace the current one (optional)" : "Choose a meaningful photo (JPG/PNG)"}
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
            required={!existingMemorial}
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
          {loading ? "Saving..." : (existingMemorial ? "Update Memorial" : "Save Memorial")}
        </button>

        {memorialId && (
          <button
            type="button"
            className="submit-button"
            style={{ marginTop: "0.5rem", backgroundColor: "#27ae60" }}
            onClick={finalizeSubmit}
            disabled={finalizing}
          >
            {finalizing ? "Submitting..." : "Submit Final (Make Live)"}
          </button>
        )}
      </form>

      <div className="price-info">
        Your memorial will be displayed every year on the anniversary date.
      </div>

      {memorialId && (
        <div className="price-info" style={{ backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "8px", padding: "1rem", marginTop: "1rem" }}>
          <strong>Important:</strong> Your memorial is saved but not yet live. Click &quot;Submit Final&quot; above to make it appear on the website.
        </div>
      )}
    </div>
  );

  async function finalizeSubmit() {
    if (!memorialId || !sessionId) return;
    
    // Double-check that session is not already locked
    const { data: sessionCheck } = await supabase
      .from("memorial_sessions")
      .select("used")
      .eq("session_id", sessionId)
      .single();
    
    if (sessionCheck?.used) {
      alert("This memorial has already been submitted and is locked.");
      window.location.href = `/create/success?session_id=${sessionId}`;
      return;
    }
    
    if (!confirm("After submitting, your memorial will be live on the website and you cannot edit without administrator help. Continue?")) return;
    
    setFinalizing(true);
    try {
      // Mark memorial as approved/final
      const { error: memErr } = await supabase
        .from("memorials")
        .update({ status: "approved" })
        .eq("id", memorialId);
      if (memErr) throw memErr;

      // Lock the session
      await supabase
        .from("memorial_sessions")
        .update({ used: true })
        .eq("session_id", sessionId);

      alert("✅ Memorial submitted! It will appear on the website.");
      window.location.href = `/create/success?session_id=${sessionId}`;
    } catch (e: unknown) {
      const errorObj = e as { message?: string };
      alert(errorObj.message || "Failed to submit memorial.");
    } finally {
      setFinalizing(false);
    }
  }
}
