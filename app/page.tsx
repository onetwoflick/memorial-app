'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image"; // ✅ import Next.js optimized Image

type Memorial = {
  id: string;
  full_name: string;
  date_of_death: string;
  photo_path: string;
};

export default function HomePage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false); // ✅ prevent SSR hydration mismatch

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    async function fetchMemorials() {
      try {
        const { data, error } = await supabase
          .from("memorials")
          .select("*")
          .eq("status", "approved");

        if (error) {
          console.error("Supabase error:", error.message);
          return;
        }

        console.log("Fetched from Supabase:", data);

        // ✅ safer: compare raw string "MM-DD"
        const todayStr = new Date().toISOString().slice(5, 10); // "MM-DD"
        const todays = (data || []).filter(
          (m) => m.date_of_death.slice(5, 10) === todayStr
        );

        setMemorials(todays);
      } catch (err) {
        console.error("Error fetching memorials:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMemorials();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>Down the Memory Lane</h1>
        <p>Honoring and remembering those who touched our lives</p>
      </div>

      {/* Memorials */}
      {memorials.length > 0 && (
        <div className="memorials-section">
          <div className="memorials-grid">
            {memorials.map((memorial) => {
              const date = new Date(memorial.date_of_death);
              return (
                <div className="memorial-card" key={memorial.id}>
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${memorial.photo_path}`}
                    alt={`Memorial photo of ${memorial.full_name}`}
                    width={400}   // adjust as needed
                    height={300}  // adjust as needed
                    className="memorial-image"
                  />
                  <div className="memorial-info">
                    <h3 className="memorial-name">{memorial.full_name}</h3>
                    <div className="memorial-date">
                      In loving memory
                      <br />
                      {hydrated &&
                        date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No memorials today */}
      {!loading && memorials.length === 0 && (
        <div className="no-memorials">
          <h2 className="cta-title">Create a Lasting Memorial</h2>
          <p className="cta-description">
            Honor your loved one&apos;s memory with a beautiful digital memorial
            that appears every year on their anniversary. Share their story and
            keep their memory alive for generations to come.
          </p>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">🌟</div>
              <h3>Annual Tribute</h3>
              <p>
                Your memorial will be featured every year on the anniversary
                date, keeping their memory alive.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">📸</div>
              <h3>Photo Memorial</h3>
              <p>
                Include a cherished photo that captures their spirit and
                personality.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">💝</div>
              <h3>Lasting Legacy</h3>
              <p>
                Create a permanent digital tribute that family and friends can
                visit year after year.
              </p>
            </div>
          </div>

          <div className="price-tag">One-time fee: $10.00 USD</div>
          <br />
          <a href="/create" className="cta-button">
            Create a Memorial
          </a>
        </div>
      )}
    </div>
  );
}
