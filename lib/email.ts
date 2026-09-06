import "server-only";
import { Resend } from "resend";

const FROM_EMAIL = "Nexa Bug Tracker <notificaciones@nexaconsultingti.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Never throws: a failed email shouldn't break the ticket update it's tied to.
export async function sendTicketAssignedEmail({
  to,
  ticketCode,
  ticketTitle,
  ticketId,
  assignedByName,
}: {
  to: string;
  ticketCode: string;
  ticketTitle: string;
  ticketId: string;
  assignedByName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada — no se envió el correo de asignación.");
    return;
  }

  const ticketUrl = `${SITE_URL}/tickets/${ticketId}`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[${ticketCode}] Te asignaron un ticket: ${ticketTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p>Hola,</p>
          <p><strong>${assignedByName}</strong> te asignó el ticket <strong>${ticketCode}</strong>:</p>
          <p style="font-size: 16px; margin: 16px 0;">${ticketTitle}</p>
          <p>
            <a href="${ticketUrl}" style="background: #0f2a4a; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
              Ver ticket
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Nexa Bug Tracker</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Error enviando correo de asignación:", err);
  }
}
