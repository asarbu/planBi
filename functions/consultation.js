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
const SERVICES = new Set(['gold', 'platinum', 'diamond', 'nesigur']);
const LOCATIONS = new Set(['online', 'sediu', 'cafea']);
const REQUIRED_FIELDS = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot', 'location'];

export async function onRequestPost(context) {
	const requestBody = await context.request.json();
	const missingFields = REQUIRED_FIELDS.filter(f => !requestBody[f]);
	if (missingFields.length) {
		return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
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

	//Check service_type
	if (!SERVICES.has(requestBody.service_type)){
		return Response.json({ error: 'Tip serviciu invalid' }, { status: 400 });
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
	const description =
		`Nume: ${requestBody.name}\n` +
		`Email: ${requestBody.email}\n` +
		`Telefon: ${requestBody.telephone}\n` +
		`Tip Serviciu: ${requestBody.service_type}\n` +
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
		return Response.json({ errors }, { status: 500 });
	}

	// Generate a random number and redirect to thankyou.html
	const randomNumber = Math.floor(Math.random() * 1000000);
	return Response.redirect(`https://planbi.ro/thankyou?number=${randomNumber}`, 302);
};

export async function onRequestGet(context) {
	return Response.json({ message: "GET request received" });
};
