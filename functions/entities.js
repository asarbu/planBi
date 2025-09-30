export async function onRequestGet(context) {
	

	const url = new URL(context.request.url);
	const param = url.searchParams.get("id");

	let sqlResponse = null;
	if(param) {
		sqlResponse = await context.env.test_d1
			.prepare("SELECT * FROM Entities where ID = ?")
			.bind(param)
			.run();
	} else {
		sqlResponse = await context.env.test_d1
			.prepare("SELECT * FROM Entities")
			.run();
	}

	return Response.json(sqlResponse.results);
};
