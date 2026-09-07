export async function persistToDatabase(context, data) {
	const servicesJson = JSON.stringify(data.services || []);
	const result = await context.env.plan_bi.prepare("INSERT INTO Consultations (name, email, telephone, service_type, services, date, timeslot, location, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
		.bind(data.name, data.email, data.telephone, data.service_type, servicesJson, data.date, data.timeslot, data.location, data.message)
		.run();

	return result;
}
