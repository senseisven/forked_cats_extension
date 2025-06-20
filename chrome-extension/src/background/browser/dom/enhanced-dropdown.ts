/**
 * Enhanced Dropdown Handler
 *
 * Inspired by Agent-E's advanced dropdown handling capabilities.
 * Supports multiple dropdown types and provides enhanced option detection.
 * Maintains nanobrowser's Japanese localization.
 */

import { createLogger } from '@src/background/log';
import { domMutationObserver } from './mutation-observer';

const logger = createLogger('EnhancedDropdown');

// Types based on Agent-E's accessibility tree structure
interface DropdownOption {
  mmid?: string;
  text: string;
  value: string;
  selected?: boolean;
  index?: number;
}

interface EnhancedDropdownInfo {
  type: 'select' | 'listbox' | 'combobox' | 'custom';
  mmid?: string;
  options: DropdownOption[];
  isOpen?: boolean;
  hasMoreOptions?: boolean;
}

/**
 * Inject mmid attributes into DOM elements for reliable targeting
 * Based on Agent-E's __inject_attributes function
 */
export async function injectMMIDAttributes(tabId: number): Promise<number> {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: (): number => {
        const allElements = document.querySelectorAll('*');
        let id = 0;

        allElements.forEach(element => {
          const origAriaAttribute = element.getAttribute('aria-keyshortcuts');
          const mmid = `${++id}`;
          element.setAttribute('mmid', mmid);
          element.setAttribute('aria-keyshortcuts', mmid);

          if (origAriaAttribute) {
            element.setAttribute('orig-aria-keyshortcuts', origAriaAttribute);
          }
        });

        return id;
      },
    });

    const injectedCount = result[0].result as number;
    logger.info(`Injected mmid attributes into ${injectedCount} elements on tab ${tabId}`);
    return injectedCount;
  } catch (error) {
    logger.error('Failed to inject mmid attributes:', error);
    throw new Error('mmid属性の注入に失敗しました'); // Japanese error message
  }
}

/**
 * Get comprehensive dropdown information from a dropdown element
 * Supports multiple dropdown types like Agent-E
 */
export async function getEnhancedDropdownInfo(tabId: number, mmid: string): Promise<EnhancedDropdownInfo> {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: (elementMMID: string): EnhancedDropdownInfo | null => {
        const element = document.querySelector(`[mmid="${elementMMID}"]`) as HTMLElement;

        if (!element) {
          return null;
        }

        const tagName = element.tagName.toLowerCase();
        const role = element.getAttribute('role');

        // Handle native HTML select elements
        if (tagName === 'select') {
          const selectElement = element as HTMLSelectElement;
          const options: DropdownOption[] = [];

          for (const option of Array.from(selectElement.options)) {
            options.push({
              mmid: option.getAttribute('mmid') || undefined,
              text: option.text,
              value: option.value,
              selected: option.selected,
              index: option.index,
            });
          }

          return {
            type: 'select',
            mmid: elementMMID,
            options: options,
            isOpen: false, // Native selects don't have an "open" state we can detect
          };
        }

        // Handle listbox elements
        if (role === 'listbox' || tagName === 'ul') {
          const options: DropdownOption[] = [];
          const optionElements = element.querySelectorAll('[role="option"], li');

          optionElements.forEach((optionEl, index) => {
            const htmlEl = optionEl as HTMLElement;
            options.push({
              mmid: htmlEl.getAttribute('mmid') || undefined,
              text: htmlEl.textContent?.trim() || '',
              value: htmlEl.getAttribute('value') || htmlEl.textContent?.trim() || '',
              selected: htmlEl.getAttribute('aria-selected') === 'true',
              index: index,
            });
          });

          return {
            type: 'listbox',
            mmid: elementMMID,
            options: options,
            isOpen: element.getAttribute('aria-expanded') === 'true',
          };
        }

        // Handle combobox elements
        if (role === 'combobox') {
          const options: DropdownOption[] = [];

          // Look for associated listbox
          const listboxId = element.getAttribute('aria-controls');
          let listbox: Element | null = null;

          if (listboxId) {
            listbox = document.getElementById(listboxId);
          } else {
            // Try to find listbox as a sibling or child
            listbox = element.querySelector('[role="listbox"]');
            if (!listbox && element.nextElementSibling) {
              listbox = element.nextElementSibling.querySelector('[role="listbox"]');
            }
            if (!listbox && element.parentElement) {
              listbox = element.parentElement.querySelector('[role="listbox"]');
            }
          }

          if (listbox) {
            const optionElements = listbox.querySelectorAll('[role="option"]');
            optionElements.forEach((optionEl, index) => {
              const htmlEl = optionEl as HTMLElement;
              options.push({
                mmid: htmlEl.getAttribute('mmid') || undefined,
                text: htmlEl.textContent?.trim() || '',
                value: htmlEl.getAttribute('value') || htmlEl.textContent?.trim() || '',
                selected: htmlEl.getAttribute('aria-selected') === 'true',
                index: index,
              });
            });
          }

          return {
            type: 'combobox',
            mmid: elementMMID,
            options: options,
            isOpen: element.getAttribute('aria-expanded') === 'true',
          };
        }

        // Handle custom dropdowns (look for common patterns)
        const customDropdownSelectors = [
          '.dropdown',
          '.select',
          '.picker',
          '[data-testid*="dropdown"]',
          '[data-testid*="select"]',
        ];

        for (const selector of customDropdownSelectors) {
          if (element.matches(selector) || element.closest(selector)) {
            const options: DropdownOption[] = [];

            // Look for option-like elements
            const optionSelectors = ['.option', '.item', '.choice', '[data-value]', 'li', '.dropdown-item'];

            for (const optionSelector of optionSelectors) {
              const optionElements = element.querySelectorAll(optionSelector);
              if (optionElements.length > 0) {
                optionElements.forEach((optionEl, index) => {
                  const htmlEl = optionEl as HTMLElement;
                  const text = htmlEl.textContent?.trim() || '';
                  if (text) {
                    options.push({
                      mmid: htmlEl.getAttribute('mmid') || undefined,
                      text: text,
                      value: htmlEl.getAttribute('data-value') || htmlEl.getAttribute('value') || text,
                      selected:
                        htmlEl.classList.contains('selected') ||
                        htmlEl.classList.contains('active') ||
                        htmlEl.getAttribute('aria-selected') === 'true',
                      index: index,
                    });
                  }
                });
                break; // Found options, no need to continue
              }
            }

            return {
              type: 'custom',
              mmid: elementMMID,
              options: options,
              isOpen:
                element.classList.contains('open') ||
                element.classList.contains('expanded') ||
                element.getAttribute('aria-expanded') === 'true',
            };
          }
        }

        // If we couldn't identify it as any dropdown type, return empty result
        return {
          type: 'custom',
          mmid: elementMMID,
          options: [],
          isOpen: false,
        };
      },
      args: [mmid],
    });

    const dropdownInfo = result[0].result as EnhancedDropdownInfo | null;

    if (!dropdownInfo) {
      throw new Error(`ドロップダウン要素が見つかりません (mmid: ${mmid})`); // Japanese error
    }

    logger.debug('Enhanced dropdown info:', dropdownInfo);
    return dropdownInfo;
  } catch (error) {
    logger.error('Failed to get enhanced dropdown info:', error);
    throw new Error(
      `ドロップダウン情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Select an option from a dropdown using enhanced selection strategies
 * Based on Agent-E's click_using_selector functionality
 */
export async function selectEnhancedDropdownOption(
  tabId: number,
  dropdownMMID: string,
  optionIdentifier: string | number,
): Promise<string> {
  try {
    // First get the dropdown info to understand what we're working with
    const dropdownInfo = await getEnhancedDropdownInfo(tabId, dropdownMMID);

    // Start observing for DOM changes that might occur during selection
    let domChangesDetected = false;
    const changeHandler = () => {
      domChangesDetected = true;
    };

    domMutationObserver.subscribe(changeHandler);

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementMMID: string, identifier: string | number, dropdownType: string): string => {
          const dropdown = document.querySelector(`[mmid="${elementMMID}"]`) as HTMLElement;

          if (!dropdown) {
            return `ドロップダウン要素が見つかりません (mmid: ${elementMMID})`;
          }

          // Handle different dropdown types
          if (dropdownType === 'select') {
            const selectElement = dropdown as HTMLSelectElement;

            // Find option by text or index
            let targetOption: HTMLOptionElement | null = null;

            if (typeof identifier === 'number') {
              targetOption = selectElement.options[identifier];
            } else {
              // Find by text
              for (const option of Array.from(selectElement.options)) {
                if (option.text.trim() === identifier) {
                  targetOption = option;
                  break;
                }
              }
            }

            if (!targetOption) {
              const availableOptions = Array.from(selectElement.options)
                .map(o => o.text.trim())
                .join('", "');
              return `オプション "${identifier}" が見つかりません。利用可能なオプション: "${availableOptions}"`;
            }

            const previousValue = selectElement.value;
            selectElement.value = targetOption.value;

            // Dispatch events if value changed
            if (previousValue !== targetOption.value) {
              selectElement.dispatchEvent(new Event('change', { bubbles: true }));
              selectElement.dispatchEvent(new Event('input', { bubbles: true }));
            }

            return `オプション "${targetOption.text}" (値: "${targetOption.value}") を選択しました`;
          }

          // Handle listbox, combobox, and custom dropdowns
          if (dropdownType === 'listbox' || dropdownType === 'combobox' || dropdownType === 'custom') {
            // Find option element
            let optionElement: HTMLElement | null = null;

            if (typeof identifier === 'string') {
              // Find by mmid first if identifier looks like mmid
              if (/^\d+$/.test(identifier)) {
                optionElement = dropdown.querySelector(`[mmid="${identifier}"]`) as HTMLElement;
              }

              // If not found, search by text content
              if (!optionElement) {
                const allOptions = dropdown.querySelectorAll('[role="option"], .option, .item, .choice, li');
                for (const option of Array.from(allOptions)) {
                  const htmlOption = option as HTMLElement;
                  if (htmlOption.textContent?.trim() === identifier) {
                    optionElement = htmlOption;
                    break;
                  }
                }
              }
            } else {
              // Select by index
              const allOptions = Array.from(dropdown.querySelectorAll('[role="option"], .option, .item, .choice, li'));
              if (identifier < allOptions.length) {
                optionElement = allOptions[identifier] as HTMLElement;
              }
            }

            if (!optionElement) {
              return `オプション "${identifier}" が見つかりません`;
            }

            // Click the option element
            optionElement.click();

            // For combobox, also update the input value if present
            if (dropdownType === 'combobox') {
              const input = dropdown.querySelector('input');
              if (input) {
                input.value = optionElement.textContent?.trim() || '';
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }

            return `オプション "${optionElement.textContent?.trim()}" を選択しました`;
          }

          return `不明なドロップダウンタイプ: ${dropdownType}`;
        },
        args: [dropdownMMID, optionIdentifier, dropdownInfo.type],
      });

      const selectionResult = result[0].result as string;

      // Wait a moment to see if DOM changes occurred
      await new Promise(resolve => setTimeout(resolve, 100));

      if (domChangesDetected) {
        return `${selectionResult}\n選択の結果、新しい要素がページに表示されました。追加の操作が必要な可能性があります。`;
      }

      return selectionResult;
    } finally {
      domMutationObserver.unsubscribe(changeHandler);
    }
  } catch (error) {
    logger.error('Failed to select enhanced dropdown option:', error);
    throw new Error(
      `ドロップダウンオプションの選択に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Wait for dropdown options to load dynamically
 * Useful for autocomplete and dynamic dropdowns
 */
export async function waitForDropdownOptions(
  tabId: number,
  dropdownMMID: string,
  timeout: number = 3000,
): Promise<DropdownOption[]> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkOptions = async () => {
      try {
        const dropdownInfo = await getEnhancedDropdownInfo(tabId, dropdownMMID);

        if (dropdownInfo.options.length > 0) {
          resolve(dropdownInfo.options);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`タイムアウト: ${timeout}ms以内にドロップダウンオプションが読み込まれませんでした`));
          return;
        }

        // Check again in 200ms
        setTimeout(checkOptions, 200);
      } catch (error) {
        reject(error);
      }
    };

    checkOptions();
  });
}
