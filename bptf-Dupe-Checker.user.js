// ==UserScript==
// @name         backpack.tf Dupe Checker (via next.backpack.tf)
// @namespace    bptf-dupe-checker
// @author       JayTuut
// @version      1.0
// @description  Checks next.backpack.tf in the background for a "duplicate" flag and shows a banner on the old backpack.tf item page
// @match        https://backpack.tf/item/*
// @match        https://www.backpack.tf/item/*
// @grant        GM_xmlhttpRequest
// @connect      next.backpack.tf
// ==/UserScript==

(function () {
  'use strict';

  // Pull the numeric item ID out of the current URL, e.g. /item/549168259
  const match = window.location.pathname.match(/\/item\/(\d+)/);
  if (!match) return;
  const itemId = match[1];
  const nextUrl = `https://next.backpack.tf/item/${itemId}`;

  // Wait for the .item-text container to exist before we try to inject into it
  // (in case it's rendered slightly after the script runs).
  waitFor('.item-text', (container) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: nextUrl,
      onload: function (response) {
        if (response.status < 200 || response.status >= 300) return;

        let bodyText = '';
        try {
          const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
          bodyText = (doc.body && doc.body.innerText) || response.responseText;
        } catch (e) {
          bodyText = response.responseText;
        }

        // Case-insensitive search for any mention of "duplicate" on the rendered page
        // (covers both the short "Duplicate" badge and the longer explanatory sentence).
        const isDuped = /duplicat(e|ed)/i.test(bodyText);
        if (isDuped) {
          container.appendChild(createDupeBadge(nextUrl));
        }
      },
      // Fail silently on error/timeout — no badge shown if we can't confirm dupe status.
    });
  });

  function createDupeBadge(link) {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = 'This item appears to be duplicated, according to next.backpack.tf. Click to view the history log.';

    Object.assign(a.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
      padding: '2px 6px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#b02a2a',
      background: 'rgba(176, 42, 42, 0.1)',
      border: '1px solid #b02a2a',
      borderRadius: '4px',
      textDecoration: 'none',
      cursor: 'pointer',
    });

    const icon = document.createElement('span');
    icon.textContent = '⚠️';
    a.appendChild(icon);

    const label = document.createElement('span');
    label.textContent = 'Duplicate';
    a.appendChild(label);

    return a;
  }

  // Polls for a selector to appear in the DOM, then runs the callback once.
  function waitFor(selector, callback, timeoutMs = 8000, intervalMs = 200) {
    const existing = document.querySelector(selector);
    if (existing) {
      callback(existing);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        callback(el);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
      }
    }, intervalMs);
  }
})();