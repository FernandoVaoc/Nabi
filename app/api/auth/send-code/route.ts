import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// =============================================================================
// POST /api/auth/send-code
// - Genera un código de 6 dígitos.
// - Lo guarda en la tabla email_verification_codes con expiración de 2 minutos.
// - Lo envía al correo del usuario.
// - Throttle: si ya se envió un código a ese correo en los últimos 30s,
//   responde 429 para evitar spam.
// =============================================================================

const CODE_TTL_SECONDS = 120;        // 2 minutos
const THROTTLE_SECONDS = 30;         // 30 seg entre reenvíos

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

    const { email, name } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Throttle: ¿se envió un código hace menos de 30s?
    const throttleSince = new Date(Date.now() - THROTTLE_SECONDS * 1000).toISOString();
    const { data: recent } = await admin
      .from('email_verification_codes')
      .select('id, created_at')
      .eq('email', cleanEmail)
      .gte('created_at', throttleSince)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { error: 'Espera unos segundos antes de pedir otro código.' },
        { status: 429 }
      );
    }

    // 2) Invalidar códigos previos del mismo correo (no usados)
    await admin
      .from('email_verification_codes')
      .update({ used: true })
      .eq('email', cleanEmail)
      .eq('used', false);

    // 3) Generar nuevo código
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();

    const { error: insertError } = await admin
      .from('email_verification_codes')
      .insert([{ email: cleanEmail, code, expires_at: expiresAt }]);

    if (insertError) throw insertError;

    // 4) Enviar correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const safeName = (name && typeof name === 'string') ? name : 'Bienvenido';

    const html = `
      <div style="background-color: #F8FAFF; padding: 40px 20px; font-family: sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px rgba(108, 114, 241, 0.1); border-top: 8px solid #6C72F1;">
          <div style="text-align: center; margin-bottom: 24px;"><span style="font-size: 50px;">🔐</span></div>
          <h1 style="color: #1E293B; text-align: center; font-size: 24px; font-weight: 800; margin: 0 0 8px;">Verifica tu correo, ${safeName}</h1>
          <p style="color: #475569; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 24px;">
            Usa este código para terminar de crear tu cuenta en Nabi. El código expira en <b>2 minutos</b>.
          </p>

          <div style="background-color: #EEF0FF; border: 1px solid #C7CBFF; border-radius: 16px; padding: 24px; margin: 16px 0; text-align: center;">
            <p style="color: #5C61E1; font-size: 11px; font-weight: 800; letter-spacing: 0.2em; margin: 0 0 8px;">TU CÓDIGO</p>
            <p style="color: #1E293B; font-size: 40px; font-weight: 900; letter-spacing: 0.4em; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
          </div>

          <p style="color: #94A3B8; font-size: 13px; text-align: center; margin: 24px 0 0;">
            Si tú no solicitaste este código, ignora este correo. Tu cuenta no se creará.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0 16px;" />
          <p style="color: #94A3B8; font-size: 13px; text-align: center; margin: 0;">Con cariño, <b>El equipo de Nabi 🦋</b></p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Nabi App 🦋" <${process.env.GMAIL_EMAIL}>`,
      to: cleanEmail,
      subject: 'Tu código de verificación de Nabi',
      html,
    });

    return NextResponse.json({ message: 'Código enviado.', expiresInSeconds: CODE_TTL_SECONDS });
  } catch (error: any) {
    console.error('Error enviando código:', error);
    return NextResponse.json(
      { error: error?.message || 'Error enviando el código.' },
      { status: 500 }
    );
  }
}
