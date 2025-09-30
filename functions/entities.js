export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    console.log("Pathname:", pathname);
    // If you did not use `DB` as your binding name, change it here
    const { results } = await env.test_d1
    .prepare("SELECT * FROM Entities")
    .run();
    return Response.json(results);
  },
};