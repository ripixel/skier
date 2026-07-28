/* =============================================================================
   Skier docs — client behaviour (vanilla, no dependencies, deferred load)

   Progressive enhancement over the server-rendered three-column shell:
     - theme toggle (persisted; initial theme is set pre-paint in <head>)
     - copy-code buttons + filename/language chip on B2 `figure.code-block`s
     - hover heading anchors on the B1 slugged heading ids
     - on-page TOC scroll-spy
     - active sidebar item + prev/next pager + breadcrumb from the rendered nav
     - mobile off-canvas drawer

   Search behaviour is intentionally NOT wired here — the header carries the
   trigger slot; the A6 search UI owns the overlay + client index fetch.
   ============================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---- theme toggle (initial value already applied pre-paint in <head>) ---- */
  var themeBtn = document.getElementById('themeBtn');
  function syncThemeIcons() {
    if (!themeBtn) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    var sun = themeBtn.querySelector('.ic-sun');
    var moon = themeBtn.querySelector('.ic-moon');
    if (sun) sun.style.display = dark ? 'none' : '';
    if (moon) moon.style.display = dark ? '' : 'none';
  }
  syncThemeIcons();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sk-theme', next); } catch (e) { /* ignore */ }
      syncThemeIcons();
    });
  }

  /* ---- code blocks: inject filename/language chip + copy button (B2) ---- */
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

  document.querySelectorAll('figure.code-block').forEach(function (fig) {
    // Leave mermaid diagram sources alone — they're replaced with an SVG.
    if (fig.getAttribute('data-language') === 'mermaid') return;
    if (fig.querySelector('.sk-code-head')) return;

    var pre = fig.querySelector('pre');
    if (!pre) return;

    var label = fig.getAttribute('data-filename') || fig.getAttribute('data-language') || 'code';

    var head = document.createElement('div');
    head.className = 'sk-code-head';
    head.innerHTML =
      '<span class="sk-code-file"><span class="sk-lang-dot"></span>' +
      escapeHtml(label) +
      '</span><span class="spacer"></span>' +
      '<button class="sk-copy" type="button" data-copy>' + COPY_ICON + '<span>Copy</span></button>';
    fig.insertBefore(head, pre);

    var btn = head.querySelector('[data-copy]');
    btn.addEventListener('click', function () {
      var text = pre.innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
      btn.classList.add('is-copied');
      var lbl = btn.querySelector('span');
      if (lbl) lbl.textContent = 'Copied';
      setTimeout(function () {
        btn.classList.remove('is-copied');
        if (lbl) lbl.textContent = 'Copy';
      }, 1600);
    });
  });

  /* ---- hover anchors on slugged headings (B1) ---- */
  document.querySelectorAll('.sk-prose h2[id], .sk-prose h3[id], .sk-prose h4[id]').forEach(function (h) {
    if (h.querySelector('.sk-anchor')) return;
    var a = document.createElement('a');
    a.className = 'sk-anchor';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', 'Link to ' + h.textContent);
    a.textContent = '#';
    h.appendChild(a);
  });

  /* ---- active sidebar item, breadcrumb, prev/next pager ---- */
  function normalizePath(p) {
    if (!p) return '/';
    try { p = decodeURIComponent(p); } catch (e) { /* keep raw */ }
    p = p.replace(/[?#].*$/, '');           // drop query/hash
    p = p.replace(/\.html$/, '');           // clean-url form
    p = p.replace(/\/index$/, '');          // index === directory root
    p = p.replace(/\/+$/, '');              // no trailing slash
    return p === '' ? '/' : p;
  }

  var here = normalizePath(location.pathname);
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.sk-sidebar .sk-nav-list a'));
  var activeLink = null;
  navLinks.forEach(function (a) {
    if (normalizePath(a.getAttribute('href')) === here) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
      activeLink = a;
    }
  });

  // Breadcrumb: Docs › <section label> [› <subcategory>] › <page title>
  var crumbEl = document.getElementById('breadcrumb');
  if (crumbEl && activeLink) {
    var section = activeLink.closest('.sk-nav-section');
    var sectionLabel = section ? section.querySelector('.sk-nav-label') : null;
    var parts = ['<a href="/">Docs</a>'];
    if (sectionLabel) parts.push('<span>' + escapeHtml(sectionLabel.textContent.trim()) + '</span>');
    var pageTitle = crumbEl.getAttribute('data-title');
    if (pageTitle) parts.push('<span>' + escapeHtml(pageTitle) + '</span>');
    crumbEl.innerHTML = parts.join('<span class="sep">/</span>');
  }

  // Prev/next pager: neighbours in the flattened sidebar order.
  var pagerEl = document.getElementById('pager');
  if (pagerEl && activeLink) {
    var idx = navLinks.indexOf(activeLink);
    var prev = idx > 0 ? navLinks[idx - 1] : null;
    var next = idx > -1 && idx < navLinks.length - 1 ? navLinks[idx + 1] : null;
    if (prev || next) {
      var html = '';
      html += prev
        ? '<a class="prev" href="' + prev.getAttribute('href') + '"><span class="dir">← Previous</span>' +
          '<span class="ttl">' + escapeHtml(prev.textContent.trim()) + '</span></a>'
        : '<span></span>';
      html += next
        ? '<a class="next" href="' + next.getAttribute('href') + '"><span class="dir">Next →</span>' +
          '<span class="ttl">' + escapeHtml(next.textContent.trim()) + '</span></a>'
        : '<span></span>';
      pagerEl.innerHTML = html;
      pagerEl.hidden = false;
    }
  }

  /* ---- on-page TOC: hide the rail when empty, scroll-spy the rest ---- */
  var toc = document.querySelector('.sk-toc');
  var tocList = document.getElementById('tocList');
  if (toc && tocList) {
    // A TOC that shows nothing (page has only an h1, or only h4+) is noise.
    var visibleLinks = Array.prototype.slice.call(tocList.querySelectorAll('a'))
      .filter(function (a) { return getComputedStyle(a).display !== 'none'; });
    if (visibleLinks.length === 0) {
      toc.style.display = 'none';
    } else {
      var linkById = {};
      tocList.querySelectorAll('a').forEach(function (a) {
        linkById[a.getAttribute('href').slice(1)] = a;
      });
      var observed = document.querySelectorAll('.sk-prose h2[id], .sk-prose h3[id]');
      if ('IntersectionObserver' in window && observed.length) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              Object.keys(linkById).forEach(function (id) { linkById[id].classList.remove('is-active'); });
              var link = linkById[en.target.id];
              if (link) link.classList.add('is-active');
            }
          });
        }, { rootMargin: '-64px 0px -70% 0px' });
        observed.forEach(function (h) { spy.observe(h); });
      }
    }
  }

  /* ---- mobile off-canvas drawer ---- */
  var sidebar = document.getElementById('sidebar');
  var scrim = document.getElementById('scrim');
  var menuBtn = document.getElementById('menuBtn');
  function toggleNav(open) {
    if (sidebar) sidebar.classList.toggle('is-open', open);
    if (scrim) scrim.classList.toggle('is-open', open);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      toggleNav(!(sidebar && sidebar.classList.contains('is-open')));
    });
  }
  if (scrim) scrim.addEventListener('click', function () { toggleNav(false); });
  // Close the drawer after navigating within it.
  navLinks.forEach(function (a) { a.addEventListener('click', function () { toggleNav(false); }); });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
