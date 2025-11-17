export async function onRequestPost(context) {
	try {
		const requestBody = await context.request.json();
		const requiredFields = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot', 'location'];
		const missingFields = requiredFields.filter(f => !requestBody[f]);
		if (missingFields.length) {
			return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
		}

		return sendEmail(context, requestBody);
	} catch (err) {
		// TODO Throw error and log in middleware
		return Response.json({ error: err.message });
	}
}

export async function sendEmail(context, data, emailContent = '') {
	const emailRequest = {
		from: `PlanBi <${context.env.EMAIL_HELLO}>`,
		reply_to: 'noreply@planbi.ro',
		to: [ context.env.EMAIL_CONTACT, context.env.EMAIL_HELLO ],
		subject: `Solicitare nouă de la ${data.name}`,
		text: emailContent,
	};

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(emailRequest),
	});

	if (!response.ok) {
		const result = { status: response.status, response: response.statusText };
		// TODO Throw error and log in middleware
		return Response.json({ /* req: emailRequest, */ result: result }, { status: 500 });
	}
	
	const result = await response.json().catch((err) => {
		return Response.json({ error: 'Failed to parse Resend response', details: err.toString() }, { status: 500 });
	});
	
	return Response.json({ id: result.id });
}