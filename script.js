// Shore Hockey Academy - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // SCROLL ANIMATIONS
    // ==========================================

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger number animation if it's a credential
                if (entry.target.classList.contains('credentials')) {
                    animateCredentials(entry.target);
                }
            }
        });
    }, observerOptions);

    // Add fade-in class to sections and observe
    const animatedSections = document.querySelectorAll('.section-title, .section-subtitle, .about-grid, .founder-card, .subsection-title');
    animatedSections.forEach(el => {
        el.classList.add('fade-in');
        scrollObserver.observe(el);
    });

    // Add fade-in to program cards with stagger
    const programCards = document.querySelectorAll('.program-card');
    programCards.forEach((card, index) => {
        card.classList.add('fade-in', `stagger-${(index % 3) + 1}`);
        scrollObserver.observe(card);
    });

    // Add fade-in to advisor cards with stagger
    const advisorCards = document.querySelectorAll('.advisor-card');
    advisorCards.forEach((card, index) => {
        card.classList.add('scale-in', `stagger-${(index % 5) + 1}`);
        scrollObserver.observe(card);
    });

    // Add fade-in to coach cards with stagger
    const coachCards = document.querySelectorAll('.coach-card');
    coachCards.forEach((card, index) => {
        card.classList.add('fade-in', `stagger-${(index % 3) + 1}`);
        scrollObserver.observe(card);
    });

    // Observe credentials for number animation
    const credentials = document.querySelectorAll('.credentials');
    credentials.forEach(el => {
        el.classList.add('fade-in');
        scrollObserver.observe(el);
    });

    // ==========================================
    // ANIMATED CREDENTIAL NUMBERS
    // ==========================================

    function animateCredentials(container) {
        const numbers = container.querySelectorAll('.credential-number');
        numbers.forEach((num, index) => {
            setTimeout(() => {
                num.classList.add('counting');

                const text = num.textContent;
                const hasPlus = text.includes('+');
                const numericPart = parseInt(text.replace(/[^0-9]/g, ''));

                // Only animate if it's a pure number
                if (!isNaN(numericPart) && numericPart > 0 && numericPart <= 100) {
                    let current = 0;
                    const increment = Math.ceil(numericPart / 20);
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= numericPart) {
                            current = numericPart;
                            clearInterval(timer);
                        }
                        num.textContent = current + (hasPlus ? '+' : '');
                    }, 50);
                }

                setTimeout(() => {
                    num.classList.remove('counting');
                }, 500);
            }, index * 200);
        });
    }

    // ==========================================
    // STICKY CTA BUTTON
    // ==========================================

    const stickyCta = document.querySelector('.sticky-cta');
    const heroSection = document.querySelector('.hero');
    const registerSection = document.querySelector('#register');

    if (stickyCta && heroSection) {
        window.addEventListener('scroll', function() {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const registerTop = registerSection ? registerSection.offsetTop - window.innerHeight : Infinity;
            const scrollY = window.scrollY;

            if (scrollY > heroBottom && scrollY < registerTop) {
                stickyCta.classList.add('visible');
            } else {
                stickyCta.classList.remove('visible');
            }
        });
    }

    // ==========================================
    // REGISTRATION FORM
    // ==========================================

    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Validate required fields
            const requiredFields = ['playerName', 'playerAge', 'skillLevel', 'program', 'parentName', 'email', 'phone'];
            let isValid = true;

            requiredFields.forEach(field => {
                const input = document.getElementById(field);
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#e74c3c';
                } else {
                    input.style.borderColor = 'var(--border-color)';
                }
            });

            // Validate email format
            const emailInput = document.getElementById('email');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value)) {
                isValid = false;
                emailInput.style.borderColor = '#e74c3c';
            }

            if (isValid) {
                // Show success message
                showSuccessMessage();

                // Log form data (in production, this would be sent to a server)
                console.log('Registration submitted:', data);

                // Reset form
                this.reset();
            }
        });
    }

    // Show success message
    function showSuccessMessage() {
        // Create success message if it doesn't exist
        let successMsg = document.querySelector('.form-success');

        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.className = 'form-success';
            successMsg.innerHTML = `
                <strong>Registration Submitted!</strong>
                <p>Thank you for registering with Shore Hockey Academy. We'll contact you within 24-48 hours to confirm your spot and discuss program details.</p>
            `;
            registrationForm.insertBefore(successMsg, registrationForm.firstChild);
        }

        successMsg.classList.add('show');

        // Scroll to success message
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Hide after 10 seconds
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 10000);
    }

    // ==========================================
    // NAVBAR SCROLL EFFECT
    // ==========================================

    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(13, 13, 13, 0.97)';
            navbar.style.boxShadow = 'none';
        }
    });

    // ==========================================
    // FORM INPUT ANIMATIONS
    // ==========================================

    const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // ==========================================
    // PARALLAX EFFECT ON HERO (subtle)
    // ==========================================

    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            if (scrollY < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrollY / window.innerHeight) * 0.5;
            }
        });
    }
});
