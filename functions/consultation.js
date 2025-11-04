import { persistToDatabase } from "./database.js";
import { sendEmail } from "./email.js";
import { createCalendarEvent } from "./calendar.js";

export async function onRequestPost(context) {
	const requestBody = await context.request.json();
	const requiredFields = ['name', 'email', 'telephone', 'service_type', 'date', 'timeslot', 'location'];
	const missingFields = requiredFields.filter(f => !requestBody[f]);
	if (missingFields.length) {
		return Response.json({ error: 'Campuri lipsa', missingFields }, { status: 400 });
	}

	let errors = [];
	let databaseResponse;
	try {
		databaseResponse = await persistToDatabase(context, requestBody);
	} catch (error) {
		errors.push(`Database error: ${error.message}`);
	}

	let emailResponse;
	try {
		emailResponse = await sendEmail(context, requestBody);
	} catch (error) {
		errors.push(`Email error: ${error.message}`);
	}

	let calendarResponse;
	try {
		calendarResponse = await createCalendarEvent(context, requestBody);
	} catch (error) {
		errors.push(`Calendar error: ${error.message}`);
	}

	if (errors.length > 0) {
		return Response.json({ errors }, { status: 500 });
	}

	return Response.json({ databaseResponse, emailResponse, calendarResponse });
};

export async function onRequestGet(context) {
	return Response.json({ message: "GET request received" });
};
