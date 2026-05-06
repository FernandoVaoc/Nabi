"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, ChevronDown, Camera, Activity, User as UserIcon, Shield, Crown, Sparkles, Lock, Trash2, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userPlan, setUserPlan] = useState("gratis");

  // Eliminación de cuenta
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    age: '', 
    gender: '',
    route: '',
    secondaryRoute: '' // <-- Agregamos el estado para la segunda ruta
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
            age: profile.age?.toString() || '', 
            gender: profile.gender || '',
            route: profile.selected_route || '',
            secondaryRoute: profile.secondary_route || '' // <-- Traemos la segunda ruta de la DB
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
          selected_route: profileData.route,
          // Por seguridad: si por alguna razón no es premium, guardamos NULL
          secondary_route: userPlan === 'premium' ? (profileData.secondaryRoute || null) : null,
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

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'ELIMINAR') {
      setDeleteError('Escribe ELIMINAR para confirmar.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sesión expirada. Inicia sesión de nuevo.');

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'No pudimos eliminar tu cuenta.');

      await supabase.auth.signOut();
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'Hubo un error eliminando tu cuenta.');
      setDeleting(false);
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
       <div className="w-12 h-12 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
       <p className="text-[#1E293B] font-extrabold text-[15px]">Cargando tus ajustes...</p>
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA (2/3) - INFORMACIÓN PERSONAL Y RUTA  */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white overflow-hidden flex flex-col relative">
          
          {/* Deco de fondo sutil */}
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#6C72F1] opacity-[0.03] rounded-full blur-[40px] pointer-events-none"></div>

          <form onSubmit={handleSaveProfile} className="p-8 md:p-10 flex flex-col h-full relative z-10">
            
            {/* Cabecera */}
            <div className="flex items-center gap-5 mb-10 border-b border-gray-100/50 pb-8">
              <div className="w-14 h-14 bg-[#EEF0FF] rounded-[20px] flex items-center justify-center text-[#6C72F1] flex-shrink-0 shadow-sm border border-white">
                <UserIcon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[24px] font-extrabold text-[#333333] mb-1 leading-tight">Perfil y datos personales</h2>
                <p className="text-[14px] text-[#8A95A5] font-medium">Gestiona tu identidad y las preferencias de tu tratamiento en Nabi.</p>
              </div>
            </div>
            
            {/* Foto de Perfil */}
            <div className="flex items-center gap-6 mb-10">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-[#EEF0FF] to-[#E2E8F0] rounded-[28px] flex items-center justify-center text-4xl font-extrabold text-[#6C72F1] shadow-sm border-[4px] border-white overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <span className="relative z-10 translate-y-1">
                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : '👤'}
                  </span>
                </div>
                <button 
                  type="button"
                  className="absolute -bottom-2 -right-2 bg-[#6C72F1] p-2.5 rounded-full shadow-md border-2 border-white text-white hover:bg-[#5C61E1] transition-all group-hover:scale-110"
                  title="Cambiar foto"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="font-extrabold text-[#333333] text-[16px] mb-1">Avatar de perfil</h3>
                <p className="text-[13px] text-[#8A95A5] font-medium">Por ahora, tu avatar son tus iniciales.</p>
              </div>
            </div>

            {/* ÁREA DE ENFOQUE (Ruta Clínica) - AHORA CON 2 OPCIONES */}
            <div className="mb-10 p-8 bg-gradient-to-r from-[#F0FDFA] to-[#EEF0FF]/50 rounded-[32px] border border-white shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-[80px] opacity-[0.03] grayscale blur-[1px] rotate-12 pointer-events-none">🌿</div>
              
              <div className="relative z-10">
                <label className="text-[11px] font-black text-[#3EAFA8] uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Área de enfoque
                </label>
                <p className="text-[14px] text-[#64748B] mb-6 font-medium leading-relaxed max-w-lg">
                  Selecciona tu ruta clínica principal. <strong className="text-[#3EAFA8]">Los usuarios Premium</strong> pueden elegir una segunda ruta para combinar tareas y personalizar su evolución.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* RUTA 1 - PRINCIPAL */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-[#3EAFA8] uppercase tracking-[0.15em] mb-2 pl-2">Ruta Principal</label>
                    <select 
                      value={profileData.route}
                      onChange={(e) => setProfileData({...profileData, route: e.target.value})}
                      className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-white rounded-[24px] text-[#333333] font-extrabold focus:outline-none focus:ring-4 focus:ring-[#3EAFA8]/20 transition-all appearance-none cursor-pointer shadow-sm text-[14px]"
                    >
                      <option value="" disabled>Elige tu ruta...</option>
                      <option value="Ansiedad">Ansiedad</option>
                      <option value="Depresión">Depresión</option>
                      <option value="Duelo">Duelo</option>
                      <option value="Insomnio">Insomnio</option>
                      <option value="Procrastinación">Procrastinación</option>
                      <option value="TCA">TCA (Cond. Alimentaria)</option>
                      <option value="TDAH">TDAH (Déficit de Atención)</option>
                      <option value="TEPT">TEPT (Estrés Postraumático)</option>
                      <option value="TOC">TOC (Obsesivo-Compulsivo)</option>
                      <option value="Trastorno Bipolar">Trastorno Bipolar</option>
                    </select>
                    <div className="pointer-events-none absolute bottom-0 right-0 top-6 flex items-center px-6 text-[#3EAFA8]">
                      <ChevronDown className="w-5 h-5" strokeWidth={3} />
                    </div>
                  </div>

                  {/* RUTA 2 - SECUNDARIA (PREMIUM) */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-[#D97706] uppercase tracking-[0.15em] mb-2 pl-2 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" strokeWidth={3} /> Ruta Secundaria
                    </label>
                    {userPlan === 'premium' ? (
                      <>
                        <select 
                          value={profileData.secondaryRoute}
                          onChange={(e) => setProfileData({...profileData, secondaryRoute: e.target.value})}
                          className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border border-[#FDE047]/50 rounded-[24px] text-[#333333] font-extrabold focus:outline-none focus:ring-4 focus:ring-[#FDE047]/20 transition-all appearance-none cursor-pointer shadow-sm text-[14px]"
                        >
                          <option value="">Ninguna (Solo la principal)</option>
                          <option value="Ansiedad">Ansiedad</option>
                          <option value="Depresión">Depresión</option>
                          <option value="Duelo">Duelo</option>
                          <option value="Insomnio">Insomnio</option>
                          <option value="Procrastinación">Procrastinación</option>
                          <option value="TCA">TCA (Cond. Alimentaria)</option>
                          <option value="TDAH">TDAH (Déficit de Atención)</option>
                          <option value="TEPT">TEPT (Estrés Postraumático)</option>
                          <option value="TOC">TOC (Obsesivo-Compulsivo)</option>
                          <option value="Trastorno Bipolar">Trastorno Bipolar</option>
                        </select>
                        <div className="pointer-events-none absolute bottom-0 right-0 top-6 flex items-center px-6 text-[#D97706]">
                          <ChevronDown className="w-5 h-5" strokeWidth={3} />
                        </div>
                      </>
                    ) : (
                      <Link href="/dashboard/settings/plan" className="w-full px-6 py-4 bg-[#FFFBEB]/80 backdrop-blur-md border border-[#FDE047]/50 rounded-[24px] text-[#D97706] font-extrabold transition-all shadow-sm flex items-center justify-between text-[13px] hover:bg-[#FEF3C7] group cursor-pointer h-[54px]">
                        <span>Desbloquear 2ª ruta</span>
                        <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                      </Link>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Grid de Inputs Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 flex-1">
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Nombre completo</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[20px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Correo electrónico
                </label>
                <input 
                  type="email" 
                  value={profileData.email}
                  disabled
                  className="w-full px-6 py-4 bg-[#F8FAFC]/50 border border-transparent rounded-[20px] text-[#94A3B8] font-medium cursor-not-allowed text-[15px]"
                />
                <p className="text-[11px] text-[#94A3B8] mt-2 pl-2 font-medium">El correo de acceso no puede ser modificado.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Edad</label>
                <input 
                  type="number" 
                  placeholder="Ej. 28"
                  value={profileData.age}
                  onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[20px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Género</label>
                <div className="relative">
                  <select 
                    value={profileData.gender}
                    onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[20px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all appearance-none cursor-pointer shadow-inner text-[15px]"
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
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* COLUMNA DERECHA (1/3) - PLAN Y SEGURIDAD                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* NUEVA TARJETA DE SUSCRIPCIÓN */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white overflow-hidden flex flex-col">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border border-white ${userPlan === 'premium' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F8FAFC] text-[#64748B]'}`}>
                  <Crown className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] font-extrabold text-[#333333] mb-1">Tu Suscripción</h2>
                  <p className="text-[13px] text-[#8A95A5] font-medium">Gestiona tu plan actual.</p>
                </div>
              </div>

              <div className={`p-6 rounded-[28px] border ${userPlan === 'premium' ? 'bg-gradient-to-br from-[#FEF3C7]/40 to-[#FFFBEB] border-[#FDE047]/50' : 'bg-white/50 border-white'} mb-8 shadow-sm`}>
                <p className="text-[10px] font-black text-[#8A95A5] uppercase tracking-[0.15em] mb-1">Plan Actual</p>
                <h3 className={`text-[24px] font-black tracking-tight ${userPlan === 'premium' ? 'text-[#D97706]' : 'text-[#333333]'}`}>
                  {userPlan === 'premium' ? 'Nabi Premium' : 'Plan Básico'}
                </h3>
              </div>

              <Link href="/dashboard/settings/plan" className={`w-full py-4 rounded-[20px] font-extrabold text-[14px] transition-all shadow-sm flex items-center justify-center gap-2 ${userPlan === 'premium' ? 'bg-white border-2 border-[#FDE047] text-[#D97706] hover:bg-[#FEF3C7]/50' : 'bg-[#6C72F1] text-white hover:bg-[#5C61E1] shadow-[0_4px_15px_rgba(108,114,241,0.3)]'}`}>
                {userPlan === 'premium' ? 'Gestionar plan' : 'Mejorar a Premium'} <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              </Link>
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
                  <p className="text-[13px] text-[#8A95A5] font-medium leading-relaxed max-w-[200px] mx-auto">Protege el acceso a tu espacio seguro.</p>
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
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[20px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Confirmar contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[20px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                    required
                  />
                </div>

                <div className="bg-[#F8FAFC]/80 border border-white p-4 rounded-[20px] mt-2 shadow-sm">
                   <p className="text-[11px] font-semibold text-[#8A95A5] leading-relaxed text-center">
                     Debe tener al menos 8 caracteres. Recomendamos usar letras y números.
                   </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100/50 mt-auto">
                <button type="submit" className="w-full bg-white border-2 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:text-[#333333] font-extrabold py-4 rounded-[20px] transition-all shadow-sm text-[13px] uppercase tracking-wider">
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </div>

          {/* ZONA DE PELIGRO - ELIMINAR CUENTA */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-[#FECACA]/40 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border border-white bg-[#FEF2F2] text-[#EF4444]">
                  <Trash2 className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold text-[#333333] mb-1">Zona de peligro</h2>
                  <p className="text-[12px] text-[#8A95A5] font-medium leading-relaxed">Esta acción es permanente.</p>
                </div>
              </div>

              <p className="text-[12px] text-[#64748B] font-medium leading-relaxed mb-5 bg-[#FEF2F2]/60 border border-[#FECACA]/50 p-4 rounded-[16px]">
                Al eliminar tu cuenta perderás tu progreso, tus tareas, tu compañero, tus registros de ánimo y los resultados de tu test inicial.
              </p>

              <button
                type="button"
                onClick={() => { setDeleteError(''); setDeleteConfirm(''); setDeleteModalOpen(true); }}
                className="w-full bg-white border-2 border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEF2F2] font-extrabold py-4 rounded-[20px] transition-all shadow-sm text-[13px] uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} /> Eliminar mi cuenta
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200 border border-white">
            <button
              type="button"
              onClick={() => !deleting && setDeleteModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] transition"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>

            <div className="w-16 h-16 mx-auto bg-[#FEF2F2] rounded-[24px] flex items-center justify-center mb-5 border border-[#FECACA]/50">
              <AlertTriangle className="w-8 h-8 text-[#EF4444]" strokeWidth={2.5} />
            </div>

            <h2 className="text-[22px] font-extrabold text-[#1E293B] text-center mb-2 leading-tight">
              ¿Eliminar tu cuenta?
            </h2>
            <p className="text-[13px] text-[#64748B] text-center font-medium leading-relaxed mb-6">
              Esta acción es <b className="text-[#EF4444]">permanente</b>. Se borrarán tu perfil, tareas, compañero, registros emocionales, test inicial y notificaciones. No podrás deshacer este paso.
            </p>

            <label className="block text-[10px] font-black text-[#EF4444] uppercase tracking-[0.15em] mb-2 pl-1">
              Para confirmar, escribe <b>ELIMINAR</b>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              disabled={deleting}
              placeholder="ELIMINAR"
              className="w-full px-5 py-3.5 bg-white border-2 border-[#FCA5A5] rounded-[16px] text-[#1E293B] font-extrabold focus:outline-none focus:border-[#EF4444] focus:ring-4 focus:ring-[#FEE2E2] transition-all placeholder:text-[#FCA5A5] text-[14px] tracking-widest"
            />

            {deleteError && (
              <p className="mt-3 text-[12px] text-[#B91C1C] font-bold text-center">{deleteError}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="py-3.5 rounded-[16px] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-extrabold text-[13px] uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="py-3.5 rounded-[16px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-[13px] uppercase tracking-wider transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Eliminando
                  </>
                ) : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}