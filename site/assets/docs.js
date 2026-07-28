/* =============================================================================
   Skier docs — client behaviour (vanilla, no dependencies, deferred load)

   Progressive enhancement over the server-rendered three-column shell:
     - theme toggle (persisted; initial theme is set pre-paint in <head>)
     - copy-code buttons + filename/language chip on B2 `figure.code-block`s
     - hover heading anchors on the B1 slugged heading ids
     - on-page TOC scroll-spy
     - active sidebar item + prev/next pager + breadcrumb from the rendered nav
     - mobile off-canvas drawer
     - native search (A6): overlay + client-side index (B3), keyboard-driven

   Search reads the plain JSON index emitted by generateSearchIndexTask (B3);
   the UI just fetches it, matches as you type, and deep-links to the B1 slugged
   heading anchors. No framework, no external service — Skier's own search.
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
      try {
        localStorage.setItem('sk-theme', next);
      } catch (e) {
        /* ignore */
      }
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
      '<button class="sk-copy" type="button" data-copy>' +
      COPY_ICON +
      '<span>Copy</span></button>';
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
  document
    .querySelectorAll('.sk-prose h2[id], .sk-prose h3[id], .sk-prose h4[id]')
    .forEach(function (h) {
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
    try {
      p = decodeURIComponent(p);
    } catch (e) {
      /* keep raw */
    }
    p = p.replace(/[?#].*$/, ''); // drop query/hash
    p = p.replace(/\.html$/, ''); // clean-url form
    p = p.replace(/\/index$/, ''); // index === directory root
    p = p.replace(/\/+$/, ''); // no trailing slash
    return p === '' ? '/' : p;
  }

  var here = normalizePath(location.pathname);
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.sk-sidebar .sk-nav-list a'),
  );
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
    if (sectionLabel)
      parts.push('<span>' + escapeHtml(sectionLabel.textContent.trim()) + '</span>');
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
        ? '<a class="prev" href="' +
          prev.getAttribute('href') +
          '"><span class="dir">← Previous</span>' +
          '<span class="ttl">' +
          escapeHtml(prev.textContent.trim()) +
          '</span></a>'
        : '<span></span>';
      html += next
        ? '<a class="next" href="' +
          next.getAttribute('href') +
          '"><span class="dir">Next →</span>' +
          '<span class="ttl">' +
          escapeHtml(next.textContent.trim()) +
          '</span></a>'
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
    var visibleLinks = Array.prototype.slice
      .call(tocList.querySelectorAll('a'))
      .filter(function (a) {
        return getComputedStyle(a).display !== 'none';
      });
    if (visibleLinks.length === 0) {
      toc.style.display = 'none';
    } else {
      var linkById = {};
      tocList.querySelectorAll('a').forEach(function (a) {
        linkById[a.getAttribute('href').slice(1)] = a;
      });
      var observed = document.querySelectorAll('.sk-prose h2[id], .sk-prose h3[id]');
      if ('IntersectionObserver' in window && observed.length) {
        var spy = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) {
                Object.keys(linkById).forEach(function (id) {
                  linkById[id].classList.remove('is-active');
                });
                var link = linkById[en.target.id];
                if (link) link.classList.add('is-active');
              }
            });
          },
          { rootMargin: '-64px 0px -70% 0px' },
        );
        observed.forEach(function (h) {
          spy.observe(h);
        });
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
  if (scrim)
    scrim.addEventListener('click', function () {
      toggleNav(false);
    });
  // Close the drawer after navigating within it.
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      toggleNav(false);
    });
  });

  /* =========================================================================
     Native search (A6) — fetches the B3 index, matches as you type, deep-links
     to B1 heading anchors. Overlay markup is built to the A5 CSS contract
     (.sk-search-overlay / -modal / -results / .sk-result / .sk-search-group).
     ========================================================================= */
  (function initSearch() {
    var searchBtn = document.getElementById('searchBtn');

    // Index is fetched lazily on first open (or trigger hover) and cached.
    var INDEX_URL = '/search-index.json';
    var pages = null; // prepared entries, or null until loaded
    var loadState = 'idle'; // idle | loading | ready | error
    var loadPromise = null;

    var overlay = null; // built once, attached/detached on open/close
    var input = null;
    var resultsEl = null;
    var current = []; // result objects for the current query, in display order
    var activeIdx = -1;

    /* ---- load + prepare the index (precompute lowercased search fields) ---- */
    function loadIndex() {
      if (loadPromise) return loadPromise;
      loadState = 'loading';
      loadPromise = fetch(INDEX_URL, { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          var list = (data && data.pages) || [];
          pages = list.map(function (p) {
            var headings = (p.headings || []).map(function (h) {
              return {
                text: h.text || '',
                level: h.level,
                id: h.id,
                lc: (h.text || '').toLowerCase(),
              };
            });
            return {
              url: p.url || '/',
              // Same-origin path (the index stores absolute URLs); keeps deep
              // links working both locally and in production.
              path: toPath(p.url || '/'),
              title: p.title || 'Untitled',
              titleLc: (p.title || '').toLowerCase(),
              headings: headings,
              body: p.body || '',
              bodyLc: (p.body || '').toLowerCase(),
            };
          });
          loadState = 'ready';
          return pages;
        })
        .catch(function (err) {
          loadState = 'error';
          if (window.console && console.warn) console.warn('Search index failed to load:', err);
          throw err;
        });
      return loadPromise;
    }

    function toPath(url) {
      try {
        return new URL(url, location.href).pathname;
      } catch (e) {
        return url;
      }
    }

    /* ---- query → ranked results ---- */
    function tokenize(q) {
      return q
        .toLowerCase()
        .split(/\s+/)
        .map(function (t) {
          return t.trim();
        })
        .filter(Boolean);
    }

    function bestHeading(page, terms) {
      var best = null;
      var bestCount = 0;
      page.headings.forEach(function (h) {
        if (!h.id) return; // only anchored headings can be deep-linked
        var count = 0;
        terms.forEach(function (t) {
          if (h.lc.indexOf(t) !== -1) count++;
        });
        if (count > bestCount) {
          bestCount = count;
          best = h;
        }
      });
      return best;
    }

    function search(q) {
      var terms = tokenize(q);
      if (!pages || !terms.length) return [];

      var scored = [];
      pages.forEach(function (page) {
        var score = 0;
        var everyTerm = true;
        terms.forEach(function (t) {
          var hit = false;
          if (page.titleLc.indexOf(t) !== -1) {
            score += 12;
            hit = true;
          }
          for (var i = 0; i < page.headings.length; i++) {
            if (page.headings[i].lc.indexOf(t) !== -1) {
              score += 4;
              hit = true;
              break;
            }
          }
          if (page.bodyLc.indexOf(t) !== -1) {
            score += 1;
            hit = true;
          }
          if (!hit) everyTerm = false;
        });
        // Require every term to appear somewhere on the page (AND semantics).
        if (!everyTerm) return;
        // Small bump when the whole query is a contiguous title substring.
        if (terms.length > 1 && page.titleLc.indexOf(q.toLowerCase().trim()) !== -1) score += 8;

        var heading = bestHeading(page, terms);
        scored.push({
          title: page.title,
          href: heading ? page.path + '#' + heading.id : page.path,
          crumb: crumbHtml(page, heading),
          snippet: snippetHtml(page.body, page.bodyLc, terms),
          score: score,
        });
      });

      scored.sort(function (a, b) {
        return b.score - a.score;
      });
      return scored.slice(0, 20);
    }

    function crumbHtml(page, heading) {
      var out = escapeHtml(page.path);
      if (heading) out += ' <em>' + escapeHtml(heading.text) + '</em>';
      return out;
    }

    /* ---- snippet: window around the first body hit, terms marked ---- */
    function snippetHtml(body, bodyLc, terms) {
      var first = -1;
      terms.forEach(function (t) {
        var idx = bodyLc.indexOf(t);
        if (idx !== -1 && (first === -1 || idx < first)) first = idx;
      });
      var slice;
      if (first === -1) {
        // Matched only on title/heading — show the opening of the page.
        slice = body.slice(0, 140);
        if (body.length > 140) slice = slice.replace(/\s\S*$/, '') + '…';
        return highlight(slice, terms);
      }
      var start = Math.max(0, first - 60);
      var end = Math.min(body.length, first + 120);
      slice = body.slice(start, end);
      if (start > 0) slice = '…' + slice.replace(/^\S*\s/, '');
      if (end < body.length) slice = slice.replace(/\s\S*$/, '') + '…';
      return highlight(slice, terms);
    }

    // Escape, then wrap term occurrences in <mark>. Works on raw text via match
    // ranges so we never split an HTML entity.
    function highlight(text, terms) {
      var lc = text.toLowerCase();
      var ranges = [];
      terms.forEach(function (t) {
        if (!t) return;
        var from = 0;
        var idx;
        while ((idx = lc.indexOf(t, from)) !== -1) {
          ranges.push([idx, idx + t.length]);
          from = idx + t.length;
        }
      });
      if (!ranges.length) return escapeHtml(text);
      ranges.sort(function (a, b) {
        return a[0] - b[0];
      });
      var merged = [ranges[0].slice()];
      for (var i = 1; i < ranges.length; i++) {
        var last = merged[merged.length - 1];
        if (ranges[i][0] <= last[1]) last[1] = Math.max(last[1], ranges[i][1]);
        else merged.push(ranges[i].slice());
      }
      var out = '';
      var pos = 0;
      merged.forEach(function (r) {
        out += escapeHtml(text.slice(pos, r[0]));
        out += '<mark>' + escapeHtml(text.slice(r[0], r[1])) + '</mark>';
        pos = r[1];
      });
      out += escapeHtml(text.slice(pos));
      return out;
    }

    /* ---- overlay construction (to the A5 markup contract) ---- */
    var SEARCH_ICON =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>';

    function buildOverlay() {
      overlay = document.createElement('div');
      overlay.className = 'sk-search-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Search docs');
      overlay.innerHTML =
        '<div class="sk-search-modal">' +
        '<div class="sk-search-input-row">' +
        SEARCH_ICON +
        '<input class="sk-search-input" type="text" autocomplete="off" autocorrect="off" ' +
        'autocapitalize="off" spellcheck="false" placeholder="Search the docs…" ' +
        'aria-label="Search docs" aria-controls="skSearchResults" />' +
        '<span class="sk-search-esc"><span class="sk-kbd">Esc</span></span>' +
        '</div>' +
        '<div class="sk-search-results" id="skSearchResults" role="listbox"></div>' +
        '<div class="sk-search-foot">' +
        '<span class="hint"><span class="sk-kbd">↑</span><span class="sk-kbd">↓</span> to navigate</span>' +
        '<span class="hint"><span class="sk-kbd">↵</span> to open</span>' +
        '<span class="hint"><span class="sk-kbd">esc</span> to close</span>' +
        '</div>' +
        '</div>';

      input = overlay.querySelector('.sk-search-input');
      resultsEl = overlay.querySelector('#skSearchResults');

      // Backdrop click closes; clicks inside the modal don't.
      overlay.addEventListener('mousedown', function (e) {
        if (e.target === overlay) close();
      });
      input.addEventListener('input', function () {
        runQuery();
      });
      input.addEventListener('keydown', onInputKeydown);
      // Delegate result hover/click.
      resultsEl.addEventListener('mousemove', function (e) {
        var el = e.target.closest ? e.target.closest('.sk-result') : null;
        if (el && el.dataset.idx) setActive(parseInt(el.dataset.idx, 10), false);
      });
      resultsEl.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('.sk-result') : null;
        if (el) {
          e.preventDefault();
          go(parseInt(el.dataset.idx, 10));
        }
      });
    }

    /* ---- rendering ---- */
    function runQuery() {
      var q = input.value.trim();
      if (loadState === 'error') {
        current = [];
        resultsEl.innerHTML =
          '<div class="sk-search-group">Search unavailable</div>' +
          '<div class="sk-result"><div class="r-snippet">Could not load the search index. ' +
          'Please refresh and try again.</div></div>';
        return;
      }
      if (loadState !== 'ready') {
        current = [];
        resultsEl.innerHTML = '<div class="sk-search-group">Loading…</div>';
        return;
      }
      if (!q) {
        current = [];
        activeIdx = -1;
        resultsEl.innerHTML =
          '<div class="sk-search-group">Start typing to search ' + pages.length + ' pages</div>';
        return;
      }
      current = search(q);
      render(q);
    }

    function render(q) {
      if (!current.length) {
        activeIdx = -1;
        resultsEl.innerHTML =
          '<div class="sk-search-group">No results</div>' +
          '<div class="sk-result"><div class="r-snippet">Nothing matched “' +
          escapeHtml(q) +
          '”.</div></div>';
        return;
      }
      var html =
        '<div class="sk-search-group">' +
        current.length +
        (current.length === 1 ? ' result' : ' results') +
        '</div>';
      current.forEach(function (r, i) {
        html +=
          '<a class="sk-result" role="option" data-idx="' +
          i +
          '" href="' +
          escapeHtml(r.href) +
          '">' +
          '<div class="r-title">' +
          escapeHtml(r.title) +
          '</div>' +
          '<div class="r-crumb">' +
          r.crumb +
          '</div>' +
          '<div class="r-snippet">' +
          r.snippet +
          '</div>' +
          '</a>';
      });
      resultsEl.innerHTML = html;
      setActive(0, false);
    }

    function resultEls() {
      return Array.prototype.slice.call(resultsEl.querySelectorAll('.sk-result[data-idx]'));
    }

    function setActive(idx, scroll) {
      var els = resultEls();
      if (!els.length) {
        activeIdx = -1;
        return;
      }
      activeIdx = ((idx % els.length) + els.length) % els.length;
      els.forEach(function (el, i) {
        var on = i === activeIdx;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && scroll) el.scrollIntoView({ block: 'nearest' });
      });
    }

    function go(idx) {
      var r = current[idx];
      if (r) location.assign(r.href);
    }

    /* ---- keyboard ---- */
    function onInputKeydown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(activeIdx + 1, true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(activeIdx - 1, true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx > -1) go(activeIdx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }

    /* ---- open / close ---- */
    function isOpen() {
      return !!(overlay && overlay.parentNode);
    }

    function open() {
      if (isOpen()) return;
      if (!overlay) buildOverlay();
      document.body.appendChild(overlay);
      input.value = '';
      loadIndex().then(runQuery, runQuery); // refresh state once loaded
      runQuery(); // immediate (loading / ready) state
      input.focus();
    }

    function close() {
      if (!isOpen()) return;
      overlay.parentNode.removeChild(overlay);
      if (searchBtn) searchBtn.focus();
    }

    /* ---- wire the trigger + global shortcuts ---- */
    if (searchBtn) {
      searchBtn.addEventListener('click', open);
      // Warm the index on intent so the first open feels instant.
      searchBtn.addEventListener('mouseenter', loadIndex);
      searchBtn.addEventListener('focus', loadIndex);
    }

    document.addEventListener('keydown', function (e) {
      // Cmd/Ctrl+K toggles the palette from anywhere.
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        isOpen() ? close() : open();
        return;
      }
      // "/" opens when not already typing into a field.
      if (e.key === '/' && !isOpen()) {
        var t = e.target;
        var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea' && !(t && t.isContentEditable)) {
          e.preventDefault();
          open();
        }
      }
    });
  })();

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
