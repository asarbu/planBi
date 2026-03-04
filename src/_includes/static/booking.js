document.addEventListener('DOMContentLoaded', function () {
	// Date input constraints
	const dateInput = document.getElementById('date');
	if (!dateInput) return;
	const min = new Date();
	min.setDate(min.getDate() + 1); // tomorrow
	const minDate = min.toISOString().split('T')[0];
	const max = new Date();
	max.setDate(max.getDate() + 60);
	const maxDate = max.toISOString().split('T')[0];
	dateInput.setAttribute('min', minDate);
	dateInput.setAttribute('max', maxDate);

	// ──────────────────────────────────────
	// Booking page cart rendering
	// ──────────────────────────────────────
	function renderBookingCart() {
		var container = document.getElementById('booking-cart-items');
		var totalRow = document.getElementById('booking-cart-total');
		var totalValue = document.getElementById('booking-total-value');
		var servicesInput = document.getElementById('services_data');
		if (!container || !window.PlanBiCart) return;

		var cart = window.PlanBiCart.getCart();

		if (cart.length === 0) {
			container.innerHTML = '<p class="booking-cart-empty">Nu ați selectat servicii. <a href="services.html">Vedeți serviciile noastre</a></p>';
			if (totalRow) totalRow.style.display = 'none';
			if (servicesInput) servicesInput.value = '';
			return;
		}

		var html = '';
		cart.forEach(function(item) {
			html += '<div class="booking-cart-item" data-cart-id="' + item.id + '">'
				+ '<div class="cart-item-info">'
				+ '<div class="cart-item-name">' + item.name + '</div>'
				+ '<div class="cart-item-price">' + item.priceDisplay + '</div>'
				+ '</div>'
				+ '<div class="cart-item-controls">'
				+ '<button type="button" class="cart-qty-btn booking-qty-minus" data-id="' + item.id + '">−</button>'
				+ '<span class="cart-item-qty">' + item.quantity + '</span>'
				+ '<button type="button" class="cart-qty-btn booking-qty-plus" data-id="' + item.id + '">+</button>'
				+ '</div>'
				+ '<button type="button" class="cart-item-remove booking-item-remove" data-id="' + item.id + '" title="Elimină">×</button>'
				+ '</div>';
		});
		container.innerHTML = html;

		if (totalRow && totalValue) {
			totalRow.style.display = 'flex';
			totalValue.textContent = window.PlanBiCart.getCartTotal() + ' Euro';
		}

		if (servicesInput) {
			servicesInput.value = JSON.stringify(cart);
		}
	}

	// Delegate clicks in booking cart
	var bookingCartContainer = document.getElementById('booking-cart-items');
	if (bookingCartContainer && window.PlanBiCart) {
		bookingCartContainer.addEventListener('click', function(e) {
			var target = e.target;
			if (target.classList.contains('booking-qty-minus')) {
				window.PlanBiCart.updateQuantity(target.dataset.id, -1);
			} else if (target.classList.contains('booking-qty-plus')) {
				window.PlanBiCart.updateQuantity(target.dataset.id, 1);
			} else if (target.classList.contains('booking-item-remove')) {
				window.PlanBiCart.removeFromCart(target.dataset.id);
			}
		});
	}

	// Listen for cart updates from script.js
	document.addEventListener('cartUpdated', renderBookingCart);

	// Initial render
	renderBookingCart();

	// Consultation form event listener
	const consultationForm = document.getElementById('consultationForm');
	if (consultationForm) {
		consultationForm.addEventListener('submit', function (e) {
			e.preventDefault();
			document.getElementById('consultation-submit-button').disabled = true;
			document.getElementById('consultation-submit-button').textContent = 'Submitting...';

			var cart = window.PlanBiCart ? window.PlanBiCart.getCart() : [];
			var servicesSummary = cart.map(function(item) {
				return item.name + ' x' + item.quantity;
			}).join(', ');

			const formData = {
				name: consultationForm.name.value,
				email: consultationForm.email.value,
				telephone: consultationForm.telephone.value,
				service_type: servicesSummary || 'nesigur',
				services: cart,
				date: consultationForm.date.valueAsDate.toISOString().split('T')[0],
				timeslot: consultationForm.timeslot.value,
				location: consultationForm.location.value,
				message: consultationForm.message.value,
				gdprTimestamp: consultationForm.gdprTimestamp.value,
			};
			submitConsultation(formData);
		});
	}

	// Handle consultation form submission
	function submitConsultation(formData) {
		fetch('/consultation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		})
			.then(async response => {
				if (!response.ok) {
					const responseText = await response.text();
					throw new Error(`${responseText}`);
				}
				if (response.redirected) {
					window.location.href = response.url;
					return response;
				}
				return response.json();
			})
			.then(() => {
				document.getElementById('consultation-submit-button').textContent = `Succes. Te vom contacta în curând!`;
			})
			.catch((err) => {
				document.getElementById('consultation-submit-button').textContent = 'Error:' + err.message;
			});
	}

	// Add event listener for timeslot update
	dateInput.addEventListener('change', updateTimeslotForDate);
	function updateTimeslotForDate() {
		const dateInput = document.getElementById('date');
		const timeslot = document.getElementById('timeslot');
		if (!dateInput || !timeslot) return;

		const selectedDate = dateInput.value;
		if (!selectedDate) return;
		const d = new Date(selectedDate);
		const day = d.getDay(); // 0=Sunday, 6=Saturday

		if (day >= 1 && day < 5) {
			timeslot.innerHTML = `<option value="loading" disabled selected>Se încarcă...</option>`;
			fetch(`/calendar?date=${selectedDate}`).then(res => res.json()).then(data => {
				const bookedStartTimes = data.map(event => {
					const start = event.start.dateTime;
					return start.split('T')[1]?.substring(0, 5);
				}).filter(Boolean);

				const allSlots = [
					"10:00-12:00",
					"13:00-15:00",
					"15:30-17:30",
				];

				// Only show slots whose start time is not booked
				const availableSlots = allSlots.filter(slot => {
					const slotStart = slot.split('-')[0];
					return !bookedStartTimes.includes(slotStart);
				});

				if (availableSlots.length === 0) {
					timeslot.innerHTML = `<option value="" disabled selected>Nu sunt intervale disponibile.</option>`;
				} else {
					timeslot.innerHTML = `<option value="" disabled selected>Selectați un interval (ora României)</option>`;
					availableSlots.forEach(slot => {
						const option = document.createElement('option');
						option.value = slot;
						option.textContent = slot.replace('-', ' - ');
						timeslot.appendChild(option);
					});
				}
			});
		} else {
			timeslot.innerHTML = `<option value="loading" disabled selected>Nu sunt intervale disponibile.</option>`;
		}
	}

	// GDPR consent checkbox logic
	const consentCheckbox = document.getElementById('consentCheckbox');
	const submitBtn = document.getElementById('consultation-submit-button');
	const gdprTimestamp = document.getElementById('gdprTimestamp');
	if (consentCheckbox && submitBtn) {
		submitBtn.disabled = !consentCheckbox.checked;
		consentCheckbox.addEventListener('change', function () {
			submitBtn.disabled = !this.checked;
			if (this.checked && gdprTimestamp) {
				gdprTimestamp.value = new Date().toISOString();
			} else if (gdprTimestamp) {
				gdprTimestamp.value = '';
			}
		});
	}
});
