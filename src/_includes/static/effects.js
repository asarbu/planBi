export default class GraphicEffects {
	/** @type {Array<HTMLObjectElement>} */
	#slices = undefined;

	/** @type {Array<HTMLObjectElement>} */
	#selectorLines = undefined;

	/** @type {number} */
	#currentIndex = 0;

	/** @type {HTMLOListElement} */
	#currentSlice = undefined;

	#slid = false;

	#refreshTimeout = undefined;

	constructor() {
		/* Slice slider */
		this.rootContainer = undefined;
		this.mouseDown = false;
		this.startX = 0;
		this.startY = 0;
		this.startTranslate = 0;
		this.orientation = 'horizontal';
		this.containerSize = 0;
		this.startSelectorIndex = 0;
		this.prevOverflow = undefined;
		this.prevTouchAction = undefined;

		this.startSliderEventListener = this.startSlider.bind(this);
		this.moveSliderEventListener = this.moveSlider.bind(this);
		this.endSliderEventListener = this.endSlider.bind(this);
		this.refreshEventListener = this.refresh.bind(this);
		this.debouncedRefreshEventListener = this.debouncedRefresh.bind(this);

		this.startSelectorSliderEventListener = this.startSelectorSlider.bind(this);
		this.moveSelectorSliderEventListener = this.moveSelectorSlider.bind(this);
		this.endSelectorSliderEventListener = this.endSelectorSlider.bind(this);

		/* Navigation panel */
		this.navOpen = false;
	}

	init(forContainer) {
		/* Slice slider */
		this.rootContainer = forContainer;
		// TODO use percentages instead of width
		this.sliderWrapper = this.rootContainer.querySelector('.section');
		this.orientation = this.getOrientation();
		this.containerSize = this.getContainerSize();
		this.lastIndex = this.sliderWrapper.children.length + 1;

		this.#slices = this.rootContainer.querySelectorAll('.slice');
		this.#slices.forEach((el, i) => {
			el.setAttribute('data-slice-index', i);
		});

		this.#currentIndex = 0;

		/* Selector */
		this.selectorContainer = document.getElementById('selector');
		this.selectorContainer.draggable = false;
		this.selectorWrapper = this.selectorContainer.querySelector('.section');
		this.selectorWrapper.draggable = false;
		this.#selectorLines = [];
		for (let i = 0; i < this.#slices.length; i++) {
			const line = document.createElement('div');
			line.classList.add('selector-line');
			line.setAttribute('data-slice-index', i);
			line.addEventListener('click', (e) => this.onClickSetSlice(e));
			line.draggable = false;
			this.selectorWrapper.appendChild(line);
			this.#selectorLines.push(line);
		}
		this.updateSelectorLines(this.#currentIndex);

		// * when mousedown or touchstart
		this.resume();

		// * when mouseup or touchend
		// TODO This registers the event listener multiple times
		this.sliderWrapper.addEventListener('mouseup', this.endSliderEventListener);
		this.sliderWrapper.addEventListener('touchend', this.endSliderEventListener);
		this.sliderWrapper.addEventListener('resize', this.refreshEventListener, true);
		window.addEventListener('resize', this.debouncedRefreshEventListener);
		window.addEventListener('orientationchange', this.debouncedRefreshEventListener);

		for(let img of forContainer.getElementsByTagName('img')) {
			img.draggable = false;
		}
	}

	getOrientation() {
		return window.matchMedia('(orientation: landscape)').matches ? 'vertical' : 'horizontal';
	}

	getContainerSize() {
		if (!this.sliderWrapper) return 0;
		return this.orientation === 'vertical'
			? this.sliderWrapper.clientHeight
			: this.rootContainer.clientWidth;
	}

	pause() {
		this.sliderWrapper.removeEventListener('mousedown', this.startSliderEventListener);
		this.sliderWrapper.removeEventListener('touchmove', this.startSliderEventListener, { passive: false });
	}

	resume() {
		this.sliderWrapper.addEventListener('mousedown', this.startSliderEventListener);
		this.sliderWrapper.addEventListener('touchmove', this.startSliderEventListener, { passive: false });
		this.selectorContainer.addEventListener('mousedown', this.startSelectorSliderEventListener);
		this.selectorContainer.addEventListener('touchstart', this.startSelectorSliderEventListener, { passive: false });
	}

	lockPageScroll() {
		const root = document.documentElement;
		this.prevOverflow = root.style.overflow;
		this.prevTouchAction = root.style.touchAction;
		root.style.overflow = 'hidden';
		root.style.touchAction = 'none';
	}

	unlockPageScroll() {
		const root = document.documentElement;
		if (this.prevOverflow !== undefined) root.style.overflow = this.prevOverflow;
		if (this.prevTouchAction !== undefined) root.style.touchAction = this.prevTouchAction;
		this.prevOverflow = undefined;
		this.prevTouchAction = undefined;
	}

	updateSelectorLines(selectedIndex) {
		this.#selectorLines.forEach((line, i) => {
			line.classList.remove('tall', 'medium', 'small');
			if (i === selectedIndex) {
				line.classList.add('tall');
			//} else if (i % 2 === 0) {
			//} else if (i === selectedIndex - 1 || i === selectedIndex + 1) {
			} else if (i === 0 || i === this.#selectorLines.length - 1 || i === Math.floor(this.#selectorLines.length / 2)) {
				line.classList.add('medium');
			} else {
				line.classList.add('small');
			}
		});
	}

	slideTo(index) {
		this.#currentIndex = +index;
		this.updateSelectorLines(this.#currentIndex);
		requestAnimationFrame(() => {
			this.sliderWrapper.style.transition = 'transform 0.2s ease-out';
			if (this.orientation === 'vertical') {
				this.sliderWrapper.style.transform = `translateY(${-this.containerSize * index - 8 * index}px)`;
			} else {
				this.sliderWrapper.style.transform = `translateX(${-this.containerSize * index - 8 * index}px)`;
			}
		});
	}

	onClickSetSlice(e) {
		const sliceIndex = e.target.getAttribute('data-slice-index');
		this.slideTo(sliceIndex);
	}

	startSelectorSlider(e) {
		e.preventDefault();
		this.mouseDown = true;
		this.startX = e.clientX ? e.clientX : e.touches[0].screenX;
		this.startY = e.clientY ? e.clientY : e.touches[0].screenY;
		this.startSelectorIndex = this.#currentIndex;
		this.selectorContainer.addEventListener(
			e.clientX ? 'mousemove' : 'touchmove',
			this.moveSelectorSliderEventListener,
			{ passive: false },
		);
		window.addEventListener(e.clientX ? 'mouseup' : 'touchend', this.endSelectorSliderEventListener);
	}

	clamp = (num, min, max) => Math.min(Math.max(num, min), max)

	moveSelectorSlider(e) {
		if (!this.mouseDown) return;

		const x = e.clientX ?? e.touches?.[0]?.screenX;
		const y = e.clientY ?? e.touches?.[0]?.screenY;
		const primary = this.orientation === 'vertical' ? y : x;
		const startPrimary = this.orientation === 'vertical' ? this.startY : this.startX;
		if (primary === undefined || startPrimary === undefined) return;
		if (e.cancelable) e.preventDefault();

		const steps = this.#slices.length - 1;
		const stepWidth = (this.orientation === 'vertical'
			? this.selectorContainer.clientHeight
			: this.selectorContainer.clientWidth) / steps;

		const delta = primary - startPrimary;
		const offset = delta / stepWidth;
		const target = this.clamp(this.startSelectorIndex + offset, 0, steps);
		const movingDownOrLeft = (this.orientation === 'vertical' && delta < 0)
			|| (this.orientation === 'horizontal' && delta < 0);
		const nextIndex = movingDownOrLeft ? Math.floor(target) : Math.ceil(target);

		if (nextIndex !== this.#currentIndex) {
			this.#slid = true;
			this.slideTo(nextIndex);
		}
	}

	endSelectorSlider(e) {
		if (!this.mouseDown) return;
		this.mouseDown = false;
		this.selectorContainer.removeEventListener('mousemove', this.moveSelectorSliderEventListener);
		this.selectorContainer.removeEventListener('touchmove', this.moveSelectorSliderEventListener);
		window.removeEventListener('mouseup', this.endSelectorSliderEventListener);
		window.removeEventListener('touchend', this.endSelectorSliderEventListener);

		let primary = this.orientation === 'vertical' ? e.clientY : e.clientX;
		if (primary === undefined && e.changedTouches) {
			primary = this.orientation === 'vertical'
				? e.changedTouches[0].screenY
				: e.changedTouches[0].screenX;
		}

		const startPrimary = this.orientation === 'vertical' ? this.startY : this.startX;
		const dist = (primary ?? startPrimary) - startPrimary;

		if(!this.#slid) {
			if (dist > 50 && this.#currentIndex > 0) {
				this.#currentIndex -= 1;
			} else if (dist < -50 && this.#currentIndex < this.lastIndex - 2) {
				this.#currentIndex += 1;
			}
		}
		this.slideTo(this.#currentIndex);
	}

	startSlider(e) {
		this.mouseDown = true;
		if (e.cancelable) {
			e.preventDefault();
		}
		// read from desktop or mobile devices
		this.startX = e.clientX ? e.clientX : e.touches[0].screenX;
		this.startY = e.clientY ? e.clientY : e.touches[0].screenY;
		this.startTranslate = -this.containerSize * this.#currentIndex - 8 * this.#currentIndex;

		// Keep the slider centered in view when a drag begins
		this.rootContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

		this.sliderWrapper.removeEventListener('touchmove', this.startSliderEventListener);
		this.sliderWrapper.removeEventListener('mousemove', this.startSliderEventListener);
		this.sliderWrapper.style.transition = 'transform 0s linear';
		this.sliderWrapper.addEventListener(
			e.clientX ? 'mousemove' : 'touchmove',
			this.moveSliderEventListener,
			{ passive: false },
		);
		this.sliderWrapper.addEventListener('mouseleave', this.endSliderEventListener);
		this.sliderWrapper.addEventListener('touchcancel', this.endSliderEventListener);
		this.#currentSlice = this.#slices[this.#currentIndex];
	}

	moveSlider(e) {
		if (!this.mouseDown) return;
		if(e.cancelable) e.preventDefault();

		const currentX = e.clientX || e.touches?.[0].screenX;
		const currentY = e.clientY || e.touches?.[0].screenY;

		if (!currentX && !currentY) return;

		requestAnimationFrame(() => {
			const deltaPrimary = this.orientation === 'vertical'
				? currentY - this.startY
				: currentX - this.startX;
			const transformValue = this.startTranslate + deltaPrimary;
			if (this.orientation === 'vertical') {
				this.sliderWrapper.style.transform = `translateY(${transformValue}px)`;
			} else {
				this.sliderWrapper.style.transform = `translateX(${transformValue}px)`;
			}
		});
	}

	endSlider(e) {
		if (!this.mouseDown || !e) return;

		this.mouseDown = false;

		console.log('End slider, scrolling:', this.scrolling);
		if ((this.orientation === 'vertical' && this.scrolling !== 'horizontal')
			|| (this.orientation === 'horizontal' && this.scrolling !== 'vertical')) {
		
			let primary = this.orientation === 'vertical' ? e.clientY : e.clientX;
			// primary can be 0 if you drag to the edge
			if ((primary === undefined || primary === null) && e.changedTouches) {
				primary = this.orientation === 'vertical'
					? e.changedTouches[0].screenY
					: e.changedTouches[0].screenX;
			}

			const startPrimary = this.orientation === 'vertical' ? this.startY : this.startX;
			const dist = (primary ?? startPrimary) - startPrimary || 0;

			// Dist value was chosen after many trials when scroll direction flipped
			if (dist > 50 && this.#currentIndex > 0) this.#currentIndex -= 1;
			else if (dist < -50 && this.#currentIndex < this.lastIndex - 2) this.#currentIndex += 1;
			this.slideTo(this.#currentIndex);
		}
		this.rootContainer.removeEventListener('mousemove', this.moveSliderEventListener);
		this.rootContainer.removeEventListener('touchmove', this.moveSliderEventListener);
		this.rootContainer.removeEventListener('mouseleave', this.endSliderEventListener);
		window.removeEventListener('touchcancel', this.endSliderEventListener);
		this.sliderWrapper.addEventListener('touchmove', this.startSliderEventListener, { passive: false });
	}

	// The refresh is debounced to allow screen size changes to settle
	debouncedRefresh() {
		if (this.#refreshTimeout) clearTimeout(this.#refreshTimeout);
		this.#refreshTimeout = setTimeout(() => this.refresh(), 120);
	}

	refresh() {
		if (!this.sliderWrapper) return;
		this.orientation = this.getOrientation();
		requestAnimationFrame(() => {
			this.containerSize = this.getContainerSize();
			this.slideTo(this.#currentIndex);
		});
	}
}