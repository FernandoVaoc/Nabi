import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// POST /api/auth/verify-code
// - Recibe { email, code }.
// - Verifica que exista un código válido (no usado, no expirado) para ese correo.
// - Marca el código como usado.
// - Cuenta intentos fallidos: a partir de 5 intentos, invalida el código.
// =============================================================================

const MAX_ATTEMPTS = 5;

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

    const { email, code } = await request.json();
    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Buscar el código activo más reciente para este correo
    const { data: rows, error } = await admin
      .from('email_verification_codes')
      .select('id, code, expires_at, attempts, used')
      .eq('email', cleanEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay un código activo. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    const record = rows[0];

    // ¿Expiró?
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await admin
        .from('email_verification_codes')
        .update({ used: true })
        .eq('id', record.id);
      return NextResponse.json(
        { error: 'El código expiró. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // ¿Coincide?
    if (record.code !== cleanCode) {
      const newAttempts = (record.attempts || 0) + 1;
      const shouldInvalidate = newAttempts >= MAX_ATTEMPTS;

      await admin
        .from('email_verification_codes')
        .update({
          attempts: newAttempts,
          used: shouldInvalidate,
        })
        .eq('id', record.id);

      if (shouldInvalidate) {
        return NextResponse.json(
          { error: 'Demasiados intentos fallidos. Solicita un nuevo código.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Código incorrecto.', remainingAttempts: MAX_ATTEMPTS - newAttempts },
        { status: 400 }
      );
    }

    // ¡Coincide! marcar como usado.
    await admin
      .from('email_verification_codes')
      .update({ used: true })
      .eq('id', record.id);

    return NextResponse.json({ message: 'Código verificado.' });
  } catch (error: any) {
    console.error('Error verificando código:', error);
    return NextResponse.json(
      { error: error?.message || 'Error verificando el código.' },
      { status: 500 }
    );
  }
}
