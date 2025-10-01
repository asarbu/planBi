export async function onRequestPost(context) {
    const requestBody = await context.request.json();

	if(!requestBody.fullName || !requestBody.email || !requestBody.county || !requestBody.telephone || !requestBody.date) {
		return Response.json({ error: 'Missing required fields' }, { status: 400 });
	}

    const result = await context.env.plan_bi.prepare("INSERT INTO Meetings (fullName, email, county, telephone, date) VALUES (?, ?, ?, ?, ?)")
        .bind(requestBody.fullName, requestBody.email, requestBody.county, requestBody.telephone, requestBody.date)
        .run();

	if(result.success)
		return Response.json({ success: result.success });
	else {
		return Response.json({ error: 'Failed to insert meeting data' }, { status: 500 });
	}
};

export async function onRequestGet(context) {
	const url = new URL(context.request.url);
	const param = url.searchParams.get("id");

	let sqlResponse = null;
	if(param) {
		sqlResponse =	 await context.env.plan_bi
			.prepare("SELECT * FROM Meetings where ID = ?")
			.bind(param)
			.run();
	} else {
		sqlResponse = await context.env.plan_bi
			.prepare("SELECT * FROM Meetings")
			.run();
	}

	if(sqlResponse.success) {
		return Response.json( { results: sqlResponse.results });
	} else {
		return Response.json({ error: 'Failed to retrieve meeting data' }, { status: 500 });
	}
};
