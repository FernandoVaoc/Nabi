"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const cycle = searchParams.get('cycle') || 'mensual';
  const amount = searchParams.get('amount') || '100';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Estados para validación de tarjeta
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchUser();
  }, []);

  // --- FUNCIONES DE FORMATEO MAGICO ---
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formattedValue.substring(0, 19)); 
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 1 && parseInt(value) > 1) {
      value = `0${value}`;
    }
    if (value.length >= 2) {
      value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setExpiry(value.substring(0, 5));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvc(value.substring(0, 4));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3) {
       alert("Por favor, verifica que los datos de la tarjeta estén completos.");
       return;
    }

    setLoading(true);

    try {
      // 1. Actualizamos a Premium
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'premium' })
        .eq('id', user.id);

      if (error) throw error;

      // ==========================================
      // 2. NACIMIENTO DEL COMPAÑERO EN LA BD
      // ==========================================
      const { data: existingCompanion } = await supabase
        .from('user_companions')
        .select('id')
        .eq('patient_id', user.id)
        .single();

      if (!existingCompanion) {
        await supabase.from('user_companions').insert([{
          patient_id: user.id,
          stage: 'huevo',
          level: 1,
          xp: 0
        }]);
      }
      // ==========================================

      // 3. Enviamos Recibo Premium
      fetch('/api/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          name: profile?.full_name || 'Usuario',
          amount: amount,
          cycle: cycle
        })
      }).catch(err => console.error("Error enviando recibo:", err));

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error("Error en el pago:", error);
      alert("Hubo un error al procesar tu pago.");
      setLoading(false);
    }
  };

  // PANTALLA DE ÉXITO ESTILO PREMIUM
  if (success) {
    return (
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center py-20 px-4 animate-in zoom-in duration-500">
        <div className="bg-white/80 backdrop-blur-xl p-12 md:p-16 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white text-center flex flex-col items-center relative overflow-hidden max-w-2xl w-full">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#FDE047] opacity-[0.05] rounded-full blur-[40px] pointer-events-none"></div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#6C72F1] opacity-[0.05] rounded-full blur-[40px] pointer-events-none"></div>

          <div className="w-28 h-28 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/50 rounded-[32px] flex items-center justify-center mb-6 border border-[#FDE047] shadow-sm relative z-10">
            <Sparkles className="w-14 h-14 text-[#D97706]" strokeWidth={2} />
          </div>
          <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#333333] mb-4 tracking-tight z-10 leading-tight">¡Bienvenido a Premium!</h2>
          <p className="text-[#8A95A5] text-[16px] text-center max-w-md font-medium z-10 leading-relaxed">
            Tu pago fue exitoso. Preparando tu nuevo espacio seguro para que conozcas a tu compañero evolutivo...
          </p>
          
          <div className="mt-8 w-12 h-12 border-4 border-[#FDE047]/30 border-t-[#FBBF24] rounded-full animate-spin z-10"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-16 px-4 sm:px-6">
      
      {/* Contenedor central más ajustado para no estirar los inputs */}
      <div className="max-w-5xl mx-auto relative">
        
        <Link href="/dashboard/settings/plan" className="inline-flex items-center text-[13px] font-extrabold text-[#8A95A5] hover:text-[#6C72F1] transition-colors mb-8 gap-2 mt-4 uppercase tracking-wider bg-white/50 px-4 py-2 rounded-full border border-white shadow-sm backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Volver a planes
        </Link>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* RESUMEN DE COMPRA (Izquierda visualmente) */}
          {/* ======================================================== */}
          <div className="md:col-span-1 bg-white/90 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border-[3px] border-[#FDE047]/60 shadow-[0_10px_40px_rgba(253,224,71,0.15)] order-1 relative flex flex-col">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] border border-[#FDE047] text-[#D97706] text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 rounded-[12px] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> Seguro
            </div>

            <h3 className="text-[20px] font-extrabold mb-6 text-[#333333] mt-2">
              Resumen de compra
            </h3>
            
            <div className="flex justify-between items-center mb-6 bg-[#FFFBEB] p-4 rounded-[20px] border border-[#FEF3C7]">
              <span className="font-extrabold text-[#D97706] flex items-center gap-1.5"><Crown className="w-4 h-4" /> Nabi Premium</span>
              <span className="text-[#B45309] uppercase text-[10px] font-black tracking-widest bg-white px-2.5 py-1 rounded-md shadow-sm border border-[#FDE047]/30">{cycle}</span>
            </div>
            
            <div className="space-y-4 mb-8 pb-8 border-b border-gray-100 text-[14px] text-[#8A95A5] font-medium">
              <div className="flex justify-between">
                <span>Suscripción</span>
                <span className="font-extrabold text-[#333333]">${amount} MXN</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos</span>
                <span className="font-extrabold text-[#333333]">$0.00 MXN</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-[14px] font-extrabold text-[#8A95A5] pb-1.5">Total a pagar</span>
              <span className="text-[40px] font-black text-[#D97706] leading-none tracking-tight">${amount} <span className="text-[14px] text-[#B45309] font-bold uppercase tracking-widest">MXN</span></span>
            </div>

            <div className="bg-white/50 p-5 rounded-[24px] flex items-start gap-4 border border-white shadow-inner mt-auto">
              <ShieldCheck className="w-6 h-6 text-[#3EAFA8] flex-shrink-0" strokeWidth={2.5} />
              <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                Tu pago está cifrado de extremo a extremo. Puedes cancelar tu suscripción en cualquier momento desde tus ajustes.
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* FORMULARIO DE PAGO (Derecha visualmente) */}
          {/* ======================================================== */}
          <div className="md:col-span-2 bg-white/70 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] order-2 relative overflow-hidden">
            
            <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-[#6C72F1] opacity-[0.03] rounded-full blur-[40px] pointer-events-none"></div>

            <div className="mb-10 relative z-10 border-b border-gray-100/50 pb-8 flex items-center gap-5">
              <div className="w-14 h-14 bg-[#EEF0FF] rounded-[20px] flex items-center justify-center text-[#6C72F1] shadow-sm border border-white flex-shrink-0">
                <CreditCard className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[24px] font-extrabold text-[#333333] mb-1 leading-tight">
                  Detalles de pago
                </h2>
                <p className="text-[#8A95A5] text-[13px] font-medium">Ingresa los datos de tu tarjeta (Puedes inventarlos, es un entorno de prueba).</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Nombre en la tarjeta</label>
                <input 
                  type="text" 
                  placeholder="Ej. Pedro Gutierrez" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner text-[15px] placeholder:text-[#CBD5E1]" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Número de tarjeta</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required 
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner text-[16px] font-mono tracking-wider placeholder:text-[#CBD5E1]" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5">
                    <div className="w-9 h-6 bg-[#EFF6FF] rounded-md flex items-center justify-center text-[8px] font-black text-[#2563EB] border border-[#BFDBFE] shadow-sm">VISA</div>
                    <div className="w-9 h-6 bg-[#FFF7ED] rounded-md flex items-center justify-center text-[8px] font-black text-[#EA580C] border border-[#FFEDD5] shadow-sm">MC</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Expira (MM/AA)</label>
                  <input 
                    type="text" 
                    placeholder="12/28" 
                    value={expiry}
                    onChange={handleExpiryChange}
                    required 
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner text-[16px] font-mono tracking-widest text-center placeholder:text-[#CBD5E1]" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">CVC</label>
                  <input 
                    type="text" 
                    placeholder="123" 
                    value={cvc}
                    onChange={handleCvcChange}
                    required 
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner text-[16px] font-mono tracking-widest text-center placeholder:text-[#CBD5E1]" 
                  />
                </div>
              </div>

              <div className="pt-6 mt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#FDE047] to-[#F59E0B] hover:from-[#FBBF24] hover:to-[#D97706] text-[#78350F] rounded-[24px] font-extrabold text-[15px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(217,119,6,0.2)] hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#78350F]/30 border-t-[#78350F] rounded-full animate-spin"></div>
                      Procesando pago...
                    </span>
                  ) : (
                    `Pagar $${amount} MXN`
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
         <div className="w-12 h-12 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
         <p className="text-[#1E293B] font-extrabold text-[15px]">Cargando plataforma de pago...</p>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}