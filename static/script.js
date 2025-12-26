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
});