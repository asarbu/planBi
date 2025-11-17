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

	//Check if date is in the weekend
	const selectedDate = new Date(requestBody.date);
	const day = selectedDate.getDay();
	if (day === 0 || day === 6 || day === 5) {
		return Response.json({ error: 'Selectați o dată lucrătoare (Luni-Joi)' }, { status: 400 });
	}

	// Check if date is in the next 60 days
	const currentTime = new Date().getTime();
	const maxDate = currentTime + 5184000000; // 60 days in milliseconds
	const selectedTime = selectedDate.getTime();
	if (selectedTime <= currentTime || selectedTime > maxDate) {
		return Response.json({ error: 'Selectați o dată în următoarele 60 de zile' }, { status: 400 });
	}

	//Check if interval is valid
	const timeslot = requestBody.timeslot;
	if(timeslot === "10:00-11:00" 
		|| timeslot === "11:00-12:00" 
		|| timeslot === "12:00-13:00" 
		|| timeslot === "13:00-14:00" 
		|| timeslot === "14:00-15:00" 
		|| timeslot === "15:00-16:00" 
		|| timeslot === "16:00-17:00" 
		|| timeslot === "17:00-18:00" 
	) {
		let errors = [];
		let databaseResponse;
		try {
			databaseResponse = await persistToDatabase(context, requestBody);
		} catch (error) {
			errors.push(`Database error: ${error.message}`);
		}

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
			return Response.json({ errors }, { status: 500 });
		}

		return Response.json({ databaseResponse, emailResponse, calendarResponse });
	} else {
		return Response.json({ error: 'Interval orar invalid' }, { status: 400 });
	}
};

export async function onRequestGet(context) {
	return Response.json({ message: "GET request received" });
};
