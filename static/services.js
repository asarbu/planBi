//TODO Transition to booking at click
	//Card click handlers
	const platinumPriceDiv = document.getElementById('platinum_price');
	const goldPriceDiv = document.getElementById('gold_price');
	const diamondPriceDiv = document.getElementById('diamond_price');

	const divs = [goldPriceDiv, platinumPriceDiv, diamondPriceDiv];
	divs.forEach((div, index) => {
		if (div) {
			div.addEventListener('click', () => {
				const serviceTypeSelect = document.getElementById('service_type');
				if (serviceTypeSelect) {
					serviceTypeSelect.value = div.dataset.serviceType;
					serviceTypeSelect.selectedIndex = index + 1; // +1 because index is 0-based and first option is placeholder
					serviceTypeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
					serviceTypeSelect.focus();
				}
			}, { passive: true });
		}
	});