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