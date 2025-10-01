export async function onRequestPost(context) {
	const url = new URL(context.request.url);
    const formData = await context.request.formData();
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const county = formData.get("county");
    const telephone = formData.get("telephone");
	const param = url.searchParams.get("id");

	return Response.json({ fullName, email, county, telephone, success: true });
};