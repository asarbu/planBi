import { onRequestPost as database } from "./database.js";
import { onRequestPost as email } from "./email.js";
import { onRequestPost as calendar } from "./calendar.js";

export async function onRequestPost(context) {
	let errors = [];
	let databaseResponse;
	try {
		databaseResponse = await database(context);
	} catch (error) {
		errors.push(`Database error: ${error.message}`);
	}

	let emailResponse;
	try {
		emailResponse = await email(context);
	} catch (error) {
		errors.push(`Email error: ${error.message}`);
	}

	let calendarResponse;
	try {
		calendarResponse = await calendar(context);
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
