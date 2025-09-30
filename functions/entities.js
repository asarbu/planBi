export async function onRequestGet(context) {
	

	const url = new URL(context.request.url);
	const param = url.searchParams.get("id");

	let results = null;
	if(param) {
		results = await context.env.test_d1
			.prepare("SELECT * FROM Entities where ID = ?")
			.bind(param)
			.run()
			.results;
	} else {
		results = await context.env.test_d1
			.prepare("SELECT * FROM Entities")
			.run()
			.results;
	}

	return Response.json({results});
};
