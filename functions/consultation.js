import { persistToDatabase } from "./database.js";
import { sendEmail } from "./email.js";
import { createCalendarEvent } from "./calendar.js";

const VALID_TIMESLOTS = new Set([
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00"
]);
const SERVICES = new Set(['consultation', 'installation', 'maintenance', 'other']);
const LOCATIONS = new Set(['online', 'sediu', 'cafea']);
const REQUIRED_FIELDS = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot', 'location'];

export async function onRequestPost(context) {
	const requestBody = await context.request.json();
	const missingFields = REQUIRED_FIELDS.filter(f => !requestBody[f]);
	if (missingFields.length) {
		return new Response(JSON.stringify({ error: 'Campuri lipsa', missingFields }), { status: 400 });
	}
	
	//Check if name is valid
	if(requestBody.name.length < 2 || requestBody.name.length > 100){
		return new Response('Nume invalid', { status: 400 });
	}

	//check if email is valid
	if(requestBody.email.length < 6 || requestBody.email.length > 100 || !requestBody.email.includes('@')){
		return new Response('Email invalid', { status: 400 });
	}

	//Check if telephone is valid
	if(requestBody.telephone.length < 5 || requestBody.telephone.length > 20){
		return new Response('Telefon invalid', { status: 400 });
	}

	//Check service_type
	if (!SERVICES.has(requestBody.service_type)){
		return new Response('Tip serviciu invalid', { status: 400 });
	}

	// Parse date only once
	const selectedDate = new Date(requestBody.date);
	if (isNaN(selectedDate.valueOf())) {
		return new Response('Dată invalidă', { status: 400 });
	}

	// Check if date is within the next 60 days
	const now = new Date();
	now.setHours(0,0,0,0);
	const maxDate = new Date(now);
	maxDate.setDate(now.getDate() + 60);
	if (selectedDate < now || selectedDate > maxDate) {
		return new Response('Data trebuie să fie în următoarele 60 de zile', { status: 400 });
	}

	const day = selectedDate.getDay();
	if (day === 0 || day === 6 || day === 5) {
		return new Response('Selectați o dată lucrătoare (Luni-Joi)', { status: 400 });
	}

	const timeslot = requestBody.timeslot;
	if (!VALID_TIMESLOTS.has(timeslot)) {
		return new Response('Interval orar invalid', { status: 400 });
	}

	if (!LOCATIONS.has(requestBody.location)){
		return new Response('Locație invalidă', { status: 400 });
	}

	let errors = [];
	let databaseResponse;
	try {
		databaseResponse = await persistToDatabase(context, requestBody);
	} catch (error) {
		errors.push(`Database error: ${error.message}`);
	}

	const description =
		`Nume: ${requestBody.name}\n` +
		`Email: ${requestBody.email}\n` +
		`Telefon: ${requestBody.telephone}\n` +
		`Tip Serviciu: ${requestBody.service_type}\n` +
		`Dată: ${requestBody.date}\n` +
		`Fereastră: ${requestBody.timeslot}\n` +
		`Locație: ${requestBody.location}\n` +
		`Notițe: ${requestBody.message || ''}`;

	let emailResponse;
	try {
		emailResponse = await sendEmail(context, requestBody, description);
	} catch (error) {
		errors.push(`Email error: ${error.message}`);
	}

	let calendarResponse;
	try {
		calendarResponse = await createCalendarEvent(context, requestBody, description);
	} catch (error) {
		errors.push(`Calendar error: ${error.message}`);
	}

	if (errors.length > 0) {
		return new Response(JSON.stringify({ errors }), { status: 500 });
	}

	return new Response(JSON.stringify({ databaseResponse, emailResponse, calendarResponse }));
};

export async function onRequestGet(context) {
	return new Response("GET request received");
};
