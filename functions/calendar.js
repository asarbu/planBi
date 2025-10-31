export async function onRequestGet(context) {
	const now = new Date().toISOString();
	const inTwoMonths = new Date();
	inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);
	const timeMax = inTwoMonths.toISOString();
	const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(context.env.CALENDAR)}/events?key=${encodeURIComponent(context.env.CALENDAR_API_KEY)}&timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(timeMax)}`)
	const calendar = await response.json();

	/** @type {Array} */
	let events = calendar.items;
	events = events
		.filter((event) => event.status === 'confirmed' && event.start && event.end)
		.map(event => ({ start: event.start, end: event.end }));
	return new Response(JSON.stringify(events));
}

export async function onRequestPost(context) {
	try {
	const now = Math.floor(Date.now() / 1000);

	const header = {
		alg: "RS256",
		typ: "JWT",
	};

	const claims = {
		iss: context.env.GOOGLE_CLIENT_EMAIL,
		scope: "https://www.googleapis.com/auth/calendar.events",
		aud: "https://oauth2.googleapis.com/token",
		exp: now + 3600,
		iat: now,
	};

	// Encode and sign JWT manually
	const jwtUnsigned = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(claims))}`;

	const privateKey = await importPrivateKey(context.env.GOOGLE_PRIVATE_KEY);
	const signature = await crypto.subtle.sign(
		{ name: "RSASSA-PKCS1-v1_5" },
		privateKey,
		new TextEncoder().encode(jwtUnsigned)
	);

	const jwt = `${jwtUnsigned}.${base64urlEncode(signature)}`;

	// Exchange JWT for Access Token
	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion: jwt,
		}),
	});

	const tokenData = await tokenRes.json();
	if (!tokenRes.ok) {
		return new Response(`Failed to get access token: ${JSON.stringify(tokenData)}`, { status: 500 });
	}

	const accessToken = tokenData.access_token;
	const requestBody = await context.request.json();
	// read event details from request body
	const description = `
			Nume: ${requestBody.name}
			Email: ${requestBody.email}
			Telefon: ${requestBody.telephone}
			Tip Serviciu: ${requestBody.service_type}
			Dată: ${requestBody.date}
			Fereastră: ${requestBody.timeslot}
			Locație: ${requestBody.location}
			Notițe: ${requestBody.message || ''}
			`;
	const startDateTime = new Date(`${requestBody.date}T${requestBody.timeslot.split('-')[0]}:00`);
	const endDateTime = new Date(startDateTime);
	endDateTime.setMinutes(endDateTime.getMinutes() + 60);
	const event = {
		summary: "PlanBi - " + requestBody.name,
		description: description,
		start: { dateTime: startDateTime, timeZone: "Europe/Bucharest" },
		end: { dateTime: endDateTime, timeZone: "Europe/Bucharest" },
	};

	// Insert event into Google Calendar
	const eventRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${context.env.CALENDAR}/events`, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(event),
	});

	const eventData = await eventRes.json();

	if (!eventRes.ok) {
		return new Response(`Failed to insert event: ${JSON.stringify(eventData)}`, { status: 500 });
	}

	return new Response(JSON.stringify(eventData, null, 2), {
		headers: { "Content-Type": "application/json" },
	});
	} catch (err) {
		return new Response(`Error: ${err.message}`, { status: 500 });
	}
}

function base64urlEncode(input) {
	let str;
	if (input instanceof ArrayBuffer) {
		str = btoa(String.fromCharCode(...new Uint8Array(input)));
	} else {
		str = btoa(input);
	}
	return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem) {
	// Convert multiline PEM to ArrayBuffer
	const b64 = pem
		.replace(/-----BEGIN PRIVATE KEY-----/, "")
		.replace(/-----END PRIVATE KEY-----/, "")
		.replace(/(\r\n|\n|\\n)/g, "");
	const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
	return crypto.subtle.importKey(
		"pkcs8",
		binary.buffer,
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["sign"]
	);
}
