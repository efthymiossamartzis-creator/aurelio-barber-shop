/* =====================================================================
   FADE — vanilla JavaScript. No jQuery, no plugins.
   One function per feature, guard clauses, IntersectionObserver,
   honours prefers-reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------ Mobile nav */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close after tapping a link
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 992) close();
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992) close();
    });
  }

  /* ------------------------------------------- Sticky / auto-hide navbar */
  function initNavbarScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var last = 0;
    function onScroll() {
      var y = window.pageYOffset;
      header.classList.toggle("is-solid", y > 40);
      // auto-hide only past the hero and when menu is closed
      var menuOpen = document.querySelector(".nav-menu.is-open");
      if (!menuOpen && y > 400) {
        header.classList.toggle("is-hidden", y > last);
      } else {
        header.classList.remove("is-hidden");
      }
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------- Scroll-spy active link */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-list a[href^='#']"));
    if (!links.length) return;
    var map = links.map(function (l) {
      var id = l.getAttribute("href").slice(1);
      return { link: l, section: document.getElementById(id) };
    }).filter(function (m) { return m.section; });
    if (!map.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          map.forEach(function (m) { m.link.classList.remove("is-active"); });
          var active = map.filter(function (m) { return m.section === entry.target; })[0];
          if (active) active.link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach(function (m) { obs.observe(m.section); });
  }

  /* ------------------------------------------------- Reveal on scroll */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          o.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------------------------------------------- Count-up stats */
  function initCountUp() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(function (n) { n.textContent = format(n, +n.getAttribute("data-count")); });
      return;
    }
    function format(el, val) {
      var suffix = el.getAttribute("data-suffix") || "";
      return val.toLocaleString() + suffix;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = +el.getAttribute("data-count");
        var dur = 1400, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = format(el, Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = format(el, target);
        }
        requestAnimationFrame(step);
        o.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  /* ----------------------------------------------- Gallery filtering */
  function initGalleryFilter() {
    var bar = document.querySelector(".gallery-filter");
    var items = document.querySelectorAll(".gallery-item");
    if (!bar || !items.length) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      bar.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      var f = btn.getAttribute("data-filter");
      items.forEach(function (item) {
        var show = f === "all" || item.getAttribute("data-cat") === f;
        item.classList.toggle("is-hidden", !show);
      });
    });
  }

  /* -------------------------------------------------------- Lightbox */
  function initLightbox() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var box = document.getElementById("lightbox");
    if (!triggers.length || !box) return;
    var imgEl = box.querySelector(".lightbox__img");
    var capEl = box.querySelector(".lightbox__cap");
    var current = 0;
    var lastFocus = null;

    function visibleTriggers() {
      return triggers.filter(function (t) { return !t.classList.contains("is-hidden"); });
    }
    function show(idx) {
      var list = visibleTriggers();
      if (!list.length) return;
      current = (idx + list.length) % list.length;
      var t = list[current];
      var img = t.querySelector("img");
      imgEl.src = t.getAttribute("data-full") || img.src;
      imgEl.alt = img.alt;
      capEl.textContent = t.getAttribute("data-caption") || img.alt;
    }
    function open(t) {
      lastFocus = document.activeElement;
      var list = visibleTriggers();
      show(list.indexOf(t));
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      box.querySelector(".lightbox__close").focus();
    }
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t) {
      t.addEventListener("click", function () { open(t); });
    });
    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.querySelector(".lightbox__next").addEventListener("click", function () { show(current + 1); });
    box.querySelector(".lightbox__prev").addEventListener("click", function () { show(current - 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "ArrowLeft") show(current - 1);
    });
  }

  /* ---------------------------------------------------- Booking form */
  function initBookingForm() {
    var form = document.getElementById("booking-form");
    if (!form) return;
    var success = form.querySelector(".form-success");

    function setError(field, on) {
      field.classList.toggle("has-error", on);
    }
    function validate() {
      var ok = true;
      form.querySelectorAll("[data-required]").forEach(function (input) {
        var field = input.closest(".form-field");
        var val = (input.value || "").trim();
        var valid = !!val;
        if (input.type === "email") {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }
        if (input.type === "tel") {
          valid = val.replace(/[^0-9]/g, "").length >= 7;
        }
        if (!valid) ok = false;
        if (field) setError(field, !valid);
      });
      return ok;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (validate()) {
        if (success) {
          var name = (form.querySelector("#bk-name") || {}).value || "";
          var firstName = name.trim().split(" ")[0] || "αγαπητέ πελάτη";
          success.textContent = "Ευχαριστούμε, " + firstName +
            "! Το δοκιμαστικό αίτημα καταχωρήθηκε (Demo Concept). Δεν έχει αποσταλεί πραγματική κράτηση.";
          success.classList.add("is-visible");
        }
        form.reset();
        var firstErr = form.querySelector(".has-error");
        if (firstErr) firstErr.classList.remove("has-error");
      } else {
        var f = form.querySelector(".has-error .form-control-fade");
        if (f) f.focus();
      }
    });
    // Clear error as user fixes it
    form.querySelectorAll("[data-required]").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".form-field");
        if (field && field.classList.contains("has-error") && (input.value || "").trim()) {
          field.classList.remove("has-error");
        }
      });
    });
    // Sensible min date = today
    var dateInput = form.querySelector("input[type=date]");
    if (dateInput) {
      var t = new Date();
      dateInput.min = t.toISOString().split("T")[0];
    }
  }

  /* ---------------------------------------------------- Product bag */
  function initBag() {
    var buttons = document.querySelectorAll("[data-add-bag]");
    var countEl = document.querySelector(".bag-count");
    var toast = document.getElementById("bag-toast");
    if (!buttons.length) return;
    var count = 0, hideTimer;
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        count++;
        if (countEl) {
          countEl.textContent = count;
          countEl.classList.add("is-visible");
        }
        if (toast) {
          toast.textContent = "Demo: " + btn.getAttribute("data-add-bag") + " (δοκιμαστική προσθήκη — χωρίς πραγματική αγορά)";
          toast.classList.add("is-visible");
          clearTimeout(hideTimer);
          hideTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
        }
      });
    });
  }

  /* --------------------------------------------- Testimonials slider */
  function initTestimonials() {
    var track = document.querySelector(".testi-track");
    var prev = document.querySelector(".testi-prev");
    var next = document.querySelector(".testi-next");
    if (!track || !prev || !next) return;
    function step() {
      var card = track.querySelector(".testi-card");
      return card ? card.getBoundingClientRect().width + 24 : 320;
    }
    next.addEventListener("click", function () {
      track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    prev.addEventListener("click", function () {
      track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ----------------------------------------------------- Current year */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* --------------------------------------------------------- Booking link
     Prefill the booking form's barber select when a "book with" link
     is clicked from the barbers row. */
  function initBarberPrefill() {
    var select = document.getElementById("bk-barber");
    if (!select) return;
    document.querySelectorAll("[data-book-barber]").forEach(function (link) {
      link.addEventListener("click", function () {
        var name = link.getAttribute("data-book-barber");
        Array.prototype.slice.call(select.options).forEach(function (opt) {
          if (opt.value === name) select.value = name;
        });
      });
    });
  }

  /* ----------------------------------------------------------- Init */
  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initNavbarScroll();
    initScrollSpy();
    initReveal();
    initCountUp();
    initGalleryFilter();
    initLightbox();
    initBookingForm();
    initBag();
    initTestimonials();
    initBarberPrefill();
    initYear();
  });
})();
