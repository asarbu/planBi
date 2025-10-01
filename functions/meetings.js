export async function onRequestPost(context) {
	const url = new URL(context.request.url);
	//const param = url.searchParams.get("id");
    const formData = await context.request.formData();
    /*const fullName = formData.get("fullName");
    const email = formData.get("email");
    const county = formData.get("county");
    const telephone = formData.get("telephone");*/

	return Response.json({ formData: JSON.stringify(formData) });
};