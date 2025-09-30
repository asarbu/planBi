export async function onRequestGet(context) {
	

	const url = new URL(context.request.url);
	const param = url.searchParams.get("id");

	let entities = null;
	if(param) {
		entities = await context.env.test_d1
			.prepare("SELECT * FROM Entities where ID = ?")
			.bind(param)
			.run()
			.results;
	} else {
		entities = await context.env.test_d1
			.prepare("SELECT * FROM Entities")
			.run()
			.results;
	}

	return Response.json(entities);
};
