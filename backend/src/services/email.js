import nodemailer from 'nodemailer';

export function createTransport() {
	const host = process.env.SMTP_HOST;
	const port = parseInt(process.env.SMTP_PORT || '587', 10);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!host || !user || !pass) throw new Error('SMTP credentials not set');
	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass }
	});
}

export async function sendSummaryEmail({ recipients, subject, body }) {
	const transporter = createTransport();
	const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
	const info = await transporter.sendMail({
		from,
		to: recipients.join(','),
		subject,
		html: body
	});
	return info;
}