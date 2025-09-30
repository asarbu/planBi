export async function onRequestGet(context) {
    const { pathname: url } = new URL(context.request.url);

    const { results } = await context.env.test_d1
      .prepare("SELECT * FROM Entities")
      .run();

    const result = { pathname: url, params: url.searchParams, results: results };
    return Response.json(result);
};
