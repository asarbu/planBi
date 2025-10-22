export async function onRequestPost(context) {
	try {
		const requestBody = await context.request.json();
		const requiredFields = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot', 'location'];
		const missingFields = requiredFields.filter(f => !requestBody[f]);
		if (missingFields.length) {
			return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
		}

		const emailContent = `
			Nume: ${requestBody.name}
			Email: ${requestBody.email}
			Telefon: ${requestBody.telephone}
			Tip Serviciu: ${requestBody.service_type}
			Dată: ${requestBody.date.toLocaleDateString("ro-RO")}
			Fereastră: ${requestBody.timeslot}
			Locație: ${requestBody.location}
			Notițe: ${requestBody.message || ''}
			`;

		const emailRequest = {
			from: `PlanBi <${context.env.EMAIL_HELLO}>`,
			reply_to: 'noreply@planbi.ro',
			to: context.env.EMAIL_CONTACT,
			subject: `Solicitare nouă de la ${requestBody.name}`,
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
			return { error: 'Failed to parse Resend response', details: err.toString() };
		});
		
		return Response.json({ id: result.id });
	} catch (err) {
		// TODO Throw error and log in middleware
		return Response.json({ error: err.message });
	}
}
