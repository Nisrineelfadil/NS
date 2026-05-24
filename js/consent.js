// RGPD Third-Party Consent Manager
// Blocks YouTube and Google Maps iframes until user explicitly consents.
// Consent is saved in localStorage per service.

(function () {
    'use strict';

    var KEYS = {
        youtube: 'rgpd_yt_consent',
        maps:    'rgpd_maps_consent'
    };

    var YT_IFRAME_HTML =
        '<iframe id="about-youtube-video" width="100%" height="100%" ' +
        'src="https://www.youtube.com/embed/bS07FeWQiHc?enablejsapi=1&autoplay=1&mute=1" ' +
        'frameborder="0" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen></iframe>';

    var MAPS_IFRAME_HTML =
        '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.8947891234567' +
        '!2d-5.0089474!3d34.022444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd9f8bb273463f77' +
        '%3A0x467ae6cc14a093d2!2sNISRINE%20SCHOOL!5e0!3m2!1sen!2sma!4v1234567890123!5m2!1sen!2sma" ' +
        'width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy" ' +
        'referrerpolicy="no-referrer-when-downgrade" title="Nisrine School Location"></iframe>';

    var OVERLAY_CSS =
        '.rgpd-overlay{display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'gap:14px;padding:32px 24px;background:#111;color:#eee;text-align:center;width:100%;height:100%;' +
        'min-height:240px;border-radius:8px;box-sizing:border-box;}' +
        '.rgpd-overlay .rgpd-icon{font-size:2.8rem;}' +
        '.rgpd-overlay h4{margin:0;font-size:1.1rem;color:#fff;}' +
        '.rgpd-overlay p{margin:0;font-size:0.82rem;color:#aaa;max-width:340px;line-height:1.5;}' +
        '.rgpd-overlay a{color:#DC143C;text-decoration:underline;}' +
        '.rgpd-load-btn{background:linear-gradient(135deg,#DC143C,#8B0000);color:#fff;border:none;' +
        'padding:11px 28px;border-radius:25px;cursor:pointer;font-weight:600;font-size:0.88rem;' +
        'transition:opacity 0.2s;}' +
        '.rgpd-load-btn:hover{opacity:0.85;}' +
        '.rgpd-note{font-size:0.74rem!important;color:#666!important;}';

    function injectCSS() {
        if (document.getElementById('rgpd-consent-css')) return;
        var style = document.createElement('style');
        style.id = 'rgpd-consent-css';
        style.textContent = OVERLAY_CSS;
        document.head.appendChild(style);
    }

    function buildOverlay(service, wrapId) {
        var isYT   = service === 'youtube';
        var icon   = isYT ? '<i class="fab fa-youtube" style="color:#ff0000"></i>'
                          : '<i class="fas fa-map-marked-alt" style="color:#4285f4"></i>';
        var name   = isYT ? 'YouTube' : 'Google Maps';
        var label  = isYT ? 'Charger la vidéo YouTube' : 'Charger la carte Google Maps';
        var notice = isYT
            ? 'Cette vidéo est hébergée par <strong>YouTube (Google)</strong>. Son chargement permet à Google de déposer des cookies et de collecter des données selon sa <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a>.'
            : 'Cette carte est fournie par <strong>Google Maps</strong>. Son chargement permet à Google de déposer des cookies et de collecter des données selon sa <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a>.';

        return '<div class="rgpd-overlay">' +
            '<span class="rgpd-icon">' + icon + '</span>' +
            '<h4>' + name + '</h4>' +
            '<p>' + notice + '</p>' +
            '<button class="rgpd-load-btn" onclick="window.rgpdLoad(\'' + service + '\',\'' + wrapId + '\')">' +
            '<i class="fas fa-play"></i> ' + label +
            '</button>' +
            '<p class="rgpd-note">Votre choix est mémorisé dans votre navigateur.</p>' +
            '</div>';
    }

    function loadYouTubeMediaSwitcher() {
        if (document.getElementById('yt-api-script')) return;
        var s = document.createElement('script');
        s.id  = 'yt-api-script';
        s.src = 'js/about-media-switcher.js';
        document.body.appendChild(s);
    }

    function initService(service, wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        injectCSS();

        if (localStorage.getItem(KEYS[service]) === 'true') {
            if (service === 'youtube') {
                wrap.innerHTML = YT_IFRAME_HTML;
                loadYouTubeMediaSwitcher();
            } else {
                wrap.innerHTML = MAPS_IFRAME_HTML;
            }
        } else {
            wrap.innerHTML = buildOverlay(service, wrapId);
        }
    }

    window.rgpdLoad = function (service, wrapId) {
        localStorage.setItem(KEYS[service], 'true');
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        if (service === 'youtube') {
            wrap.innerHTML = YT_IFRAME_HTML;
            loadYouTubeMediaSwitcher();
        } else {
            wrap.innerHTML = MAPS_IFRAME_HTML;
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        initService('youtube', 'yt-consent-wrap');
        initService('maps',    'maps-consent-wrap');
    });
})();
