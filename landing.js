'use strict';

function applyCampaignTags() {
  const tags = [...new URLSearchParams(location.search)].filter(
    ([name, value]) => value && (name === 'utm' || name.startsWith('utm_')),
  );
  if (!tags.length) return;

  for (const link of document.querySelectorAll('[data-store-link]')) {
    const url = new URL(link.href);
    for (const [name, value] of tags) {
      url.searchParams.append(name, value);
    }

    if (url.hostname === 'play.google.com') {
      // Google Play reads install attribution from the nested referrer query.
      const referrer = new URLSearchParams(url.searchParams.get('referrer'));
      for (const [name, value] of tags) {
        referrer.append(name, value);
      }
      url.searchParams.set('referrer', referrer.toString());
    }

    link.href = url.href;
  }
}

function initFeatureTabs(tabList) {
  if (!tabList) return;

  const tabs = [...tabList.querySelectorAll('button[aria-controls]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  if (!tabs.length || panels.some((panel) => !panel)) return;

  function selectTab(activeIndex, interactive = false) {
    tabList.style.setProperty('--active-tab', activeIndex);

    tabs.forEach((tab, index) => {
      const selected = index === activeIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
      panels[index].classList.toggle('is-entering', selected && interactive);
    });

    if (interactive) {
      tabs[activeIndex].focus({ preventScroll: true });
    }
  }

  tabList.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => selectTab(index, true));
  });

  tabList.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;

    const destinations = {
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(destinations, event.key)) return;

    event.preventDefault();
    selectTab(destinations[event.key], true);
  });

  const initialIndex = panels.findIndex((panel) => '#' + panel.id === location.hash);
  selectTab(Math.max(0, initialIndex));
  tabList.hidden = false;
}

function initScrollReveals(motionPreference) {
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in-view');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  for (const element of document.querySelectorAll('[data-reveal]')) {
    observer.observe(element);
  }
}

function initInfographicCarousel(carousel, motionPreference) {
  if (!carousel) return;

  const track = carousel.querySelector('[data-carousel-track]');
  const pagination = carousel.querySelector('[data-carousel-pagination]');
  if (!track || !pagination) return;

  const dots = [...pagination.querySelectorAll('button')];
  if (!dots.length || dots.length !== track.children.length) return;

  const autoplayDelay = 6500;
  let visible = false;
  let pointerDown = false;
  let autoplayTimer;

  function currentSlide() {
    if (!track.clientWidth) return 0;

    const index = Math.round(track.scrollLeft / track.clientWidth);
    return Math.max(0, Math.min(dots.length - 1, index));
  }

  function syncPagination() {
    const activeIndex = currentSlide();
    dots.forEach((dot, index) => {
      if (index === activeIndex) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function showSlide(index) {
    const adjacent = Math.abs(index - currentSlide()) === 1;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: adjacent && !motionPreference.matches ? 'smooth' : 'instant',
    });
  }

  function moveSlide(direction) {
    const index = (currentSlide() + direction + dots.length) % dots.length;
    showSlide(index);
  }

  function scheduleAutoplay() {
    clearTimeout(autoplayTimer);

    if (motionPreference.matches || !visible || document.hidden || pointerDown ||
        carousel.matches(':hover, :focus-within')) {
      return;
    }

    autoplayTimer = setTimeout(() => moveSlide(1), autoplayDelay);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showSlide(index));
  });
  carousel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveSlide(event.key === 'ArrowLeft' ? -1 : 1);
  });
  track.addEventListener('scroll', () => {
    syncPagination();
    scheduleAutoplay();
  }, { passive: true });

  track.addEventListener('pointerdown', () => {
    pointerDown = true;
    scheduleAutoplay();
  });
  function endPointerInteraction() {
    if (!pointerDown) return;
    pointerDown = false;
    scheduleAutoplay();
  }

  for (const event of ['pointerup', 'pointercancel', 'blur']) {
    window.addEventListener(event, endPointerInteraction);
  }
  for (const event of ['mouseenter', 'mouseleave', 'focusin']) {
    carousel.addEventListener(event, scheduleAutoplay);
  }
  carousel.addEventListener('focusout', () => queueMicrotask(scheduleAutoplay));
  document.addEventListener('visibilitychange', scheduleAutoplay);
  motionPreference.addEventListener('change', scheduleAutoplay);

  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scheduleAutoplay();
    }, { threshold: 0.35 });
    visibility.observe(carousel);
  }

  syncPagination();
  pagination.hidden = false;
}

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
applyCampaignTags();
initFeatureTabs(document.querySelector('[data-feature-tabs]'));
initScrollReveals(motionPreference);
initInfographicCarousel(document.querySelector('[data-carousel]'), motionPreference);
