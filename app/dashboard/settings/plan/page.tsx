"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Sparkles, Crown, ShieldCheck } from 'lucide-react';

export default function PlanPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("gratis");
  const [loading, setLoading] = useState(true);
  
  const [billingCycle, setBillingCycle] = useState('mensual');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
          if (data) setCurrentPlan(data.plan || 'gratis');
        }
      } catch (error) {
        console.error("Error al obtener el plan:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const getPrice = () => {
    switch (billingCycle) {
      case 'mensual': return { total: 99, perMonth: 99, save: 0 };
      case 'trimestral': return { total: 267, perMonth: 89, save: 10 };
      case 'semestral': return { total: 474, perMonth: 79, save: 20 };
      case 'anual': return { total: 828, perMonth: 69, save: 30 };
      default: return { total: 99, perMonth: 99, save: 0 };
    }
  };

  const { total, perMonth, save } = getPrice();

  const handleUpgradeClick = () => {
    router.push(`/dashboard/settings/plan/checkout?cycle=${billingCycle}&amount=${total}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
       <div className="w-12 h-12 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
       <p className="text-[#1E293B] font-extrabold text-[15px]">Cargando información de tu plan...</p>
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* HEADER HERO ESTILO GLASSMORPHISM */}
      <div className="bg-white/70 backdrop-blur-xl p-10 md:p-14 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white text-center mb-12 relative overflow-hidden flex flex-col items-center mt-2 mx-4 sm:mx-0">
        
        {/* Decoraciones de fondo */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#6C72F1] opacity-[0.04] rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#FDE047] opacity-[0.05] rounded-full blur-[40px] pointer-events-none"></div>

        <div className="w-20 h-20 bg-[#FFFBEB] rounded-[24px] flex items-center justify-center shadow-sm border border-white mb-6 relative z-10">
           <Crown className="w-10 h-10 text-[#D97706]" strokeWidth={2.5} />
        </div>
        
        <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#333333] mb-3 tracking-tight z-10 leading-tight">
          Elige el mejor camino para ti
        </h2>
        <p className="text-[#8A95A5] text-[16px] md:text-[18px] max-w-2xl mx-auto font-medium z-10 leading-relaxed">
          Desbloquea todo el potencial de tu bienestar con un compañero que evoluciona contigo y herramientas clínicas avanzadas.
        </p>
      </div>

      {/* SELECTOR DE CICLO DE FACTURACIÓN (Estilo Píldora/iOS) */}
      <div className="flex justify-center mb-12 relative z-20 px-4">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-[24px] border border-white shadow-sm flex flex-wrap justify-center gap-1 md:gap-2">
          
          <button 
            onClick={() => setBillingCycle('mensual')} 
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center ${billingCycle === 'mensual' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}
          >
            1 Mes
          </button>
          
          <button 
            onClick={() => setBillingCycle('trimestral')} 
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center ${billingCycle === 'trimestral' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}
          >
            3 Meses
          </button>
          
          <button 
            onClick={() => setBillingCycle('semestral')} 
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center gap-2 ${billingCycle === 'semestral' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}
          >
            6 Meses 
            <span className={`text-[9px] px-2 py-1 rounded-[8px] uppercase tracking-wider ${billingCycle === 'semestral' ? 'bg-white/20 text-white' : 'bg-[#EAF1FF] text-[#6C72F1]'}`}>
              -20%
            </span>
          </button>
          
          <button 
            onClick={() => setBillingCycle('anual')} 
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center gap-2 ${billingCycle === 'anual' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}
          >
            Anual 
            <span className={`text-[9px] px-2 py-1 rounded-[8px] uppercase tracking-wider ${billingCycle === 'anual' ? 'bg-white/20 text-white' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
              -30%
            </span>
          </button>

        </div>
      </div>

      {/* TARJETAS DE PLANES (Alineadas y centradas) */}
      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 px-4 max-w-5xl mx-auto">
        
        {/* ======================================================== */}
        {/* PLAN GRATIS (BÁSICO) */}
        {/* ======================================================== */}
        <div className={`bg-white/60 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-white flex flex-col w-full md:w-1/2 transition-all ${currentPlan === 'gratis' ? 'shadow-md scale-[1.02] ring-2 ring-[#6C72F1]/10' : 'shadow-sm opacity-90'}`}>
          
          <div className="mb-8">
            <h3 className="text-[22px] font-extrabold text-[#333333] mb-2">Plan Básico</h3>
            <p className="text-[#8A95A5] text-[14px] h-10 font-medium leading-relaxed">Herramientas esenciales para comenzar tu hábito de salud mental.</p>
          </div>
          
          <div className="mb-8 bg-white/50 p-6 rounded-[24px] border border-white shadow-inner flex items-baseline gap-1">
            <span className="text-[48px] font-black text-[#333333] leading-none tracking-tight">$0</span>
            <span className="text-[#8A95A5] font-bold text-[14px] uppercase tracking-widest">MXN / Siempre</span>
          </div>

          <div className="space-y-5 mb-10 flex-1">
            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#E5F7F4] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3EAFA8]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Registro de estado de ánimo diario</p>
            </div>
            
            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#E5F7F4] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3EAFA8]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#475569] font-medium leading-relaxed">5 tareas diarias de tu ruta clínica</p>
            </div>
            
            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#E5F7F4] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3EAFA8]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Conexión básica con tu psicólogo</p>
            </div>

            {/* SE MUESTRA LA LIMITANTE */}
            <div className="flex gap-4 items-start opacity-40">
               <div className="w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 border border-white mt-0.5">
                  <XCircle className="w-4 h-4 text-[#94A3B8]" strokeWidth={2.5} />
               </div>
               <p className="text-[14px] text-[#94A3B8] font-medium line-through decoration-1">Combinar 2 rutas clínicas</p>
            </div>
            
            <div className="flex gap-4 items-start opacity-40">
               <div className="w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 border border-white mt-0.5">
                  <XCircle className="w-4 h-4 text-[#94A3B8]" strokeWidth={2.5} />
               </div>
               <p className="text-[14px] text-[#94A3B8] font-medium line-through decoration-1">Compañero evolutivo interactivo</p>
            </div>

            <div className="flex gap-4 items-start opacity-40">
               <div className="w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 border border-white mt-0.5">
                  <XCircle className="w-4 h-4 text-[#94A3B8]" strokeWidth={2.5} />
               </div>
               <p className="text-[14px] text-[#94A3B8] font-medium line-through decoration-1">Colección de especies raras</p>
            </div>
          </div>

          <button disabled className={`w-full py-4 rounded-[20px] font-extrabold text-[13px] uppercase tracking-wider transition-colors mt-auto ${currentPlan === 'gratis' ? 'bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]' : 'bg-[#F1F5F9] text-[#CBD5E1]'}`}>
            {currentPlan === 'gratis' ? 'Tu plan actual' : 'Plan Básico'}
          </button>
        </div>

        {/* ======================================================== */}
        {/* PLAN PREMIUM (Luminoso, borde dorado sutil) */}
        {/* ======================================================== */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border-[3px] border-[#FDE047]/60 shadow-[0_10px_40px_rgba(253,224,71,0.15)] flex flex-col w-full md:w-1/2 relative transform md:-translate-y-4">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] border border-[#FDE047] text-[#D97706] text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 rounded-[12px] flex items-center gap-1.5 shadow-sm">
            <Crown className="w-3.5 h-3.5" strokeWidth={2.5} /> Sugerido
          </div>

          <div className="mb-8 mt-2">
            <h3 className="text-[24px] font-extrabold text-[#333333] mb-2 flex items-center gap-2">
              Nabi Premium <Sparkles className="w-6 h-6 text-[#FBBF24]" strokeWidth={2.5} fill="#FEF3C7" />
            </h3>
            <p className="text-[#8A95A5] text-[14px] h-10 font-medium leading-relaxed">La experiencia completa con apoyo interactivo para mantener la motivación.</p>
          </div>
          
          <div className="mb-8 p-6 bg-gradient-to-br from-[#FFFBEB] to-white rounded-[24px] border border-[#FEF3C7] shadow-sm flex flex-col justify-center min-h-[104px]">
            <div className="flex items-end gap-1.5 mb-1.5">
              <span className="text-[48px] font-black text-[#D97706] leading-none tracking-tight">${total}</span>
              <span className="text-[#B45309] font-bold text-[14px] pb-1.5 uppercase tracking-widest">
                 MXN / {billingCycle === 'mensual' ? 'MES' : billingCycle === 'trimestral' ? '3 MESES' : billingCycle === 'semestral' ? '6 MESES' : 'AÑO'}
              </span>
            </div>
            
            {save > 0 ? (
              <p className="text-[12px] text-[#B45309] font-bold bg-[#FEF3C7] w-fit px-2 py-0.5 rounded-md">
                Equivale a ${perMonth} / mes (Ahorras {save}%)
              </p>
            ) : (
              <p className="text-[12px] text-transparent select-none">Espacio</p>
            )}
          </div>

          <div className="space-y-5 mb-10 flex-1">
            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Todo lo del plan Básico</p>
            </div>

            {/* AQUI ESTÁ LA NUEVA FUNCIÓN DESTACADA */}
            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#1E293B] font-extrabold leading-relaxed">Combinar 2 rutas clínicas a la vez</p>
            </div>

            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#1E293B] font-extrabold leading-relaxed">Desbloqueo del Compañero Evolutivo</p>
            </div>

            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Frases de apoyo diario según tu ánimo</p>
            </div>

            <div className="flex gap-4 items-start group">
               <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
               </div>
               <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Colección de mariposas exóticas</p>
            </div>
          </div>

          <div className="mt-auto">
            <button 
              onClick={handleUpgradeClick}
              className="w-full py-4 bg-gradient-to-r from-[#FDE047] to-[#F59E0B] hover:from-[#FBBF24] hover:to-[#D97706] text-[#78350F] rounded-[20px] font-extrabold text-[13px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {currentPlan === 'premium' ? 'Administrar Suscripción' : 'Adquirir Premium'}
            </button>
            
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[#94A3B8]">
               <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">Pago 100% Seguro</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}