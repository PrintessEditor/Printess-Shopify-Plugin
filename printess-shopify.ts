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

import { PrintessEditor, PrintessEditorFrontend } from "./printessEditor.js";
import { ICreateSaveTokenParams, PrintessSharedTools } from "./printess-shared-tools.js";
import { IProduct as IShopifyProduct, IShortVariant, IVariant as IShopifyVariant, IVariant, IPrintessShopifyGraphQlApi } from "./printess-graphql-api.d";
import { PrintessShopifyGraphQlApi } from "./printess-graphql-api.js";
import { IIntegrationButton, ISessionSettings, IShopifySettings, IUrlParams, ICartItem, IIntegration, IImageDimensionFormFields, TImageFormat, IPluginContainer, PrintessDesignButtonStatus } from "./printess-shopify.d";
import { iExternalBookSettings, iExternalImage, iMergeTemplate, iPrintessApi, iPrintessComponent, IProduct } from "./printess-editor.d";
import { IShopData } from "./printess-editor.d";
import { IPrintessPriceConfig, PrintessPriceCalculator } from "./printess-price-calculator.js";
import { INameValuePair, IPluginContext, IPlugin, TUiType, IEditorSettings, IFormFieldMapping, IPrintessProduct, IPrintessProductSettings, IPrintessProductVariant, IPrintessVariantSettings, TVariantPersonalizationOption } from "./printess-plugins.d"
import { PrintessPluginHost } from "./printess-plugin-host.js";

type IntegrationMode = "ProductPage" | "Cart";
type DesignNowDisplayState = "show" | "hide";

interface ILoginData {
  saveToken: string,
  thumbnailUrl: string,
  displayName: string,
  shopSaveData: IShopData,
  type: "register" | "login",
  variantId: string,
  productOptions: Record<string, string>
}

interface IMixedProduct extends IShopifyProduct, IPrintessProduct {
  price: number
}

interface IMixedProductVariant extends IShopifyVariant<number>, IPrintessProductVariant {

}

declare class PrintessIntegrationLauncher {
  static createDirectAddToBasketButton(addToBasketText?: string, savingText?: string, additionalClasses?: string): IIntegrationButton;
}

export class PrintessShopify implements IIntegration {
  private configuration: IShopifySettings;
  private product: IShopifyProduct;
  private defaultVariant: IShopifyVariant<number>;
  private designNowButton: IIntegrationButton | null = null;
  private mode: IntegrationMode;
  private editor: PrintessEditor;
  private cartItem: ICartItem | null = null;
  private urlParams: IUrlParams | null = null;
  private isSaveTokenEditing = false;
  private pluginContainer: IPluginContainer;
  private plugins: IPlugin[] = [];
  private priceConfig: IPrintessPriceConfig | null = null;


  private static shortVariantCache: Record<number, IShortVariant[]> = {};
  private static variantCache: Record<number, IVariant<number>> = {};

  private static readonly customerLoginStateKey = "_printessCustomerIsLoggedIn";
  private static customerLoginStateSynced = false;

  public getComponent(): iPrintessComponent | null {
    return this.editor?.getComponent() || null;
  }

  public getApi(): iPrintessApi | null {
    return this.editor?.getApi() || null;
  }

  public registerPlugin(plugin: IPlugin) {
    if (plugin && typeof this.pluginContainer.getPlugins().find((x => x === plugin)) !== "undefined") {
      this.plugins.push(plugin);
    }
  }

  public getPlugins(): IPlugin[] {
    return [
      ...this.pluginContainer.getPlugins(),
      ...this.plugins
    ];
  }

  private constructor(config: IShopifySettings, product: IShopifyProduct, pluginContainer: IPluginContainer) {
    if (!config) {
      throw "Printess integration: No shopify configuration provided."
    }

    if (!config.shopToken) {
      throw "Printess integration: No Printess shop token provided."
    }

    if (!config.graphQlToken) {
      throw "Printess integration: No Shopify app token (GraphQl token) provided."
    }

    this.configuration = PrintessShopify.applyThemeSettings(config);
    this.product = product;
    this.pluginContainer = pluginContainer;

    PrintessShopify.syncCustomerLoginState(this.configuration);

    PrintessEditorFrontend.preloadEditor(config.editorDomain || "", config.editorVersion || "");
  }

  public getIntegrationButton(): IIntegrationButton | null {
    return this.designNowButton;
  }

  public async loadSaveToken(saveToken: string): Promise<boolean> {
    if (!this.editor) {
      console.error("Printess Integration: Printess Editor is not initialized yet");
    }

    return await this.editor.loadSaveToken(saveToken);
  }

  /**
   * Not every shop uses our hosted PrintessIntegrationLauncher, some ship an older copy of it inside their
   * theme. Those older launchers do not provide the whole button api, so every call into it has to be
   * feature detected and must never be the only way to get to the product form / add to basket button.
   */
  private static callButtonApi<T>(button: IIntegrationButton | null, methodName: "printessGetAddToBasketForm" | "printessGetAddToBasketButton"): T | null {
    if (!button || typeof (<any>button)[methodName] !== "function") {
      return null;
    }

    try {
      return ((<any>button)[methodName]() as T) || null;
    } catch (e) {
      console.warn("Printess Integration: " + methodName + " of the integration button failed.", e);

      return null;
    }
  }

  /**
   * Returns the product form that is currently inside the dom.
   *
   * The legacy lookup (the form our design now button sits in) stays the primary source of truth, so shops
   * running an older PrintessIntegrationLauncher from their theme behave exactly like before. Only if that
   * lookup does not yield a form which is part of the document - which is what happens on themes rerendering
   * the product form on variant switch, for example "Prestige" - we ask the launcher for the current form.
   * A recent launcher heals itself in that call and moves our button back into the dom, so never cache the result.
   */
  private getProductForm(): HTMLFormElement | null {
    if (!this.designNowButton) {
      return null;
    }

    const ownForm = this.designNowButton.form || this.designNowButton.closest("form");

    if (ownForm && document.body.contains(ownForm)) {
      return ownForm;
    }

    const currentForm = PrintessShopify.callButtonApi<HTMLFormElement>(this.designNowButton, "printessGetAddToBasketForm");

    if (currentForm && document.body.contains(currentForm)) {
      return currentForm;
    }

    return ownForm || currentForm;
  }

  /**
   * Returns the add to basket button of the theme that is currently inside the dom.
   *
   * Same order as getProductForm(): searching inside the product form is the legacy behaviour and stays first,
   * the launcher is only asked when the form does not contain a usable button.
   */
  private getAddToBasketButton(form?: HTMLFormElement | null): HTMLButtonElement | null {
    const selector = this.configuration.uiSelectors?.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart';
    const productForm = form || this.getProductForm();

    if (productForm) {
      const buttonInForm = productForm.querySelector(selector) as HTMLButtonElement | null;

      if (buttonInForm) {
        return buttonInForm;
      }
    }

    const currentButton = PrintessShopify.callButtonApi<HTMLElement>(this.designNowButton, "printessGetAddToBasketButton");

    if (currentButton && document.body.contains(currentButton)) {
      return currentButton as HTMLButtonElement;
    }

    return null;
  }

  private static applyThemeSettings(config: IShopifySettings): IShopifySettings {
    const ret: IShopifySettings = {
      ...config
    };

    if (!ret.uiSelectors) {
      ret.uiSelectors = {
        cssProductMediaSelector: ""
      };
    }

    let fallbackThemeName = "";
    const globalNamespace: any = window;

    if (globalNamespace["Shopify"] && globalNamespace["Shopify"].theme && globalNamespace["Shopify"].theme.name) {
      fallbackThemeName = (globalNamespace["Shopify"].theme.name || "").toLowerCase();
    }

    if (ret.slimUi.shopThemeName || fallbackThemeName) {
      switch (ret.slimUi.shopThemeName?.toLowerCase() || fallbackThemeName) {
        case "horizon": {
          ret.uiSelectors.cssProductContainerSelector = ret.uiSelectors.cssProductContainerSelector || "product-component";
          break;
        }
        default: {
          ret.uiSelectors.cssProductContainerSelector = ret.uiSelectors.cssProductContainerSelector || ".product";
          break;
        }
      }
    }

    return ret;
  }

  private getPluginContextDummy(product?: IPrintessProduct | null, variant?: IPrintessProductVariant | null): IPluginContext {
    return {
      integration: this,
      product: product || {} as any as IPrintessProduct,
      type: "editor",
      variant: variant || null
    };
  }

  public async productIsPersonalizableAsync(context: IPluginContext, currentValue: boolean): Promise<boolean> {
    const templateName = await this.getTemplateNameAsync(context, "", true);

    if (templateName) {
      return true;
    } else {
      return false;
    }

    // if (!PrintessShopify.shortVariantCache[this.product.id]) {
    //   return currentValue;
    // }

    // const variants = PrintessShopify.shortVariantCache[this.product.id];
    // const productHasTemplate = !!(this.product.templateName && this.product.templateName.value);
    // const noVariantsHaveTemplate = !variants.find((v: IShortVariant) => typeof v.templateName !== "undefined" && v.templateName);

    // // Case 1: product has a template and no variant has a template
    // if (productHasTemplate && noVariantsHaveTemplate) {
    //   return true;
    // }

    // // Case 2: every variant has a template name
    // if (variants.length > 0 && variants.every((v: IShortVariant) => typeof v.templateName !== "undefined" && v.templateName)) {
    //   return true;
    // }

    // // Cases 3 & 4: check the currently selected variant's template name
    // // Case 3: product has no template but current variant has one
    // // Case 4: product has a template, not all variants have one, but current variant does
    // const someVariantsMissingTemplate = !variants.every((v: IShortVariant) => typeof v.templateName !== "undefined" && v.templateName);
    // if (!productHasTemplate || (productHasTemplate && someVariantsMissingTemplate)) {
    //   const currentVariant = await this.getCurrentVariantAsync(context);
    //   if (currentVariant.getTemplateName()) {
    //     return true;
    //   }
    // }

    // return false;
  }

  public async getTemplateNameAsync(context: IPluginContext, currentValue: string, ignoreEditor: boolean = false): Promise<string> {
    const currentVariant = await this.getCurrentVariantAsync(context);
    const variantTemplate = currentVariant.getTemplateName();
    let currentTemplateName = variantTemplate || this.product.templateName?.value || currentValue;

    if (!currentTemplateName) {
      const variants = PrintessShopify.shortVariantCache[this.product.id];
      const someVariantsHaveTemplateName = typeof variants.find((v) => typeof v.templateName !== "undefined" && v.templateName != null && v.templateName.length > 0) !== "undefined";

      currentTemplateName = someVariantsHaveTemplateName ? "" : (this.product.templateName?.value || "");
    }

    if (ignoreEditor || !this.editor) {
      //Ask the plugins ourselve
      const plugins = this.getPlugins();

      for (let i = 0; i < plugins.length; ++i) {
        const plugin = plugins[i];

        try {
          if (typeof plugin.getTemplateNameAsync === "function") {
            let val: Promise<string> | string = plugin.getTemplateNameAsync(context, currentTemplateName);

            if (val && val instanceof Promise) {
              val = await val;
            }

            if (typeof val !== "undefined" && val) {
              currentTemplateName = val;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    return currentTemplateName;
  }

  private async evaluateDesignNowButtonDisplayState(variantId?: number): Promise<DesignNowDisplayState> {
    const preloadedVariant = variantId ? await this.getVariantById(variantId) : null;
    const product = PrintessShopify.convertProduct(this.product);
    const currentVariant = preloadedVariant ? this.convertShopifyVariantToPrintessVariant(preloadedVariant) : await this.getCurrentVariantAsync(this.getPluginContextDummy(product));
    const pluginContext = this.getPluginContextDummy(product, currentVariant);

    return (await this.productIsPersonalizableAsync(pluginContext, false)) === true ? "show" : "hide";


    // if (!PrintessShopify.shortVariantCache[this.product.id]) {
    //   throw `Printess integration: No variants loaded for product with id ${this.product.id}`;
    // }

    // const variantsHaveTemplateName: boolean = typeof PrintessShopify.shortVariantCache[this.product.id].find((variant: IShortVariant) => {
    //   return typeof variant.templateName !== "undefined" && variant.templateName;
    // }) !== "undefined";

    // if (variantsHaveTemplateName) {
    //   const currentVariant = await this.getCurrentVariantAsync(this.getPluginContextDummy());

    //   return currentVariant.getTemplateName() ? "show" : "hide";
    // } else {
    //   return this.product.templateName && this.product.templateName.value ? "show" : "hide";
    // }
  }

  public getGraphQlApi(): IPrintessShopifyGraphQlApi {
    return new PrintessShopifyGraphQlApi(this.configuration.apiDomain || "", this.configuration.shopToken, this.configuration.graphQlToken, this.configuration.graphQlLanguage || "");
  }

  private async initializeProductPageFromCartItem(cartItem: ICartItem): Promise<void> {
    if (cartItem && cartItem.properties) {
      for (const [key, value] of Object.entries(cartItem.properties)) {
        await this.updateFormFieldValue(key, value);
      }
    }

    //Only shops that show the theme's price in the editor need the theme quantity, writing it may make themes / apps re-render.
    //Last, as the properties above may switch the variant and themes re-render their quantity input on that
    const context = this.getPluginContextDummy();
    const editorSettings = this.getPluginHost().getEditorSettings(context, this.getEditorSettings(context));

    if (editorSettings.priceDisplayElementSelector) {
      this.setThemeQuantity(this.urlParams?.quantity || cartItem?.quantity || 0);
    }
  }

  /**
   * Writes the quantity of the edited cart line into the theme's quantity input, so the theme and price apps show the
   * price for that quantity, which is what the priceDisplayElementSelector editor setting reads. Only used for shops
   * having that setting, as the events may make themes / apps re-render. The events let the theme notice the change,
   * setting the value alone is ignored by most of them.
   */
  private setThemeQuantity(quantity: number): void {
    try {
      const input = this.getThemeQuantityInput();

      if (!input || isNaN(quantity) || !isFinite(quantity) || quantity <= 0 || input.value === quantity.toString()) {
        return;
      }

      input.value = quantity.toString();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (e) {
      console.error(e);//An unexpected theme quantity selector must not prevent editing the cart item
    }
  }

  /**
   * The quantity selector inside the product form, or, as a lot of themes place it outside of the form, the one linked
   * to it with form="...".
   */
  private getThemeQuantityInput(): HTMLInputElement | HTMLSelectElement | null {
    const form = this.getProductForm();

    if (!form) {
      return null;
    }

    let ret = form.querySelector<HTMLInputElement | HTMLSelectElement>('[name="quantity"]');

    if (!ret && form.id) {
      ret = document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="quantity"][form="${CSS.escape(form.id)}"]`);
    }

    return ret;
  }

  private listenOnVariantChanges() {
    const that = this;

    const extractVariantId = (): number | null => {
      const param = new URLSearchParams(window.location.search).get('variant');
      return param ? parseInt(param, 10) : null;
    };

    // Tracks the last variant ID we actually fired onVariantChanged for — not every
    // intermediate URL write. Internal Printess calls (e.g. the pushState at line 1816
    // inside onFormFieldChangedAsync) also go through the wrapped history methods and
    // would silently advance this value, making a subsequent switch to the same variant
    // appear as a no-op. By only updating this inside the debounce callback we compare
    // against the last value that produced a real notification.
    let lastFiredVariantId: number | null = extractVariantId();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    //Status the button had before a pending variant switch put it into loading, null while no switch is pending
    let statusBeforeSwitch: PrintessDesignButtonStatus | null = null;

    const handleUrlChange = () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }

      //Until the new variant is evaluated the theme's add to basket button must not be clickable, otherwise a personalizable
      //variant can be added without personalization while the variant lookup is still running on a slow connection
      const pendingVariantId = extractVariantId();

      if (statusBeforeSwitch === null && pendingVariantId !== null && pendingVariantId !== lastFiredVariantId && that.designNowButton && typeof that.designNowButton.printessGetStatus === "function" && (!that.editor || !that.editor.editorIsOpen())) {
        statusBeforeSwitch = that.designNowButton.printessGetStatus();
        that.designNowButton.printessSetStatus("loading");
      }

      debounceTimer = setTimeout(async () => {
        debounceTimer = null;
        const variantId = extractVariantId();
        const previousStatus = statusBeforeSwitch;

        try {
          if (variantId !== null && variantId !== lastFiredVariantId) {
            lastFiredVariantId = variantId;
            await that.onVariantChanged(variantId);
          }
        } catch (e) {
          console.error(e);
        } finally {
          //onVariantChanged did not decide (e.g. variant not found, switched back to the same variant), keep the old state
          if (previousStatus !== null) {
            statusBeforeSwitch = null;

            if (that.designNowButton && that.designNowButton.printessGetStatus() === "loading") {
              that.designNowButton.printessSetStatus(previousStatus);
            }
          }
        }
      }, 50);
    };

    // Intercept history.replaceState — used by Dawn and most modern Shopify themes
    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
      originalReplaceState(...args);
      handleUrlChange();
    };

    // Intercept history.pushState for themes that push instead of replace
    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      originalPushState(...args);
      handleUrlChange();
    };

    // Cover browser back/forward navigation
    window.addEventListener('popstate', handleUrlChange);
  }

  private async onVariantChanged(variantId: number): Promise<void> {
    if (!this.editor || !this.editor.editorIsOpen()) {
      const variant = await this.getVariantById(variantId);

      if (variant) {
        const pluginHost = this.getPluginHost();
        const product = PrintessShopify.convertProduct(this.product);
        const printessVariant = this.convertShopifyVariantToPrintessVariant(variant);
        const productSettings = product.getSettings();
        const variantSettings = printessVariant.getSettings();
        const personalizationMode = await pluginHost.getVariantPersonalizationTypeAsync(this.getPluginContextDummy(product, printessVariant), printessVariant, variantSettings?.personalizationMode || productSettings?.personalizationMode || "personalize");

        if (await this.evaluateDesignNowButtonDisplayState(variantId) === "hide") {
          //The theme's add to basket button takes over, it must not send the values of a previous personalization along
          this.clearProductFormFromPrintessValues();
          this.designNowButton!.printessSetStatus("hidden");
        } else {
          this.designNowButton!.printessSetStatus(personalizationMode === "directAdd" ? "direct_add_to_basket" : "editor");
        }

        await this.updateDirectAddToBasketButtonAsync(product, printessVariant, personalizationMode);
      }
    }
  }

  public static async createProductIntegration(config: IShopifySettings, designNowButton: IIntegrationButton, pluginContainer: IPluginContainer): Promise<PrintessShopify> {
    if (!designNowButton.product) {
      throw "Printess Integration: Integration button does not have a prod uct assigned";
    }

    const ret = new PrintessShopify(config, designNowButton.product!, pluginContainer);
    ret.mode = "ProductPage";

    if (typeof config.getShopLevelSettings === "function") {
      try {
        const printessShopSettings = config.getShopLevelSettings();

        if (typeof printessShopSettings.useAdditionalPricing !== undefined && printessShopSettings.useAdditionalPricing !== null && printessShopSettings.useAdditionalPricing === true) {
          if (ret.product && ret.product.additionalPrices && ret.product.additionalPrices.value) {
            try {
              ret.priceConfig = typeof ret.product.additionalPrices.value === "string" ? <IPrintessPriceConfig>JSON.parse(ret.product.additionalPrices.value) : (ret.product?.additionalPrices?.value ? ret.product?.additionalPrices?.value : null);
            } catch (e) {
              ret.priceConfig = null;
              console.error("PrintessIntegration: Unable to parse price configuration: " + JSON.stringify(e));
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!designNowButton) {
      throw `Printess integration: No add to basket button found for product with id ${ret.product.id}`;
    }

    ret.designNowButton = designNowButton;

    ret.urlParams = PrintessShopify.getUrlParams();

    const loginData = PrintessShopify.readLoginData(ret.urlParams.loginData || "");
    const loginDataForCurrentProduct = loginData.filter((loginData: ILoginData): boolean => {
      return loginData.shopSaveData?.product?.id === ret.product.id.toString();
    });

    if (ret.urlParams.loginData && loginDataForCurrentProduct.length > 0) {
      const entry = loginDataForCurrentProduct[loginDataForCurrentProduct.length - 1];

      for (const propertyName in entry.productOptions) {
        if (entry.productOptions.hasOwnProperty(propertyName)) {
          await ret.updateFormFieldValue(propertyName, entry.productOptions[propertyName]);
        }
      }
    }

    if (ret.urlParams.productOptions && ret.urlParams.productOptions.length > 0) {
      await Promise.all(ret.urlParams.productOptions.map(async (x): Promise<void> => {
        return await ret.updateFormFieldValue(x.name, x.value);
      }));
    }

    //Download variants for product
    const gapi = new PrintessShopifyGraphQlApi(ret.configuration.apiDomain || "", ret.configuration.shopToken, ret.configuration.graphQlToken, ret.configuration.graphQlLanguage || "");
    let variants = PrintessShopify.getPreloadedShortVariants(config, ret.product.id);

    if (!variants) {
      const metaFields = ["templateName", "mergeTemplates"];

      variants = await gapi.getProductVariants(ret.product.id, metaFields);
    }

    if (variants) {
      PrintessShopify.shortVariantCache[ret.product.id] = variants;
    }

    if (ret.urlParams?.basketKey && ret.urlParams.saveToken) {
      ret.mode = "Cart";

      ret.cartItem = await PrintessShopify.getBasketItemForBasketKey(ret.urlParams.basketKey);

      if (ret.cartItem) {
        await ret.initializeProductPageFromCartItem(ret.cartItem);
      }
    }

    if (ret.urlParams.saveToken || (loginDataForCurrentProduct && loginDataForCurrentProduct.length > 0)) {
      let saveToken = ret.urlParams.saveToken || ((loginDataForCurrentProduct && loginDataForCurrentProduct.length > 0) ? loginDataForCurrentProduct[loginDataForCurrentProduct.length - 1].saveToken : "");

      if (saveToken) {
        await ret.show(saveToken);
      }
    }

    if (await ret.evaluateDesignNowButtonDisplayState() === "hide") {
      designNowButton.printessSetStatus("hidden");
    } else {
      const pluginHost = ret.getPluginHost();
      const product = PrintessShopify.convertProduct(ret.product);
      const variant = await ret.getCurrentVariantAsync(ret.getPluginContextDummy(product));
      const productSettings = product.getSettings();
      const variantSettings = variant.getSettings();

      const personalizationMode = await pluginHost.getVariantPersonalizationTypeAsync(ret.getPluginContextDummy(product, variant), variant, variantSettings?.personalizationMode || productSettings?.personalizationMode || "personalize");

      designNowButton.printessSetStatus(personalizationMode === "directAdd" ? "direct_add_to_basket" : "editor");

      await ret.updateDirectAddToBasketButtonAsync(product, variant, personalizationMode);
    }

    designNowButton.addEventListener("click", async () => {
      const pluginHost = ret.getPluginHost();
      const product = PrintessShopify.convertProduct(ret.product);
      const variant = await ret.getCurrentVariantAsync(ret.getPluginContextDummy(product));
      const productSettings = product.getSettings();
      const variantSettings = variant.getSettings();
      const personalizationMode = await pluginHost.getVariantPersonalizationTypeAsync(ret.getPluginContextDummy(product, variant), variant, variantSettings?.personalizationMode || productSettings?.personalizationMode || "personalize");

      if (personalizationMode === "directAdd") {
        const currentStatus = designNowButton.printessGetStatus();
        const currentCaption = designNowButton.printessSetCaption(printessSettings.captions?.saving || "Saving...");

        try {
          await ret.addToBasketWithoutPersonaliszation();
        } catch (e) {
          console.error(e);
        } finally {
          designNowButton.printessSetStatus(currentStatus);
          designNowButton.printessSetCaption(currentCaption);
        }
      } else {
        ret.show();
      }
    });

    //Todo add additional button for placing basket item without personalization

    ret.onInitialized();

    ret.listenOnVariantChanges();

    return ret;
  }

  private static async getBasketItemForBasketKey(saveToken: string): Promise<ICartItem | null> {
    const result = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart.js"), {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!result || !result.ok) {
      console.error(`Printess integration: Unable to load cart item: [${result.status.toString()}] ${result.statusText}`);
      return null;
    }

    const json = await result.json();

    const { items } = json;

    return items.find((item: any) => { return item.key === saveToken });
  }

  private static getUrlParams(): IUrlParams {
    const urlParams = new URLSearchParams(window.location.search);
    let parsedParams: Record<string, string> = {
      qty: urlParams.get("qty") || "",
      ui: urlParams.get("ui") || "",
      printesssavetoken: urlParams.get("printesssavetoken") || "",
      basketkey: urlParams.get("basketkey") || ""
    }

    //Fallback for all cases where the theme kills the url params
    if (!parsedParams.printesssavetoken) {
      try {
        const storage = localStorage.getItem("printessUrlParams");

        if (storage) {
          let jsonParams = <Record<string, string> | Record<string, string>[] | null | undefined>JSON.parse(storage);

          if (jsonParams) {
            if (Array.isArray(jsonParams)) {
              if (jsonParams.length === 0) {
                jsonParams = null;
              } else {
                jsonParams = jsonParams[jsonParams.length - 1];
              }
            }
          }

          if (jsonParams) {
            parsedParams = jsonParams;
          }
        }
      } catch {
        try {
          const storage = sessionStorage.getItem("printessUrlParams");

          if (storage) {
            let jsonParams = <Record<string, string> | Record<string, string>[] | null | undefined>JSON.parse(storage);

            if (jsonParams) {
              if (Array.isArray(jsonParams)) {
                if (jsonParams.length === 0) {
                  jsonParams = null;
                } else {
                  jsonParams = jsonParams[jsonParams.length - 1];
                }
              }
            }

            if (jsonParams) {
              parsedParams = jsonParams;
            }
          }
        } catch {

        }
      }
    }

    try {//Remove our hack to circumwent url params
      localStorage.removeItem("printessUrlParams");
    } catch {

    }

    try {//Remove our hack to circumwent url params
      sessionStorage.removeItem("printessUrlParams");
    } catch {

    }

    const ret: IUrlParams = {
      saveToken: parsedParams.printesssavetoken || urlParams.get("_printesssavetoken") || urlParams.get("_printessSaveToken") || urlParams.get("saveToken") || "",
      autoOpenEditor: false,
      quantity: 1,
      basketKey: parsedParams.basketkey || "",
      ui: (parsedParams.ui || "editor") as TUiType,
      loginData: (urlParams.get("loginData") || "")
    };

    const quantityString = parsedParams.qty || "1";
    const autoOpenString = (urlParams.get("pao") || "").toLowerCase().trim();
    const qty = quantityString ? parseInt(quantityString) : 1;

    if (!isNaN(qty) && isFinite(qty) && qty > 0) {
      ret.quantity = qty;
    }

    if (autoOpenString) {
      ret.autoOpenEditor = autoOpenString === "true" || autoOpenString === "1";
    }

    const productOptions = urlParams.get("_productProperties");

    if (productOptions) {
      try {
        const options = JSON.parse(productOptions) as Record<string, string>;

        if (options) {
          for (const property in options) {
            if (options.hasOwnProperty(property)) {
              if (!ret.productOptions) {
                ret.productOptions = [];
              }

              ret.productOptions.push({
                name: property,
                value: options[property]
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }


    return ret;
  }

  private static getPreloadedVariantById(settings: IShopifySettings, productId: number, variantId: number): IShopifyVariant<number> | null {
    let ret: IShopifyVariant<number> | null = null;

    if (settings.product && settings.product.id === productId && settings.product.variants) {
      ret = settings.product.variants.find((x) => x.id === variantId) || null;
    }

    return ret;
  }

  private static getPreloadedVariantByProductOptions(settings: IShopifySettings, productId: number, options: Record<string, string>): IShopifyVariant<number> | null {
    if (settings.product && settings.product.id === productId && settings.product.variants) {
      let variants = settings.product.variants;

      const positionByPropertyName: Record<string, number> = {};

      settings.product.productOptions?.forEach((option) => {
        positionByPropertyName[option.name] = option.position;
      });

      for (const propertyName in options) {
        if (options.hasOwnProperty(propertyName)) {
          const position = positionByPropertyName[propertyName];

          variants = variants.filter((x) => {
            //option1/option2/option3 (mirrored in x.options) are Shopify's own canonical fields and can't
            //disagree with the variant's title/sku, unlike the separately enriched optionLookup, so prefer them when available
            if (position && x.options && x.options.length >= position) {
              return x.options[position - 1] === options[propertyName];
            }

            return x.optionLookup.some((y) => {
              return y.name === propertyName && y.value == options[propertyName];
            });
          });
        }
      }

      if (variants.length > 0) {
        return variants[0];
      }
    }

    return null;
  }

  private getShortVariantForProductOptions(options: Record<string, string>): IShortVariant | null {
    const preloadedVariant = PrintessShopify.getPreloadedVariantByProductOptions(this.configuration, this.product.id, options);

    if (preloadedVariant) {
      return {
        id: preloadedVariant.id,
        available: preloadedVariant.available,
        templateName: preloadedVariant.templateName ? preloadedVariant.templateName.value || "" : "",
        options: preloadedVariant.optionLookup.map((x) => {
          return {
            optionName: x.name,
            optionValue: x.value
          };
        })
      };
    }

    if (!PrintessShopify.shortVariantCache[this.product.id]) {
      throw `Printess integration: No variants loaded for product with id ${this.product.id}`;
    }

    let variants = PrintessShopify.shortVariantCache[this.product.id];

    PrintessSharedTools.forEach(options, (value, index, arr, key) => {
      variants = variants.filter((variant) => {
        return variant.options.filter((option) => { return option.optionName === key && option.optionValue === value }).length > 0;
      });
    });

    if (variants && variants.length > 0) {
      return variants[0];
    }

    return null;
  }

  private static getPreloadedShortVariants(settings: IShopifySettings, productId: number): IShortVariant[] | null {
    if (settings.product && settings.product.variants && settings.product.id === productId) {
      return settings.product.variants.map((x) => {
        return {
          available: x.available,
          id: x.id,
          options: x.optionLookup ? x.optionLookup.map((y) => {
            return {
              optionName: y.name,
              optionValue: y.value
            };
          }) : [],
          templateName: x.templateName?.value || ""
        };
      });
    }

    return null;
  }

  private async getVariantById(variantId: number): Promise<IVariant<number> | null> {
    let preloadedVariant = PrintessShopify.getPreloadedVariantById(this.configuration, this.product.id, variantId);

    if (preloadedVariant) {
      return preloadedVariant;
    }

    if (!this.product || !PrintessShopify.shortVariantCache[this.product.id] || PrintessShopify.shortVariantCache[this.product.id].length === 0) {
      return null;
    }

    const shortVariant = PrintessShopify.shortVariantCache[this.product.id].filter((variant) => {
      return variant.id === variantId;
    });

    if (!shortVariant || shortVariant.length === 0) {
      return null;
    }

    if (PrintessShopify.variantCache[variantId]) {
      return PrintessShopify.variantCache[variantId];
    }

    const optionsDict: Record<string, string> = {};

    shortVariant[0].options.forEach((option) => {
      optionsDict[option.optionName] = option.optionValue;
    });

    const api = new PrintessShopifyGraphQlApi(this.configuration.apiDomain || "", this.configuration.shopToken, this.configuration.graphQlToken, this.configuration.graphQlLanguage || "");
    const response = await api.getProductVariantByOptions(this.product.id, optionsDict);

    if (response?.variantBySelectedOptions) {
      PrintessShopify.variantCache[variantId] = response?.variantBySelectedOptions;
      return response?.variantBySelectedOptions;
    }

    return response?.defaultVariant ?? null;
  }

  private static parsePrintessProductSettings(settings?: string): IPrintessProductSettings | null {
    if (settings) {
      try {
        return (JSON.parse(settings) as IPrintessProductSettings | null | undefined) || null;
      } catch (e) {
        console.error("Printess Integration: Unable to parse product settings json: " + JSON.stringify(e));
      }
    }

    return null;
  }

  /**
   * Shopify always delivers a variant. Products without real options get an implicit default one, titled "Default Title" in english and translated in other shop languages.
   * Such a title carries no product information and must never be displayed.
   */
  private isDefaultVariant(variant: IShopifyVariant<number>): boolean {
    //Liquid knows it for sure, the storefront graphQl api does not expose the flag
    if (typeof this.configuration.hasOnlyDefaultVariant === "boolean") {
      return this.configuration.hasOnlyDefaultVariant;
    }

    const product = this.configuration.product;

    if (product && typeof (<{ has_only_default_variant?: boolean }><unknown>product).has_only_default_variant === "boolean") {
      return (<{ has_only_default_variant?: boolean }><unknown>product).has_only_default_variant === true;
    }

    const options = variant.optionLookup || [];

    if (options.length === 0) {
      return true;
    }

    //A single option on a single variant product is either shopifys implicit "Title" option or a real option carrying just one value, only the naming tells them apart
    if (options.length === 1 && (!product || !product.variants || product.variants.length <= 1)) {
      return (options[0].name || "").trim().toLowerCase() === "title" || (options[0].value || "").trim().toLowerCase() === "default title";
    }

    return false;
  }

  private convertShopifyVariantToPrintessVariant(variant: IShopifyVariant<number>): IPrintessProductVariant {
    const that = this;

    const result: IMixedProductVariant = {
      ...variant,
      getId(): string {
        return result.id?.toString() || "";
      },
      getLabel(): string {
        return result.title;
      },
      isDefaultVariant(): boolean {
        return that.isDefaultVariant(result);
      },
      getPrice(): number {
        if (typeof result.price === "number") {
          return result.price;
        }

        return result.price.amount;
      },
      getPrintTemplateName(): string {
        return result.printTemplateName?.value || "";
      },
      getTemplateName(): string {
        return result.templateName?.value || "";
      },
      getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[] {
        return result.mergeTemplates?.value || "";
      },
      getVariantOptions(): INameValuePair[] {
        return result.optionLookup || [];
      },
      getSettings(): IPrintessVariantSettings {
        let ret: IPrintessVariantSettings = {};

        if (result.printessSettings?.value) {
          const settings = <IPrintessVariantSettings>JSON.parse(result.printessSettings?.value) || {};

          if (settings) {
            ret = {
              ...ret,
              ...settings
            }
          }
        }

        return ret;
      }
    };

    return result;
  }

  private static evaluateInputName(product: IShopifyProduct, name: string, dataOptionPosition: string | null | undefined, dataOptionName: string | null | undefined, dataOptionValueId: string | number | null | undefined): string {
    let _name = ((dataOptionName || name) || "").trim();
    let optionPosition: number = 0;

    if (_name && _name.length > 2 && _name[_name.length - 2] == "\r" && _name[_name.length - 2] == "\n") {
      _name = _name.substring(0, _name.length - 2);
    }

    if (_name && _name.length > 1 && _name[_name.length - 1] == "\n") {
      _name = _name.substring(0, _name.length - 1);
    }

    let hyphenIndex = -1;
    if (_name.length > 2 && (hyphenIndex = _name.indexOf("-")) > 0) {
      const optionIndex = parseInt(_name.substring(hyphenIndex + 1, _name.length));
      if (optionIndex >= 0 && !isNaN(optionIndex) && isFinite(optionIndex)) {
        _name = _name.substring(0, hyphenIndex);
      }
    }

    if (_name.indexOf("properties[") === 0 && _name.lastIndexOf("]") === _name.length - 1) {
      _name = _name.substring("properties[".length, _name.length - 1);
    } else if (_name.indexOf("options[") === 0 && _name.lastIndexOf("]") === _name.length - 1) {
      _name = _name.substring("options[".length, _name.length - 1);
    }

    if (!dataOptionPosition && _name) {
      if (product.productOptions && _name.indexOf("option") === 0) {
        const index = parseInt(_name.substring("option".length, _name.length));

        if (!isNaN(index) && isFinite(index) && index > 0 && index <= product.productOptions.length) {//Data option position is 1 based in shopify
          optionPosition = index;
        }
      }
    }

    if (product && product.productOptions && !dataOptionPosition && optionPosition < 1 && dataOptionValueId) {
      if (typeof dataOptionValueId !== "number") {
        dataOptionValueId = parseInt(dataOptionValueId);
      }

      for (let i = 0; i < product.productOptions.length; ++i) {
        if (product.productOptions[i].optionValues) {
          for (let j = 0; j < product.productOptions[i].optionValues.length; ++j) {
            if (product.productOptions[i].optionValues[j].id === dataOptionValueId) {
              optionPosition = i + 1;
              break;
            }
          }
        }

        if (optionPosition > 0) {
          break;
        }
      }
    }

    if (dataOptionPosition) {
      const index = parseInt(dataOptionPosition);

      if (!isNaN(index) && isFinite(index) && index > 0 && index <= (product.productOptions?.length ?? 0)) {//Data option position is 1 based in shopify
        optionPosition = index;
      }
    }

    //Translated storefront: the theme uses the localized option names
    if (product.productOptions && optionPosition < 1 && _name) {
      const index = product.productOptions.findIndex((x) => x.localizedName === _name);

      if (index >= 0) {
        optionPosition = index + 1;
      }
    }

    if (product.productOptions && optionPosition > 0 && optionPosition <= product.productOptions.length) {
      _name = product.productOptions[optionPosition - 1].name;
    }

    return _name;
  }

  private static evaluateInputValue(product: IShopifyProduct, optionName: string, optionIndex: string, value: string, dataOptionValueId: string | number | null | undefined): string {
    if (product.productOptions && optionName && !optionIndex) {
      for (let i = 0; i < product.productOptions.length; ++i) {
        if (product.productOptions[i].name === optionName) {
          optionIndex = (i + 1).toString();
          break;
        }
      }
    }

    if (product && !optionIndex && dataOptionValueId) {
      if (typeof dataOptionValueId !== "number") {
        dataOptionValueId = parseInt(dataOptionValueId);
      }

      if (product.productOptions) {
        for (let i = 0; i < product.productOptions.length; ++i) {
          if (product.productOptions[i].optionValues) {
            for (let j = 0; j < product.productOptions[i].optionValues.length; ++j) {
              if (product.productOptions[i].optionValues[j].id === dataOptionValueId) {
                optionIndex = (i + 1).toString();
                break;
              }
            }
          }

          if (optionIndex) {
            break;
          }
        }
      }
    }

    if (product.productOptions && optionIndex) {
      const index: number = parseInt(optionIndex);

      if (!isNaN(index) && isFinite(index) && index > 0 && index <= product.productOptions.length) {
        return PrintessShopify.mapOptionValue(optionName, index, value, product);
      }
    }

    return value;
  }

  private static mapOptionValue(optionName: string, optionIndex: number, value: string, product: IShopifyProduct): string {
    let ret = null;

    if (product.productOptions) {
      for (let currentOption = 0; currentOption < product.productOptions.length; ++currentOption) {
        const option = product.productOptions[currentOption];

        if ((optionName === option.name || optionIndex === option.position) && option.optionValues) {
          for (let currentValue = 0; currentValue < option.optionValues.length; ++currentValue) {
            const _value = option.optionValues[currentValue];

            //localizedName: translated storefront, the theme uses the localized value names
            if (_value.name === value || _value.id === parseInt(value) || (_value.localizedName && _value.localizedName === value)) {
              ret = _value.name;
              break;
            }
          }

          break;
        }

        if (ret != null) {
          break;
        }
      }
    }

    return ret || value;
  }

  private static getInputs(parentElement?: HTMLElement | null): (HTMLInputElement | HTMLSelectElement)[] {
    const ret: (HTMLInputElement | HTMLSelectElement)[] = [];

    const inputSelector: string = 'select,input[type="radio"]:checked,input[type="checkbox"]:checked,input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="hidden"],input[type="month"],input[type="number"],input[type="password"],input[type="tel"],input[type="text"],input[type="time"],input[type="url"],input[type="week"]';

    (parentElement || document).querySelectorAll(inputSelector).forEach((x) => {
      ret.push(x as HTMLInputElement | HTMLSelectElement);
    });

    return ret;
  }

  private getProductOptionValuesFromProductPage(): Record<string, string> {
    let ret = {} as Record<string, string>;

    const productForm = this.getProductForm();
    const inputContainer = (this.configuration.uiSelectors?.cssProductContainerSelector) ? (this.designNowButton?.closest(this.configuration.uiSelectors?.cssProductContainerSelector)) : null;

    PrintessShopify.getInputs((inputContainer as HTMLElement | null) || productForm || null).forEach((input: HTMLSelectElement | HTMLInputElement) => {
      let dataOptionPosition = input.getAttribute("data-option-position") || input.getAttribute("data-option-index");
      let dataOptionName = input.getAttribute("data-option-name") || input.getAttribute("data-name") || input.getAttribute("name") || input.getAttribute("aria-label") || input.getAttribute("data-index");

      let name = PrintessShopify.evaluateInputName(this.product, input.getAttribute("name") || "", !this.configuration.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, input.getAttribute("data-option-value-id"));
      let value = PrintessShopify.evaluateInputValue(this.product, name, !this.configuration.ignoreDataOptionIndex ? dataOptionPosition || "" : "", input.value, input.getAttribute("data-option-value-id"));

      const namesToIgnore: string[] = ["form_type", "utf8", "id", "product-id", "section-id"];

      if (name && name[0] !== "_" && namesToIgnore.indexOf(name) === -1 && name.indexOf("printess") !== 0) {
        ret[name] = value;
      }
    });

    if (this.configuration.importProductOptionsFromVariantId === true) {
      const variantIdCtrl = ((inputContainer as HTMLElement) || productForm || document).querySelector('input[name="variant_id"],select[name="variant_id"],input[name="id"],select[name="id"]')

      if (variantIdCtrl && (variantIdCtrl as HTMLInputElement).value) {
        const variantId = parseInt((variantIdCtrl as HTMLInputElement).value);

        const variant = PrintessShopify.shortVariantCache[this.product.id].filter((x) => { return x.id === variantId });

        if (variant && variant.length > 0) {
          const variantOptions: Record<string, string> = {};

          variant[0].options.forEach((x) => {
            variantOptions[x.optionName] = x.optionValue;
          });

          ret = {
            ...ret,
            ...variantOptions
          };
        }
      }
    }

    return ret;
  }

  private removeVariantOptions(values: INameValuePair[]): INameValuePair[] {
    const lookup: Record<string, boolean> = {};

    this.product.productOptions?.forEach((x) => {
      lookup[x.name] = true;
    });

    return values.filter((x) => {
      return !lookup[x.name];
    });
  }

  private removeNonVariantOptions(values: INameValuePair[]): INameValuePair[] {
    const lookup: Record<string, boolean> = {};

    this.product.productOptions?.forEach((x) => {
      lookup[x.name] = true;
    });

    return values.filter((x) => {
      return lookup[x.name] === true;
    });
  }

  private clearProductFormFromPrintessValues() {
    if (this.designNowButton) {
      const form = this.getProductForm();

      if (form) {
        //The inputs are named properties[...], matching the bare property names never removed the save token and the thumbnail
        form.querySelectorAll('input[name="properties[_printessSaveToken]"],input[name="properties[_printessThumbnail]"],input[name="properties[_printessSettings]"],input[data-printess-created="true"]').forEach((input) => {
          input.remove();
        });

        console.info("Printess Integration: Removed printess values from product form.");
      }
    }
  }

  private setProductFormPrintessValues(saveToken: string, thumbnailUrl: string, additionalProperties: Record<string, string>) {
    if (this.designNowButton) {
      const form = this.getProductForm();

      if (form) {
        let saveTokenEdit: HTMLInputElement | null = form.querySelector('input[name="properties\\[_printessSaveToken\\]"]');

        if (!saveTokenEdit) {
          saveTokenEdit = document.createElement("input");
          saveTokenEdit.setAttribute("type", "hidden");
          saveTokenEdit.setAttribute("data-printess-created", "true");
          saveTokenEdit.setAttribute("name", "properties[_printessSaveToken]");

          form.appendChild(saveTokenEdit);
        }

        saveTokenEdit.value = saveToken || "";

        let thumbnailUrlEdit: HTMLInputElement | null = form.querySelector('input[name="properties\\[_printessThumbnail\\]"]');

        if (!thumbnailUrlEdit) {
          thumbnailUrlEdit = document.createElement("input");
          thumbnailUrlEdit.setAttribute("type", "hidden");
          thumbnailUrlEdit.setAttribute("data-printess-created", "true");
          thumbnailUrlEdit.setAttribute("name", "properties[_printessThumbnail]");

          form.appendChild(thumbnailUrlEdit);
        }

        thumbnailUrlEdit.value = thumbnailUrl || "";

        PrintessSharedTools.forEach(additionalProperties, (value: string, index?: number, arr?, key?: string) => {
          let input: HTMLInputElement = form.querySelector(`input[name="properties\\[${key}\\]"]`) as HTMLInputElement;

          if (!input) {
            input = document.createElement("input");
            input.setAttribute("type", "hidden");
            input.setAttribute("data-printess-created", "true");
            input.setAttribute("name", `properties[${key}]`);

            form.appendChild(input);
          }

          input.value = value;
        });
      }
    }
  }

  private static getOptionNameAndValue(product: IShopifyProduct, formField: string, value: string, label: string, valueLabel: string): { name: string, value: string } | null {
    if (product && product.productOptions) {
      let option = product.productOptions.filter(x => x.name === formField);

      if (!option || option.length === 0) {
        option = product.productOptions.filter(x => x.name === label);
      }

      if (option && option.length > 0) {
        let filteredValue = option[0].optionValues.filter(x => x.name === value);

        if (!filteredValue || filteredValue.length === 0) {
          filteredValue = option[0].optionValues.filter(x => x.name === valueLabel);
        }

        if (filteredValue && filteredValue.length > 0) {
          return {
            name: option[0].name,
            value: filteredValue[0].name
          }
        }
      }
    }

    return null;
  }

  private async updateFormFieldValue(name: string, value: string): Promise<void> {
    let variant: IPrintessProductVariant | null = null;

    try {
      variant = await this.getCurrentVariantAsync(this.getPluginContextDummy());
    } catch (e) {
      variant = {} as IPrintessProductVariant;
    }

    await this.onFormfieldChangedAsync(this.getPluginContextDummy(), {
      formFieldName: name,
      formFieldLabel: "",
      formFieldValue: value,
      formFieldValueLabel: "",
      formFieldTag: "",
      formFields: [],
      newVariant: variant
    });
  }

  private static async getCartItems(): Promise<ICartItem[] | null> {
    const downloadedCartItems = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart.js"), {
      headers: {
        'Content-Type': 'application/json',
      }
    }) as Response;

    if (!downloadedCartItems.ok) {
      console.error("Unable to load read cart items: [" + downloadedCartItems.status + "] " + downloadedCartItems.statusText);
      return null;
    }

    return (await downloadedCartItems.json()).items as ICartItem[];
  }

  private static async deleteBasketItemByKey(key: string, cartItems?: ICartItem[]): Promise<void> {
    if (!cartItems) {
      cartItems = await PrintessShopify.getCartItems() || [];
    }

    const curr = cartItems.find((item) => {
      return item.key === key;
    });

    if (curr) {
      const deleted = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart/change.js"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: key,
          quantity: 0
        }),
      });

      if (!deleted.ok) {
        console.error("Printess Integration: Unable to delete cart item with id " + key + ": [" + deleted.status + "] " + deleted.statusText);
      }
    } else {
      console.error("PrintessIntegration: Could not find basket item with key " + key);
    }
  }

  private static async replaceBasketItem(cartItem: ICartItem, variant: IPrintessProductVariant, newProperties: Record<string, string>, quantity: number): Promise<void> {
    const cartItems = await PrintessShopify.getCartItems() || [];

    const curr = cartItems.find((item) => {
      return item.key === cartItem.key;
    });

    if (curr) {
      quantity = quantity || 1;

      console.log("PrintessIntegration: Added item to cart: " + cartItem.id);
      console.log(variant);

      const valuesToWrite = {
        id: variant.getId(),
        quantity: quantity,
        properties: newProperties
      };

      const response: Response = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart/add"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [valuesToWrite]
        })
      });

      if (!response.ok) {
        console.error(`Printess Integration: Unable to create new basket item with save token "${newProperties["_printessSaveToken"]}: [${response.status}] ${response.statusText}"`);
        return;
      }

      await PrintessShopify.deleteBasketItemByKey(cartItem.key, cartItems);

      window.location.replace(PrintessSharedTools.getShopifyCartUrl());
    }
  }

  private static urlIsCartAdd(url: string): boolean {
    if (!url) {
      return false;
    }

    try {
      const _url = new URL(url);
      _url.search = '';
      _url.hash = '';
      url = _url.toString().toLowerCase();

      return url.endsWith("/cart/add/") || url.endsWith("/cart/add") || url.endsWith("/cart/add.js");
    }
    catch {
      url = url || "";

      return url.endsWith("/cart/add/") || url.endsWith("/cart/add") || url.endsWith("/cart/add.js");
    }
  }

  private static parseJsonHtmlDecode<T>(json: string): T | null {
    try {
      try {
        return <T>JSON.parse(json) || null;
      }
      catch {
        var txt = document.createElement("textarea");
        txt.innerHTML = json;
        return <T>JSON.parse(txt.value);
      }
    }
    catch (e) {
      console.error(e);
      return null;
    }
  }

  private async createUnsavedProjectStatesAsync(): Promise<ILoginData[]> {
    const loginData = PrintessShopify.readLoginData(this.urlParams?.loginData || "");
    const that = this;

    if (loginData && loginData.length > 0) {
      const api = await this.editor.getApi();

      if (api) {
        await Promise.all(loginData.map(async (loginData: ILoginData): Promise<ILoginData> => {
          await api.saveTemplateToShop({
            displayName: loginData.displayName,
            saveToken: loginData.saveToken,
            shopData: {
              ...loginData.shopSaveData,
              shopId: that.configuration.internalShopDomain,
              shopUserId: that.configuration.customerId || ""
            },
            thumbnailUrl: loginData.thumbnailUrl
          });

          return loginData;
        }));

        //Everything was fine, delete existing login data
        PrintessShopify.clearLoginData();
      } else {
        console.error("Printess Integration: Unable to create save state after login. No editor api found.");;
      }
    }

    return loginData;
  }

  public async show(templateNameOrSaveToken?: string, sessionSettings?: ISessionSettings) {
    if (!this.editor) {
      //Initialize the editor integration
      //import(/* webpackIgnore: true */ "printessEditor");
      const editor = await PrintessEditor.create(this);

      if (!editor) {
        throw "Printess integration: Unable to create Printess editor instance.";
      }

      this.editor = editor;
    }

    this.clearProductFormFromPrintessValues();

    const product = PrintessShopify.convertProduct(this.product);
    const currentVariant = await this.getCurrentVariantAsync(this.getPluginContextDummy(product));
    const productOrVariantTemplateName = await this.getTemplateNameAsync(this.getPluginContextDummy(product, currentVariant), "", true);
    const templateName = templateNameOrSaveToken ? templateNameOrSaveToken : productOrVariantTemplateName;
    const productSettings = product.getSettings() || {};

    let currentSession: ISessionSettings | undefined = undefined;

    if (this.mode === "Cart" && this.cartItem) {
      if (this.cartItem.properties["_printessSettings"]) {
        currentSession = PrintessShopify.parseJsonHtmlDecode<ISessionSettings>(this.cartItem.properties["_printessSettings"]) || undefined;
      }
    }

    if (productSettings.printQtyOption && productSettings.printQtyOption.trim()) {
      if (!currentSession) {
        currentSession = {};
      }

      currentSession.printQtyOption = productSettings.printQtyOption;
    }

    if (sessionSettings && currentSession) {
      currentSession = {
        ...currentSession,
        ...sessionSettings
      }
    }

    await this.editor.show(templateName, currentSession, currentVariant);

    //in case we have unsaved projects due to login action, make sure wqe are creating them now
    const createdSaveStates = await this.createUnsavedProjectStatesAsync();

    if (createdSaveStates.length > 0) {
      const productRelated = createdSaveStates.filter((x) => {
        return x.shopSaveData.product.id === this.product.id.toString();
      });

      if (productRelated && productRelated.length > 0 && this.urlParams?.loginData) {
        this.editor.setCurrentProjectName(productRelated[productRelated.length - 1].displayName);
      }
    }
  }

  public static formatPrice(cents: number, format: string, priceIsInCent: boolean): string {
    if (typeof cents == 'string') {
      cents = parseInt((cents as string).replace('.', ''));
    }

    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format;

    function defaultOption(opt: any | null, def: any | null) {
      return (typeof opt == 'undefined' || opt === null ? def : opt);
    }

    function formatWithDelimiters(number: number, precision: number, thousands: string | null = null, decimal: string | null = null): string {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal = defaultOption(decimal, '.');

      if (isNaN(number) || number == null) {
        return "0";
      }

      const numberStr = (priceIsInCent ? (number / 100.0) : number).toFixed(precision);

      var parts = numberStr.split('.'), dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands), cents = parts[1] ? (decimal + parts[1]) : '';

      return dollars + cents;
    }

    const match = formatString.match(placeholderRegex);

    switch (match && match.length > 0 ? match[1] : "") {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case "amount_no_decimals_with_space_separator":
        value = formatWithDelimiters(cents, 0, '.', ' ');
        break;
      case "amount_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 2, "'", ".");
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  public setFormFieldValue(formFieldName: string, formFieldValue: string) {
    return this.editor.setFormFieldValue(formFieldName, formFieldValue);
  }

  public uploadImageAsync(img: string | File, formFieldName: string, dimensionFormFields?: IImageDimensionFormFields): Promise<iExternalImage | null> {
    return this.editor.uploadImageAsync(img, formFieldName, dimensionFormFields);
  }

  public getImageInfoForUrl(url: string): Promise<{ width: number, height: number, imageFormat: TImageFormat, fileName: string } | null> {
    return PrintessSharedTools.getImageInfoForUrl(url) as Promise<{ width: number, height: number, imageFormat: TImageFormat, fileName: string } | null>;
  }

  public static async createSaveTokenIntegration(settings: IShopifySettings, integrationButton: IIntegrationButton, saveToken: string, pluginContainer: IPluginContainer): Promise<PrintessShopify> {
    if (!integrationButton) {
      throw `Printess integration: No add to basket button found for save token ${saveToken}`;
    }

    if (!integrationButton.product) {
      throw "Printess Integration: Integration button does not have a prod uct assigned";
    }

    const ret = new PrintessShopify(settings, integrationButton.product!, pluginContainer);
    ret.mode = "ProductPage";
    ret.isSaveTokenEditing = true;

    ret.designNowButton = integrationButton;

    if (!PrintessShopify.shortVariantCache[ret.product.id]) {
      //Download variants for product
      const gapi = new PrintessShopifyGraphQlApi(ret.configuration.apiDomain || "", ret.configuration.shopToken, ret.configuration.graphQlToken, ret.configuration.graphQlLanguage);
      const metaFields = ["templateName", "mergeTemplates"];
      const variants = await gapi.getProductVariants(ret.product.id, metaFields);

      if (variants) {
        PrintessShopify.shortVariantCache[ret.product.id] = variants;
      }
    }

    const currentSessionSettings: ISessionSettings = {};

    await ret.show(saveToken, currentSessionSettings);

    return ret;
  }

  public async save(): Promise<{ saveToken: string, thumbnailUrl: string }> {
    if (!this.designNowButton) {
      return {
        saveToken: "",
        thumbnailUrl: ""
      };
    }

    const currentStatus = this.designNowButton.printessGetStatus();

    if (currentStatus != "loading") {
      this.designNowButton.printessSetStatus("loading");
    }

    const result = await this.editor.save();

    if (currentStatus != "loading") {
      this.designNowButton.printessSetStatus(currentStatus);
    }

    return result;
  }

  public getShopDomain(): string {
    return this.configuration.internalShopDomain || "";
  }

  public onInitialized(): void {
    const that = this;

    const plugins = this.getPlugins();
    plugins.forEach((x) => {
      try {
        if (typeof x.onInitialized === "function") {
          x.onInitialized(this, "editor");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  /**
   * Reads a value written by writeStorageValue().
   *
   * Shopify requires us to keep working when the local storage is not available - private modes deny access to it -
   * so the session storage is used as fallback, exactly like the login data handling does.
   */
  private static readStorageValue(key: string): string | null {
    try {
      const value = localStorage.getItem(key);

      if (value !== null) {
        return value;
      }
    } catch (e) {
    }

    try {
      return sessionStorage.getItem(key);
    } catch (e) {
    }

    return null;
  }

  private static writeStorageValue(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);

      return;
    } catch (e) {
    }

    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
    }
  }

  /**
   * Remembers whether the shopify customer was logged in on the last page load, so a change can be detected.
   *
   * Shopify never tells us that a customer logged in or out, while the basket id we generate stays in the browsers
   * storage until it is removed explicitly. On shared devices - kiosk systems for example - the next customer
   * therefore inherits the basket of his predecessor and, with auto import enabled, is offered the images that
   * customer uploaded. Whenever the shop reports "not logged in" although the last page load was done by a logged
   * in customer, the stored basket id is dropped and the next design starts with an empty image list.
   *
   * The same happens on the way in: a customer who logs in on a browser that was used by an anonymous visitor
   * before starts his own basket session, so nothing that visitor uploaded can surface in his design. Together
   * with autoImportRequiresLogin, which keeps the import from running for anonymous visitors in the first place,
   * every imported image then belongs to the customer who is looking at it. A shop that turned that setting off
   * wants anonymous uploads to survive the login, so this half is skipped there.
   *
   * Three states are stored, not two: a missing entry is a browser we never saw and must not cost anybody his
   * basket, while "false" is a visit we watched somebody spend logged out.
   *
   * The user id never has to be cleared here, it is always handed to us by the theme (customerId) and is gone with
   * the logout anyway.
   *
   * Only done while auto import is enabled: without it nothing leaks and shops keep their basket id across a
   * logout exactly like before.
   *
   * The login data (_printessLoginData) is deliberately left alone here, although a leftover entry reopens the
   * design of the customer who wrote it. It is the only copy of a design that was started without being logged in,
   * so dropping it would cost a customer who decides against the login his work on his way to the basket. That
   * weighs heavier than the entry surviving a logout it was, in all but one flow, written before anyway.
   */
  private static syncCustomerLoginState(config: IShopifySettings): void {
    if (PrintessShopify.customerLoginStateSynced || config.autoImportUserImages !== true) {
      return;
    }

    PrintessShopify.customerLoginStateSynced = true;

    //Older themes do not provide customerIsLoggedIn, there the presence of the customer id is the only indicator
    const isLoggedIn: boolean = config.customerIsLoggedIn === true || !!config.customerId;
    const storedState: string | null = PrintessShopify.readStorageValue(PrintessShopify.customerLoginStateKey);
    const wasLoggedIn: boolean = storedState === "true";
    const wasLoggedOut: boolean = storedState === "false";

    if (isLoggedIn === wasLoggedIn && storedState !== null) {
      return;
    }

    PrintessShopify.writeStorageValue(PrintessShopify.customerLoginStateKey, isLoggedIn ? "true" : "false");

    if (isLoggedIn) {
      if (wasLoggedOut && config.autoImportRequiresLogin !== false) {
        PrintessEditor.clearBasketId();
      }
    } else if (wasLoggedIn) {
      PrintessEditor.clearBasketId();
    }
  }

  private static readLoginData(loginDataUrlFallback: string = ""): ILoginData[] {
    let ret: ILoginData[] = [];


    let savedData: string = "";

    if (loginDataUrlFallback && loginDataUrlFallback !== "null") {
      savedData = loginDataUrlFallback;
    } else {
      try {
        savedData = localStorage.getItem("_printessLoginData") || "null";
      } catch (e) {
      }

      if (!savedData) {
        try {
          savedData = sessionStorage.getItem("_printessLoginData") || "null";
        } catch (e) {
        }
      }
    }

    if (savedData) {
      try {
        let deserialized = JSON.parse(savedData) as ILoginData | ILoginData[];

        if (deserialized) {
          if (!Array.isArray(deserialized)) {
            deserialized = [deserialized];
          }

          ret = deserialized;
        }
      } catch (e) {
        console.error("Printess integration: Unable to deserialize login data: " + savedData);
      }
    }

    return ret;
  }

  private static writeLoginData(loginData: ILoginData | ILoginData[]): string {
    if (!loginData) {
      return "";
    }

    let stored = PrintessShopify.readLoginData("");

    if (!Array.isArray(loginData)) {
      loginData = [loginData];
    }

    stored = [...stored, ...loginData];

    try {
      localStorage.setItem("_printessLoginData", JSON.stringify(stored));
      return "";
    } catch (e) {
      try {
        sessionStorage.setItem("_printessLoginData", JSON.stringify(stored));
      } catch (e) {
      }
    }

    return JSON.stringify(loginData);
  }

  private static clearLoginData(): void {
    try {
      localStorage.setItem("_printessLoginData", "[]");
    } catch (e) {
      try {
        sessionStorage.setItem("_printessLoginData", "[]");
      } catch (e) {
      }
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("loginData");
    window.history.replaceState({}, document.title, url.toString());
  }

  private mapToVariantOptions(product: IPrintessProduct, formFieldName: string, formFieldValue: string, formFieldLabel: string, formFieldValueLabel: string): INameValuePair {
    const ret: INameValuePair = {
      name: formFieldName,
      value: formFieldValue
    };

    const lowerName = (formFieldName || "").toLowerCase();
    const lowerValue = (formFieldValue || "").toLowerCase();
    const lowerLabel = (formFieldLabel || "").toLowerCase();
    const lowerValueLabel = (formFieldValueLabel || "").toLowerCase();

    let variantOption = product.getProductOptions().find((x) => {
      return x.name.toLowerCase() === lowerName;
    });

    if (!variantOption) {
      variantOption = product.getProductOptions().find((x) => {
        return x.name.toLowerCase() === lowerLabel;
      });
    }

    if (variantOption) {
      ret.name = variantOption.name;

      let variantOptionValue = variantOption.values.find((x) => {
        return x === lowerValue;
      });

      if (!variantOptionValue) {
        variantOptionValue = variantOption.values.find((x) => {
          return x === lowerValueLabel;
        });
      }

      if (variantOptionValue) {
        ret.value = variantOptionValue;
      }
    }

    return ret;
  }

  private static setFormFieldArrayValue(formFields: INameValuePair[], name: string, value: string): void {
    let entry = formFields.find((x) => {
      return x.name === name;
    });

    if (entry) {
      entry.value = value;
    } else {
      formFields.push({
        name: name,
        value: value
      });
    }
  }

  private static convertProduct(product: IShopifyProduct): IPrintessProduct {
    const result: IMixedProduct = {
      ...product,
      price: 0.00,
      getId(): string {
        return result.id.toString();
      },
      getLabel(): string {
        return result.title || "";
      },
      getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[] {
        return result.mergeTemplates?.value || "";
      },
      getPrice(): number {
        return result.price;
      },
      getPrintTemplateName(): string {
        return result.printTemplateName?.value || "";
      },
      getProductOptions(): { name: string, values: string[] }[] {
        const res: { name: string, values: string[] }[] = [];

        this.productOptions?.forEach((x) => {
          res.push({
            name: x.name,
            values: x.optionValues.map((y) => {
              return y.name;
            })
          });
        });

        return res;
      },
      getDropshipProductDefinitionId(): number {
        const id = result.productDefinitionId?.value || "";

        if (id) {
          const iVal = parseInt(id);

          if (!isNaN(iVal) && isFinite(iVal)) {
            return iVal;
          }
        }

        return -1;
      },
      getSettings(): IPrintessProductSettings {
        const settings: IPrintessProductSettings = result.printessSettings?.value ? <IPrintessProductSettings>JSON.parse(result.printessSettings.value) || {} : {};

        //Fall back to the printess.productType meta field in case the settings do not contain a product type
        if (!settings.productType && result.productType?.value) {
          settings.productType = result.productType.value;
        }

        return settings;
      },
      getTemplateName(): string {
        return result.templateName?.value || "";
      },
      getUrl(variant: IMixedProductVariant | null): string {
        let ret = `https://${window.location.hostname}/products/${result.handle}`;

        if (variant) {
          ret += `?variant=${variant.id}`;
        }

        return ret;
      },
      getThumbnailUrl(variant: IMixedProductVariant | null): string {
        return variant?.image || result.featuredImage || "";
      }
    };

    return result;
  }

  /**
    #region IPlugin implementation
  **/
  public async getProductAsync(context: IPluginContext, currentValue?: IProduct | null): Promise<IPrintessProduct> {
    return Promise.resolve(PrintessShopify.convertProduct(this.product));
  }

  public async getCurrentVariantAsync(context: IPluginContext, currentValue?: IPrintessProductVariant | null): Promise<IPrintessProductVariant> {
    let productOptions: INameValuePair[] = [];

    if (this.mode === "ProductPage") {
      const options = this.getProductOptionValuesFromProductPage();

      for (const name in options) {
        if (options.hasOwnProperty(name)) {
          productOptions.push({
            name: name,
            value: options[name]
          });
        }
      }
    } else if (this.mode === "Cart" && this.cartItem) {
      productOptions = this.cartItem.options_with_values;
    }

    if (productOptions) {
      productOptions = this.removeNonVariantOptions(productOptions!);

      return (await this.getVariantByProductOptionsAsync(context, productOptions))!;
    }

    if (currentValue) {
      return currentValue;
    }

    throw "Printess Integration: No product opotions found.";
  }

  public async onAddToBasketAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string,
    variant: IPrintessProductVariant
  }): Promise<void> {
    if (!params.saveToken) {
      setTimeout(function () {
        alert("It seems like we are having trouble saving your changes. Please try again.");
      }, 0);
      return;
    }

    if (this.configuration.cartItemPropertyName && this.configuration.cartItemPropertyValue && params.propertyValuesToWrite) {
      params.propertyValuesToWrite[this.configuration.cartItemPropertyName] = this.configuration.cartItemPropertyValue;
    }

    if (this.mode === "ProductPage") {
      this.setProductFormPrintessValues(params.saveToken, params.thumbnailUrl, params.propertyValuesToWrite);

      if (this.designNowButton) {
        const form = this.getProductForm();

        if (form) {
          //write current variant id
          const variantInput = form.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement;

          if (variantInput) {
            variantInput.value = params.variant.getId();
          }

          const addToBasketButton = this.getAddToBasketButton(form);

          if (this.priceConfig) {
            PrintessSharedTools.onHookFetch((url: string, init: RequestInit | null, response: Response): "cancel" | "continue" => {
              return "continue";
            }, undefined, (args: any[]) => {
              if (args && Array.isArray(args) && args.length > 1 && typeof args[0] === "string" && args[0]) {
                if (PrintessShopify.urlIsCartAdd(args[0])) {
                  if (args[1] && args[1].body && args[1].body instanceof FormData) {
                    const formData = args[1].body as FormData;

                    const formObject = Object.fromEntries(formData.entries());
                    const propertiesToCopy: Record<string, string> = {};

                    for (const property in formObject) {
                      if (formObject.hasOwnProperty(property) && property !== "_printessProperties") {
                        if (property && property.startsWith("properties[") && property.endsWith("]")) {
                          const propertyName = property.substring("properties[".length, property.length - 1);

                          propertiesToCopy[propertyName] = (formObject[property] || "").toString();
                          //formData.delete("properties[" + propertyName + "]");
                        }
                      }
                    }

                    formData.set("properties[_printessProperties]", JSON.stringify(propertiesToCopy));
                  }
                };
              }
            });
          }

          if (this.isSaveTokenEditing || (!this.priceConfig && this.configuration.redirectToCartAfterAddToBasketClick === true)) {
            PrintessSharedTools.onHookFetch((url: string, init: RequestInit | null, response: Response): "cancel" | "continue" => {
              if (PrintessShopify.urlIsCartAdd(url)) {
                if (init && init.body) {
                  if (init.body instanceof FormData) {
                    const formData = init.body as FormData;

                    const formObject = Object.fromEntries(formData.entries());
                    const jsonString = JSON.stringify(formObject);

                    if (jsonString.indexOf("_printessSaveToken") >= 0) {
                      setTimeout(function () {
                        window.location.replace(PrintessSharedTools.getShopifyCartUrl());
                      }, 0);
                    }
                  } else if (init.body.toString().indexOf("_printessSaveToken") >= 0) {
                    setTimeout(function () {
                      window.location.replace(PrintessSharedTools.getShopifyCartUrl());
                    });
                  }
                }
              }

              return "continue";
            });

            this.designNowButton.printessSetStatus("loading");
          }

          if (addToBasketButton && typeof addToBasketButton.click === "function") {
            addToBasketButton.click();
          } else if (typeof form.submit === "function") {
            form.submit();
          }
        }
      }
    } else if (this.mode === "Cart" && this.cartItem) {
      params.propertyValuesToWrite = {
        ...this.cartItem.properties,
        ...params.propertyValuesToWrite
      };

      let currentSession: ISessionSettings | undefined = undefined;

      if (this.mode === "Cart" && this.cartItem) {
        if (this.cartItem.properties["_printessSettings"]) {
          currentSession = PrintessShopify.parseJsonHtmlDecode<ISessionSettings>(this.cartItem.properties["_printessSettings"]) || undefined;
        }
      }

      if (params.propertyValuesToWrite["_printessSettings"]) {
        currentSession = {
          ...currentSession,
          ...PrintessShopify.parseJsonHtmlDecode<ISessionSettings>(params.propertyValuesToWrite["_printessSettings"]) || {}
        };
      } else {
        currentSession = {};
      }

      if (this.cartItem && this.cartItem.properties["_printessSaveToken"]) {
        currentSession.saveTokenToDelete = this.cartItem.properties["_printessSaveToken"];
      }

      params.propertyValuesToWrite["_printessSettings"] = JSON.stringify(currentSession);

      params.propertyValuesToWrite["_printessSaveToken"] = params.saveToken;
      params.propertyValuesToWrite["_printessThumbnail"] = params.thumbnailUrl;

      if (params.propertyValuesToWrite["_printess_printessSlimUi"]) {
        delete params.propertyValuesToWrite["_printess_printessSlimUi"];
      }

      if (typeof this.editor.getPluginHost().doAllowReplaceBasketItemAsync === "function") {
        if (!(await this.editor.getPluginHost().doAllowReplaceBasketItemAsync!(context, {
          properties: params.propertyValuesToWrite,
          quantity: this.urlParams?.quantity || this.cartItem.quantity
        }))) {
          return;
        }
      }

      //If the product is having a custom prizing, we need to collect the cart item properites into our _printessProperties property
      if (this.priceConfig) {
        const propertiesToCopy: Record<string, string> = {};

        for (const property in params.propertyValuesToWrite) {
          if (params.propertyValuesToWrite.hasOwnProperty(property) && property !== "_printessProperties") {
            propertiesToCopy[property] = (params.propertyValuesToWrite[property] || "").toString();
          }
        }

        params.propertyValuesToWrite["_printessProperties"] = JSON.stringify(propertiesToCopy);
      }

      await PrintessShopify.replaceBasketItem(this.cartItem, params.variant, params.propertyValuesToWrite, this.urlParams?.quantity || this.cartItem.quantity);

      window.location.replace(PrintessSharedTools.getShopifyCartUrl());
    }

    return Promise.resolve();
  }

  private getPluginHost(): PrintessPluginHost {
    return new PrintessPluginHost(() => { return this.getPlugins() });
  }

  public async addToBasketWithoutPersonaliszation(): Promise<void> {
    const pluginHost = this.getPluginHost();
    const product = PrintessShopify.convertProduct(this.product);
    const variant = await this.getCurrentVariantAsync(this.getPluginContextDummy(product));
    const pluginContext = this.getPluginContextDummy(product, variant);
    const formFieldMappings = await pluginHost.getFormFieldMappingsAsync(pluginContext);
    let formFields = PrintessEditor.MergeFormFieldValues(await this.getFormFieldsAsync(pluginContext, []), await pluginHost.getFormFieldsAsync(pluginContext, []));
    const transformedFormFields: Record<string, string> = {};

    this.clearProductFormFromPrintessValues();

    const mappedFormFields = await PrintessEditor.applyFormFieldMappings(pluginHost, pluginContext, formFields, formFieldMappings);

    mappedFormFields.forEach((x) => {
      transformedFormFields[x.name] = x.value;
    });

    //The product settings extend the entries the plugins provided, they never replace them.
    const formFieldsAsProperties = PrintessPluginHost.mergeFormFieldsAsProperties(await pluginHost.getFormFieldsAsPropertiesAsync(pluginContext), product.getSettings()?.formFieldsAsProperties);
    const transformedFormFieldsAsProperties: Record<string, string> = {};

    //The configuration order is the order the properties show up in at the cart item, so never sort them here.
    formFieldsAsProperties.forEach((x) => {
      const formField = formFields.find((y) => { return y.name === x.formfieldName });

      if (formField) {
        transformedFormFieldsAsProperties[x.propertyName || x.formfieldName] = formField.value;
      } else if (x.defaultValue) {
        transformedFormFieldsAsProperties[x.propertyName || x.formfieldName] = x.defaultValue;
      }
    });

    const propertyValuesToWrite: Record<string, string> = {
      ...transformedFormFieldsAsProperties || {},
      _printessSettings: JSON.stringify({
        withoutPersonalization: true,
        printTemplateName: variant.getPrintTemplateName() ? variant?.getPrintTemplateName() : (product.getPrintTemplateName() ? product.getPrintTemplateName() : ""),
        printessProductType: product.getSettings()?.productType || ""
      })
    };

    propertyValuesToWrite["_printessFormFields"] = JSON.stringify(formFields);

    if (product.getDropshipProductDefinitionId() > -1) {
      propertyValuesToWrite["_printessProductDefinitionId"] = product.getDropshipProductDefinitionId().toString() || "";
    }

    const templateName = await pluginHost.getTemplateNameAsync(pluginContext, await this.getTemplateNameAsync(pluginContext, ""));
    const templateNameIsSaveToken: boolean = templateName.startsWith("st:");

    const mergeTemplates = templateNameIsSaveToken ? [] : (variant.getMergeTemplates() ? PrintessSharedTools.parseMergeTemplate(variant.getMergeTemplates()) : (product.getMergeTemplates() ? PrintessSharedTools.parseMergeTemplate(product.getMergeTemplates()) : []));

    const saveTokenParams: ICreateSaveTokenParams = {
      mergeTemplates: mergeTemplates,
      formFields: transformedFormFields,
      templateName: templateName,
      usePublishedVersion: true,
      shopInfo: {
        basketId: await PrintessEditor.getOrGenerateBasketId(pluginHost, pluginContext) || "",
        userId: await this.getUserIdAsync(pluginContext) || ""
      }
    };

    const saveTokenResult = await PrintessSharedTools.createSaveToken(this.configuration.shopToken, saveTokenParams);

    if (!saveTokenResult || !saveTokenResult.saveToken) {
      console.error("Printess integration: Save Token creation failed: No save token returned");
      return;
    }

    if (!(await pluginHost.doAllowAddToBasketAsync(pluginContext, {
      originalSaveToken: saveTokenResult.saveToken,
      previousSaveToken: "",
      propertyValuesToWrite: propertyValuesToWrite,
      saveToken: saveTokenResult.saveToken,
      thumbnailUrl: saveTokenResult.thumbnailUrl,
      withoutPersonalization: true
    }))) {
      return;
    }

    this.setProductFormPrintessValues(saveTokenResult.saveToken, saveTokenResult.thumbnailUrl, propertyValuesToWrite);

    if (this.designNowButton) {
      const form = this.getProductForm();

      if (form) {
        //write current variant id
        const variantInput = form.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement;

        if (variantInput) {
          variantInput.value = variant.getId();
        }

        const addToBasketButton = this.getAddToBasketButton(form);

        if (addToBasketButton && typeof addToBasketButton.click === "function") {
          addToBasketButton.click();
        } else if (typeof form.submit === "function") {
          form.submit();
        }
      }
    }
  }

  public async getVariantByProductOptionsAsync(context: IPluginContext, options: INameValuePair[], currentVariant?: IPrintessProductVariant | null): Promise<IPrintessProductVariant | null> {
    const api = new PrintessShopifyGraphQlApi(this.configuration.apiDomain || "", this.configuration.shopToken, this.configuration.graphQlToken, this.configuration.graphQlLanguage || "");
    const _options: Record<string, string> = {};

    options.forEach((x) => {
      _options[x.name] = x.value;
    });

    const preloadedVariant = PrintessShopify.getPreloadedVariantByProductOptions(this.configuration, this.product.id, _options);

    if (preloadedVariant) {
      return this.convertShopifyVariantToPrintessVariant(preloadedVariant);
    }

    const shortVariant = this.getShortVariantForProductOptions(_options);

    if (!shortVariant) {
      console.warn(`Printess integration: Unable to retrieve variant for options ${JSON.stringify(options)}. Returning default variant`);

      return this.convertShopifyVariantToPrintessVariant(this.defaultVariant);
    }

    if (PrintessShopify.variantCache[shortVariant.id]) {
      return this.convertShopifyVariantToPrintessVariant(PrintessShopify.variantCache[shortVariant.id]);
    }

    let variant = await this.getVariantById(shortVariant.id);

    if (!variant) {
      const retrieved = await api.getProductVariantByOptions(this.product.id, _options, false);

      if (retrieved && retrieved.variantBySelectedOptions) {
        variant = retrieved.variantBySelectedOptions;
      }
    }

    if (!variant) {
      console.warn(`Printess integration: Unable to retrieve variant for options ${JSON.stringify(options)}. Returning default variant`);
      return this.convertShopifyVariantToPrintessVariant(this.defaultVariant);
    }

    PrintessShopify.variantCache[shortVariant.id] = variant;

    return this.convertShopifyVariantToPrintessVariant(variant);
  }

  private static getLabelControl(element: Element): HTMLLabelElement | null {
    //Try to find the corresponding label and click on it, just in case the variant selector used does not listen on value changes
    const radioId = element.getAttribute("id");
    let ret: HTMLLabelElement | null = null;

    if (radioId) {
      ret = document.querySelector(`label[for="${radioId}"]`) as HTMLLabelElement || null;
    }

    if (!ret) {
      //Some themes nest the input directly inside the label instead of using the "for" attribute
      let ancestor: HTMLElement | null = element.parentElement;

      for (let i = 0; i < 5 && ancestor; ++i) {
        if (ancestor.tagName === "LABEL") {
          ret = ancestor as HTMLLabelElement;
          break;
        }

        ancestor = ancestor.parentElement;
      }
    }

    return ret;
  }

  public async onFormfieldChangedAsync(context: IPluginContext, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    formFieldTag: string,
    formFields: INameValuePair[],
    newVariant?: IPrintessProductVariant | null
  }): Promise<void> {
    const that = this;

    // if (this.mode === "ProductPage") {
    if (!this.designNowButton) {
      return Promise.resolve();
    }

    const form = this.getProductForm();

    if (!form) {
      return Promise.resolve();
    }

    let inputContainer: HTMLElement | null = null;

    if (this.configuration.uiSelectors?.cssProductContainerSelector) {
      inputContainer = this.designNowButton.closest(this.configuration.uiSelectors?.cssProductContainerSelector);
    }

    inputContainer = inputContainer || form;

    if ((params.formFieldValueLabel === null || params.formFieldValueLabel === "") && (params.formFieldValue !== null && params.formFieldValue !== "")) {
      params.formFieldValueLabel = params.formFieldValue;
    }

    //Radio buttons
    let inputs = inputContainer.querySelectorAll(`input[type="radio"]`);

    if (inputs && inputs.length > 0) {
      inputs.forEach((el) => {
        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
        const initialName = PrintessShopify.evaluateInputName(that.product, el.getAttribute("name") || "", !that.configuration.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
        const initialValue = PrintessShopify.evaluateInputValue(that.product, initialName, !that.configuration.ignoreDataOptionIndex ? dataOptionPosition || "" : "", (el as HTMLInputElement).value, el.getAttribute("data-option-value-id"));
        let valueChanged = false;

        if (initialName === params.formFieldName || initialName === params.formFieldLabel) {
          if (initialValue === params.formFieldValue || initialValue === params.formFieldValueLabel) {
            if (!valueChanged && !(el as HTMLInputElement).checked) {
              valueChanged = true;
            }

            el.setAttribute('checked', true.toString());
            (el as HTMLInputElement).checked = true;
            (el as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));

            //Try to find the corresponding label and click on it, just in case the variant selector used does not listen on value changes
            let radioLabel: HTMLLabelElement | null = PrintessShopify.getLabelControl(el);

            if (radioLabel) {
              //setTimeout(function () {
              radioLabel.click();

              if (params.newVariant) {
                const url = new URL(window.location.href);
                url.searchParams.set("variant", params.newVariant.getId());
                window.history.pushState({}, '', url);
              }
              //}, 0);
            }


          } else {
            if (!valueChanged && (el as HTMLInputElement).checked === true) {
              valueChanged = true;
            }

            el.removeAttribute('checked');
            (el as HTMLInputElement).checked = false;
          }
        }

        if (valueChanged) {
          el.dispatchEvent(new Event('change'));
        }
      });
    }

    //In case select / drop down is used
    inputs = inputContainer.querySelectorAll(`select`);

    inputs.forEach((el) => {
      const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
      const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
      const initialName = PrintessShopify.evaluateInputName(that.product, el.getAttribute("name") || "", !that.configuration.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
      let valueChanged = false;

      if ((el as HTMLSelectElement).options) {
        for (let i = 0; i < (el as HTMLSelectElement).options.length; ++i) {
          const initialValue = PrintessShopify.evaluateInputValue(that.product, initialName, !that.configuration.ignoreDataOptionIndex ? dataOptionPosition || "" : "", (el as HTMLSelectElement).options[i].getAttribute('value') || "", el.getAttribute("data-option-value-id"));

          if (initialName === params.formFieldName || initialName === params.formFieldLabel) {
            if (initialValue === params.formFieldValue || initialValue === params.formFieldValueLabel) {
              if (!valueChanged && !(el as HTMLSelectElement).options[i].selected) {
                valueChanged = true;
              }

              (el as HTMLSelectElement).options[i].setAttribute('selected', true.toString());
              (el as HTMLSelectElement).options[i].selected = true;

              el.setAttribute('value', params.formFieldValue);
              //The option's own value, it can differ from the form field value (value ids, translated storefronts)
              (el as HTMLSelectElement).value = (el as HTMLSelectElement).options[i].value;
            } else {
              if (!valueChanged && (el as HTMLSelectElement).options[i].selected === true) {
                valueChanged = true;
              }

              (el as HTMLSelectElement).options[i].removeAttribute('selected');
              (el as HTMLSelectElement).options[i].selected = false;
            }
          }
        }
      }

      if (valueChanged) {
        el.dispatchEvent(new Event('change'));
      }
    });


    //Text boxes
    inputs = inputContainer.querySelectorAll(`input[type="text"],input[type="hidden"],input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="month"],input[type="number"],input[type="tel"],input[type="time"],input[type="url"],input[type="week"]`);

    if (inputs && inputs.length > 0) {
      const nameAndValue = PrintessShopify.getOptionNameAndValue(that.product, params.formFieldName, params.formFieldValue, params.formFieldLabel, params.formFieldValueLabel);

      inputs.forEach((el) => {
        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
        const initialName = PrintessShopify.evaluateInputName(that.product, el.getAttribute("name") || "", !that.configuration.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
        const initialValue = PrintessShopify.evaluateInputValue(that.product, initialName, !that.configuration.ignoreDataOptionIndex ? dataOptionPosition || "" : "", (el as HTMLInputElement).value, el.getAttribute("data-option-value-id"));
        let valueChanged = false;

        if (nameAndValue) {
          if (initialName === nameAndValue.name && initialValue !== nameAndValue.value) {
            valueChanged = true;
            el.setAttribute("value", nameAndValue.value);
          }
        } else {
          if (initialName === params.formFieldName) {
            if (initialValue !== params.formFieldValue) {
              valueChanged = true;
              el.setAttribute("value", params.formFieldValue);
            }
          } else if (initialName === params.formFieldLabel && initialValue !== params.formFieldValueLabel) {
            valueChanged = true;
            el.setAttribute("value", params.formFieldValueLabel);
          }
        }

        if (valueChanged) {
          el.dispatchEvent(new Event('change'));
        }
      });
    }

    if (params.newVariant && typeof params.newVariant.getId === "function") {
      const variantIdInput = inputContainer.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement | null;

      if (variantIdInput) {
        variantIdInput.value = params.newVariant.getId();
      }
    }
    // }

    if (this.mode === "Cart") {
      if (this.cartItem && this.cartItem.properties) {
        if (typeof this.cartItem.properties[params.formFieldName] !== "undefined") {
          this.cartItem.properties[params.formFieldName] = params.formFieldValue;
        }
        else if (typeof this.cartItem.properties[params.formFieldLabel] !== "undefined") {
          this.cartItem.properties[params.formFieldName] = params.formFieldValueLabel ? params.formFieldValueLabel : params.formFieldValue;
        }
      }
    }

    return Promise.resolve();
  }

  public async getFormFieldsAsync(context: IPluginContext, currentFormFields: INameValuePair[]): Promise<INameValuePair[]> {
    let ret: INameValuePair[] = currentFormFields || [];

    if (this.mode === "ProductPage") {
      if (context.product && typeof context.product.getSettings === "function") {
        const settings = context.product.getSettings();

        if (settings && settings.formFields) {
          for (const formFieldName in settings.formFields) {
            if (settings.formFields.hasOwnProperty(formFieldName)) {
              PrintessShopify.setFormFieldArrayValue(ret, formFieldName, settings.formFields[formFieldName]);
            }
          }
        }
      }

      const options = this.getProductOptionValuesFromProductPage();

      for (const optionName in options) {
        if (options.hasOwnProperty(optionName)) {
          PrintessShopify.setFormFieldArrayValue(ret, optionName, options[optionName]);
        }
      }
    } else if (this.mode === "Cart") {
      const properties = this.cartItem?.properties || {};

      for (const propertyName in properties) {
        if (properties.hasOwnProperty(propertyName)) {
          PrintessShopify.setFormFieldArrayValue(ret, propertyName, properties[propertyName]);
        }
      }

      (await this.getCurrentVariantAsync(context)).getVariantOptions().forEach((x) => {
        PrintessShopify.setFormFieldArrayValue(ret, x.name, x.value);
      });
    }

    return this.removeVariantOptions(ret);
  }

  public async getPriceInCentAsync(context: IPluginContext, currentPrice: number, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    minPages?: number | null,
    pureRecordCount?: number
    printedRecordCount?: number,
  }): Promise<number> {
    let ret: number = currentPrice;
    let additionalPages = 0;

    if (this.priceConfig) {
      let minPages = typeof this.priceConfig.includedPageCount !== "undefined" && this.priceConfig.includedPageCount !== null && this.priceConfig.includedPageCount > 0 ? this.priceConfig.includedPageCount : 0;

      if (minPages <= 0 && typeof params.minPages !== "undefined" && params.minPages !== null && params.minPages > 0) {
        minPages = params.minPages;
      }

      if (typeof params.numberOfPages !== "undefined" && params.numberOfPages !== null && params.numberOfPages >= minPages) {
        additionalPages = params.numberOfPages - minPages;
      }

      // Only configurations with quantity tiers look at the quantity, everything else is priced exactly as before
      const quantity = Array.isArray(this.priceConfig.quantityTiers) && this.priceConfig.quantityTiers.length > 0 ? this.getCartQuantity() : 1;
      const calculatedPrice = PrintessPriceCalculator.calculatePrice(additionalPages, params.currentFormFieldValues || [], this.priceConfig || "", quantity);

      if (calculatedPrice.unitPrice !== null) {
        // The quantity tier replaces the unit price of the variant, exactly like the cart transform does with the bundle copy
        const variant = context.variant || await this.getCurrentVariantAsync(context);

        ret = ret - Math.round(variant.getPrice() * 100) + Math.round(calculatedPrice.unitPrice * 100);
      }

      ret = ret + (calculatedPrice.totalPrice * 100) // * 100 => price in cent;
    }

    return ret;
  }

  /**
   * The quantity the item goes into the cart with, which picks the quantity tier of the price config. That is the
   * quantity of the cart line when a cart item is edited, otherwise the quantity input of the product form.
   */
  private getCartQuantity(): number {
    let ret = 0;

    try {
      if (this.cartItem) {
        ret = this.urlParams?.quantity || this.cartItem.quantity || 0;
      } else {
        const input = this.getThemeQuantityInput();

        ret = input ? parseInt(input.value) : 0;
      }
    } catch (e) {
      console.error(e);//A theme with an unexpected product form must not break the price display, it falls back to one piece
    }

    return !isNaN(ret) && isFinite(ret) && ret > 0 ? ret : 1;
  }

  public async renderPriceAsync(context: IPluginContext, priceToRender: number, currentValue: string, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    price: number,
    numberOfPages: number,
    pureRecordCount?: number
    printedRecordCount?: number
  }): Promise<string> {
    return PrintessShopify.formatPrice(priceToRender, this.configuration.priceFormat, true);
  }

  public async unmapFormFieldAsync(context: IPluginContext, currentValue: INameValuePair, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    mappings: Record<string, IFormFieldMapping> | null
  }): Promise<INameValuePair> {
    let ret: INameValuePair = this.mapToVariantOptions(context.product, params.formFieldName, params.formFieldValue, params.formFieldLabel, params.formFieldValueLabel);

    return ret;
  }

  public async onCloseAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }): Promise<void> {
    let ret: boolean = true;

    if (!(params.isAddToBasket)) {
      this.clearProductFormFromPrintessValues();
    }

    history.replaceState({}, "", PrintessSharedTools.removeParamsFromUrl(window.location.href, [
      "printesssavetoken",
      "basketkey",
      "qty",
      "pao",
      "ui"
    ]));
  }

  public async onLoginAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    displayName: string,
    shopSaveData: IShopData,
    type: "register" | "login"
  }): Promise<void> {
    let redirectUrl = (params.type === "login" ? this.configuration.loginUrl : this.configuration.registrationUrl) || this.configuration.loginUrl || "";

    if (!redirectUrl) {
      console.warn("PrintessIntegration: No " + (params.type === "register" ? " registration " : " login ") + " URL provided!");
      return;
    }

    const loginData: ILoginData = {
      ...params,
      variantId: context.variant ? context.variant.getId() : "",
      productOptions: {}
    };

    (await this.getFormFieldsAsync(context, [])).forEach((x) => {
      loginData.productOptions[x.name] = x.value;
    });

    const returnUrl = `/products/${this.product.handle}?variant=${context.variant?.getId()}&loginData=` + encodeURIComponent(PrintessShopify.writeLoginData(loginData) || "null");

    const url = new URL(redirectUrl, window.location.origin);
    url.searchParams.set("return_to", returnUrl);
    redirectUrl = url.toString();

    window.location.href = redirectUrl;
  }

  public supportsSavingAsync(context: IPluginContext): Promise<boolean> {
    return Promise.resolve(this.configuration.supportsSaving === true);
  }

  public userIsLoggedInAsync(context: IPluginContext): Promise<boolean> {
    return Promise.resolve(typeof this.configuration.customerIsLoggedIn !== "undefined" && this.configuration.customerIsLoggedIn !== null && this.configuration.customerIsLoggedIn === true);
  }

  public getEditorSettings(context: IPluginContext, currentValue?: IEditorSettings | null): IEditorSettings {
    const printessShopSettings = this.configuration.getShopLevelSettings ? this.configuration.getShopLevelSettings() : {};

    const theme = printessShopSettings.editorTheme || undefined;

    const ret: IEditorSettings = {
      ...(currentValue ? currentValue : {}),
      apiDomain: this.configuration.apiDomain,
      shopToken: this.configuration.shopToken,
      displayProductName: this.configuration.displayProductName,
      editorDomain: this.configuration.editorDomain,
      editorVersion: this.configuration.editorVersion,
      theme: theme || this.configuration.printessThemeName || "DEFAULT",
      shopDomain: this.configuration.internalShopDomain,
      translationKey: this.configuration.translationKey || "auto",
      hidePriceInEditor: typeof this.configuration.hidePricesInEditor === "boolean" ? this.configuration.hidePricesInEditor : false,
      savedDesignProductName: this.configuration.savedDesignProductName || "productName",
      autoImportUserImages: this.configuration.autoImportUserImages === true,
      autoImportRequiresLogin: this.configuration.autoImportRequiresLogin !== false
    };

    return ret;
  }

  public async getUserIdAsync(context: IPluginContext, currentValue?: string | null): Promise<string | null> {
    if (this.configuration.customerId) {
      return Promise.resolve(this.configuration.customerId);
    }

    return Promise.resolve(null);
  }

  public async getOldPriceInCentAsync(context: IPluginContext, oldPrice: number | null, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    pureRecordCount?: number,
    printedRecordCount?: number
  }): Promise<number | null> {
    let ret: number | null = oldPrice;
    const compareAtPrice: { amount: number } | null = (<any>context.variant)?.compareAtPrice || (typeof (<any>context.variant)?.compare_at_price === "number" ? { amount: (<any>context.variant)?.compare_at_price } : (<any>context.variant)?.compare_at_price) || null;

    if (compareAtPrice && typeof compareAtPrice.amount !== "undefined" && compareAtPrice.amount !== null) {
      ret = compareAtPrice.amount * 100;
    }

    return ret;
  }

  public async getPhotobookSettingsAsync(context: IPluginContext, currentValue: iExternalBookSettings | null): Promise<iExternalBookSettings | null> {
    let ret: iExternalBookSettings | null = null;

    if (context.product) {
      const settings = context.product.getSettings();

      if (settings && settings.bookSettings) {
        ret = {
          ...settings.bookSettings
        }
      }
    }

    if (ret) {
      if (currentValue) {
        return {
          ...ret,
          ...currentValue
        };
      } else {
        return ret;
      }
    }

    return currentValue;
  }
  /**
    #endregion IPlugin implementation
  **/

  private addDirectAddToBasketButton(): IIntegrationButton | null {
    const form = this.getProductForm();
    const addToBasketButton = this.getAddToBasketButton(form);

    if (!this.designNowButton || !form || !addToBasketButton) {
      return null;
    }

    let wrapper = this.designNowButton.closest(".printess-integration-button-wrapper");

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.classList.add("printess-integration-button-wrapper");
      addToBasketButton.after(wrapper);
      wrapper.appendChild(this.designNowButton);
    }

    let button = <IIntegrationButton | null>wrapper.querySelector(".printess-direct-to-basket-button");

    if (button) {
      return button;
    }

    //Older PrintessIntegrationLauncher versions shipped inside a theme do not know this factory
    if (typeof PrintessIntegrationLauncher === "undefined" || typeof PrintessIntegrationLauncher.createDirectAddToBasketButton !== "function") {
      console.warn("Printess Integration: The PrintessIntegrationLauncher of this shop does not support createDirectAddToBasketButton, the direct add to basket button is not displayed.");

      return null;
    }

    button = PrintessIntegrationLauncher.createDirectAddToBasketButton(this.configuration.captions?.addToBasket || "Add to basket", this.configuration.captions?.saveBasketItem || "Saving...", this.configuration.designButtonClasses);

    wrapper.appendChild(button);
    button.printessSetStatus("direct_add_to_basket");

    const that = this;
    button.addEventListener("click", async () => {
      const currentStatus = button.printessGetStatus();

      try {
        button.printessSetStatus("loading");

        await that.addToBasketWithoutPersonaliszation();
      } catch (e) {
        console.error(e);
      } finally {
        button.printessSetStatus(currentStatus);
      }
    });

    return button;
  }

  /**
   * Shows the additional direct add to basket button next to the design now button for personalization mode "both".
   * Plugins can overrule that decision for the current variant via hasDirectAddToBasketButtonAsync.
   */
  private async updateDirectAddToBasketButtonAsync(product: IPrintessProduct, variant: IPrintessProductVariant, personalizationMode: TVariantPersonalizationOption): Promise<void> {
    const hasButton = await this.getPluginHost().hasDirectAddToBasketButtonAsync(this.getPluginContextDummy(product, variant), personalizationMode === "both");

    if (hasButton) {
      this.addDirectAddToBasketButton();
    } else {
      this.removeDirectAddToBasketButton();
    }
  }

  private removeDirectAddToBasketButton(): void {
    const form = this.getProductForm();
    const addToBasketButton = this.getAddToBasketButton(form);

    if (!this.designNowButton || !form || !addToBasketButton) {
      return;
    }

    const wrapper = this.designNowButton.closest(".printess-integration-button-wrapper");

    if (wrapper) {
      addToBasketButton.after(this.designNowButton);

      wrapper.remove();
    }
  }
}