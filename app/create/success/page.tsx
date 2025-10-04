"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

type Memorial = {
  id: string;
  full_name: string;
  date_of_death: string;
  tribute_text: string;
  photo_path: string;
};

export default function SuccessPage() {
  const params = useSearchParams();
  const id = params.get("id");
  const [memorial, setMemorial] = useState<Memorial | null>(null);

  useEffect(() => {
    async function fetchMemorial() {
      if (!id) return;
      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setMemorial(data);
    }
    fetchMemorial();
  }, [id]);

  if (!memorial) return <p>Loading your memorial…</p>;

  const date = new Date(memorial.date_of_death);

  return (
    <div className="create-container">
      <h1 className="create-title">Memorial Created Successfully</h1>
      <p className="create-subtitle">
        Here’s how your memorial will appear on its anniversary date:
      </p>

      <div className="memorial-card" style={{ marginTop: "2rem" }}>
        <div className="memorial-image-wrapper">
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${memorial.photo_path}`}
            alt={`Memorial photo of ${memorial.full_name}`}
            width={400}
            height={300}
            style={{ objectFit: "contain" }}
            className="memorial-image"
          />
        </div>
        <div className="memorial-info">
          <h3 className="memorial-name">{memorial.full_name}</h3>
          <div className="memorial-date">
            In loving memory
            <br />
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          {memorial.tribute_text && (
            <p style={{ marginTop: "1rem", color: "#555" }}>
              {memorial.tribute_text}
            </p>
          )}
        </div>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link href="/" className="cta-button">
          Return Home
        </Link>
      </div>
    </div>
  );
}
