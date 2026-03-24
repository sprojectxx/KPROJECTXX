/* ============================================================
   main.js — Navigation, scroll animations, API integrations
   ============================================================ */

const API_URL = '/api'; // Using relative path allows it to work on any host

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ────────────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  /* ── Mobile hamburger ────────────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }

  /* ── Active nav link ─────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Reusable Animation Observe ──────────────────────── */
  function observeFadeIns() {
    const fadels = document.querySelectorAll('.fade-in:not(.visible)');
    if (fadels.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      fadels.forEach(el => observer.observe(el));
    }
  }
  observeFadeIns(); // Initial run

  /* ── Counter animation ───────────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    let start = null;
    const step = (now) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll('[data-target]');
  if (counters.length > 0) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObs.observe(c));
  }

  /* ── Projects filter (Client Side) ───────────────────── */
  function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card[data-category]');
    if (filterBtns.length > 0) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.filter.toLowerCase();
          projectCards.forEach(card => {
            const cat = card.dataset.category.toLowerCase();
            if (filter === 'all' || cat === filter) {
              card.style.display = '';
              card.style.animation = 'fadeInUp 0.4s ease both';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    }
  }

  /* ── Contact form validation & API ───────────────────── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const fields = contactForm.querySelectorAll('[data-required]');
      fields.forEach(field => {
        const err = field.parentElement.querySelector('.form-error');
        if (!field.value.trim()) {
          field.classList.add('error');
          if (err) err.classList.add('show');
          valid = false;
        } else {
          field.classList.remove('error');
          if (err) err.classList.remove('show');
        }
      });

      const emailInput = contactForm.querySelector('[type="email"]');
      if (emailInput && emailInput.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailErr = emailInput.parentElement.querySelector('.form-error');
        if (!emailRegex.test(emailInput.value)) {
          emailInput.classList.add('error');
          if (emailErr) { emailErr.textContent = 'Please enter a valid email address.'; emailErr.classList.add('show'); }
          valid = false;
        }
      }

      if (valid) {
        // Collect data
        const payload = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
        };
        
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const ogText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showFormSuccess();
            } else {
                alert('Something went wrong. Please try again.');
                submitBtn.innerHTML = ogText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error('Contact error:', err);
            alert('Could not connect to server.');
            submitBtn.innerHTML = ogText;
            submitBtn.disabled = false;
        }
      }
    });

    contactForm.querySelectorAll('.form-input, .form-textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('error');
        const err = field.parentElement.querySelector('.form-error');
        if (err) err.classList.remove('show');
      });
    });
  }

  function showFormSuccess() {
    const form = document.getElementById('contact-form');
    const wrap = form ? form.closest('.contact-form-wrap') : null;
    if (!wrap) return;
    wrap.innerHTML = `
      <div style="text-align:center;padding:64px 24px;">
        <div style="font-size:3rem;margin-bottom:20px;">✨</div>
        <h3 style="font-family:var(--font-head);font-size:1.5rem;color:var(--gold);margin-bottom:12px;">Message Sent!</h3>
        <p style="color:var(--muted);font-size:0.95rem;">We'll get back to you as soon as possible. Thanks for reaching out!</p>
      </div>`;
  }

  /* ── Smooth link scroll for same-page anchors ─────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ==========================================================
     API DATA FETCHING
     ========================================================== */

  // Team Page
  if (document.getElementById('leads-grid') || document.getElementById('core-grid')) {
      fetch(`${API_URL}/members`)
        .then(res => res.json())
        .then(members => {
            const leadsGrid = document.getElementById('leads-grid');
            const coreGrid = document.getElementById('core-grid');
            if(leadsGrid) leadsGrid.innerHTML = '';
            if(coreGrid) coreGrid.innerHTML = '';

            members.forEach((m, idx) => {
                const initial = m.name ? m.name.charAt(0).toUpperCase() : '?';
                const skillsHtml = m.skills ? m.skills.split(',').map(s => `<span class="tag">${s.trim()}</span>`).join('') : '';
                const githubHtml = m.github ? `<a href="${m.github}" target="_blank" class="btn-icon"><i class="fa-brands fa-github"></i></a>` : '';
                const linkedinHtml = m.linkedin ? `<a href="${m.linkedin}" target="_blank" class="btn-icon"><i class="fa-brands fa-linkedin"></i></a>` : '';

                const isLead = m.type === 'lead';
                const delay = idx % 4; // simple delay cascade
                
                const avatarContent = m.image_url ? 
                    `<img src="${m.image_url}" alt="${m.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : 
                    initial;
                
                const card = `
                <div class="team-card ${isLead ? 'featured' : ''} fade-in fade-in-delay-${delay}">
                    ${isLead ? `<div class="rank-badge">⭐ ${m.role}</div>` : ''}
                    <div class="team-avatar">${avatarContent}</div>
                    <div class="team-name">${m.name}</div>
                    <div class="team-role">${m.role}</div>
                    <div class="team-skills">${skillsHtml}</div>
                    <div class="team-socials">${linkedinHtml}${githubHtml}</div>
                </div>`;

                if (isLead && leadsGrid) {
                    leadsGrid.innerHTML += card;
                } else if (!isLead && coreGrid) {
                    coreGrid.innerHTML += card;
                }
            });
            observeFadeIns(); // Re-trigger scroll animations for new elements
        })
        .catch(err => console.error('Error fetching members:', err));
  }

  // Projects Page & Homepage Featured
  if (document.getElementById('projects-grid') || document.getElementById('home-projects-grid')) {
      fetch(`${API_URL}/projects`)
        .then(res => res.json())
        .then(projects => {
            const grid = document.getElementById('projects-grid');
            const homeGrid = document.getElementById('home-projects-grid');
            if (grid) grid.innerHTML = '';
            if (homeGrid) homeGrid.innerHTML = '';

            projects.forEach((p, idx) => {
                const delay = idx % 3;
                const techHtml = p.techstack ? p.techstack.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('') : '';
                const linkHtml = p.link ? `<a href="${p.link}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Visit</a>` : '';

                const icons = ['💻', '📱', '🔍', '⚙️', '📈', '🚀', '🧪'];
                const icon = icons[Math.floor(Math.random() * icons.length)];
                
                const visualContent = p.image_url ? 
                    `<img src="${p.image_url}" alt="${p.title}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0;">
                     <div class="project-category" style="position:relative; z-index:1; background:rgba(0,0,0,0.6);">${p.category}</div>` :
                    `<span>${icon}</span><div class="project-category">${p.category}</div>`;

                const cardHtml = `
                <div class="project-card fade-in fade-in-delay-${delay}" data-category="${p.category}">
                  <div class="project-img-placeholder" style="position:relative; overflow:hidden;">
                    ${visualContent}
                  </div>
                  <div class="project-body">
                    <h3 class="project-title">${p.title}</h3>
                    <p class="project-desc">${p.tag}</p>
                    <div class="project-tech">${techHtml}</div>
                    <div class="project-actions" style="margin-top:20px;">${linkHtml}</div>
                  </div>
                </div>`;
                
                if (grid) grid.innerHTML += cardHtml;
                if (homeGrid && idx < 3) homeGrid.innerHTML += cardHtml;
            });
            initProjectFilters(); 
            observeFadeIns();
        })
        .catch(err => console.error('Error fetching projects:', err));
  }

  // Achievements Page
  if (document.getElementById('hall-of-fame-grid')) {
      fetch(`${API_URL}/achievements`)
        .then(res => res.json())
        .then(ach => {
            const hofGrid = document.getElementById('hall-of-fame-grid');
            const timeline = document.getElementById('timeline-list');
            const certGrid = document.getElementById('certs-grid');
            
            hofGrid.innerHTML = '';
            timeline.innerHTML = '';
            certGrid.innerHTML = '';

            ach.forEach((a, idx) => {
                const delay = idx % 3;
                
                if (a.type === 'hall_of_fame') {
                    const visual = a.image_url ? 
                        `<img src="${a.image_url}" alt="award" style="width:60px; height:60px; object-fit:cover; border-radius:12px; margin-right:20px;">` :
                        `<div class="achievement-icon">🏆</div>`;
                        
                    hofGrid.innerHTML += `
                    <div class="achievement-card fade-in fade-in-delay-${delay}" style="display:flex; align-items:flex-start;">
                      ${visual}
                      <div class="achievement-content">
                        <h3>${a.title}</h3>
                        <p>${a.description}</p>
                        <div class="achievement-meta">🗓 ${a.date}</div>
                      </div>
                    </div>`;
                } 
                else if (a.type === 'timeline') {
                    const visual = a.image_url ? `<img src="${a.image_url}" alt="timeline" style="width:100%; border-radius:8px; margin-bottom:12px; object-fit:cover;">` : '';
                    timeline.innerHTML += `
                    <div class="timeline-item">
                      <div class="timeline-year">${a.date}</div>
                      ${visual}
                      <div class="timeline-title">${a.title}</div>
                      <div class="timeline-desc">${a.description}</div>
                    </div>`;
                }
                else if (a.type === 'certificate') {
                    const visual = a.image_url ? 
                        `<img src="${a.image_url}" alt="certificate" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" class="cert-icon">` :
                        `<div class="cert-icon">📜</div>`;
                        
                    certGrid.innerHTML += `
                    <div class="cert-card fade-in fade-in-delay-${delay}">
                        ${visual}
                        <div>
                            <div class="cert-title">${a.title}</div>
                            <div class="cert-sub">${a.description}</div>
                            <div class="cert-year">${a.date}</div>
                        </div>
                    </div>`;
                }
            });
            observeFadeIns();
        })
        .catch(err => console.error('Error fetching achievements:', err));
  }
});
