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
				readMoreBtn.style.display = 'none';
				readLessBtn.style.display = 'inline-block';
				readLessBtn.classList.add('animate');
				target.classList.add('animate');
				updatePortfolioParallax();
			}, { once: true, passive: true });
		}, { passive: true });
	});

	document.querySelectorAll('.read-less-btn').forEach((readLessBtn) => {
		var targetId = readLessBtn.getAttribute('data-target');
		var target = document.getElementById(targetId);
		var readMoreBtn = document.querySelector('.read-more-btn[data-target="' + targetId + '"]');
		readLessBtn.addEventListener('click', function() {
			readLessBtn.classList.remove('animate');
			target.classList.remove('animate');
			readLessBtn.addEventListener('transitionend', () => {
				readLessBtn.style.display = 'none';
				readMoreBtn.style.display = 'inline-block';
				target.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
				readMoreBtn.classList.remove('animate');
			}, { once: true, passive: true });
		}, { passive: true });
	});

	// Velvet effect setup (Vanilla WebGL)
	function setupVelvetEffect(options) {
		const {
			container,
			color = [0.3, 0.2, 0.5], // Default to a nice purple
			speed = 1,
		} = options;

		let animationFrameId;
		// Create canvas and get WebGL context
		const canvas = document.createElement('canvas');
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.display = 'block';
		container.appendChild(canvas);
		const gl = canvas.getContext('webgl');
		if (!gl) {
			console.error('WebGL not supported');
			return;
		}
		gl.clearColor(1, 1, 1, 1);

		// --- Shader Definitions ---
		const vertexShaderSource = `
			attribute vec2 position;
			attribute vec2 uv;
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = vec4(position, 0, 1);
			}
		`;
		const fragmentShaderSource = `
			precision highp float;
			uniform float uTime;
			uniform vec3 uColor;
			uniform vec2 uResolution;
			uniform float uSpeed;
			varying vec2 vUv;
			void main() {
				vec2 centeredCoords = (vUv * 2.0) - 1.0;
				float aspectRatio = uResolution.x / uResolution.y;
				centeredCoords.x *= aspectRatio;
				float patternAngle = 0.0;
				float patternPhase = 0.0;
				float timeOffset = uTime * uSpeed;
				patternPhase -= timeOffset;
				const float ITERATIONS = 8.0;
				for (float i = 0.0; i < ITERATIONS; ++i) {
					patternAngle += cos(i - patternPhase - patternAngle * centeredCoords.x);
					patternPhase += sin(centeredCoords.y * i + patternAngle);
				}
				patternPhase += timeOffset;
				vec3 initialColor = vec3(
					cos(centeredCoords.x * patternPhase),
					cos(centeredCoords.y * patternAngle),
					cos(patternAngle + patternPhase)
				);
				vec3 colorModulator = cos(vec3(patternPhase, patternAngle, 2.5));
				vec3 complexColor = cos(initialColor * colorModulator);
				const vec3 LUMINANCE_VECTOR = vec3(0.2126, 0.7152, 0.0722);
				float luminance = dot(complexColor, LUMINANCE_VECTOR);
				vec3 finalTintedShade = uColor * luminance;
				gl_FragColor = vec4(finalTintedShade, 1.0);
			}
		`;

		// Compile shader
		function compileShader(type, source) {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return null;
			}
			return shader;
		}

		// Create program
		function createProgram(vsSource, fsSource) {
			const vs = compileShader(gl.VERTEX_SHADER, vsSource);
			const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
			const prog = gl.createProgram();
			gl.attachShader(prog, vs);
			gl.attachShader(prog, fs);
			gl.linkProgram(prog);
			if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
				console.error(gl.getProgramInfoLog(prog));
				return null;
			}
			return prog;
		}

		const program = createProgram(vertexShaderSource, fragmentShaderSource);
		gl.useProgram(program);

		// Set up geometry (full screen triangle)
		const positions = new Float32Array([
			-1, -1,
			3, -1,
			-1, 3
		]);
		const uvs = new Float32Array([
			0, 0,
			2, 0,
			0, 2
		]);
		const positionLoc = gl.getAttribLocation(program, 'position');
		const uvLoc = gl.getAttribLocation(program, 'uv');

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		const uvBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(uvLoc);
		gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

		// Uniform locations
		const uTimeLoc = gl.getUniformLocation(program, 'uTime');
		const uColorLoc = gl.getUniformLocation(program, 'uColor');
		const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
		const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed');

		// Set static uniforms
		gl.uniform3fv(uColorLoc, color);
		gl.uniform1f(uSpeedLoc, speed);

		function resize() {
			const dpr = window.devicePixelRatio || 1;
			const width = container.offsetWidth;
			const height = container.offsetHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
		}

		function animate(time) {
			animationFrameId = requestAnimationFrame(animate);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform1f(uTimeLoc, time);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		window.addEventListener('resize', resize, { passive: true });
		resize();
		animate(0);
	}

	const container = document.getElementById('velvet-container');
	if (container) {
		setupVelvetEffect({
			container: container,
			color: [0.279, 0.374, 0.236],
			speed: 0.0004,
		});
	}

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

	// get the sticky element
	const stickyElm = document.querySelectorAll('.stk')[0]

	const observer = new IntersectionObserver( 
	([e]) =>  {
		e.target.classList.toggle('isSticky', e.intersectionRatio < 1)
		document.getElementById('main-title').classList.toggle('scrolled', e.intersectionRatio < 1)
		document.getElementById('subtitle').classList.toggle('scrolled', e.intersectionRatio < 1)
		document.getElementById('navbar-toggle').classList.toggle('scrolled', e.intersectionRatio < 1)
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
			if(!response.ok) {
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

	const velvet = document.getElementById('velvet-container');
	let lastScrollY = 0;
	let ticking = false;
	function updateParallax() {
		if (velvet) {
			velvet.style.transform = `translateY(${lastScrollY * 0.8}px)`;
		}
	}

	const portfolioImages = Array.from(document.querySelectorAll('#portfolio-details .event img'));
	const portfolioParents = portfolioImages.map(img => img.parentElement);

	function updatePortfolioParallax() {
		const viewportHeight = window.innerHeight;
		// First, read all rects
		const rects = portfolioParents.map(parent => parent.getBoundingClientRect());
		// Then, update styles only if changed
		portfolioImages.forEach((img, i) => {
			const rect = rects[i];
			let newTransform = '';
			if (rect.bottom > 0 && rect.top < viewportHeight) {
				const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
				const offset = progress * 100; // px, upward only
				newTransform = `translateY(${offset}px)`;
			}
			if (img.style.transform !== newTransform) {
				img.style.transform = newTransform;
			}
		});
	}

	function onScrollAll() {
		lastScrollY = window.scrollY || window.pageYOffset;
		if (!ticking) {
			ticking = true;
			window.requestAnimationFrame(() => {
				updateParallax();
				// updatePortfolioParallax();
				ticking = false;
			});
		}
	}
	window.addEventListener('scroll', onScrollAll, { passive: true });

	// Navbar menu toggle logic
	const toggle = document.getElementById('navbar-toggle');
	const menu = document.getElementById('navbar-menu');
	if (toggle && menu) {
		toggle.addEventListener('click', function () {
			menu.classList.toggle('active');
		});
		// Hide menu when a link is clicked
		menu.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', function () {
				menu.classList.remove('active');
			});
		});
	}

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

	// Add event listener for timeslot update
	dateInput.addEventListener('change', updateTimeslotForDate);
});

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
				return start.split('T')[1]?.substring(0,5);
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
