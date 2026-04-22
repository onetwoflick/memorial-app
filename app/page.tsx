"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

type Memorial = {
  id: string;
  full_name: string;
  date_of_death: string;
  date_of_birth: string | null;
  photo_path: string;
};

export default function HomePage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

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

        setMemorials(data || []);
      } catch (err) {
        console.error("Error fetching memorials:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMemorials();
  }, []);

  // Compute today's memorials
  const { todaysMemorials, birthdayMemorials } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(5, 10); // "MM-DD"
    
    const todaysAnniversaries = memorials.filter(
      (m) => m.date_of_death && m.date_of_death.slice(5, 10) === todayStr
    );
    
    const bdays = memorials.filter(
      (m) => m.date_of_birth && m.date_of_birth.slice(5, 10) === todayStr
    );

    const combined = [...todaysAnniversaries, ...bdays].filter(
      (v, i, a) => a.findIndex(t => (t.id === v.id)) === i
    );

    return { 
      todaysMemorials: combined, 
      birthdayMemorials: bdays,
    };
  }, [memorials]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent pb-24">
      {/* Celebration of Life Banner */}
      {hydrated && birthdayMemorials.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-100 text-amber-900 py-3 px-4 text-center border-b border-amber-200 shadow-sm"
        >
          <span className="text-xl mr-2">✨</span>
          <span className="font-serif italic text-lg">
            Today we celebrate the {birthdayMemorials.length === 1 ? "birthday of" : "birthdays of"} {birthdayMemorials.map(m => m.full_name).join(", ")}
          </span>
          <span className="text-xl ml-2">✨</span>
        </motion.div>
      )}

      {/* Hero */}
      <div className="text-center py-16 px-4 bg-gradient-to-b from-black/5 to-transparent">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-3xl md:text-5xl text-[#1B365D] mb-4"
        >
          Down the Memory Lane
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-slate-500 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto"
        >
          Honoring and remembering those who touched our lives
        </motion.p>
        
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="h-px w-24 bg-[#C8C0B5] mx-auto mt-10"
        />
      </div>

      {/* Title for Results */}
      {hydrated && !loading && todaysMemorials.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mb-6">
          <h3 className="font-serif text-2xl text-[#990000] border-b border-[#C8C0B5]/50 pb-2">
            Today&apos;s Anniversaries & Birthdays
          </h3>
        </div>
      )}

      {/* Memorials Grid */}
      {todaysMemorials.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            {todaysMemorials.map((memorial) => {
              const isBirthday = birthdayMemorials.some(b => b.id === memorial.id);
              return (
                <motion.div 
                  variants={itemVariants}
                  className="break-inside-avoid bg-[#F4EFEA]/95 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-[#E8E2D9] group relative" 
                  key={memorial.id}
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#EFECE8]">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${memorial.photo_path}`}
                      alt={`Memorial photo of ${memorial.full_name}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {isBirthday && (
                      <div className="absolute top-4 right-4 bg-[#F4EFEA]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-amber-700 uppercase tracking-wider shadow-sm">
                        Birthday
                      </div>
                    )}
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-serif text-2xl text-[#1B365D] mb-2">{memorial.full_name}</h3>
                    <div className="text-[#990000] text-xs tracking-widest uppercase font-semibold mb-1">
                      In loving memory
                    </div>
                    <div className="text-slate-600">
                      {hydrated &&
                        new Date(memorial.date_of_death + "T00:00:00").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long", 
                          day: "numeric",
                        })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Empty state if no memorials today */}
      {!loading && todaysMemorials.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto mt-4 px-6 py-12 bg-[#F4EFEA]/95 rounded-3xl shadow-sm border border-[#E8E2D9] text-center"
        >
          <h2 className="font-serif text-3xl text-[#1B365D] mb-4">Create a Lasting Tribute</h2>
          <p className="text-slate-600 text-lg mb-10 font-light">
            Honor your loved one&apos;s memory with a beautiful digital space that appears every year on their anniversary and birthday. Share their story and keep their memory alive.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left mb-10">
            <div className="flex gap-4 items-start">
              <div className="text-3xl">🌟</div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Annual Tribute</h3>
                <p className="text-sm text-slate-500">Featured every year on anniversary dates.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-3xl">📸</div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Photo Memorial</h3>
                <p className="text-sm text-slate-500">Include a cherished photo of their spirit.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-3xl">💝</div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Celebration of Life</h3>
                <p className="text-sm text-slate-500">Special recognition on their birthday.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-3xl">🔒</div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Secure & Private</h3>
                <p className="text-sm text-slate-500">Protected with secure access edit codes.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      <div className="mt-16 text-center px-4">
        <p className="text-[#1B365D] mb-6 max-w-md mx-auto text-lg font-medium">
          Every story deserves to be remembered. Start a memorial today.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/create" className="px-8 py-4 bg-[#990000] text-white rounded-full hover:bg-[#7a0000] transition-colors font-semibold shadow-md">
            Create a Memorial
          </Link>
          <Link href="/edit" className="px-8 py-4 bg-[#F4EFEA] text-[#1B365D] border border-[#C8C0B5] rounded-full hover:bg-[#EFECE8] transition-colors font-medium shadow-sm">
            I Have an Edit Code
          </Link>
        </div>
      </div>
    </div>
  );
}
