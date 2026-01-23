export default class GraphicEffects {
	/** @type {Array<HTMLObjectElement>} */
	#slices = undefined;

	/** @type {Array<HTMLObjectElement>} */
	#selectorLines = undefined;

	/** @type {number} */
	#currentIndex = 0;

	/** @type {HTMLOListElement} */
	#currentSlice = undefined;

	constructor() {
		/* Slice slider */
		this.rootContainer = undefined;
		this.mouseDown = false;
		this.scrolling = undefined;
		this.startX = 0;
		this.startY = 0;
		this.startTranslate = 0;
		this.startSelectorIndex = 0;

		this.startSliderEventListener = this.startSlider.bind(this);
		this.moveSliderEventListener = this.moveSlider.bind(this);
		this.endSliderEventListener = this.endSlider.bind(this);
		this.refreshEventListener = this.refresh.bind(this);

		this.startSelectorSliderEventListener = this.startSelectorSlider.bind(this);
		this.moveSelectorSliderEventListener = this.moveSelectorSlider.bind(this);
		this.endSelectorSliderEventListener = this.endSelectorSlider.bind(this);

		/* Navigation panel */
		this.navOpen = false;
	}

	init(forContainer) {
		/* Slice slider */
		this.rootContainer = forContainer;
		// TDO use percentages instead of width
		this.containerWidth = this.rootContainer.clientWidth;
		// TODO remove below line to improve performance. It causes reflow
		this.sliderWrapper = this.rootContainer.querySelector('.section');
		this.lastIndex = this.sliderWrapper.children.length + 1;

		this.#slices = this.rootContainer.querySelectorAll('.slice');
		this.#slices.forEach((el, i) => {
			el.setAttribute('data-slice-index', i);
		});

		this.#currentIndex = 0;

		/* Selector */
		this.selectorContainer = document.getElementById('selector');
		this.selectorWrapper = this.selectorContainer.querySelector('.section');
		this.#selectorLines = [];
		for (let i = 0; i < this.#slices.length; i++) {
			const line = document.createElement('div');
			line.classList.add('selector-line');
			line.setAttribute('data-slice-index', i);
			line.addEventListener('click', (e) => this.onClickSetSlice(e));
			this.selectorWrapper.appendChild(line);
			this.#selectorLines.push(line);
		}
		this.updateSelectorLines(this.#currentIndex);


		// * when mousedown or touchstart
		this.resume();

		// * when mouseup or touchend
		// TODO This registers the event listener multiple times
		window.addEventListener('mouseup', this.endSliderEventListener);
		window.addEventListener('touchend', this.endSliderEventListener);
		window.addEventListener('resize', this.refreshEventListener, true);
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
			this.sliderWrapper.style.transform = `translateX(${-this.containerWidth * index - 8 * index}px)`;
		});
	}

	onClickSetSlice(e) {
		const sliceIndex = e.target.getAttribute('data-slice-index');
		this.slideTo(sliceIndex);
	}

	startSelectorSlider(e) {
		this.mouseDown = true;
		this.startX = e.clientX ? e.clientX : e.touches[0].screenX;
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
		if (x === undefined) return;
		e.preventDefault?.();

		const steps = this.#slices.length - 1;
		const stepWidth = this.selectorContainer.clientWidth / steps;

		const delta = x - this.startX;
		const offset = delta / stepWidth;
		const target = this.clamp(this.startSelectorIndex + offset, 0, steps);
		const nextIndex = Math.round(target);

		if (nextIndex !== this.#currentIndex) {
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

		let x = e.clientX;
		if (x === undefined && e.changedTouches) {
			x = e.changedTouches[0].screenX;
		}

		const dist = x - this.startX;

		if (dist > 50 && this.#currentIndex > 0) {
			this.#currentIndex -= 1;
		} else if (dist < -50 && this.#currentIndex < this.lastIndex - 2) {
			this.#currentIndex += 1;
		}
		this.slideTo(this.#currentIndex);
	}

	startSlider(e) {
		this.mouseDown = true;

		// read from desktop or mobile devices
		this.startX = e.clientX ? e.clientX : e.touches[0].screenX;
		this.startY = e.clientY ? e.clientY : e.touches[0].screenY;
		this.startTranslate = -this.containerWidth * this.#currentIndex - 8 * this.#currentIndex;

		this.sliderWrapper.removeEventListener('touchmove', this.startSliderEventListener);
		this.sliderWrapper.removeEventListener('mousemove', this.startSliderEventListener);
		this.sliderWrapper.style.transition = 'transform 0s linear';
		this.rootContainer.addEventListener(
			e.clientX ? 'mousemove' : 'touchmove',
			this.moveSliderEventListener,
			{ passive: false },
		);
		this.#currentSlice = this.#slices[this.#currentIndex];
	}

	moveSlider(e) {
		if (!this.mouseDown) return;

		const currentX = e.clientX || e.touches?.[0].screenX;
		const currentY = e.clientY || e.touches?.[0].screenY;

		if (!currentX && !currentY) return;

		requestAnimationFrame(() => {
			if (!this.scrolling) {
				// Mouse move
				if (e.clientX) this.scrolling = 'horizontal';
				else {
					// Touch move. Check scroll direction
					if (Math.abs(currentY - this.startY) > 10
						&& this.#currentSlice.scrollTop > 0) { // Vertical
						// Do not allow horizontal scrolling anymore. It will glitch
						this.scrolling = 'vertical';
						// Reset horizontal scroll to zero, by resetting the slide index
						this.slideTo(this.#currentIndex);
						return;
					} if (Math.abs(currentX - this.startX) > 10) { // Horizontal
						this.scrolling = 'horizontal';
					}
				}
			}

			// Allow horizontal scroll even if no scroll is present.
			// Vertical is automatically performed by the system.
			if (this.scrolling === undefined || this.scrolling === 'horizontal') {
				const deltaX = currentX - this.startX;
				this.sliderWrapper.style.transform = `translateX(${this.startTranslate + deltaX}px)`;
			}
		});
	}

	endSlider(e) {
		if (!this.mouseDown || !e) return;

		this.mouseDown = false;
		if (this.scrolling === 'horizontal') {
			let x = e.clientX;
			// x evaluates to 0 if you drag left to the end of the body)
			if (!x && e.changedTouches) {
				x = e.changedTouches[0].screenX;
			}

			const dist = x - this.startX || 0;

			// Dist value was chosen after many trials when horizontal scrolls
			// did not work because they were detected as vertical scrolls
			if (dist > 50 && this.#currentIndex > 0) this.#currentIndex -= 1;
			else if (dist < -50 && this.#currentIndex < this.lastIndex - 2) this.#currentIndex += 1;
			this.slideTo(this.#currentIndex);
		}
		this.rootContainer.removeEventListener('mousemove', this.moveSliderEventListener);
		this.rootContainer.removeEventListener('touchmove', this.moveSliderEventListener);
		this.sliderWrapper.addEventListener('touchmove', this.startSliderEventListener, { passive: false });
		this.scrolling = undefined;
	}

	refresh() {
		this.containerWidth = this.rootContainer.clientWidth;
		this.slideTo(this.#currentIndex);
	}
}