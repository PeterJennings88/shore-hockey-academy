// Shore Hockey Academy - Frontend behavior, forms, and analytics

document.addEventListener('DOMContentLoaded', () => {
  const config = window.SHA_CONFIG || {};
  const pageType = document.body.dataset.page || 'unknown';

  initializeYear();
  initializeGa4(config);
  applyConfiguredLinks(config);
  setupMobileNavigation();
  setupSmoothScroll();
  setupScrollAnimations();
  setupStickyCta();
  setupHeroVideoMotion();
  setupForms(pageType);
  setupCtaTracking(pageType);

  function initializeYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach((node) => {
      node.textContent = year;
    });
  }

  function initializeGa4(siteConfig) {
    const id = typeof siteConfig.gaMeasurementId === 'string' ? siteConfig.gaMeasurementId.trim() : '';
    if (!/^G-[A-Z0-9]+$/i.test(id)) {
      return;
    }

    if (!document.querySelector('script[data-ga-loader="true"]')) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      gaScript.dataset.gaLoader = 'true';
      document.head.appendChild(gaScript);
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', id, {
      anonymize_ip: true,
      transport_type: 'beacon'
    });
  }

  function trackEvent(name, payload = {}) {
    const eventPayload = {
      page_type: pageType,
      page_path: window.location.pathname,
      ...payload
    };

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, eventPayload);
    }

    if (config.analyticsDebug) {
      console.log('[analytics]', name, eventPayload);
    }
  }

  function applyConfiguredLinks(siteConfig) {
    const links = document.querySelectorAll('[data-config-link]');
    links.forEach((link) => {
      const key = link.getAttribute('data-config-link');
      const value = typeof siteConfig[key] === 'string' ? siteConfig[key].trim() : '';

      if (!value) {
        link.classList.add('is-hidden');
        return;
      }

      link.classList.remove('is-hidden');
      link.setAttribute('href', value);
      if (value.startsWith('http')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      } else {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }
    });

    document.querySelectorAll('.social-links').forEach((container) => {
      const visible = container.querySelectorAll('a:not(.is-hidden)');
      if (visible.length === 0) {
        container.classList.add('is-hidden');
      }
    });
  }

  function setupMobileNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (!mobileMenuBtn || !navLinks) {
      return;
    }

    if (!navLinks.id) {
      navLinks.id = 'primary-nav-links';
    }

    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-controls', navLinks.id);

    const closeMenu = () => {
      navLinks.classList.remove('active');
      mobileMenuBtn.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      navLinks.classList.add('active');
      mobileMenuBtn.classList.add('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    };

    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('active');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.querySelectorAll('a').forEach((item) => {
      item.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (!navLinks.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        closeMenu();
      }
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#' || href === '#0') {
          return;
        }

        const target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();
        const offset = stickyHeaderOffset();
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
          top,
          behavior: 'smooth'
        });
      });
    });
  }

  function stickyHeaderOffset() {
    const navbar = document.querySelector('.navbar');
    const urgency = document.querySelector('.urgency-banner');
    const navHeight = navbar ? navbar.offsetHeight : 0;
    const urgencyHeight = urgency ? urgency.offsetHeight : 0;
    return navHeight + urgencyHeight + 10;
  }

  function setupScrollAnimations() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animatedSections = document.querySelectorAll(
      '.section-title, .section-subtitle, .about-grid, .founder-card, .subsection-title'
    );
    const programCards = document.querySelectorAll('.program-card');
    const advisorCards = document.querySelectorAll('.advisor-card');
    const coachCards = document.querySelectorAll('.coach-card');
    const credentials = document.querySelectorAll('.credentials');

    animatedSections.forEach((el) => el.classList.add('fade-in'));
    programCards.forEach((card, index) => card.classList.add('fade-in', `stagger-${(index % 3) + 1}`));
    advisorCards.forEach((card, index) => card.classList.add('scale-in', `stagger-${(index % 5) + 1}`));
    coachCards.forEach((card, index) => card.classList.add('fade-in', `stagger-${(index % 3) + 1}`));
    credentials.forEach((el) => el.classList.add('fade-in'));

    const allAnimated = document.querySelectorAll('.fade-in, .scale-in, .fade-in-left, .fade-in-right');

    if (reduceMotion || typeof IntersectionObserver !== 'function') {
      allAnimated.forEach((element) => element.classList.add('visible'));
      return;
    }

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('visible');

        if (entry.target.classList.contains('credentials')) {
          animateCredentials(entry.target);
        }
      });
    }, observerOptions);

    allAnimated.forEach((el) => scrollObserver.observe(el));
  }

  function animateCredentials(container) {
    if (container.dataset.animated === 'true') {
      return;
    }
    container.dataset.animated = 'true';

    container.querySelectorAll('.credential-number').forEach((num, index) => {
      setTimeout(() => {
        num.classList.add('counting');

        const original = num.textContent.trim();
        const numericPart = Number.parseInt(original.replace(/[^0-9]/g, ''), 10);
        const hasPlus = original.includes('+');

        if (Number.isFinite(numericPart) && numericPart > 0 && numericPart <= 100) {
          let current = 0;
          const increment = Math.max(1, Math.ceil(numericPart / 20));
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericPart) {
              current = numericPart;
              clearInterval(timer);
            }
            num.textContent = `${current}${hasPlus ? '+' : ''}`;
          }, 45);
        }

        setTimeout(() => {
          num.classList.remove('counting');
        }, 450);
      }, index * 150);
    });
  }

  function setupStickyCta() {
    const stickyCta = document.querySelector('.sticky-cta');
    const heroSection = document.querySelector('.hero');
    const registerSection = document.querySelector('#register');

    if (!stickyCta || !heroSection) {
      return;
    }

    const updateCtaVisibility = () => {
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      const registerTop = registerSection ? registerSection.offsetTop - window.innerHeight : Infinity;
      const scrollY = window.scrollY;

      if (scrollY > heroBottom && scrollY < registerTop) {
        stickyCta.classList.add('visible');
      } else {
        stickyCta.classList.remove('visible');
      }
    };

    updateCtaVisibility();
    window.addEventListener('scroll', updateCtaVisibility);
  }

  function setupHeroVideoMotion() {
    const heroVideo = document.querySelector('.hero-video');
    if (!heroVideo) {
      return;
    }

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyMotionPreference = () => {
      if (reduceMotionQuery.matches) {
        document.body.classList.add('reduce-motion');
        heroVideo.pause();
      } else {
        document.body.classList.remove('reduce-motion');
        heroVideo.play().catch(() => {
          // Browser may block autoplay; keep fallback overlay.
        });
      }
    };

    applyMotionPreference();

    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', applyMotionPreference);
    }

    const heroContent = document.querySelector('.hero-content');
    if (!heroContent || reduceMotionQuery.matches) {
      return;
    }

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;
        heroContent.style.opacity = String(1 - (scrollY / window.innerHeight) * 0.35);
      }
    });
  }

  function setupForms(currentPageType) {
    const forms = document.querySelectorAll('form[data-api-endpoint]');

    forms.forEach((form) => {
      const formType = form.dataset.formType || 'unknown';
      setupFormStartTracking(form, formType, currentPageType);

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormErrors(form);

        const endpoint = form.dataset.apiEndpoint;
        const payload = buildFormPayload(form, formType);
        const validationError = validatePayload(form, formType, payload);

        if (validationError) {
          showFormMessage(form, validationError.message, 'error');
          trackEvent('form_submit_error', {
            form_type: formType,
            error_code: validationError.code,
            error_field: validationError.field || ''
          });
          return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Submitting...';
        }

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok || !result.ok) {
            throw {
              code: result.code || 'SUBMIT_FAILED',
              message: result.message || 'Unable to submit right now. Please try again.',
              field: result.field || ''
            };
          }

          showFormMessage(
            form,
            result.message || 'Thank you. Your submission was received. We will follow up soon.',
            'success'
          );
          form.reset();

          trackEvent('form_submit_success', {
            form_type: formType,
            lead_id: result.id || ''
          });
        } catch (error) {
          if (error.field) {
            markInvalidField(form, error.field);
          }

          showFormMessage(
            form,
            error.message || 'Unable to submit right now. Please try again in a few minutes.',
            'error'
          );

          trackEvent('form_submit_error', {
            form_type: formType,
            error_code: error.code || 'SUBMIT_FAILED',
            error_field: error.field || ''
          });
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        }
      });
    });
  }

  function setupFormStartTracking(form, formType, currentPageType) {
    let started = false;
    form.addEventListener('focusin', () => {
      if (started) {
        return;
      }
      started = true;
      trackEvent('form_start', {
        form_type: formType,
        page_type: currentPageType
      });
    });
  }

  function buildFormPayload(form, formType) {
    const formData = new FormData(form);
    const payload = {};

    formData.forEach((value, key) => {
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });

    const params = new URLSearchParams(window.location.search);
    payload.utm_source = payload.utm_source || params.get('utm_source') || '';
    payload.utm_medium = payload.utm_medium || params.get('utm_medium') || '';
    payload.utm_campaign = payload.utm_campaign || params.get('utm_campaign') || '';
    payload.sourcePage = window.location.pathname;

    const consentInput = form.querySelector('[name="consentPolicy"]');
    payload.consentPolicy = consentInput && consentInput.checked ? 'yes' : 'no';

    payload.company = payload.company || '';

    if (formType === 'camp') {
      payload.sessionOrProgram = payload.session || payload.program || payload.sessionOrProgram || '';
    }

    if (formType === 'business') {
      try {
        payload.calendlyClicked = localStorage.getItem('sha_calendly_clicked') === 'yes' ? 'yes' : 'no';
      } catch (_error) {
        payload.calendlyClicked = 'no';
      }
    }

    return payload;
  }

  function validatePayload(form, formType, payload) {
    const requiredByType = {
      camp: ['playerName', 'playerAge', 'skillLevel', 'sessionOrProgram', 'parentName', 'email', 'phone'],
      business: ['name', 'email', 'interest']
    };

    const requiredFields = requiredByType[formType] || [];

    for (const field of requiredFields) {
      if (!payload[field]) {
        markInvalidField(form, field);
        return {
          code: 'VALIDATION_ERROR',
          message: 'Please complete all required fields before submitting.',
          field
        };
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '')) {
      markInvalidField(form, 'email');
      return {
        code: 'VALIDATION_ERROR',
        message: 'Please enter a valid email address.',
        field: 'email'
      };
    }

    if (formType === 'camp') {
      const phoneDigits = (payload.phone || '').replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10) {
        markInvalidField(form, 'phone');
        return {
          code: 'VALIDATION_ERROR',
          message: 'Please enter a valid phone number.',
          field: 'phone'
        };
      }

      const age = Number(payload.playerAge);
      if (!Number.isFinite(age) || age < 5 || age > 20) {
        markInvalidField(form, 'playerAge');
        return {
          code: 'VALIDATION_ERROR',
          message: 'Player age must be between 5 and 20.',
          field: 'playerAge'
        };
      }
    }

    if (payload.consentPolicy !== 'yes') {
      markInvalidField(form, 'consentPolicy');
      return {
        code: 'VALIDATION_ERROR',
        message: 'You must agree to the Privacy Policy and Terms to continue.',
        field: 'consentPolicy'
      };
    }

    return null;
  }

  function clearFormErrors(form) {
    form.querySelectorAll('.input-error').forEach((field) => field.classList.remove('input-error'));
    const feedback = form.querySelector('.form-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  function markInvalidField(form, fieldName) {
    const escapedFieldName =
      window.CSS && typeof window.CSS.escape === 'function'
        ? window.CSS.escape(fieldName)
        : String(fieldName).replace(/[^a-zA-Z0-9_-]/g, '');

    const target =
      form.querySelector(`[name="${escapedFieldName}"]`) ||
      (fieldName === 'sessionOrProgram'
        ? form.querySelector('[name="program"], [name="session"]')
        : null);

    if (target) {
      target.classList.add('input-error');
    }
  }

  function showFormMessage(form, message, type) {
    const feedback = document.createElement('div');
    feedback.className = `form-feedback ${type === 'error' ? 'error' : 'success'}`;
    feedback.textContent = message;
    form.prepend(feedback);
    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setupCtaTracking(currentPageType) {
    document.querySelectorAll('a[data-track], button[data-track], a.btn').forEach((node) => {
      node.addEventListener('click', () => {
        const explicitTrack = node.getAttribute('data-track');
        const label = (node.textContent || '').trim();

        if (explicitTrack === 'outbound_social_click') {
          trackEvent('outbound_social_click', {
            platform: node.getAttribute('data-platform') || 'unknown',
            page_type: currentPageType
          });
          return;
        }

        if (explicitTrack === 'calendly_click') {
          try {
            localStorage.setItem('sha_calendly_clicked', 'yes');
          } catch (_error) {
            // Ignore storage failures in private browsing modes.
          }
          trackEvent('calendly_click', {
            page_type: currentPageType,
            cta_label: label
          });
          return;
        }

        trackEvent('cta_click', {
          page_type: currentPageType,
          cta_label: label,
          cta_target: node.getAttribute('href') || node.getAttribute('id') || ''
        });
      });
    });
  }
});
