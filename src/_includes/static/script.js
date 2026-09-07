document.addEventListener('DOMContentLoaded', function() {
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

	// ──────────────────────────────────────
	// Shopping Cart System
	// ──────────────────────────────────────
	const CART_KEY = 'planbi_cart';

	function slugify(str) {
		return str.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}

	function getCart() {
		try {
			return JSON.parse(localStorage.getItem(CART_KEY)) || [];
		} catch (e) {
			return [];
		}
	}

	function saveCart(cart) {
		localStorage.setItem(CART_KEY, JSON.stringify(cart));
	}

	function addToCart(name, price, priceDisplay) {
		var cart = getCart();
		var id = slugify(name);
		var existing = cart.find(function(item) { return item.id === id; });
		if (existing) {
			existing.quantity++;
		} else {
			cart.push({ id: id, name: name, price: price, priceDisplay: priceDisplay, quantity: 1 });
		}
		saveCart(cart);
		renderCart();
	}

	function removeFromCart(id) {
		var cart = getCart().filter(function(item) { return item.id !== id; });
		saveCart(cart);
		renderCart();
	}

	function updateQuantity(id, delta) {
		var cart = getCart();
		var item = cart.find(function(i) { return i.id === id; });
		if (item) {
			item.quantity += delta;
			if (item.quantity <= 0) {
				cart = cart.filter(function(i) { return i.id !== id; });
			}
		}
		saveCart(cart);
		renderCart();
	}

	function clearCart() {
		saveCart([]);
		renderCart();
	}

	function getCartTotal() {
		return getCart().reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);
	}

	function getCartCount() {
		return getCart().reduce(function(sum, item) { return sum + item.quantity; }, 0);
	}

	// Render cart badge and dropdown
	function renderCart() {
		renderCartBadge();
		renderCartDropdown();
		// Dispatch event for booking page to listen to
		document.dispatchEvent(new CustomEvent('cartUpdated'));
	}

	function renderCartBadge() {
		var badge = document.getElementById('cart-badge');
		if (!badge) return;
		var count = getCartCount();
		badge.textContent = count;
		if (count > 0) {
			badge.classList.remove('hidden');
			badge.classList.remove('pulse');
			void badge.offsetWidth; // trigger reflow
			badge.classList.add('pulse');
		} else {
			badge.classList.add('hidden');
		}
	}

	function renderCartDropdown() {
		var container = document.getElementById('cart-items');
		var totalEl = document.getElementById('cart-total');
		var totalValue = document.getElementById('cart-total-value');
		var checkoutBtn = document.getElementById('cart-checkout');
		var clearBtn = document.getElementById('cart-clear');
		if (!container) return;

		var cart = getCart();

		if (cart.length === 0) {
			container.innerHTML = '<p class="cart-empty">Coșul este gol.</p>';
			if (totalEl) totalEl.classList.add('hidden');
			if (checkoutBtn) checkoutBtn.classList.add('hidden');
			if (clearBtn) clearBtn.classList.add('hidden');
			return;
		}

		var html = '';
		cart.forEach(function(item) {
			html += '<div class="cart-item" data-cart-id="' + item.id + '">'
				+ '<div class="cart-item-info">'
				+ '<div class="cart-item-name">' + item.name + '</div>'
				+ '<div class="cart-item-price">' + item.priceDisplay + '</div>'
				+ '</div>'
				+ '<div class="cart-item-controls">'
				+ '<button class="cart-qty-btn cart-qty-minus" data-id="' + item.id + '">−</button>'
				+ '<span class="cart-item-qty">' + item.quantity + '</span>'
				+ '<button class="cart-qty-btn cart-qty-plus" data-id="' + item.id + '">+</button>'
				+ '</div>'
				+ '<button class="cart-item-remove" data-id="' + item.id + '" title="Elimină">×</button>'
				+ '</div>';
		});
		container.innerHTML = html;

		if (totalEl) {
			totalEl.classList.remove('hidden');
			if (totalValue) totalValue.textContent = getCartTotal() + ' Euro';
		}
		if (checkoutBtn) checkoutBtn.classList.remove('hidden');
		if (clearBtn) clearBtn.classList.remove('hidden');
	}

	// Cart toggle
	var cartToggle = document.getElementById('cart-toggle');
	var cartDropdown = document.getElementById('cart-dropdown');
	if (cartToggle && cartDropdown) {
		cartToggle.addEventListener('click', function(e) {
			e.stopPropagation();
			cartDropdown.classList.toggle('hidden');
			// Close mobile menu if open
			if (menu) menu.classList.remove('active');
		});

		// Close dropdown on outside click
		document.addEventListener('click', function(e) {
			if (!cartDropdown.classList.contains('hidden') && !cartDropdown.contains(e.target) && e.target !== cartToggle) {
				cartDropdown.classList.add('hidden');
			}
		});

		// Delegate clicks inside dropdown
		cartDropdown.addEventListener('click', function(e) {
			var target = e.target;
			if (target.classList.contains('cart-qty-minus')) {
				updateQuantity(target.dataset.id, -1);
			} else if (target.classList.contains('cart-qty-plus')) {
				updateQuantity(target.dataset.id, 1);
			} else if (target.classList.contains('cart-item-remove')) {
				removeFromCart(target.dataset.id);
			}
		});
	}

	// Clear cart button
	var clearBtn = document.getElementById('cart-clear');
	if (clearBtn) {
		clearBtn.addEventListener('click', function() {
			clearCart();
		});
	}

	// Add-to-cart buttons on services page
	document.querySelectorAll('.add-to-cart').forEach(function(btn) {
		btn.addEventListener('click', function() {
			var name = btn.dataset.service;
			var price = parseInt(btn.dataset.price, 10);
			var priceDisplay = btn.dataset.priceDisplay;
			addToCart(name, price, priceDisplay);

			// Visual feedback
			var original = btn.textContent;
			btn.textContent = '✓ Adăugat';
			btn.classList.add('added');
			setTimeout(function() {
				btn.textContent = original;
				btn.classList.remove('added');
			}, 800);
		});
	});

	// Expose cart functions globally for booking.js
	window.PlanBiCart = {
		getCart: getCart,
		saveCart: saveCart,
		addToCart: addToCart,
		removeFromCart: removeFromCart,
		updateQuantity: updateQuantity,
		clearCart: clearCart,
		getCartTotal: getCartTotal,
		getCartCount: getCartCount,
		renderCart: renderCart
	};

	// Initial render
	renderCart();
});