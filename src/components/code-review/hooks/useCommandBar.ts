import { useEffect } from 'react';

interface CommandBarCallbackRegistration {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (args: Record<string, any>, context: Record<string, any>) => void;
}

interface CommandBarContextRegistration {
  key: string;
  value: string[] | Record<string, unknown>;
}

/**
 * Hook to manage CommandBar integration
 * Registers callbacks and manages context for the CommandBar command palette
 */
export const useCommandBar = (
  callbacks: CommandBarCallbackRegistration[] = [],
  contexts: CommandBarContextRegistration[] = [],
) => {
  useEffect(() => {
    // Register all callbacks
    callbacks.forEach(({ key, callback }) => {
      if (window.CommandBar && window.CommandBar.addCallback) {
        window.CommandBar.addCallback(key, callback);
      }
    });

    // Set all contexts
    contexts.forEach(({ key, value }) => {
      if (window.CommandBar && window.CommandBar.addContext) {
        window.CommandBar.addContext({ [key]: value });
      }
    });

    // Cleanup function to remove callbacks
    return () => {
      callbacks.forEach(({ key }) => {
        if (window.CommandBar && window.CommandBar.removeCallback) {
          window.CommandBar.removeCallback(key);
        }
      });
    };
  }, [callbacks, contexts]);
};
