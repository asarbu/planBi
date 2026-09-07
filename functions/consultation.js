import { persistToDatabase } from "./database.js";
import { sendEmail } from "./email.js";
import { createCalendarEvent } from "./calendar.js";

const VALID_TIMESLOTS = new Set([
	"10:00-12:00",
	"13:00-15:00",
	"15:30-17:30",
]);
const LEGACY_SERVICES = new Set(['gold', 'platinum', 'diamond', 'nesigur']);
const LOCATIONS = new Set(['online', 'sediu', 'cafea']);
const REQUIRED_FIELDS = ['name', 'email', 'telephone', 'date', 'timeslot', 'location'];

export async function onRequestPost(context) {
	const requestBody = await context.request.json();
	const missingFields = REQUIRED_FIELDS.filter(f => !requestBody[f]);
	if (missingFields.length) {
		return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
	}

	// GDPR consent timestamp check
	if (!requestBody.gdprTimestamp) {
		return Response.json({ error: 'Lipseste consimtamantul GDPR' }, { status: 400 });
	}
	try {
		const gdprDate = new Date(requestBody.gdprTimestamp);
		if (isNaN(gdprDate.valueOf())) {
			return Response.json({ error: 'Timestamp GDPR invalid' }, { status: 400 });
		}
		const now = new Date();
		// same day check (UTC)
		if (!(gdprDate.getUTCFullYear() === now.getUTCFullYear() &&
			  gdprDate.getUTCMonth() === now.getUTCMonth() &&
			  gdprDate.getUTCDate() === now.getUTCDate())) {
			return Response.json({ error: 'Consimtamantul GDPR nu a fost dat azi' }, { status: 400 });
		}
	} catch (e) {
		return Response.json({ error: 'Eroare la verificarea consimtamantului GDPR' }, { status: 400 });
	}
	

	//Check if name is valid
	if(requestBody.name.length < 2 || requestBody.name.length > 100){
		return Response.json({ error: 'Nume invalid' }, { status: 400 });
	}

	//check if email is valid
	if(requestBody.email.length < 6 || requestBody.email.length > 100 || !requestBody.email.includes('@')){
		return Response.json({ error: 'Email invalid' }, { status: 400 });
	}

	//Check if telephone is valid
	if(requestBody.telephone.length < 5 || requestBody.telephone.length > 20){
		return Response.json({ error: 'Telefon invalid' }, { status: 400 });
	}

	// Validate services (cart array) or legacy service_type
	let services = [];
	let servicesSummary = '';
	if (requestBody.services && Array.isArray(requestBody.services) && requestBody.services.length > 0) {
		// Validate each cart item
		for (const item of requestBody.services) {
			if (!item.name || typeof item.name !== 'string' || item.name.length > 100) {
				return Response.json({ error: 'Nume serviciu invalid în coș' }, { status: 400 });
			}
			if (!Number.isFinite(item.price) || item.price < 0) {
				return Response.json({ error: 'Preț serviciu invalid în coș' }, { status: 400 });
			}
			if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
				return Response.json({ error: 'Cantitate invalidă în coș' }, { status: 400 });
			}
		}
		services = requestBody.services;
		servicesSummary = services.map(s => `${s.name} x${s.quantity} (${s.priceDisplay || s.price + ' Euro'})`).join(', ');
	} else if (requestBody.service_type && LEGACY_SERVICES.has(requestBody.service_type)) {
		// Legacy single service_type fallback
		servicesSummary = requestBody.service_type;
		services = [{ name: requestBody.service_type, price: 0, priceDisplay: requestBody.service_type, quantity: 1 }];
	} else {
		return Response.json({ error: 'Selectați cel puțin un serviciu' }, { status: 400 });
	}

	// Attach normalized data back to requestBody for downstream use
	requestBody.services = services;
	requestBody.service_type = servicesSummary;

	//Check if message is valid
	if (requestBody.message && requestBody.message.length > 100){
		return Response.json({ error: 'Notițe prea lungi' }, { status: 400 });
	}

	// Parse date only once
	const selectedDate = new Date(requestBody.date);
	if (isNaN(selectedDate.valueOf())) {
		return Response.json({ error: 'Dată invalidă' }, { status: 400 });
	}

	// Check if date is within the next 60 days
	const now = new Date();
	now.setHours(0,0,0,0);
	const maxDate = new Date(now);
	maxDate.setDate(now.getDate() + 60);
	if (selectedDate < now || selectedDate > maxDate) {
		return Response.json({ error: 'Data trebuie să fie în următoarele 60 de zile' }, { status: 400 });
	}

	const day = selectedDate.getDay();
	if (day === 0 || day === 6 || day === 5) {
		return Response.json({ error: 'Selectați o dată lucrătoare (Luni-Joi)' }, { status: 400 });
	}

	const timeslot = requestBody.timeslot;
	if (!VALID_TIMESLOTS.has(timeslot)) {
		return Response.json({ error: 'Interval orar invalid' }, { status: 400 });
	}

	if (!LOCATIONS.has(requestBody.location)){
		return Response.json({ error: 'Locație invalidă' }, { status: 400 });
	}

	let errors = [];
	const servicesDetail = services.map(s => `  • ${s.name} x${s.quantity} — ${s.priceDisplay || s.price + ' Euro'}`).join('\n');
	const estimatedTotal = services.reduce((sum, s) => sum + s.price * s.quantity, 0);
	const description =
		`Nume: ${requestBody.name}\n` +
		`Email: ${requestBody.email}\n` +
		`Telefon: ${requestBody.telephone}\n` +
		`Servicii selectate:\n${servicesDetail}\n` +
		`Total estimat: ${estimatedTotal} Euro\n` +
		`Dată: ${requestBody.date}\n` +
		`Fereastră: ${requestBody.timeslot}\n` +
		`Locație: ${requestBody.location}\n` +
		`Notițe: ${requestBody.message || ''}`;

	const [databaseResult, emailResult, calendarResult] = await Promise.allSettled([
		persistToDatabase(context, requestBody),
		sendEmail(context, requestBody, description),
		createCalendarEvent(context, requestBody, description)
	]);

	let databaseResponse, emailResponse, calendarResponse;
	if (databaseResult.status === 'fulfilled') {
		databaseResponse = databaseResult.value;
	} else {
		errors.push(`Database error: ${databaseResult.reason?.message || databaseResult.reason}`);
	}
	if (emailResult.status === 'fulfilled') {
		emailResponse = emailResult.value;
	} else {
		errors.push(`Email error: ${emailResult.reason?.message || emailResult.reason}`);
	}
	if (calendarResult.status === 'fulfilled') {
		calendarResponse = calendarResult.value;
	} else {
		errors.push(`Calendar error: ${calendarResult.reason?.message || calendarResult.reason}`);
	}

	if (errors.length > 0) {
		// TODO Redirect to an error page instead
		return Response.json({ errors }, { status: 500 });
	}

	return Response.redirect(`https://planbi.ro/thankyou?number=${databaseResponse?.meta?.last_row_id}`, 302);
};

export async function onRequestGet(context) {
	return Response.json({ message: "GET request received" });
};
