export async function onRequestGet(context) {
	const { results } = await context.env.test_d1
		.prepare("SELECT * FROM Entities")
		.run();

	const url = new URL(context.request.url);
	const param = url.searchParams.get("param");
	const result = { url: url, params: param, results: results };
	return Response.json(result);
};
