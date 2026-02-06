import config from '../../../config.js';
import { OrganizationRequest } from '../../../db/types.js';
import { sendEmail } from '../../../SMTP/mailer.js';

export async function sendOrganizationAcceptanceEmail(
  organizationRequest: OrganizationRequest,
  password: string,
) {
  const to = organizationRequest.email;

  const subject = 'Your organization request was accepted';

  const text
    = +`Hello ${organizationRequest.name},\n\n`
      + `Your organization request has been accepted.\n\n`
      + `Temporary credentials:\n`
      + `Email/Username: ${to}\n`
      + `Temporary password: ${password}\n\n`
      + `Login: ${config.CLIENT_URL}\n\n`
      + `Please change your password after logging in.\n\n`
      + `Willing Team\n`
      + `Automated message. Do not reply.`;

  await sendEmail({ to, subject, text });
}

export async function sendOrganizationRejectionEmail(
  organizationRequest: OrganizationRequest,
  reason: string | null,
) {
  const to = organizationRequest.email;

  const subject = 'Your organization request was rejected';

  const reasonBlock
    = reason && reason.trim().length
      ? `Reason: ${reason.trim()}\n\n`
      : '';

  const text
    = `Hello ${organizationRequest.name},\n\n`
      + `Your organization request has been rejected.\n\n`
      + reasonBlock
      + `If you believe this was a mistake, you can submit a new request with updated information.\n`
      + 'For any extra questions, please contact us at ' + config.ADMIN_EMAIL + '.\n\n'
      + `Willing Team\n`
      + `Automated message. Do not reply.`;

  await sendEmail({ to, subject, text });
}

export async function sendAdminOrganizationRequestEmail(
  organizationRequest: OrganizationRequest,
) {
  const to = config.ADMIN_EMAIL;

  const subject = 'New organization request submitted!';

  const text
    = `A new organization request has been submitted.\n\n`
      + `Organization name: ${organizationRequest.name}\n`
      + `Organization email: ${organizationRequest.email}\n`
      + `Phone: ${organizationRequest.phone_number ?? '—'}\n`
      + `Website: ${organizationRequest.url ?? '—'}\n`
      + `Location: ${organizationRequest.location_name}\n\n`
      + `Review it in the admin dashboard: ${config.ADMIN_URL}\n`;

  await sendEmail({ to, subject, text });
}
