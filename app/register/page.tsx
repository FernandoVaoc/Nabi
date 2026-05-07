"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ShieldCheck, MailCheck, RotateCw } from "lucide-react";

type Step = 'form' | 'code';

export default function Register() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("paciente");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- Estado paso de código ---
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [resendCooldown, setResendCooldown] = useState(30);
  const codeInputs = useRef<Array<HTMLInputElement | null>>([]);

  // Cuenta regresiva del código
  useEffect(() => {
    if (step !== 'code') return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step, secondsLeft]);

  // Cooldown de reenvío
  useEffect(() => {
    if (step !== 'code') return;
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step, resendCooldown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  // ----- Paso 1: Validar formulario y solicitar código -----
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar el código.');

      setStep('code');
      setCode(["", "", "", "", "", ""]);
      setSecondsLeft(120);
      setResendCooldown(30);
      setTimeout(() => codeInputs.current[0]?.focus(), 50);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el código.");
    } finally {
      setLoading(false);
    }
  };

  // ----- Reenviar código -----
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo reenviar.');
      setCode(["", "", "", "", "", ""]);
      setSecondsLeft(120);
      setResendCooldown(30);
      codeInputs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al reenviar el código.");
    } finally {
      setLoading(false);
    }
  };

  // ----- Manejo de inputs del código (6 casillas) -----
  const handleCodeChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    const next = [...code];
    next[index] = v;
    setCode(next);
    if (v && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    codeInputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ----- Paso 2: Verificar código y crear cuenta -----
  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setErrorMsg("Ingresa los 6 dígitos del código.");
      return;
    }

    setLoading(true);
    try {
      // 1) Verificar código
      const verifyRes = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData?.error || 'Código inválido.');

      // 2) Crear cuenta en Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        const codigoGenerado = role === 'psicologo'
          ? `PSY-${Math.floor(1000 + Math.random() * 9000)}`
          : null;

        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: name,
            role: role,
            link_code: codigoGenerado,
          },
        ]);

        if (profileError) throw profileError;
      }

      // 3) Correo de bienvenida (no bloqueante)
      fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      }).catch(err => console.error("Error al llamar al cartero:", err));

      alert("¡Cuenta creada con éxito! Bienvenido a Nabi.");

      if (role === 'psicologo') {
        router.push("/psicologo/dashboard");
      } else {
        router.push("/test");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Hubo un error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabi_auth_action', 'register');
        localStorage.setItem('nabi_pending_role', role);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error con Google:", error);
      setErrorMsg("Hubo un error al intentar conectar con Google.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9] p-6 relative overflow-hidden font-sans">

      {/* Decoración de fondo (Glassmorphism blobs) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#6C72F1] opacity-[0.05] rounded-full blur-[60px]"></div>
         <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#3EAFA8] opacity-[0.05] rounded-full blur-[60px]"></div>
      </div>

      <div className="w-full max-w-[550px] bg-white/80 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 my-8">

        {/* Logo Centrado */}
        <div className="w-20 h-20 bg-white rounded-[24px] shadow-sm border border-[#E2E8F0] flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Nabi Logo" className="w-12 h-12 object-contain hover:scale-105 transition-transform" />
        </div>

        {step === 'form' ? (
          <>
            <h1 className="text-[32px] font-extrabold text-[#333333] mb-2 tracking-tight leading-tight text-center">
              Crear cuenta
            </h1>
            <p className="text-[#8A95A5] mb-8 font-medium text-[15px] text-center leading-relaxed">
              ¿Ya tienes una cuenta? <Link href="/login" className="text-[#6C72F1] font-extrabold hover:text-[#5C61E1] transition-colors">Inicia sesión</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[28px] font-extrabold text-[#333333] mb-2 tracking-tight leading-tight text-center flex items-center gap-2">
              <MailCheck className="w-7 h-7 text-[#6C72F1]" strokeWidth={2.5} /> Verifica tu correo
            </h1>
            <p className="text-[#8A95A5] mb-2 font-medium text-[14px] text-center leading-relaxed">
              Te enviamos un código de 6 dígitos a
            </p>
            <p className="text-[#333333] mb-6 font-extrabold text-[14px] text-center break-all">{email}</p>
          </>
        )}

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="w-full mb-6 bg-[#FEF2F2]/90 backdrop-blur-sm border border-[#FECACA] p-4 rounded-[20px] flex items-start gap-3 shadow-sm">
             <ShieldCheck className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
             <p className="text-[#B91C1C] text-[13px] font-bold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleRequestCode} className="w-full space-y-6">

            {/* Selector de Rol */}
            <div className="mb-2">
              <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-3 pl-2 text-center sm:text-left">¿Cómo usarás Nabi?</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex flex-col items-center justify-center py-4 border-2 rounded-[20px] cursor-pointer transition-all ${role === 'paciente' ? 'border-[#3EAFA8] bg-[#E5F7F4] text-[#0F766E] shadow-sm' : 'border-white bg-white/50 text-[#8A95A5] hover:bg-white hover:shadow-sm'}`}>
                  <input type="radio" name="role" value="paciente" checked={role === 'paciente'} onChange={() => setRole('paciente')} className="hidden" />
                  <span className="font-extrabold text-[14px]">Soy Paciente</span>
                </label>
                <label className={`flex-1 flex flex-col items-center justify-center py-4 border-2 rounded-[20px] cursor-pointer transition-all ${role === 'psicologo' ? 'border-[#6C72F1] bg-[#EEF0FF] text-[#5C61E1] shadow-sm' : 'border-white bg-white/50 text-[#8A95A5] hover:bg-white hover:shadow-sm'}`}>
                  <input type="radio" name="role" value="psicologo" checked={role === 'psicologo'} onChange={() => setRole('psicologo')} className="hidden" />
                  <span className="font-extrabold text-[14px]">Soy Psicólogo</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2 mt-6">Nombre completo</label>
              <input
                type="text"
                placeholder="Ej. Laura Méndez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:font-medium placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Correo electrónico</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:font-medium placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:font-medium placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-2 pl-2">Confirmar</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-[24px] text-[#333333] font-bold focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all placeholder:font-medium placeholder:text-[#CBD5E1] shadow-inner text-[15px]"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-[24px] bg-[#6C72F1] hover:bg-[#5C61E1] text-white font-extrabold text-[14px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enviando código...
                  </>
                ) : (
                  "Comenzar gratis"
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyAndCreate} className="w-full space-y-6">

            {/* 6 casillas de código */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeInputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center bg-white/70 border-2 border-white rounded-[16px] text-[#333333] font-black text-[24px] focus:outline-none focus:bg-white focus:border-[#6C72F1] focus:ring-4 focus:ring-[#EEF0FF] transition-all shadow-inner"
                />
              ))}
            </div>

            {/* Contador de expiración */}
            <div className="text-center">
              {secondsLeft > 0 ? (
                <p className="text-[#8A95A5] text-[13px] font-bold">
                  El código expira en <span className="text-[#6C72F1] font-extrabold">{formatTime(secondsLeft)}</span>
                </p>
              ) : (
                <p className="text-[#EF4444] text-[13px] font-bold">El código expiró. Solicita uno nuevo.</p>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || secondsLeft <= 0 || code.join('').length !== 6}
                className="w-full py-4 rounded-[24px] bg-[#6C72F1] hover:bg-[#5C61E1] text-white font-extrabold text-[14px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  "Verificar y crear cuenta"
                )}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || resendCooldown > 0}
                className="w-full py-3 rounded-[20px] bg-white/60 border border-white text-[#6C72F1] font-extrabold text-[13px] uppercase tracking-wider transition-all hover:bg-white disabled:opacity-50 flex justify-center items-center gap-2"
              >
                <RotateCw className="w-4 h-4" strokeWidth={2.5} />
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('form'); setErrorMsg(""); }}
                className="text-[#8A95A5] text-[12px] font-bold hover:text-[#333333] transition-colors flex items-center justify-center gap-1.5 mt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                Cambiar correo
              </button>
            </div>
          </form>
        )}

        {step === 'form' && (
          <>
            {/* Separador */}
            <div className="w-full mt-10 mb-8 flex items-center justify-center opacity-60">
              <div className="h-[1px] bg-[#CBD5E1] flex-1"></div>
              <span className="px-4 text-[10px] font-black text-[#8A95A5] uppercase tracking-[0.2em]">O registrarse con</span>
              <div className="h-[1px] bg-[#CBD5E1] flex-1"></div>
            </div>

            {/* Botón de Google */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white/60 backdrop-blur-md border border-white text-[#333333] font-extrabold py-4 rounded-[24px] hover:bg-white transition-all shadow-sm hover:shadow-md text-[14px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>
          </>
        )}

      </div>
    </main>
  );
}
