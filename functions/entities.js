export async function onRequest(context) {
    const { pathname } = new URL(context.request.url);

    const { results } = await context.env.test_d1
      .prepare("SELECT * FROM Entities")
      .run();

    const result = { pathname: pathname, params: context.params, results: results };
    return Response.json(result);
};
