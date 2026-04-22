"use client";

import { useRouter } from "next/navigation";

export default function EditEntryPage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-[#F4EFEA]/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E8E2D9]">
      <h1 className="font-serif text-3xl text-slate-800 text-center mb-2">Resume Your Memorial</h1>
      <p className="text-center text-slate-500 mb-8">Enter your edit code to continue editing.</p>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const input = form.elements.namedItem('code') as HTMLInputElement | null;
          const code = input?.value?.trim().toUpperCase();
          if (!code) return;
          router.push(`/edit/${code}`);
        }}
        className="flex flex-col gap-6"
      >
        <div>
          <label htmlFor="code" className="block text-sm font-semibold text-slate-700 mb-2">Edit Code</label>
          <input 
            id="code" 
            name="code" 
            type="text" 
            placeholder="e.g. RJXPKV" 
            className="w-full px-4 py-3 rounded-xl border border-[#DED8D0] focus:outline-none focus:ring-2 focus:ring-slate-800 bg-[#FCFBFA] text-slate-800 transition-all text-center tracking-widest font-mono text-xl uppercase"
            required 
          />
        </div>
        <button 
          type="submit" 
          className="w-full py-4 rounded-xl text-white font-semibold text-lg bg-[#990000] hover:bg-[#7a0000] transition-all shadow-md"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
