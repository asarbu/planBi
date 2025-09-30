export async function onRequestGet(context) {
    const { results } = await context.env.test_d1
      .prepare("SELECT * FROM Entities")
      .run();

    const result = { ctx: context, results: results };
    return Response.json(result);
};
