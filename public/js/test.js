
const BASE_URL = import.meta.env.VITE_PLANDALF_BASE_URL || 'https://checkout.plandalf.dev';

// Style injection function
function styleInject(css, { insertAt } = {}) {
  if (!css || typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

// Inject styles
styleInject("@keyframes numi-embed-loading {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.numi-embed-popup-container {\n  padding: 40px 80px;\n}\n.numi-embed-popup-iframe {\n  border-radius: 10px;\n  height: 100%;\n}\n.numi-embed-popup-close {\n  position: absolute;\n  top: -15px;\n  right: -15px;\n  background: #171717;\n}\n.numi-embed-popup-close:hover {\n  background: #272727;\n}\n.numi-embed-slider-main {\n  position: relative;\n}\n.numi-embed-slider-close {\n  padding: 20px 4px;\n}\n@media screen and (max-width: 480px) {\n  .numi-embed-popup-container {\n    padding: 0;\n  }\n  .numi-embed-popup-main {\n    display: flex;\n    flex-flow: column;\n    width: 100% !important;\n    height: 100% !important;\n  }\n  .numi-embed-popup-iframe {\n    border-radius: 0;\n    height: unset;\n    flex-grow: 1;\n  }\n  .numi-embed-popup-close {\n    position: unset;\n    top: 0;\n    right: 0;\n    margin: 4px 8px 4px auto;\n  }\n  .numi-embed-slider-main {\n    flex-flow: column-reverse !important;\n    position: unset;\n    left: 0 !important;\n    right: 0 !important;\n  }\n  .numi-embed-slider-iframe {\n    width: 100% !important;\n  }\n  .numi-embed-slider-close {\n    padding: 6px;\n    border-radius: 50% !important;\n    margin: 4px 8px 4px auto;\n  }\n}\n");

var generateEmbedId = () => {
  const min = 1e13;
  const max = 99999999999999;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${randomNumber}`;
};

function useNumiFrame({
                        offerId,
                        domain,
                        inheritParameters,
                        parameters,
                        dynamicResize
                      }: {
  offerId: string;
  domain?: string;
  inheritParameters?: boolean;
  parameters?: Record<string, any>;
  dynamicResize?: boolean;
}) {

  const [searchParams, setSearchParams] = useState();
  const [embedId, setEmbedId] = useState();

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
    setEmbedId(generateEmbedId());
  }, []);

  // note: could be NOT https?
  let origin: string;
  if (domain) {
    if (/^https?:\/\//i.test(domain)) {
      origin = domain;
    } else {
      origin = `https://${domain}`;
    }
  } else {
    origin = BASE_URL;
  }
  const iframeUrl = new URL(`${origin}/o/${encodeURIComponent(offerId)}`);

  if (inheritParameters && searchParams) {
    for (const [key, value] of searchParams.entries()) {
      iframeUrl.searchParams.set(key, value);
    }
  }
  if (parameters) {
    for (const [key, value] of Object.entries(parameters)) {
      if (value) iframeUrl.searchParams.set(key, value);
    }
  }

  iframeUrl.searchParams.set("numi-embed-id", embedId);
  if (dynamicResize) {
    iframeUrl.searchParams.set("numi-embed-dynamic-resize", "true");
  }

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    iframeUrl,
    origin,
    embedId
  }), [iframeUrl.toString(), origin, embedId]);
}

var useMessageListener = (embed, eventName, fn, options) => {
  const enabled = !(options == null ? void 0 : options.disabled);
  // console.log("useMessageListener", { eventName, enabled, embed: embed ? { origin: embed.origin, embedId: embed.embedId } : null });
  useEffect(() => {
    if (embed && embed.embedId && enabled) {
      const debug = location.href.includes("NUMI_EMBED_DEBUG");

      const listener = (event) => {
        // Only log if this event is relevant to our listener
        if (event.data?.type === eventName) {
          console.log(`Received message event: ${event.data?.type}, source: ${event.data?.source}, embedId: ${event.data?.embedId}`, {
            data: event.data,
            expectedEmbedId: embed.embedId,
            actualOrigin: event.origin
          });

          try {
            // Check for plandalf source and correct event type
            const sourceMatch = event.data.source === 'plandalf';
            const typeMatch = event.data.type === eventName;

            // Embed ID is required to ensure events are routed to the correct component
            // Temporarily make it optional if server doesn't send it
            const embedIdMatch = !event.data.embedId || event.data.embedId === embed.embedId;

            if (sourceMatch && typeMatch && embedIdMatch) {
              console.log(`✅ Matched event: ${eventName}`, event.data);
              fn(event.data);
            } else {
              console.log(`❌ Event mismatch for ${eventName}:`, {
                sourceMatch,
                typeMatch,
                embedIdMatch,
                expectedSource: 'plandalf',
                actualSource: event.data.source,
                expectedType: eventName,
                actualType: event.data.type,
                expectedEmbedId: embed.embedId,
                actualEmbedId: event.data.embedId
              });
            }
          } catch (err) {
            console.error("Error in message listener:", err);
          }
        }
      };
      console.log(`🎧 Mounting listener for event: ${eventName}`);
      window.addEventListener("message", listener);
      return () => {
        console.log(`🔇 Unmounting listener for event: ${eventName}`, { embed, eventName, fn, enabled });
        window.removeEventListener("message", listener);
      };
    }
  }, [embed, eventName, fn, enabled]);
};

function useNumiEvents(embed, events) {
  // Memoize the event handlers to prevent unnecessary re-renders
  const handleInit = useCallback((data) => {
    if (events.onInit) {
      events.onInit(data.checkoutId);
    }
  }, [events.onInit]);

  const handlePageChange = useCallback((data) => {
    if (events.onPageChange) {
      events.onPageChange(data.checkoutId, data.pageId);
    }
  }, [events.onPageChange]);

  const handleSubmit = useCallback((data) => {
    if (events.onSubmit) {
      events.onSubmit(data.checkoutId);
    }
  }, [events.onSubmit]);

  const handleSuccess = useCallback((data) => {
    if (events.onSuccess) {
      events.onSuccess(data);
    }
  }, [events.onSuccess]);

  const handleComplete = useCallback((data) => {
    if (events.onComplete) {
      events.onComplete(data);
    }
  }, [events.onComplete]);

  // Memoize the options objects to prevent unnecessary re-renders
  const initOptions = useMemo(() => ({ disabled: !events.onInit }), [events.onInit]);
  const pageChangeOptions = useMemo(() => ({ disabled: !events.onPageChange }), [events.onPageChange]);
  const submitOptions = useMemo(() => ({ disabled: !events.onSubmit }), [events.onSubmit]);
  const successOptions = useMemo(() => ({ disabled: !events.onSuccess }), [events.onSuccess]);
  const completeOptions = useMemo(() => ({ disabled: !events.onComplete }), [events.onComplete]);

  useMessageListener(
    embed,
    "on_init",
    handleInit,
    initOptions
  );
  useMessageListener(
    embed,
    "page_change",
    handlePageChange,
    pageChangeOptions
  );
  useMessageListener(
    embed,
    "checkout_submit",
    handleSubmit,
    submitOptions
  );
  useMessageListener(
    embed,
    "checkout_success",
    handleSuccess,
    successOptions
  );
  useMessageListener(
    embed,
    "checkout_complete",
    handleComplete,
    completeOptions
  );
}

// Loading component
const Loading = () => (
  <div
    style={{
      border: "solid 2px #aaa",
      borderBottomColor: "white",
      borderRadius: "50%",
      width: 32,
      height: 32,
      animation: "numi-embed-loading 1s infinite linear"
    }}
  />
);

// Portal component
const Portal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

// Close button component
const CloseButton = ({ onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="numi-embed-popup-close"
    style={{
      width: 24,
      height: 24,
      textAlign: "center",
      cursor: "pointer",
      transition: "opacity 0.5s ease-in-out",
      textDecoration: "none",
      color: "white",
      borderRadius: "50%",
      padding: 6,
      boxSizing: "content-box",
      border: 0
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
);

// Popup container component
const PopupContainer = ({
                          children,
                          isOpen,
                          isOpenAnimate,
                          onClose,
                          width,
                          height
                        }) => (
  <div
    onClick={onClose}
    className="numi-embed-popup-container"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(4px)",
      transition: "opacity 0.25s ease-in-out",
      zIndex: 1e13,
      boxSizing: "border-box",
      opacity: isOpenAnimate ? 1 : 0,
      display: isOpen ? "flex" : "none",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <div
      className="numi-embed-popup-main"
      style={{
        position: "relative",
        width: width || "100%",
        height: height || "100%",
        maxWidth: "100%",
        maxHeight: "100%"
      }}
    >
      {children}
    </div>
  </div>
);

// Popup content component
const PopupContent = ({
                        offerId,
                        domain,
                        inheritParameters,
                        parameters,
                        onClose,
                        onInit,
                        onPageChange,
                        onSubmit,
                        onSuccess,
                        onComplete
                      }) => {
  const [loading, setLoading] = useState(true);
  const embed = useNumiFrame({
    offerId,
    domain,
    inheritParameters,
    parameters
  });

  // Debug all messages
  useMessageDebug();

  // Memoize the events object to prevent unnecessary re-renders
  const events = useMemo(() => ({
    onInit,
    onPageChange,
    onSubmit,
    onSuccess,
    onComplete
  }), [onInit, onPageChange, onSubmit, onSuccess, onComplete]);

  useNumiEvents(embed && embed.embedId ? embed : null, events);

  return (
    <>
      {!loading && <CloseButton onClick={onClose} />}
      {embed && embed.embedId && (
        <iframe
          src={embed.iframeUrl}
          allow="microphone; camera; geolocation; payments;"
          title="Embedded Form"
          className="numi-embed-popup-iframe"
          style={{
            border: 0,
            width: "100%",
            opacity: !loading ? 1 : 0
          }}
          onLoad={() => setLoading(false)}
        />
      )}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Loading />
        </div>
      )}
    </>
  );
};

// Main popup component
const NumiPopupEmbed = ({
                          isOpen: _isOpen,
                          onClose: _onClose,
                          width,
                          height,
                          ...props
                        }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (_isOpen) setTimeout(() => setIsOpen(true), 10);
    else setIsOpen(false);
  }, [_isOpen]);

  const onClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    setTimeout(_onClose, 250);
  };

  return (
    <Portal>
      <PopupContainer
        isOpen={_isOpen}
        isOpenAnimate={isOpen}
        onClose={onClose}
        width={width}
        height={height}
      >
        {_isOpen && <PopupContent onClose={onClose} {...props} />}
      </PopupContainer>
    </Portal>
  );
};

function NumiStandardEmbed({
                             offer,
                             onComplete,
                             domain = null,
                             inheritParameters = {},
                             parameters = {},
                             dynamicResize = true,
                             onInit,
                             onPageChange,
                             onSubmit,
                             onSuccess
                           }: {
  offer: string;
  onInit: (checkoutId: string) => void;
  onPageChange: (checkoutId: string, pageId: string) => void;
  onSubmit: (checkoutId: string) => void;
  onSuccess?: (data: any) => void;
  onComplete: (checkout: any) => void;
  domain?: string;
  inheritParameters?: boolean;
  parameters?: Record<string, any>;
  dynamicResize?: boolean;
}) {

  const [loading, setLoading] = useState(true);

  const embed = useNumiFrame({
    offerId: offer,
    domain,
    inheritParameters,
    parameters,
    dynamicResize

  });

  // Memoize the events object to prevent unnecessary re-renders
  const events = useMemo(() => ({
    onInit,
    onPageChange,
    onSubmit,
    onSuccess
  }), [onInit, onPageChange, onSubmit, onSuccess]);

  useNumiEvents(embed, events);
  const [height, setHeight] = useState();

  // Memoize the form resized handler and options
  const handleFormResized = useCallback((data) => {
    const newHeight = data.size;
    if (typeof newHeight === "number") {
      setHeight(newHeight);
    }
  }, []);

  const formResizedOptions = useMemo(() => ({ disabled: !dynamicResize }), [dynamicResize]);

  useMessageListener(
    embed,
    "form_resized",
    handleFormResized,
    formResizedOptions
  );

  const iframeProps = {
    src: embed.iframeUrl,
    allow: "microphone; camera; geolocation; payments;",
    title: "Embedded Form",
    onLoad: () => setLoading(false),
    style: {
      width: !loading ? "100%" : 0,
      height: !loading ? "100%" : 0,
      opacity: !loading ? 1 : 0,
      borderRadius: 10,
      border: 0,
      minHeight: 256
    }
  }

  return (
    <div className="numi-standard-embed">
      <iframe {...iframeProps} height={"700px"} style={{ height: '700px', width: '100%' }}></iframe>
    </div>
  )
}
