import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Endpoint para eliminar la cuenta del usuario autenticado.
// - Verifica la sesión usando el access token (Authorization: Bearer ...).
// - Limpia todas las tablas relacionadas (no tienen ON DELETE CASCADE).
// - Si el usuario es psicólogo, desvincula a sus pacientes.
// - Borra el perfil y, finalmente, el usuario de auth.users.
//
// Requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY (key con permisos
// de service_role de Supabase). NO la expongas al cliente.
// =============================================================================

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no configurada en el servidor.' },
        { status: 500 }
      );
    }

    // 1) Verificar al usuario con su access token.
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 });
    }
    const userId = userData.user.id;

    // 2) Detectar rol para limpieza condicional
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const role = profile?.role;

    // 3) Limpieza dependiente del rol
    if (role === 'psicologo') {
      // Desvincular a los pacientes que tenía asignados
      await admin
        .from('profiles')
        .update({ psychologist_id: null })
        .eq('psychologist_id', userId);

      // Borrar tareas personalizadas que asignó
      await admin.from('custom_tasks').delete().eq('psychologist_id', userId);

      // Borrar tareas asignadas por este psicólogo en patient_tasks
      await admin.from('patient_tasks').delete().eq('assigned_by', userId);
    }

    // 4) Limpieza común para cualquier usuario
    await admin.from('mood_logs').delete().eq('patient_id', userId);
    await admin.from('user_companions').delete().eq('patient_id', userId);
    await admin.from('patient_tasks').delete().eq('patient_id', userId);
    await admin.from('custom_tasks').delete().eq('patient_id', userId);
    await admin.from('initial_assessments').delete().eq('patient_id', userId);
    await admin.from('notifications').delete().eq('user_id', userId);

    // 5) Borrar el perfil
    await admin.from('profiles').delete().eq('id', userId);

    // 6) Borrar el usuario de auth.users
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return NextResponse.json({ message: 'Cuenta eliminada con éxito.' });
  } catch (error: any) {
    console.error('Error eliminando cuenta:', error);
    return NextResponse.json(
      { error: error?.message || 'Error eliminando la cuenta.' },
      { status: 500 }
    );
  }
}
