/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Printess GmbH & Co. Kg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Printess GmbH & Co. Kg does not provide any support for this plugin.
 */

import { IPrintessShopifyGraphQlApi, IProduct, IProductOption } from "./printess-graphql-api.d";
import { IIntegration, IIntegrationButton, IPluginContainer, IShopifySettings, PrintessDesignButtonStatus } from "./printess-shopify.d";
import { IPlugin } from "./printess-plugins.d";

type TIntegration = "editor" | "slimui" | "none";

/**
 * Stays exported although the theme app extension loads the built file as a plain script, where a top level
 * export is a syntax error: dropping it here does not help, as the type imports above keep this file a module
 * and tsc then emits an `export {};` marker at the end instead. build.sh strips the export on the way into the
 * app's assets - see the copy step there.
 */
export class PrintessIntegrationLauncher {
  private static callbacks: ((editorButtons: IIntegrationButton[], slimUiButtons: IIntegrationButton[]) => void)[] | null = [];
  private static editorButtons: IIntegrationButton[] | null = null;
  private static slimUiButtons: IIntegrationButton[] | null = null;
  private static cachedProducts: Record<string, IProduct> = {};
  public static plugins: IPlugin[] = [];

  public static executeAfterLoading(callback: (editorButtons: IIntegrationButton[], slimUiButtons: IIntegrationButton[]) => void) {
    if (PrintessIntegrationLauncher.callbacks) {
      PrintessIntegrationLauncher.callbacks.push(callback);
    } else {
      callback(PrintessIntegrationLauncher.editorButtons!, PrintessIntegrationLauncher.slimUiButtons!);
    }
  }

  private static hasValue(obj: any): boolean {
    return typeof obj !== "undefined" && obj !== null;
  }

  private static readonly defaultAddToBasketButtonSelector = 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart';

  /**
   * The header block of the theme app extension hides the theme's add to basket buttons with this style until the
   * launcher ran, otherwise a slow page lets the buyer add a personalizable product before our button exists.
   */
  private static readonly addToBasketPreHideStyleId = "printess-add-to-basket-prehide";

  public static removeAddToBasketPreHide(): void {
    //Every placement of the configuration block renders its own prehide style with the same id, all of them have to go
    document.querySelectorAll("#" + PrintessIntegrationLauncher.addToBasketPreHideStyleId).forEach((x) => x.remove());
  }

  private static getAddToBasketButtonSelector(settings?: IShopifySettings | null): string {
    return settings?.uiSelectors?.cssAddToBasketButtonSelector || PrintessIntegrationLauncher.defaultAddToBasketButtonSelector;
  }

  private static isAttachedToDom(node: Node | null | undefined): boolean {
    return !!node && document.body.contains(node);
  }

  private static getFormOfElement(element: HTMLElement | null): HTMLFormElement | null {
    if (!element) {
      return null;
    }

    let form: HTMLFormElement | null = null;

    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
      form = element.form;
    }

    if (!form) {
      form = element.closest("form");
    }

    return form;
  }

  private static getProductIdForElement(element: HTMLElement | null): string | null {
    const form = PrintessIntegrationLauncher.getFormOfElement(element);

    if (!form) {
      return null;
    }

    const productInput: HTMLInputElement | HTMLSelectElement | null = form.querySelector('input[name="product-id"],select[name="product-id"]') as HTMLInputElement | HTMLSelectElement | null;

    if (productInput) {
      return productInput.value;
    }

    let parent: HTMLElement | null = form.parentElement;

    for (let i = 0; i < 10 && parent; i++) {
      const productId = parent.getAttribute("data-product-id");

      if (productId) {
        return productId;
      }

      parent = parent.parentElement;
    }

    return null;
  }

  /**
   * Returns all add to basket buttons of the theme, ignoring the buttons printess added itself.
   */
  private static getThemeAddToBasketButtons(selector: string): HTMLElement[] {
    const ret: HTMLElement[] = [];

    document.querySelectorAll(selector).forEach((candidate) => {
      if (candidate instanceof HTMLElement && !candidate.matches(".printess-integration-button") && !candidate.matches(".printess-direct-to-basket-button")) {
        ret.push(candidate);
      }
    });

    return ret;
  }

  /**
   * Some themes (for example "Prestige") rerender large parts of the product page when the variant is switched.
   * This removes the add to basket button (and our design now button) we keep in memory from the dom.
   * This method locates the add to basket button that replaced the one we lost.
   */
  private static findCurrentAddToBasketButton(button: IIntegrationButton, selector: string): HTMLElement | null {
    const candidates = PrintessIntegrationLauncher.getThemeAddToBasketButtons(selector);

    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    const productId = button.product ? (button.product.id || "").toString() : "";

    if (productId) {
      const match = candidates.find((candidate) => PrintessIntegrationLauncher.getProductIdForElement(candidate) === productId);

      if (match) {
        return match;
      }
    }

    //Do not guess if the page contains several products
    return null;
  }

  private static async initializeIntegrationButton(settings: IShopifySettings, button: IIntegrationButton, graphQlApi?: IPrintessShopifyGraphQlApi | null, addedButtons?: IIntegrationButton[] | null, index?: number | null): Promise<TIntegration> {

    const productId = button.printessGetProductId();

    if (!productId) {
      button.printessRemoveButton();

      if (this.hasValue(addedButtons) && this.hasValue(index)) {
        addedButtons!.splice(index!, 1);
      }

      console.warn("Printess Integration: Removed button as product form does not contain product id");

      return "none";
    }

    if (!PrintessIntegrationLauncher.cachedProducts[productId]) {
      let metaFields: string[] = ["templateName", "printTemplateName", "optionNameMapping", "productType", "productDefinitionId", "mergeTemplates", "settings", "dpi", "outputFormat", "tableQuantityFormField", "ignoreDropshipBundling", "dropshipBundlingId", "variantSwitchingOption", "theme", "additionalPrices"];

      if (settings.additionalProductMetaFields && settings.additionalProductMetaFields.length > 0) {
        metaFields = [...metaFields, ...settings.additionalProductMetaFields];
      }

      let product = PrintessIntegrationLauncher.getPreloadedProduct(parseInt(productId), settings);

      //Liquid renders the options in the language of the storefront, the form field mappings use the api's language
      if (product && settings.productPreloadIsPrimaryLocale === false) {
        if (!graphQlApi) {
          graphQlApi = (createPrintessShopifyApi || (await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-graphql-api.js"))["createPrintessShopifyApi"])(settings.apiDomain || "", settings.shopToken, settings.graphQlToken, settings.graphQlLanguage || "");
        }

        let apiOptions: IProductOption<number>[] = [];

        try {
          apiOptions = await graphQlApi?.getProductOptions(parseInt(productId)) || [];
        } catch (ex) {
          console.error("Printess Integration: " + ex);
        }

        if (apiOptions.length > 0) {
          PrintessIntegrationLauncher.renamePreloadedOptions(settings, apiOptions);
        } else {
          console.warn("Printess Integration: Unable to load the product options in the shop's language, form field mappings may not match on this translated storefront.");
        }
      }

      if (!product) {
        if (!graphQlApi) {
          graphQlApi = (createPrintessShopifyApi || (await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-graphql-api.js"))["createPrintessShopifyApi"])(settings.apiDomain || "", settings.shopToken, settings.graphQlToken, settings.graphQlLanguage || "");
        }

        product = await graphQlApi?.getProductById(parseInt(productId), true, metaFields) || null;
      }

      if (!product) {
        button.printessRemoveButton();

        if (this.hasValue(addedButtons) && this.hasValue(index)) {
          addedButtons!.splice(index!, 1);
        }

        console.warn("Printess Integration: Removed button. Unable to download product information for product with id " + productId);
        return "none";
      }

      PrintessIntegrationLauncher.cachedProducts[productId] = product;
    }

    const product = PrintessIntegrationLauncher.cachedProducts[productId];

    if (!product.templateName && typeof (<any>window)["getPrintessTemplateName"] === "function") {
      try {
        product.templateName = (<any>window)["getPrintessTemplateName"](product);
      } catch (ex) {
        console.error("Printess integration: " + ex);
      }
    }

    if (!product.templateName && !(<any>window)["loadPrintesForAllProducts"]) {
      button.printessRemoveButton();

      if (this.hasValue(addedButtons) && this.hasValue(index)) {
        addedButtons!.splice(index!, 1);
      }

      console.info(`Printess Integration: Removed integration button as product with id ${productId} is no printess product`);

      return "none";
    }

    button.product = product;

    if (product.tags && Array.isArray(product.tags)) {
      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.get("ui") !== "editor" && product.tags.includes("printess-slimui")) {
        PrintessIntegrationLauncher.slimUiButtons?.push(button);

        return "slimui";
      } else {
        PrintessIntegrationLauncher.editorButtons?.push(button);
      }
    } else {
      PrintessIntegrationLauncher.editorButtons?.push(button);
    }

    return "editor";
  }

  public static async initialize(settings: IShopifySettings): Promise<void> {
    if (settings.integrationUrl !== "https://editor.printess.com/shopify-panelui/" && settings.integrationUrl !== "https://editor.printess.com/shopify-panelui-dev/") {
      settings.integrationUrl = "https://editor.printess.com/shopify-panelui/";
    }

    PrintessIntegrationLauncher.preconfigureTheme(settings);

    if (PrintessIntegrationLauncher.editorButtons || PrintessIntegrationLauncher.slimUiButtons) {
      //Do not initialize 2 or more times
      return;
    } else {
      PrintessIntegrationLauncher.editorButtons = [];
      PrintessIntegrationLauncher.slimUiButtons = [];
    }

    let addToBasketButtonCount = 0;
    const addedButtons: IIntegrationButton[] = [];
    let graphQlApi: IPrintessShopifyGraphQlApi | null = null;
    const addToBasketButtonSelector = PrintessIntegrationLauncher.getAddToBasketButtonSelector(settings);

    //Create integration button, hide add to basket button and display loading status
    document.querySelectorAll(addToBasketButtonSelector).forEach((addToBasketButton: Element) => {
      if (!addToBasketButton || (!(addToBasketButton instanceof HTMLElement) && !(addToBasketButton instanceof HTMLButtonElement))) {
        return;
      }

      ++addToBasketButtonCount;

      if (addToBasketButton.getAttribute("data-printess-attached")) {
        return;
      }

      addToBasketButton.setAttribute("data-printess-attached", "true");

      const designNowButton = PrintessIntegrationLauncher.createDesignNowButton(addToBasketButton, addToBasketButtonSelector, settings.captions?.loadingButtonText || "Loading ...", settings.captions?.designNow || "Design now", settings.captions?.addToBasket || "Add to basket", settings.designButtonClasses);

      addToBasketButton.after(designNowButton);

      addedButtons.push(designNowButton);
    });

    //From here on the design now buttons hide the theme buttons of printess products themselves
    PrintessIntegrationLauncher.removeAddToBasketPreHide();

    //Download graphqlapi and check all buttons if they should use the printess integration
    if (!(<any>window)["PrintessShopifyGraphQlApi"] && !((<any>window)["createPrintessShopifyApi"])) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-graphql-api.js");

      if (typeof createPrintessShopifyApi === "undefined" && typeof exports["createPrintessShopifyApi"] === "undefined") {
        addedButtons.forEach((x) => {
          x.printessRemoveButton();
        });

        console.error("Printess Integration: Unable to download graphql api.");
        return;
      }

      graphQlApi = (createPrintessShopifyApi || exports["createPrintessShopifyApi"])(settings.apiDomain || "", settings.shopToken, settings.graphQlToken, settings.graphQlLanguage || "");
    }

    const buttonsArray = [...addedButtons];

    for (let index = 0; index < buttonsArray.length; ++index) {
      const button = buttonsArray[index];

      await PrintessIntegrationLauncher.initializeIntegrationButton(settings, button, graphQlApi, addedButtons, index);
    }

    const pluginProvider: IPluginContainer = {
      getPlugins: (): IPlugin[] => {
        return PrintessIntegrationLauncher.plugins;
      },
      registerPlugin: (plugin: IPlugin): void => {
        if (plugin) {
          PrintessIntegrationLauncher.plugins.push(plugin);
        }
      }
    };

    if (typeof (<any>window)["initPrintessPlugins"] === "function") {
      try {
        const plugins = (<any>window)["initPrintessPlugins"]();

        if (plugins) {
          if (Array.isArray(plugins)) {
            plugins.forEach((x) => {
              pluginProvider.registerPlugin(x);
            });
          } else {
            pluginProvider.registerPlugin(plugins);
          }
        }
      } catch (e) {
        console.error("Printess Integration: Unable to retrieve plugins: " + e);
      }
    }

    //Init standard editor integrations
    if (PrintessIntegrationLauncher.editorButtons.length > 0) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-shopify.js");

      if (exports && typeof exports["PrintessShopify"] !== "undefined" && typeof (<any>exports["PrintessShopify"]).createProductIntegration !== "undefined") {
        PrintessIntegrationLauncher.editorButtons.forEach((button) => {
          (<any>exports["PrintessShopify"]).createProductIntegration(settings, button, pluginProvider).then((integration: IIntegration) => {
            button.integration = integration;

            //Trigger execution of all init callbacks
            button.executeAfterInitialization((btn: IIntegrationButton) => { });
          });
        });
      } else {
        PrintessIntegrationLauncher.editorButtons.forEach((button) => {
          button.printessRemoveButton();
        });

        console.error("Printess Integration: Unable to import printess editor integration.");
      }
    }

    //Init Slimui integrations
    if (PrintessIntegrationLauncher.slimUiButtons.length > 0) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-shopify-slimui.js");

      if (exports && typeof exports["PrintessShopifySlimUi"] !== "undefined" && typeof (<any>exports["PrintessShopifySlimUi"]).create !== "undefined") {
        PrintessIntegrationLauncher.slimUiButtons.forEach((button) => {
          (<any>exports["PrintessShopifySlimUi"]).create(settings, button, pluginProvider).then((integration: IIntegration) => {
            button.integration = integration;

            //Trigger execution of all init callbacks
            button.executeAfterInitialization((btn: IIntegrationButton) => { });
          });
        });
      } else {
        PrintessIntegrationLauncher.slimUiButtons.forEach((button) => {
          button.printessRemoveButton();
        });

        console.error("Printess Integration: Unable to import printess editor integration.");
      }
    }

    if (addToBasketButtonCount === 0) {
      console.warn("Printess Integration: Printess integration deactivated. No add to basket button found.");
      return;
    }

    //Execute the loading callbacks
    PrintessIntegrationLauncher.callbacks?.forEach((callback) => {
      try {
        callback(PrintessIntegrationLauncher.editorButtons!, PrintessIntegrationLauncher.slimUiButtons!);
      } catch (e) {
        console.error();
      }
    });

    PrintessIntegrationLauncher.callbacks = null;

    PrintessIntegrationLauncher.registerAddToBasketButtonListener(settings, pluginProvider, graphQlApi);
  }

  private static preconfigureTheme(settings: IShopifySettings) {
    if (!settings.uiSelectors) {
      settings.uiSelectors = {
        cssProductMediaSelector: ""
      };
    }

    const globalNamespace: any = window;
    const themeName = globalNamespace["Shopify"] && globalNamespace["Shopify"].theme ? (globalNamespace["Shopify"].theme.schema_name || globalNamespace["Shopify"].theme.name) : "";

    if (themeName) {
      switch (themeName.toLowerCase()) {
        case "horizon": {
          settings.uiSelectors.cssAddToBasketButtonSelector = settings.uiSelectors.cssAddToBasketButtonSelector || `button[type="submit"][name="add"]:not(.quick-add__button),button.product-form__add-button[data-action="add-to-cart"]:not(.quick-add__button),button#AddToCart:not(.quick-add__button),.add-to-cart-button:not(.quick-add__button),#AddToCart:not(.quick-add__button)`;
          settings.uiSelectors.cssProductContainerSelector = settings.uiSelectors.cssProductContainerSelector || ".product-information";
          settings.uiSelectors.cssCartItemSelector = settings.uiSelectors.cssCartItemSelector || "tr.cart-items__table-row"
          break;
        }
        case "spotlight":
        case "sense":
        case "dawn":
        default: {
          settings.uiSelectors.cssCartItemListSelector = settings.uiSelectors.cssCartItemListSelector || ".cart__items>.js-contents,cart-drawer,#cart-notification-product";
          settings.uiSelectors.cssCartItemSelector = settings.uiSelectors.cssCartItemSelector || "tr.cart-item";
          settings.uiSelectors.cssCartItemLinkSelector = settings.uiSelectors.cssCartItemLinkSelector || "td.cart-item__details>a";
          settings.designButtonClasses = settings.designButtonClasses || "product-form__submit button button--full-width button--primary"
          break;
        }
      }
    }
  }

  private static printessCreateSpinnerSvg(): SVGElement {
    const ret: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;

    ret.classList.add("inline");
    ret.classList.add("w-4");
    ret.classList.add("h-4");
    ret.classList.add("me-3");
    ret.classList.add("text-white");
    ret.classList.add("printess-animate-spin");

    ret.setAttribute("aria-hidden", "true");
    ret.setAttribute("role", "status");
    ret.setAttribute("viewBox", "0 0 100 101");
    ret.setAttribute("fill", "none");
    ret.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const path1: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', "path") as SVGPathElement;
    path1.setAttribute("d", "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z");
    path1.setAttribute("fill", "darkgray");//E5E7EB

    const path2: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', "path") as SVGPathElement;
    path2.setAttribute("d", "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z");
    path2.setAttribute("fill", "black");//white

    ret.appendChild(path1);
    ret.appendChild(path2);

    return ret;
  }

  public static createDirectAddToBasketButton(addToBasketText?: string, savingText?: string, additionalClasses?: string): IIntegrationButton {
    const button = document.createElement("button") as IIntegrationButton;

    button.classList.add("printess-direct-to-basket-button");
    button.setAttribute("type", "button");

    ("printess-integration-button " + (additionalClasses || "button btn button--primary")).split(" ").forEach((className) => {
      if (className) {
        button.classList.add(className);
      }
    });

    const label = document.createElement("span");
    label.classList.add("label");
    label.innerText = addToBasketText || "Add to basket";

    button.printessSetStatus = (status: PrintessDesignButtonStatus): void => {
      switch (status) {
        case "loading": {
          button.classList.add("show-progress");
          button.setAttribute("disabled", "disabled");
          label.innerText = savingText || "Saving ...";

          break;
        }
        case "hidden": {
          button.style.display = "none";

          break;
        }
        case "direct_add_to_basket":
        default: {
          button.classList.remove("show-progress");
          label.innerText = addToBasketText || "Add to basket";
          button.removeAttribute("disabled");
          //Block level as before, but a flex box: the spinner is centered by the align-items of the button's own
          //style rule, and a plain "block" here would leave it sitting in the top left corner of the button.
          button.style.display = "flex";

          break;
        }
      }

      button.setAttribute("data-printess-status", status);
    };

    button.printessGetStatus = (): PrintessDesignButtonStatus => {
      return (button.getAttribute("data-printess-status") as PrintessDesignButtonStatus | null) || "hidden";
    };

    button.appendChild(PrintessIntegrationLauncher.printessCreateSpinnerSvg());
    button.appendChild(label);

    return button;
  }

  private static createDesignNowButton(initialBasketButton: HTMLElement, addToBasketButtonSelector: string, loadingText?: string, designNowText?: string, addToBasketText?: string, additionalClasses?: string): IIntegrationButton {
    const button = document.createElement("button") as IIntegrationButton;
    button.classList.add("printess-integration-button");
    button.setAttribute("type", "button");

    //The theme can rerender the product form at any time (variant switching), so the add to basket
    //button we were created for is not necessarily the one currently living in the dom.
    let basketButton: HTMLElement = initialBasketButton;
    let buttonWasRemoved = false;

    loadingText = loadingText || "Loading ...";
    designNowText = designNowText || "Design now";

    ("printess-integration-button " + (additionalClasses || "button btn button--primary")).split(" ").forEach((className) => {
      if (className) {
        button.classList.add(className);
      }
    });

    const label = document.createElement("span");
    label.classList.add("label");
    label.innerText = loadingText || "Loading ...";

    button.printessSetStatus = (status: PrintessDesignButtonStatus): void => {
      switch (status) {
        case "loading": {
          button.classList.add("show-progress");
          button.setAttribute("disabled", "disabled");
          label.innerText = loadingText || "Loading ...";

          if (basketButton) {
            if (basketButton.style.display && basketButton.style.display !== "none") {
              basketButton.setAttribute("data-printess-display", basketButton.style.display);
            }

            basketButton.style.display = "none";
          }

          if (button.parentElement && button.parentElement.matches(".printess-integration-button-wrapper")) {
            const fullButton = button.parentElement.querySelector(".printess-editor-button");

            if (fullButton) {
              fullButton.classList.add("printess-hidden");
            }
          }

          break;
        }
        case "hidden": {
          button.style.display = "none";

          if (basketButton) {
            //Empty, not "block": the attribute is only written when the button had an inline display, so without it
            //the theme's own style rules are what has to come back - "block" would break a flex button of its own.
            basketButton.style.display = basketButton.getAttribute("data-printess-display") || "";
          }

          if (button.parentElement && button.parentElement.matches(".printess-integration-button-wrapper")) {
            const fullButton = button.parentElement.querySelector(".printess-editor-button");

            if (fullButton) {
              fullButton.classList.add("printess-hidden");
            }
          }

          break;
        }
        default:
        case "slimui": {
          const wrapper = basketButton.closest(".printess-integration-button-wrapper");

          if (wrapper) {
            wrapper.querySelector(".printess-editor-button")?.classList.remove("printess-hidden");
          } else {
            basketButton.parentElement?.querySelector(".printess-editor-button")?.classList.remove("printess-hidden");
          }
          //Add no break here, needs to fall through to editor
        }
        case "direct_add_to_basket":
        case "editor": {
          button.classList.remove("show-progress");
          label.innerText = status == "editor" ? (designNowText || "Design now") : (addToBasketText || "Add to basket");
          button.removeAttribute("disabled");
          //Block level as before, but a flex box: the spinner is centered by the align-items of the button's own
          //style rule, and a plain "block" here would leave it sitting in the top left corner of the button.
          button.style.display = "flex";

          if (basketButton) {
            if (basketButton.style.display && basketButton.style.display !== "none") {
              basketButton.setAttribute("data-printess-display", basketButton.style.display);
            }

            basketButton.style.display = "none";
          }

          break;
        }
      }

      button.setAttribute("data-printess-status", status);
    };

    button.printessGetStatus = (): PrintessDesignButtonStatus => {
      return (button.getAttribute("data-printess-status") as PrintessDesignButtonStatus | null) || "hidden";
    };

    /**
     * Binds this button to the given add to basket button and makes sure that our button
     * (respectively its wrapper) sits right next to it inside the dom.
     */
    const attachToBasketButton = (newBasketButton: HTMLElement | null): void => {
      if (buttonWasRemoved) {
        return;
      }

      if (newBasketButton) {
        basketButton = newBasketButton;
      }

      if (!basketButton) {
        return;
      }

      basketButton.setAttribute("data-printess-attached", "true");

      //If the button lives inside a wrapper (direct add to basket / full editor button) the complete wrapper has to be moved
      const nodeToMove: HTMLElement = (button.closest(".printess-integration-button-wrapper") as HTMLElement | null) || button;

      if (!PrintessIntegrationLauncher.isAttachedToDom(nodeToMove) || nodeToMove.previousElementSibling !== basketButton) {
        basketButton.after(nodeToMove);
      }

      //Reapply the current state so the theme button gets hidden again
      button.printessSetStatus(button.printessGetStatus());
    };

    /**
     * Returns the add to basket button that is currently inside the dom. If the theme rerendered the
     * product form, the button we kept in memory got detached. In that case the replacement is looked
     * up and our design now button is moved back next to it.
     */
    const resolveAddToBasketButton = (): HTMLElement => {
      if (buttonWasRemoved) {
        return basketButton;
      }

      if (PrintessIntegrationLauncher.isAttachedToDom(basketButton) && PrintessIntegrationLauncher.isAttachedToDom(button)) {
        return basketButton;
      }

      const replacement = PrintessIntegrationLauncher.isAttachedToDom(basketButton) ? basketButton : PrintessIntegrationLauncher.findCurrentAddToBasketButton(button, addToBasketButtonSelector);

      if (replacement) {
        attachToBasketButton(replacement);
      }

      return basketButton;
    };

    button.printessSetAddToBasketButton = (newBasketButton: HTMLElement): void => {
      attachToBasketButton(newBasketButton);
    };

    button.printessIsAttached = (): boolean => {
      return !buttonWasRemoved && PrintessIntegrationLauncher.isAttachedToDom(button) && PrintessIntegrationLauncher.isAttachedToDom(basketButton);
    };

    button.printessGetAddToBasketForm = (): HTMLFormElement | null => {
      const currentBasketButton = resolveAddToBasketButton();

      const candidates = [
        PrintessIntegrationLauncher.getFormOfElement(currentBasketButton),
        //Our own button might still sit inside the product form
        PrintessIntegrationLauncher.getFormOfElement(button)
      ];

      //Prefer a form which is really part of the document, a form of a rerendered page section is useless
      const attachedForm = candidates.find((x) => PrintessIntegrationLauncher.isAttachedToDom(x));

      return attachedForm || candidates.find((x) => !!x) || null;
    };

    button.printessGetProductId = (): string | null => {
      return PrintessIntegrationLauncher.getProductIdForElement(button.printessGetAddToBasketForm());
    };

    button.printessGetAddToBasketButton = () => {
      return resolveAddToBasketButton();
    };

    button.printessRemoveButton = () => {
      button.printessSetStatus("hidden");

      buttonWasRemoved = true;

      button.remove();
    };

    button.printessSetCaption = (caption: string): string => {
      const label = button.querySelector<HTMLSpanElement>(".label");

      if (label && caption) {
        const ret = label.innerText;

        label.innerText = caption;

        return ret;
      } else {
        return "";
      }
    };

    let afterCallbacks: ((integrationButton: IIntegrationButton) => void)[] | null = [];

    button.executeAfterInitialization = (callback: ((integrationButton: IIntegrationButton) => void)): void => {
      if (typeof callback === "function") {
        if (button.integration) {
          if (afterCallbacks) {
            afterCallbacks.push(callback);

            afterCallbacks.forEach((cb) => {
              try {
                cb(button);
              } catch (e) {
                console.error(e);
              }
            });

            afterCallbacks = null;
          } else {
            try {
              callback(button);
            } catch (e) {
              console.error(e);
            }
          }
        } else {
          afterCallbacks?.push(callback);
        }
      }
    };

    button.appendChild(PrintessIntegrationLauncher.printessCreateSpinnerSvg());
    button.appendChild(label);

    (button as any).printessSetStatus("loading", basketButton);

    return button;
  }

  private static async importIntoGlobalNamespace(url: string): Promise<Record<string, any>> {
    const file = await import(/* webpackIgnore: true */ url) as Record<string, any>;

    if (file) {
      for (const exportEntry in file) {
        if (file[exportEntry] && !(<any>window)[exportEntry]) {
          (<any>window)[exportEntry] = file[exportEntry];
        }
      }
    }

    return file;
  }

  private static getPreloadedProduct(productId: number, settings: IShopifySettings): IProduct | null {
    let ret: IProduct | null = null;
    const optionNameLookUp: Record<number, string> = {};

    if (settings && settings.disableProductPreload === true) {
      return null;
    }

    if (settings && settings.product && productId === settings.product.id) {
      ret = settings.product;

      if (settings.productOptions) {
        if (settings.productOptions.length > 0 && settings.productOptions[0]) {
          if (!ret.productOptions) {
            ret.productOptions = [];
          }

          settings.productOptions.forEach((option, index) => {
            if (option) {
              const productOption: IProductOption<number> = {
                name: option.name,
                id: 0,
                position: option.position,
                optionValues: option.values
              };

              optionNameLookUp[option.position] = option.name;

              ret!.productOptions!.push(productOption);
            }
          });

          if (settings.product.variants) {
            settings.product.variants.forEach((variant) => {
              if (!variant.optionLookup && variant.options) {
                variant.optionLookup = variant.options.map((optionValue, index) => {
                  return {
                    name: optionNameLookUp[index + 1] ? optionNameLookUp[index + 1] : "",
                    value: optionValue
                  }
                });
              }
            });
          }
        }
      }

      if (settings.productMetaFields) {
        (<any>ret).metaData = settings.productMetaFields;

        for (const propertyName in settings.productMetaFields) {
          if (settings.productMetaFields.hasOwnProperty(propertyName)) {
            let key = propertyName;
            let value = settings.productMetaFields[propertyName];

            if (propertyName === "settings") {
              key = "printessSettings";

              if (typeof value !== "string") {
                value = JSON.stringify(value);
              }
            }
            (<any>ret)[key] = { value: value || "" };
          }
        }
      }

      if (settings.variantMetaData && settings.product && settings.product.variants) {
        settings.variantMetaData.forEach((metaData) => {
          const variant = settings.product!.variants.find(x => x.id === metaData.variantId);

          if (variant) {
            (<any>variant).metaData = metaData.metaFields;

            if (metaData.customMetaFields) {
              (<any>variant).metaData = {
                ...metaData.customMetaFields,
                ...(<any>variant).metaData
              };
            }

            for (const propertyName in metaData.metaFields) {
              if (metaData.metaFields.hasOwnProperty(propertyName)) {
                let key = propertyName;
                let value = metaData.metaFields[propertyName];

                if (propertyName === "settings" || propertyName === "variantSettings") {
                  key = "printessSettings";

                  if (typeof value !== "string") {
                    value = JSON.stringify(value);
                  }
                }

                (<any>variant)[key] = { value: value };
              }
            }
          }
        });
      }
    }

    return ret;
  }

  /**
   * Renames the options of the preloaded product (rendered by liquid in the language of the storefront) to the
   * names the api delivers, so the product looks exactly like one loaded from the api. The storefront names are
   * kept as localizedName, the inputs of the theme still use them.
   *
   * Option values are matched by id, which does not depend on the language, or by their order if the ids are
   * missing. Variants are matched by option position.
   */
  private static renamePreloadedOptions(settings: IShopifySettings, apiOptions: IProductOption<number>[]): void {
    const product = settings.product;

    if (!product || !product.productOptions) {
      return;
    }

    //Per option position: storefront value name -> api value name
    const valueLookUp: Record<number, Record<string, string>> = {};
    const optionNameLookUp: Record<number, string> = {};

    product.productOptions.forEach((option) => {
      const apiOption = apiOptions.find((x) => x.position === option.position);

      if (!apiOption) {
        optionNameLookUp[option.position] = option.name;
        return;
      }

      const lookUp: Record<string, string> = {};
      const apiValues = apiOption.optionValues || [];

      option.optionValues = (option.optionValues || []).map((value, index) => {
        let apiValue = apiValues.find((x) => x.id === value.id);

        if (!apiValue && apiValues.length === option.optionValues.length) {
          apiValue = apiValues[index];
        }

        if (!apiValue) {
          return value;
        }

        lookUp[value.name] = apiValue.name;

        //A copy, the values are shared with settings.productOptions
        return {
          ...value,
          name: apiValue.name,
          localizedName: value.name
        };
      });

      valueLookUp[option.position] = lookUp;
      optionNameLookUp[option.position] = apiOption.name;
      option.localizedName = option.name;
      option.name = apiOption.name;
    });

    const renameValue = (position: number, value: string): string => {
      const lookUp = valueLookUp[position];

      return lookUp && typeof lookUp[value] === "string" ? lookUp[value] : value;
    };

    (product.variants || []).forEach((variant) => {
      if (!variant.options) {
        return;
      }

      variant.options = variant.options.map((value, index) => renameValue(index + 1, value));
      variant.option1 = variant.options.length > 0 ? variant.options[0] : variant.option1;
      variant.option2 = variant.options.length > 1 ? variant.options[1] : variant.option2;
      variant.option3 = variant.options.length > 2 ? variant.options[2] : variant.option3;
      variant.optionLookup = variant.options.map((value, index) => {
        return {
          name: optionNameLookUp[index + 1] || "",
          value: value
        };
      });
    });
  }

  public static getEditorButtons() {
    return [...PrintessIntegrationLauncher.editorButtons || []];
  }

  public static getSlimuiButtons() {
    return [...PrintessIntegrationLauncher.slimUiButtons || []];
  }

  private static async registerAddToBasketButtonListener(settings: IShopifySettings, pluginProvider: IPluginContainer, graphQlApi?: IPrintessShopifyGraphQlApi | null): Promise<void> {
    let debounceTimer: number | null = null;

    if (!graphQlApi) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-graphql-api.js");

      if (typeof createPrintessShopifyApi === "undefined" && typeof exports["createPrintessShopifyApi"] === "undefined") {
        return;
      }

      graphQlApi = (createPrintessShopifyApi || exports["createPrintessShopifyApi"])(settings.apiDomain || "", settings.shopToken, settings.graphQlToken, settings.graphQlLanguage || "");
    }

    const addToBasketButtonSelector = PrintessIntegrationLauncher.getAddToBasketButtonSelector(settings);

    const getKnownButtons = (): IIntegrationButton[] => {
      return [...(PrintessIntegrationLauncher.editorButtons || []), ...(PrintessIntegrationLauncher.slimUiButtons || [])];
    };

    /**
     * Themes like "Prestige" rerender the complete product form on variant switch. This removes our design now
     * button and the add to basket button we keep in memory from the dom. Instead of creating a second
     * integration we move the existing instance next to the newly rendered add to basket button and let it
     * point to that new button.
     */
    const reattachExistingButton = (addToBasketButton: HTMLElement): boolean => {
      const detachedButtons = getKnownButtons().filter((x) => typeof x.printessIsAttached === "function" && !x.printessIsAttached());

      if (detachedButtons.length === 0) {
        return false;
      }

      const productId = PrintessIntegrationLauncher.getProductIdForElement(addToBasketButton);

      let existingButton: IIntegrationButton | null = null;

      if (productId) {
        existingButton = detachedButtons.find((x) => x.product && (x.product.id || "").toString() === productId) || null;
      }

      if (!existingButton && detachedButtons.length === 1 && getKnownButtons().length === 1) {
        existingButton = detachedButtons[0];
      }

      if (!existingButton || typeof existingButton.printessSetAddToBasketButton !== "function") {
        return false;
      }

      existingButton.printessSetAddToBasketButton(addToBasketButton);

      const integration = existingButton.integration;

      if (integration && typeof (<any>integration).onIntegrationButtonReattached === "function") {
        try {
          (<any>integration).onIntegrationButtonReattached(existingButton);
        } catch (e) {
          console.error(e);
        }
      }

      return true;
    };

    const processPendingButtons = async (): Promise<void> => {
      //Heal buttons whose add to basket button (or our own button) got removed by a rerender of the theme
      getKnownButtons().forEach((knownButton) => {
        if (typeof knownButton.printessIsAttached === "function" && !knownButton.printessIsAttached()) {
          //Triggers the lookup of the current add to basket button and moves our button back into the dom
          knownButton.printessGetAddToBasketButton();
        }
      });

      const addToBasketButtons = document.querySelectorAll(addToBasketButtonSelector);

      for (const addToBasketButton of addToBasketButtons) {
        if (addToBasketButton.getAttribute("data-printess-attached") || (addToBasketButton as HTMLElement).matches(".printess-integration-button") || (addToBasketButton as HTMLElement).matches(".printess-direct-to-basket-button")) {
          continue;
        }

        if (reattachExistingButton(addToBasketButton as HTMLElement)) {
          continue;
        }

        addToBasketButton.setAttribute("data-printess-attached", "true");

        const designNowButton = PrintessIntegrationLauncher.createDesignNowButton(addToBasketButton as HTMLElement, addToBasketButtonSelector, settings.captions?.loadingButtonText || "Loading ...", settings.captions?.designNow || "Design now", settings.captions?.addToBasket || "Add to basket", settings.designButtonClasses);

        addToBasketButton.after(designNowButton);

        const type = await this.initializeIntegrationButton(settings, designNowButton, graphQlApi);

        if (type == "editor") {
          //initializeIntegrationButton already registered the button in editorButtons
          const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-shopify.js");

          if (exports && typeof exports["PrintessShopify"] !== "undefined" && typeof (<any>exports["PrintessShopify"]).createProductIntegration !== "undefined") {

            (<any>exports["PrintessShopify"]).createProductIntegration(settings, designNowButton, pluginProvider).then((integration: IIntegration) => {
              designNowButton.integration = integration;

              //Trigger execution of all init callbacks
              designNowButton.executeAfterInitialization((btn: IIntegrationButton) => { });
            });
          }
        } else if (type == "slimui") {
          //initializeIntegrationButton already registered the button in slimUiButtons
          const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-shopify-slimui.js");

          if (exports && typeof exports["PrintessShopifySlimUi"] !== "undefined" && typeof (<any>exports["PrintessShopifySlimUi"]).create !== "undefined") {
            (<any>exports["PrintessShopifySlimUi"]).create(settings, designNowButton, pluginProvider).then((integration: IIntegration) => {
              designNowButton.integration = integration;

              //Trigger execution of all init callbacks
              designNowButton.executeAfterInitialization((btn: IIntegrationButton) => { });
            });
          }
        }
      }
    };

    const scheduleProcessPendingButtons = (): void => {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;

        processPendingButtons();
      }, 100);
    };

    const isButtonElement = (element: Element): boolean => {
      return element.tagName === 'BUTTON' || (element.tagName === 'INPUT' && ((element as HTMLInputElement).type === 'button' || (element as HTMLInputElement).type === 'submit'));
    };

    const containsButton = (element: Element): boolean => {
      //Themes which rerender whole page sections add/remove a container, not the button itself
      return isButtonElement(element) || !!element.querySelector('button,input[type="button"],input[type="submit"]');
    };

    const callback = (mutationsList: MutationRecord[]): void => {
      let doSchedule = false;

      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const changedNodes = [mutation.addedNodes, mutation.removedNodes];

          for (const nodeList of changedNodes) {
            for (let i = 0; i < nodeList.length; ++i) {
              if (nodeList[i].nodeType === Node.ELEMENT_NODE && containsButton(nodeList[i] as Element)) {
                doSchedule = true;
                break;
              }
            }

            if (doSchedule) {
              break;
            }
          }

          if (doSchedule) {
            break;
          }
        }
      }

      if (doSchedule) {
        scheduleProcessPendingButtons();
      }
    };

    const observer = new MutationObserver(callback);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

function registerPrintessPlugin(plugin: IPlugin): void {
  if (plugin) {
    PrintessIntegrationLauncher.plugins.push(plugin);
  }
}