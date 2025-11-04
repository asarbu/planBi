export async function onRequestPost(context) {
    const requestBody = await context.request.json();
	const requiredFields = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot', 'location'];
	const missingFields = requiredFields.filter(f => !requestBody[f]);
	if (missingFields.length) {
		return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
	}

    const result = await persistToDatabase(context, requestBody);

	if(result.success)
		return Response.json({ success: result.success });
	else {
		return Response.json({ error: 'Failed to insert meeting data' }, { status: 500 });
	}
};

export async function persistToDatabase(context, data) {
	const result = await context.env.plan_bi.prepare("INSERT INTO Consultations (name, email, telephone, service_type, date, timeslot, location, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
		.bind(data.name, data.email, data.telephone, data.service_type, data.date, data.timeslot, data.location, data.message)
		.run();

	return result;
}

export async function onRequestGet(context) {
	const url = new URL(context.request.url);
	const param = url.searchParams.get("id");

	let sqlResponse = null;
	if(param) {
		sqlResponse =	 await context.env.plan_bi
			.prepare("SELECT * FROM Consultations where ID = ?")
			.bind(param)
			.run();
	} else {
		sqlResponse = await context.env.plan_bi
			.prepare("SELECT * FROM Consultations")
			.run();
	}

	if(sqlResponse.success) {
		return Response.json( { results: sqlResponse.results });
	} else {
		return Response.json({ error: 'Failed to retrieve consultation data' }, { status: 500 });
	}
};
