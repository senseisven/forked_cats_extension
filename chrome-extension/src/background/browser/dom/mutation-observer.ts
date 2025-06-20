/**
 * DOM Mutation Observer Service
 *
 * Inspired by Agent-E's DOM mutation observer functionality.
 * Detects dynamic changes in the DOM, particularly useful for:
 * - Dropdown options that load dynamically
 * - Autocomplete suggestions that appear/disappear
 * - Modal dialogs and overlays
 * - Any content that changes after user interaction
 */

import { createLogger } from '@src/background/log';

const logger = createLogger('DOMutationObserver');

// Type for DOM change callback
type DOMChangeCallback = (changes: DOMChange[]) => void;

// Type for individual DOM changes
interface DOMChange {
  tag: string;
  content: string;
}

class DOMutationObserver {
  private callbacks: DOMChangeCallback[] = [];
  private isObservingTab: number | null = null;

  /**
   * Subscribe to DOM change notifications
   */
  subscribe(callback: DOMChangeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Unsubscribe from DOM change notifications
   */
  unsubscribe(callback: DOMChangeCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Start observing DOM changes on the specified tab
   */
  async startObserving(tabId: number): Promise<void> {
    if (this.isObservingTab === tabId) {
      return; // Already observing this tab
    }

    this.isObservingTab = tabId;

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: this.injectMutationObserver,
      });

      logger.info(`Started DOM mutation observer on tab ${tabId}`);
    } catch (error) {
      logger.error('Failed to inject mutation observer:', error);
      this.isObservingTab = null;
      throw error;
    }
  }

  /**
   * Stop observing DOM changes
   */
  async stopObserving(): Promise<void> {
    if (this.isObservingTab) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.isObservingTab },
          func: this.removeMutationObserver,
        });

        logger.info(`Stopped DOM mutation observer on tab ${this.isObservingTab}`);
      } catch (error) {
        logger.error('Failed to remove mutation observer:', error);
      }

      this.isObservingTab = null;
    }
  }

  /**
   * Handle DOM changes detected by the injected observer
   */
  handleDOMChanges(changes: DOMChange[]): void {
    if (changes.length === 0) return;

    logger.debug('DOM changes detected:', changes);

    // Notify all subscribers
    for (const callback of this.callbacks) {
      try {
        callback(changes);
      } catch (error) {
        logger.error('Error in DOM change callback:', error);
      }
    }
  }

  /**
   * Function to inject into the page context
   * Based on Agent-E's mutation observer implementation
   */
  private injectMutationObserver(): void {
    // Avoid multiple observers on the same page
    if ((window as any).__nanobrowser_mutation_observer__) {
      return;
    }

    console.log('Adding a mutation observer for DOM changes (nanobrowser)');

    const observer = new MutationObserver(mutationsList => {
      const changesDetected: { tag: string; content: string }[] = [];

      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const allAddedNodes = mutation.addedNodes;

          for (const node of Array.from(allAddedNodes)) {
            const element = node as Element;
            if (
              element.tagName &&
              !['SCRIPT', 'NOSCRIPT', 'STYLE'].includes(element.tagName) &&
              !element.closest('#nanobrowser-overlay')
            ) {
              const content = element.textContent?.trim();
              if (content) {
                // Check if element is visible
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                  changesDetected.push({
                    tag: element.tagName,
                    content: content,
                  });
                }
              }
            }
          }
        } else if (mutation.type === 'characterData') {
          const node = mutation.target;
          const parentElement = node.parentNode as Element;

          if (
            parentElement &&
            !['SCRIPT', 'NOSCRIPT', 'STYLE'].includes(parentElement.tagName) &&
            !parentElement.closest('#nanobrowser-overlay')
          ) {
            const content = node.textContent?.trim();
            if (content) {
              const computedStyle = window.getComputedStyle(parentElement);
              if (
                computedStyle.display !== 'none' &&
                !changesDetected.some(change => change.content.includes(content))
              ) {
                changesDetected.push({
                  tag: parentElement.tagName,
                  content: content,
                });
              }
            }
          }
        }
      }

      if (changesDetected.length > 0) {
        // Send changes to background script
        const message = {
          type: 'DOM_CHANGES_DETECTED',
          changes: changesDetected,
        };

        try {
          chrome.runtime.sendMessage(message);
        } catch (error) {
          console.error('Failed to send DOM changes to background:', error);
        }
      }
    });

    observer.observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    // Mark that observer is active
    (window as any).__nanobrowser_mutation_observer__ = observer;
  }

  /**
   * Function to remove the injected mutation observer
   */
  private removeMutationObserver(): void {
    const observer = (window as any).__nanobrowser_mutation_observer__;
    if (observer) {
      observer.disconnect();
      delete (window as any).__nanobrowser_mutation_observer__;
      console.log('Removed nanobrowser mutation observer');
    }
  }
}

// Singleton instance
export const domMutationObserver = new DOMutationObserver();

// Message listener for DOM changes from content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'DOM_CHANGES_DETECTED' && sender.tab?.id) {
    domMutationObserver.handleDOMChanges(message.changes);
  }
});
