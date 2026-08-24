/**
 * GPS Live Tracking — Developer Guide
 * ------------------------------------------------------------------
 * Everything on the page that needs JavaScript lives here, split into
 * small, independent "init" functions. Each one bails out early if the
 * elements it needs aren't on the page, so this file works unchanged
 * even if a section is removed from index.html later.
 */

document.addEventListener("DOMContentLoaded", function () {
  initMobileNav();
  initSidebarScrollSpy();
  initSidebarFilter();
  initCopyButtons();
  initMasterTableFilter();
  initHeroLoopDiagram();
});

/* ==================================================================
   Mobile navigation (the ☰ button that slides the sidebar in/out)
   ================================================================== */
function initMobileNav() {
  var toggleBtn = document.getElementById("nav-toggle-btn");
  var sidebar = document.getElementById("sidebar");
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("nav-open");
  });

  // Tapping anywhere outside the open sidebar closes it again.
  document.addEventListener("click", function (event) {
    var isOpen = document.body.classList.contains("nav-open");
    var clickedInsideSidebar = sidebar.contains(event.target);
    var clickedToggle = event.target === toggleBtn;

    if (isOpen && !clickedInsideSidebar && !clickedToggle) {
      document.body.classList.remove("nav-open");
    }
  });
}

/* ==================================================================
   Sidebar scrollspy
   ------------------------------------------------------------------
   Two responsibilities:
     1. Clicking a link scrolls to its section AND marks that link
        active immediately (it doesn't wait for the scroll to finish).
     2. Scrolling the page updates the active link to match whichever
        section is currently under a fixed line near the top of the
        viewport — this works for both very short and very tall
        sections, unlike an IntersectionObserver "band," which can
        flicker between neighbours while a smooth scroll is still
        in flight.
   ================================================================== */
function initSidebarScrollSpy() {
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  if (!links.length) return;

  var sections = links
    .map(function (link) {
      return document.getElementById(link.getAttribute("data-target"));
    })
    .filter(Boolean);

  var ACTIVE_LINE = 120; // px from the top of the viewport
  var CLICK_SCROLL_LOCK_MS = 700; // ignore scroll updates while a click-scroll is in flight
  var suppressScrollUpdates = false;
  var lockTimer = null;

  function setActiveLink(sectionId) {
    links.forEach(function (link) {
      var isActive = link.getAttribute("data-target") === sectionId;
      link.classList.toggle("active", isActive);
    });
  }

  function currentSectionId() {
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) {
      return sections[sections.length - 1].id;
    }

    // Walk down the list and keep the last section whose top has
    // already scrolled past ACTIVE_LINE.
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= ACTIVE_LINE) {
        current = sections[i];
      } else {
        break;
      }
    }
    return current.id;
  }

  function handleScroll() {
    if (suppressScrollUpdates) return;
    setActiveLink(currentSectionId());
  }

  // Throttle scroll handling to once per animation frame.
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      handleScroll();
      ticking = false;
    });
  });

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      var targetId = link.getAttribute("data-target");
      var target = document.getElementById(targetId);
      if (!target) return;

      // Highlight the clicked link right away and ignore scroll-based
      // recalculation until the smooth scroll has had time to settle,
      // so the highlight can't flicker onto a section it just passed.
      suppressScrollUpdates = true;
      setActiveLink(targetId);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.body.classList.remove("nav-open");

      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(function () {
        suppressScrollUpdates = false;
      }, CLICK_SCROLL_LOCK_MS);
    });
  });

  handleScroll(); // correct active link on initial page load
}

/* ==================================================================
   Sidebar "Filter sections…" search box
   ================================================================== */
function initSidebarFilter() {
  var input = document.getElementById("nav-filter");
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  if (!input || !links.length) return;

  input.addEventListener("input", function () {
    var query = input.value.trim().toLowerCase();
    links.forEach(function (link) {
      var matches = link.textContent.toLowerCase().indexOf(query) > -1;
      link.classList.toggle("is-hidden", !matches);
    });
  });
}

/* ==================================================================
   "Copy" buttons on code blocks
   ================================================================== */
function initCopyButtons() {
  var COPIED_LABEL_MS = 1400;

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".copy-btn");
    if (!button) return;

    var codeEl = button.dataset.copyTarget
      ? document.getElementById(button.dataset.copyTarget)
      : button.closest(".code-block").querySelector("code");
    if (!codeEl || !navigator.clipboard) return;

    navigator.clipboard.writeText(codeEl.textContent).then(function () {
      var originalLabel = button.textContent;
      button.textContent = "Copied";
      button.classList.add("copied");
      window.setTimeout(function () {
        button.textContent = originalLabel;
        button.classList.remove("copied");
      }, COPIED_LABEL_MS);
    });
  });
}

/* ==================================================================
   §8 master table — live filter across every column
   ================================================================== */
function initMasterTableFilter() {
  var input = document.getElementById("table-filter");
  var table = document.getElementById("master-table");
  if (!input || !table) return;

  var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr:not(.no-results-row)"));
  var countEl = document.getElementById("filter-count");
  var noResultsRow = document.getElementById("no-results-row");

  function applyFilter() {
    var query = input.value.trim().toLowerCase();
    var visibleCount = 0;

    rows.forEach(function (row) {
      var matches = row.textContent.toLowerCase().indexOf(query) > -1;
      row.classList.toggle("is-hidden", !matches);
      if (matches) visibleCount++;
    });

    if (countEl) countEl.textContent = visibleCount + " / " + rows.length + " rows";
    if (noResultsRow) noResultsRow.classList.toggle("is-hidden", visibleCount !== 0);
  }

  input.addEventListener("input", applyFilter);
  applyFilter();
}

/* ==================================================================
   §0 hero diagram — the animated "API call → 10s animation →
   callback → API call again" loop
   ================================================================== */
function initHeroLoopDiagram() {
  var svg = document.getElementById("loop-svg");
  if (!svg) return;

  var reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CENTER = { x: 150, y: 150 };
  var RADIUS = 118;
  var NETWORK_ARC_DEG = 42; // angular span of the "network round-trip" arc
  var ANIMATE_ARC_DEG = 360 - NETWORK_ARC_DEG;
  var NETWORK_PHASE_MS = 900; // illustrative — request + reverse-geocode round trip
  var ANIMATE_PHASE_MS = 10000; // authentic — this.liveTrackingTimer in the real app

  var dot = document.getElementById("loop-dot");
  var phaseLabelEl = document.getElementById("phase-label");
  var phaseValueEl = document.getElementById("phase-value");
  var phaseSubEl = document.getElementById("phase-sub");
  var elapsedEl = document.getElementById("loop-elapsed");
  var cyclesEl = document.getElementById("loop-cycles");
  var captionEl = document.getElementById("loop-caption");

  function pointOnCircle(angleDeg) {
    var angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: CENTER.x + RADIUS * Math.cos(angleRad),
      y: CENTER.y + RADIUS * Math.sin(angleRad),
    };
  }

  function arcPath(fromDeg, toDeg) {
    var start = pointOnCircle(fromDeg);
    var end = pointOnCircle(toDeg);
    var largeArcFlag = toDeg - fromDeg > 180 ? 1 : 0;
    return (
      "M " +
      start.x.toFixed(2) +
      " " +
      start.y.toFixed(2) +
      " A " +
      RADIUS +
      " " +
      RADIUS +
      " 0 " +
      largeArcFlag +
      " 1 " +
      end.x.toFixed(2) +
      " " +
      end.y.toFixed(2)
    );
  }

  document.getElementById("arc-network").setAttribute("d", arcPath(0, NETWORK_ARC_DEG));
  document.getElementById("arc-animate").setAttribute("d", arcPath(NETWORK_ARC_DEG, 360));

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function placeDot(angleDeg) {
    var point = pointOnCircle(angleDeg);
    dot.setAttribute("cx", point.x.toFixed(2));
    dot.setAttribute("cy", point.y.toFixed(2));
  }

  if (reducedMotion) {
    placeDot(NETWORK_ARC_DEG + 4);
    phaseLabelEl.textContent = "PHASE · ANIMATE MARKER";
    phaseValueEl.textContent = "10.0s";
    phaseSubEl.textContent = "liveTrackingTimer (paused — reduced motion)";
    captionEl.textContent = "animation paused — reduced motion enabled";
    return;
  }

  var phase = "network";
  var phaseStartTime = performance.now();
  var runStartTime = performance.now();
  var completedCycles = 0;

  function tick(now) {
    var duration = phase === "network" ? NETWORK_PHASE_MS : ANIMATE_PHASE_MS;
    var progress = Math.min((now - phaseStartTime) / duration, 1);
    var eased = easeInOutCubic(progress);

    if (phase === "network") {
      placeDot(eased * NETWORK_ARC_DEG);
      phaseLabelEl.textContent = "PHASE · API REQUEST";
      phaseValueEl.textContent = "locating…";
      phaseSubEl.textContent = "locationInfoAgainstImeiIDs";
    } else {
      placeDot(NETWORK_ARC_DEG + eased * ANIMATE_ARC_DEG);
      var secondsRemaining = Math.max(0, ((1 - progress) * ANIMATE_PHASE_MS) / 1000);
      phaseLabelEl.textContent = "PHASE · ANIMATE MARKER";
      phaseValueEl.textContent = secondsRemaining.toFixed(1) + "s";
      phaseSubEl.textContent = "liveTrackingTimer = 10000ms";
    }

    if (progress >= 1) {
      if (phase === "network") {
        phase = "animate";
      } else {
        phase = "network";
        completedCycles++;
        cyclesEl.textContent = completedCycles;
      }
      phaseStartTime = now;
    }

    elapsedEl.textContent = Math.floor((now - runStartTime) / 1000) + "s";
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
