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
  opacity: 0;
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
    
    // Global tracking of embed types by embedId - must be declared early
    const embedTypeRegistry = new Map();
    
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
        const sliderDirection = element.dataset.numiSliderDirection === 'left' ? 'left' : 'right';
        const buttonSize = element.dataset.numiButtonSize || 'medium';
        const buttonColor = element.dataset.numiButtonColor || '#3b82f6';
        const popupSize = element.dataset.numiPopupSize || 'large';
        const hexToRgb = (hex) => {
            // just in case someone passes in rgba() format, which we used to use in
            // the past in the snippet
            if (typeof hex !== 'string' ||
                !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
                return [59, 130, 246]; // default color values for '#3b82f6'
            }
            let bigint = parseInt(hex.slice(1), 16);
            let r = (bigint >> 16) & 255;
            let g = (bigint >> 8) & 255;
            let b = bigint & 255;
            return [r, g, b];
        };
        const getLuminance = (hexColor) => {
            let [r, g, b] = hexToRgb(hexColor);
            // Calculate relative luminance
            // sRGB formula
            const getComponent = (color) => {
                color /= 255;
                return color <= 0.03928
                    ? color / 12.92
                    : Math.pow((color + 0.055) / 1.055, 2.4);
            };
            r = getComponent(r);
            g = getComponent(g);
            b = getComponent(b);
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        // smartly compute this to be black or white depending on the button color
        const buttonTextColor = getLuminance(buttonColor) > 0.5 ? 'black' : 'white';
        const config = {
            initialized: element.dataset.numiInitialized !== undefined,
            inheritParameters: element.dataset.numiInheritParameters !== undefined,
            dynamicResize: element.dataset.numiDynamicResize !== undefined,
            offerPublicIdentifier: element.dataset.numiOffer,
            buttonText: element.dataset.numiButtonText,
            buttonFloat: element.dataset.numiButtonFloat,
            buttonColor,
            buttonSize,
            buttonTextColor,
            sliderDirection,
            domain: element.dataset.numiDomain,
            popupSize,
            preview: element.dataset.numiPreview !== undefined,
        };

        console.log('NUMI-V1', { config, data: element.dataset })

        return config;
    };
    const getSharedIframeSrc = (configDomain, offerPublicIdentifier, inheritParameters, target) => {
        // 1. Use configDomain if set
        let domain = null;
        if (configDomain) {
            if (configDomain === 'localhost:8002') {
                domain = `http://${configDomain}`;
            } else {
                domain = `https://${configDomain}`;
            }
        } else {
            // 2. Try to get the domain from the script's own src
            let scriptSrc = null;
            if (typeof document !== 'undefined') {
                if (document.currentScript && document.currentScript.src) {
                    scriptSrc = document.currentScript.src;
                } else {
                    // Fallback: search for a script tag ending in /js/v1.js
                    const scripts = document.getElementsByTagName('script');
                    for (let i = 0; i < scripts.length; i++) {
                        if (scripts[i].src && scripts[i].src.match(/\/js\/v1\.js([?#].*)?$/)) {
                            scriptSrc = scripts[i].src;
                            break;
                        }
                    }
                }
            }
            if (scriptSrc) {
                try {
                    const url = new URL(scriptSrc, window.location.origin);
                    domain = url.origin;
                } catch (e) {
                    // ignore, fallback below
                }
            }
        }
        // 3. If still not set, use the domain argument (from config)
        if (!domain && target && target.dataset && target.dataset.numiDomain) {
            const fallbackDomain = target.dataset.numiDomain;
            if (fallbackDomain === 'localhost:8002') {
                domain = `http://${fallbackDomain}`;
            } else {
                domain = `https://${fallbackDomain}`;
            }
        }
        // 4. Final fallback
        if (!domain) {
            domain = 'https://plandalf.dev';
        }
        const formLink = `${domain}/o/${offerPublicIdentifier}`;
        const iframeSrc = new URL(formLink);
        // if we're passed the option to inherit search parameters, then we add
        // those here as well.
        if (inheritParameters) {
            const params = new URL(window.location.href).searchParams;
            for (const [key, value] of params.entries()) {
                iframeSrc.searchParams.append(key, value);
            }
        }
        // we convert data- attributes into URL parameters. we use the ones passed
        // directly to the embed as taking priority (since explicitly set)
        const DATA_PREFIX = 'data-';
        for (const attribute of target.attributes) {
            if (attribute.name.startsWith('data-') &&
                !attribute.name.startsWith('data-numi')) {
                iframeSrc.searchParams.append(attribute.name.slice(DATA_PREFIX.length), attribute.value);
            }
        }
        return iframeSrc;
    };
    // make popup/slider button
    const initializePopupButton = (element, onclick) => {
        // leave previous button snippet as it is
        if (element.tagName !== 'DIV') {
            element.onclick = onclick;
            return;
        }
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
        const { offerPublicIdentifier, initialized, inheritParameters, sliderDirection, domain, dynamicResize, popupSize, preview, } = getConfig(target);
        if (initialized)
            return;
        const popupContainer = document.createElement('div');
        popupContainer.className = dynamicResize
            ? `numi-embed-dynamic-${embedType}`
            : `numi-embed-${embedType}`;
        // Only set opacity 0 for popups, sliders need to be visible for their transform animations
        if (embedType === 'popup') {
            popupContainer.style.opacity = '0';
        }
        const popupLoading = document.createElement('div');
        popupLoading.className = 'numi-embed-loading';
        popupLoading.style.display = 'block';
        popupContainer.appendChild(popupLoading);
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'numi-embed-iframe-container';
        iframeContainer.style.opacity = '1';
        popupContainer.appendChild(iframeContainer);
        const iframe = document.createElement('iframe');
        const iframeSrc = getSharedIframeSrc(domain, offerPublicIdentifier, inheritParameters, target);
        const embedId = generateEmbedId();
        iframeSrc.searchParams.append('numi-embed-id', `${embedId}`);
        iframeSrc.searchParams.append('numi-embed-type', embedType);
        if (preview) {
            iframeSrc.searchParams.append('numi-embed-preview', 'yes');
        }
        const parentPage = getParentUrl();
        if (parentPage) {
            iframeSrc.searchParams.append('numi-embed-parent-page', parentPage);
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
        if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
            console.log('embedding plandalf iframe', iframeSrc.toString());
            console.log(`[Plandalf] Popup created with embedId: ${embedId}`);
        }
        iframe.allow = 'microphone; camera; geolocation';
        iframe.style.border = '0px';
        iframe.title = `${offerPublicIdentifier}`;
        
        // Store embed ID and offer ID for session tracking
        target.setAttribute('data-numi-embed-id', embedId);
        target.setAttribute('data-numi-offer', offerPublicIdentifier);
        
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
            if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                console.log(`[Plandalf] closePopup called with embedId: ${embedId}`);
            }
            // Fire cancel event before closing if there's an active session
            // Use embedId from closure scope since it's not set on iframe
            if (embedId && window.plandalf?.offers?._sessions?.has(embedId)) {
                const session = window.plandalf.offers._sessions.get(embedId);
                if (session) {
                    // Fire checkout_closed event for popup/slider closures
                    if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                        console.log(`[Plandalf] Firing closed event for embedId: ${embedId}, completed: ${session.isCompleted}`);
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
                            console.log(`[Plandalf] Firing cancel event for embedId: ${embedId}`);
                        }
                        session._triggerEvent('cancel', {
                            cancelReason: 'popup_closed',
                            embedId: embedId,
                            sessionId: session.id
                        });
                    }
                } else if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                    console.log(`[Plandalf] Session not found for embedId: ${embedId}`);
                }
            } else if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                console.log(`[Plandalf] No active sessions found for embedId: ${embedId}`, { 
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
            }
            else if (embedType === 'slider') {
                if (sliderDirection === 'left') {
                    iframeContainer.style.transform = 'translateX(-100%)';
                }
                else {
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
            document.body.appendChild(popupContainer);
            document.body.classList.add('noscroll');
            // Remove the manual opacity setting - let CSS animations handle it
            // The animations are already defined in CSS and will start automatically
        });
        target.setAttribute('data-numi-initialized', 'true');
    };
    const initializeStandardTarget = (target, isFullScreen) => {
        const { initialized, offerPublicIdentifier, inheritParameters, dynamicResize, domain, preview, } = getConfig(target);
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
        const iframeSrc = getSharedIframeSrc(domain, offerPublicIdentifier, inheritParameters, target);
        const embedId = generateEmbedId();
        iframeSrc.searchParams.append('numi-embed-id', `${embedId}`);
        const embedType = isFullScreen ? 'fullscreen' : 'standard';
        iframeSrc.searchParams.append('numi-embed-type', embedType);
        if (preview) {
            iframeSrc.searchParams.append('numi-embed-preview', 'yes');
        }
        const parentPage = getParentUrl();
        if (parentPage) {
            iframeSrc.searchParams.append('numi-embed-parent-page', parentPage);
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
        iframe.title = `${offerPublicIdentifier}`;
        
        // Store embed ID and offer ID for session tracking
        target.setAttribute('data-numi-embed-id', embedId);
        target.setAttribute('data-numi-offer', offerPublicIdentifier);
        
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
    // @ts-ignore
    const popupsInitialized = window.__numiPopupsInitialized;
    const popupTargets = document.querySelectorAll("[data-numi-embed-type='popup']");
    if (popupTargets.length > 0) {
        if (!popupsInitialized) {
            // add the popup stylesheet
            const popupStylesheet = document.createElement('style');
            popupStylesheet.innerHTML = popupStyles;
            document.head.appendChild(popupStylesheet);
            // @ts-ignore
            window.__numiPopupEmbedsInitialized = true;
        }
        popupTargets.forEach(target => {
            if (target instanceof HTMLElement) {
                initializePopupLikeTarget(target, 'popup');
            }
        });
    }

    // @ts-ignore
    const slidersInitialized = window.__numiSlidersInitialized;
    const sliderTargets = document.querySelectorAll("[data-numi-embed-type='slider']");
    if (sliderTargets.length > 0) {
        if (!slidersInitialized) {
            const sliderStylesheet = document.createElement('style');
            sliderStylesheet.innerHTML = sliderStyles;
            document.head.appendChild(sliderStylesheet);
            // @ts-ignore
            window.__numiSlidersInitialized = true;
        }
        sliderTargets.forEach(target => {
            if (target instanceof HTMLElement) {
                initializePopupLikeTarget(target, 'slider');
            }
        });
    }
    // @ts-ignore
    const standardInitialized = window.__numiStandardInitialized;
    const standardTargets = document.querySelectorAll("[data-numi-embed-type='standard']");
    if (standardTargets.length > 0) {
        if (!standardInitialized) {
            const standardStylesheet = document.createElement('style');
            standardStylesheet.innerHTML = standardStyles;
            // TODO mobile styles?

            document.head.appendChild(standardStylesheet);
            // @ts-ignore
            window.__numiStandardInitialized = true;
        }
        standardTargets.forEach(target => {
            if (target instanceof HTMLElement) {
                initializeStandardTarget(target);
            }
        });
    }
    console.log(standardTargets);

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
                timestamp: Date.now()
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
                        callback(eventData);
                    } catch (err) {
                        console.error(`[Plandalf] Error in session ${this.id} ${eventType} callback:`, err);
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
                        console.error('[Plandalf] Error in session callback:', err);
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

    // Global Plandalf API
    window.plandalf = {
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
                this._waiters.forEach(waiter => waiter._checkSession(session));
            }
        }
    };

    // Enhanced message handler for session tracking
    const plandalfReceiveMessage = (event) => {
        if (!event.data || event.data.source !== 'plandalf') return;
        
        // ALWAYS log the full event structure for debugging
        console.group(`🔍 [Plandalf] PostMessage Event: ${event.data.type}`);
        console.log('📦 Full event.data:', JSON.stringify(event.data, null, 2));
        console.log('📋 Raw event.data object:', event.data);
        console.groupEnd();
        
        const { type, data } = event.data;
        
        // Try multiple ways to extract embedId with detailed logging
        console.group('🔍 EmbedId Extraction Process');
        console.log('Method 1 - event.data.embedId:', event.data.embedId);
        console.log('Method 2 - data?.embedId:', data?.embedId);
        console.log('Method 3 - data?.data?.embedId:', data?.data?.embedId);
        
        let embedId = event.data.embedId || data?.embedId || data?.data?.embedId;
        console.log('🎯 Initial embedId result:', embedId);
        
        // If still no embedId, try to extract from the iframe source
        if (!embedId && event.source && event.source.location) {
            try {
                const iframeUrl = new URL(event.source.location.href);
                embedId = iframeUrl.searchParams.get('numi-embed-id');
                console.log('Method 4 - From iframe URL:', embedId);
            } catch (e) {
                console.log('Method 4 - Failed:', e.message);
            }
        }
        
        // Last resort: try to find iframe by matching the event source
        if (!embedId && event.source) {
            const iframes = document.querySelectorAll('iframe[src*="numi-embed-id"]');
            console.log('Method 5 - Found iframes:', iframes.length);
            for (const iframe of iframes) {
                if (iframe.contentWindow === event.source) {
                    const srcUrl = new URL(iframe.src);
                    embedId = srcUrl.searchParams.get('numi-embed-id');
                    console.log('Method 5 - Matched iframe embedId:', embedId);
                    break;
                }
            }
        }
        
        console.log('🎯 Final embedId:', embedId);
        console.groupEnd();
        
        // Debug logging (only when debugging)
        if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
            console.log(`[Plandalf] Received message: ${type} with embedId: ${embedId}`);
        }
        if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
            console.log(`[Plandalf] Received: ${type}`, { embedId, data });
        }
        
        // Handle session initialization
        if (type === 'on_init') {
            console.group('🚀 Session Initialization');
            console.log('📊 Session data extraction:');
            console.log('  - data.offerId:', data.offerId);
            console.log('  - data.data?.offerId:', data.data?.offerId);
            console.log('  - findOfferIdFromEmbedId(embedId):', findOfferIdFromEmbedId(embedId));
            console.log('  - data.checkoutId:', data.checkoutId);
            console.log('  - data.data?.checkoutId:', data.data?.checkoutId);
            console.log('  - data.session?.id:', data.session?.id);
            console.log('  - data.data?.session?.id:', data.data?.session?.id);
            
            const offerId = data.offerId || data.data?.offerId || findOfferIdFromEmbedId(embedId);
            const checkoutId = data.checkoutId || data.data?.checkoutId || data.session?.id || data.data?.session?.id || embedId;
            
            console.log('🎯 Final session values:');
            console.log('  - embedId:', embedId);
            console.log('  - offerId:', offerId);
            console.log('  - checkoutId:', checkoutId);
            console.groupEnd();
            
            const session = new CheckoutSession({
                checkoutId: checkoutId,
                embedId: embedId,
                offerId: offerId,
                embedType: embedTypeRegistry.get(embedId) || 'unknown'
            });
            
            window.plandalf.offers._sessions.set(embedId, session);
            if (window.location.href.includes('PLANDALF_DEBUG') || window.PLANDALF_DEBUG) {
                console.log(`[Plandalf] Session registered. Total sessions: ${window.plandalf.offers._sessions.size}`);
            }
            window.plandalf.offers._notifyWaiters(session);
            
            // Trigger init event with enhanced data
            const eventData = {
                ...data,
                ...(data.data || {}),
                checkoutId: checkoutId,
                offerId: offerId,
                embedId: embedId
            };
            session._triggerEvent('init', eventData);
            return;
        }
        
        // Route events to existing session
        const session = window.plandalf.offers._sessions.get(embedId);
        if (session) {
            console.group(`🔄 Event Routing: ${type}`);
            console.log('📍 Found session:', session.id);
            
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
                'form_resized': 'resize'
            };
            
            const eventType = eventMap[type] || type;
            console.log('🏷️ Event type mapping:', type, '->', eventType);
            
            // Enhance event data with session context
            const eventData = {
                ...data,
                ...(data.data || {}),
                sessionId: session.id,
                offerId: session.offerId,
                embedId: embedId
            };
            
            console.log('📦 Enhanced event data:');
            console.log('  - Original data:', data);
            console.log('  - Enhanced data:', eventData);
            console.log('  - Data structure:', JSON.stringify(eventData, null, 2));
            console.groupEnd();
            
            session._triggerEvent(eventType, eventData);
        } else {
            console.warn(`⚠️ No session found for embedId: ${embedId}`);
            console.log('Available sessions:', Array.from(window.plandalf?.offers?._sessions?.keys() || []));
        }
    };

    // Helper to find offer ID from embed ID
    const findOfferIdFromEmbedId = (embedId) => {
        const element = document.querySelector(`[data-numi-embed-id="${embedId}"]`);
        return element?.dataset.numiOffer || 'unknown';
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
        
        // Per-offer configuration
        if (config.offers) {
            Object.entries(config.offers).forEach(([offerId, offerConfig]) => {
                plandalf.offers.get(offerId).onCheckout((checkout) => {
                    if (offerConfig.onInit) checkout.onInit(offerConfig.onInit);
                    if (offerConfig.onSuccess) checkout.onSuccess(offerConfig.onSuccess);
                    if (offerConfig.onComplete) checkout.onComplete(offerConfig.onComplete);
                    if (offerConfig.onSubmit) checkout.onSubmit(offerConfig.onSubmit);
                    if (offerConfig.onPageChange) checkout.onPageChange(offerConfig.onPageChange);
                    if (offerConfig.onCancel) checkout.onCancel(offerConfig.onCancel);
                    if (offerConfig.onClosed) checkout.onClosed(offerConfig.onClosed);
                    if (offerConfig.onLineItemChange) checkout.onLineItemChange(offerConfig.onLineItemChange);
                });
            });
        }
    };

    // Process configuration
    processGlobalConfig();

    // @ts-ignore
    const fullScreenInitialized = window.__numiFullScreenInitialized;
    const fullScreenTargets = document.querySelectorAll("[data-numi-embed-type='fullscreen']");
    if (fullScreenTargets.length > 0) {
        // pretty much everything is the same as the standard embed
        if (!fullScreenInitialized) {
            // only need to add styles once
            const standardStylesheet = document.createElement('style');
            standardStylesheet.innerHTML = standardStyles;
            // TODO mobile styles?
            document.head.appendChild(standardStylesheet);
            // @ts-ignore
            window.__numiFullScreenInitialized = true;
        }
        fullScreenTargets.forEach(target => {
            if (target instanceof HTMLElement) {
                initializeStandardTarget(target, true);
            }
        });
    }
})();
