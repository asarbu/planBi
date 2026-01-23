import GraphicEffects from './effects.js';

document.addEventListener('DOMContentLoaded', function () {
	const imageContainer = document.getElementById('portfolio-details');
	if (imageContainer) {
		const effect = new GraphicEffects();
		effect.init(imageContainer);
	}		
});