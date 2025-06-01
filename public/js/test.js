import React, { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { createPortal } from "react-dom";

// #style-inject:#style-inject
function styleInject(css: string, { insertAt }: { insertAt?: string } = {}) {
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
  if ((style as any).styleSheet) {
    (style as any).styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

// src/style.css
styleInject(`@keyframes fillout-embed-loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fillout-embed-popup-container {
  padding: 40px 80px;
}
.fillout-embed-popup-iframe {
  border-radius: 10px;
  height: 100%;
}
.fillout-embed-popup-close {
  position: absolute;
  top: -15px;
  right: -15px;
  background: #171717;
}
.fillout-embed-popup-close:hover {
  background: #272727;
}
.fillout-embed-slider-main {
  position: relative;
}
.fillout-embed-slider-close {
  padding: 20px 4px;
}
@media screen and (max-width: 480px) {
  .fillout-embed-popup-container {
    padding: 0;
  }
  .fillout-embed-popup-main {
    display: flex;
    flex-flow: column;
    width: 100% !important;
    height: 100% !important;
  }
  .fillout-embed-popup-iframe {
    border-radius: 0;
    height: unset;
    flex-grow: 1;
  }
  .fillout-embed-popup-close {
    position: unset;
    top: 0;
    right: 0;
    margin: 4px 8px 4px auto;
  }
  .fillout-embed-slider-main {
    flex-flow: column-reverse !important;
    position: unset;
    left: 0 !important;
    right: 0 !important;
  }
  .fillout-embed-slider-iframe {
    width: 100% !important;
  }
  .fillout-embed-slider-close {
    padding: 6px;
    border-radius: 50% !important;
    margin: 4px 8px 4px auto;
  }
}
`);

// Utility Types
interface FilloutEmbedProps {
  filloutId: string;
  domain?: string;
  inheritParameters?: boolean;
  parameters?: Record<string, string>;
  dynamicResize?: boolean;
  onInit?: (submissionUuid: string) => void;
  onPageChange?: (submissionUuid: string, stepId: string) => void;
  onSubmit?: (submissionUuid: string) => void;
}

interface PopupProps extends FilloutEmbedProps {
  isOpen: boolean;
  onClose: () => void;
  width?: string | number;
  height?: string | number;
}

interface ButtonProps {
  onClick: () => void;
  text?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  float?: 'bottomRight' | 'bottomLeft';
}

interface PortalProps {
  children: ReactNode;
}

// Embed logic
const FILLOUT_BASE_URL = "https://embed.fillout.com";
const generateEmbedId = (): string => {
  const min = 1e13;
  const max = 99999999999999;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${randomNumber}`;
};

type UseFilloutEmbedArgs = {
  filloutId: string;
  domain?: string;
  inheritParameters?: boolean;
  parameters?: Record<string, string>;
  dynamicResize?: boolean;
};

type FilloutEmbed = {
  iframeUrl: string;
  origin: string;
  embedId: string;
};

function useFilloutEmbed({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  dynamicResize,
}: UseFilloutEmbedArgs): FilloutEmbed | undefined {
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  const [embedId, setEmbedId] = useState<string>();

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
    setEmbedId(generateEmbedId());
  }, []);

  if (!searchParams || !embedId) return;
  const origin = domain ? `https://${domain}` : FILLOUT_BASE_URL;
  const iframeUrl = new URL(`${origin}/t/${encodeURIComponent(filloutId)}`);
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
  iframeUrl.searchParams.set("fillout-embed-id", embedId);
  if (dynamicResize) {
    iframeUrl.searchParams.set("fillout-embed-dynamic-resize", "true");
  }
  return {
    iframeUrl: iframeUrl.toString(),
    origin,
    embedId,
  };
}

// Loading Spinner
const Loading: React.FC = () => (
  <div
    style={{
      border: "solid 2px #aaa",
      borderBottomColor: "white",
      borderRadius: "50%",
      width: 32,
      height: 32,
      animation: "fillout-embed-loading 1s infinite linear",
    }}
  />
);

// Message Listener
function useMessageListener(
  embed: FilloutEmbed | undefined,
  eventName: string,
  fn: (data: any) => void,
  options?: { disabled?: boolean }
) {
  const enabled = !(options?.disabled);
  useEffect(() => {
    if (embed && enabled) {
      const debug = location.href.includes("FILLOUT_EMBED_DEBUG");
      const listener = (event: MessageEvent) => {
        try {
          if (
            event.origin === embed.origin &&
            event.data.embedId === embed.embedId &&
            event.data.type === eventName
          ) {
            if (debug) {
              // eslint-disable-next-line no-console
              console.log(["fillout embed MESSAGE", eventName, event.data]);
            }
            fn(event.data);
          }
        } catch (err) {}
      };
      if (debug) console.log(["fillout embed MOUNT", eventName]);
      window.addEventListener("message", listener);
      return () => {
        if (debug) console.log(["fillout embed UNMOUNT", eventName]);
        window.removeEventListener("message", listener);
      };
    }
  }, [embed, eventName, fn, enabled]);
}

// Fillout Events
function useFilloutEvents(
  embed: FilloutEmbed | undefined,
  events: {
    onInit?: (submissionUuid: string) => void;
    onPageChange?: (submissionUuid: string, stepId: string) => void;
    onSubmit?: (submissionUuid: string) => void;
  }
) {
  useMessageListener(
    embed,
    "form_init",
    (data) => events.onInit?.(data.submissionUuid),
    { disabled: !events.onInit }
  );
  useMessageListener(
    embed,
    "page_change",
    (data) => events.onPageChange?.(data.submissionUuid, data.stepId),
    { disabled: !events.onPageChange }
  );
  useMessageListener(
    embed,
    "form_submit",
    (data) => events.onSubmit?.(data.submissionUuid),
    { disabled: !events.onSubmit }
  );
}

// Standard Embed
export const FilloutStandardEmbed: React.FC<FilloutEmbedProps> = ({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  dynamicResize,
  onInit,
  onPageChange,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(true);
  const embed = useFilloutEmbed({
    filloutId,
    domain,
    inheritParameters,
    parameters,
    dynamicResize,
  });
  useFilloutEvents(embed, { onInit, onPageChange, onSubmit });
  const [height, setHeight] = useState<number>();
  useMessageListener(
    embed,
    "form_resized",
    (data) => {
      const newHeight = data.size;
      if (typeof newHeight === "number") {
        setHeight(newHeight);
      }
    },
    { disabled: !dynamicResize }
  );
  return (
    <div
      className="fillout-standard-embed"
      style={{
        height: !dynamicResize ? "100%" : typeof height === "number" ? height : 256,
        transition: dynamicResize ? "height 150ms ease" : undefined,
      }}
    >
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            minHeight: 256,
          }}
        >
          <Loading />
        </div>
      )}
      {embed && (
        <iframe
          src={embed.iframeUrl}
          allow="microphone; camera; geolocation"
          title="Embedded Form"
          onLoad={() => setLoading(false)}
          style={{
            width: !loading ? "100%" : 0,
            height: !loading ? "100%" : 0,
            opacity: !loading ? 1 : 0,
            borderRadius: 10,
            border: 0,
            minHeight: 256,
          }}
        />
      )}
    </div>
  );
};

// FullScreen Embed
export const FilloutFullScreenEmbed: React.FC<FilloutEmbedProps> = ({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  onInit,
  onPageChange,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(true);
  const embed = useFilloutEmbed({
    filloutId,
    domain,
    inheritParameters,
    parameters,
  });
  useFilloutEvents(embed, { onInit, onPageChange, onSubmit });
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Loading />
        </div>
      )}
      {embed && (
        <iframe
          src={embed.iframeUrl}
          allow="microphone; camera; geolocation"
          title="Embedded Form"
          style={{
            border: 0,
            width: !loading ? "100%" : 0,
            height: !loading ? "100%" : 0,
            opacity: !loading ? 1 : 0,
          }}
          onLoad={() => setLoading(false)}
        />
      )}
    </div>
  );
};

// Portal
const Portal: React.FC<PortalProps> = ({ children }) => {
  const [render, setRender] = useState(false);
  useEffect(() => {
    setRender(true);
  }, []);
  return render ? createPortal(children, document.body) : <></>;
};

// Popup Embed
const PopupContent: React.FC<FilloutEmbedProps & { onClose: () => void }> = ({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  onClose,
  onInit,
  onPageChange,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(true);
  const embed = useFilloutEmbed({
    filloutId,
    domain,
    inheritParameters,
    parameters,
  });
  useFilloutEvents(embed, { onInit, onPageChange, onSubmit });
  return (
    <>
      {!loading && <CloseButton onClick={onClose} />}
      {embed && (
        <iframe
          src={embed.iframeUrl}
          allow="microphone; camera; geolocation"
          title="Embedded Form"
          className="fillout-embed-popup-iframe"
          style={{
            border: 0,
            width: "100%",
            opacity: !loading ? 1 : 0,
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
            alignItems: "center",
          }}
        >
          <Loading />
        </div>
      )}
    </>
  );
};

const PopupContainer: React.FC<{
  children: ReactNode;
  isOpen: boolean;
  isOpenAnimate: boolean;
  onClose: () => void;
  width?: string | number;
  height?: string | number;
}> = ({ children, isOpen, isOpenAnimate, onClose, width, height }) => (
  <div
    onClick={onClose}
    className="fillout-embed-popup-container"
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
      alignItems: "center",
    }}
  >
    <div
      className="fillout-embed-popup-main"
      style={{
        position: "relative",
        width: width || "100%",
        height: height || "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      {children}
    </div>
  </div>
);

const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="fillout-embed-popup-close"
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
      border: 0,
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
);

export const FilloutPopupEmbed: React.FC<PopupProps> = ({
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
  const onClose = useCallback(() => {
    if (!isOpen) return;
    setIsOpen(false);
    setTimeout(_onClose, 250);
  }, [isOpen, _onClose]);
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

// Button
const buttonSizeStyles: Record<string, CSSProperties> = {
  small: {
    padding: "8px 12px",
    fontSize: 16,
    borderRadius: 28,
  },
  medium: {
    padding: "10px 14px",
    fontSize: 18,
    borderRadius: 32,
  },
  large: {
    padding: "12px 14px",
    fontSize: 20,
    borderRadius: 32,
  },
};
const buttonFloatStyles: Record<string, CSSProperties> = {
  bottomRight: {
    position: "fixed",
    bottom: 32,
    right: 32,
    zIndex: 9999999,
  },
  bottomLeft: {
    position: "fixed",
    bottom: 32,
    left: 32,
    zIndex: 9999999,
  },
};
const hexToRgb = (hex: string): [number, number, number] => {
  if (typeof hex !== "string" || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return [59, 130, 246];
  }
  let bigint = parseInt(hex.slice(1), 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  return [r, g, b];
};
const getLuminance = (hexColor: string): number => {
  let [r, g, b] = hexToRgb(hexColor);
  const getComponent = (color: number) => {
    color /= 255;
    return color <= 0.03928 ? color / 12.92 : Math.pow((color + 0.055) / 1.055, 2.4);
  };
  r = getComponent(r);
  g = getComponent(g);
  b = getComponent(b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const Button: React.FC<ButtonProps> = ({
  onClick,
  text = "Open form",
  color = "#3b82f6",
  size = "medium",
  float,
}) => {
  const textColor = getLuminance(color) > 0.5 ? "black" : "white";
  return (
    <button
      onClick={onClick}
      style={{
        cursor: "pointer",
        fontFamily: "Helvetica, Arial, sans-serif",
        display: "inline-block",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textDecoration: "none",
        fontWeight: "bold",
        textAlign: "center",
        margin: 0,
        border: "medium",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
        backgroundColor: color,
        color: textColor || "white",
        ...buttonSizeStyles[size],
        ...(float ? buttonFloatStyles[float] : {}),
      }}
    >
      {text}
    </button>
  );
};

// PopupButton
export const FilloutPopupEmbedButton: React.FC<FilloutEmbedProps & {
  width?: string | number;
  height?: string | number;
  text?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  float?: 'bottomRight' | 'bottomLeft';
}> = ({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  width,
  height,
  onInit,
  onPageChange,
  onSubmit,
  text,
  color,
  size,
  float,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        text={text}
        color={color}
        size={size}
        float={float}
      />
      <FilloutPopupEmbed
        filloutId={filloutId}
        domain={domain}
        inheritParameters={inheritParameters}
        parameters={parameters}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onInit={onInit}
        onPageChange={onPageChange}
        onSubmit={onSubmit}
        width={width}
        height={height}
      />
    </>
  );
};

// Slider Embed
const SliderContainer: React.FC<{
  children: ReactNode;
  isOpen: boolean;
  isOpenAnimate: boolean;
  onClose: () => void;
}> = ({ children, isOpen, isOpenAnimate, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.65)",
      transition: "opacity 0.25s ease-in-out",
      zIndex: 1e13,
      opacity: isOpenAnimate ? 1 : 0,
      display: isOpen ? "block" : "none",
    }}
  >
    {children}
  </div>
);

const CloseButton2: React.FC<{ onClick: () => void; sliderLeft?: boolean }> = ({ onClick, sliderLeft }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="fillout-embed-slider-close"
    style={{
      border: 0,
      display: "flex",
      background: "#171717",
      color: "white",
      cursor: "pointer",
      ...(sliderLeft
        ? { borderTopRightRadius: 15, borderBottomRightRadius: 15 }
        : { borderTopLeftRadius: 15, borderBottomLeftRadius: 15 }),
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 24, height: 24 }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
);

const SliderContent: React.FC<FilloutEmbedProps & {
  onClose: () => void;
  sliderDirection?: 'left' | 'right';
}> = ({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  sliderDirection = 'right',
  onClose,
  onInit,
  onPageChange,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(true);
  const embed = useFilloutEmbed({
    filloutId,
    domain,
    inheritParameters,
    parameters,
  });
  useFilloutEvents(embed, { onInit, onPageChange, onSubmit });
  const sliderLeft = sliderDirection === 'left';
  const sliderOpen = !loading;
  return (
    <>
      {loading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Loading />
        </div>
      )}
      <div
        className="fillout-embed-slider-main"
        style={{
          display: 'flex',
          justifyContent: sliderLeft ? 'start' : 'end',
          flexDirection: sliderLeft ? 'row' : 'row-reverse',
          alignItems: 'center',
          height: !loading ? '100%' : 0,
          transitionProperty: sliderLeft ? 'left' : 'right',
          transitionDuration: '0.25s',
          transitionTimingFunction: 'ease-in-out',
          ...(sliderLeft
            ? { left: sliderOpen ? 0 : '-80%' }
            : { right: sliderOpen ? 0 : '-80%' }),
        }}
      >
        {embed && (
          <iframe
            src={embed.iframeUrl}
            allow="microphone; camera; geolocation"
            title="Embedded Form"
            className="fillout-embed-slider-iframe"
            style={{
              border: 0,
              width: !loading ? '80%' : 0,
              height: !loading ? '100%' : 0,
              opacity: !loading ? 1 : 0,
            }}
            onLoad={() => setLoading(false)}
          />
        )}
        {!loading && <CloseButton2 onClick={onClose} sliderLeft={sliderLeft} />}
      </div>
    </>
  );
};

export const FilloutSliderEmbed: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sliderDirection?: 'left' | 'right';
} & FilloutEmbedProps> = ({
  isOpen: _isOpen,
  onClose: _onClose,
  sliderDirection,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (_isOpen) setTimeout(() => setIsOpen(true), 10);
    else setIsOpen(false);
  }, [_isOpen]);
  const onClose = useCallback(() => {
    if (!isOpen) return;
    setIsOpen(false);
    setTimeout(_onClose, 250);
  }, [isOpen, _onClose]);
  return (
    <Portal>
      <SliderContainer isOpen={_isOpen} isOpenAnimate={isOpen} onClose={onClose}>
        {_isOpen && <SliderContent onClose={onClose} sliderDirection={sliderDirection} {...props} />}
      </SliderContainer>
    </Portal>
  );
};

export const FilloutSliderEmbedButton: React.FC<FilloutEmbedProps & {
  sliderDirection?: 'left' | 'right';
  text?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  float?: 'bottomRight' | 'bottomLeft';
}> = ({
  filloutId,
  domain,
  inheritParameters,
  parameters,
  sliderDirection,
  onInit,
  onPageChange,
  onSubmit,
  text,
  color,
  size,
  float,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        text={text}
        color={color}
        size={size}
        float={float}
      />
      <FilloutSliderEmbed
        filloutId={filloutId}
        domain={domain}
        inheritParameters={inheritParameters}
        parameters={parameters}
        sliderDirection={sliderDirection}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onInit={onInit}
        onPageChange={onPageChange}
        onSubmit={onSubmit}
      />
    </>
  );
};
