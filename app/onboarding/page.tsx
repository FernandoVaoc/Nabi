"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Importamos iconos para todas las rutas
import { Wind, Sun, Heart, Moon, Zap, BrainCircuit, ShieldCheck, Activity, Target, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suggestedRoute, setSuggestedRoute] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('suggested_route')
          .eq('id', user.id)
          .single();
        if (data?.suggested_route) setSuggestedRoute(data.suggested_route);
      } catch (err) {
        console.error('Error obteniendo ruta sugerida:', err);
      }
    };
    fetchSuggestion();
  }, []);

  // Nuestras 10 opciones clínicas
  const routes = [
    { id: 'Ansiedad', title: 'Ansiedad', desc: 'Encuentra calma y paz mental en momentos difíciles.', icon: <Wind className="w-8 h-8 text-[#7FA8F8]" />, bg: 'bg-[#EAF1FF]', border: 'border-[#7FA8F8]' },
    { id: 'Depresión', title: 'Depresión', desc: 'Recupera tu energía vital y encuentra esperanza a diario.', icon: <Sun className="w-8 h-8 text-[#FBBF24]" />, bg: 'bg-[#FFFBEB]', border: 'border-[#FBBF24]' },
    { id: 'Duelo', title: 'Duelo', desc: 'Un espacio seguro para procesar la pérdida con compasión.', icon: <Heart className="w-8 h-8 text-[#A78BFA]" />, bg: 'bg-[#F3E8FF]', border: 'border-[#A78BFA]' },
    { id: 'Insomnio', title: 'Insomnio', desc: 'Mejora tu descanso con rutinas de sueño y relajación.', icon: <Moon className="w-8 h-8 text-[#94A3B8]" />, bg: 'bg-[#F1F5F9]', border: 'border-[#94A3B8]' },
    { id: 'Procrastinación', title: 'Procrastinación', desc: 'Vence la postergación y recupera tu enfoque y disciplina.', icon: <Target className="w-8 h-8 text-[#8AD8CB]" />, bg: 'bg-[#E3F2F3]', border: 'border-[#8AD8CB]' },
    
    // LAS 5 NUEVAS RUTAS
    { id: 'TCA', title: 'TCA', desc: 'Sana tu relación con la alimentación y tu cuerpo.', icon: <Heart className="w-8 h-8 text-[#F472B6]" />, bg: 'bg-[#FDF2F8]', border: 'border-[#F472B6]' },
    { id: 'TEPT', title: 'TEPT', desc: 'Técnicas de enraizamiento para el estrés postraumático.', icon: <ShieldCheck className="w-8 h-8 text-[#64748B]" />, bg: 'bg-[#F8FAFC]', border: 'border-[#64748B]' },
    { id: 'Trastorno Bipolar', title: 'T. Bipolar', desc: 'Herramientas para mantener el equilibrio y la constancia.', icon: <Activity className="w-8 h-8 text-[#3B82F6]" />, bg: 'bg-[#EFF6FF]', border: 'border-[#3B82F6]' },
    { id: 'TOC', title: 'TOC', desc: 'Manejo de compulsiones y pensamientos intrusivos.', icon: <BrainCircuit className="w-8 h-8 text-[#D946EF]" />, bg: 'bg-[#FAF5FF]', border: 'border-[#D946EF]' },
    { id: 'TDAH', title: 'TDAH', desc: 'Estrategias para el enfoque, la calma y el déficit de atención.', icon: <Zap className="w-8 h-8 text-[#F59E0B]" />, bg: 'bg-[#FEF3C7]', border: 'border-[#F59E0B]' },
  ];

  const handleSelectRoute = async (routeId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ selected_route: routeId })
        .eq('id', user.id);

      if (error) throw error;

      router.push('/dashboard');

    } catch (error) {
      console.error("Error al guardar la ruta:", error);
      alert("Hubo un error al guardar tu selección. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#EAF1FF]/50 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center mx-auto mb-6 border border-[#E2E8F0]">
             <img src="/logo.png" alt="Nabi Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            ¿En qué área deseas enfocarte?
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Nabi adaptará sus tareas, recordatorios y recomendaciones según lo que necesites hoy. Puedes cambiarlo más adelante.
          </p>

          {suggestedRoute && (
            <div className="mt-6 inline-flex items-center gap-2 bg-[#EEF0FF] text-[#5C61E1] px-5 py-2.5 rounded-full border border-white shadow-sm">
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[12px] font-black uppercase tracking-[0.15em]">
                Sugerida por tu test: {suggestedRoute}
              </span>
            </div>
          )}
        </div>

        {/* CUADRÍCULA DE OPCIONES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {routes.map((route) => {
            const isSuggested = suggestedRoute === route.id;
            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route.id)}
                disabled={loading}
                className={`bg-white p-6 rounded-[32px] text-center hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden disabled:opacity-50 disabled:hover:translate-y-0 flex flex-col items-center ${
                  isSuggested
                    ? 'border-2 border-[#6C72F1] shadow-[0_8px_25px_rgba(108,114,241,0.18)] ring-4 ring-[#EEF0FF]'
                    : 'shadow-sm border border-[#E2E8F0] hover:border-transparent'
                }`}
              >
                {isSuggested && (
                  <span className="absolute top-3 right-3 bg-[#6C72F1] text-white text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full shadow-sm">
                    Sugerida
                  </span>
                )}
                {/* Decoración de fondo en hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${route.bg}`}></div>

                <div className={`w-16 h-16 ${route.bg} rounded-[24px] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 border border-white shadow-inner`}>
                  {route.icon}
                </div>
                <h3 className="text-lg font-extrabold text-[#0F172A] mb-2">{route.title}</h3>
                <p className="text-[#64748B] text-xs font-medium leading-relaxed">{route.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}