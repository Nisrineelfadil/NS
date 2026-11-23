// SEC-03 — helpers to display visitor-submitted text safely in the administration panel.
// Visitors can type anything in the public forms (contact, registration, ratings, services, job applications,
// appointments). That text must be shown as text, never interpreted as HTML or JavaScript.
//
//   nsEscape(value)  → text safe inside HTML content and inside quoted attributes (title="…", href="…")
//   nsJsArg(value)   → a safe JavaScript string argument for inline handlers: onclick="fn(${nsJsArg(x)})"
//
// The names are prefixed ("ns") on purpose: several older scripts declare their own global escapeHtml()
// (one of them does not escape quotes), and a shared name would be silently overwritten.
(function () {
    'use strict';
    const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    function nsEscape(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/[&<>"'`]/g, c => MAP[c]);
    }
    // JSON string literal (double quotes, \u-escaped controls), then HTML-escaped so it can sit inside onclick="…".
    function nsJsArg(value) {
        const json = JSON.stringify(value === null || value === undefined ? '' : String(value))
            .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        return nsEscape(json);
    }
    window.nsEscape = nsEscape;
    window.nsJsArg = nsJsArg;
})();
