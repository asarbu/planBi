import { Resend } from 'resend';
export async function onRequestPost(context) {
	try {
		const requestBody = await context.request.json();
		if(!requestBody.name || !requestBody.email || !requestBody.telephone || !requestBody.date) {
			return Response.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Using text instead of email so that I don't need to sanitize it
		const resend = new Resend(context.env.RESEND_API_KEY);
		const { data, error } = await resend.emails.send({
			from: context.env.EMAIL_HELLO,
			reply_to: 'output@email.ro',
			to: context.env.EMAIL_CONTACT,
			subject: `This is a test`,
			text: JSON.stringify(requestBody),
		});
		return Response.json({ data: data, error: error });
	} catch (err) {
		return Response.json({ exception: JSON.stringify(err) });
	}
}
