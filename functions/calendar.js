export async function onRequestGet(context) {
	const dateParam = context.request.url.split('?date=')[1];
	if(!dateParam) {
		return new Response('Date parameter is required', { status: 400 });
	}
	const selectedDate = new Date(dateParam).toISOString();
	const oneDayAfter = new Date(selectedDate);
	oneDayAfter.setDate(oneDayAfter.getDate() + 1);
	const timeMax = oneDayAfter.toISOString();
	const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(context.env.CALENDAR)}/events?key=${encodeURIComponent(context.env.CALENDAR_API_KEY)}&timeMin=${encodeURIComponent(selectedDate)}&timeMax=${encodeURIComponent(timeMax)}`)
	const calendar = await response.json();

	/** @type {Array} */
	let events = calendar.items;
	events = events
		.filter((event) => event.status === 'confirmed' && event.start && event.end)
		.map(event => ({ start: event.start, end: event.end }));
	return new Response(JSON.stringify(events));
}

export async function createCalendarEvent(context, data, calendarDescription = '') {
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

	// const encodedHeader = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";

	// Encode and sign JWT manually
	const jwtUnsigned = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(claims))}`;
	// SHORT KEY is the private key without line breaks and markers
	const privateKey = await importPrivateKey(context.env.GOOGLE_SHORT_PRIVATE_KEY);
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
	
	const startDateTime = `${data.date}T${data.timeslot.split('-')[0]}:00`;
	const endDateTime = `${data.date}T${data.timeslot.split('-')[1]}:00`;
	const event = {
		summary: "PlanBi - " + data.name,
		description: calendarDescription,
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
    // Convert multiline PEM to ArrayBuffer (single regex for all markers and whitespace)
    const binary = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "pkcs8",
        binary.buffer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );
}
