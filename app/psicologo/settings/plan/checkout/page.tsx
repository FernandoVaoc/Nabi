"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, Lock, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';

function PsicologoCheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const cycle = searchParams.get('cycle') || 'mensual';
  const amount = searchParams.get('amount') || '299';
  const plan = (searchParams.get('plan') as 'plus' | 'ilimitado') || 'plus';

  const planLabel = plan === 'ilimitado' ? 'Nabi Ilimitado' : 'Nabi Plus';
  const planMessage = plan === 'ilimitado'
    ? 'Tu plan Ilimitado ha sido activado. Tu agenda ya no tiene límite de pacientes. ¡Gracias por confiar en Nabi!'
    : 'Tu plan Plus ha sido activado. Ahora puedes vincular hasta 15 pacientes. ¡Gracias por confiar en Nabi!';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formattedValue.substring(0, 19)); 
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 1 && parseInt(value) > 1) value = `0${value}`;
    if (value.length >= 2) value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
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
      // 1. Actualizamos el plan al paquete elegido (plus o ilimitado)
      const { error } = await supabase
        .from('profiles')
        .update({ plan: plan })
        .eq('id', user.id);

      if (error) throw error;

      // 2. CREAMOS LA NOTIFICACIÓN DIRECTAMENTE AQUÍ
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: '¡Suscripción Activada! 👑',
        message: planMessage,
        type: 'info'
      }]);

      // 3. Enviamos recibo por correo
      fetch('/api/premium-psicologo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: profile?.full_name || 'Psicólogo',
          amount: amount,
          cycle: cycle,
          plan: plan,
          planLabel: planLabel,
        })
      }).catch(err => console.error("Error enviando recibo:", err));

      // 4. Éxito
      setSuccess(true);
      setTimeout(() => {
        router.push('/psicologo/dashboard');
      }, 3000);

    } catch (error) {
      console.error("Error en el pago:", error);
      alert("Hubo un error al procesar tu pago.");
      setLoading(false);
    }
  };

  // VISTA DE ÉXITO (Diseño Premium)
  if (success) {
    return (
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center py-20 px-4 animate-in zoom-in duration-500">
        <div className="bg-white/80 backdrop-blur-xl p-12 md:p-16 rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white text-center flex flex-col items-center relative overflow-hidden max-w-2xl w-full">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#FDE047] opacity-[0.05] rounded-full blur-[40px] pointer-events-none"></div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#6C72F1] opacity-[0.05] rounded-full blur-[40px] pointer-events-none"></div>

          <div className="w-28 h-28 bg-gradient-to-br from-[#FEF3C7]/40 to-[#FFFBEB] rounded-[32px] flex items-center justify-center mb-6 border border-[#FDE047]/50 shadow-sm relative z-10">
            <CheckCircle2 className="w-14 h-14 text-[#D97706]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#333333] mb-4 tracking-tight z-10 leading-tight">¡Bienvenido a {planLabel}!</h2>
          <p className="text-[#8A95A5] text-[16px] text-center max-w-md font-medium z-10 leading-relaxed">
            Tu pago fue exitoso y el recibo fue enviado a tu correo. Redirigiendo a tu panel...
          </p>
          
          <div className="mt-8 w-12 h-12 border-4 border-[#FDE047]/30 border-t-[#FBBF24] rounded-full animate-spin z-10"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* Contenedor central más ajustado */}
      <div className="max-w-5xl mx-auto relative">

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* RESUMEN DE COMPRA (Izquierda visualmente) */}
          {/* ======================================================== */}
          <div className="md:col-span-1 bg-white/90 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border-[3px] border-[#6C72F1]/30 shadow-[0_10px_40px_rgba(108,114,241,0.15)] order-1 relative flex flex-col">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#EEF0FF] to-white border border-[#6C72F1]/50 text-[#6C72F1] text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 rounded-[12px] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> Seguro
            </div>

            <h3 className="text-[20px] font-extrabold mb-6 text-[#333333] mt-2">
              Resumen de compra
            </h3>
            
            <div className="flex justify-between items-center mb-6 bg-[#EEF0FF]/50 p-4 rounded-[20px] border border-white shadow-sm">
              <span className="font-extrabold text-[#6C72F1] flex items-center gap-1.5"><Crown className="w-4 h-4" strokeWidth={2.5} /> {planLabel}</span>
              <span className="text-[#5C61E1] uppercase text-[10px] font-black tracking-widest bg-white px-2.5 py-1 rounded-md shadow-sm border border-white">{cycle}</span>
            </div>
            
            <div className="space-y-4 mb-8 pb-8 border-b border-gray-100/50 text-[14px] text-[#8A95A5] font-medium">
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
              <span className="text-[40px] font-black text-[#6C72F1] leading-none tracking-tight">${amount} <span className="text-[14px] text-[#5C61E1] font-bold uppercase tracking-widest">MXN</span></span>
            </div>

            <div className="bg-white/50 p-5 rounded-[24px] flex items-start gap-4 border border-white shadow-inner mt-auto">
              <ShieldCheck className="w-6 h-6 text-[#3EAFA8] flex-shrink-0" strokeWidth={2.5} />
              <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                Tu pago está cifrado de extremo a extremo con SSL. Puedes cancelar tu suscripción en cualquier momento.
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
                  className="w-full py-4 bg-[#6C72F1] hover:bg-[#5C61E1] text-white rounded-[24px] font-extrabold text-[15px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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

export default function PsicologoCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in">
         <div className="w-12 h-12 border-4 border-[#6C72F1]/30 border-t-[#6C72F1] rounded-full animate-spin mb-4"></div>
         <p className="text-[#1E293B] font-extrabold text-[15px]">Cargando plataforma de pago...</p>
      </div>
    }>
      <PsicologoCheckoutForm />
    </Suspense>
  );
}