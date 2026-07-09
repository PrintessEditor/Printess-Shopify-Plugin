import { PrintessEditor, PrintessEditorFrontend } from "./printessEditor.js";
import { ICreateSaveTokenParams, PrintessSharedTools } from "./printess-shared-tools.js";
import { IProduct as IShopifyProduct, IShortVariant, IVariant as IShopifyVariant, IVariant, IPrintessShopifyGraphQlApi } from "./printess-graphql-api.d";
import { PrintessShopifyGraphQlApi } from "./printess-graphql-api.js";
import { IIntegrationButton, ISessionSettings, IShopifySettings, IUrlParams, ICartItem, IIntegration, IImageDimensionFormFields, TImageFormat, IPluginContainer } from "./printess-shopify.d";
import { iExternalBookSettings, iExternalImage, iMergeTemplate, iPrintessApi, iPrintessComponent, IProduct } from "./printess-editor.d";
import { IShopData } from "../../../editor/custom-ui/printess-editor.js";
import { IPrintessPriceConfig, PrintessPriceCalculator } from "./printess-price-calculator.js";
import { INameValuePair, IPluginContext, IPlugin, TUiType, IEditorSettings, IFormFieldMapping, IPrintessProduct, IPrintessProductSettings, IPrintessProductVariant, IPrintessVariantSettings } from "./printess-plugins.d"
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

    PrintessEditorFrontend.preloadEditor(config.editorDomain || "", config.editorVersion || "");
  }

  public getIntegrationButton(): IIntegrationButton | null {
    return this.designNowButton;
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

    const handleUrlChange = () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        const variantId = extractVariantId();
        if (variantId !== null && variantId !== lastFiredVariantId) {
          lastFiredVariantId = variantId;
          that.onVariantChanged(variantId);
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
          this.designNowButton!.printessSetStatus("hidden");
        } else {
          this.designNowButton!.printessSetStatus(personalizationMode === "directAdd" ? "direct_add_to_basket" : "editor");
        }

        if (personalizationMode === "both") {
          this.addDirectAddToBasketButton();
        } else {
          this.removeDirectAddToBasketButton();
        }
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
              ret.priceConfig = <IPrintessPriceConfig>JSON.parse(ret.product.additionalPrices.value);
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

      if (personalizationMode === "both") {
        ret.addDirectAddToBasketButton();
      } else {
        ret.removeDirectAddToBasketButton();
      }
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
    const result = await fetch('/cart.js', {
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

  private convertShopifyVariantToPrintessVariant(variant: IShopifyVariant<number>): IPrintessProductVariant {
    const result: IMixedProductVariant = {
      ...variant,
      getId(): string {
        return result.id.toString();
      },
      getLabel(): string {
        return result.title;
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

            if (_value.name === value || _value.id === parseInt(value)) {
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

    const productForm = this.designNowButton?.form || this.designNowButton?.closest("form");
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

        if (variant) {
          const variantOptions: Record<string, string> = {};

          variant[variantId].options.forEach((x) => {
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
      const form = this.designNowButton.form || this.designNowButton.closest("form");

      if (form) {
        form.querySelectorAll('input[name="_printessSaveToken"],input[name="_printessThumbnail"],input[name="_printessSettings"],input[data-printess-created="true"]').forEach((input) => {
          input.remove();
        });

        console.info("Printess Integration: Removed printess values from product form.");
      }
    }
  }

  private setProductFormPrintessValues(saveToken: string, thumbnailUrl: string, additionalProperties: Record<string, string>) {
    if (this.designNowButton) {
      const form = this.designNowButton.form || this.designNowButton.closest("form");

      if (form) {
        let saveTokenEdit: HTMLInputElement | null = form.querySelector('input[name="properties\\[_printessSaveToken\\]"]');

        if (!saveTokenEdit) {
          saveTokenEdit = document.createElement("input");
          saveTokenEdit.setAttribute("type", "hidden");
          saveTokenEdit.setAttribute("name", "properties[_printessSaveToken]");

          form.appendChild(saveTokenEdit);
        }

        saveTokenEdit.value = saveToken || "";

        let thumbnailUrlEdit: HTMLInputElement | null = form.querySelector('input[name="properties\\[_printessThumbnail\\]"]');

        if (!thumbnailUrlEdit) {
          thumbnailUrlEdit = document.createElement("input");
          thumbnailUrlEdit.setAttribute("type", "hidden");
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
    const downloadedCartItems = await fetch('/cart.js', {
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
      const deleted = await fetch('/cart/change.js', {
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

      const response: Response = await fetch('/cart/add', {
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

      window.location.replace('/cart');
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

    await this.editor.show(templateName, currentSession);

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
        if (result.printessSettings?.value) {
          return <IPrintessProductSettings>JSON.parse(result.printessSettings?.value) || {};
        }

        return {};
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

    if (this.mode === "ProductPage") {
      this.setProductFormPrintessValues(params.saveToken, params.thumbnailUrl, params.propertyValuesToWrite);

      if (this.designNowButton) {
        const form = this.designNowButton.form || this.designNowButton.closest("form");

        if (form) {
          //write current variant id
          const variantInput = form.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement;

          if (variantInput) {
            variantInput.value = params.variant.getId();
          }

          const addToBasketButton = form.querySelector(this.configuration.uiSelectors?.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart') as HTMLButtonElement | null;

          if (this.isSaveTokenEditing) {
            PrintessSharedTools.onHookFetch((url: string, init: RequestInit | null, response: Response): "cancel" | "continue" => {
              if (PrintessShopify.urlIsCartAdd(url)) {
                if (init && init.body) {
                  if (init.body instanceof FormData) {
                    const formData = init.body as FormData;

                    const formObject = Object.fromEntries(formData.entries());
                    const jsonString = JSON.stringify(formObject);

                    if (jsonString.indexOf("_printessSaveToken") >= 0) {
                      setTimeout(function () {
                        window.location.replace("/cart");
                      }, 0);
                    }
                  } else if (init.body.toString().indexOf("_printessSaveToken") >= 0) {
                    setTimeout(function () {
                      window.location.replace("/cart");
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

      await PrintessShopify.replaceBasketItem(this.cartItem, params.variant, params.propertyValuesToWrite, this.urlParams?.quantity || this.cartItem.quantity);

      window.location.replace("/cart");
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

    const formFieldsAsProperties = PrintessPluginHost.parseFormFieldsAsProperties(await pluginHost.getFormFieldsAsPropertiesAsync(pluginContext));
    const transformedFormFieldsAsProperties: Record<string, string> = {};

    formFields.forEach((x) => {
      let entry = formFieldsAsProperties.find((y) => { y.formfieldName === x.name });

      if (entry) {
        transformedFormFieldsAsProperties[entry.propertyName || entry.formfieldName] = x.value;
      }
    });

    const propertyValuesToWrite: Record<string, string> = {
      ...transformedFormFieldsAsProperties || {},
      _printessSettings: JSON.stringify({
        withoutPersonalization: true,
        printTemplateName: variant.getPrintTemplateName() ? variant?.getPrintTemplateName() : (product.getPrintTemplateName() ? product.getPrintTemplateName() : "")
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
      const form = this.designNowButton.form || this.designNowButton.closest("form");

      if (form) {
        //write current variant id
        const variantInput = form.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement;

        if (variantInput) {
          variantInput.value = variant.getId();
        }

        const addToBasketButton = form.querySelector(this.configuration.uiSelectors?.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart') as HTMLButtonElement | null;

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

    const form = this.designNowButton.form || this.designNowButton.closest("form");

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

            //Try to find the corresponding label and click on it, just in case the variant selector used does not listen on value changes
            const radioId = el.getAttribute("id");

            if (radioId) {
              const radioLabel = document.querySelector(`label[for="${radioId}"]`) as HTMLLabelElement;

              if (radioLabel) {
                setTimeout(function () {
                  radioLabel.click();

                  if (params.newVariant) {
                    const url = new URL(window.location.href);
                    url.searchParams.set("variant", params.newVariant.getId());
                    window.history.pushState({}, '', url);
                  }
                }, 0);
              }
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
              (el as HTMLSelectElement).value = initialValue === params.formFieldValue ? params.formFieldValue : params.formFieldValueLabel;
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

  public getPriceInCentAsync(context: IPluginContext, currentPrice: number, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    minPages?: number | null,
    printedRecordCount?: number
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

      const calculatedPrice = PrintessPriceCalculator.calculatePrice(additionalPages, params.currentFormFieldValues || [], this.priceConfig || "");

      ret = ret + (calculatedPrice.totalPrice * 100) // * 100 => price in cent;
    }

    return Promise.resolve(ret);
  }

  public async renderPriceAsync(context: IPluginContext, priceToRender: number, currentValue: string, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    price: number,
    numberOfPages: number,
    printedRecordCount: number
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
      hidePriceInEditor: typeof this.configuration.hidePricesInEditor === "boolean" ? this.configuration.hidePricesInEditor : false
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
    const form = this.designNowButton?.form || this.designNowButton?.closest("form");
    const addToBasketButton = form?.querySelector(this.configuration.uiSelectors?.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart') as HTMLButtonElement | null;

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

  private removeDirectAddToBasketButton(): void {
    const form = this.designNowButton?.form || this.designNowButton?.closest("form");
    const addToBasketButton = form?.querySelector(this.configuration.uiSelectors?.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart') as HTMLButtonElement | null;

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