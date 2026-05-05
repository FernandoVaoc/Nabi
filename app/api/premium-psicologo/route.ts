import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, amount, cycle, plan, planLabel } = await request.json();

    const isUnlimited = plan === 'ilimitado';
    const labelText = planLabel || (isUnlimited ? 'Nabi Ilimitado' : 'Nabi Plus');
    const benefit = isUnlimited
      ? 'Tu agenda ya no tiene límite de pacientes. Comparte tu código de vinculación con todos los que quieras.'
      : 'Ahora puedes vincular hasta 15 pacientes y monitorear su progreso sin restricciones.';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Nabi para Profesionales 🩺" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: `¡Bienvenido a ${labelText}! 🚀`,
      html: `
        <div style="background-color: #F8FAFF; padding: 40px 20px; font-family: sans-serif;">
          <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15); border-top: 8px solid #3B82F6;">
            <div style="text-align: center; margin-bottom: 24px;"><span style="font-size: 50px;">🩺</span></div>
            <h1 style="color: #1E293B; text-align: center; font-size: 24px; font-weight: 800;">¡Gracias por tu confianza, ${name}!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
              Tu suscripción al plan <b>${labelText} (${cycle})</b> se ha activado correctamente. Tu pago de <b>$${amount} MXN</b> ha sido procesado de forma segura.
            </p>

            <div style="background-color: #EFF6FF; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #BFDBFE;">
              <h2 style="color: #1D4ED8; font-size: 18px; margin-top: 0;">${isUnlimited ? 'Tu agenda ahora es ilimitada' : 'Más cupos para tus pacientes'}</h2>
              <p style="color: #1E40AF; font-size: 14px; margin-bottom: 0;">
                ${benefit}
              </p>
            </div>

            <p style="color: #94A3B8; font-size: 14px; text-align: center;">Atentamente, <b>El equipo de Nabi</b></p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Recibo enviado con éxito" });
  } catch (error) {
    console.error("Error enviando recibo:", error);
    return NextResponse.json({ error: "Error enviando correo" }, { status: 500 });
  }
}
