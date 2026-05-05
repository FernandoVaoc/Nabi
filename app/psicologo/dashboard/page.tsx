"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Users, Flame, User, Calendar, Crown, AlertCircle, ArrowRight } from 'lucide-react';

export default function PsicologoDashboardPage() {
  const [realPatients, setRealPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("gratis");
  
  const [stats, setStats] = useState({
    activos: 0,
    conRacha: 0,
    nuevosMes: 0
  });

  const MAX_FREE_PATIENTS = 5;
  const MAX_PLUS_PATIENTS = 15;

  // null = ilimitado
  const getPatientLimit = (plan: string): number | null => {
    if (plan === 'plus') return MAX_PLUS_PATIENTS;
    if (plan === 'ilimitado' || plan === 'premium') return null;
    return MAX_FREE_PATIENTS; // 'gratis' por defecto
  };

  const planDisplayName = (plan: string): string => {
    if (plan === 'plus') return 'Plan Plus';
    if (plan === 'ilimitado' || plan === 'premium') return 'Plan Ilimitado';
    return 'Plan Básico';
  };

  useEffect(() => {
    const fetchMyPatientsAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileRes, patientsRes] = await Promise.all([
          supabase.from('profiles').select('plan').eq('id', user.id).single(),
          supabase.from('profiles').select('id, full_name, selected_route, current_streak, created_at').eq('psychologist_id', user.id)
        ]);

        if (profileRes.data) setUserPlan(profileRes.data.plan || 'gratis');
        const patientsList = patientsRes.data || [];

        // Procesar pacientes para la cuadrícula (Colores sincronizados con el paciente)
        const formattedPatients = patientsList.map(p => {
          const names = p.full_name?.split(' ') || ['U', 'X'];
          let inits = names[0].charAt(0).toUpperCase();
          if (names.length > 1) inits += names[names.length - 1].charAt(0).toUpperCase();

          // Colores de borde suaves basados en la ruta clínica
          let borderColor = "border-t-[#E2E8F0]"; // Default
          if (p.selected_route === 'Ansiedad') borderColor = "border-t-[#6C72F1]"; 
          if (p.selected_route === 'Depresión') borderColor = "border-t-[#FDE047]"; 
          if (p.selected_route === 'Insomnio') borderColor = "border-t-[#8AD8CB]"; 
          if (p.selected_route === 'Procrastinación') borderColor = "border-t-[#3EAFA8]"; 
          if (p.selected_route === 'Duelo') borderColor = "border-t-[#FCA5A5]"; 

          return {
            id: p.id,
            name: p.full_name || 'Paciente',
            initials: inits,
            condition: p.selected_route || 'Sin ruta asignada',
            streak: p.current_streak || 0,
            border: borderColor
          };
        });

        setRealPatients(formattedPatients);

        const activosCount = patientsList.length;
        const conRachaCount = patientsList.filter(p => (p.current_streak || 0) > 0).length;
        const currentMonth = new Date().getMonth();
        const nuevosCount = patientsList.filter(p => new Date(p.created_at).getMonth() === currentMonth).length;

        setStats({
          activos: activosCount,
          conRacha: conRachaCount,
          nuevosMes: nuevosCount
        });

      } catch (error) {
        console.error("Error cargando dashboard del psicólogo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPatientsAndProfile();
  }, []);

  const patientLimit = getPatientLimit(userPlan);
  const isUnlimited = patientLimit === null;
  const isLimitReached = patientLimit !== null && stats.activos >= patientLimit;
  const remaining = patientLimit !== null ? Math.max(patientLimit - stats.activos, 0) : 0;
  const progressPct = patientLimit !== null && patientLimit > 0
    ? Math.min((stats.activos / patientLimit) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9] text-[#1E293B] font-sans relative overflow-hidden pb-24">
      <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pt-6 px-4 sm:px-6 lg:px-8">
        
        {/* TARJETAS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* TARJETA 1: Pacientes Totales */}
          <div className={`p-8 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex flex-col transition-all border border-white relative overflow-hidden h-[220px] ${isLimitReached ? 'bg-[#FFFBEB]/80 backdrop-blur-xl' : 'bg-white/60 backdrop-blur-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1'}`}>
            {!isLimitReached && <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#6C72F1] opacity-[0.04] rounded-full blur-[20px] pointer-events-none"></div>}
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isLimitReached ? 'text-[#D97706]' : 'text-[#8A95A5]'}`}>Total de Pacientes</p>
              <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shadow-sm border border-white ${isLimitReached ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#EEF0FF] text-[#6C72F1]'}`}>
                <Users className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </div>
            
            <h3 className="text-[40px] font-black text-[#333333] mb-2 tracking-tight leading-none relative z-10">
              {loading ? "..." : stats.activos}
              {!isUnlimited && <span className={`text-[20px] ml-1 font-bold ${isLimitReached ? 'text-[#D97706]/70' : 'text-[#94A3B8]'}`}>/ {patientLimit}</span>}
            </h3>

            {!isUnlimited ? (
              <div className="mt-auto pt-4 flex flex-col relative z-10">
                {!isLimitReached ? (
                  <>
                    <div className="w-full bg-white/50 rounded-full h-2.5 mb-2.5 overflow-hidden shadow-inner border border-white">
                      <div className="bg-[#6C72F1] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }}></div>
                    </div>
                    <p className="text-[11px] font-bold text-[#8A95A5]">
                      {planDisplayName(userPlan)} · Te quedan <span className="text-[#6C72F1]">{remaining} cupos</span>
                    </p>
                  </>
                ) : (
                  <Link href="/psicologo/settings/plan" className="mt-1 w-full py-3.5 bg-gradient-to-r from-[#FDE047] to-[#F59E0B] hover:from-[#FBBF24] hover:to-[#D97706] text-[#78350F] rounded-[20px] font-extrabold text-[13px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4" strokeWidth={2.5} /> Ampliar Agenda
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-auto pt-4 relative z-10">
                <p className="text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] bg-[#EEF0FF] px-4 py-2 rounded-full inline-flex items-center gap-1.5 border border-white shadow-sm">
                  <Crown className="w-3.5 h-3.5" strokeWidth={2.5} /> Agenda Ilimitada
                </p>
              </div>
            )}
          </div>

          {/* TARJETA 2: Pacientes con Racha */}
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all relative overflow-hidden h-[220px]">
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#3EAFA8] opacity-[0.04] rounded-full blur-[20px] pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <p className="text-[10px] font-black text-[#8A95A5] uppercase tracking-[0.15em]">Pacientes Constantes</p>
              <div className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-[#E5F7F4] text-[#3EAFA8] shadow-sm border border-white">
                <Flame className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-[40px] font-black text-[#333333] mb-2 tracking-tight leading-none relative z-10">{loading ? "..." : stats.conRacha}</h3>
            <p className="text-[12px] font-medium text-[#8A95A5] mt-auto pt-4 relative z-10">Con racha activa (1+ días)</p>
          </div>

          {/* TARJETA 3: Nuevos este mes */}
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all relative overflow-hidden h-[220px]">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FDE047] opacity-[0.05] rounded-full blur-[20px] pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <p className="text-[10px] font-black text-[#8A95A5] uppercase tracking-[0.15em]">Nuevos este mes</p>
              <div className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-[#FFFBEB] text-[#D97706] shadow-sm border border-white">
                <Calendar className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-[40px] font-black text-[#333333] mb-2 tracking-tight leading-none relative z-10">{loading ? "..." : stats.nuevosMes}</h3>
            <p className="text-[12px] font-medium text-[#8A95A5] mt-auto pt-4 relative z-10">Recientes en tu agenda</p>
          </div>

        </div>

        {/* ADVERTENCIA DE LÍMITE */}
        {isLimitReached && (
          <div className="bg-white/60 backdrop-blur-xl border-l-[6px] border-[#6C72F1] rounded-[32px] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm border-t border-r border-b border-white mb-10">
            <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center flex-shrink-0 text-[#6C72F1] shadow-sm border border-white">
              <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h4 className="text-[18px] font-extrabold text-[#333333] mb-1.5">Has alcanzado tu límite de pacientes</h4>
              <p className="text-[13px] text-[#64748B] font-medium leading-relaxed max-w-3xl">
                {userPlan === 'plus'
                  ? `El plan Plus te permite vincular hasta ${MAX_PLUS_PATIENTS} pacientes. Pásate al plan Ilimitado para crecer sin restricciones.`
                  : `El plan Básico te permite atender a ${MAX_FREE_PATIENTS} pacientes de forma gratuita. Conoce los planes Plus e Ilimitado para ampliar tu agenda.`}
              </p>
            </div>
            <Link href="/psicologo/settings/plan" className="w-full sm:w-auto mt-4 sm:mt-0 whitespace-nowrap bg-[#6C72F1] text-white font-extrabold text-[13px] uppercase tracking-wider px-8 py-4 rounded-[20px] shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg hover:bg-[#5C61E1] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              Ver planes <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        )}

        {/* PACIENTES DESTACADOS */}
        <div>
          <div className="flex justify-between items-end mb-6 px-2">
            <h2 className="text-[22px] font-extrabold text-[#333333] flex items-center gap-3">
               Directorio de Pacientes
            </h2>
            <Link href="/psicologo/pacientes" className="text-[12px] font-black text-[#6C72F1] uppercase tracking-[0.1em] hover:text-[#5C61E1] transition-colors flex items-center gap-1.5 bg-[#EEF0FF] px-4 py-2 rounded-full border border-white shadow-sm">
              Ver todos <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-xl rounded-[40px] border border-white shadow-sm">
              <div className="w-10 h-10 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
              <p className="text-[#8A95A5] font-bold">Cargando pacientes...</p>
            </div>
          ) : realPatients.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl p-16 rounded-[40px] border border-dashed border-[#CBD5E1] text-center shadow-sm">
              <div className="w-20 h-20 bg-[#EEF0FF] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">
                 <User className="w-10 h-10 text-[#6C72F1]" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#333333] mb-2">Aún no tienes pacientes vinculados</h3>
              <p className="text-[#8A95A5] text-[14px] font-medium max-w-md mx-auto leading-relaxed">
                Comparte tu código de vinculación con tus pacientes en consulta para que aparezcan aquí y puedas monitorear su progreso en tiempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {realPatients.map((patient) => (
                <Link 
                  href={`/psicologo/pacientes/${patient.id}`} 
                  key={patient.id} 
                  className={`bg-white/60 backdrop-blur-xl rounded-[32px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white flex flex-col items-center p-8 border-t-[6px] ${patient.border} hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer block group`}
                >
                  <div className="relative mb-5">
                    <div className="w-20 h-20 bg-[#EEF0FF] rounded-[24px] flex items-center justify-center shadow-inner border border-white group-hover:scale-105 transition-transform duration-500">
                      <span className="text-[24px] font-black text-[#6C72F1] tracking-widest">{patient.initials}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[3px] border-white bg-[#3EAFA8] shadow-sm flex items-center justify-center"></div>
                  </div>
                  
                  <h3 className="font-extrabold text-[#333333] text-center text-[16px] mb-1.5 leading-tight">{patient.name}</h3>
                  <p className="text-[12px] font-medium text-[#8A95A5] text-center h-8 leading-tight line-clamp-2">{patient.condition}</p>

                  <div className="w-full mt-5 pt-5 border-t border-gray-100/50 flex flex-col items-center">
                    <p className="text-[9px] font-black text-[#6C72F1] tracking-[0.2em] uppercase mb-2">Racha Actual</p>
                    <p className="font-extrabold text-[#333333] text-[13px] flex items-center justify-center gap-1.5 bg-white px-4 py-2 rounded-[14px] w-full border border-[#E2E8F0] shadow-sm">
                      <Flame className="w-4 h-4 text-[#FDE047]" strokeWidth={2.5} fill="#FEF3C7" /> {patient.streak} días
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}