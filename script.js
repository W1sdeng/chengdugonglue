let modalImages = [];
  let modalIndex = 0;
  let isZoomed = false;
  let modalScale = 1;
  let pinchInitialDist = 0;
  var _touchMoved = false;
  document.addEventListener('touchstart', function() { _touchMoved = false; }, { passive: true });
  document.addEventListener('touchmove', function() { _touchMoved = true; }, { passive: true });

  function openModal(images, index) {
    modalImages = images;
    modalIndex = index;
    isZoomed = false;
    modalScale = 1;
    updateModal();
    document.getElementById('imageModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
    document.getElementById('imageModal').classList.remove('zoomed');
    document.getElementById('modalImage').classList.remove('zoomed');
    document.getElementById('modalImage').style.transform = '';
    document.body.style.overflow = '';
  }

  // Click modal backdrop to close
  document.addEventListener('click', function(e) {
    const modal = document.getElementById('imageModal');
    if (e.target === modal) closeModal();
  });

  // Modal image click to toggle zoom
  document.getElementById('modalImage').addEventListener('click', function(e) {
    e.stopPropagation();
    isZoomed = !isZoomed;
    this.classList.toggle('zoomed');
    document.getElementById('imageModal').classList.toggle('zoomed');
    if (!isZoomed) { modalScale = 1; this.style.transform = ''; }
  });

  // Pinch-to-zoom on modal image
  document.getElementById('modalImage').addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchInitialDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: false });

  document.getElementById('modalImage').addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (pinchInitialDist > 0) {
        modalScale = Math.max(0.5, Math.min(8, modalScale * (dist / pinchInitialDist)));
        pinchInitialDist = dist;
        this.style.transform = 'scale(' + modalScale + ')';
      }
    }
  }, { passive: false });

  document.getElementById('modalImage').addEventListener('touchend', function(e) {
    if (e.touches.length < 2) pinchInitialDist = 0;
  }, { passive: true });

  // Double-tap to zoom in/out
  let lastTapTime = 0;
  document.getElementById('modalImage').addEventListener('touchend', function(e) {
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        if (modalScale > 1.5) {
          modalScale = 1;
          this.style.transform = '';
          if (isZoomed) {
            isZoomed = false;
            this.classList.remove('zoomed');
            document.getElementById('imageModal').classList.remove('zoomed');
          }
        } else {
          modalScale = 3;
          this.style.transform = 'scale(3)';
        }
        e.preventDefault();
      }
      lastTapTime = now;
    }
  }, { passive: false });

  function changeModal(dir) {
    modalIndex = (modalIndex + dir + modalImages.length) % modalImages.length;
    isZoomed = false;
    modalScale = 1;
    document.getElementById('imageModal').classList.remove('zoomed');
    document.getElementById('modalImage').classList.remove('zoomed');
    document.getElementById('modalImage').style.transform = '';
    updateModal();
  }

  function updateModal() {
    document.getElementById('modalImage').src = modalImages[modalIndex];
    document.getElementById('modalCounter').textContent = (modalIndex + 1) + '/' + modalImages.length;
  }
  function updateNavIndicator() {
    var activeLink = document.querySelector('.nav a.active');
    var navEl = document.querySelector('.nav');
    var indicator = document.querySelector('.nav-indicator');
    if (!activeLink || !indicator) return;
    var navRect = navEl.getBoundingClientRect();
    var linkRect = activeLink.getBoundingClientRect();
    indicator.style.left = (linkRect.left - navRect.left + navEl.scrollLeft) + 'px';
    indicator.style.width = linkRect.width + 'px';
  }

  var scrollPositions = {};

  function showPage(name) {
    var prev = document.querySelector('.page.active');
    if (prev) scrollPositions[prev.id.replace('page-', '')] = window.scrollY;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
    const navLinks = document.querySelectorAll('.nav a');
    const idx = ['home','day1','day2','day3','day4','day5','budget'].indexOf(name);
    if (idx >= 0 && navLinks[idx]) { navLinks[idx].classList.add('active'); navLinks[idx].scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' }); }
    updateNavIndicator();
    if (scrollPositions[name] && scrollPositions[name] > 0) {
      requestAnimationFrame(function() { window.scrollTo({ top: scrollPositions[name] }); });
    } else {
      window.scrollTo({ top: 0 });
    }
    setTimeout(function() {
      var page = document.getElementById('page-' + name);
      if (page) initSliders();
    }, 100);
  }

  // 鈹€鈹€鈹€ Image Slider 鈹€鈹€鈹€
  function initSliders() {
    document.querySelectorAll('.image-slider').forEach(slider => {
      if (slider.dataset.inited) return;
      const track = slider.querySelector('.slider-track');
      const dots = slider.querySelectorAll('.dot');
      const slides = track.querySelectorAll('.slider-slide');
      const images = track.querySelectorAll('img');
      const intervalTime = parseInt(slider.dataset.interval) || 4000;

      slides.forEach(function(slide, si) {
        var img = slide.querySelector('img');
        if (!img) return;
        if (si === 0) {
          loadSlideImage(slide, img);
        } else {
          img.dataset.src = img.src;
          img.removeAttribute('src');
        }
      });

      function loadSlideImage(slide, img) {
        var src = img.dataset.src || img.src;
        if (!src) return;
        if (img.complete && img.getAttribute('src')) {
          img.setAttribute('data-loaded', '');
          return;
        }
        slide.classList.add('loading');
        img.onload = function() {
          img.setAttribute('data-loaded', '');
          slide.classList.remove('loading');
          img.onload = null;
        };
        img.onerror = function() { img.onerror = null; slide.classList.remove('loading'); };
        img.src = src;
        img.removeAttribute('data-src');
      }

      let currentIndex = 0;
      let autoPlayInterval;
      let isTouching = false;

      function preloadAdjacent(idx) {
        [idx - 1, idx + 1].forEach(i => {
          const img = images[(i + images.length) % images.length];
          if (img && !img.complete && !img.dataset.preloading) {
            img.dataset.preloading = '1';
            const link = document.createElement('link');
            link.rel = 'preload'; link.as = 'image'; link.href = img.src;
            document.head.appendChild(link);
          }
        });
      }

      function loadAt(idx) {
        var slide = slides[idx];
        if (!slide) return;
        var img = slide.querySelector('img');
        if (img && img.dataset.src) loadSlideImage(slide, img);
      }

      function updateSlider(index) {
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        currentIndex = index;
        loadAt(index);
        loadAt(index - 1);
        loadAt(index + 1);
        preloadAdjacent(index);
      }

      function startAutoPlay() {
        stopAutoPlay();
        if (images.length <= 1) return;
        autoPlayInterval = setInterval(() => {
          if (!isTouching) {
            updateSlider((currentIndex + 1) % images.length);
          }
        }, intervalTime);
      }

      function stopAutoPlay() {
        clearInterval(autoPlayInterval);
      }

      let touchStartX = 0, touchStartY = 0;
      slider.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isTouching = true;
        stopAutoPlay();
      }, { passive: true });

      slider.addEventListener('touchend', e => {
        const diffX = touchStartX - e.changedTouches[0].screenX;
        const diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);
        if (Math.abs(diffX) > 40 && diffY < Math.abs(diffX) * 0.8) {
          if (diffX > 0 && currentIndex < images.length - 1) updateSlider(currentIndex + 1);
          else if (diffX < 0 && currentIndex > 0) updateSlider(currentIndex - 1);
        }
        isTouching = false;
        setTimeout(() => startAutoPlay(), 2000);
      }, { passive: true });

      dots.forEach((dot, index) => {
        dot.addEventListener('click', e => {
          e.stopPropagation();
          updateSlider(index);
          stopAutoPlay();
          startAutoPlay();
        });
      });

      // Only autoplay when slider is visible in viewport
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            updateSlider(0);
            if (images.length > 1) startAutoPlay();
          } else {
            stopAutoPlay();
            updateSlider(0);
          }
        });
      }, { threshold: 0.3 });
      obs.observe(slider);
      slider.dataset.observer = obs;

      // Desktop prev/next arrows (not on touch devices)
      if (images.length > 1 && !slider.querySelector('.slider-btn') && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn slider-prev';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.setAttribute('aria-label', '上一张');
        prevBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          updateSlider((currentIndex - 1 + images.length) % images.length);
          stopAutoPlay(); startAutoPlay();
        });
        slider.appendChild(prevBtn);
        var nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn slider-next';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.setAttribute('aria-label', '下一张');
        nextBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          updateSlider((currentIndex + 1) % images.length);
          stopAutoPlay(); startAutoPlay();
        });
        slider.appendChild(nextBtn);
      }

      slider.dataset.inited = '1';
    });
  }

  // 鈹€鈹€鈹€ Slider clicks 鈫?modal 鈹€鈹€鈹€
  function wireSliderClicks() {
    document.querySelectorAll('.slider-track').forEach(track => {
      const slides = track.querySelectorAll('.slider-slide');
      const images = track.querySelectorAll('img');
      slides.forEach((slide, idx) => {
        slide.addEventListener('click', function(e) {
          if (_touchMoved) { _touchMoved = false; return; }
          openModal(Array.from(images).map(img => img.getAttribute('src') || img.dataset.src || ''), idx);
        });
      });
    });
  }

  // 鈹€鈹€鈹€ Click to toggle done 鈹€鈹€鈹€
  function initDoneToggle() {
    document.addEventListener('click', function(e) {
      if (_touchMoved) { _touchMoved = false; return; }
      const item = e.target.closest('.tl-item:not(.tl-no-click)');
      if (!item) return;
      if (e.target.closest('.image-slider, .modal, a, .slider-dots, .dc-title')) return;
      item.classList.toggle('done');
      const key = item.dataset.key;
      if (key) {
        localStorage.setItem(key, item.classList.contains('done') ? '1' : '0');
      }
    });
  }

  // 鈹€鈹€鈹€ Collapsible Cards 鈹€鈹€鈹€
  function toggleCollapsible(el, event) {
    if (_touchMoved) { _touchMoved = false; return; }
    if (event) {
      if (event.target.closest('.image-slider, .slider-dots, .slider-track')) return;
    }
    var card = el.closest('.day-card.collapsible');
    if (!card) return;
    card.classList.toggle('collapsed');
    const key = card.getAttribute('data-key');
    if (key) localStorage.setItem(key, card.classList.contains('collapsed') ? '1' : '0');
  }

  // 鈹€鈹€鈹€ Restore state from localStorage 鈹€鈹€鈹€
  function restoreDayState(dayId) {
    document.querySelectorAll(`#page-${dayId} .tl-item[data-key]`).forEach(item => {
      if (localStorage.getItem(item.dataset.key) === '1') {
        item.classList.add('done');
      }
    });
    document.querySelectorAll(`#page-${dayId} .day-card.collapsible`).forEach(card => {
      const key = card.getAttribute('data-key');
      if (key && localStorage.getItem(key) === '1') card.classList.add('collapsed');
    });
  }

  // 鈹€鈹€鈹€ 
  // Clean up stale localStorage keys
  function cleanLocalStorage() {
    var validKeys = new Set();
    document.querySelectorAll('[data-key]').forEach(function(el) { validKeys.add(el.dataset.key); });
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (/^d[1-5]_/.test(key) && !validKeys.has(key)) {
        localStorage.removeItem(key);
      }
    }
  }

// Page swipe on mobile 鈹€鈹€鈹€
  function initPageSwipe() {
    let touchStartX = 0, touchStartY = 0;
    const pages = ['home','day1','day2','day3','day4','day5','budget'];
    document.addEventListener('touchstart', e => {
      if (e.target.closest('.image-slider, .modal, .slider-dots, .slider-track')) { touchStartX = 0; return; }
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (touchStartX === 0) return;
      const diffX = touchStartX - e.changedTouches[0].screenX;
      const diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);
      const activeIdx = Array.from(document.querySelectorAll('.nav a')).findIndex(a => a.classList.contains('active'));
      if (Math.abs(diffX) > 60 && diffY < Math.abs(diffX) * 0.6) {
        if (diffX > 0 && activeIdx < pages.length - 1) showPage(pages[activeIdx + 1]);
        else if (diffX < 0 && activeIdx > 0) showPage(pages[activeIdx - 1]);
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSliders();
    wireSliderClicks();
    initDoneToggle();
    initPageSwipe();
    restoreDayState('day1');
    restoreDayState('day2');
    restoreDayState('day3');
    restoreDayState('day4');
    restoreDayState('day5');
    cleanLocalStorage();
    updateNavIndicator();

    // Nav scroll shadow + overflow fade hint
    var navEl = document.querySelector('.nav');
    function toggleNavShadow() {
      navEl.classList.toggle('nav-scrolled', window.scrollY > 0);
    }
    document.addEventListener('scroll', toggleNavShadow, { passive: true });
    toggleNavShadow();
    function checkNavOverflow() {
      navEl.classList.toggle('nav-overflow', navEl.scrollWidth > navEl.clientWidth);
    }
    checkNavOverflow();
    window.addEventListener('resize', checkNavOverflow);

    // Back to top
    var backBtn = document.getElementById('backTop');
    function toggleBackTop() {
      backBtn.classList.toggle('show', window.scrollY > window.innerHeight);
    }
    document.addEventListener('scroll', toggleBackTop, { passive: true });
    toggleBackTop();
    backBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('imageModal');
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') changeModal(-1);
      if (e.key === 'ArrowRight') changeModal(1);
    });
  });
