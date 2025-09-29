document.addEventListener('DOMContentLoaded', function() {
    console.log("Website template loaded successfully!");
    // Register the ScrollTrigger plugin with GSAP
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
});
