"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, ChevronDown, Copy, Shield, ShieldCheck, KeyRound, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PsicologoSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userPlan, setUserPlan] = useState("gratis");

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    linkCode: '',
    age: '',
    gender: '' 
  });

  const [passwordData, setPasswordData] = useState({
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserPlan(profile.plan || 'gratis');
          setProfileData({
            name: profile.full_name || '',
            email: user.email || '',
            linkCode: profile.link_code || 'No asignado',
            age: profile.age?.toString() || '', 
            gender: profile.gender || '' 
          });
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: profileData.name,
          age: profileData.age ? parseInt(profileData.age) : null,
          gender: profileData.gender || null 
        })
        .eq('id', userId);

      if (error) throw error;
      alert("¡Perfil actualizado con éxito!");
      
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;
      
      alert("¡Contraseña actualizada con éxito!");
      setPasswordData({ new: '', confirm: '' }); 
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    if(profileData.linkCode === "No asignado") return;
    navigator.clipboard.writeText(profileData.linkCode);
    alert(`¡Código ${profileData.linkCode} copiado al portapapeles!`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
       <div className="w-12 h-12 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
       <p className="text-[#1E293B] font-extrabold text-[15px]">Cargando tus ajustes clínicos...</p>
    </div>
  );

  // --- CÁLCULO DE INICIALES PROFESIONALES ---
  const names = profileData.name?.split(' ') || ['Doc'];
  const initials = names[0].charAt(0).toUpperCase() + (names.length > 1 ? names[names.length - 1].charAt(0).toUpperCase() : '');

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 lg:px-8 mt-4">
      
      {/* BANNER PANORÁMICO: CÓDIGO DE VINCULACIÓN */}
      <div className="w-full p-8 md:p-12 bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden group">
        
        {/* Decoraciones de fondo sutiles */}
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#6C72F1] opacity-[0.03] rounded-full blur-[40px] pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#3EAFA8] opacity-[0.03] rounded-full blur-[40px] pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 max-w-2xl">
            <h2 className="text-[28px] md:text-[32px] font-extrabold text-[#333333] mb-2 flex items-center gap-3 leading-tight tracking-tight">
              <div className="w-12 h-12 bg-[#EEF0FF] rounded-[20px] flex items-center justify-center border border-white shadow-sm flex-shrink-0">
                <KeyRound className="w-6 h-6 text-[#6C72F1]" strokeWidth={2.5} />
              </div>
              Tu Código de Vinculación
            </h2>
            <p className="text-[15px] font-medium text-[#8A95A5] leading-relaxed max-w-xl pl-[60px]">
              Este es tu identificador único en Nabi. Pide a tus pacientes que ingresen este código al crear su cuenta para que aparezcan automáticamente en tu directorio clínico.
            </p>
        </div>
        
        <div className="relative z-10 w-full md:w-auto shrink-0">
          <button 
            onClick={copyCode}
            className="w-full md:w-auto flex items-center justify-between gap-6 bg-white/80 backdrop-blur-md px-8 py-6 rounded-[28px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group/btn"
            title="Haz clic para copiar"
          >
            <span className="text-[#333333] font-black text-[32px] tracking-[0.15em]">{profileData.linkCode}</span>
            <div className="w-12 h-12 rounded-[20px] bg-[#F8FAFC] flex items-center justify-center group-hover/btn:bg-[#6C72F1] border border-white shadow-sm transition-colors">
              <Copy className="w-5 h-5 text-[#8A95A5] group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA (2/3) - PERFIL PROFESIONAL */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white overflow-hidden flex flex-col relative">
          <form onSubmit={handleSaveProfile} className="p-8 md:p-10 flex flex-col h-full relative z-10">
            
            {/* Cabecera */}
            <div className="flex items-center gap-5 mb-10 border-b border-gray-100/50 pb-8">
              <div className="w-14 h-14 bg-[#EEF0FF] rounded-[20px] flex items-center justify-center text-[#6C72F1] flex-shrink-0 shadow-sm border border-white">
                <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[24px] font-extrabold text-[#333333] mb-1 leading-tight">Perfil Profesional</h2>
                <p className="text-[14px] text-[#8A95A5] font-medium">Gestiona tu identidad clínica y los datos que ven tus pacientes.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-10">
              <div className="relative group">
                {/* --- ADIÓS EMOJI, HOLA INICIALES PROFESIONALES --- */}
                <div className="w-24 h-24 bg-[#EEF0FF] rounded-[28px] flex items-center justify-center text-[32px] font-black text-[#6C72F1] shadow-inner border-[4px] border-white transition-transform duration-300 group-hover:scale-105">
                  <span className="relative z-10">{initials.toUpperCase()}</span>
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-[#333333] text-[16px] mb-1">Tu credencial visible</h3>
                <p className="text-[13px] text-[#8A95A5] font-medium">Así te verán tus pacientes en su aplicación.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 flex-1">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Nombre completo (con título)</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner text-[15px] placeholder:text-[#CBD5E1]"
                  placeholder="Ej. Dra. Silvia Méndez"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Correo de acceso a la cuenta
                </label>
                <input 
                  type="email" 
                  value={profileData.email}
                  disabled
                  className="w-full px-6 py-4 bg-[#F8FAFC]/50 border border-transparent rounded-[24px] text-[#94A3B8] font-medium cursor-not-allowed text-[15px]"
                />
                <p className="text-[11px] text-[#94A3B8] mt-2 pl-2 font-medium">El correo electrónico no puede ser modificado por seguridad.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Edad</label>
                <input 
                  type="number" 
                  placeholder="Ej. 35"
                  value={profileData.age}
                  onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner text-[15px] placeholder:text-[#CBD5E1]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Género</label>
                <div className="relative">
                  <select 
                    value={profileData.gender}
                    onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all appearance-none cursor-pointer shadow-inner text-[15px]"
                  >
                    <option value="" disabled>Selecciona tu género...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="No binario">No binario</option>
                    <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-[#6C72F1]">
                    <ChevronDown className="w-5 h-5" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-gray-100/50 mt-auto">
              <button type="submit" disabled={saving} className="bg-[#6C72F1] hover:bg-[#5C61E1] text-white font-extrabold py-4 px-10 rounded-[20px] transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 w-full md:w-auto text-[14px] uppercase tracking-wider">
                {saving ? 'Guardando cambios...' : 'Guardar información'}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA (1/3) - SUSCRIPCIÓN Y SEGURIDAD */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* NUEVA TARJETA DE SUSCRIPCIÓN (Estilo Premium) */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white overflow-hidden flex flex-col">
            <div className="p-8">
              {(() => {
                const isUnlimited = userPlan === 'ilimitado' || userPlan === 'premium';
                const isPlus = userPlan === 'plus';
                const isPaid = isUnlimited || isPlus;

                const planName = isUnlimited ? 'Nabi Ilimitado' : isPlus ? 'Nabi Plus' : 'Plan Básico';
                const planSubtitle = isUnlimited
                  ? 'Pacientes sin límite'
                  : isPlus
                    ? 'Hasta 15 pacientes vinculados'
                    : 'Hasta 5 pacientes gratis';

                const iconBg = isUnlimited
                  ? 'bg-[#FEF3C7] text-[#D97706]'
                  : isPlus
                    ? 'bg-[#EEF0FF] text-[#6C72F1]'
                    : 'bg-[#F8FAFC] text-[#64748B]';

                const cardBg = isUnlimited
                  ? 'bg-gradient-to-br from-[#FEF3C7]/40 to-[#FFFBEB] border-[#FDE047]/50'
                  : isPlus
                    ? 'bg-gradient-to-br from-[#EEF0FF]/50 to-white border-[#6C72F1]/30'
                    : 'bg-white/50 border-white';

                const titleColor = isUnlimited
                  ? 'text-[#D97706]'
                  : isPlus
                    ? 'text-[#6C72F1]'
                    : 'text-[#333333]';

                const buttonClasses = isPaid
                  ? 'bg-white border-2 border-[#FDE047] text-[#D97706] hover:bg-[#FEF3C7]/50'
                  : 'bg-[#6C72F1] text-white hover:bg-[#5C61E1] shadow-[0_4px_15px_rgba(108,114,241,0.3)]';

                return (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border border-white ${iconBg}`}>
                        <Crown className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-[20px] font-extrabold text-[#333333] mb-1">Suscripción</h2>
                        <p className="text-[13px] text-[#8A95A5] font-medium">Gestiona tu agenda.</p>
                      </div>
                    </div>

                    <div className={`p-6 rounded-[28px] border ${cardBg} mb-8 shadow-sm`}>
                      <p className="text-[10px] font-black text-[#8A95A5] uppercase tracking-[0.15em] mb-1">Plan Actual</p>
                      <h3 className={`text-[24px] font-black tracking-tight ${titleColor}`}>
                        {planName}
                      </h3>
                      <p className="text-[12px] text-[#64748B] font-medium mt-1">{planSubtitle}</p>
                    </div>

                    <Link href="/psicologo/settings/plan" className={`w-full py-4 rounded-[20px] font-extrabold text-[14px] transition-all shadow-sm flex items-center justify-center gap-2 ${buttonClasses}`}>
                      {isPaid ? 'Gestionar plan' : 'Mejorar plan'} <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>

          {/* TARJETA DE SEGURIDAD */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white overflow-hidden flex flex-col flex-1">
            <form onSubmit={handleChangePassword} className="p-8 flex flex-col h-full">
              
              <div className="flex flex-col items-center text-center gap-3 mb-8 border-b border-gray-100/50 pb-8">
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-[24px] flex items-center justify-center text-[#94A3B8] shadow-inner border border-white">
                  <Shield className="w-8 h-8" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-[20px] font-extrabold text-[#333333] mb-1.5">Seguridad</h2>
                  <p className="text-[13px] text-[#8A95A5] font-medium leading-relaxed max-w-[200px] mx-auto">Protege tu acceso y la privacidad de tu consultorio.</p>
                </div>
              </div>

              <div className="flex flex-col gap-5 mb-8 flex-1">
                <div>
                  <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Nueva contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Confirmar nueva contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                    required
                  />
                </div>
                
                <div className="bg-[#F8FAFC]/80 border border-white p-4 rounded-[20px] mt-2 shadow-sm">
                   <p className="text-[11px] font-semibold text-[#8A95A5] leading-relaxed text-center">
                     Debe tener al menos 8 caracteres. Recomendamos usar números y símbolos.
                   </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100/50 mt-auto">
                <button type="submit" className="w-full bg-white border-2 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:text-[#333333] font-extrabold py-4 rounded-[24px] transition-all shadow-sm text-[13px] uppercase tracking-wider">
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}