(function () {
  // ----- Utility Functions -----
  function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(num);
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validatePhone(value) {
    return /^[0-9+()\-\s]{7,}$/.test(value);
  }

  // ----- Calculator: estimated opportunity cost -----
  var monthlyInput = document.getElementById('monthly_leads');
  var commissionInput = document.getElementById('average_commission');
  var conversionInput = document.getElementById('current_conversion_rate');
  var resultEl = document.getElementById('calculator-result');
  var resultLabelEl = document.querySelector('.calculator-result-label');

  function updateCalculator() {
    if (!monthlyInput || !commissionInput || !conversionInput || !resultEl) return;

    var monthlyLeads = parseFloat(monthlyInput.value) || 0;
    var avgCommission = parseFloat(commissionInput.value) || 0;
    var conversionRate = parseFloat(conversionInput.value) || 0;

    var currentDeals = (conversionRate / 100) * monthlyLeads;
    var improvedDeals = ((conversionRate + 4) / 100) * monthlyLeads;

    var currentRevenue = currentDeals * avgCommission;
    var improvedRevenue = improvedDeals * avgCommission;

    var monthlyLost = Math.max(0, improvedRevenue - currentRevenue);
    var yearlyLost = monthlyLost * 12;

    if (resultLabelEl) {
      resultLabelEl.innerHTML = '<strong>Estimated Yearly Opportunity Loss</strong>';
    }

    resultEl.textContent = formatCurrency(yearlyLost);
  }

  if (monthlyInput) monthlyInput.addEventListener('input', updateCalculator);
  if (commissionInput) commissionInput.addEventListener('input', updateCalculator);
  if (conversionInput) {
    conversionInput.addEventListener('change', updateCalculator);
    conversionInput.addEventListener('input', updateCalculator);
  }
  updateCalculator();

  // ----- Hero rotating second line -----
  var rotateWrap = document.querySelector('.hero-rotate');
  if (rotateWrap) {
    var rotateLines = rotateWrap.querySelectorAll('.hero-rotate-line');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion && rotateLines.length > 1) {
      var rotateIndex = 0;
      window.setInterval(function () {
        rotateLines[rotateIndex].classList.remove('is-active');
        rotateIndex = (rotateIndex + 1) % rotateLines.length;
        rotateLines[rotateIndex].classList.add('is-active');
      }, 3000);
    } else {
      rotateLines.forEach(function(line, i) {
        line.classList.toggle('is-active', i === 0);
      });
    }
  }

  // ----- Fit Assessment -----
  var fitCard = document.querySelector('[data-fit-card]');
  if (fitCard) {
    var fitStepsWrap = fitCard.querySelector('[data-fit-steps]');
    var fitProgressSteps = fitCard.querySelectorAll('[data-fit-progress]');
    var fitResultEl = fitCard.querySelector('[data-fit-result]');
    var fitState = { volume: null, system: null, standardize: null };

    function setProgress(stepNum) {
      fitProgressSteps.forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-fit-progress') === String(stepNum));
      });
    }

    function showFitStep(step) {
      var stepEls = fitStepsWrap ? fitStepsWrap.querySelectorAll('[data-fit-step]') : [];
      stepEls.forEach(function (el) {
        var isTarget = el.getAttribute('data-fit-step') === String(step);
        el.hidden = !isTarget;
        if (isTarget) {
          requestAnimationFrame(function () { el.classList.add('is-active'); });
        } else {
          el.classList.remove('is-active');
        }
      });
      if (['1', '2', '3'].indexOf(String(step)) !== -1) setProgress(step);
    }

    fitCard.addEventListener('click', function (e) {
      var btn = e.target.closest('.fit-option');
      if (!btn) return;
      var stepEl = btn.closest('[data-fit-step]');
      var key = btn.getAttribute('data-fit-key');
      var value = btn.getAttribute('data-fit-value');
      if (key && value) {
        fitState[key] = value;
        stepEl.querySelectorAll('.fit-option[data-fit-key="' + key + '"]').forEach(function (opt) {
          opt.classList.toggle('is-selected', opt.getAttribute('data-fit-value') === value);
        });
        var primaryBtn = stepEl.querySelector('[data-fit-next], [data-fit-finish]');
        if (primaryBtn) primaryBtn.disabled = false;
      }
    });

    fitCard.querySelectorAll('[data-fit-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = btn.closest('[data-fit-step]').getAttribute('data-fit-step');
        if (step === '1') showFitStep('2');
        else if (step === '2') showFitStep('3');
      });
    });

    var finishBtn = fitCard.querySelector('[data-fit-finish]');
    if (finishBtn) {
      finishBtn.addEventListener('click', function () {
        if (fitResultEl) {
          var isStrong = fitState.volume !== '0-10' && fitState.standardize !== 'No';
          if (isStrong) {
            fitResultEl.innerHTML = '<div class="fit-result-title">✔ You\'re a strong fit for structured revenue systems.</div>' +
              '<div class="fit-result-body">If you\'re generating consistent inbound, structure is the difference between unpredictable follow-up and controlled deal flow.</div>' +
              '<div class="fit-actions"><button type="button" class="btn btn-primary btn-lg js-open-qualify-modal">Book Strategic Audit</button></div>';
          } else {
            fitResultEl.innerHTML = '<div class="fit-result-title">This may not be the right stage for structured revenue infrastructure yet.</div>' +
              '<div class="fit-result-body">We\'ve put together resources to help you prepare your inbound for scale.</div>' +
              '<form class="fit-result-form" data-fit-resource-form><input type="email" name="email" placeholder="Email" required /><button type="submit" class="btn btn-primary btn-lg">Send Me Resources</button></form>';
          }
        }
        showFitStep('result');
      });
    }
    showFitStep('1');
  }

  // ----- Qualification Modal -----
  var modalBackdrop = document.querySelector('[data-modal-backdrop]');
  var modalEl = modalBackdrop ? modalBackdrop.querySelector('.modal') : null;
  var lastFocusedBeforeOpen = null;

  function setFieldError(id, message) {
    var form = document.getElementById('qualifyForm');
    if (!form) return;
    var err = form.querySelector('[data-error-for="' + id + '"]');
    if (err) err.textContent = message || '';
  }

  function clearErrors() {
    var form = document.getElementById('qualifyForm');
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
  }

  function showModalStep(step) {
    var form = document.getElementById('qualifyForm');
    if (!form) return;
    form.querySelectorAll('.modal-step').forEach(function (s) {
      s.hidden = s.getAttribute('data-step') !== String(step);
    });
    var header = document.querySelector('.modal-header');
    if (header) header.style.display = (step === 'confirmation' || step === 'duplicate') ? 'none' : '';
    if (modalEl) modalEl.classList.toggle('success-state', step === 'confirmation' || step === 'duplicate');
  }

  function validateStep1() {
    var form = document.getElementById('qualifyForm');
    if (!form) return false;
    clearErrors();
    var v = {
      name: form.fullName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      loc: form.location.value.trim()
    };
    var valid = true;
    if (!v.name) { setFieldError('full_name', 'Required'); valid = false; }
    if (!v.email || !validateEmail(v.email)) { setFieldError('email', 'Invalid email'); valid = false; }
    if (!v.phone || !validatePhone(v.phone)) { setFieldError('phone', 'Invalid phone'); valid = false; }
    if (!v.loc) { setFieldError('location', 'Required'); valid = false; }
    return valid;
  }

  function validateStep2() {
    var form = document.getElementById('qualifyForm');
    if (!form) return false;
    clearErrors();
    var v = {
      rev: form.monthlyRevenue.value,
      size: form.companySize.value,
      ind: form.industry.value,
      bot: form.growthBottleneck.value.trim()
    };
    var valid = true;
    if (!v.rev) { setFieldError('monthly_revenue', 'Required'); valid = false; }
    if (!v.size) { setFieldError('company_size', 'Required'); valid = false; }
    if (!v.ind) { setFieldError('industry', 'Required'); valid = false; }
    if (v.bot.length < 20) { setFieldError('growth_bottleneck', 'Min 20 chars'); valid = false; }
    return valid;
  }

  function openModal() {
    if (!modalBackdrop) return;
    lastFocusedBeforeOpen = document.activeElement;
    modalBackdrop.classList.add('is-visible');
    modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    showModalStep('1');
    var first = document.getElementById('qualifyForm').querySelector('input');
    if (first) first.focus();
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
    setTimeout(function () { modalBackdrop.hidden = true; }, 250);
    var form = document.getElementById('qualifyForm');
    if (form) form.reset();
    if (lastFocusedBeforeOpen) lastFocusedBeforeOpen.focus();
  }

  // Global listeners for modal
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-open-qualify-modal')) { e.preventDefault(); openModal(); }
    if (e.target.closest('[data-modal-close], [data-close-after-confirm]')) closeModal();
    if (e.target === modalBackdrop) closeModal();
    
    var form = document.getElementById('qualifyForm');
    if (!form) return;
    if (e.target.closest('[data-next-step]')) {
      e.preventDefault();
      if (validateStep1()) showModalStep('2');
    }
    if (e.target.closest('[data-prev-step]')) {
      e.preventDefault();
      showModalStep('1');
    }
  });

  var qualifyForm = document.getElementById('qualifyForm');
  if (qualifyForm) {
    qualifyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep2()) return;
      var data = {
        fullName: qualifyForm.fullName.value.trim(),
        email: qualifyForm.email.value.trim(),
        phone: qualifyForm.phone.value.trim(),
        location: qualifyForm.location.value.trim(),
        monthlyRevenue: qualifyForm.monthlyRevenue.value,
        companySize: qualifyForm.companySize.value,
        industry: qualifyForm.industry.value,
        growthBottleneck: qualifyForm.growthBottleneck.value.trim()
      };
      
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function () {
        if (data.monthlyRevenue === 'Less than $10k') {
          showModalStep('confirmation');
        } else {
          window.location.href = 'https://calendly.com/archisman-bradpartners/archie-bradpartners-personal-strategy-call';
        }
      }).catch(function (err) {
        console.error('Submission error:', err);
        if (data.monthlyRevenue === 'Less than $10k') {
          showModalStep('confirmation');
        } else {
          window.location.href = 'https://calendly.com/archisman-bradpartners/archie-bradpartners-personal-strategy-call';
        }
      });
    });
  }

  // ----- Framework Scroll Logic -----
  function setupFramework() {
    var section = document.querySelector('[data-framework-section]');
    if (!section) return;

    var headline = section.querySelector('[data-framework-headline]');
    var narrative = section.querySelector('[data-framework-narrative]');
    var phases = section.querySelectorAll('[data-narrative-phase]');
    var header = document.querySelector('.header');
    var stickyCta = document.querySelector('.sticky-cta');

    function update() {
      var rect = section.getBoundingClientRect();
      var sectionHeight = section.offsetHeight;
      var viewportHeight = window.innerHeight;
      
      // Calculate scroll progress through the section
      // Progress 0 at start, 1 at end
      var progress = -rect.top / (sectionHeight - viewportHeight);
      progress = Math.max(0, Math.min(1, progress));

      // 1. Headline opacity - fade out early
      if (headline) {
        var headlineOpacity = 1 - (progress * 5); // Fades out by 20% scroll
        headline.style.opacity = Math.max(0, headlineOpacity);
        headline.style.visibility = headlineOpacity <= 0 ? 'hidden' : 'visible';
      }

      // 2. Narrative phases visibility
      var phaseCount = phases.length;
      var activePhase = Math.floor(progress * phaseCount);
      activePhase = Math.min(activePhase, phaseCount - 1);

      phases.forEach(function(phase, idx) {
        var isCurrent = idx === activePhase;
        // Optimization: only update if hidden state changes
        if (phase.hidden === isCurrent) {
          phase.hidden = !isCurrent;
        }
        if (isCurrent) {
          phase.style.opacity = 1;
          phase.style.transform = 'translate3d(0, 0, 0)';
        }
      });

      // 3. UI transformations based on phase
      // Removed navbar changes to keep it uniform throughout the page
      if (stickyCta) {
        stickyCta.classList.toggle('is-framework-active', progress > 0.05 && progress < 0.95);
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }
  setupFramework();

  // ----- UI/UX Extras -----
  // Navbar scroll
  var header = document.querySelector('.header');
  window.addEventListener('scroll', function() {
    if (header) header.classList.toggle('navbar-scrolled', window.scrollY > 70);
  }, { passive: true });

  // Mobile toggle
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !open);
      navLinks.classList.toggle('is-open');
    });
  }

  // Reveal observer
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el) { revealObserver.observe(el); });

  // ----- Sticky Micro-CTA -----
  var stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
    stickyCta.classList.add('is-visible');
  }

})();
