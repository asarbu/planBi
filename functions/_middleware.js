export async function onRequest(context) {
	const { request, env, next, waitUntil } = context;
	if (request.method !== "POST") {
		return next();
	}

	// We must clone because 'request' can only be consumed once.
	const requestClone = request.clone();
	let requestBody = "";

	try {
		requestBody = await requestClone.text();
	} catch (e) {
		requestBody = "[Error: Request data is unreadable]";
	}
	let response;
	let responseBody = "";
	try {
		response = await next();
		console.log('Response:', response);

		// We must clone because 'response' needs to be sent back to the user.
		const responseClone = response.clone();
		responseBody = await responseClone.text();
	} catch (e) {
		response = new Response('Internal Server Error:' + e.message, { status: 500 });
		responseBody = "[Error: Response data is unreadable]";
	}

	console.log('Response:', response, "Request:", request, "Request Body:", requestBody, "Response Body:", responseBody);
	const logEntry = {
		//TODO : Remove this and replace with object instance
		timestamp: new Date().toISOString(),
		request: {
			url: request.url,
			headers: Object.fromEntries(request.headers),
			body: requestBody,
		},
		response: {
			status: response.status,
			headers: Object.fromEntries(response.headers),
			body: responseBody,
		}
	};

	//TODO remove date object
	const logKey = `log:${Date.now()}:${crypto.randomUUID()}`;
	waitUntil(
		env.logs.put(logKey, JSON.stringify(logEntry), {
			expirationTtl: 63072000 // Auto-delete after 2 years
		})
	);

	return response;
}
