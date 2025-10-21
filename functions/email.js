import { Resend } from 'resend';
export async function onRequestPost(context) {
	try {
		   const requestBody = await context.request.json();
		   const requiredFields = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot'];
		   const missingFields = requiredFields.filter(f => !requestBody[f]);
		   if (missingFields.length) {
			   return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
		   }

		const messageBody = `
			Nume: ${requestBody.name}
			Email: ${requestBody.email}
			Telefon: ${requestBody.telephone}
			Tip Serviciu: ${requestBody.service_type}
			Dată: ${requestBody.date}
			Fereastră: ${requestBody.timeslot}
			Mesaj: ${requestBody.message || ''}
			`;

		//TODO Replace with fetch api. Remove build deps, clear build command in dashboard
		const resend = new Resend(context.env.RESEND_API_KEY);
		const emailRequest = {
			from: `PlanBi <${context.env.EMAIL_HELLO}>`,
			reply_to: 'noreply@planbi.ro',
			to: context.env.EMAIL_CONTACT,
			subject: `Solicitare nouă de la ${requestBody.name}`,
			text: messageBody,
		}
		const { data, error } = await resend.emails.send(emailRequest);
		if(error) {
			// TODO Log error somewhere
			return Response.json({ req: emailRequest, data: data, error: error }, { status: 500 });
		}
		return Response.json({ id: data.id });
	} catch (err) {
		// TODO Log error somewhere
		return Response.json({ exception: JSON.stringify(err) });
	}
}
