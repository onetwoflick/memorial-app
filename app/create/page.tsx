"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ImageCropper from "@/components/ImageCropper";
import PaymentModal from "@/components/PaymentModal";
import getCroppedImg from "@/lib/cropImage";
import imageCompression from "browser-image-compression";

export default function CreatePage() {
  const [form, setForm] = useState({
    full_name: "",
    contact_email: "",
    date_of_death: "",
    date_of_birth: "",
  });
  
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [memorialId, setMemorialId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState<string | null>(null);
  
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  // 2. Handle Cropping Complete
  const handleCropComplete = async (croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    if (!rawImageSrc) return;
    setIsCropping(false);
    
    try {
      const croppedImage = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (!croppedImage) throw new Error("Failed to crop image.");

      // 3. Compress Image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedImage, options);
      
      setCroppedFile(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch (e) {
      console.error(e);
      setErrorMessage("Image processing failed.");
    }
  };

  // 4. Handle Form Submit (Save Draft & Get Payment Intent)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!form.full_name || !form.contact_email || !form.date_of_death || !form.date_of_birth || !croppedFile) {
      setErrorMessage("Please complete all fields and upload a photo.");
      return;
    }

    setLoading(true);

    try {
      // Generate a unique edit code
      const generatedEditCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      setEditCode(generatedEditCode);

      // Upload photo
      const filename = `${crypto.randomUUID()}-${croppedFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("memorial_photos") // Ensure this bucket exists in the new project!
        .upload(filename, croppedFile, { contentType: croppedFile.type });

      if (upErr) {
        // If bucket doesn't exist, this will throw
        throw upErr;
      }
      
      const photo_path = `memorial_photos/${filename}`;

      // Insert memorial as pending/unpaid
      const { data, error: dbErr } = await supabase
        .from("memorials")
        .insert({
          full_name: form.full_name,
          contact_email: form.contact_email,
          date_of_birth: form.date_of_birth,
          date_of_death: form.date_of_death,
          photo_path,
          status: "pending",
          payment_status: "unpaid",
          edit_code: generatedEditCode
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;

      setMemorialId(data.id);

      // Get Payment Intent
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memorialId: data.id,
          email: form.contact_email,
          fullName: form.full_name,
          editCode: generatedEditCode
        })
      });

      const { clientSecret, error } = await res.json();
      if (error) throw new Error(error);

      setClientSecret(clientSecret);

    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save memorial details.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Payment Success
  const handlePaymentSuccess = async () => {
    setClientSecret(null);
    setLoading(true);
    
    try {
      // Update memorial to approved
      const { error } = await supabase
        .from("memorials")
        .update({
          status: "approved",
          payment_status: "paid"
        })
        .eq("id", memorialId);

      if (error) throw error;
      
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Payment succeeded but failed to update status. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl text-center">
        <div className="text-5xl mb-4">✨</div>
        <h1 className="font-serif text-3xl text-slate-800 mb-2">Memorial Published</h1>
        <p className="text-slate-600 mb-8">
          Your tribute is now live. Thank you for creating a beautiful space to remember your loved one.
        </p>
        <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 mb-8 inline-block text-left">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Secret Edit Code</p>
          <div className="font-mono text-2xl tracking-widest text-slate-800 bg-white px-4 py-2 border border-stone-200 rounded-lg select-all">
            {editCode}
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            We have also emailed this code to your receipt email address. Save this code! You will need it if you ever want to update the photo or details.
          </p>
        </div>
        <div>
          <Link href="/" className="px-8 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors inline-block font-medium shadow-md">
            View Memorials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 md:p-10 bg-[#F4EFEA]/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#E8E2D9]">
      <h1 className="font-serif text-3xl md:text-4xl text-slate-800 text-center mb-2">Create a Tribute</h1>
      <p className="text-center text-slate-600 mb-8 max-w-lg mx-auto">
        Share the memory of your loved one. A one-time fee of $10 keeps their tribute visible every year.
      </p>

      {errorMessage && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 text-sm text-center">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-[#DED8D0] focus:outline-none focus:ring-2 focus:ring-slate-800 bg-[#FCFBFA] text-slate-800 transition-all"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            placeholder="e.g. Jane Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Your Email Address</label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-[#DED8D0] focus:outline-none focus:ring-2 focus:ring-slate-800 bg-[#FCFBFA] text-slate-800 transition-all"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            required
            placeholder="For your receipt and secret edit code"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-[#DED8D0] focus:outline-none focus:ring-2 focus:ring-slate-800 bg-[#FCFBFA] text-slate-800 transition-all"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Passing</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-[#DED8D0] focus:outline-none focus:ring-2 focus:ring-slate-800 bg-[#FCFBFA] text-slate-800 transition-all"
              value={form.date_of_death}
              onChange={(e) => setForm({ ...form, date_of_death: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Memorial Photo</label>
          <p className="text-xs text-slate-500 mb-3">Upload a clear, meaningful photo. You can crop it after selecting.</p>
          
          <input
            type="file"
            accept="image/*"
            id="photo-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {!preview ? (
            <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#C8C0B5] rounded-xl bg-[#EFECE8] hover:bg-[#E4DFD7] transition-colors cursor-pointer text-slate-500">
              <span className="text-2xl mb-2">📸</span>
              <span>Click to select photo</span>
            </label>
          ) : (
            <div className="relative w-full sm:w-64 aspect-[3/4] mx-auto rounded-xl overflow-hidden shadow-md group">
              <Image src={preview} alt="Preview" fill className="object-cover" />
              <label htmlFor="photo-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                Change Photo
              </label>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !croppedFile}
          className="mt-4 w-full py-4 rounded-xl text-white font-semibold text-lg bg-[#990000] hover:bg-[#7a0000] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Continue to Payment ($10)"}
        </button>
      </form>

      {isCropping && rawImageSrc && (
        <ImageCropper 
          imageSrc={rawImageSrc} 
          aspect={3/4}
          onCropComplete={handleCropComplete} 
          onCancel={() => setIsCropping(false)} 
        />
      )}

      {clientSecret && (
        <PaymentModal 
          clientSecret={clientSecret} 
          onSuccess={handlePaymentSuccess} 
          onCancel={() => {
            setClientSecret(null);
            setErrorMessage("Payment was cancelled. You can try again when ready.");
          }} 
        />
      )}
    </div>
  );
}
