import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export function useKeyPress(
  targetKey: string,
  handler: KeyHandler,
  options: { ctrlOrCmd?: boolean; ignoreInputs?: boolean } = { ctrlOrCmd: false, ignoreInputs: true }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if modifier is requested
      if (options.ctrlOrCmd) {
        const isCtrl = event.ctrlKey;
        const isCmd = event.metaKey;
        if (!(isCtrl || isCmd) || event.key.toLowerCase() !== targetKey.toLowerCase()) {
          return;
        }
      } else {
        // If no modifier is requested, check if key matches
        if (event.key.toLowerCase() !== targetKey.toLowerCase()) {
          return;
        }

        // Avoid triggering when user is editing fields
        if (options.ignoreInputs) {
          const target = event.target as HTMLElement;
          const isInput =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;
          
          if (isInput) {
            return;
          }
        }
      }

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetKey, handler, options.ctrlOrCmd, options.ignoreInputs]);
}
