export async function onRequest(context) {
    const { pathname } = new URL(context.request.url);

    alert("Pathname:", pathname);
    const { results } = await context.env.test_d1
      .prepare("SELECT * FROM Entities")
      .run();
    return Response.json(results);
};
