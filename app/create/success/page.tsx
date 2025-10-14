"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

type Memorial = {
  id: string;
  full_name: string;
  date_of_death: string;
  photo_path: string;
  status?: string;
};

function SuccessContent() {
  const params = useSearchParams();
  const session_id = params.get("session_id");
  const id = params.get("id");
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [memorialStatus, setMemorialStatus] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!session_id && !id) return;

      // Get memorial if already created either by session or id
      let memorialData: Memorial | null = null;
      
      if (id) {
        const { data } = await supabase
          .from("memorials")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        memorialData = (data as Memorial | null) ?? null;
        if (memorialData) setMemorialStatus(memorialData.status || null);
      } else if (session_id) {
        // Resolve memorial via memorial_sessions → memorial_id
        const { data: sess } = await supabase
          .from("memorial_sessions")
          .select("memorial_id")
          .eq("session_id", session_id)
          .maybeSingle();
        if (sess?.memorial_id) {
          const { data } = await supabase
            .from("memorials")
            .select("*")
            .eq("id", sess.memorial_id)
            .maybeSingle();
          memorialData = (data as Memorial | null) ?? null;
          if (memorialData) setMemorialStatus(memorialData.status || null);
        }
      }

      if (memorialData) setMemorial(memorialData);


      // Get edit code from memorial_sessions
      if (session_id) {
        const { data: sessionData } = await supabase
          .from("memorial_sessions")
          .select("code")
          .eq("session_id", session_id)
          .single();
        if (sessionData) setEditCode(sessionData.code);
      }

    }

    fetchData();
  }, [session_id, id]);

  return (
    <div className="create-container">
      <h1 className="create-title">Memorial Created Successfully</h1>

      {/* Removed extra subtitle text per request */}

      {editCode && (
        <div className="edit-code-box" style={{ textAlign: "center" }}>
          <p className="description">Your edit code: <span className="edit-code">{editCode}</span></p>
          <p className="description">Use this code on the <Link href="/edit">Edit page</Link> to return later.</p>
        </div>
      )}

      {memorial && (
        <div className="memorial-card" style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingTop: "1rem" }}>
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${memorial.photo_path}`}
              alt={memorial.full_name}
              width={300}
              height={300}
              style={{ objectFit: "cover", borderRadius: "8px" }}
            />
          </div>
          <div className="memorial-info" style={{ textAlign: "center" }}>
            <h3 className="memorial-name">{memorial.full_name}</h3>
            <div className="memorial-date">
              In loving memory
              <br />
              {(() => {
                const [yy, mm, dd] = memorial.date_of_death.split("-").map(Number);
                const localDate = new Date(yy, (mm || 1) - 1, dd || 1); // local midnight
                return localDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {memorial && memorialStatus === "draft" && (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <div className="price-info" style={{ backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
            <strong>Important:</strong> Your memorial is saved but not yet live on the website. Click &quot;Submit Final&quot; below to make it appear.
          </div>
          <button
            className="submit-button"
            style={{ backgroundColor: "#27ae60" }}
            onClick={finalizeSubmit}
            disabled={finalizing}
          >
            {finalizing ? "Submitting..." : "Submit Final (Make Live)"}
          </button>
          
          {successMessage && (
            <div className="success-message" style={{ 
              backgroundColor: "#d4edda", 
              border: "1px solid #c3e6cb", 
              color: "#155724", 
              padding: "1rem", 
              borderRadius: "8px", 
              marginTop: "1rem",
              textAlign: "center"
            }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="error-message" style={{ 
              backgroundColor: "#f8d7da", 
              border: "1px solid #f5c6cb", 
              color: "#721c24", 
              padding: "1rem", 
              borderRadius: "8px", 
              marginTop: "1rem",
              textAlign: "center"
            }}>
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {showConfirmDialog && (
        <div className="confirmation-dialog" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Confirm Final Submission</h3>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              After submitting, your memorial will be live on the website and you cannot edit without administrator help. Continue?
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: "white",
                  color: "#666",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalize}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "#27ae60",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Submit Final
              </button>
            </div>
          </div>
        </div>
      )}

      {memorial && memorialStatus === "approved" && (
        <div className="price-info" style={{ backgroundColor: "#d4edda", border: "1px solid #c3e6cb", borderRadius: "8px", padding: "1rem", marginTop: "2rem", textAlign: "center" }}>
          <strong>✅ Memorial is live!</strong> Your memorial will appear on the website on the anniversary date.
        </div>
      )}
    </div>
  );

  async function finalizeSubmit() {
    setSuccessMessage(null);
    setErrorMessage(null);
    
    if (!memorial?.id) {
      setErrorMessage("Error: Memorial ID not found. Please try refreshing the page.");
      return;
    }
    
    // Try to find session_id if not available
    let resolvedSessionId = session_id;
    if (!resolvedSessionId) {
      const { data: sessionData } = await supabase
        .from("memorial_sessions")
        .select("session_id")
        .eq("memorial_id", memorial.id)
        .maybeSingle();
      if (sessionData?.session_id) {
        resolvedSessionId = sessionData.session_id;
      }
    }
    
    if (!resolvedSessionId) {
      setErrorMessage("Error: Session ID not found. Please try refreshing the page.");
      return;
    }
    
    setShowConfirmDialog(true);
  }

  async function confirmFinalize() {
    setShowConfirmDialog(false);
    setFinalizing(true);
    try {
      if (!memorial?.id) {
        setErrorMessage("Error: Memorial ID not found. Please try refreshing the page.");
        return;
      }

      // Try to find session_id if not available
      let resolvedSessionId = session_id;
      if (!resolvedSessionId) {
        const { data: sessionData } = await supabase
          .from("memorial_sessions")
          .select("session_id")
          .eq("memorial_id", memorial.id)
          .maybeSingle();
        if (sessionData?.session_id) {
          resolvedSessionId = sessionData.session_id;
        }
      }

      if (!resolvedSessionId) {
        setErrorMessage("Error: Session ID not found. Please try refreshing the page.");
        return;
      }

      // Mark memorial as approved/final
      const { error: memErr } = await supabase
        .from("memorials")
        .update({ status: "approved" })
        .eq("id", memorial.id);
      if (memErr) throw memErr;

      // Lock the session
      const { error: sessionErr } = await supabase
        .from("memorial_sessions")
        .update({ used: true })
        .eq("session_id", resolvedSessionId);
      if (sessionErr) throw sessionErr;

      setMemorialStatus("approved");
      setSuccessMessage("✅ Memorial submitted! It will appear on the website.");
    } catch (e: unknown) {
      const errorObj = e as { message?: string };
      setErrorMessage("Error: " + (errorObj.message || "Failed to submit memorial."));
    } finally {
      setFinalizing(false);
    }
  }
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<p>Loading memorial…</p>}>
      <SuccessContent />
    </Suspense>
  );
}
