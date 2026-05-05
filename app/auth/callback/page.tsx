"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                // Intentamos obtener el perfil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, selected_route, full_name, assessment_completed')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    // --- CASO A: EL USUARIO YA EXISTÍA ---
                    localStorage.removeItem('nabi_auth_action');
                    localStorage.removeItem('nabi_pending_role');

                    if (profile.role === 'psicologo') {
                        router.push('/psicologo/dashboard');
                    } else if (!profile.assessment_completed) {
                        router.push('/test');
                    } else if (profile.selected_route) {
                        router.push('/dashboard');
                    } else {
                        router.push('/onboarding');
                    }
                    return;
                } else {
                    // --- CASO B: EL PERFIL NO EXISTE EN LA BASE DE DATOS ---
                    const authAction = localStorage.getItem('nabi_auth_action');
                    const savedRole = localStorage.getItem('nabi_pending_role') || 'paciente';

                    // 1. Si intentaba Iniciar Sesión pero no hay perfil, es un error
                    if (authAction === 'login') {
                        await supabase.auth.signOut(); 
                        localStorage.removeItem('nabi_auth_action');
                        localStorage.removeItem('nabi_pending_role');
                        router.push('/login?error=no_account'); 
                        return;
                    }

                    // 2. Si venía de Registro, creamos el perfil ahora
                    const codigoGenerado = savedRole === 'psicologo'
                        ? `PSY-${Math.floor(1000 + Math.random() * 9000)}`
                        : null;

                    const fullName = user.user_metadata?.full_name || 'Nuevo Usuario';

                    const { error: insertError } = await supabase.from('profiles').insert([{
                        id: user.id,
                        role: savedRole,
                        full_name: fullName,
                        link_code: codigoGenerado,
                        share_tasks: true,
                        share_streak: true,
                        share_surveys: true,
                        share_emotion: true
                    }]);

                    if (insertError) throw insertError;

                    // 3. ENVIAR CORREO DE BIENVENIDA (Solo si la creación fue exitosa)
                    fetch('/api/welcome', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            name: fullName,
                            role: savedRole
                        })
                    }).catch(err => console.error("Error al llamar al cartero:", err));

                    // 4. Limpiar memoria y redirigir
                    localStorage.removeItem('nabi_auth_action');
                    localStorage.removeItem('nabi_pending_role');

                    if (savedRole === 'psicologo') {
                        router.push('/psicologo/dashboard');
                    } else {
                        router.push('/test');
                    }
                }
            } catch (error) {
                console.error("Error en la verificación:", error);
                router.push('/login');
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF]">
            <div className="w-16 h-16 border-4 border-[#EAF1FF] border-t-[#7FA8F8] rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-[#1E293B] mb-2">Verificando tu cuenta...</h2>
            <p className="text-[#64748B]">Preparando tu espacio en Nabi.</p>
        </div>
    );
}