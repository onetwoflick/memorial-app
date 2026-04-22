"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ImageCropper from "@/components/ImageCropper";
import getCroppedImg from "@/lib/cropImage";
import imageCompression from "browser-image-compression";

export default function EditPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    date_of_death: "",
    date_of_birth: "",
  });
  
  const [memorialId, setMemorialId] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemorial() {
      if (!code) return;

      const { data: memorial, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("edit_code", code)
        .single();

      if (error || !memorial) {
        setErrorMessage("Invalid or expired edit link.");
        setLoading(false);
        setTimeout(() => {
          router.push("/");
        }, 2000);
        return;
      }

      setMemorialId(memorial.id);
      setForm({
        full_name: memorial.full_name || "",
        date_of_death: memorial.date_of_death || "",
        date_of_birth: memorial.date_of_birth || "",
      });
      setExistingPhoto(memorial.photo_path || null);
      setLoading(false);
    }

    loadMemorial();
  }, [code, router]);

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

  const handleCropComplete = async (croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    if (!rawImageSrc) return;
    setIsCropping(false);
    
    try {
      const croppedImage = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (!croppedImage) throw new Error("Failed to crop image.");

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedImage, options);
      
      setCroppedFile(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Image processing failed.");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      let photo_path = existingPhoto;

      // Upload new photo if provided
      if (croppedFile) {
        const filename = `${crypto.randomUUID()}-${croppedFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("memorial_photos")
          .upload(filename, croppedFile, { contentType: croppedFile.type });
        if (uploadErr) throw uploadErr;
        photo_path = `memorial_photos/${filename}`;
      }

      // Update memorial
      const { error: dbErr } = await supabase
        .from("memorials")
        .update({
          full_name: form.full_name,
          date_of_birth: form.date_of_birth,
          date_of_death: form.date_of_death,
          photo_path,
        })
        .eq("id", memorialId);

      if (dbErr) throw dbErr;

      setSuccessMessage("Memorial updated successfully!");
      if (photo_path) setExistingPhoto(photo_path);
      setCroppedFile(null);
      setPreview(null);
      
    } catch (err: unknown) {
      setErrorMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 text-center text-slate-500">
        Loading memorial details...
      </div>
    );
  }

  if (!memorialId && errorMessage) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 md:p-10 bg-[#F4EFEA]/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#E8E2D9]">
      <h1 className="font-serif text-3xl md:text-4xl text-slate-800 text-center mb-2">Edit Memorial</h1>
      <p className="text-center text-slate-500 mb-8 max-w-lg mx-auto">
        Update your loved one&apos;s information below. Changes will be visible immediately.
      </p>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 mb-6 text-sm text-center font-medium">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 text-sm text-center font-medium">
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
          <p className="text-xs text-slate-500 mb-3">Upload a new photo to replace the current one. You can crop it after selecting.</p>
          
          <input
            type="file"
            accept="image/*"
            id="photo-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <div className="flex justify-center">
            <label htmlFor="photo-upload" className="relative w-full sm:w-64 aspect-[3/4] mx-auto rounded-xl overflow-hidden shadow-md group cursor-pointer bg-[#EFECE8] border-2 border-dashed border-[#C8C0B5] hover:bg-[#E4DFD7] transition-colors">
              {preview ? (
                <Image src={preview} alt="New Preview" fill className="object-cover" />
              ) : existingPhoto ? (
                <Image src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${existingPhoto}`} alt="Existing photo" fill className="object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <span className="text-2xl mb-2">📸</span>
                  <span>Click to select</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                Change Photo
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full py-4 rounded-xl text-white font-semibold text-lg bg-[#990000] hover:bg-[#7a0000] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? "Saving Changes..." : "Save Changes"}
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
    </div>
  );
}
