import { useEffect, useCallback, useState } from 'react';
import { KeyboardEvent as ReactKeyboardEvent } from 'react';

interface KeyboardNavigationProps {
  itemCount: number;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: (index: number) => void;
  onEscape?: () => void;
  onTab?: (shiftKey: boolean) => void;
  enabled?: boolean;
  initialIndex?: number;
}

export function useKeyboardNavigation({
  itemCount,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onEnter,
  onEscape,
  onTab,
  enabled = true,
  initialIndex = 0,
}: KeyboardNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!enabled) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(itemCount - 1, prev + 1));
        onArrowRight?.();
        break;
      case 'Enter':
        event.preventDefault();
        onEnter?.(focusedIndex);
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'Tab':
        if (onTab) {
          event.preventDefault();
          onTab(event.shiftKey);
        }
        break;
    }
  }, [enabled, itemCount, focusedIndex, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onTab]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Only handle global keyboard events when enabled and not in an input/textarea
      if (!enabled || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Enter':
        case 'Escape':
          event.preventDefault();
          handleKeyDown(event as unknown as ReactKeyboardEvent<HTMLDivElement>);
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  };
}
