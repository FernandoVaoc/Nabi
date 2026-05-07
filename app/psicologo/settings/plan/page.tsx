"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Sparkles, Crown, ShieldCheck, Users, Infinity as InfinityIcon } from 'lucide-react';

// =============================================================================
// 3 paquetes para psicólogos:
//   - basico    : gratis, hasta 5 pacientes
//   - plus      : $299 MXN/mes, hasta 15 pacientes
//   - ilimitado : $599 MXN/mes, pacientes sin límite
// =============================================================================

type PlanKey = 'plus' | 'ilimitado';

const PRICING: Record<PlanKey, Record<string, { total: number; perMonth: number; save: number }>> = {
  plus: {
    mensual:    { total: 299,  perMonth: 299, save: 0 },
    trimestral: { total: 807,  perMonth: 269, save: 10 },
    semestral:  { total: 1434, perMonth: 239, save: 20 },
    anual:      { total: 2511, perMonth: 209, save: 30 },
  },
  ilimitado: {
    mensual:    { total: 599,  perMonth: 599, save: 0 },
    trimestral: { total: 1617, perMonth: 539, save: 10 },
    semestral:  { total: 2874, perMonth: 479, save: 20 },
    anual:      { total: 5031, perMonth: 419, save: 30 },
  },
};

export default function PsicologoPlanPage() {
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

  const plus = PRICING.plus[billingCycle] || PRICING.plus.mensual;
  const ilimitado = PRICING.ilimitado[billingCycle] || PRICING.ilimitado.mensual;

  const handleUpgradeClick = (plan: PlanKey) => {
    const data = PRICING[plan][billingCycle] || PRICING[plan].mensual;
    router.push(`/psicologo/settings/plan/checkout?cycle=${billingCycle}&amount=${data.total}&plan=${plan}`);
  };

  const cycleLabel = billingCycle === 'mensual' ? 'MES'
    : billingCycle === 'trimestral' ? '3 MESES'
    : billingCycle === 'semestral' ? '6 MESES'
    : 'AÑO';

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
       <div className="w-12 h-12 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
       <p className="text-[#1E293B] font-extrabold text-[15px]">Cargando información de tu plan...</p>
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-16 px-4 sm:px-6 lg:px-8 mt-4">

      {/* HEADER HERO */}
      <div className="bg-white/70 backdrop-blur-xl p-10 md:p-14 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white text-center mb-12 relative overflow-hidden flex flex-col items-center">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#6C72F1] opacity-[0.04] rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#3EAFA8] opacity-[0.04] rounded-full blur-[40px] pointer-events-none"></div>

        <div className="w-20 h-20 bg-[#EEF0FF] rounded-[24px] flex items-center justify-center shadow-sm border border-white mb-6 relative z-10">
           <Users className="w-10 h-10 text-[#6C72F1]" strokeWidth={2.5} />
        </div>

        <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#333333] mb-3 tracking-tight z-10 leading-tight">
          Potencia tu práctica clínica
        </h2>
        <p className="text-[#8A95A5] text-[16px] md:text-[18px] max-w-2xl mx-auto font-medium z-10 leading-relaxed">
          Elige el paquete que mejor se ajuste al tamaño de tu agenda. Empieza gratis y crece a tu ritmo.
        </p>
      </div>

      {/* SELECTOR DE CICLO DE FACTURACIÓN */}
      <div className="flex justify-center mb-12 relative z-20">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-[24px] border border-white shadow-sm flex flex-wrap justify-center gap-1 md:gap-2">
          <button onClick={() => setBillingCycle('mensual')}
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center ${billingCycle === 'mensual' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}>
            1 Mes
          </button>
          <button onClick={() => setBillingCycle('trimestral')}
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center gap-2 ${billingCycle === 'trimestral' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}>
            3 Meses
            <span className={`text-[9px] px-2 py-1 rounded-[8px] uppercase tracking-wider ${billingCycle === 'trimestral' ? 'bg-white/20 text-white' : 'bg-[#EEF0FF] text-[#6C72F1]'}`}>-10%</span>
          </button>
          <button onClick={() => setBillingCycle('semestral')}
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center gap-2 ${billingCycle === 'semestral' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}>
            6 Meses
            <span className={`text-[9px] px-2 py-1 rounded-[8px] uppercase tracking-wider ${billingCycle === 'semestral' ? 'bg-white/20 text-white' : 'bg-[#EEF0FF] text-[#6C72F1]'}`}>-20%</span>
          </button>
          <button onClick={() => setBillingCycle('anual')}
            className={`px-5 md:px-6 py-3 text-[13px] md:text-[14px] font-extrabold rounded-[20px] transition-all flex items-center justify-center gap-2 ${billingCycle === 'anual' ? 'bg-[#6C72F1] text-white shadow-md' : 'text-[#8A95A5] hover:text-[#333333] hover:bg-[#F8FAFC]'}`}>
            Anual
            <span className={`text-[9px] px-2 py-1 rounded-[8px] uppercase tracking-wider ${billingCycle === 'anual' ? 'bg-white/20 text-white' : 'bg-[#F0FDFA] text-[#0F766E]'}`}>-30%</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE PLANES (3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">

        {/* ============ PLAN BÁSICO (GRATIS) ============ */}
        <div className={`bg-white/60 backdrop-blur-xl rounded-[40px] p-8 md:p-9 border border-white flex flex-col transition-all ${currentPlan === 'gratis' ? 'shadow-md ring-2 ring-[#3EAFA8]/20' : 'shadow-sm opacity-95'}`}>
          <div className="mb-6">
            <h3 className="text-[22px] font-extrabold text-[#333333] mb-2">Plan Básico</h3>
            <p className="text-[#8A95A5] text-[14px] font-medium leading-relaxed h-12">Ideal para empezar y conocer la plataforma con tus primeros casos.</p>
          </div>

          <div className="mb-6 bg-white/50 p-5 rounded-[24px] border border-white shadow-inner flex flex-col justify-center min-h-[104px]">
            <div className="flex items-baseline gap-1">
              <span className="text-[44px] font-black text-[#333333] leading-none tracking-tight">$0</span>
              <span className="text-[#8A95A5] font-bold text-[13px] uppercase tracking-widest">MXN / Siempre</span>
            </div>
            <p className="text-[12px] text-transparent select-none">Espacio</p>
          </div>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#E5F7F4] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#3EAFA8]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">
                <b className="text-[#333333] font-extrabold">Hasta 5 pacientes</b> vinculados
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#E5F7F4] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#3EAFA8]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Visualización de estado de ánimo diario</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#E5F7F4] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#3EAFA8]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Monitoreo de tareas en tiempo real</p>
            </div>
            <div className="flex gap-3 items-start opacity-40">
              <div className="w-6 h-6 rounded-full bg-[#F8FAFC] flex items-center justify-center flex-shrink-0 border border-white mt-0.5">
                <XCircle className="w-4 h-4 text-[#94A3B8]" strokeWidth={2.5} />
              </div>
              <p className="text-[14px] text-[#94A3B8] font-medium line-through decoration-1">Más de 5 pacientes</p>
            </div>
          </div>

          <button disabled className="w-full py-4 rounded-[20px] font-extrabold text-[13px] uppercase tracking-wider transition-colors mt-auto bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]">
            {currentPlan === 'gratis' ? 'Tu plan actual' : 'Plan básico'}
          </button>
        </div>

        {/* ============ PLAN PLUS ($300) ============ */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[40px] p-8 md:p-9 border-[3px] border-[#6C72F1]/30 shadow-[0_10px_40px_rgba(108,114,241,0.15)] relative flex flex-col md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#EEF0FF] to-white border border-[#6C72F1]/50 text-[#6C72F1] text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 rounded-[12px] flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} /> Más popular
          </div>

          <div className="mb-6 mt-2">
            <h3 className="text-[24px] font-extrabold text-[#333333] mb-2 flex items-center gap-2">
              Nabi Plus
            </h3>
            <p className="text-[#8A95A5] text-[14px] font-medium leading-relaxed h-12">Para consultorios en crecimiento que ya manejan una agenda activa.</p>
          </div>

          <div className="mb-6 p-5 bg-gradient-to-br from-[#EEF0FF]/50 to-white rounded-[24px] border border-white shadow-sm flex flex-col justify-center min-h-[104px]">
            <div className="flex items-end gap-1.5 mb-1">
              <span className="text-[44px] font-black text-[#6C72F1] leading-none tracking-tight">${plus.total}</span>
              <span className="text-[#5C61E1] font-bold text-[13px] pb-1.5 uppercase tracking-widest">
                 MXN / {cycleLabel}
              </span>
            </div>
            {plus.save > 0 ? (
              <p className="text-[11px] text-[#6C72F1] font-bold bg-[#EEF0FF] w-fit px-2 py-0.5 rounded-md border border-white">
                Equivale a ${plus.perMonth} / mes (Ahorras {plus.save}%)
              </p>
            ) : (
              <p className="text-[11px] text-[#5C61E1] font-bold">Pago directo, sin permanencia.</p>
            )}
          </div>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#6C72F1]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Todo lo del plan Básico</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <Users className="w-4 h-4 text-[#6C72F1]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#333333] font-extrabold leading-relaxed">Hasta 15 pacientes vinculados</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#6C72F1]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Insignia de Profesional Verificado</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#EEF0FF] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#6C72F1]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Soporte prioritario por correo</p>
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => handleUpgradeClick('plus')}
              className="w-full py-4 bg-[#6C72F1] hover:bg-[#5C61E1] text-white rounded-[20px] font-extrabold text-[13px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {currentPlan === 'plus' ? 'Tu plan actual' : 'Adquirir Plus'}
            </button>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[#8A95A5]">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Pago 100% Seguro</p>
            </div>
          </div>
        </div>

        {/* ============ PLAN ILIMITADO ($600) ============ */}
        <div className={`bg-white/90 backdrop-blur-xl rounded-[40px] p-8 md:p-9 border-[3px] border-[#FDE047]/60 shadow-[0_10px_40px_rgba(253,224,71,0.15)] relative flex flex-col ${currentPlan === 'ilimitado' || currentPlan === 'premium' ? 'ring-2 ring-[#FDE047]/40' : ''}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] border border-[#FDE047] text-[#D97706] text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 rounded-[12px] flex items-center gap-1.5 shadow-sm">
            <Crown className="w-3.5 h-3.5" strokeWidth={2.5} /> Sin límites
          </div>

          <div className="mb-6 mt-2">
            <h3 className="text-[24px] font-extrabold text-[#333333] mb-2 flex items-center gap-2">
              Nabi Ilimitado
            </h3>
            <p className="text-[#8A95A5] text-[14px] font-medium leading-relaxed h-12">Para clínicas y profesionales con agenda completa, sin tope de pacientes.</p>
          </div>

          <div className="mb-6 p-5 bg-gradient-to-br from-[#FFFBEB] to-white rounded-[24px] border border-[#FEF3C7] shadow-sm flex flex-col justify-center min-h-[104px]">
            <div className="flex items-end gap-1.5 mb-1">
              <span className="text-[44px] font-black text-[#D97706] leading-none tracking-tight">${ilimitado.total}</span>
              <span className="text-[#B45309] font-bold text-[13px] pb-1.5 uppercase tracking-widest">
                MXN / {cycleLabel}
              </span>
            </div>
            {ilimitado.save > 0 ? (
              <p className="text-[11px] text-[#B45309] font-bold bg-[#FEF3C7] w-fit px-2 py-0.5 rounded-md">
                Equivale a ${ilimitado.perMonth} / mes (Ahorras {ilimitado.save}%)
              </p>
            ) : (
              <p className="text-[11px] text-[#B45309] font-bold">Pacientes sin límite.</p>
            )}
          </div>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Todo lo del plan Plus</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <InfinityIcon className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#1E293B] font-extrabold leading-relaxed">Pacientes ilimitados</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Soporte prioritario 24/7</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-white shadow-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#D97706]" strokeWidth={3} />
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed">Acceso a futuras herramientas clínicas</p>
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => handleUpgradeClick('ilimitado')}
              className="w-full py-4 bg-gradient-to-r from-[#FDE047] to-[#F59E0B] hover:from-[#FBBF24] hover:to-[#D97706] text-[#78350F] rounded-[20px] font-extrabold text-[13px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {(currentPlan === 'ilimitado' || currentPlan === 'premium') ? 'Tu plan actual' : 'Adquirir Ilimitado'}
            </button>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[#94A3B8]">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Pago 100% Seguro</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
