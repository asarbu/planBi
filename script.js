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

		window.addEventListener('resize', resize);
		resize();
		animate(0);
	}

	const container = document.getElementById('iridescence-container');
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
			});
		}
	});

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
				date: consultationForm.date.valueAsDate.toLocaleDateString("ro-RO"),
				timeslot: consultationForm.timeslot.value,
				location: consultationForm.location.value,
				message: consultationForm.message.value,
			};
			submitConsultation(formData);
		});
	}

	// Handle consultation form submission
	function submitConsultation(formData) {
		fetch('/email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		})
		.then(response => response.json())
		.then(data => {
			document.getElementById('consultation-submit-button').textContent = `Succes. Te vom contacta în curând!`;
			document.getElementById('message').textContent += JSON.stringify(data);
		})
		.catch((err) => {
			document.getElementById('consultation-submit-button').textContent = 'A apărut o eroare la conectarea la server.';
			document.getElementById('message').textContent += err.message;
		});

		fetch('/consultation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		})
		.then(response => response.json())
		.then(data => {
			document.getElementById('consultation-submit-button').textContent = `Succes. Te vom contacta în curând!`;
			document.getElementById('message').textContent += JSON.stringify(data);
		})
		.catch((err) => {
			document.getElementById('consultation-submit-button').textContent = 'A apărut o eroare la conectarea la server.';
			document.getElementById('message').textContent += err.message;
		});
	}

	document.getElementById('book-read-more').addEventListener('click', function() {
		fetch('/calendar')
		.then(response => response.json())
		.then(events => {
			console.log('Fetched events:', events);
		})
		.catch(err => {
			console.error('Error fetching calendar events:', err);
		});
	});
});
