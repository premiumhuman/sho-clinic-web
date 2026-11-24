const menu = document.querySelector('.mobile-menu');
const menuButton = menu.querySelector('summary');
const accessLink = menu.querySelector('.header-panel-access');

menu.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menuButton.focus();
  }
});

accessLink.addEventListener('click', () => {
  menu.open = false;
  if (accessLink.getAttribute('href') === '#access') {
    document.querySelector('main').inert = false;
    document.querySelector('#access').focus({ preventScroll: true });
  }
});

window.addEventListener('pagehide', () => {
  menu.open = false;
});

document.addEventListener('pointerdown', (event) => {
  if (menu.open && !menu.contains(event.target)) {
    menu.open = false;
  }
});

const desktopLayout = document.body.classList.contains('home') ? '(min-width: 55rem)' : '(min-width: 64.01rem)';
window.matchMedia(desktopLayout).addEventListener('change', (event) => {
  if (event.matches) menu.open = false;
});

const menuBackground = document.querySelectorAll('.header-inner, .header-contact, .detail-bar, main, footer');
menu.addEventListener('toggle', () => {
  for (const element of menuBackground) element.inert = menu.open;
});
menu.addEventListener('keydown', (event) => {
  if (!menu.open || event.key !== 'Tab') return;
  if (event.shiftKey && document.activeElement === menuButton) {
    event.preventDefault();
    accessLink.focus();
  } else if (!event.shiftKey && document.activeElement === accessLink) {
    event.preventDefault();
    menuButton.focus();
  }
});

const slideshow = document.querySelector('.hero-photos');
if (slideshow) {
  const slides = [...slideshow.querySelectorAll('.hero-slide')];
  const controls = document.querySelector('.hero-controls');
  const dots = [...controls.querySelectorAll('.hero-dot')];
  const playback = controls.querySelector('.hero-playback');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const slideInterval = 5600;
  const fadeDuration = 760;
  let active = 0;
  let requested = 0;
  let autoplay = true;
  let timer;
  let switching = false;
  let fade;

  async function showSlide(index) {
    requested = index;
    if (switching || index === active) return;

    switching = true;
    const incoming = slides[index];
    const decoded = await incoming.decode().then(() => true, () => false);
    if (decoded && requested === index) {
      const outgoing = slides[active];
      outgoing.classList.replace('is-current', 'is-outgoing');
      incoming.classList.add('is-current');
      dots[active].setAttribute('aria-pressed', 'false');
      dots[index].setAttribute('aria-pressed', 'true');
      active = index;

      if (!reducedMotion.matches) {
        // Keep the outgoing image opaque so the background never shows through the fade.
        fade = incoming.animate({ opacity: [0, 1] }, { duration: fadeDuration, easing: 'ease-in-out' });
        await fade.finished;
        fade = undefined;
      }
      outgoing.classList.remove('is-outgoing');
    }
    switching = false;
    if (requested !== index) showSlide(requested);
  }

  function syncPlayback() {
    clearTimeout(timer);
    if (reducedMotion.matches) fade?.finish();
    const playing = autoplay && !document.hidden && !reducedMotion.matches;
    if (autoplay && !playing) requested = active;
    slideshow.classList.toggle('is-playing', playing);
    if (playing) {
      timer = setTimeout(() => {
        showSlide((requested + 1) % slides.length);
        syncPlayback();
      }, slideInterval);
    }
  }

  function setAutoplay(enabled) {
    if (autoplay === enabled) return;
    autoplay = enabled;
    requested = active;
    playback.classList.toggle('is-paused', !autoplay);
    playback.setAttribute('aria-label', autoplay ? '写真の自動切り替えを一時停止' : '写真の自動切り替えを再開');
    syncPlayback();
  }

  for (const [index, dot] of dots.entries()) {
    dot.addEventListener('click', () => {
      setAutoplay(false);
      showSlide(index);
    });
  }
  controls.addEventListener('focusin', (event) => {
    if (event.target !== playback) setAutoplay(false);
  });
  playback.addEventListener('click', () => setAutoplay(!autoplay));
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  controls.hidden = false;
  syncPlayback();
}

const departmentIndex = document.querySelector('.medical-jump');
if (departmentIndex) {
  const links = [...departmentIndex.querySelectorAll('a')];
  const departments = links.map(link => document.getElementById(link.hash.slice(1)));
  let currentLink;

  function updateDepartment() {
    const marker = innerHeight * .4;
    const index = departments.findIndex(section => {
      const { top, bottom } = section.getBoundingClientRect();
      return top <= marker && bottom > marker;
    });
    const link = links[index];
    if (link === currentLink) return;
    currentLink?.removeAttribute('aria-current');
    link?.setAttribute('aria-current', 'location');
    currentLink = link;
  }

  addEventListener('scroll', updateDepartment, { passive: true });
  addEventListener('resize', updateDepartment);
  updateDepartment();
}
