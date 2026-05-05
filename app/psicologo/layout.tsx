"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, Settings, Bell, LogOut, Menu, X, Info, UserPlus, UserMinus, Copy, Crown, Sparkles, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function PsicologoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [psychologistName, setPsychologistName] = useState("Cargando...");
  const [firstName, setFirstName] = useState(""); // Nuevo estado para el primer nombre
  const [initials, setInitials] = useState(""); // Nuevo estado para las iniciales
  const [linkCode, setLinkCode] = useState("...");
  const [patientCount, setPatientCount] = useState(0);
  const [userPlan, setUserPlan] = useState("gratis");

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, link_code, plan')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          const names = profile.full_name?.split(' ') || ['Dr', 'Doc'];
          const first = names[0];
          setFirstName(first);
          
          // CÁLCULO DE INICIALES PROFESIONALES
          const inits = first.charAt(0).toUpperCase() + (names.length > 1 ? names[names.length - 1].charAt(0).toUpperCase() : '');
          setInitials(inits);

          const isDoc = profile.full_name?.toLowerCase().includes("dr.") || profile.full_name?.toLowerCase().includes("dra.");
          const formattedName = isDoc ? profile.full_name : `Dr(a). ${profile.full_name}`;
          setPsychologistName(formattedName || "Dr(a).");
          setLinkCode(profile.link_code || "Sin código");
          setUserPlan(profile.plan || "gratis");
        }

        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('psychologist_id', user.id);

        if (!countError && count !== null) setPatientCount(count);

        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notifs) {
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        }

      } catch (error) {
        console.error("Error cargando datos del psicólogo:", error);
      }
    };
    fetchProfileAndData();
  }, [router]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyCode = () => {
    if(linkCode === "...") return;
    navigator.clipboard.writeText(linkCode);
    alert(`¡Código ${linkCode} copiado al portapapeles!`);
  };

  const deleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1)); 
    try { await supabase.from('notifications').delete().eq('id', id); } catch (error) {}
  };

  const clearAllNotifications = async () => {
    if (!userId) return;
    setNotifications([]);
    setUnreadCount(0);
    try { await supabase.from('notifications').delete().eq('user_id', userId); } catch (error) {}
  };

  const markAsRead = async () => {
    if (unreadCount === 0 || !userId) return;
    setUnreadCount(0); 
    try { await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false); } catch (error) {}
  };

  const toggleNotifications = () => {
    if (!isNotifOpen) { markAsRead(); setIsMenuOpen(false); }
    setIsNotifOpen(!isNotifOpen);
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'link': return <UserPlus className="w-5 h-5 text-[#6C72F1]" />;
      case 'unlink': return <UserMinus className="w-5 h-5 text-[#EF4444]" />;
      default: return <Info className="w-5 h-5 text-[#3EAFA8]" />;
    }
  };

  const menuItems = [
    { name: 'Inicio', path: '/psicologo/dashboard', icon: LayoutDashboard },
    { name: 'Pacientes', path: '/psicologo/pacientes', icon: Users },
    { name: 'Ajustes Clínicos', path: '/psicologo/settings', icon: Settings },
  ];

  const getHeaderTexts = () => {
    const patientText = patientCount === 1 ? '1 paciente activo' : `${patientCount} pacientes activos`;
    if (pathname?.includes('/dashboard')) return { title: `Hola, ${psychologistName}`, subtitle: `Tienes ${patientText} bajo tu cuidado hoy.` };
    if (pathname?.includes('/pacientes/detalle')) return { title: 'Expediente Clínico', subtitle: 'Detalle y seguimiento del paciente.' };
    if (pathname?.includes('/pacientes')) return { title: 'Mis Pacientes', subtitle: 'Directorio completo de pacientes vinculados.' };
    if (pathname?.includes('/settings/plan')) return { title: 'Planes Profesionales', subtitle: 'Mejora tu capacidad de atención en Nabi.' };
    if (pathname?.includes('/settings')) return { title: 'Ajustes Clínicos', subtitle: 'Gestiona tu información y seguridad.' };
    return { title: 'Portal Clínico', subtitle: 'Nabi para Profesionales' };
  };

  const { title, subtitle } = getHeaderTexts();

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#1E293B] bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9]">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <header className="w-full bg-white/70 backdrop-blur-md border-b border-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center gap-4">
          
          <Link href="/psicologo/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform duration-300">
               <Image 
                 src="/logo.png" 
                 alt="Logo Nabi" 
                 fill 
                 className="object-contain"
               />
            </div>
            <span className="text-[20px] font-black text-[#6C72F1] tracking-tight">Nabi</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 h-full">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.path === '/psicologo/pacientes' && pathname?.includes('/pacientes'));
              return (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`relative flex items-center h-full px-1 text-[14px] font-bold transition-colors duration-300 ${
                    isActive 
                       ? 'text-[#6C72F1]' 
                       : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6C72F1] rounded-t-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div 
              onClick={copyCode} 
              className="hidden md:flex items-center gap-2 bg-[#EEF0FF] px-4 py-1.5 rounded-full border border-white shadow-sm cursor-pointer hover:bg-[#E0E7FF] transition-colors" 
              title="Copiar código"
            >
              <span className="text-[10px] font-black text-[#6C72F1] uppercase tracking-widest">Código:</span>
              <span className="text-[13px] font-black text-[#333333] tracking-widest">{linkCode}</span>
              <Copy className="w-3.5 h-3.5 text-[#6C72F1] ml-1" />
            </div>

            <div className="relative flex items-center h-full" ref={notifRef}>
              <button 
                onClick={toggleNotifications}
                className="text-[#6C72F1] hover:text-[#5C61E1] transition-colors relative p-2 rounded-full hover:bg-[#EEF0FF]"
              >
                <Bell className="w-[22px] h-[22px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-[10px] h-[10px] bg-[#EF4444] rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-[400px] bg-white rounded-[24px] shadow-2xl border border-[#E2E8F0] overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                    <h3 className="font-extrabold text-[#1E293B]">Notificaciones Clínicas</h3>
                    {notifications.length > 0 && (
                      <button onClick={clearAllNotifications} className="text-[11px] font-bold text-[#94A3B8] hover:text-[#EF4444] transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                        Limpiar todo
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4 border border-white shadow-sm">
                          <Bell className="w-6 h-6 text-[#94A3B8]" />
                        </div>
                        <p className="text-base font-bold text-[#1E293B] mb-1">Bandeja vacía</p>
                        <p className="text-sm text-[#64748B] max-w-[200px] leading-relaxed">Aquí verás cuando un paciente se vincule a tu directorio.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="px-6 py-4 border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors flex gap-4 relative group">
                          <div className="w-10 h-10 rounded-full bg-[#EEF0FF] border border-white shadow-sm flex items-center justify-center flex-shrink-0">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 pr-4 pt-0.5">
                            <h4 className="text-[13px] font-extrabold text-[#1E293B] mb-0.5">{notif.title}</h4>
                            <p className="text-[12px] text-[#64748B] leading-relaxed font-medium">{notif.message}</p>
                            <p className="text-[9px] font-bold text-[#94A3B8] mt-2 uppercase tracking-wider">
                              {new Date(notif.created_at).toLocaleDateString('es', { weekday: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="absolute top-4 right-4 text-[#CBD5E1] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all bg-white rounded-full p-1.5 shadow-sm border border-gray-100 hover:scale-110"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PERFIL DEL PSICÓLOGO (Sustituido el icono por iniciales) */}
            <Link href="/psicologo/settings" className="hidden lg:flex items-center gap-3 bg-white pl-1.5 pr-5 py-1.5 rounded-full border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all group cursor-pointer ml-1">
              <div className="w-9 h-9 bg-[#EEF0FF] rounded-full flex items-center justify-center text-[#6C72F1] shadow-inner transition-transform group-hover:scale-105 font-black text-xs">
                 {initials || "DR"}
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[13px] font-extrabold text-[#1E293B] truncate max-w-[120px] leading-tight mb-0.5">{firstName}</p>
                {(userPlan === 'ilimitado' || userPlan === 'premium') ? (
                  <span className="text-[9px] font-black text-[#D97706] tracking-widest uppercase flex items-center gap-1 w-fit leading-none">
                    <Crown className="w-3 h-3" /> Ilimitado
                  </span>
                ) : userPlan === 'plus' ? (
                  <span className="text-[9px] font-black text-[#6C72F1] tracking-widest uppercase flex items-center gap-1 w-fit leading-none">
                    <Sparkles className="w-3 h-3" /> Plan Plus
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-[#8A95A5] tracking-widest uppercase flex items-center gap-1 group-hover:text-[#6C72F1] transition-colors w-fit leading-none">
                    Plan Básico <Sparkles className="w-[10px] h-[10px]" />
                  </span>
                )}
              </div>
            </Link>

            <button 
              onClick={handleLogout} 
              className="hidden lg:flex items-center justify-center w-10 h-10 bg-white text-[#EF4444] rounded-full hover:bg-[#FEF2F2] transition shadow-sm border border-[#FCA5A5] ml-1 group" 
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            <div className="relative lg:hidden flex items-center" ref={menuRef}>
              <button 
                onClick={() => { setIsMenuOpen(!isMenuOpen); if (!isMenuOpen) setIsNotifOpen(false); }}
                className="bg-white text-[#64748B] w-10 h-10 rounded-full hover:bg-[#F8FAFC] transition shadow-sm border border-[#E2E8F0] flex items-center justify-center"
              >
                <Menu className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-[24px] shadow-2xl border border-[#E2E8F0] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center text-center">
                     <div className="w-12 h-12 bg-[#EEF0FF] rounded-full flex items-center justify-center text-[#6C72F1] shadow-inner mb-2 border-2 border-white font-black text-base">
                        {initials || "DR"}
                     </div>
                     <p className="text-sm font-extrabold text-[#1E293B]">{psychologistName}</p>
                     <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">Suscripción {userPlan}</p>
                     
                     <div className="mt-4 flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm w-full" onClick={copyCode}>
                       <span className="text-[10px] font-black text-[#6C72F1] uppercase">Código:</span>
                       <span className="text-[12px] font-black text-[#333333]">{linkCode}</span>
                       <Copy className="w-3.5 h-3.5 text-[#6C72F1] ml-auto" />
                     </div>
                  </div>
                  
                  {menuItems.map((item) => {
                    const isActive = pathname === item.path || (item.path === '/psicologo/pacientes' && pathname?.includes('/pacientes'));
                    const Icon = item.icon;
                    return (
                      <Link 
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-6 py-4 text-sm transition-colors ${
                          isActive 
                            ? 'bg-[#EEF0FF] text-[#6C72F1] font-extrabold border-l-[3px] border-[#6C72F1]' 
                            : 'text-[#64748B] font-bold hover:bg-[#F8FAFC] hover:text-[#1E293B] border-l-[3px] border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                  
                  <div className="border-t border-[#E2E8F0] my-1"></div>
                  
                  <Link href="/psicologo/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-6 py-4 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-colors border-l-[3px] border-transparent">
                    <Settings className="w-4 h-4" /> Ajustes Clínicos
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors border-l-[3px] border-transparent">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="w-full flex-1 flex flex-col pt-8 pb-12">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight">{title}</h1>
          <p className="text-[#64748B] mt-1.5 font-medium">{subtitle}</p>
        </div>

        {/* CONTENIDO HIJO */}
        {children}
        
      </main>
    </div>
  );
}