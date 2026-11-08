/*!
 * _patch.js — offline portability shim for the static snapshot
 * ---------------------------------------------------------------
 * The original site runs on a live Next.js server (Vercel). This snapshot
 * ships the real production JS/CSS/HTML unchanged, plus this tiny shim so the
 * same bundle also runs on ANY plain static host (or the bundled dev server).
 *
 * It does three things:
 *   1. next/image  ->  /_next/image?url=%2Fref%2Fgirl1.jpg&w=256&q=75
 *                      becomes the plain static path  /ref/girl1.jpg
 *                      (Next's optimizer endpoint does not exist statically;
 *                       the source images are already full resolution.)
 *   2. /api/time   ->  answered locally with Date.now() so the countdown
 *                      runs without a server route.
 *   3. Next router RSC prefetches are neutralised (single-page snapshot).
 *
 * Loaded before any other script, so it is already in place by the time
 * React hydrates.
 */
(function () {
  'use strict';
  if (window.__REA_PATCH__) return;
  window.__REA_PATCH__ = true;

  var IMG = /\/_next\/image\?/;

  /* ---- decode a Next image URL into a plain static path ---- */
  function resolve(u) {
    if (!u || typeof u !== 'string' || u.indexOf('/_next/image') === -1) return u;
    try {
      var abs = new URL(u, location.href);
      var raw = abs.searchParams.get('url');
      if (!raw) return u;
      // keep it a path, never an off-site URL
      var p = raw.charAt(0) === '/' ? raw : '/' + raw;
      return p;
    } catch (e) {
      return u;
    }
  }

  function fixImg(img) {
    if (!img || img.nodeType !== 1) return;
    var s = img.getAttribute('src');
    if (s && IMG.test(s)) img.setAttribute('src', resolve(s));
    var ss = img.getAttribute('srcset');
    if (ss && IMG.test(ss)) {
      var out = [];
      ss.split(',').forEach(function (part) {
        part = part.trim();
        if (!part) return;
        var bits = part.split(/\s+/);
        out.push([resolve(bits[0])].concat(bits.slice(1)).join(' '));
      });
      img.setAttribute('srcset', out.join(', '));
    }
    var st = img.getAttribute('style');
    if (st && IMG.test(st)) {
      img.setAttribute('style', st.replace(/\/_next\/image\?[^"')\s]+/g, function (m) {
        return resolve(m.replace(/&amp;/g, '&'));
      }));
    }
  }

  function fixTree(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.tagName === 'IMG') fixImg(node);
    if (node.querySelectorAll) {
      var list = node.querySelectorAll('img');
      for (var i = 0; i < list.length; i++) fixImg(list[i]);
    }
  }

  /* ---- 1. image rewriting (covers React's later DOM writes) ---- */
  function bootImages() {
    fixTree(document.documentElement);
    var mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'attributes') fixImg(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) fixTree(r.addedNodes[j]);
      }
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'style'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootImages);
  } else {
    bootImages();
  }

  /* ---- 2. /api/time answered locally ---- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url ? input.url : '';
    if (url && url.indexOf('/api/time') !== -1) {
      return Promise.resolve(
        new Response(JSON.stringify({ now: Date.now() }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }
    return realFetch ? realFetch(input, init) : Promise.reject(new Error('fetch unavailable'));
  };

  /* ---- 3. keep Next's router from prefetching missing RSC payloads ---- */
  if (navigator.serviceWorker && !/^https?:$/.test(location.protocol)) {
    /* file:// — nothing to do */
  }
})();
