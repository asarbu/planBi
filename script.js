document.addEventListener('DOMContentLoaded', function() {
	// Read more button logic
	document.querySelectorAll('.read-more-btn').forEach(function(readMoreBtn) {
		var targetId = readMoreBtn.getAttribute('data-target');
		var target = document.getElementById(targetId);
		var targetParent = target.parentElement;
		var readLessBtn = document.getElementById(targetId + '-read-less');
		readMoreBtn.addEventListener('click', function() {
		targetParent.scrollIntoView({ behavior: 'smooth', block: 'start' });
			readMoreBtn.classList.add('animate');
			readMoreBtn.addEventListener('transitionend', () => {
				readLessBtn.classList.add('animate');
				target.classList.add('animate');
			}, { once: true });
		});
});

	document.querySelectorAll('.read-less-btn').forEach((readLessBtn) => {
		var targetId = readLessBtn.getAttribute('data-target');
		var target = document.getElementById(targetId);
		var readMoreBtn = document.querySelector('.read-more-btn[data-target="' + targetId + '"]');
		readLessBtn.addEventListener('click', function() {
			target.classList.remove('animate');
			target.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
			readLessBtn.classList.remove('animate');
			readMoreBtn.classList.remove('animate');
		});
	});
	/** // Register the ScrollTrigger plugin with GSAP
	gsap.registerPlugin(ScrollTrigger);

	// Create a GSAP timeline for the hero section animations
	let heroTimeline = gsap.timeline({
		scrollTrigger: {
			trigger: ".hero-section",
			start: "top top", // Animation starts when the top of the hero section hits the top of the viewport
			end: "bottom top", // Animation ends when the bottom of the hero section hits the top of the viewport
			scrub: true, // Smoothly links animation progress to scroll position
			markers: true // Uncomment for debugging to see start/end markers
		}
	});

	// Add animations to the timeline
	
	// 1. Animate the background image
	// Moves the background down by 30% of its height, creating a slow parallax effect.
	heroTimeline.to(".hero-bg", {
		yPercent: 30 
	}, 0); // The '0' at the end places this animation at the start of the timeline

	// 2. Animate the foreground text
	// Moves the text down faster and fades it out for a nice transition.
	heroTimeline.to(".hero-text", {
		yPercent: 100,
		opacity: 0
	}, 0); // Also at the start of the timeline, so it happens concurrently with the background animation

	// You can add interactive features here.
	// For example, a function to toggle the mobile navigation menu.
	const menuToggle = document.querySelector('.mobile-menu-toggle');
	const mainNav = document.querySelector('.main-nav');

	if (menuToggle && mainNav) {
		menuToggle.addEventListener('click', () => {
			// This is a placeholder. In a real app, you would
			// toggle a class to show/hide the navigation.
			alert("Mobile menu clicked! You would implement the menu display logic here.");
		});
	}

	// Consultation form event listener
	const consultationForm = document.getElementById('consultationForm');
	if (consultationForm) {
		consultationForm.addEventListener('submit', function(e) {
			e.preventDefault();
			const formData = {
				fullName: consultationForm.fullName.value,
				email: consultationForm.email.value,
				county: consultationForm.county.value,
				telephone: consultationForm.telephone.value,
				date: new Date().toISOString()
			};
			submitConsultation(formData);
		});
	}

	// Handle consultation form submission
	function submitConsultation(formData) {
		const resultDiv = document.getElementById('consultationResult');
		fetch('/meetings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		})
		.then(response => response.json())
		.then(data => {
			resultDiv.textContent = JSON.stringify(data);
		})
		.catch(() => {
			resultDiv.textContent = 'There was an error connecting to the server.';
		});
	} **/

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
			});
		}
	});
});
