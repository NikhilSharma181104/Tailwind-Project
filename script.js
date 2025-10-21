const navDialog = document.getElementById('nav-dialog');
function handleMenu() {
    if (!navDialog) return;
    const isHidden = navDialog.classList.toggle('hidden');
    // prevent background scroll when dialog open
    document.documentElement.style.overflow = isHidden ? '' : 'hidden';
    document.body.style.overflow = isHidden ? '' : 'hidden';
}

const initialTranslateLTR = -48*4;
const initialTranslateRTL = 36*4;

// Single shared animation registry + single scroll handler (avoids many listeners)
const animatedEntries = [];

function setupIntersectionObserver(element, isLTR, speed, initialOffset = null) {
    if (!element) return;
    const entry = {
        element,
        isLTR: !!isLTR,
        speed: Number(speed) || 0.15,
        initial: (typeof initialOffset === 'number') ? initialOffset : (isLTR ? initialTranslateLTR : initialTranslateRTL),
        active: false
    };
    animatedEntries.push(entry);

    const observer = new IntersectionObserver((entries) => {
        const e = entries[0];
        entry.active = !!e.isIntersecting;
        // do a frame update when visibility changes so element snaps to correct pos
        updateFrame();
    }, { threshold: 0 });
    observer.observe(element);
}

// throttle via requestAnimationFrame
let ticking = false;
function updateFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        animatedEntries.forEach(en => {
            if (!en.active) return;
            const rect = en.element.getBoundingClientRect();
            // distance factor (element top relative to viewport height)
            const translateX = (window.innerHeight - rect.top) * en.speed;

            let totalTranslate = en.isLTR ? (translateX + en.initial) : -(translateX + en.initial);

            // clamp to avoid pushing content far off-screen on small viewports
            const elementHalf = rect.width / 2 || 150;
            const maxTranslate = Math.max(window.innerWidth * 0.5, elementHalf + 200);
            const minTranslate = -maxTranslate;
            totalTranslate = Math.max(minTranslate, Math.min(maxTranslate, totalTranslate));

            en.element.style.transform = `translateX(${Math.round(totalTranslate)}px)`;
        });
        ticking = false;
    });
}

// keep single scroll listener
window.addEventListener('scroll', updateFrame, { passive: true });
window.addEventListener('resize', updateFrame, { passive: true });
document.addEventListener('DOMContentLoaded', updateFrame);

// register lines (guard if missing)
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const line3 = document.getElementById('line3');
const line4 = document.getElementById('line4');

setupIntersectionObserver(line1, true, 0.15);
setupIntersectionObserver(line2, false, 0.15);
setupIntersectionObserver(line3, true, 0.15);
setupIntersectionObserver(line4, true, 0.8);

// FAQ toggle logic (keeps aria-expanded + keyboard support)
const dtElements = document.querySelectorAll('dt');
dtElements.forEach(element => {
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-expanded', 'false');

    element.addEventListener('click', () => {
        const ddId = element.getAttribute('aria-controls');
        const ddElement = document.getElementById(ddId);
        const ddArrowIcon = element.querySelector('i');

        if (!ddElement) return;
        const isNowHidden = ddElement.classList.toggle('hidden');
        if (ddArrowIcon) ddArrowIcon.classList.toggle('-rotate-180');

        element.setAttribute('aria-expanded', String(!isNowHidden));
    });

    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
        }
    });
});