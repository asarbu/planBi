import { Resend } from 'resend';
export async function onRequestPost(context) {
	try {
		const requestBody = await context.request.json();
		if (!requestBody.name
			|| !requestBody.email
			|| !requestBody.telephone
			|| !requestBody.service_type
			|| !requestBody.date
			|| !requestBody.timeslot) {
				const missingFields = [];
				if (!requestBody.name) missingFields.push('name');
				if (!requestBody.email) missingFields.push('email');
				if (!requestBody.telephone) missingFields.push('telephone');
				if (!requestBody.service_type) missingFields.push('service_type');
				if (!requestBody.date) missingFields.push('date');
				if (!requestBody.timeslot) missingFields.push('timeslot');
				return Response.json({ error: 'Missing required fields', missingFields }, { status: 400 });
		}

		const messageBody = `
			Name: ${requestBody.name}
			Email: ${requestBody.email}
			Telephone: ${requestBody.telephone}
			Service Type: ${requestBody.service_type}
			Date: ${requestBody.date}
			Timeslot: ${requestBody.timeslot}
			Message: ${requestBody.message || ''}
			`;

		const resend = new Resend(context.env.RESEND_API_KEY);
		const emailRequest = {
			from: context.env.EMAIL_HELLO,
			reply_to: 'noreply@planbi.ro',
			to: context.env.EMAIL_SEBI,
			subject: `New Consultation Request from ${requestBody.name}`,
			text: messageBody,
		}
		const { data, error } = await resend.emails.send(emailRequest);
		return Response.json({ req: emailRequest, data: data, error: error });
	} catch (err) {
		return Response.json({ exception: JSON.stringify(err) });
	}
}
