// ==========================================
// ABAYNESH FARM & CAFE
// Premium loader, navigation, cinematic
// slideshow, scroll reveals and parallax
// ==========================================

(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;

  const header = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  const hero = document.getElementById("home");
  const heroSlidesEl = hero?.querySelector(".hero-slides");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const parallaxQuery = window.matchMedia(
    "(min-width: 900px) and (hover: hover) and (prefers-reduced-motion: no-preference)"
  );

  const mobileNavQuery = window.matchMedia("(max-width: 760px)");
  const hasObserver = "IntersectionObserver" in window;

  const onMediaChange = (query, handler) => {
    if (query.addEventListener) {
      query.addEventListener("change", handler);
    } else {
      query.addListener(handler);
    }
  };

  // ------------------------------------------
  // PREMIUM PAGE LOADER
  // ------------------------------------------

  function initializePageLoader() {
    const loader = document.getElementById("siteLoader");

    if (!loader) {
      root.classList.add("is-ready");
      return Promise.resolve();
    }

    // Always show the loader on every page load.
// No sessionStorage check is needed.
loader.classList.add("is-active");

    const firstHeroImage = heroSlidesEl?.querySelector(
      ".hero-slide.is-active img"
    );

    const prefersReducedMotion = reducedMotion.matches;

    const MINIMUM_TIME = prefersReducedMotion ? 250 : 3200;
    const MAXIMUM_TIME = prefersReducedMotion ? 500 : 6000;
    const EXIT_TIME = prefersReducedMotion ? 250 : 780;

    const startedAt = performance.now();

    let imageReady = !firstHeroImage;
    let exitStarted = false;

   root.classList.add("is-loading");
body.classList.add("is-loading");

    return new Promise((resolve) => {
      let minimumTimer = null;
      let maximumTimer = null;
      let removalTimer = null;

      function finishLoader() {
        loader.remove();

        root.classList.remove("is-loading");
        body.classList.remove("is-loading");

        resolve();
      }

      function beginExit() {
        if (exitStarted) return;

        exitStarted = true;

        clearTimeout(minimumTimer);
        clearTimeout(maximumTimer);

        // Begin the hero entrance at the same time as the reveal.
        root.classList.add("is-ready");

        loader.classList.add("is-exiting");

        removalTimer = setTimeout(finishLoader, EXIT_TIME);
      }

      function checkReady() {
        if (exitStarted || !imageReady) return;

        const elapsed = performance.now() - startedAt;

        if (elapsed >= MINIMUM_TIME) {
          beginExit();
        }
      }

      function onImageReady() {
        if (imageReady) return;

        imageReady = true;
        checkReady();
      }

      if (firstHeroImage) {
        if (firstHeroImage.complete) {
          imageReady = true;
        } else {
          firstHeroImage.addEventListener("load", onImageReady, {
            once: true
          });

          firstHeroImage.addEventListener("error", onImageReady, {
            once: true
          });
        }
      }

      // Reduced motion: quick fade, no waiting for the full animation.
      if (prefersReducedMotion) {
        minimumTimer = setTimeout(beginExit, MINIMUM_TIME);
        maximumTimer = setTimeout(beginExit, MAXIMUM_TIME);
        return;
      }

      // Normal motion: wait for both image readiness and minimum time.
      minimumTimer = setTimeout(checkReady, MINIMUM_TIME);
      maximumTimer = setTimeout(beginExit, MAXIMUM_TIME);

      checkReady();
    });
  }

  let loaderHasFinished = false;
  const loaderFinished = initializePageLoader();

  // ------------------------------------------
  // NAVIGATION
  // ------------------------------------------

  function setMenu(open) {
    if (!mainNav || !menuToggle || !header) return;

    mainNav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );
  }

  if (menuToggle && mainNav && header) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.contains("open");
      setMenu(!isOpen);
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        mainNav.classList.contains("open")
      ) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        mainNav.classList.contains("open") &&
        !header.contains(event.target)
      ) {
        setMenu(false);
      }
    });

    onMediaChange(mobileNavQuery, (event) => {
      if (!event.matches) setMenu(false);
    });
  }

  // Active navigation link

  const navLinks = [
    ...document.querySelectorAll('.main-nav a[href^="#"]')
  ];

  const linkById = new Map(
    navLinks.map((link) => [
      link.getAttribute("href").slice(1),
      link
    ])
  );

  if (hasObserver && linkById.size) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(
          (entry) => entry.isIntersecting
        );

        if (!visibleEntries.length) return;

        visibleEntries.sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio
        );

        const activeId = visibleEntries[0].target.id;
        const activeLink = linkById.get(activeId);

        if (!activeLink) return;

        navLinks.forEach((link) => {
          link.removeAttribute("aria-current");
        });

        activeLink.setAttribute("aria-current", "true");
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0, 0.1, 0.25, 0.5]
      }
    );

    linkById.forEach((_, id) => {
      const section = document.getElementById(id);

      if (section) navObserver.observe(section);
    });
  }

  // ------------------------------------------
  // HERO SLIDESHOW
  // ------------------------------------------

  if (hero && heroSlidesEl) {
    const SLIDE_MS = 6000;

    const slides = [
      ...hero.querySelectorAll(".hero-slide")
    ];

    const dots = [
      ...hero.querySelectorAll(".hero-dot")
    ];

    const counter = document.getElementById("heroCurrent");
    const pauseButton = document.getElementById("heroPause");

    let current = 0;
    let heroTimer = null;

    let heroInView = true;
    let manuallyPaused = false;
    let hoverPaused = false;
    let focusPaused = false;

    function isPaused() {
      return (
        manuallyPaused ||
        hoverPaused ||
        focusPaused ||
        reducedMotion.matches ||
        document.hidden ||
        !heroInView
      );
    }

    function updatePauseButton() {
      if (!pauseButton) return;

      pauseButton.setAttribute(
        "aria-pressed",
        String(manuallyPaused)
      );

      pauseButton.setAttribute(
        "aria-label",
        manuallyPaused ? "Play slideshow" : "Pause slideshow"
      );

      pauseButton.innerHTML = manuallyPaused
        ? '<span aria-hidden="true">▶</span>'
        : '<span aria-hidden="true">Ⅱ</span>';
    }

    function showHeroSlide(index) {
      if (!slides.length) return;

      const next = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === next);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === next);

        if (i === next) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (counter) {
        counter.textContent = String(next + 1).padStart(2, "0");
      }

      current = next;
    }

    function stopHeroTimer() {
      if (heroTimer !== null) {
        clearInterval(heroTimer);
        heroTimer = null;
      }
    }

    function startHeroTimer() {
      stopHeroTimer();

      if (slides.length < 2) return;
      if (isPaused()) return;

      // The slideshow must wait until the loader has fully disappeared.
      if (!root.classList.contains("is-ready")) return;
      if (!loaderHasFinished) return;

      heroTimer = setInterval(() => {
        showHeroSlide(current + 1);
      }, SLIDE_MS);
    }

    function refreshSlideshow() {
      updatePauseButton();

      if (isPaused()) {
        stopHeroTimer();
      } else {
        startHeroTimer();
      }
    }

    if (slides.length) {
      showHeroSlide(0);
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const slideIndex = Number(dot.dataset.slide);

        if (
          !Number.isInteger(slideIndex) ||
          slideIndex < 0 ||
          slideIndex >= slides.length
        ) {
          return;
        }

        showHeroSlide(slideIndex);
        refreshSlideshow();
      });
    });

    if (pauseButton) {
      pauseButton.addEventListener("click", () => {
        manuallyPaused = !manuallyPaused;
        refreshSlideshow();
      });
    }

    hero.addEventListener("mouseenter", () => {
      hoverPaused = true;
      refreshSlideshow();
    });

    hero.addEventListener("mouseleave", () => {
      hoverPaused = false;
      refreshSlideshow();
    });

    hero.addEventListener("focusin", () => {
      focusPaused = true;
      refreshSlideshow();
    });

    hero.addEventListener("focusout", (event) => {
      if (!hero.contains(event.relatedTarget)) {
        focusPaused = false;
        refreshSlideshow();
      }
    });

    if (hasObserver) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (!entry) return;

          heroInView = entry.isIntersecting;
          refreshSlideshow();
        },
        {
          threshold: 0
        }
      );

      heroObserver.observe(hero);
    } else {
      heroInView = true;
    }

    document.addEventListener("visibilitychange", () => {
      refreshSlideshow();
    });

    onMediaChange(reducedMotion, () => {
      refreshSlideshow();
    });

    // Start slideshow only after the loader finishes its exit.
    loaderFinished.then(() => {
      loaderHasFinished = true;
      refreshSlideshow();
    });

    updatePauseButton();
  }

  // ------------------------------------------
  // HEADER SCROLL STATE
  // ------------------------------------------

  function updateHeader() {
    if (!header) return;

    header.classList.toggle(
      "scrolled",
      window.scrollY > 40
    );
  }

  // ------------------------------------------
  // DESKTOP PARALLAX
  // ------------------------------------------

  const parallaxEls = [
    ...document.querySelectorAll("[data-parallax]")
  ];

  const parallaxVisible = new Set();

  let ticking = false;

  function updateParallax() {
    if (!parallaxQuery.matches || reducedMotion.matches) {
      return;
    }

    const vh = window.innerHeight;
    const y = window.scrollY;

    if (heroSlidesEl && y < vh * 1.2) {
      heroSlidesEl.style.transform =
        `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0)`;
    }

    parallaxVisible.forEach((el) => {
      if (!el.parentElement) return;

      const rect = el.parentElement.getBoundingClientRect();

      const progress =
        (rect.top + rect.height / 2 - vh / 2) /
        (vh + rect.height);

      const strength =
        parseFloat(el.dataset.parallax) || 0.12;

      el.style.transform =
        `translate3d(0, ${(-progress * rect.height * strength).toFixed(1)}px, 0)`;
    });
  }

  function syncParallaxMode() {
    const enabled =
      parallaxQuery.matches && !reducedMotion.matches;

    root.classList.toggle("parallax-on", enabled);

    if (enabled) {
      updateParallax();
    } else {
      if (heroSlidesEl) {
        heroSlidesEl.style.transform = "";
      }

      parallaxEls.forEach((el) => {
        el.style.transform = "";
      });
    }
  }

  function onScroll() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(() => {
      updateHeader();
      updateParallax();
      ticking = false;
    });
  }

  if (hasObserver && parallaxEls.length) {
    const parallaxObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            parallaxVisible.add(entry.target);
          } else {
            parallaxVisible.delete(entry.target);
          }
        });

        updateParallax();
      },
      {
        rootMargin: "15% 0px"
      }
    );

    parallaxEls.forEach((el) => {
      parallaxObserver.observe(el);
    });
  }

  window.addEventListener("scroll", onScroll, {
    passive: true
  });

  window.addEventListener("resize", onScroll, {
    passive: true
  });

  onMediaChange(parallaxQuery, syncParallaxMode);
  onMediaChange(reducedMotion, syncParallaxMode);

  updateHeader();
  syncParallaxMode();

  // ------------------------------------------
  // SCROLL REVEALS
  // ------------------------------------------

  const revealTargets = [
    ...document.querySelectorAll(
      ".reveal, .reveal-clip, .reveal-wipe, .stagger"
    )
  ];

  document.querySelectorAll(".stagger").forEach((group) => {
    [...group.children].forEach((child, index) => {
      child.style.setProperty("--i", index);
    });
  });

  function revealEverything() {
    root.classList.remove("reveal-ready");

    revealTargets.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  if (!hasObserver || reducedMotion.matches) {
    revealEverything();
  } else {
    const hosts = new Map();

    revealTargets.forEach((element) => {
      const host =
        element.classList.contains("reveal-wipe")
          ? element.parentElement
          : element;

      if (!host) return;

      if (!hosts.has(host)) {
        hosts.set(host, []);
      }

      hosts.get(host).push(element);
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const targets = hosts.get(entry.target) || [];

          targets.forEach((element) => {
            element.classList.add("is-visible");
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -5% 0px"
      }
    );

    hosts.forEach((_, host) => {
      revealObserver.observe(host);
    });

    root.classList.add("reveal-ready");

    setTimeout(() => {
      revealTargets.forEach((element) => {
        element.classList.add("is-visible");
      });
    }, 9000);
  }

  // ------------------------------------------
  // FOOTER YEAR
  // ------------------------------------------

  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // ------------------------------------------
// SCROLL COW
// ------------------------------------------

const cow = document.querySelector(".scroll-cow");

if (cow) {
  let lastY = window.scrollY;
  let curiousTimer = null;

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const showAfter = window.innerHeight * 0.7;

    cow.classList.toggle("is-peeking", y > showAfter);

    // The cow leans further out while the visitor scrolls down
    if (y > showAfter && y > lastY + 6) {
      cow.classList.add("is-curious");
      clearTimeout(curiousTimer);
      curiousTimer = setTimeout(() => cow.classList.remove("is-curious"), 700);
    }

    lastY = y;
  }, { passive: true });
}


})();