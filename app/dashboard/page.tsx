"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wind, Headphones, BookOpen, Sun, CheckCircle, Users, Heart, Moon, Clock, Zap, Activity, Lock, Sparkles, Crown, Edit2, X, Palette, Type, CheckCircle2, Smile, Flame, Meh, Frown, Brain, Check } from 'lucide-react';
import Link from 'next/link';

// === CATÁLOGO DE SKINS ===
const AVAILABLE_SKINS = [
  { id: 'comun', name: 'Nabi Común', level: 1, color: '#8AD8CB', bg: 'bg-[#8AD8CB]', gradient: 'from-[#EAF1FF] to-[#E3F2F3]', border: 'border-[#8AD8CB]' },
  { id: 'monarca', name: 'Monarca', level: 10, color: '#F97316', bg: 'bg-[#F97316]', gradient: 'from-[#FFEDD5] to-[#FFEDD5]', border: 'border-[#F97316]' },
  { id: 'morpho', name: 'Morpho Azul', level: 25, color: '#3B82F6', bg: 'bg-[#3B82F6]', gradient: 'from-[#DBEAFE] to-[#DBEAFE]', border: 'border-[#3B82F6]' },
  { id: 'luna', name: 'Polilla Luna', level: 50, color: '#10B981', bg: 'bg-[#10B981]', gradient: 'from-[#D1FAE5] to-[#D1FAE5]', border: 'border-[#10B981]' },
];

const CompanionVisual = ({ stage, species, className = "w-16 h-16" }: { stage: string, species: string, className?: string }) => {
  const skin = AVAILABLE_SKINS.find(s => s.id === species) || AVAILABLE_SKINS[0];
  const mainColor = skin.color;

  if (stage === 'huevo') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        <div className="absolute w-[60%] h-[80%] rounded-[45%_55%_55%_45%] bg-white shadow-md border-2 border-gray-50 overflow-hidden relative">
          <div className="absolute -bottom-2 -right-2 w-full h-full rounded-full opacity-30 blur-md" style={{ backgroundColor: mainColor }}></div>
          <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-80"></div>
        </div>
      </div>
    );
  }

  if (stage === 'oruga') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-[80%] h-[80%] drop-shadow-sm">
          <circle cx="25" cy="60" r="12" fill={mainColor} opacity="0.6" />
          <circle cx="45" cy="50" r="14" fill={mainColor} opacity="0.8" />
          <circle cx="68" cy="45" r="16" fill={mainColor} />
          <circle cx="72" cy="40" r="2" fill="white" />
          <circle cx="65" cy="40" r="2" fill="white" />
        </svg>
      </div>
    );
  }

  if (stage === 'crisalida') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-[60%] h-[80%] drop-shadow-md">
           <path d="M50 5 V15" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
           <path d="M50 15 C 30 30, 30 70, 50 95 C 70 70, 70 30, 50 15 Z" fill={mainColor} opacity="0.9" />
           <path d="M40 30 C 50 35, 60 30, 60 30" stroke="white" strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
           <path d="M35 50 C 50 55, 65 50, 65 50" stroke="white" strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
           <path d="M42 70 C 50 75, 58 70, 58 70" stroke="white" strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" fill="none" className="w-[85%] h-[85%] drop-shadow-md transition-transform hover:scale-110 duration-500">
        <path d="M48 45 C 20 20, 10 30, 5 45 C 5 60, 25 55, 48 55 Z" fill={mainColor} opacity="0.9" />
        <path d="M52 45 C 80 20, 90 30, 95 45 C 95 60, 75 55, 52 55 Z" fill={mainColor} opacity="0.9" />
        <path d="M48 55 C 30 65, 20 85, 40 95 C 45 80, 45 65, 48 55 Z" fill={mainColor} opacity="0.7" />
        <path d="M52 55 C 70 65, 80 85, 60 95 C 55 80, 55 65, 52 55 Z" fill={mainColor} opacity="0.7" />
        <rect x="47" y="35" width="6" height="30" rx="3" fill="#1E293B" />
        <path d="M48 35 C 45 25, 40 20, 40 20" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M52 35 C 55 25, 60 20, 60 20" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="20" cy="45" r="4" fill="white" opacity="0.8" />
        <circle cx="80" cy="45" r="4" fill="white" opacity="0.8" />
        <circle cx="35" cy="80" r="3" fill="white" opacity="0.6" />
        <circle cx="65" cy="80" r="3" fill="white" opacity="0.6" />
      </svg>
    </div>
  );
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([]); 
  const [customTask, setCustomTask] = useState<any>(null); 
  
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState("gratis");
  const [userName, setUserName] = useState("Usuario");
  
  const [currentStreak, setCurrentStreak] = useState(0);
  
  const [companion, setCompanion] = useState<any>(null); 
  
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("¡Hola! Listo para seguir creciendo juntos.");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'name' | 'skins'>('name');
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [completedCustomTask, setCompletedCustomTask] = useState(false); 

  const [isSavingMood, setIsSavingMood] = useState(false);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [todayMoodId, setTodayMoodId] = useState<number | null>(null);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Wind': return <Wind className="w-5 h-5 text-[#6C72F1]" />;
      case 'Headphones': return <Headphones className="w-5 h-5 text-[#6C72F1]" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-[#6C72F1]" />;
      case 'Sun': return <Sun className="w-5 h-5 text-[#6C72F1]" />;
      case 'Users': return <Users className="w-5 h-5 text-[#6C72F1]" />;
      case 'Heart': return <Heart className="w-5 h-5 text-[#6C72F1]" />;
      case 'Moon': return <Moon className="w-5 h-5 text-[#6C72F1]" />;
      case 'Clock': return <Clock className="w-5 h-5 text-[#6C72F1]" />;
      case 'Zap': return <Zap className="w-5 h-5 text-[#6C72F1]" />;
      case 'Activity': return <Activity className="w-5 h-5 text-[#6C72F1]" />;
      default: return <Edit2 className="w-5 h-5 text-[#6C72F1]" />;
    }
  };

  const getLocalDateString = () => {
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const todayDateString = getLocalDateString();

        // AQUÍ ES DONDE TRAEMOS AMBAS RUTAS (selected_route y secondary_route)
        const { data: profile } = await supabase.from('profiles').select('full_name, selected_route, secondary_route, plan, current_streak, last_activity_date').eq('id', user.id).single();
        
        let extractedName = "Usuario";
        if (profile) {
            extractedName = profile.full_name ? profile.full_name.split(' ')[0] : 'Usuario';
            setUserName(extractedName);
            setUserPlan(profile.plan || 'gratis');
            
            const now = new Date();
            const yesterdayDate = new Date(now);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            let activeStreak = profile.current_streak || 0;
            if (profile.last_activity_date !== todayDateString && profile.last_activity_date !== yesterdayStr) {
                if (activeStreak > 0) {
                    activeStreak = 0;
                    await supabase.from('profiles').update({ current_streak: 0 }).eq('id', user.id);
                }
            }
            setCurrentStreak(activeStreak);

            // ==========================================
            // LÓGICA MULTI-RUTA PARA PREMIUM Y GRATIS
            // ==========================================
            let routesToFetch = [];
            let displayRouteNames = [];

            // 1. Agregar ruta principal
            if (profile.selected_route) {
               routesToFetch.push(profile.selected_route);
               displayRouteNames.push(profile.selected_route);
            }
            
            // 2. Si es PREMIUM, agregar ruta secundaria (si la eligió)
            if (profile.plan === 'premium' && profile.secondary_route) {
               routesToFetch.push(profile.secondary_route);
               displayRouteNames.push(profile.secondary_route);
            }

            if (routesToFetch.length > 0) {
              // Unimos los nombres para mostrarlos en la UI (ej. "Ansiedad y Depresión")
              setSelectedRoute(displayRouteNames.join(' y '));
              
              // Buscamos los IDs de todas las rutas que necesita este usuario
              const { data: routeObjs } = await supabase.from('routes').select('id').in('name', routesToFetch);
              
              if (routeObjs && routeObjs.length > 0) {
                const routeIds = routeObjs.map(r => r.id);
                
                // Traemos TODAS las tareas que pertenezcan a las rutas encontradas
                const { data: catalogTasks } = await supabase.from('tasks_catalog').select('*').in('route_id', routeIds);
                
                if (catalogTasks && catalogTasks.length > 0) {
                  // Mezclamos las tareas para que tenga un poco de ambas (pseudo-aleatorio por día)
                  const dateNumber = parseInt(todayDateString.replace(/-/g, ''));
                  let shuffled = [...catalogTasks].sort((a, b) => {
                     const pseudoRandomA = (a.id * dateNumber) % 100;
                     const pseudoRandomB = (b.id * dateNumber) % 100;
                     return pseudoRandomA - pseudoRandomB;
                  });
                  // Mostramos 5 tareas diarias en total, sin importar si vienen de 1 o 2 rutas
                  setTasks(shuffled.slice(0, 5));
                }
              }
            }

            if (profile.plan === 'premium') {
              const { data: companionData } = await supabase.from('user_companions').select('*').eq('patient_id', user.id).single();
              if (companionData) setCompanion(companionData);
            }
        }

        const [messagesRes, completedRes, customRes, moodRes] = await Promise.all([
          supabase.from('companion_messages').select('*'),
          supabase.from('patient_tasks').select('task_catalog_id').eq('patient_id', user.id).eq('assigned_date', todayDateString).eq('is_completed', true),
          supabase.from('custom_tasks').select('*').eq('patient_id', user.id).eq('assigned_date', todayDateString).maybeSingle(),
          supabase.from('mood_logs')
            .select('id, mood, log_date')
            .eq('patient_id', user.id)
            .eq('log_date', todayDateString)
            .order('logged_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        if (messagesRes.data) {
          setAllMessages(messagesRes.data);
          const greetings = messagesRes.data.filter(m => m.category === 'greeting');
          if (greetings.length > 0) {
            const randomMsg = greetings[Math.floor(Math.random() * greetings.length)].content;
            setCurrentMessage(randomMsg.replace('{name}', extractedName));
          }
        }

        if (completedRes.data) setCompletedTasks(completedRes.data.map(pt => pt.task_catalog_id));
        
        if (customRes.data) {
          setCustomTask(customRes.data);
          setCompletedCustomTask(customRes.data.is_completed);
        }

        if (moodRes.data) {
          setTodayMood(moodRes.data.mood);
          setTodayMoodId(moodRes.data.id);
        }

      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const triggerMessage = (category: string) => {
    if (allMessages.length === 0) return;
    const filtered = allMessages.filter(m => m.category === category);
    if (filtered.length > 0) {
      const randomMsg = filtered[Math.floor(Math.random() * filtered.length)].content;
      setCurrentMessage(randomMsg.replace('{name}', userName));
    }
  };

  const updateXP = async (xpChange: number) => {
    if (userPlan !== 'premium' || !companion) return;

    let totalXp = Math.max(0, companion.xp + xpChange); 
    let newLevel = 1;
    let tempXp = totalXp;
    while (tempXp >= newLevel * 100) {
      tempXp -= newLevel * 100;
      newLevel++;
    }

    let newStage = 'huevo';
    if (newLevel >= 4) newStage = 'oruga';
    if (newLevel >= 8) newStage = 'crisalida';
    if (newLevel >= 12) newStage = 'mariposa';

    setCompanion({ ...companion, xp: totalXp, level: newLevel, stage: newStage });

    try {
      await supabase.from('user_companions').update({ xp: totalXp, level: newLevel, stage: newStage }).eq('id', companion.id);
    } catch (e) {}
  };

  const checkAndUpdateStreak = async () => {
    if (!userId) return;
    
    try {
      const { data: profile } = await supabase.from('profiles').select('current_streak, longest_streak, last_activity_date').eq('id', userId).single();
      if (!profile) return;

      const todayStr = getLocalDateString();
      const lastActivityStr = profile.last_activity_date;

      if (lastActivityStr === todayStr) return;

      const now = new Date();
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      let newCurrentStreak = 1; 

      if (lastActivityStr === yesterdayStr) {
        newCurrentStreak = (profile.current_streak || 0) + 1;
      }

      const newLongestStreak = Math.max(profile.longest_streak || 0, newCurrentStreak);

      setCurrentStreak(newCurrentStreak);

      await supabase
        .from('profiles')
        .update({ 
          current_streak: newCurrentStreak, 
          longest_streak: newLongestStreak,
          last_activity_date: todayStr 
        })
        .eq('id', userId);

    } catch (error) {
      console.error("Error actualizando racha:", error);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    if (!userId || isSavingMood) return;
    setIsSavingMood(true);
    setTodayMood(mood);
    
    triggerMessage(`mood_${mood}`);

    try {
      if (todayMoodId) {
        await supabase.from('mood_logs').update({ mood: mood }).eq('id', todayMoodId);
      } else {
        const { data } = await supabase
          .from('mood_logs')
          .insert([{ patient_id: userId, mood: mood, log_date: getLocalDateString() }])
          .select()
          .single();
        if (data) setTodayMoodId(data.id);
      }
    } catch (error) {} finally { setIsSavingMood(false); }
  };

  const toggleTask = async (taskId: number) => {
    if (!userId) return;
    const isCurrentlyCompleted = completedTasks.includes(taskId);
    const todayDateString = getLocalDateString();
    
    if (isCurrentlyCompleted) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
      updateXP(-25); 
    } else {
      setCompletedTasks([...completedTasks, taskId]);
      updateXP(25); 
      triggerMessage('motivation');
      checkAndUpdateStreak();
    }

    try {
      if (isCurrentlyCompleted) {
        await supabase.from('patient_tasks').delete().eq('patient_id', userId).eq('task_catalog_id', taskId).eq('assigned_date', todayDateString);
      } else {
        await supabase.from('patient_tasks').insert([{ patient_id: userId, task_catalog_id: taskId, is_completed: true, assigned_date: todayDateString }]);
      }
    } catch (error) {}
  };

  const toggleCustomTask = async () => {
    if (!userId || !customTask) return;
    const newValue = !completedCustomTask;
    setCompletedCustomTask(newValue);
    
    if (newValue) {
      updateXP(25);
      triggerMessage('motivation');
      checkAndUpdateStreak();
    } else {
      updateXP(-25);
    }

    try { await supabase.from('custom_tasks').update({ is_completed: newValue }).eq('id', customTask.id); } catch (error) {}
  };

  const saveCompanionName = async () => {
    if (!newName.trim() || !companion) return;
    setIsSaving(true);
    try {
      await supabase.from('user_companions').update({ name: newName.trim() }).eq('id', companion.id);
      setCompanion({ ...companion, name: newName.trim() });
      setIsModalOpen(false);
    } catch (error) {
      alert("Hubo un error al guardar el nombre.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEquipSkin = async (skinId: string, requiredLevel: number) => {
    if (!companion || compLevel < requiredLevel) return;
    setIsSaving(true);
    try {
      await supabase.from('user_companions').update({ species: skinId }).eq('id', companion.id);
      setCompanion({ ...companion, species: skinId });
    } catch (error) {
      alert("Hubo un error al equipar el aspecto.");
    } finally {
      setIsSaving(false);
    }
  };

  const tareasActualesCompletadas = tasks.filter(task => completedTasks.includes(task.id)).length;
  const totalTareasHoy = tasks.length + (customTask ? 1 : 0);
  const totalCompletadasHoy = tareasActualesCompletadas + (completedCustomTask ? 1 : 0);

  const compLevel = companion?.level || 1;
  const totalXp = companion?.xp || 0;
  
  let currentLevelXp = totalXp;
  let lvlCalc = 1;
  while (currentLevelXp >= lvlCalc * 100) {
    currentLevelXp -= lvlCalc * 100;
    lvlCalc++;
  }
  const xpNeededForNextLevel = compLevel * 100; 
  const progressPercentage = Math.min(100, (currentLevelXp / xpNeededForNextLevel) * 100);

  const getStageName = (stage: string) => {
    switch(stage) {
      case 'huevo': return 'Semilla / Huevo';
      case 'oruga': return 'Oruga';
      case 'crisalida': return 'Crisálida';
      case 'mariposa': return 'Mariposa';
      default: return 'Desconocido';
    }
  };

  const activeSkin = AVAILABLE_SKINS.find(s => s.id === companion?.species) || AVAILABLE_SKINS[0];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9] text-[#1E293B] font-sans relative overflow-x-hidden pb-24">
      
      {/* Contenedor Principal Alineado */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HEADER HERO (Emociones) */}
        <div className="mb-8 bg-white/60 backdrop-blur-xl p-8 sm:p-10 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold text-[#333333] mb-1 leading-tight tracking-tight">
            ¡Hola, {userName}!
          </h1>
          <p className="text-[#8A95A5] text-[16px] sm:text-[18px] font-medium">
            ¿Cómo se siente tu santuario hoy?
          </p>

          {/* ESTADO DE ÁNIMO (4 TARJETAS) - Colores Fijos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8">
            <div onClick={() => handleMoodSelect('feliz')} className={`bg-white/80 backdrop-blur-sm rounded-[28px] py-6 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm border ${todayMood === 'feliz' ? 'border-[#8AD8CB] scale-105 ring-2 ring-[#8AD8CB]/20' : 'border-white hover:shadow-md'}`}>
              <div className="w-[50px] h-[50px] rounded-full bg-[#E5F7F4] flex items-center justify-center mb-3">
                 <Smile className="w-[24px] h-[24px] text-[#55D0B9]" strokeWidth={2.5} />
              </div>
              <p className={`font-bold text-[10px] uppercase tracking-[0.2em] ${todayMood === 'feliz' ? 'text-[#55D0B9]' : 'text-[#94A3B8]'}`}>Feliz</p>
            </div>

            <div onClick={() => handleMoodSelect('neutral')} className={`bg-white/80 backdrop-blur-sm rounded-[28px] py-6 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm border ${todayMood === 'neutral' ? 'border-[#64748B] scale-105 ring-2 ring-[#64748B]/20' : 'border-white hover:shadow-md'}`}>
              <div className="w-[50px] h-[50px] rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
                 <Meh className="w-[24px] h-[24px] text-[#64748B]" strokeWidth={2.5} />
              </div>
              <p className={`font-bold text-[10px] uppercase tracking-[0.2em] ${todayMood === 'neutral' ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Neutral</p>
            </div>

            <div onClick={() => handleMoodSelect('triste')} className={`bg-white/80 backdrop-blur-sm rounded-[28px] py-6 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm border ${todayMood === 'triste' ? 'border-[#93C5FD] scale-105 ring-2 ring-[#93C5FD]/20' : 'border-white hover:shadow-md'}`}>
              <div className="w-[50px] h-[50px] rounded-full bg-[#EFF6FF] flex items-center justify-center mb-3">
                 <Frown className="w-[24px] h-[24px] text-[#93C5FD]" strokeWidth={2.5} />
              </div>
              <p className={`font-bold text-[10px] uppercase tracking-[0.2em] ${todayMood === 'triste' ? 'text-[#93C5FD]' : 'text-[#94A3B8]'}`}>Triste</p>
            </div>

            <div onClick={() => handleMoodSelect('ansioso')} className={`bg-white/80 backdrop-blur-sm rounded-[28px] py-6 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm border ${todayMood === 'ansioso' ? 'border-[#FCA5A5] scale-105 ring-2 ring-[#FCA5A5]/20' : 'border-white hover:shadow-md'}`}>
              <div className="w-[50px] h-[50px] rounded-full bg-[#FEF2F2] flex items-center justify-center mb-3">
                 <Brain className="w-[24px] h-[24px] text-[#FCA5A5]" strokeWidth={2.5} />
              </div>
              <p className={`font-bold text-[10px] uppercase tracking-[0.2em] ${todayMood === 'ansioso' ? 'text-[#FCA5A5]' : 'text-[#94A3B8]'}`}>Ansioso</p>
            </div>
          </div>
        </div>

        {/* ESTRUCTURA PRINCIPAL DEL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ======================================= */}
          {/* COLUMNA IZQUIERDA: TAREAS (Ocupa 2/3) */}
          {/* ======================================= */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Título de Tareas */}
            <div className="flex justify-between items-end px-2">
              <div>
                <h2 className="font-extrabold text-[22px] text-[#333333]">
                  Tareas Diarias
                </h2>
                <p className="text-[13px] text-[#8A95A5] font-medium mt-1">
                  Enfoque actual: <span className="text-[#6C72F1] font-bold uppercase tracking-wider ml-1">{selectedRoute || "Ninguno"}</span>
                </p>
              </div>
              <span className="text-[10px] font-black text-[#6C72F1] bg-[#EEF0FF] px-3 py-1.5 rounded-[10px] border border-white shadow-sm uppercase tracking-[0.2em]">
                {totalCompletadasHoy} / {totalTareasHoy}
              </span>
            </div>

            {/* Contenedor de Tareas */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-xl rounded-[40px] border border-white shadow-sm">
                  <div className="w-10 h-10 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#8A95A5] font-bold">Preparando tu lista diaria...</p>
                </div>
              ) : tasks.length === 0 && !customTask ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-xl rounded-[40px] border border-white shadow-sm">
                  <div className="w-16 h-16 bg-[#EEF0FF] rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-white shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-[#6C72F1]" />
                  </div>
                  <p className="text-[#8A95A5] font-bold text-[15px]">Aún no hay tareas para esta ruta.</p>
                </div>
              ) : (
                <>
                  {/* TAREA PERSONALIZADA DEL PSICÓLOGO */}
                  {customTask && (
                    <div onClick={toggleCustomTask} className={`p-5 rounded-[32px] cursor-pointer transition-all duration-300 border group shadow-sm ${completedCustomTask ? 'bg-white/40 backdrop-blur-md border-white/50 opacity-70' : 'bg-gradient-to-r from-[#FFFBEB] to-white/80 backdrop-blur-xl border-[#FDE047]/50 hover:shadow-md hover:-translate-y-0.5'}`}>
                      <div className="flex items-center gap-5 relative z-10 w-full">
                        
                        <div className={`w-[48px] h-[48px] rounded-[18px] flex items-center justify-center flex-shrink-0 transition-colors border shadow-sm ${completedCustomTask ? 'bg-[#E2E8F0] border-white' : 'bg-[#FEF3C7] border-white'}`}>
                           <Users className={`w-6 h-6 ${completedCustomTask ? 'text-[#94A3B8]' : 'text-[#D97706]'}`} />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[9px] font-black bg-[#FDE047] text-[#B45309] px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">Asignada por tu Doc</span>
                            </div>
                            <h4 className={`font-extrabold text-[16px] transition-colors duration-300 ${completedCustomTask ? 'text-[#94A3B8] line-through decoration-1' : 'text-[#333333]'}`}>{customTask.title}</h4>
                            <p className={`text-[13px] font-medium mt-0.5 transition-colors duration-300 line-clamp-2 ${completedCustomTask ? 'text-[#CBD5E1]' : 'text-[#64748B]'}`}>{customTask.description}</p>
                        </div>
                        
                        {/* Checkbox Circular */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-2 ${completedCustomTask ? 'bg-[#D97706] border-[#D97706]' : 'border-[#CBD5E1] bg-white group-hover:border-[#D97706]'}`}>
                          {completedCustomTask && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAREAS DE CATÁLOGO */}
                  {tasks.map((task) => {
                    const isCompleted = completedTasks.includes(task.id);
                    return (
                      <div key={task.id} onClick={() => toggleTask(task.id)} className={`p-5 rounded-[32px] cursor-pointer transition-all duration-300 border group shadow-sm ${isCompleted ? 'bg-white/40 backdrop-blur-md border-white/50 opacity-70' : 'bg-white/80 backdrop-blur-xl border-white hover:shadow-md hover:-translate-y-0.5'}`}>
                        <div className="flex items-center gap-5 relative z-10 w-full">
                          
                          <div className={`w-[48px] h-[48px] rounded-[18px] flex items-center justify-center flex-shrink-0 transition-colors border shadow-sm ${isCompleted ? 'bg-[#E2E8F0] border-white' : 'bg-[#EEF0FF] border-white'}`}>
                             {isCompleted ? <CheckCircle2 className="w-6 h-6 text-[#94A3B8]" /> : getIcon(task.icon)}
                          </div>
                          
                          <div className="flex-1">
                              <h4 className={`font-extrabold text-[16px] transition-colors duration-300 ${isCompleted ? 'text-[#94A3B8] line-through decoration-1' : 'text-[#333333]'}`}>{task.title}</h4>
                              <p className={`text-[13px] font-medium mt-0.5 transition-colors duration-300 line-clamp-1 ${isCompleted ? 'text-[#CBD5E1]' : 'text-[#8A95A5]'}`}>{task.description}</p>
                          </div>
                          
                          {/* Checkbox Circular */}
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-2 shadow-inner ${isCompleted ? 'bg-[#6C72F1] border-[#6C72F1]' : 'border-[#CBD5E1] bg-white group-hover:border-[#6C72F1]'}`}>
                            {isCompleted && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* ======================================= */}
          {/* COLUMNA DERECHA: WIDGETS (Ocupa 1/3) */}
          {/* ======================================= */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* TARJETA DE RACHAS */}
            <div className="bg-gradient-to-br from-[#6A70F0] to-[#5C61E1] p-8 rounded-[40px] flex flex-col items-start justify-center relative overflow-hidden shadow-md border border-white/20 h-[180px] hover:shadow-lg transition-shadow">
              <Zap className="absolute -right-8 -bottom-6 w-48 h-48 text-white opacity-[0.05] rotate-12" fill="currentColor" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-2 relative z-10">Tu Constancia</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <h3 className="text-[56px] font-black tracking-tight leading-none text-white">{currentStreak}</h3>
                <span className="text-[16px] font-bold text-white/80">DÍAS</span>
              </div>
              <div className="mt-auto pt-2 relative z-10">
                 <p className="text-[12px] font-medium text-white/80 leading-snug">
                    {currentStreak > 0 ? '¡Excelente trabajo! Sigue así.' : 'Completa tu primera tarea de hoy.'}
                 </p>
              </div>
            </div>

            {/* TU COMPAÑERO / NABI */}
            {userPlan === 'gratis' ? (
              <Link href="/dashboard/settings/plan" className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] flex flex-col items-center text-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white relative group cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all">
                <div className="w-[88px] h-[88px] bg-[#F8FAFC] rounded-[28px] flex items-center justify-center mb-6 border border-[#E2E8F0] shadow-inner group-hover:scale-105 transition-transform duration-300">
                   <Lock className="w-[24px] h-[24px] text-[#94A3B8]" strokeWidth={2.5} />
                </div>
                <h3 className="text-[#333333] font-extrabold text-[22px] mb-2 leading-tight">Tu Compañero</h3>
                <p className="text-[#8A95A5] text-[14px] leading-relaxed mb-8 font-medium max-w-[200px]">
                  Descubre a tu asistente terapéutico y mira cómo crece contigo.
                </p>
                <div className="w-full py-4 bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] border border-[#FDE047] text-[#D97706] font-black uppercase tracking-wider rounded-[20px] text-[12px] transition-all flex items-center justify-center gap-2 group-hover:shadow-md">
                  <Sparkles className="w-[16px] h-[16px]" strokeWidth={2.5} /> Desbloquear Premium
                </div>
              </Link>
            ) : (
              <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] flex flex-col items-center text-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white relative group h-full">
                
                <div className={`w-[96px] h-[96px] bg-gradient-to-b ${activeSkin.gradient} rounded-[32px] border-[4px] border-white shadow-sm flex items-center justify-center mb-4 relative transition-transform duration-500 group-hover:scale-105`}>
                   <CompanionVisual stage={companion?.stage || 'huevo'} species={companion?.species || 'comun'} className="w-[60px] h-[60px]" />
                   <div className="absolute -bottom-2 -right-2 w-[20px] h-[20px] bg-[#34D399] rounded-full border-[3px] border-white shadow-sm"></div>
                </div>
                
                <h3 className="text-[#333333] font-extrabold text-[22px] mb-1 flex items-center justify-center gap-2">
                  {companion?.name || 'Compañero Nabi'} 
                  <button 
                    onClick={() => {
                      setNewName(companion?.name || '');
                      setModalTab('skins');
                      setIsModalOpen(true);
                    }} 
                    className="p-1.5 rounded-full text-[#A0AABF] hover:bg-[#EEF0FF] hover:text-[#6C72F1] transition-colors"
                  >
                    <Edit2 className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </button>
                </h3>
                
                <p className="text-[#8A95A5] text-[12px] font-black uppercase tracking-widest mb-6 bg-white/50 px-4 py-1.5 rounded-full border border-white shadow-sm">
                  Nivel {compLevel} • {getStageName(companion?.stage || 'huevo')}
                </p>
                
                {/* Diálogo / Chat */}
                <div className="bg-white/50 backdrop-blur-sm border border-white shadow-sm rounded-[24px] p-5 mb-6 w-full relative">
                  {/* Flechita del globo de chat */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/50 rotate-45 border-l border-t border-white"></div>
                  <p className="text-[13px] text-[#475569] font-medium leading-relaxed relative z-10 italic">
                    "{currentMessage}"
                  </p>
                </div>

                {/* Barra de XP */}
                <div className="w-full flex flex-col items-center justify-center mb-8 mt-auto">
                  <div className="w-full flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-black text-[#6C72F1] tracking-widest">XP</span>
                    <span className="text-[10px] font-black text-[#8A95A5] tracking-widest">
                      {currentLevelXp} / {xpNeededForNextLevel}
                    </span>
                  </div>
                  <div className="w-full bg-white border border-[#E2E8F0] rounded-full h-[8px] overflow-hidden shadow-inner p-[1.5px]">
                    <div 
                      className="bg-[#6C72F1] h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ======================================= */}
      {/* MODAL FLOTANTE FUERA DEL GRID           */}
      {/* ======================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E293B]/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[40px] w-full max-w-lg shadow-[0_10px_50px_rgba(0,0,0,0.1)] relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex border-b border-gray-100 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[#8A95A5] hover:text-[#1E293B] transition-all p-2.5 z-10 bg-white shadow-sm border border-gray-50 rounded-full hover:scale-110">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={() => setModalTab('name')}
                className={`flex-1 py-6 font-extrabold text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${modalTab === 'name' ? 'text-[#6C72F1] border-b-[3px] border-[#6C72F1] bg-[#EEF0FF]' : 'text-[#8A95A5] hover:bg-[#F8FAFC]'}`}
              >
                <Type className="w-4 h-4" strokeWidth={2.5} /> Nombre
              </button>
              <button 
                onClick={() => setModalTab('skins')}
                className={`flex-1 py-6 font-extrabold text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${modalTab === 'skins' ? 'text-[#6C72F1] border-b-[3px] border-[#6C72F1] bg-[#EEF0FF]' : 'text-[#8A95A5] hover:bg-[#F8FAFC]'}`}
              >
                <Palette className="w-4 h-4" strokeWidth={2.5} /> Apariencia
              </button>
            </div>

            {modalTab === 'name' && (
              <div className="p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#EEF0FF] rounded-[24px] flex items-center justify-center mb-6 border border-white shadow-sm">
                  <Sparkles className="w-10 h-10 text-[#6C72F1]" strokeWidth={2} />
                </div>
                <h3 className="text-[28px] font-extrabold text-[#333333] mb-2 leading-tight">Renombrar</h3>
                <p className="text-[#8A95A5] text-[15px] mb-8 font-medium">
                  Dale un nombre único a tu compañero evolutivo.
                </p>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Mariposita, Navi, Luz..."
                  className="w-full px-6 py-5 bg-white/50 border border-white shadow-inner rounded-[24px] text-[#333333] font-black focus:outline-none focus:ring-4 focus:ring-[#EEF0FF] transition-all mb-8 text-center text-[18px] tracking-wide placeholder:text-[#CBD5E1] placeholder:font-medium"
                  maxLength={20}
                  autoFocus
                />
                <button 
                  onClick={saveCompanionName}
                  disabled={isSaving || !newName.trim()}
                  className="w-full py-4 bg-[#6C72F1] hover:bg-[#5C61E1] text-white rounded-[20px] font-extrabold text-[14px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  {isSaving ? 'Guardando...' : 'Guardar nombre'}
                </button>
              </div>
            )}

            {modalTab === 'skins' && (
              <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
                <div className="text-center mb-8">
                  <h3 className="text-[24px] font-extrabold text-[#333333] mb-2">Tu Colección</h3>
                  <p className="text-[#8A95A5] text-[14px] font-medium">Sube de nivel para desbloquear nuevas especies.</p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {AVAILABLE_SKINS.map((skin) => {
                    const isUnlocked = compLevel >= skin.level;
                    const isEquipped = companion?.species === skin.id || (skin.id === 'comun' && !companion?.species);
                    
                    return (
                      <div 
                        key={skin.id}
                        onClick={() => handleEquipSkin(skin.id, skin.level)}
                        className={`relative rounded-[32px] p-6 flex flex-col items-center text-center transition-all ${
                          isUnlocked ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : 'opacity-50 cursor-not-allowed grayscale'
                        } ${isEquipped ? 'bg-white ring-4 ring-[#6C72F1] shadow-md border-transparent' : 'bg-white border border-gray-100 shadow-sm hover:border-[#CBD5E1]'}`}
                      >
                        {isEquipped && (
                          <div className="absolute top-4 right-4 w-7 h-7 bg-[#6C72F1] rounded-full flex items-center justify-center z-10 shadow-sm border-2 border-white">
                            <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                        )}

                        <div className={`w-24 h-24 bg-gradient-to-b ${skin.gradient} rounded-[24px] flex items-center justify-center mb-5 relative border-[3px] border-white shadow-inner`}>
                          <CompanionVisual stage="mariposa" species={skin.id} className="w-16 h-16" />
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-[#0F172A]/10 rounded-[20px] flex items-center justify-center backdrop-blur-[2px]">
                              <Lock className="w-6 h-6 text-[#333333]" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>

                        <h4 className="font-extrabold text-[#333333] text-[15px] leading-tight mb-2.5">{skin.name}</h4>
                        
                        {isUnlocked ? (
                          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${isEquipped ? 'bg-[#EEF0FF] text-[#6C72F1] border border-white shadow-sm' : 'bg-[#F8FAFC] text-[#8A95A5] border border-transparent'}`}>
                            {isEquipped ? 'Equipado' : 'Desbloqueado'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-[#D97706] bg-[#FFFBEB] px-4 py-1.5 rounded-full flex items-center justify-center gap-1.5 uppercase tracking-widest border border-white shadow-sm">
                            <Lock className="w-3 h-3" strokeWidth={3} /> Nivel {skin.level}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}