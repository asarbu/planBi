import { Renderer, Program, Geometry, Mesh, Color, Vec2 } from 'https://unpkg.com/ogl';

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

	// Velvet effect setup
	function setupIridescenceEffect(options) {
		const {
			container,
			color = [0.3, 0.2, 0.5], // Default to a nice purple
			speed = 1,
		} = options;

		let animationFrameId;
		const mousePosition = { x: 0.5, y: 0.5 };

		// Initialize WebGL renderer
		const renderer = new Renderer({ dpr: 2 }); // Use device pixel ratio for sharpness
		const gl = renderer.gl;
		container.appendChild(gl.canvas);
		gl.clearColor(1, 1, 1, 1);

		// --- Shader Definitions ---
		const vertexShader = `
			attribute vec2 uv;
			attribute vec2 position;
			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = vec4(position, 0, 1);
			}
		`;

		const fragmentShader = `
			// Set the default precision for floating-point numbers to high.
			precision highp float;

			// ----- UNIFORMS (Inputs from the CPU) -----
			uniform float uTime;        // Current time, used for animation.
			uniform vec3 uColor;         // The base color to tint the waves.
			uniform vec2 uResolution;    // The resolution of the canvas (width, height).
			uniform float uSpeed;         // A multiplier for the animation speed.

			varying vec2 vUv;            // UV coordinates, typically from (0,0) to (1,1).


			void main() {
				vec2 centeredCoords = (vUv * 2.0) - 1.0;
				float aspectRatio = uResolution.x / uResolution.y;
				centeredCoords.x *= aspectRatio;

				// This loop is the core of the pattern generation. It iteratively calculates two values that create a complex, organic, and flowing pattern.
				float patternAngle = 0.0;
				float patternPhase = 0.0;
				float timeOffset = uTime  * uSpeed;
				patternPhase -= timeOffset;

				const float ITERATIONS = 8.0;
				for (float i = 0.0; i < ITERATIONS; ++i) {
					patternAngle += cos(i - patternPhase - patternAngle * centeredCoords.x);
					patternPhase += sin(centeredCoords.y * i + patternAngle);
				}
				patternPhase += timeOffset;

				// Create an initial color pattern using the generated values.
				vec3 initialColor = vec3(
					cos(centeredCoords.x * patternPhase),
					cos(centeredCoords.y * patternAngle),
					cos(patternAngle + patternPhase)
				);

				// Apply a second, more complex transformation for added detail.
				vec3 colorModulator = cos(vec3(patternPhase, patternAngle, 2.5));
				vec3 complexColor = cos(initialColor * colorModulator);
				
				const vec3 LUMINANCE_VECTOR = vec3(0.2126, 0.7152, 0.0722);
				float luminance = dot(complexColor, LUMINANCE_VECTOR);
				vec3 finalTintedShade = uColor * luminance;

				// Set the final color of the fragment (the pixel), with full opacity.
				gl_FragColor = vec4(finalTintedShade, 1.0);
			}
		`;

		// Create the shader program with uniforms
		const program = new Program(gl, {
			vertex: vertexShader,
			fragment: fragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uColor: { value: new Color(...color) },
				uResolution: { value: new Vec2(gl.canvas.width, gl.canvas.height) },
				uMouse: { value: new Vec2(mousePosition.x, mousePosition.y) },
				uSpeed: { value: speed },
			},
		});

		// Use a simple plane geometry that covers the screen
		const geometry = new Geometry(gl, {
			position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
			uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
		});
		const scene = new Mesh(gl, { geometry, program });

		// --- Event Handlers and Animation Loop ---
		function handleResize() {
			renderer.setSize(container.offsetWidth, container.offsetHeight);
			program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
		}

		function animate(time) {
			animationFrameId = requestAnimationFrame(animate);
			program.uniforms.uTime.value = time; 
			renderer.render({ scene });
		}

		// --- Setup and Cleanup ---
		window.addEventListener('resize', handleResize, false);
		handleResize(); // Initial size calculation
		
		animate(0); // Start the animation
	}

	const container = document.getElementById('iridescence-container');
	setupIridescenceEffect({ 
		container: container,
		color: [0.279, 0.374, 0.236], 
		speed: 0.0004,
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
 **/

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
			});
		}
	});
/*
	const nav = document.getElementsByTagName('header')[0];
	const title = document.getElementById('main-title');
	const subtitle = document.getElementById('subtitle');

	// 1. Define the threshold based on 10% of the viewport height (10vh)
	let thresholdUp = window.innerHeight * 0.31;
	let thresholdDown = window.innerHeight * 0.29;

	// 2. Function to handle scroll events
	function handleScroll() {
		// Check if the user has scrolled past the threshold
		if (window.scrollY > thresholdDown) {
			if (!nav.classList.contains('scrolled')) {
				// Apply the sticky, shrunk state
				nav.classList.add('scrolled');
				title.classList.add('scrolled');
				subtitle.classList.add('scrolled');
			}
		} else if (window.scrollY < thresholdUp) {
			if (nav.classList.contains('scrolled')) {
				// Revert to the initial, large state
				nav.classList.remove('scrolled');
				title.classList.remove('scrolled');
				subtitle.classList.remove('scrolled'); // Show subtitle
			}
		}
	}

	// 4. Attach the scroll listener
	window.addEventListener('scroll', handleScroll);

	// 5. Initial check (in case the page loads already scrolled, e.g., on refresh)
	handleScroll();*/

	// get the sticky element
	const stickyElm = document.querySelectorAll('.stk')[0]

	const observer = new IntersectionObserver( 
	([e]) =>  {
		console.log(e.intersectionRatio)
		e.target.classList.toggle('isSticky', e.intersectionRatio < 1)
		document.getElementById('main-title').classList.toggle('scrolled', e.intersectionRatio < 1)
		document.getElementById('subtitle').classList.toggle('scrolled', e.intersectionRatio < 1)
	},
	{threshold: [1]}
	);

	observer.observe(stickyElm)

	// Consultation form event listener
	const consultationForm = document.getElementById('consultationForm');
	if (consultationForm) {
		consultationForm.addEventListener('submit', function(e) {
			e.preventDefault();
			document.getElementById('consultation-submit-button').disabled = true;
			document.getElementById('consultation-submit-button').textContent = 'Submitting...';
			const formData = {
				name: consultationForm.name.value,
				email: consultationForm.email.value,
				telephone: consultationForm.telephone.value,
				service_type: consultationForm.service_type.value,
				timeslot: consultationForm.timeslot.value,
				message: consultationForm.message.value,
				date: new Date().toISOString()
			};
			submitConsultation(formData);
		});
	}

	// Handle consultation form submission
	function submitConsultation(formData) {
		const resultDiv = document.getElementById('consultationResult');
		fetch('/email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		})
		.then(response => response.json())
		.then(data => {
			document.getElementById('consultation-submit-button').textContent = JSON.stringify(data);
		})
		.catch(() => {
			document.getElementById('consultation-submit-button').textContent = 'There was an error connecting to the server.';
		});
	}
});
