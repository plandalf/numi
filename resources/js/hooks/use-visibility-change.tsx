import { useEffect, useRef } from 'react';

export function useVisibilityChange({ hidden, onVisible, onHidden }: { hidden?: boolean, onVisible?: () => void, onHidden?: () => void }) {
  const prevHiddenRef = useRef(hidden);

  useEffect(() => {
    const wasHidden = prevHiddenRef.current;
    const isNowActive = !hidden;

    if (wasHidden && isNowActive) {
      onVisible?.();
    }

    const wasActive = !prevHiddenRef.current;
    const isNowHidden = hidden;

    if (wasActive && isNowHidden) {
      onHidden?.();
    }

    prevHiddenRef.current = hidden;
  }, [hidden, onVisible, onHidden]);
}
