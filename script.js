// Consolidated site script: wrap DOM work in DOMContentLoaded and add guards

// Provide a global close function so inline `onclick` attributes still work
window.closeCertModal = function(){
    const modal = document.getElementById('cert-modal');
    const modalImg = document.getElementById('cert-modal-img');
    if(modal) modal.classList.remove('show');
    if(modalImg) modalImg.src = '';
};

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Contact form (web3forms) ---------- */
    (function initContactForm(){
        const form = document.getElementById('contactForm');
        const status = document.getElementById('contact-status');
        if(!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(status) { status.style.color = ''; status.textContent = 'Sending...'; }
            try {
                const resp = await fetch(form.action || 'https://api.web3forms.com/submit', {
                    method: (form.method || 'POST').toUpperCase(),
                    body: new FormData(form)
                });
                let json = null;
                try { json = await resp.json(); } catch(err) { json = { success: resp.ok }; }

                if(json && json.success) {
                    if(status){ status.style.color = 'green'; status.textContent = 'Message sent successfully ✔'; }
                    form.reset();
                } else {
                    if(status){ status.style.color = 'red'; status.textContent = 'Failed to send message ❌ Please try again.'; }
                }
            } catch(err) {
                if(status){ status.style.color = 'red'; status.textContent = 'Network error. Please try again.'; }
                console.error('Contact form error', err);
            }
        });
    })();

    /* ---------- Projects slider (if present) ---------- */
    (function initProjectSlider(){
        const track = document.getElementById('proj-track');
        const viewport = document.getElementById('proj-viewport');
        const prevBtn = document.getElementById('proj-prev');
        const nextBtn = document.getElementById('proj-next');
        const dotsContainer = document.getElementById('proj-dots');
        if(!track || !viewport) return;
        const slides = Array.from(track.querySelectorAll('.proj-slide'));
        if(slides.length === 0) return;

        let index = 0;
        let autoplay = true;
        const autoplayInterval = 3500;
        let autoplayTimer = null;
        const slideGap = 18;

        if(dotsContainer){
            dotsContainer.innerHTML = '';
            slides.forEach((s,i) => {
                const d = document.createElement('div');
                d.className = 'proj-dot' + (i===0 ? ' active' : '');
                d.dataset.i = i;
                d.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(d);
            });
        }

        function updateDots(){ if(!dotsContainer) return; const dots = dotsContainer.querySelectorAll('.proj-dot'); dots.forEach((d,i)=> d.classList.toggle('active', i===index)); }
        function slideWidth(){ const w = slides[0].getBoundingClientRect().width; return w + slideGap; }
        function goTo(i, smooth = true){ index = Math.max(0, Math.min(slides.length-1, i)); const shift = -index * slideWidth(); if(!smooth) track.style.transition = 'none'; else track.style.transition = 'transform 0.5s cubic-bezier(.22,.9,.2,1)'; track.style.transform = `translateX(${shift}px)`; if(!smooth) requestAnimationFrame(()=> track.style.transition = ''); updateDots(); }

        if(prevBtn) prevBtn.addEventListener('click', () => { goTo(index - 1); resetAuto(); });
        if(nextBtn) nextBtn.addEventListener('click', () => { goTo(index + 1); resetAuto(); });

        // swipe
        let startX=0, dragging=false;
        viewport.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; track.style.transition = 'none'; try{ viewport.setPointerCapture(e.pointerId); }catch(_){} });
        viewport.addEventListener('pointermove', (e) => { if(!dragging) return; const dx = e.clientX - startX; track.style.transform = `translateX(${ -index * slideWidth() + dx }px)`; });
        viewport.addEventListener('pointerup', (e) => { if(!dragging) return; dragging = false; const dx = e.clientX - startX; track.style.transition = ''; if(dx < -50) goTo(index+1); else if(dx > 50) goTo(index-1); else goTo(index); resetAuto(); });
        viewport.addEventListener('pointercancel', () => { dragging = false; goTo(index); });

        window.addEventListener('keydown', (e) => { if(e.key === 'ArrowLeft') { goTo(index-1); resetAuto(); } if(e.key === 'ArrowRight'){ goTo(index+1); resetAuto(); } });

        function startAuto(){ if(!autoplay) return; stopAuto(); autoplayTimer = setInterval(()=> goTo((index+1)%slides.length), autoplayInterval); }
        function stopAuto(){ if(autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer = null; } }
        function resetAuto(){ stopAuto(); startAuto(); }

        let resizeTimer = null; window.addEventListener('resize', ()=> { if(resizeTimer) clearTimeout(resizeTimer); resizeTimer = setTimeout(()=> goTo(index, false), 120); });

        setTimeout(()=> { goTo(0, false); startAuto(); }, 80);
    })();

    /* ---------- Certificates grid: filtering, modal, show more ---------- */
    (function initCertificates(){
        const grid = document.getElementById('cert-grid');
        const tabs = document.querySelectorAll('.cert-tab');
        const certCards = grid ? Array.from(grid.querySelectorAll('.cert-card')) : [];
        const showMoreBtn = document.getElementById('show-certificates');
        const modal = document.getElementById('cert-modal');
        const modalImg = document.getElementById('cert-modal-img');

        function openCertModal(src){ if(!modal || !modalImg) return; modalImg.src = src; modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); }

        // click on cards to open
        certCards.forEach(card => {
            card.addEventListener('click', (e)=>{ const src = card.dataset.src || (card.querySelector && card.querySelector('img') && card.querySelector('img').src); if(src) openCertModal(src); });
            // tilt effect (optional)
            card.addEventListener('mousemove', (ev)=>{ const r = card.getBoundingClientRect(); const cx = r.left + r.width/2; const cy = r.top + r.height/2; const dx = ev.clientX - cx; const dy = ev.clientY - cy; const tiltX = (dy / r.height) * -8; const tiltY = (dx / r.width) * 8; card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`; });
            card.addEventListener('mouseleave', ()=> { card.style.transform = ''; });
        });

        // modal close handlers
        if(modal){ modal.addEventListener('click', (e)=> { if(e.target === modal || e.target.classList.contains('modal-bg') || e.target.classList.contains('modal-close')) window.closeCertModal(); }); window.addEventListener('keydown', (e)=> { if(e.key === 'Escape') window.closeCertModal(); }); }

        // show more certificates (simple expand/collapse)
        if(showMoreBtn){
            let expanded = false;
            function updateView(){ certCards.forEach((c,i)=> { c.style.display = (!expanded && i > 2) ? 'none' : 'block'; }); }
            updateView();
            showMoreBtn.addEventListener('click', ()=>{ expanded = !expanded; showMoreBtn.textContent = expanded ? 'Show less certificates' : 'Show more certificates'; updateView(); });
        }

        // filter tabs
        if(tabs && tabs.length){
            tabs.forEach(t => t.addEventListener('click', ()=>{
                tabs.forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                const filter = t.dataset.filter;
                certCards.forEach(c => { c.style.display = (filter === 'all' || c.dataset.category === filter) ? 'block' : 'none'; });
            }));
        }

    })();

    /* ---------- Mobile carousel (if present) ---------- */
    (function initCarousel(){
        const track = document.getElementById('carousel-track');
        if(!track) return;
        const items = Array.from(track.querySelectorAll('.carousel-item'));
        const dotsContainer = document.getElementById('carousel-dots');
        if(items.length === 0) return;
        let index = 0;
        const total = items.length;
        if(dotsContainer){ dotsContainer.innerHTML = ''; for(let i=0;i<total;i++){ const d = document.createElement('div'); d.className = 'dot' + (i===0 ? ' active' : ''); d.dataset.i = i; d.addEventListener('click', ()=> goTo(i)); dotsContainer.appendChild(d); } }
        function updateDots(){ if(!dotsContainer) return; const dots = dotsContainer.querySelectorAll('.dot'); dots.forEach((d,ii)=> d.classList.toggle('active', ii===index)); }
        function goTo(i){ index = Math.max(0, Math.min(total-1, i)); const shift = - (items[0].getBoundingClientRect().width + 16) * index; track.style.transform = `translateX(${shift}px)`; updateDots(); }
        let startX = 0, isDown = false;
        track.addEventListener('pointerdown', (e)=>{ isDown = true; startX = e.clientX; track.style.transition = 'none'; });
        window.addEventListener('pointermove', (e)=>{ if(!isDown) return; const dx = e.clientX - startX; track.style.transform = `translateX(${ -((items[0].getBoundingClientRect().width + 16) * index) + dx }px)`; });
        window.addEventListener('pointerup', (e)=>{ if(!isDown) return; isDown = false; track.style.transition = ''; const dx = e.clientX - startX; if(dx < -40) goTo(index+1); else if(dx > 40) goTo(index-1); else goTo(index); });
        window.addEventListener('resize', ()=> goTo(index));
        setTimeout(()=> goTo(0), 100);
    })();

    /* ---------- Typing text (hero) ---------- */
    (function initTyping(){
        const phrases = ["AI Engineer |", "Web Developer |", "App Developer |", "Web Designer |"];
        const el = document.getElementById('typing');
        if(!el) return;
        let pi = 0, ci = 0, deleting = false;
        function step(){
            const current = phrases[pi];
            if(!deleting){ ci++; el.textContent = current.slice(0, ci); if(ci === current.length){ deleting = true; setTimeout(step, 700); return; } }
            else { ci--; el.textContent = current.slice(0, ci); if(ci === 0){ deleting = false; pi = (pi + 1) % phrases.length; } }
            setTimeout(step, deleting ? 60 : 110);
        }
        const cursor = document.createElement('span');
        cursor.textContent = ' ';
        cursor.style.display = 'inline-block'; cursor.style.width = '8px'; cursor.style.marginLeft = '6px'; cursor.style.background = 'var(--accent)'; cursor.style.verticalAlign = 'middle'; cursor.style.animation = 'blink 1s steps(1) infinite';
        el.appendChild(cursor);
        const style = document.createElement('style'); style.textContent = '@keyframes blink{50%{opacity:0}}'; document.head.appendChild(style);
        step();
    })();

    /* ---------- Intersection fade-in for sections ---------- */
    (function initSectionObserver(){
        const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) entry.target.style.opacity = 1; }); }, { threshold: 0.16 });
        document.querySelectorAll('section').forEach(sec => { sec.style.opacity = 0; sec.style.transition = '0.9s'; observer.observe(sec); });
    })();

    /* ---------- Stagger reveal delay for .reveal elements ---------- */
    (function staggerReveal(){
        const cards = document.querySelectorAll('.reveal'); let delay = 0; cards.forEach(card => { card.style.animationDelay = delay + 's'; delay += 0.15; });
    })();

    /* ---------- Image reveal on scroll/load ---------- */
    (function imageReveal(){
        const imgTargets = document.querySelectorAll('.img-animate');
        function revealImages(){ imgTargets.forEach(img => { const rect = img.getBoundingClientRect(); if(rect.top < window.innerHeight - 100) img.classList.add('show'); }); }
        window.addEventListener('scroll', revealImages); window.addEventListener('load', revealImages); revealImages();
    })();

    /* ---------- Show more projects button ---------- */
    (function showMoreProjects(){
        const btn = document.getElementById('show-more-projects');
        if(!btn) return;
        const hidden = Array.from(document.querySelectorAll('#project-grid .hidden-project'));
        btn.setAttribute('aria-expanded','false');
        btn.addEventListener('click', ()=>{
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            if(!expanded){ hidden.forEach((el,i) => { setTimeout(() => { el.classList.remove('hidden-project'); el.classList.remove('reveal'); void el.offsetWidth; el.classList.add('reveal'); }, i*120); }); btn.textContent = 'Show less projects'; btn.setAttribute('aria-expanded','true'); }
            else { hidden.forEach((el,i) => { setTimeout(()=> { el.classList.remove('reveal'); setTimeout(()=> el.classList.add('hidden-project'), 60); }, i*60); }); btn.textContent = 'Show more projects'; btn.setAttribute('aria-expanded','false'); const projectsSection = document.getElementById('projects'); if(projectsSection) projectsSection.scrollIntoView({behavior:'smooth', block:'start'}); }
        });
    })();

    <meta name="google-site-verification" content="ZN-sJ8Zj3f_HzLcqqydX64GoxG1rrn5y8lx5hNYP-6g" />

});

