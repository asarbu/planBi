
//CONSTANTS
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

/*
* Easing Functions - inspired from http://gizma.com/easing/
* only considering the t value for the range [0, 1] => [0, 1]
*/
var easing = {
	// no easing, no acceleration
	linear: function (t) { return t },
	// accelerating from zero velocity
	easeInQuad: function (t) { return t * t },
	// decelerating to zero velocity
	easeOutQuad: function (t) { return t * (2 - t) },
	// acceleration until halfway, then deceleration
	easeInOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
	// accelerating from zero velocity 
	easeInCubic: function (t) { return solveBezier(0.42, 0, 1.0, 1.0)(t) },
	// decelerating to zero velocity 
	easeOutCubic: function (t) { return  solveBezier(0, 0, 0.58, 1.0)(t) },
	// acceleration until halfway, then deceleration 
	easeInOutCubic: function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 },
	// accelerating from zero velocity 
	easeInQuart: function (t) { return t * t * t * t },
	// decelerating to zero velocity 
	easeOutQuart: function (t) { return 1 - (--t) * t * t * t },
	// acceleration until halfway, then deceleration
	easeInOutQuart: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t },
	// accelerating from zero velocity
	easeInQuint: function (t) { return t * t * t * t * t },
	// decelerating to zero velocity
	easeOutQuint: function (t) { return 1 + (--t) * t * t * t * t },
	// acceleration until halfway, then deceleration 
	easeInOutQuint: function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t },
	bezier: function(t, p1, p2) { return 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * Math.pow(t, 2) * p2 + Math.pow(t, 3);}
}
        /**
         * Robust Bezier Solver
         * Newton-Raphson method to solve for t at a given x (time).
         */
        function solveBezier(x1, y1, x2, y2) {
            const cx = 3.0 * x1;
            const bx = 3.0 * (x2 - x1) - cx;
            const ax = 1.0 - cx - bx;
            const cy = 3.0 * y1;
            const by = 3.0 * (y2 - y1) - cy;
            const ay = 1.0 - cy - by;

            function sampleCurveX(t) { return ((ax * t + bx) * t + cx) * t; }
            function sampleCurveY(t) { return ((ay * t + by) * t + cy) * t; }
            function sampleCurveDerivativeX(t) { return (3.0 * ax * t + 2.0 * bx) * t + cx; }

            function solveCurveX(x) {
                let t2 = x;
                for (let i = 0; i < 8; i++) {
                    const x2 = sampleCurveX(t2) - x;
                    if (Math.abs(x2) < 1e-6) return t2;
                    const d2 = sampleCurveDerivativeX(t2);
                    if (Math.abs(d2) < 1e-6) break;
                    t2 = t2 - x2 / d2;
                }
                return t2;
            }

            return function(x) {
                if (x === 0 || x === 1) return x;
                return sampleCurveY(solveCurveX(x));
            };
        }

// Compile shader
function compileShader(gl, type, source) {
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

function createProgram(gl, vsSource, fsSource) {
	const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
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

function setupVelvetEffect(options) {
	const {
		container,
		color = [0.3, 0.2, 0.5], // Default to a nice purple
		speed = 1,
	} = options;

	// Create canvas and get WebGL context
	const canvas = document.createElement('canvas');
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.style.display = 'inline-block';
	const gl = canvas.getContext('webgl');
	if (!gl) {
		console.error('WebGL not supported');
		return;
	}
	gl.clearColor(1, 1, 1, 1);
	const program = createProgram(gl,vertexShaderSource, fragmentShaderSource);
	gl.useProgram(program);

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

	function resize(gl) {
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
		requestAnimationFrame(animate);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform1f(uTimeLoc, time);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	container.appendChild(canvas);
	window.addEventListener('resize', resize.bind(null, gl), { passive: true });
	resize(gl);
	animate(0);
}

function scrollTo(Y, duration, easingFunction, callback) {
	var start = Date.now(),
		from = document.documentElement.scrollTop;

	if (from === Y) {
		requestAnimationFrame(callback);
		return; /* Prevent scrolling to the Y point if already there */
	}

	function scroll() {
		var currentTime = Date.now(),
			time = Math.min(1, ((currentTime - start) / duration)),
			easedT = easingFunction(time);

				document.documentElement.scrollTop = (easedT * (Y - from)) + from;
		if (time < 1) requestAnimationFrame(scroll);
		else {
			requestAnimationFrame(callback);
		}
	}

	requestAnimationFrame(scroll);
}

let scrollTicking = false;
let lastScrollY = undefined;

let mainTitle = undefined;
let stickyElm = undefined;
let velvetContainer = undefined;
let logo = undefined;
let HEADER_HEIGHT = undefined;
let SNAP_THRESHOLD_DOWN = undefined;

function processSnapLogic() {
	const currentScrollY = window.scrollY;
	const isInSnapZone = currentScrollY >= SNAP_THRESHOLD_DOWN && currentScrollY <= HEADER_HEIGHT;
	const scrollUp = currentScrollY < lastScrollY;
	const scrollDown = currentScrollY > lastScrollY;
	lastScrollY = currentScrollY;

	if (!scrollDown && !scrollUp) { return; }

	// Scroll down (Header Open -> Header Closed)
	if (scrollDown && isInSnapZone) {
		disableScroll();
		scrollTicking = true;
		mainTitle.classList.add('hidden');
		logo.classList.add('condensed');
		stickyElm.classList.add('faded');
		velvetContainer.classList.add('faded');
		for (const child of logo.children[0].children) {
			child.classList.add('condensed');
		}
		document.getElementById('p-fwd').beginElement();
		//Overshoot to prevent snapping errors
		scrollTo(HEADER_HEIGHT + 10, 500, easing.easeInCubic, () => {
			mainTitle.classList.remove('hidden'); 
			logo.classList.add('hidden');
			scrollTicking = false; 
			enableScroll(); 
		});
	}
	// (Header Closed -> Header Open)
	else if (scrollUp && isInSnapZone) {
		disableScroll();
		scrollTicking = true;
		logo.classList.remove('hidden');
		mainTitle.classList.add('hidden');
		stickyElm.classList.remove('faded');
		velvetContainer.classList.remove('faded');
		logo.classList.remove('condensed');
		for (const child of logo.children[0].children) {
			child.classList.remove('condensed');
		}
		document.getElementById('p-bwd').beginElement();
		//Overshoot to prevent snapping errors
		scrollTo(SNAP_THRESHOLD_DOWN - 10, 500, easing.easeOutCubic, () => { 
			mainTitle.classList.add('hidden'); 
			logo.classList.remove('hidden');
			scrollTicking = false; 
			enableScroll();	 
		});
	}
}


/**
 * Handles the scroll event by scheduling the logic inside requestAnimationFrame.
 */
function onScrollHandler(e) {
	// If a snap is in progress, ignore subsequent scroll events to prevent loop
	if (scrollTicking) {
		e.preventDefault();
		e.stopPropagation();
		return;
	}

	window.requestAnimationFrame(processSnapLogic);
}

// Source - https://stackoverflow.com/a
// Posted by gblazex, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-18, License - CC BY-SA 4.0

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; } 
  }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

// call this to Disable
function disableScroll() {
  window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
  window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

// call this to Enable
function enableScroll() {
  window.removeEventListener('DOMMouseScroll', preventDefault, false);
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
  window.removeEventListener('touchmove', preventDefault, wheelOpt);
  window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}


const container = document.getElementById('velvet-container');
if (container) {
	setupVelvetEffect({
		container: container,
		color: [0.279, 0.374, 0.236],
		speed: 0.0004,
	});
}

document.addEventListener('DOMContentLoaded', function () {
	mainTitle = document.getElementsByClassName('main-title')[0];
	stickyElm = document.getElementsByClassName('isSticky')[0];
	velvetContainer = document.getElementById('velvet-container');
	logo = document.getElementsByClassName('logo')[0];
	HEADER_HEIGHT = document.defaultView.innerHeight;
	SNAP_THRESHOLD_DOWN = HEADER_HEIGHT * 0.2;
	scrollTicking = false;
	lastScrollY = window.scrollY;
	if (window.scrollY > HEADER_HEIGHT) {
		logo.classList.add('hidden');
		logo.classList.add('condensed');
		stickyElm.classList.add('faded');
		velvetContainer.classList.add('faded');
	}

	// Attach the handler to the window scroll event
	window.addEventListener('scroll', onScrollHandler, { passive: false });

});
