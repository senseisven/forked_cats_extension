import { createLogger } from './log';
import BrowserContext from './browser/context';

const logger = createLogger('ag-ui-tools');

export interface ToolAction {
  name: string;
  args: Record<string, any>;
  id: string;
}

export interface ToolActionResult {
  id: string;
  status: 'success' | 'error';
  payload?: any;
  message?: string;
}

export class AGUIToolActionHandler {
  constructor(private browserContext: BrowserContext) {}

  async handleToolAction(action: ToolAction): Promise<ToolActionResult> {
    logger.info('Handling AG-UI tool action:', action);

    try {
      switch (action.name) {
        case 'dom.click':
          return await this.handleDomClick(action);

        case 'dom.fill':
          return await this.handleDomFill(action);

        case 'dom.scroll':
          return await this.handleDomScroll(action);

        case 'dom.screenshot':
          return await this.handleDomScreenshot(action);

        default:
          return {
            id: action.id,
            status: 'error',
            message: `Unknown tool action: ${action.name}`,
          };
      }
    } catch (error) {
      logger.error('Tool action failed:', error);
      return {
        id: action.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        payload: error,
      };
    }
  }

  private async handleDomClick(action: ToolAction): Promise<ToolActionResult> {
    const { index } = action.args;

    if (index === undefined) {
      throw new Error('Element index must be provided');
    }

    const page = await this.browserContext.getCurrentPage();
    const elementNode = page.getDomElementByIndex(index);

    if (!elementNode) {
      throw new Error(`Element with index ${index} not found`);
    }

    await page.clickElementNode(false, elementNode);

    return {
      id: action.id,
      status: 'success',
      message: `Clicked element at index ${index}`,
    };
  }

  private async handleDomFill(action: ToolAction): Promise<ToolActionResult> {
    const { index, value } = action.args;

    if (index === undefined || value === undefined) {
      throw new Error('Both element index and value must be provided');
    }

    const page = await this.browserContext.getCurrentPage();
    const elementNode = page.getDomElementByIndex(index);

    if (!elementNode) {
      throw new Error(`Element with index ${index} not found`);
    }

    await page.inputTextElementNode(false, elementNode, value);

    return {
      id: action.id,
      status: 'success',
      message: `Filled element at index ${index} with value`,
      payload: { index, value },
    };
  }

  private async handleDomScroll(action: ToolAction): Promise<ToolActionResult> {
    const { direction = 'down', amount } = action.args;

    const page = await this.browserContext.getCurrentPage();

    if (direction === 'down') {
      await page.scrollDown(amount);
    } else if (direction === 'up') {
      await page.scrollUp(amount);
    } else {
      throw new Error('Direction must be "up" or "down"');
    }

    return {
      id: action.id,
      status: 'success',
      message: `Scrolled ${direction}`,
      payload: { direction, amount },
    };
  }

  private async handleDomScreenshot(action: ToolAction): Promise<ToolActionResult> {
    const { fullPage = false } = action.args;

    const page = await this.browserContext.getCurrentPage();
    const screenshot = await page.takeScreenshot(fullPage);

    if (!screenshot) {
      throw new Error('Failed to capture screenshot');
    }

    return {
      id: action.id,
      status: 'success',
      message: 'Screenshot captured',
      payload: { screenshot, fullPage },
    };
  }
}
