"use strict";
(() => {
    const contentBoxStyles = `
  /* Important - e.g. Weboffer applies a box sizing that messes this up
   certain elements look particularly bad without thise
  */
  box-sizing: content-box;
`;
    const spinAnimationStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Safari */
@-webkit-keyframes spin {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}
`;
    const loadingStyles = `
  position: absolute;
  top: 50%;
  left: 50%;

  border: 6px solid #aaa;
  border-radius: 50%;
  border-top: 6px solid #fff;
  width: 20px;
  height: 20px;
  -webkit-animation: spin 2s linear infinite; /* Safari */
  animation: spin 2s linear infinite;

  /* Important - e.g. Weboffer applies a box sizing that messes this up */
  box-sizing: content-box;
`;
    const getMobilePopupStyles = (embedType) => `
@media(max-width: 480px) {
  .numi-embed-${embedType},
  .numi-embed-dynamic-${embedType} {
    width: 100vw !important;
    height: 100vh !important;
  }

  .numi-embed-${embedType} .numi-embed-iframe-container,
  .numi-embed-dynamic-${embedType} .numi-embed-iframe-container {
    max-width: 100vw;
    animation-duration: 350ms !important;

    /* we make the iframe container full width on small screens, but not
    full height, because we do want to leave room for the X icon (for us we
    don't want to overlay it on top of logos or back buttons) */
    width: 100% !important;

    /* we leave some wiggle room here (the icon is ~36px) */
    height: calc(100vh - 40px) !important;
    margin-top: 40px !important;
    border-radius: 12px !important;
  }

  .numi-embed-${embedType} .numi-embed-iframe-container iframe,
  .numi-embed-dynamic-${embedType} .numi-embed-iframe-container iframe {
    border-radius: 12px;
  }

  /* on small devices we position the X above the form, and no right padding */
  .numi-embed-${embedType} .numi-embed-${embedType}-close-icon,
  .numi-embed-dynamic-${embedType} .numi-embed-${embedType}-close-icon {
    color: #fff !important;

    position: absolute;
    top: -36px !important;
    right: 20px !important;
    left: unset !important;

    width: 32px !important;
    height: 32px !important;
    cursor: pointer;

    background: #171717;
    border-radius: 50%;
    padding: 8px !important;
    z-index: 10000000000001;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;

    ${contentBoxStyles}
  }

  .numi-embed-${embedType} .numi-embed-${embedType}-close-icon:hover,
  .numi-embed-dynamic-${embedType} .numi-embed-${embedType}-close-icon:hover {
    transform: scale(1.1);
    background: #000;
  }

  .numi-embed-slider .numi-embed-iframe-container iframe {}
}
  `;
    const popupBackgroundStyles = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, .65);
  transition: opacity .25s ease-in-out;
  z-index: 10000000000000;
  display: flex;
  justify-content: center;
`;
    const popupStyles = `
${spinAnimationStyles}

/* Popup Animation Keyframes */
@keyframes numi-popup-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1.0);
  }
}

@keyframes numi-popup-fade-out {
  0% {
    opacity: 1;
    transform: scale(1.0);
  }
  100% {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes numi-backdrop-fade-in {
  0% {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  100% {
    opacity: 1;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
}

@keyframes numi-backdrop-fade-out {
  0% {
    opacity: 1;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  100% {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
}

.noscroll {
  overoffer: hidden;
}

.numi-embed-popup {
  ${popupBackgroundStyles}
  align-items: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: numi-backdrop-fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.numi-embed-popup.closing {
  animation: numi-backdrop-fade-out 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.numi-embed-dynamic-popup {
 ${popupBackgroundStyles}
  align-items: flex-start;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: numi-backdrop-fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.numi-embed-dynamic-popup.closing {
  animation: numi-backdrop-fade-out 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.numi-embed-popup .numi-embed-iframe-container {
  position: relative;
  min-width: 360px;
  min-height: 360px;
  border-radius: 16px;
  overflow: visible;
  background: #ffffff; /* ensure clean look before iframe loads */
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: numi-popup-fade-in 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 10ms;
}

.numi-embed-popup.closing .numi-embed-iframe-container {
  animation: numi-popup-fade-out 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.numi-embed-dynamic-popup .numi-embed-iframe-container {
  position: relative;
  min-width: 360px;
  min-height: 360px;
  margin-top: 40px;
  max-height: calc(100vh - 80px);
  border-radius: 16px;
  overflow: visible;
  background: #ffffff; /* ensure clean look before iframe loads */
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: numi-popup-fade-in 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 10ms;
}

.numi-embed-dynamic-popup.closing .numi-embed-iframe-container {
  animation: numi-popup-fade-out 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.numi-embed-popup .numi-embed-iframe-container iframe,
.numi-embed-dynamic-popup .numi-embed-iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  overoffer: hidden;
  border-radius: 16px;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.numi-embed-popup .numi-embed-iframe-container iframe.loaded,
.numi-embed-dynamic-popup .numi-embed-iframe-container iframe.loaded {
  opacity: 1;
}

.numi-embed-popup .numi-embed-popup-close-icon,
.numi-embed-dynamic-popup .numi-embed-popup-close-icon {
  position: absolute;
  width: 32px;
  height: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  text-decoration: none;
  color: #fff !important;
  top: -12px;
  right: -12px;
  background: #171717;
  border-radius: 50%;
  padding: 8px;
  z-index: 10000000000001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;

  ${contentBoxStyles}
}

.numi-embed-popup .numi-embed-popup-close-icon:hover,
.numi-embed-dynamic-popup .numi-embed-popup-close-icon:hover {
  transform: scale(1.1);
  background: #000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.numi-embed-popup .numi-embed-loading,
.numi-embed-dynamic-popup .numi-embed-loading {
  ${loadingStyles}
}

${getMobilePopupStyles('popup')}
`;
    const sliderStyles = `
${spinAnimationStyles}

.noscroll {
  overoffer: hidden;
}

.numi-embed-slider {
  ${popupBackgroundStyles}
  justify-content: flex-start;
}

.numi-embed-slider .numi-embed-iframe-container {
  position: absolute;
  top: 0px;

  /* slides in from the right always at the moment, can add a feature for
  left transition later */
  transition: transform .35s ease-in-out;

  height: 100%;
  opacity: 1;
}

.numi-embed-slider .numi-embed-iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  overoffer: hidden;
  border-radius: 0px;
}

.numi-embed-slider .numi-embed-slider-close-icon {
  /* for sliders, the close icon is a little tab with an "X" in it centered
  vertically on the edge of the slider (unless on mobile, where we copy
  the styling of popup) */
  position: absolute !important;
  width: 24px;
  height: 24px;
  text-align: center;
  cursor: pointer;
  transition: opacity .5s ease-in-out;
  text-decoration: none;
  color: #fff !important;

  top: 50%;
  background: #171717;

  padding: 20px 4px 20px 4px;

  ${contentBoxStyles}
}

.numi-embed-slider .numi-embed-slider-close-icon:hover {
  transform: scaleY(1.05);
}

.numi-embed-slider .numi-embed-loading {
  ${loadingStyles}
}

${getMobilePopupStyles('slider')}
`;
    const standardStyles = `
${spinAnimationStyles}

.numi-embed-standard {
  /* This will take up the full size of whatever div you're inserting the
   * iframe into. That div will grow in size depending on how large theh
   * iframe is.*/
  width: 100%;
  height: 100%;
}

.numi-embed-standard .numi-embed-iframe-container {
  position: relative;
  transition: opacity .25s ease-in-out;
  width: 100%;
  height: 100%;
}

.numi-embed-standard .numi-embed-iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  overoffer: hidden;
  border-radius: 10px;
}

.numi-embed-standard .numi-embed-loading {
  ${loadingStyles}
}
`;
    const XIcon = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>
`;
    if (typeof window === 'undefined')
        return;

    // Debug toggle: enable verbose logs only when explicitly requested
    const __detectDebug = () => {
        try {
            // 1) Explicit global flag
            if (window.PLANDALF_DEBUG === true || window.PLANDALF_DEBUG === '1') return true;

            // 2) Script tag query param: ?debug=1 or ?plandalf_debug=1
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src || '';
                if (/\/v1\.js(\?|#|$)/.test(src)) {
                    try {
                        const url = new URL(src, window.location.origin);
                        if (url.searchParams.get('debug') === '1' || url.searchParams.get('plandalf_debug') === '1') {
                            return true;
                        }
                    } catch (_) {}
                }
            }

            // 3) Page URL param
            const params = new URLSearchParams(window.location.search || '');
            if (params.get('PLANDALF_DEBUG') === '1' || params.get('plandalf_debug') === '1' || params.get('debug') === '1') return true;

            // 4) Local storage flag
            try {
                if (localStorage.getItem('plandalf.debug') === '1') return true;
            } catch (_) {}

            return false;
        } catch (_) {
            return false;
        }
    };

    const __NUMI_DEBUG__ = __detectDebug();

    // Unified logger exposed as plandalf.log/.warn/.error
    const plandalfGlobal = (function() {
        // Ensure namespace exists early
        if (!window.plandalf) {
            window.plandalf = {};
        }
        const g = window.plandalf;
        // Logging helpers
        g.log = function() {
            try { if (__NUMI_DEBUG__) { console.log.apply(console, arguments); } } catch (_) {}
        };
        g.warn = function() {
            try { console.warn.apply(console, arguments); } catch (_) {}
        };
        g.error = function() {
            try { console.error.apply(console, arguments); } catch (_) {}
        };
        return g;
    })();

    // Provide a local alias so internal calls like plandalf.log(...) work
    const plandalf = window.plandalf;

    // Single-overlay guard (prevents multiple popup/slider at once)
    // Structure: { embedId: string, type: 'popup'|'slider', startedAt: number }
    try { if (!window.__plandalfActiveOverlay) window.__plandalfActiveOverlay = null; } catch (_) {}
    const isOverlayActive = () => !!(window.__plandalfActiveOverlay && window.__plandalfActiveOverlay.embedId);
    const setActiveOverlay = (embedId, type) => {
        try { window.__plandalfActiveOverlay = { embedId, type, startedAt: Date.now() }; } catch (_) {}
    };
    const clearActiveOverlayIf = (embedId) => {
        try {
            if (window.__plandalfActiveOverlay && window.__plandalfActiveOverlay.embedId === embedId) {
                window.__plandalfActiveOverlay = null;
            }
        } catch (_) {}
    };
    // On script (re)load, detect any existing open popup/slider and restore the lock
    try {
        const openOverlayEl = document.querySelector('[data-numi-embed-id][data-numi-embed-type="popup"], [data-numi-embed-id][data-numi-embed-type="slider"]');
        if (openOverlayEl instanceof HTMLElement) {
            const existingEmbedId = openOverlayEl.getAttribute('data-numi-embed-id');
            const existingType = openOverlayEl.getAttribute('data-numi-embed-type');
            if (existingEmbedId && (existingType === 'popup' || existingType === 'slider')) {
                setActiveOverlay(existingEmbedId, existingType);
            }
        }
    } catch (_) {}

    // Global tracking of embed types by embedId - must be declared early
    const embedTypeRegistry = new Map();
    // Track popups/sliders that have been shown before session init so we can fire a 'shown' event
    const pendingShownEmbeds = new Set();

    // as long as the window is valid (and not embedding in e.g. nextJS improperly
    // or something similar), we initialize:
    // - popups
    // - slide overs
    // - etc.
    // by adding onclick handlers for all of them corresponding to the button
    // or element that is supposed to open them up, and also creates the
    // elements, with opacity 0 set initially
    const generateEmbedId = () => {
        const min = 10000000000000;
        const max = 99999999999999;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return `${randomNumber}`;
    };
    const getParentUrl = () => {
        let parentUrl;
        if (typeof window === 'undefined') {
            return parentUrl;
        }
        try {
            // helps for capturing parent URL if we're in an iframe (sometimes)
            parentUrl = window.top?.location.href;
        }
        catch (e) {
            parentUrl = window.location.href;
        }
        return parentUrl;
    };
    // numi config
    const getConfig = (element) => {
        const globalConfig = (typeof window !== 'undefined' && window.plandalfConfig) ? window.plandalfConfig : {};
        const sliderDirection = element.dataset.numiSliderDirection === 'left'
          ? 'left'
          : 'right';
        const popupSize = element.dataset.numiPopupSize
          || 'large';

        const isBillingPortal = element.dataset.numiPortal === 'billing';

        const customerToken = element.dataset.numiCustomer
          || element.dataset.numiCustomerToken
          || element.dataset.customer
          || element.dataset.id
          || globalConfig.customer
          || null;

        const returnUrl = element.dataset.numiReturnUrl
          || null;

        const domainFromAttr = element.dataset.numiDomain;
        const domainFromGlobal = (globalConfig.domain
          ? (function(v){
                try {
                  if (/^https?:\/\//i.test(v)) { return new URL(v).origin; }
                  return `https://${v}`;
                } catch(_) { return null; }
             })(globalConfig.domain)
          : null);

        const config = {
            initialized: element.dataset.numiInitialized !== undefined,
            inheritParameters: element.dataset.numiInheritParameters !== undefined,
            dynamicResize: element.dataset.numiDynamicResize !== undefined,
            offerPublicIdentifier: element.dataset.numiOffer,
            sliderDirection,
            domain: domainFromAttr || (domainFromGlobal ? domainFromGlobal.replace(/^https?:\/\//i, '').replace(/\/$/, '') : undefined),
            popupSize,
            preview: element.dataset.numiPreview !== undefined,

            // Billing portal support
            isBillingPortal,
            customerToken,
            returnUrl,
        };

        return config;
    };
    const getSharedIframeSrc = (configDomain, offerPublicIdentifier, inheritParameters, target, modeConfig) => {

        // Prefer explicit override domain (attributes/options), else use the script element origin
        let domain = null;
        const normalizeToOrigin = (value) => {
            if (!value) return null;
            try {
                if (/^https?:\/\//i.test(value)) {
                    return new URL(value).origin;
                }
                // Bare host value
                if (/^localhost(?::\d+)?$/i.test(value)) {
                    return `http://${value}`;
                }
                return `https://${value}`;
            } catch (_) { return null; }
        };
        const overrideOrigin = normalizeToOrigin(configDomain);
        if (overrideOrigin) {
            domain = overrideOrigin;
        }
        try {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                // Cache script origin only when no explicit override provided
                if (!domain) {
                    // @ts-ignore
                    if (window.__plandalfScriptOrigin && typeof window.__plandalfScriptOrigin === 'string') {
                        // @ts-ignore
                        domain = window.__plandalfScriptOrigin;
        } else {
            let scriptSrc = null;
                if (document.currentScript && document.currentScript.src) {
                    scriptSrc = document.currentScript.src;
                } else {
                    const scripts = document.getElementsByTagName('script');
                    for (let i = 0; i < scripts.length; i++) {
                                if (scripts[i].src && /\/v1\.js(\?|#|$)/.test(scripts[i].src)) {
                            scriptSrc = scripts[i].src;
                            break;
                    }
                }
            }
            if (scriptSrc) {
                    const url = new URL(scriptSrc, window.location.origin);
                    domain = url.origin;
                            // @ts-ignore
                            window.__plandalfScriptOrigin = domain;
                        }
                    }
                }
            }
        } catch (_) {}

        // Fallback to page origin if script origin not found
        if (!domain && typeof window !== 'undefined' && window.location) {
            domain = window.location.origin;
        }
        // Final fallback
        if (!domain) domain = 'https://plandalf.dev';
        // Determine path based on mode
        let path = `/o/${offerPublicIdentifier}`;
        if (modeConfig && modeConfig.mode === 'billing') {
            path = `/billing/portal`;
        } else if (modeConfig && modeConfig.mode === 'widget') {
            path = `/widgets`;
        }
        // Environment handling for offers: if env === 'test' append '/test'
        try {
            const envAttr = target.getAttribute
              && (target.getAttribute('data-env')
                || target.getAttribute('data-plandalf-env'));

            const envOpt = modeConfig && modeConfig.env;
            const envGlobal = (typeof window !== 'undefined' && window.plandalfConfig && window.plandalfConfig.env) || undefined;
            const envVal = (envOpt || envAttr || envGlobal || '').toString().toLowerCase();
            if (path.startsWith('/o/') && envVal === 'test') {
                path += '/test';
            }
        } catch (_) { }
        const formLink = `${domain}${path}`;
        const iframeSrc = new URL(formLink);
        // if we're passed the option to inherit search parameters, then we add
        // those here as well.
        if (inheritParameters) {
            const params = new URL(window.location.href).searchParams;
            for (const [key, value] of params.entries()) {
                iframeSrc.searchParams.append(key, value);
            }
        }
        // Attach known params for billing portal
        if (modeConfig && modeConfig.mode === 'billing') {
            if (modeConfig.customerToken) {
                // The controller accepts 'customer'|'customer_id'|'cid'. Use 'customer'.
                iframeSrc.searchParams.append('customer', modeConfig.customerToken);
            }
            if (modeConfig.returnUrl) {
                iframeSrc.searchParams.append('return_url', modeConfig.returnUrl);
            }
        } else if (modeConfig && modeConfig.mode === 'offer') {
            // Pass JWT customer token directly for offers, if provided
            if (modeConfig.customerToken) {
                iframeSrc.searchParams.append('customer', modeConfig.customerToken);
            }
        } else if (modeConfig && modeConfig.mode === 'widget') {
            if (modeConfig.widgetType) {
                iframeSrc.searchParams.append('type', modeConfig.widgetType);
            }
            if (modeConfig.widgetId) {
                iframeSrc.searchParams.append('id', modeConfig.widgetId);
            }
        }
        // we convert data- attributes into URL parameters. we use the ones passed
        // directly to the embed as taking priority (since explicitly set)
        const DATA_PREFIX = 'data-';
        const appendPairsFromQueryString = (raw, prefixForKeys) => {
            if (!raw || typeof raw !== 'string') return;
            let params;
            try {
                params = new URLSearchParams(raw);
            } catch (_) {
                // Fallback simple parser if URLSearchParams fails
                params = new URLSearchParams();
                const parts = raw.split('&');
                for (const part of parts) {
                    if (!part) continue;
                    const eq = part.indexOf('=');
                    if (eq === -1) {
                        params.append(part, '');
                    } else {
                        params.append(part.slice(0, eq), part.slice(eq + 1));
                    }
                }
            }
            for (const [origK, origV] of params.entries()) {
                let k = origK;
                // Auto-namespace flat keys into e.g., customer[key]
                if (prefixForKeys && !/\[.+\]/.test(k) && !k.startsWith(prefixForKeys + '[')) {
                    k = `${prefixForKeys}[${k}]`;
                }
                // Use decoded value so we only encode once in the final URL
                const decodedVal = (() => { try { return decodeURIComponent(origV); } catch(_) { return origV; } })();
                iframeSrc.searchParams.append(k, decodedVal);
            }
        };

        for (const attribute of target.attributes) {
            if (!attribute.name.startsWith('data-') || attribute.name.startsWith('data-numi')) continue;


            const key = attribute.name.slice(DATA_PREFIX.length);
            if (key === 'items') {
                appendPairsFromQueryString(attribute.value);
                continue;
            }
            if (key === 'customer') {
                // Auto-namespace flat keys into customer[...] if needed
                appendPairsFromQueryString(attribute.value, 'customer');
                continue;
            }
            iframeSrc.searchParams.append(key, attribute.value);
        }

        return iframeSrc;
    };
    // make popup/slider button
    const initializePopupButton = (element, onclick) => {
        // If element is already an interactive control, bind directly
        if (element.tagName !== 'DIV') {
            element.onclick = onclick;
            return;
        }
        // If there's a single child button or anchor, use that instead of creating a nested button
        try {
            const existing = element.querySelector('button, a');
            if (existing && existing.parentElement === element) {
                existing.addEventListener('click', (e) => { e.preventDefault(); onclick(e); });
                return;
            }
        } catch (_) {}
        const { buttonText, buttonColor, buttonTextColor, buttonFloat, buttonSize, } = getConfig(element);
        const button = document.createElement('button');
        button.innerText = buttonText || 'Open form';
        Object.assign(button.style, {
            cursor: 'pointer',
            fontFamily: 'Helvetica, Arial, sans-serif',
            ...(buttonSize === 'small'
                ? {
                    padding: '8px 12px 8px 12px',
                    fontSize: '16px',
                    borderRadius: '28px',
                }
                : buttonSize === 'large'
                    ? {
                        padding: '12px 14px 12px 14px',
                        fontSize: '20px',
                        borderRadius: '32px',
                    }
                    : {
                        padding: '10px 14px 10px 14px',
                        fontSize: '18px',
                        borderRadius: '32px',
                    }),
            display: 'inline-block',
            maxWidth: '100%',
            whitespace: 'nowrap',
            overoffer: 'hidden',
            textOveroffer: 'ellipsis',
            textDecoration: 'none',
            color: buttonTextColor || '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0',
            border: 'none',
        });
        if (buttonFloat) {
            Object.assign(button.style, {
                'bottom-right': {
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    zIndex: '9999999',
                },
                'bottom-left': {
                    position: 'fixed',
                    bottom: '32px',
                    left: '32px',
                    zIndex: '9999999',
                },
            }[buttonFloat]);
        }
        // dynamically add a hover effect depending on the button background color
        // but make sure to assign it without interfering with any other buttons
        // they mave have embedded on this page (assign unique id)
        const buttonId = generateEmbedId();
        const buttonClassName = `numi-embed-popup-button-${buttonId}`;
        button.className = buttonClassName;
        const lighten = (color, amount) => {
            return ('#' +
                color
                    .replace(/^#/, '')
                    .replace(/../g, color => ('0' +
                    Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).slice(-2)));
        };
        const style = document.createElement('style');
        style.textContent = `
      .${buttonClassName} {
        background-color: ${buttonColor};
        transition: background-color 0.2s ease;
        box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
      }

      .${buttonClassName}:hover {
        background-color: ${lighten(buttonColor, 10)};
      }
    `;
        document.head.appendChild(style);
        button.onclick = onclick;
        element.appendChild(button);
    };
    // Popups and sliders are quite similar in their setup, so we bundle in the
    // code together here and just adjust classes dependent on the embed type
    const initializePopupLikeTarget = (target, embedType) => {
        const { offerPublicIdentifier, initialized, inheritParameters, sliderDirection, domain, dynamicResize, popupSize, preview, isBillingPortal, customerToken, returnUrl } = getConfig(target);
        if ((embedType === 'popup' || embedType === 'slider') && !isBillingPortal && !offerPublicIdentifier) {
            try { window.plandalf?.warn?.('[Plandalf] Missing data-numi-offer for', embedType, 'trigger:', target); } catch (_) {}
        }
        if (initialized)
            return;
        const popupContainer = document.createElement('div');
        popupContainer.className = dynamicResize
            ? `numi-embed-dynamic-${embedType}`
            : `numi-embed-${embedType}`;
        // Only set opacity 0 for popups, sliders need to be visible for their transform animations
        if (embedType === 'popup') {
            // popupContainer.style.opacity = '0';
        }
        const popupLoading = document.createElement('div');
        popupLoading.className = 'numi-embed-loading';
        popupLoading.style.display = 'block';
        // make sure spinner is centered within the rounded white card
        Object.assign(popupLoading.style, {
            marginTop: '-10px'
        });
        popupContainer.appendChild(popupLoading);
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'numi-embed-iframe-container';
        iframeContainer.style.opacity = '1';
        popupContainer.appendChild(iframeContainer);
        const iframe = document.createElement('iframe');
        const iframeSrc = getSharedIframeSrc(
            domain,
            offerPublicIdentifier || 'billing-portal',
            inheritParameters,
            target,
            isBillingPortal ? { mode: 'billing', customerToken, returnUrl } : { mode: 'offer', customerToken }
        );
        const embedId = generateEmbedId();
        // Include both modern and legacy param names for robustness
        iframeSrc.searchParams.append('embed-id', `${embedId}`);
        iframeSrc.searchParams.append('embed-type', embedType);
        if (preview) {
            iframeSrc.searchParams.append('embed-preview', 'yes');
        }
        const parentPage = getParentUrl();
        if (parentPage) {
            iframeSrc.searchParams.append('embed-parent-page', parentPage);
        }
        if (dynamicResize && embedType === 'popup') {
            iframeSrc.searchParams.append('numi-embed-dynamic-resize', 'true');
            // transition for when the height changes (potentially)
            iframeContainer.style.transition = 'height 150ms ease';
            // listen for changes from the iframe, and upon changes, we resize the
            // target element here (based on height)
            const receiveMessage = (event) => {
                if ((!preview && event.origin !== new URL(iframeSrc.toString()).origin) ||
                    event.data.embedId !== embedId) {
                    // only for this iframe in question
                    return;
                }

                // Handle dynamic resize (preserve existing functionality)
                if (event.data.size !== undefined) {
                    const newHeight = event.data.size;
                    iframeContainer.style.height = `${newHeight
                        ? Math.min(newHeight + 48, window.innerHeight - 80)
                        : window.innerHeight - 80}px`;
                }
            };
            window.addEventListener('message', receiveMessage, false);
        }
        iframe.src = iframeSrc.toString();
        //microphone; camera; 
        iframe.allow = 'geolocation; payment';
        
        iframe.style.border = '0px';
        iframe.style.background = '#ffffff'; // hide any initial transparency while loading
        iframe.title = isBillingPortal ? 'Billing Portal' : `${offerPublicIdentifier}`;

        // Store embed ID and context marker for session tracking
        target.setAttribute('data-numi-embed-id', embedId);
        if (isBillingPortal) {
            target.setAttribute('data-numi-portal', 'billing-portal');
            target.removeAttribute('data-numi-offer');
        } else {
            target.setAttribute('data-numi-offer', offerPublicIdentifier);
            target.removeAttribute('data-numi-portal');
        }

        // Register embed type for session tracking
        embedTypeRegistry.set(embedId, embedType);

        const closeIcon = document.createElement('a');
        closeIcon.className = `numi-embed-${embedType}-close-icon`;
        closeIcon.innerHTML = XIcon;
        // wait to display it until the iframe is loaded in
        closeIcon.style.opacity = '0';
        iframeContainer.appendChild(closeIcon);
        iframe.addEventListener('load', () => {
            if (popupLoading) {
                popupLoading.style.display = 'none';
            }
            if (closeIcon) {
                closeIcon.style.opacity = '1';
            }
            // Add loaded class for smooth iframe fade-in
            iframe.classList.add('loaded');
            if (embedType === 'slider') {
                iframeContainer.style.transform = 'translateX(0)';
            }
        }, true);
        iframeContainer.appendChild(iframe);
        if (embedType === 'popup') {
            // later on, will offer this as variable sizing, which is why we compute
            // it on the fly here. default is not full width but slightly skinnier
            if (popupSize === 'medium') {
                // roughly the size at which scheduling pages work well, and we don't
                // run the risk of cutting anyone's form width short
                iframeContainer.style.width =
                    // 80vw of 1200 ~ 960px (we get progressively smaller with some padding
                    // on the RHS)
                    window.innerWidth < 1200 ? '80vw' : '900px';
                iframeContainer.style.height = '700px';
            }
            else if (popupSize === 'small') {
                // roughly inline with others we've seen, and smaller than this seems
                // a tad silly
                iframeContainer.style.width =
                    // 900 * 60vw ~= 540px
                    // 600 * 80vw ~= 480px (about as small as we want to get)
                    window.innerWidth < 600
                        ? '80vw'
                        : window.innerWidth < 900
                            ? '60vw'
                            : '560px';
                iframeContainer.style.height = 'calc(100% - 80px)';
            }
            else {
                iframeContainer.style.width = 'calc(100% - 160px)';
                iframeContainer.style.height = 'calc(100% - 80px)';
            }
        }
        else if (embedType === 'slider') {
            // later on will offer different sizing for this too maybe
            iframeContainer.style.width = '80vw';
            if (sliderDirection === 'left') {
                iframeContainer.style.left = '0px';
                iframeContainer.style.transform = 'translateX(-100%)';
                closeIcon.style.right = '-32px';
                closeIcon.style.borderTopRightRadius = '15px';
                closeIcon.style.borderBottomRightRadius = '15px';
            }
            else {
                iframeContainer.style.right = '0px';
                iframeContainer.style.transform = 'translateX(100%)';
                closeIcon.style.left = '-32px';
                closeIcon.style.borderTopLeftRadius = '15px';
                closeIcon.style.borderBottomLeftRadius = '15px';
            }
        }
        // close handlers
        const closePopup = () => {
            // Fire cancel event before closing if there's an active session
            // Use embedId from closure scope since it's not set on iframe
            if (embedId && window.plandalf?.offers?._sessions?.has(embedId)) {
                const session = window.plandalf.offers._sessions.get(embedId);
                if (session) {
                    // Fire checkout_closed event for popup/slider closures
                    if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                        plandalf.log(`[Plandalf] Firing closed event for embedId: ${embedId}, completed: ${session.isCompleted}`);
                    }
                    session._triggerEvent('closed', {
                        embedType: session.embedType,
                        wasCompleted: session.isCompleted,
                        embedId: embedId,
                        sessionId: session.id
                    });

                    // Also fire cancel event if not completed
                    if (!session.isCompleted && !session.isCancelled) {
                        if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                            plandalf.log(`[Plandalf] Firing cancel event for embedId: ${embedId}`);
                        }
                        session._triggerEvent('cancel', {
                            cancelReason: 'popup_closed',
                            embedId: embedId,
                            sessionId: session.id
                        });
                    }
                } else if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                    plandalf.log(`[Plandalf] Session not found for embedId: ${embedId}`);
                }
            } else if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                plandalf.log(`[Plandalf] No active sessions found for embedId: ${embedId}`, {
                    embedId,
                    sessions: window.plandalf?.offers?._sessions,
                    hasSession: window.plandalf?.offers?._sessions?.has(embedId),
                    sessionKeys: Array.from(window.plandalf?.offers?._sessions?.keys() || [])
                });
            }

            document.body.classList.remove('noscroll');
            if (embedType === 'popup') {
                // Add closing class to trigger CSS exit animations
                popupContainer.classList.add('closing');
          } else if (embedType === 'slider') {
                if (sliderDirection === 'left') {
                    iframeContainer.style.transform = 'translateX(-100%)';
            } else {
                    iframeContainer.style.transform = 'translateX(100%)';
                }
            }
            // Updated timing for enhanced animations: popup uses 300ms, slider uses 350ms
            const timeout = embedType === 'popup' ? 300 : 350;
            setTimeout(() => {
                // before removing it, reset the styles for everything so that they
                // work nicely out of the box when it comes back up (since we're
                // reusing the same container
                popupLoading.style.display = 'block';
                closeIcon.style.opacity = '0';
                // Reset iframe class to ensure clean state for next popup
                iframe.classList.remove('loaded');
                // Remove closing class to ensure clean state for next popup
                popupContainer.classList.remove('closing');
                // Reset the target's initialized state so it can be opened again
                target.removeAttribute('data-numi-initialized');
                // Clean up embed tracking
                target.removeAttribute('data-numi-embed-id');
                embedTypeRegistry.delete(embedId);
                popupContainer.remove();
                // Clear global active overlay guard
                clearActiveOverlayIf(embedId);
                // we give enough time for the animation to finish
            }, timeout);
        };
        // onclick here, we also close the container (either the X or clicking
        // outside is fine).
        popupContainer.onclick = () => {
            closePopup();
        };
        // Prevent closing when clicking inside the iframe container
        iframeContainer.onclick = (e) => {
            e.stopPropagation();
        };
        closeIcon.onclick = () => {
            closePopup();
        };
        initializePopupButton(target, () => {
            // Block if another overlay (popup/slider) is already active
            if (isOverlayActive()) {
                try { plandalf.warn('[Plandalf] Popup/slider already active; ignoring new trigger'); } catch (_) {}
                return;
            }
            // Additionally, check DOM for any existing overlay containers to be extra safe
            try {
                const existingOverlay = document.querySelector('.numi-embed-popup, .numi-embed-dynamic-popup, .numi-embed-slider, .numi-embed-dynamic-slider, .numi-embed-fullscreen-modal');
                if (existingOverlay) {
                    try { plandalf.warn('[Plandalf] Detected existing overlay container in DOM; rejecting new overlay'); } catch (_) {}
                    return;
                }
            } catch (_) {}
            document.body.appendChild(popupContainer);
            document.body.classList.add('noscroll');
            // Remove the manual opacity setting - let CSS animations handle it
            // The animations are already defined in CSS and will start automatically
            try {
                // Mark as shown so we can emit 'shown' once the session is created
                if (embedType === 'popup' || embedType === 'slider') {
                    pendingShownEmbeds.add(embedId);
                }
            } catch (_) {}
            // Mark active overlay
            setActiveOverlay(embedId, embedType);
            // Ensure only one overlay container exists in DOM (defensive)
            try {
                const overlays = document.querySelectorAll('.numi-embed-popup, .numi-embed-dynamic-popup, .numi-embed-slider, .numi-embed-dynamic-slider, .numi-embed-fullscreen-modal');
                if (overlays.length > 1) {
                    for (let i = 1; i < overlays.length; i++) {
                        overlays[i].remove();
                    }
                }
            } catch (_) {}
        });
        target.setAttribute('data-numi-initialized', 'true');
    };
    const initializeStandardTarget = (target, isFullScreen) => {
        const { initialized, offerPublicIdentifier, inheritParameters, dynamicResize, domain, preview, isBillingPortal, customerToken, returnUrl } = getConfig(target);
        if (initialized)
            return;
        const standardContainer = document.createElement('div');
        if (isFullScreen) {
            // Fullscreen modal overlay styles
            standardContainer.className = 'numi-embed-fullscreen-modal';
            Object.assign(standardContainer.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                zIndex: '1000000000',
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: '0',
                transition: 'opacity 0.25s ease-in-out',
            });
        } else {
            standardContainer.className = 'numi-embed-standard';
            standardContainer.style.opacity = '0';
        }
        const standardLoading = document.createElement('div');
        standardLoading.className = 'numi-embed-loading';
        standardLoading.style.display = 'block';
        standardContainer.appendChild(standardLoading);
        // relative while we show loading icon
        if (!isFullScreen) target.style.position = 'relative';
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'numi-embed-iframe-container';
        iframeContainer.style.opacity = '1';
        if (isFullScreen) {
            Object.assign(iframeContainer.style, {
                width: '100vw',
                height: '100vh',
                position: 'relative',
                borderRadius: '0',
                boxShadow: '0 0 0 0',
            });
        }
        standardContainer.appendChild(iframeContainer);
        const iframe = document.createElement('iframe');
        const iframeSrc = getSharedIframeSrc(
            domain,
            offerPublicIdentifier || 'billing-portal',
            inheritParameters,
            target,
            isBillingPortal ? { mode: 'billing', customerToken, returnUrl } : { mode: 'offer', customerToken }
        );
        const embedId = generateEmbedId();
        // Standard embeds: single canonical param names
        iframeSrc.searchParams.append('embed-id', `${embedId}`);
        const embedType = isFullScreen ? 'fullscreen' : 'standard';
        iframeSrc.searchParams.append('embed-type', embedType);
        if (preview) {
            iframeSrc.searchParams.append('embed-preview', 'yes');
        }
        const parentPage = getParentUrl();
        if (parentPage) {
            iframeSrc.searchParams.append('embed-parent-page', parentPage);
        }
        if (dynamicResize && !isFullScreen) {
            iframeSrc.searchParams.append('numi-embed-dynamic-resize', 'true');
            // transition for when the height changes (potentially)
            target.style.transition = 'height 150ms ease';
            // listen for changes from the iframe, and upon changes, we resize the
            // target element here (based on height)
            const receiveMessage = (event) => {
                if ((!preview && event.origin !== new URL(iframeSrc.toString()).origin) ||
                    event.data.embedId !== embedId) {
                    // only for this iframe in question
                    return;
                }

                // Handle form resize (preserve existing functionality)
                if (event.data.type === 'form_resized') {
                    const newHeight = event.data.size;
                    target.style.height = `${newHeight}px`;
                }

                // Handle scroll up requests (preserve existing functionality)
                if (event.data.type === 'check_scroll_up') {
                    const elementTopInParent = iframe.getBoundingClientRect().top;
                    // Scroll only if the top of the iframe is out of view
                    if (elementTopInParent < 0) {
                        iframe.scrollIntoView({ behavior: 'auto' });
                    }
                }
            };
            window.addEventListener('message', receiveMessage, false);
        }
        iframe.src = iframeSrc.toString();
        iframe.allow = 'microphone; camera; geolocation';
        iframe.style.border = '0px';
        if (isFullScreen) {
            iframe.style.borderRadius = '0px';
            iframe.style.width = '100vw';
            iframe.style.height = '100vh';
            iframe.style.display = 'block';
        }
        iframe.title = isBillingPortal ? 'Billing Portal' : `${offerPublicIdentifier}`;

        // Store embed ID and offer/portal marker for session tracking
        target.setAttribute('data-numi-embed-id', embedId);
        if (isBillingPortal) {
            target.setAttribute('data-numi-portal', 'billing-portal');
            target.removeAttribute('data-numi-offer');
        } else {
        target.setAttribute('data-numi-offer', offerPublicIdentifier);
            target.removeAttribute('data-numi-portal');
        }

        // Register embed type for session tracking
        embedTypeRegistry.set(embedId, isFullScreen ? 'fullscreen' : 'standard');

        iframe.addEventListener('load', () => {
            if (standardLoading) {
                standardLoading.style.display = 'none';
            }
            if (isFullScreen) {
                standardContainer.style.opacity = '1';
            }
        }, true);
        iframeContainer.appendChild(iframe);
        if (isFullScreen) {
            // Add a close button
            const closeIcon = document.createElement('a');
            closeIcon.className = 'numi-embed-fullscreen-close-icon';
            closeIcon.innerHTML = XIcon;
            Object.assign(closeIcon.style, {
                position: 'absolute',
                top: '32px',
                right: '32px',
                width: '32px',
                height: '32px',
                background: '#171717',
                color: '#fff',
                borderRadius: '50%',
                padding: '6px',
                zIndex: '1000000001',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                opacity: '0.9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s',
            });
            closeIcon.onclick = (e) => {
                e.preventDefault();
                document.body.classList.remove('noscroll');
                standardContainer.style.opacity = '0';
                setTimeout(() => {
                    standardContainer.remove();
                }, 250);
            };
            iframeContainer.appendChild(closeIcon);
            // Show modal
            document.body.appendChild(standardContainer);
            document.body.classList.add('noscroll');
            setTimeout(() => {
                standardContainer.style.opacity = '1';
            }, 10);
        } else {
            target.appendChild(standardContainer);
            standardContainer.style.opacity = '1';
        }
        // so that any other script imports don't accidentally try initializing
        // this again
        target.setAttribute('data-numi-initialized', 'true');
    };
    // =============================================================================
    // UNIFIED SPA-SAFE INITIALIZER (supports only data-numi-embed-type and data-plandalf)
    // =============================================================================

    const ensureStyles = (kind) => {
        try {
            if (kind === 'popup') {
    // @ts-ignore
                if (!window.__numiPopupEmbedsInitialized) {
                    const s = document.createElement('style');
                    s.innerHTML = popupStyles;
                    document.head.appendChild(s);
            // @ts-ignore
            window.__numiPopupEmbedsInitialized = true;
        }
            } else if (kind === 'slider') {
                // @ts-ignore
                if (!window.__numiSlidersInitialized) {
                    const s = document.createElement('style');
                    s.innerHTML = sliderStyles;
                    document.head.appendChild(s);
                    // @ts-ignore
                    window.__numiSlidersInitialized = true;
                }
            } else if (kind === 'standard' || kind === 'fullscreen') {
        // @ts-ignore
                if (!window.__numiStandardInitialized) {
                    const s = document.createElement('style');
                    s.innerHTML = standardStyles;
                    document.head.appendChild(s);
            // @ts-ignore
                    window.__numiStandardInitialized = true;
                }
                if (kind === 'fullscreen') {
                    // @ts-ignore
                    window.__numiFullScreenInitialized = true;
                }
            }
        } catch (_) {}
    };

    const __numiInitEmbedsIn = (root = document) => {
        const $all = (sel) => (root && root.querySelectorAll ? root.querySelectorAll(sel) : []);
        const asArray = (nl) => Array.prototype.slice.call(nl || []);

        // 1) Initialize elements by data-numi-embed-type
        const candidates = asArray($all('[data-numi-embed-type]'));
        if (root instanceof HTMLElement && root.hasAttribute && root.hasAttribute('data-numi-embed-type')) {
            candidates.unshift(root);
        }

        for (const el of candidates) {
            if (!(el instanceof HTMLElement)) continue;
            if (el.dataset.numiInitialized !== undefined || el.getAttribute('data-numi-initialized') === 'true') {
                continue; // idempotent
            }

            const type = (el.getAttribute('data-numi-embed-type') || '').toLowerCase();
            if (type === 'popup') {
                ensureStyles('popup');
                initializePopupLikeTarget(el, 'popup');
            } else if (type === 'slider') {
                ensureStyles('slider');
                initializePopupLikeTarget(el, 'slider');
            } else if (type === 'standard') {
                ensureStyles('standard');
                initializeStandardTarget(el);
            } else if (type === 'fullscreen') {
                ensureStyles('fullscreen');
                initializeStandardTarget(el, true);
            }
        }

        // 2) data-plandalf API (present-offer, mount-offer, mount-portal, mount-widget)
        const plandalfTargets = asArray($all('[data-plandalf]'));
        if (root instanceof HTMLElement && root.hasAttribute && root.hasAttribute('data-plandalf')) {
            plandalfTargets.unshift(root);
        }

        for (const el of plandalfTargets) {
            if (!(el instanceof HTMLElement)) continue;
            if (el.dataset.numiInitialized !== undefined || el.getAttribute('data-numi-initialized') === 'true') {
                continue; // already processed
            }
            const mode = (el.getAttribute('data-plandalf') || '').toLowerCase();
            const sizeAttr = (el.getAttribute('data-size') || el.getAttribute('data-plandalf-size') || '').toLowerCase();
            const mapSize = (s) => (s === 'sm' || s === 'small') ? 'small' : (s === 'md' || s === 'medium') ? 'medium' : 'large';
            const domainAttr = el.getAttribute('data-domain') || el.getAttribute('data-plandalf-domain') || (window.plandalfConfig && window.plandalfConfig.domain) || '';
            const normalizedDomain = (function(v){
                if (!v) return '';
                try {
                    const origin = /^https?:\/\//i.test(v) ? new URL(v).origin : `https://${v}`;
                    return origin.replace(/^https?:\/\//i, '').replace(/\/$/, '');
                } catch(_) { return ''; }
            })(domainAttr);

            if (mode === 'present-offer') {
                const offerId = el.getAttribute('data-offer-id') || '';
                if (!offerId) continue;
                const embedTypeAttr = (el.getAttribute('data-embed-type') || 'popup').toLowerCase();
                if (embedTypeAttr === 'slider') { ensureStyles('slider'); } else { ensureStyles('popup'); }
                if (el.__plandalfPresentOfferBound) continue;
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const ds = el.dataset || {};
                    window.plandalf.presentOffer(offerId, {
                        size: mapSize(sizeAttr || 'large'),
                        domain: normalizedDomain || undefined,
                        currency: ds.currency || undefined,
                        interval: ds.interval || undefined,
                        redirect_url: ds.redirectUrl || undefined,
                        env: (ds.env || '').toLowerCase() || undefined,
                        customer: ds.customer || undefined,
                        items: ds.items || undefined,
                        price: ds.price || undefined,
                        inheritParameters: el.hasAttribute('data-inherit-parameters') || el.hasAttribute('data-plandalf-inherit-parameters'),
                        dynamicResize: el.hasAttribute('data-dynamic-resize') || el.hasAttribute('data-plandalf-dynamic-resize'),
                        preview: el.hasAttribute('data-preview') || el.hasAttribute('data-plandalf-preview'),
                        embedType: embedTypeAttr,
                        sliderDirection: (ds.sliderDirection || ds.direction || 'right')
                    });
                });
                el.__plandalfPresentOfferBound = true;
                el.setAttribute('data-numi-initialized', 'true');
            } else if (mode === 'mount-offer') {
                ensureStyles('standard');
                const offerId = el.getAttribute('data-offer-id') || el.getAttribute('data-plandalf-offer') || '';
                if (!offerId) continue;

                // Temporarily disconnect observer to prevent infinite loop
    // @ts-ignore
                const obs = window.__numiObserver;
                if (obs) obs.disconnect();

                el.setAttribute('data-numi-embed-type', 'standard');
                el.setAttribute('data-numi-offer', offerId);
                if (normalizedDomain) el.setAttribute('data-numi-domain', normalizedDomain);
                if (!el.hasAttribute('data-numi-dynamic-resize')) el.setAttribute('data-numi-dynamic-resize', 'true');

                // Reconnect observer
                if (obs) {
                    const observerTarget = document.documentElement || document;
                    obs.observe(observerTarget, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: [
                            'data-numi-embed-type',
                            'data-numi-portal',
                            'data-plandalf',
                            'data-numi-initialized',
                        ],
                    });
                }

                initializeStandardTarget(el);
                el.setAttribute('data-numi-initialized', 'true');
            } else if (mode === 'mount-portal' || mode === 'mount-portal-inline') {
                ensureStyles('standard');
                const customerLike = el.getAttribute('data-customer') || el.getAttribute('data-id') || (window.plandalfConfig && window.plandalfConfig.customer) || '';
                const returnUrl = el.getAttribute('data-return-url') || '';

                // Temporarily disconnect observer to prevent infinite loop
            // @ts-ignore
                const obs = window.__numiObserver;
                if (obs) obs.disconnect();

                el.setAttribute('data-numi-embed-type', 'standard');
                el.setAttribute('data-numi-portal', 'billing');
                if (customerLike) el.setAttribute('data-numi-customer', customerLike);
                if (returnUrl) el.setAttribute('data-numi-return-url', returnUrl);
                if (normalizedDomain) el.setAttribute('data-numi-domain', normalizedDomain);
                if (!el.hasAttribute('data-numi-dynamic-resize')) el.setAttribute('data-numi-dynamic-resize', 'true');

                // Reconnect observer
                if (obs) {
                    const observerTarget = document.documentElement || document;
                    obs.observe(observerTarget, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: [
                            'data-numi-embed-type',
                            'data-numi-portal',
                            'data-plandalf',
                            'data-numi-initialized',
                        ],
                    });
                }

                initializeStandardTarget(el);
                el.setAttribute('data-numi-initialized', 'true');
            } else if (mode === 'mount-widget') {
                ensureStyles('standard');
                const widgetId = el.getAttribute('data-widget-id') || el.getAttribute('data-id') || 'pricing';
                const widgetType = el.getAttribute('data-widget-type') || 'pricing-table';
                const opts = { widgetId, widgetType: widgetType, type: widgetType };
                if (normalizedDomain) opts.domain = normalizedDomain;
                if (window.plandalf?.widgets?.mount) {
                    window.plandalf.widgets.mount(el, opts);
                }
                el.setAttribute('data-numi-initialized', 'true');
            }
        }
    };

    // Expose manual re-scan for SPA frameworks
    try {
        window.plandalf = window.plandalf || {};
        window.plandalf.initEmbeds = (root) => __numiInitEmbedsIn(root || document);
    } catch (_) {}

    // First scan (head-safe) and DOM-ready
    const __numiDoInitialScan = () => { try { __numiInitEmbedsIn(document); } catch (_) {} };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', __numiDoInitialScan, { once: true });
    } else {
        __numiDoInitialScan();
    }

    // Observe SPA mutations and relevant attribute changes
    try {
        const observerTarget = document.documentElement || document;
        const mo = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'childList') {
                    m.addedNodes && m.addedNodes.forEach((n) => {
                        if (!(n && n.nodeType === 1)) return;
                        const el = n;
                        // Only initialize if the node or its subtree contains our attributes
                        const hasEmbed = (el.matches && (el.matches('[data-numi-embed-type], [data-plandalf]')))
                            || (el.querySelector && el.querySelector('[data-numi-embed-type], [data-plandalf]'));
                        if (hasEmbed) {
                            __numiInitEmbedsIn(el);
                        }
                    });
                } else if (m.type === 'attributes' && m.target) {
                    const target = m.target;
                    // Only react if the changed attribute is one we care about
                    if (m.attributeName === 'data-numi-embed-type' || m.attributeName === 'data-plandalf' || m.attributeName === 'data-numi-portal' || m.attributeName === 'data-numi-initialized') {
                        __numiInitEmbedsIn(target);
                    }
                }
            }
        });
        mo.observe(observerTarget, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'data-numi-embed-type',
                'data-numi-portal',
                'data-plandalf',
                'data-numi-initialized',
            ],
        });
        // @ts-ignore
        window.__numiObserver = mo;
    } catch (_) {}


    // =============================================================================
    // PLANDALF SESSION-BASED API
    // =============================================================================

    // Checkout Session - represents one complete checkout flow
    class CheckoutSession {
        constructor(data) {
            this.id = data.checkoutId;
            this.embedId = data.embedId;
            this.offerId = data.offerId;
            this.embedType = data.embedType; // 'popup', 'slider', 'standard'
            this.context = data.context || 'offer'; // 'offer' | 'portal' | 'widget'
            this.startTime = Date.now();
            this.events = [];
            this._callbacks = {};
            this.isActive = true;
            this.isCompleted = false;
            this.isCancelled = false;
            this.currentPage = null;
            this.formHeight = null;
        }

        // Unified event listener - supports callback or promise
        on(events, callback) {
            const eventArray = Array.isArray(events) ? events : [events];

            if (callback && typeof callback === 'function') {
                // Callback style
                eventArray.forEach(eventType => {
                    if (!this._callbacks[eventType]) {
                        this._callbacks[eventType] = [];
                    }
                    this._callbacks[eventType].push(callback);
                });
                return this;
            } else {
                // Promise style
                return new Promise((resolve, reject) => {
                    let resolved = false;

                    const oneTimeCallback = (data) => {
                        if (!resolved) {
                            resolved = true;
                            resolve({
                                ...data,
                                session: this,
                                sessionDuration: Date.now() - this.startTime,
                                eventType: data.type
                            });
                        }
                    };

                    eventArray.forEach(eventType => this.on(eventType, oneTimeCallback));

                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            reject(new Error(`Session ${this.id} timeout waiting for: ${eventArray.join(', ')}`));
                        }
                    }, 600000); // 10 minutes
                });
            }
        }

        // Specific event methods
        onInit(callback) { return this.on('init', callback); }
        onPageChange(callback) { return this.on('page_change', callback); }
        onPaymentInit(callback) { return this.on('payment_init', callback); }
        onSubmit(callback) { return this.on('submit', callback); }
        onSuccess(callback) { return this.on('success', callback); }
        onComplete(callback) { return this.on('complete', callback); }
        onCancel(callback) { return this.on('cancel', callback); }
        onClosed(callback) { return this.on('closed', callback); }
        onLineItemChange(callback) { return this.on('lineitem_change', callback); }
        onResize(callback) { return this.on('resize', callback); }
        onShown(callback) { return this.on('shown', callback); }
        onError(callback) { return this.on('error', callback); }

        // Convenience methods
        async waitForCompletion() {
            await this.on('success');
            return this.on('complete');
        }

        async waitForSubmission() {
            return this.on('submit');
        }

        async waitForSuccess() {
            return this.on('success');
        }

        async waitForAnyCompletion() {
            return this.on(['success', 'complete']);
        }

        // Get current session state
        getState() {
            return {
                sessionId: this.id,
                offerId: this.offerId,
                embedId: this.embedId,
                duration: Date.now() - this.startTime,
                currentPage: this.currentPage,
                formHeight: this.formHeight,
                events: this.events,
                isActive: this.isActive,
                isInitialized: this.events.some(e => e.type === 'init'),
                isSubmitted: this.events.some(e => e.type === 'submit'),
                isSuccessful: this.events.some(e => e.type === 'success'),
                isComplete: this.events.some(e => e.type === 'complete')
            };
        }

        // Internal: trigger event
        _triggerEvent(eventType, data) {
            const eventData = {
                ...data,
                type: eventType,
                sessionId: this.id,
                timestamp: Date.now(),
                // Convenience payload for external handlers expecting data.checkout.id
                checkout: { id: this.id }
            };

            this.events.push(eventData);

            // Update session state
            if (eventType === 'page_change') {
                this.currentPage = data.pageId;
            } else if (eventType === 'resize') {
                this.formHeight = data.size;
            } else if (eventType === 'success' || eventType === 'complete') {
                this.isCompleted = true;
                if (eventType === 'complete') {
                    this.isActive = false;
                }
            } else if (eventType === 'cancel') {
                this.isCancelled = true;
                this.isActive = false;
            }

            // Trigger callbacks
            if (this._callbacks[eventType]) {
                this._callbacks[eventType].forEach(callback => {
                    try {
                        callback({
                            ...eventData,
                            sessionContext: this.context,
                            sessionType: this.context === 'portal' ? 'PortalSession' : this.context === 'widget' ? 'WidgetSession' : 'CheckoutSession'
                        });
                    } catch (err) {
                        plandalf.error(`[Plandalf] Error in session ${this.id} ${eventType} callback:`, err);
                    }
                });
            }
        }
    }

    class OfferWaiter {
        constructor(selector) {
            this.selector = selector;
            this._sessionCallbacks = [];
            window.plandalf.offers._addWaiter(this);
        }

        // Listen for new checkout sessions
        onCheckout(callback) {
            if (callback && typeof callback === 'function') {
                this._sessionCallbacks.push(callback);
                return this;
            } else {
                return new Promise((resolve, reject) => {
                    const oneTimeCallback = (session) => resolve(session);
                    this._sessionCallbacks.push(oneTimeCallback);

                    setTimeout(() => {
                        reject(new Error(`Timeout waiting for checkout on pattern: ${this.selector}`));
                    }, 300000);
                });
            }
        }

        // Convenience methods
        async onAnyInit() {
            const session = await this.onCheckout();
            return session.onInit();
        }

        async onAnySuccess() {
            const session = await this.onCheckout();
            return session.onSuccess();
        }

        async onAnyComplete() {
            const session = await this.onCheckout();
            return session.onComplete();
        }

        _matches(offerId) {
            if (typeof this.selector === 'string') {
                if (this.selector === '*') return true;
                if (this.selector.includes('*')) {
                    const pattern = this.selector.replace(/\*/g, '.*');
                    return new RegExp(`^${pattern}$`).test(offerId);
                }
                return this.selector === offerId;
            }
            if (Array.isArray(this.selector)) {
                return this.selector.includes(offerId);
            }
            return false;
        }

        _checkSession(session) {
            if (this._matches(session.offerId)) {
                this._sessionCallbacks.forEach(callback => {
                    try {
                        callback(session);
                    } catch (err) {
                        plandalf.error('[Plandalf] Error in session callback:', err);
                    }
                });
            }
        }
    }

    class PlandalfOffer {
        constructor(offerId, options = {}) {
            this.offerId = offerId;
            this.options = options;
            this.embedId = null;
            this.isVisible = false;
            this.currentSession = null;
        }

        show(overrideOptions = {}) {
            const finalOptions = { ...this.options, ...overrideOptions };

            if (!this.embedId) {
                this.embedId = this._createEmbed(finalOptions);
            }

            this._showEmbed();
            this.isVisible = true;

            // Return promise that resolves with the checkout session
            return new Promise((resolve, reject) => {
                const checkForSession = () => {
                    const session = window.plandalf.offers._sessions.get(this.embedId);
                    if (session) {
                        this.currentSession = session;
                        resolve(session);
                    } else {
                        setTimeout(checkForSession, 100);
                    }
                };
                checkForSession();

                setTimeout(() => reject(new Error('Timeout waiting for session')), 10000);
            });
        }

        hide() {
            this._hideEmbed();
            this.isVisible = false;
            return this;
        }

        getSession() {
            return this.currentSession;
        }

        // Placeholder methods - would be implemented with actual embed creation
        _createEmbed(options) {
            return generateEmbedId();
        }

        _showEmbed() {
            // Implementation would trigger the actual embed showing
        }

        _hideEmbed() {
            // Implementation would hide the embed
        }
    }

    // Global Plandalf API (merge without overwriting existing methods like log/warn/error/initEmbeds)
    window.plandalf = Object.assign(window.plandalf || {}, {
        offers: {
            get(selector) {
                return new OfferWaiter(selector);
            },

            show(selector, options = {}) {
                if (typeof selector === 'string' && !selector.includes('*') && !Array.isArray(selector)) {
                    return this.create(selector, options).show();
                } else {
                    return this.get(selector).show(options);
                }
            },

            create(offerId, options = {}) {
                if (!this._instances[offerId]) {
                    this._instances[offerId] = new PlandalfOffer(offerId, options);
                }
                return this._instances[offerId];
            },

            _instances: {},
            _sessions: new Map(),
            _waiters: [],

            _addWaiter(waiter) {
                this._waiters.push(waiter);
            },

            _notifyWaiters(session) {
                // Only notify for offer sessions
                if (session && (session.context === 'offer' || session.context === undefined)) {
                this._waiters.forEach(waiter => waiter._checkSession(session));
                }
            }
        },
        widgets: {
            // Placeholder Widgets API (pricing pages/tables)
            mount(el, options = {}) {
                if (!(el instanceof HTMLElement)) throw new Error('widgets.mount: el must be HTMLElement');
                const globalConfig = (typeof window !== 'undefined' && window.plandalfConfig) ? window.plandalfConfig : {};
                const widgetId = options.widgetId || el.getAttribute('data-widget-id') || 'pricing';
                const widgetType = options.type || el.getAttribute('data-widget-type') || 'pricing-table';
                const domainHost = (function(domain){
                    if (!domain) return '';
                    try { return (/^https?:\/\//i.test(domain) ? new URL(domain).origin : `https://${domain}`).replace(/^https?:\/\//i, '').replace(/\/$/, ''); } catch(_) { return ''; }
                })(options.domain || globalConfig.domain);

                el.setAttribute('data-numi-embed-type', 'standard');
                el.setAttribute('data-numi-widget', 'true');
                if (domainHost) el.setAttribute('data-numi-domain', domainHost);

                // Reuse standard target with widget mode
                const iframeContainer = document.createElement('div');
                iframeContainer.className = 'numi-embed-iframe-container';
                const iframe = document.createElement('iframe');
                const iframeSrc = getSharedIframeSrc(domainHost, widgetId, false, el, { mode: 'widget', widgetType, widgetId });
                const embedId = generateEmbedId();
                iframeSrc.searchParams.append('embed-id', `${embedId}`);
                iframeSrc.searchParams.append('embed-type', 'standard');
                el.setAttribute('data-numi-embed-id', embedId);
                embedTypeRegistry.set(embedId, 'standard');
                iframe.src = iframeSrc.toString();
                iframe.allow = 'payment; geolocation';
                iframe.style.border = '0px';
                iframe.title = `Widget: ${widgetType}`;
                iframeContainer.appendChild(iframe);
                el.innerHTML = '';
                el.appendChild(iframeContainer);
                el.setAttribute('data-numi-initialized', 'true');
                return embedId;
            }
        }
    });

    // Present an offer programmatically in a modal popup/slider
    // Usage: plandalf.presentOffer('offerId', { size: 'lg'|'md'|'sm', domain, inheritParameters, dynamicResize, preview, embedType: 'popup'|'slider', sliderDirection: 'left'|'right' })
    window.plandalf.presentOffer = function(offerId, options = {}) {
        const mapSize = (s) => {
            if (!s) return 'large';
            const v = String(s).toLowerCase();
            if (v === 'sm' || v === 'small') return 'small';
            if (v === 'md' || v === 'medium') return 'medium';
            return 'large';
        };

        // Determine embed type (default popup) and ensure the correct stylesheet is injected
        const embedType = (options.embedType || 'popup').toString().toLowerCase();
        try {
            if (embedType === 'slider') {
                // @ts-ignore
                if (!window.__numiSlidersInitialized) {
                    const sliderStylesheet = document.createElement('style');
                    sliderStylesheet.innerHTML = sliderStyles;
                    document.head.appendChild(sliderStylesheet);
                    // @ts-ignore
                    window.__numiSlidersInitialized = true;
                }
            } else {
                // @ts-ignore
                if (!window.__numiPopupEmbedsInitialized) {
                    const popupStylesheet = document.createElement('style');
                    popupStylesheet.innerHTML = popupStyles;
                    document.head.appendChild(popupStylesheet);
                    // @ts-ignore
                    window.__numiPopupEmbedsInitialized = true;
                }
            }
        } catch (_) {}

        const btn = document.createElement('button');
        btn.setAttribute('data-numi-embed-type', embedType === 'slider' ? 'slider' : 'popup');
        // Optional slider direction (default right)
        if (embedType === 'slider') {
            const dir = ((options.sliderDirection || 'right') + '').toLowerCase() === 'left' ? 'left' : 'right';
            btn.setAttribute('data-numi-slider-direction', dir);
        }
        btn.setAttribute('data-numi-offer', offerId);
        btn.setAttribute('data-numi-popup-size', mapSize(options.size));
        if (options.domain) {
            // Accept full origin or host
            try {
                const origin = /^https?:\/\//i.test(options.domain) ? new URL(options.domain).origin : `https://${options.domain}`;
                btn.setAttribute('data-numi-domain', origin.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
            } catch(_) {}
        }
        if (options.inheritParameters) btn.setAttribute('data-numi-inherit-parameters', 'true');
        if (options.dynamicResize) btn.setAttribute('data-numi-dynamic-resize', 'true');
        if (options.preview) btn.setAttribute('data-numi-preview', 'true');
        // Forward common checkout params to the temporary trigger element
        if (options.currency) btn.setAttribute('data-currency', String(options.currency));
        if (options.interval) btn.setAttribute('data-interval', String(options.interval));
        if (options.redirect_url) btn.setAttribute('data-redirect_url', String(options.redirect_url));
        if (options.env) btn.setAttribute('data-env', String(options.env));
        if (options.customer) {
            if (typeof options.customer === 'string') {
                btn.setAttribute('data-customer', options.customer);
            } else if (typeof options.customer === 'object') {
                try {
                    const parts = [];
                    for (const k in options.customer) {
                        if (!Object.prototype.hasOwnProperty.call(options.customer, k)) continue;
                        const v = options.customer[k];
                        if (v === undefined || v === null) continue;
                        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
                    }
                    if (parts.length > 0) {
                        btn.setAttribute('data-customer', parts.join('&'));
                    }
                } catch(_) {
                    btn.setAttribute('data-customer', String(options.customer));
                }
            } else {
                btn.setAttribute('data-customer', String(options.customer));
            }
        }
        // Optional: pass JWT customer token directly for offer checkouts
        if (options.customerToken && typeof options.customerToken === 'string') {
            btn.setAttribute('data-numi-customer-token', options.customerToken);
        }
        if (options.items) {
            // Expect a URL-encoded string (e.g., items[0][lookup_key]=price_xxx&items[0][quantity]=1)
            if (typeof options.items === 'string') {
                btn.setAttribute('data-items', options.items);
            }
        }
        if (options.price && !options.items) {
          btn.setAttribute('data-items', `items[0][lookup_key]=${options.price}&items[0][quantity]=1`);
        }

        initializePopupLikeTarget(btn, embedType === 'slider' ? 'slider' : 'popup');

        const embedId = btn.getAttribute('data-numi-embed-id');
        // Store mapping for legacy-only environments where messages lack embedId
        try {
            if (embedId) {
                // Mark the last opened embedId globally for fallback lookup
                window.__plandalfLastEmbedId = embedId;
            }
        } catch (_) {}
        // Trigger open immediately
        if (typeof btn.onclick === 'function') {
            btn.onclick();
        } else {
            btn.click();
        }

        // Return a promise resolving to the checkout session
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const session = window.plandalf?.offers?._sessions?.get(embedId);
                if (session) {
                    resolve(session);
                    return;
                }
                if (Date.now() - start > 10000) {
                    reject(new Error('Timeout waiting for session init'));
                    return;
                }
                setTimeout(check, 100);
            };
            check();
        });
    };

    // Portals namespace (listening and future controls)
    window.plandalf.portals = {
        _waiters: [],
        get(selector) {
            return new OfferWaiter(selector); // Reuse waiter; filtering happens on notify
        },
        _addWaiter(waiter) {
            this._waiters.push(waiter);
        },
        _notifyWaiters(session) {
            if (session && session.context === 'portal') {
                this._waiters.forEach(waiter => waiter._checkSession(session));
            }
        }
    };

    // Programmatic inline mount for billing portal
    // plandalf.mountPortal(element, { customer, returnUrl, domain, inheritParameters, preview })
    window.plandalf.mountPortal = function(el, options = {}) {
        if (!(el instanceof HTMLElement)) {
            throw new Error('mountPortal: "el" must be an HTMLElement');
        }
        const globalConfig = (typeof window !== 'undefined' && window.plandalfConfig) ? window.plandalfConfig : {};
        const customer = options.customer
          || globalConfig.customer
          || el.getAttribute('data-customer')
          || el.getAttribute('data-id')
          || '';
        const returnUrl = options.returnUrl || el.getAttribute('data-return-url') || '';
        let domainHost = '';
        if (options.domain) {
            try { domainHost = (/^https?:\/\//i.test(options.domain) ? new URL(options.domain).origin : `https://${options.domain}`).replace(/^https?:\/\//i, '').replace(/\/$/, ''); } catch(_) {}
        } else if (globalConfig.domain) {
            try { domainHost = (/^https?:\/\//i.test(globalConfig.domain) ? new URL(globalConfig.domain).origin : `https://${globalConfig.domain}`).replace(/^https?:\/\//i, '').replace(/\/$/, ''); } catch(_) {}
        }

        el.setAttribute('data-numi-embed-type', 'standard');
        el.setAttribute('data-numi-portal', 'billing');
        if (customer) el.setAttribute('data-numi-customer', customer);
        if (returnUrl) el.setAttribute('data-numi-return-url', returnUrl);
        if (domainHost) el.setAttribute('data-numi-domain', domainHost);
        // default to dynamic resizing for inline portal
        if (!el.hasAttribute('data-numi-dynamic-resize')) el.setAttribute('data-numi-dynamic-resize', 'true');

        initializeStandardTarget(el);
        return el.getAttribute('data-numi-embed-id');
    };

    // Enhanced message handler for session tracking
    const plandalfReceiveMessage = (event) => {
        if (!event.data || event.data.source !== 'plandalf') return;

        // Collapsed logging
        // logging disabled

        const { type, data } = event.data;

        // Try multiple ways to extract embedId with concise logs
        // logging disabled

        let embedId = event.data.embedId || data?.embedId || data?.data?.embedId;
        // logging disabled

        // If still no embedId, try to extract from the iframe source
        if (!embedId && event.source && event.source.location) {
            try {
                const iframeUrl = new URL(event.source.location.href);
                embedId = iframeUrl.searchParams.get('embed-id') || iframeUrl.searchParams.get('numi-embed-id');
                // logging disabled
            } catch (e) {
                // logging disabled
            }
        }

        // Last resort: try to find iframe by matching the event source
        if (!embedId && event.source) {
            const iframes = document.querySelectorAll('iframe[src*="embed-id"], iframe[src*="numi-embed-id"]');
            // logging disabled
            for (const iframe of iframes) {
                if (iframe.contentWindow === event.source) {
                    const srcUrl = new URL(iframe.src);
                    embedId = srcUrl.searchParams.get('embed-id') || srcUrl.searchParams.get('numi-embed-id');
                    // logging disabled
                    break;
                }
            }
        }

        // Fallback: if still missing, use last opened embed id
        if (!embedId && window.__plandalfLastEmbedId) {
            embedId = window.__plandalfLastEmbedId;
            // logging disabled
        }


        // Debug logging (only when debugging)
        // logging disabled

        // Handle session initialization
        if (type === 'on_init') {
            // logging disabled

            const offerId = data.offerId || data.data?.offerId || findOfferIdFromEmbedId(embedId);
            const checkoutId = data.checkoutId || data.data?.checkoutId || data.session?.id || data.data?.session?.id || embedId;

            // logging disabled

            const context = findContextFromEmbedId(embedId);
            const session = new CheckoutSession({
                checkoutId: checkoutId,
                embedId: embedId,
                offerId: offerId,
                embedType: embedTypeRegistry.get(embedId) || 'unknown',
                context: context
            });

            window.plandalf.offers._sessions.set(embedId, session);
            // logging disabled
            // Notify waiters based on context
            if (context === 'portal') {
                if (window.plandalf?.portals?._notifyWaiters) {
                    window.plandalf.portals._notifyWaiters(session);
                }
            } else {
            window.plandalf.offers._notifyWaiters(session);
            }

            // Trigger init event with enhanced data
            const eventData = {
                ...data,
                ...(data.data || {}),
                checkoutId: checkoutId,
                offerId: offerId,
                embedId: embedId
            };
            session._triggerEvent('init', eventData);

            // If an overlay is already active and does not match this embed, reject this session early.
            try {
                if (isOverlayActive() && window.__plandalfActiveOverlay.embedId !== embedId && (session.embedType === 'popup' || session.embedType === 'slider')) {
                    plandalf.warn('[Plandalf] Rejecting secondary popup/slider session while another is active', {
                        active: window.__plandalfActiveOverlay,
                        rejected: { embedId, type: session.embedType }
                    });
                    // Send a cancel + closed to keep external listeners consistent
                    session._triggerEvent('cancel', { cancelReason: 'secondary_overlay_blocked' });
                    session._triggerEvent('closed', { embedType: session.embedType, wasCompleted: false, embedId, sessionId: session.id });
                    return;
                }
            } catch (_) {}

            // Fire 'shown' if popup/slider was opened before session existed
            try {
                if (pendingShownEmbeds.has(embedId)) {
                    pendingShownEmbeds.delete(embedId);
                    session._triggerEvent('shown', { embedId, offerId, sessionId: checkoutId });
                }
            } catch (_) {}
            return;
        }

        // Route events to existing session
        const session = window.plandalf.offers._sessions.get(embedId);
        if (session) {
            // logging disabled

            // Map event types
            const eventMap = {
                'page_change': 'page_change',
                'payment_init': 'payment_init',
                'checkout_submit': 'submit',
                'checkout_success': 'success',
                'checkout_complete': 'complete',
                'checkout_cancel': 'cancel',
                'checkout_closed': 'closed',
                'checkout_lineitem_changed': 'lineitem_change',
                'form_resized': 'resize',
                // Optional error channel if emitted by the iframe
                'checkout_error': 'error'
            };

            const eventType = eventMap[type] || type;
            // logging disabled

            // Enhance event data with session context
            const eventData = {
                ...data,
                ...(data.data || {}),
                sessionId: session.id,
                offerId: session.offerId,
                embedId: embedId
            };

            // logging disabled

            session._triggerEvent(eventType, eventData);
            // Release overlay when closed/complete/cancel for this embed
            if (eventType === 'closed' || eventType === 'complete' || eventType === 'cancel') {
                clearActiveOverlayIf(embedId);
            }
        } else {
            plandalf.warn(`⚠️ No session found for embedId: ${embedId}`);
            plandalf.log('Available sessions:', Array.from(window.plandalf?.offers?._sessions?.keys() || []));
        }
    };

    // Helper to find offer ID from embed ID
    const findOfferIdFromEmbedId = (embedId) => {
        const element = document.querySelector(`[data-numi-embed-id="${embedId}"]`);
        // Prefer offer for checkout embeds; for billing portal use portal marker
        return element?.dataset.numiOffer || element?.dataset.numiPortal || 'unknown';
    };

    // Determine context from embed id: 'offer' | 'portal' | 'widget'
    const findContextFromEmbedId = (embedId) => {
        const element = document.querySelector(`[data-numi-embed-id="${embedId}"]`);
        if (!element || !element.dataset) return 'offer';
        if (element.dataset.numiPortal === 'billing' || element.dataset.numiPortal === 'billing-portal') return 'portal';
        if (element.dataset.numiWidget) return 'widget';
        return 'offer';
    };

    // Install the enhanced message listener
    if (!window.__plandalfSessionMessageListener) {
        window.addEventListener('message', plandalfReceiveMessage);
        window.__plandalfSessionMessageListener = true;
    }

    // =============================================================================
    // END PLANDALF SESSION-BASED API
    // =============================================================================

    // Process global configuration if provided
    const processGlobalConfig = () => {
        const config = window.plandalfConfig || {};

        // Set up global event listeners from config
        if (config.onInit) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onInit(config.onInit);
            });
        }
        // Alias onReady -> init for convenience
        if (config.onReady) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onInit(config.onReady);
            });
        }

        if (config.onSuccess) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onSuccess(config.onSuccess);
            });
        }

        if (config.onComplete) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onComplete(config.onComplete);
            });
        }

        if (config.onSubmit) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onSubmit(config.onSubmit);
            });
        }

        if (config.onPageChange) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onPageChange(config.onPageChange);
            });
        }

        if (config.onCancel) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onCancel(config.onCancel);
            });
        }

        if (config.onLineItemChange) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onLineItemChange(config.onLineItemChange);
            });
        }

        if (config.onClosed) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onClosed(config.onClosed);
            });
        }
        // Additional convenience hooks
        if (config.onShown) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onShown(config.onShown);
            });
        }
        if (config.onError) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onError(config.onError);
            });
        }
        if (config.onExit) {
            plandalf.offers.get('*').onCheckout((checkout) => {
                checkout.onClosed(config.onExit);
            });
        }

        // Per-offer configuration
        if (config.offers) {
            Object.entries(config.offers).forEach(([offerId, offerConfig]) => {
                plandalf.offers.get(offerId).onCheckout((checkout) => {
                    if (offerConfig.onInit) checkout.onInit(offerConfig.onInit);
                    if (offerConfig.onReady) checkout.onInit(offerConfig.onReady);
                    if (offerConfig.onSuccess) checkout.onSuccess(offerConfig.onSuccess);
                    if (offerConfig.onComplete) checkout.onComplete(offerConfig.onComplete);
                    if (offerConfig.onSubmit) checkout.onSubmit(offerConfig.onSubmit);
                    if (offerConfig.onPageChange) checkout.onPageChange(offerConfig.onPageChange);
                    if (offerConfig.onCancel) checkout.onCancel(offerConfig.onCancel);
                    if (offerConfig.onClosed) checkout.onClosed(offerConfig.onClosed);
                    if (offerConfig.onLineItemChange) checkout.onLineItemChange(offerConfig.onLineItemChange);
                    if (offerConfig.onShown) checkout.onShown(offerConfig.onShown);
                    if (offerConfig.onError) checkout.onError(offerConfig.onError);
                    if (offerConfig.onExit) checkout.onClosed(offerConfig.onExit);
                });
            });
        }
    };

    // Process configuration
    processGlobalConfig();


})();
