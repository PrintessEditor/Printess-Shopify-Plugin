import { IShopifySettings, IIntegrationButton, IUiSelectors, IUrlParams, ISlimUiMode, IIntegration, IImageDimensionFormFields, TImageFormat, IPluginContainer } from "./printess-shopify.d";
import { IPrintessShopifyGraphQlApi, IProduct as IShopifyProduct, IShortVariant, IVariant as IShopifyVariant } from "./printess-graphql-api.d";
import { PrintessShopifyGraphQlApi } from "./printess-graphql-api.js";
import { iExternalImage, iExternalImageFrameDimensions, iFormFieldNameValue, iImage, iMergeTemplate, IProduct } from "./printess-editor.d";
import { PrintessSharedTools } from "./printess-shared-tools.js";
import { iSlimState, iSlimUiLoadParams } from "../../../slim-ui/slim/slim-ui.d";
import { INameValuePair, IPlugin, IPluginContext, IPrintessProduct, IPrintessProductSettings, IPrintessProductVariant, IPrintessVariantSettings, TUiType } from "./printess-plugins.d"

interface IThemeProductNodes {
  productContainer: HTMLElement;
  productInfoSection: HTMLElement;
  productForm: HTMLFormElement;
  slimUiContainer: HTMLElement;
  productThumbnails: HTMLImageElement[];
  imageProgressIndicator: HTMLElement;
}

interface IMixedProduct extends IShopifyProduct, IPrintessProduct {
  price: number
}

interface IMixedProductVariant extends IShopifyVariant<number>, IPrintessProductVariant {

}

declare class PrintessIntegrationLauncher {
  static plugins: IPlugin[];
  static importIntoGlobalNamespace(param1: string): any;
};

export class PrintessShopifySlimUi implements IIntegration {
  private integrationButton: IIntegrationButton;
  private settings: IShopifySettings;
  private product: IShopifyProduct;
  private productVariants: IShortVariant[];
  private currentVariant: IShortVariant;
  private usedVariantOptions: { name: string, values: string[] }[];
  private themeProductNodes: IThemeProductNodes;
  private urlParams: IUrlParams;
  private slimUi: iSlimState;
  private currentPreviewImages: { url: string, imageFrameDimensions: Record<string, iExternalImageFrameDimensions> }[] = [];
  private originalSaveToken: string = "";
  private currentSaveToken: string = "";
  private mode: ISlimUiMode = "edit";
  private pluginContainer: IPluginContainer;

  private static fullVariantCache: Record<number, IShopifyVariant<number>> = {};

  private constructor(settings: IShopifySettings, integrationButton: IIntegrationButton, product: IShopifyProduct, pluginContainer: IPluginContainer) {
    if (!settings) {
      throw "Printess Integration: No printess settings provided";
    }

    if (!integrationButton) {
      throw "Printess Integration: No integration button provided.";
    }

    if (!product) {
      throw "Printess Integration: No product provided.";
    }

    if (!product.templateName || !(Array.isArray(product.tags) ? product.tags.includes("printess-slimui") : product.tags === "printess-slimui")) {
      throw "Printess Integration: Product is no SlimUi product";
    }

    this.pluginContainer = pluginContainer;
    this.settings = settings;
    this.integrationButton = integrationButton;
    this.product = product;

    this.settings.slimUi.formInsertPosition = settings.slimUi.formInsertPosition === -1 ? -1 : (settings.slimUi.formInsertPosition || 4);

    this.settings.uiSelectors = PrintessShopifySlimUi.applyShopThemeSupport(this.settings.uiSelectors || {} as IUiSelectors, this.settings.slimUi?.shopThemeName || "");

    this.themeProductNodes = this.getThemeProductNodes();

    this.urlParams = PrintessShopifySlimUi.getUrlParams();
  }

  public getIntegrationButton(): IIntegrationButton | null {
    return this.integrationButton;
  }

  private static applyShopThemeSupport(selectors: IUiSelectors | null, themeName: string | null): IUiSelectors {
    const ret: IUiSelectors = selectors ? { ...selectors } : {} as IUiSelectors;

    switch (themeName) {
      case "impulse": {
        ret.cssProductContainerSelector = ret.cssProductContainerSelector || ".grid--product-images--partial";
        ret.cssProductInfoSelector = ret.cssProductInfoSelector || ".product-single__meta";
        ret.cssProductMediaSelector = ret.cssProductMediaSelector || "[data-product-images]";
        ret.cssImageSelector = ret.cssImageSelector || ".image-element";
        ret.cssProductFormSelector = ret.cssProductFormSelector || 'form[action="/cart/add"]';
        ret.cssVariantSwitchSelector = ret.cssVariantSwitchSelector || "[data-dynamic-variants-enabled]";
        ret.cssPriceTextSelector = ret.cssPriceTextSelector || ".product__price";
        ret.cssQuantityInputSelector = ret.cssQuantityInputSelector || '[name="quantity"],[name="qty"]';

        break;
      }
    }

    ret.cssProductContainerSelector = ret.cssProductContainerSelector || 'product-info .product';
    ret.cssProductInfoSelector = ret.cssProductInfoSelector || '.product__info-wrapper > .product__info-container';
    ret.cssProductFormSelector = ret.cssProductFormSelector || 'form[data-type="add-to-cart-form"],form[action="/cart/add"][id^="product-form-template"],form.shopify-product-form[id^=product-form-template],form.product-single__form';
    ret.cssVariantSwitchSelector = ret.cssVariantSwitchSelector || 'variant-selects,variant-picker,.selector-wrapper,variant-radios,.product-form__controls-group,variant-picker__form,variant-selects';
    ret.cssProductMediaSelector = ret.cssProductMediaSelector || "media-gallery,.product-single__media-wrapper,.product__media";
    ret.cssImageSelector = ret.cssImageSelector || "slider-component ul li .product__media img,slider-component ul li .product__media img";
    ret.cssProgressIndicatorSelector = ret.cssProgressIndicatorSelector || "slider-component ul li .loading-overlay__spinner,slider-component ul li .loading__spinner";
    ret.cssPriceTextSelector = ret.cssPriceTextSelector || ".price__regular>span.price-item.price-item--regular";
    ret.cssQuantityInputSelector = ret.cssQuantityInputSelector || '[name="quantity"],[name="qty"]';
    ret.cssProductThumbnailImageSelector = ret.cssProductThumbnailImageSelector || "slider-component ul li .product__media img,slider-component ul";
    ret.cssProductLargePreviewImagesSelector = ret.cssProductLargePreviewImagesSelector || "{GLOBAL}.product-media-modal__content > img";

    return ret;
  }

  private getThemeProductNodes(): IThemeProductNodes {
    const productContainer = this.getThemeProductContainer();
    const infoSection = this.getThemeProductInfoSection(productContainer);
    const productForm = this.integrationButton.printessGetAddToBasketForm();
    const productThumbnails = this.getThemeProductThumbnails(productContainer);
    const imageProgressIndicator = this.getOrCreateThemeImageProgressIndicator(productContainer);

    let variantSwitcher = this.getThemeProductVariantSwitcher(productContainer);
    const slimUiContainer = this.createSlimUiContainer();

    if (!productForm) {
      throw "Printess Integration: Could not find product form."
    }

    //Insert slimui container4
    if (variantSwitcher) {
      variantSwitcher.classList.add("printess-hidden");
    } else {
      if (this.settings.slimUi.formInsertPosition === -1 || this.settings.slimUi.formInsertPosition >= infoSection.children.length) {
        if (infoSection.children.length === 0) {
          const dummy = document.createElement("div");
          infoSection.appendChild(dummy);
          variantSwitcher = dummy;
        } else {
          variantSwitcher = infoSection.children[infoSection.children.length - 1] as HTMLElement;
        }
      } else {
        variantSwitcher = infoSection.children[this.settings.slimUi.formInsertPosition] as HTMLElement;
      }
    }

    variantSwitcher.parentElement?.insertBefore(slimUiContainer, variantSwitcher);

    return {
      productContainer: productContainer,
      productInfoSection: infoSection,
      productForm: productForm,
      slimUiContainer: slimUiContainer,
      productThumbnails: productThumbnails,
      imageProgressIndicator: imageProgressIndicator
    } as IThemeProductNodes;
  }

  private getThemeProductContainer(): HTMLElement {
    const container = this.integrationButton.closest<HTMLElement>(this.settings.uiSelectors!.cssProductContainerSelector!);

    if (!container) {
      throw "Printess Integration: Product container not found using selector " + this.settings.uiSelectors!.cssProductContainerSelector!;
    }

    return container;
  }

  private getThemeProductInfoSection(productContainer: HTMLElement) {
    const infoSection = productContainer.querySelector<HTMLElement>(this.settings.uiSelectors!.cssProductInfoSelector!);

    if (!infoSection) {
      throw "Printess Integration: Product info section not found using selector " + this.settings.uiSelectors!.cssProductInfoSelector!;
    }

    return infoSection;
  }

  private getThemeProductVariantSwitcher(productContainer: HTMLElement): HTMLElement | null {
    let switcher = productContainer.querySelector<HTMLElement>(this.settings.uiSelectors!.cssVariantSwitchSelector!);

    return switcher;
  }

  private getThemeProductThumbnails(productContainer: HTMLElement): HTMLImageElement[] {
    const mediaNode = productContainer.querySelector(this.settings.uiSelectors!.cssProductMediaSelector!);
    const ret: HTMLImageElement[] = [];
    const that = this;

    if (!mediaNode) {
      throw "Printess Integration: Media container not found.";
    }

    const productThumbnail = mediaNode.querySelectorAll<HTMLImageElement>(this.settings.uiSelectors!.cssImageSelector!);

    if (!productThumbnail || productThumbnail.length === 0) {
      throw "Printess Integration: Product thumbnail not found.";
    }

    productThumbnail.forEach((x) => {
      if (this.settings.slimUi?.maxThumbnailHeight && x.classList.toString().indexOf("printess-thumbnail") < 0) {
        x.classList.add("printess-thumbnail");

        x.style.maxHeight = !x.style.maxHeight ? that.settings.slimUi?.maxThumbnailHeight || "" : x.style.maxHeight;
      }

      ret.push(x);
    });

    return ret;
  }

  private getThemePriceDisplay(productContainer: HTMLElement): HTMLElement | null {
    const priceDisplay = this.getThemeProductInfoSection(productContainer).querySelector<HTMLElement>(this.settings.uiSelectors?.cssPriceTextSelector!);

    if (!priceDisplay) {
      console.warn("Printess Integration: Unable to locate product price display.");
      return null;
    }

    return priceDisplay;
  }

  private getThemeQuantitySelector(productContainer: HTMLElement): HTMLInputElement | HTMLSelectElement | null {
    return this.getThemeProductInfoSection(productContainer).querySelector(this.settings.uiSelectors?.cssQuantityInputSelector!) || null;
  }

  private getOrCreateThemeImageProgressIndicator(productContainer: HTMLElement): HTMLElement {
    const mediaNode = productContainer.querySelector(this.settings.uiSelectors!.cssProductMediaSelector!);

    if (!mediaNode) {
      throw "Printess Integration: Media container not found.";
    }

    const progressIndicator = mediaNode.querySelector<HTMLElement>(this.settings.uiSelectors!.cssProgressIndicatorSelector! + ",.printess-progress-indicator");

    if (progressIndicator) {
      return progressIndicator;
    }

    const ret = document.createElement("div");

    ret.classList.add("printess-progress-indicator");
    ret.classList.add("printess-hidden");
    ret.classList.add("printess-image-progress-wrapper");

    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("printess-progress-wrapper");

    const circleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    circleSvg.classList.add("printess-circle");
    circleSvg.setAttribute("viewBox", "25 25 50 50");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.classList.add("printess-path");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "20");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke-width", "5");
    circle.setAttribute("stroke-miterlimit", "10");
    circleSvg.appendChild(circle);

    wrapperDiv.appendChild(circleSvg);

    ret.appendChild(wrapperDiv);

    const thumbnails = this.getThemeProductThumbnails(productContainer);

    if (thumbnails.length > 0 && thumbnails[0].parentElement) {
      thumbnails[0].parentElement.appendChild(ret);
    }

    return ret;
  }

  private static showOrHideElement(element: HTMLElement, show: boolean): void {
    if (show) {
      element.classList.remove("printess-hidden");

      if (element.classList.contains("hidden")) {
        element.classList.remove("hidden");
      }

      if (element.style.display = "none") {
        element.style.display = "block";
      }
    } else {
      element.classList.add("printess-hidden");
    }
  }

  private getThemeLargeProductThumbnails(productContainer: HTMLElement): HTMLImageElement[] {
    const mediaNode = productContainer.querySelector(this.settings.uiSelectors!.cssProductMediaSelector!);
    const ret: HTMLImageElement[] = [];

    if (!mediaNode) {
      throw "Printess Integration: Media container not found.";
    }

    let rootNode = mediaNode;
    let selector = this.settings.uiSelectors!.cssImageSelector!;

    if (selector.startsWith("{PRODUCT}")) {
      rootNode = productContainer;
      selector = selector.substring("{PRODUCT}".length);
    } else if (selector.startsWith("{GLOBAL}")) {
      rootNode = document.querySelector("body")!;
      selector = selector.substring("{GLOBAL}".length);
    }

    const productThumbnail = rootNode.querySelectorAll<HTMLImageElement>(selector);

    if (!productThumbnail || productThumbnail.length === 0) {
      throw "Printess Integration: Product thumbnail not found.";
    }

    productThumbnail.forEach((x) => {
      ret.push(x);
    });

    return ret;
  }

  private createSlimUiContainer(): HTMLElement {
    const slimUiContainer = document.createElement("div");
    slimUiContainer.classList.add("printess-item-container", "printess-ui", "printess-hidden");

    return slimUiContainer;
  }

  private static getUrlParams(): IUrlParams {
    const urlParams = new URLSearchParams(window.location.search);
    const ret: IUrlParams = {
      saveToken: urlParams.get("printesssavetoken") || "",
      autoOpenEditor: false,
      quantity: 1,
      basketKey: urlParams.get("basketkey") || "",
      ui: (urlParams.get("ui") || "") as TUiType
    };

    const quantityString = urlParams.get("qty");
    const autoOpenString = (urlParams.get("pao") || "").toLowerCase().trim();
    const qty = quantityString ? parseInt(quantityString) : 1;

    if (!isNaN(qty) && isFinite(qty) && qty > 0) {
      ret.quantity = qty;
    }

    if (autoOpenString) {
      ret.autoOpenEditor = autoOpenString === "true" || autoOpenString === "1";
    }


    return ret;
  }

  private static getInputs(productContainer: HTMLElement): (HTMLInputElement | HTMLSelectElement)[] {
    const ret: (HTMLInputElement | HTMLSelectElement)[] = [];

    const inputSelector: string = 'select,input[type="radio"]:checked,input[type="checkbox"]:checked,input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="hidden"],input[type="month"],input[type="number"],input[type="password"],input[type="tel"],input[type="text"],input[type="time"],input[type="url"],input[type="week"]';

    productContainer.querySelectorAll(inputSelector).forEach((x: Element) => {
      ret.push((<HTMLInputElement | HTMLSelectElement>x));
    });

    return ret;
  }

  private evaluateInputName(name: string, dataOptionPosition: string | null | undefined, dataOptionName: string | null | undefined, dataOptionValueId: string | number | null | undefined): string {
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
      if (this.product.productOptions && _name.indexOf("option") === 0) {
        const index = parseInt(_name.substring("option".length, _name.length));

        if (!isNaN(index) && isFinite(index) && index > 0 && index <= this.product.productOptions.length) {//Data option position is 1 based in shopify
          optionPosition = index;
        }
      }
    }

    if (this.product.productOptions && !dataOptionPosition && optionPosition < 1 && dataOptionValueId) {
      if (typeof dataOptionValueId !== "number") {
        dataOptionValueId = parseInt(dataOptionValueId);
      }

      for (let i = 0; i < this.product.productOptions.length; ++i) {
        if (this.product.productOptions[i].optionValues) {
          for (let j = 0; j < this.product.productOptions[i].optionValues.length; ++j) {
            if (this.product.productOptions[i].optionValues[j].id === dataOptionValueId) {
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

    if (dataOptionPosition && this.product.productOptions) {
      const index = parseInt(dataOptionPosition);

      if (!isNaN(index) && isFinite(index) && index > 0 && index <= this.product.productOptions.length) {//Data option position is 1 based in shopify
        optionPosition = index;
      }
    }

    if (this.product.productOptions && optionPosition > 0 && optionPosition <= this.product.productOptions.length) {
      _name = this.product.productOptions[optionPosition - 1].name;
    }

    return _name;
  }

  private mapOptionValue(optionName: string, optionIndex: number, value: string): string {
    let ret = null;

    if (!this.product || !this.product.productOptions) {
      return value;
    }

    for (let currentOption = 0; currentOption < this.product.productOptions.length; ++currentOption) {
      const option = this.product.productOptions[currentOption];

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

    return ret || value;
  }

  private evaluateInputValue(optionName: string, optionIndex: string, value: string, dataOptionValueId: string | number | null | undefined): string {
    if (!this.product || !this.product.productOptions) {
      return value;
    }

    if (optionName && !optionIndex) {
      for (let i = 0; i < this.product.productOptions.length; ++i) {
        if (this.product.productOptions[i].name === optionName) {
          optionIndex = (i + 1).toString();
          break;
        }
      }
    }

    if (!optionIndex && dataOptionValueId) {
      if (typeof dataOptionValueId !== "number") {
        dataOptionValueId = parseInt(dataOptionValueId);
      }

      for (let i = 0; i < this.product.productOptions.length; ++i) {
        if (this.product.productOptions[i].optionValues) {
          for (let j = 0; j < this.product.productOptions[i].optionValues.length; ++j) {
            if (this.product.productOptions[i].optionValues[j].id === dataOptionValueId) {
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

    if (optionIndex) {
      const index: number = parseInt(optionIndex);

      if (!isNaN(index) && isFinite(index) && index > 0 && index <= this.product.productOptions.length) {
        return this.mapOptionValue(optionName, index, value);
      }
    }

    return value;
  }

  private getSelectedProductOptions() {
    let ret = {} as Record<string, string>;
    let foundProductOptionCount = 0;

    PrintessShopifySlimUi.getInputs(this.themeProductNodes.productContainer).forEach((input: HTMLSelectElement | HTMLInputElement) => {
      let dataOptionPosition = input.getAttribute("data-option-position") || input.getAttribute("data-option-index");
      let dataOptionName = input.getAttribute("data-option-name") || input.getAttribute("data-name") || input.getAttribute("name") || input.getAttribute("aria-label") || input.getAttribute("data-index");

      let name = this.evaluateInputName(input.getAttribute("name") || "", !this.settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, input.getAttribute("data-option-value-id"));
      let value = this.evaluateInputValue(name, !this.settings.ignoreDataOptionIndex ? dataOptionPosition || "" : "", input.value, input.getAttribute("data-option-value-id"));

      const namesToIgnore: string[] = ["form_type", "utf8", "id", "product-id", "section-id"];

      if (this.product.productOptions && name && name[0] !== "_" && namesToIgnore.indexOf(name) === -1 && name.indexOf("printess") !== 0) {
        //Make sure this is an existing product option name
        if (this.product.productOptions.filter((x) => x.name === name).length > 0) {
          ret[name] = value;
          foundProductOptionCount += 1;
        }
      }
    });

    if (foundProductOptionCount === 0) {
      //Maybe no variant selector found, try to get the current variant from the variant id input
      const idInput = this.themeProductNodes.productForm.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement;
      let selectedId: number | null = null;

      if (idInput && idInput.value) {
        let num = Number(idInput.value.trim());

        if (idInput.value.trim() !== '' && Number.isInteger(num)) {
          if (this.productVariants && this.productVariants.length > 0) {
            const selectedVariant = this.productVariants.find((x) => x.id === num);

            if (selectedVariant) {
              (selectedVariant.options || []).forEach((x) => {
                ret[x.optionName] = x.optionValue;
              });
            }
          }
        }
      }
    }

    return ret;
  }

  private getVariantByProductOptions(options: Record<string, string>, returnDefraultVariant: boolean = true): IShortVariant | null {
    if (!this.product || !this.productVariants || this.productVariants.length === 0) {
      return null;
    }

    const optionFilter: Record<string, boolean> = {};

    this.usedVariantOptions.forEach(x => optionFilter[x.name] = true);

    let variants = this.productVariants;

    for (const name in options) {
      if (options.hasOwnProperty(name) && optionFilter[name]) {
        variants = variants.filter((variant) => {
          const options2 = variant.options.filter(x => x.optionName === name && x.optionValue === options[name]);

          return options2.length > 0;
        });
      }
    }

    if (variants.length > 0) {
      return variants[0];
    }

    if (returnDefraultVariant) {
      return this.productVariants[0];
    } else {
      return null;
    }
  }

  private getUsedProductOptions(): { name: string, values: string[] }[] {
    if (this.productVariants) {
      const productOptions: Record<string, string[]> = {};

      this.productVariants.forEach((variant) => {
        if (!variant.available) {
          return;
        }

        variant.options?.forEach((option) => {
          if (!productOptions[option.optionName]) {
            productOptions[option.optionName] = [option.optionValue];
          } else {
            if (!productOptions[option.optionName].includes(option.optionValue)) {
              productOptions[option.optionName].push(option.optionValue);
            }
          }
        });
      });

      const usedVariantOptions: { name: string, values: string[] }[] = [];

      for (const optionName in productOptions) {
        if (productOptions.hasOwnProperty(optionName)) {
          usedVariantOptions.push({
            name: optionName,
            values: productOptions[optionName]
          });
        }
      }

      this.usedVariantOptions = usedVariantOptions

      return usedVariantOptions;
    }

    return [];
  }

  private getProductFormFieldValues(): iFormFieldNameValue[] {
    let ret: iFormFieldNameValue[] = [];

    const optionValues = this.getSelectedProductOptions();

    for (const optionName in optionValues) {
      if (optionValues.hasOwnProperty(optionName)) {
        ret.push({
          name: optionName,
          value: optionValues[optionName]
        });
      }
    }

    return ret;
  }

  public getGraphQlApi(): IPrintessShopifyGraphQlApi {
    return new PrintessShopifyGraphQlApi(this.settings.apiDomain || "", this.settings.shopToken, this.settings.graphQlToken, this.settings.graphQlLanguage);
  }

  private async getFullVariant(variant: IShortVariant): Promise<IShopifyVariant<number> | null> {
    if (PrintessShopifySlimUi.fullVariantCache[variant.id]) {
      return PrintessShopifySlimUi.fullVariantCache[variant.id];
    } else {
      const graphql = new PrintessShopifyGraphQlApi(this.settings.apiDomain || "", this.settings.shopToken, this.settings.graphQlToken, this.settings.graphQlLanguage);
      const variantOptions: Record<string, string> = {};

      variant.options?.forEach(x => variantOptions[x.optionName] = x.optionValue);

      const fullVariant = await graphql.getProductVariantByOptions(this.product.id, variantOptions);

      if (fullVariant) {
        PrintessShopifySlimUi.fullVariantCache[variant.id] = fullVariant.variantBySelectedOptions!;
        return fullVariant.variantBySelectedOptions!;
      }
    }

    return null;
  }

  private static formatPrice(cents: number, format: string, priceIsInCent: boolean): string {
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

  private async setProductOptionValue(formFieldName: string, formFieldValue: string, formFieldLabel: string, valueLabel: string): Promise<void> {
    let inputs = document.querySelectorAll(`input[type="radio"]`);
    let foundControl = false;

    if (inputs && inputs.length > 0) {
      inputs.forEach((el) => {
        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
        const initialName = this.evaluateInputName(el.getAttribute("name") || "", !this.settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
        const initialValue = this.evaluateInputValue(initialName, !this.settings.ignoreDataOptionIndex ? dataOptionPosition || "" : "", (el as HTMLInputElement).value, el.getAttribute("data-option-value-id"));
        let valueChanged = false;

        if (initialName === formFieldName || initialName === formFieldLabel) {
          foundControl = true;

          if (initialValue === formFieldValue || initialValue === valueLabel) {
            if (!valueChanged && !(el as HTMLInputElement).checked) {
              valueChanged = true;
            }

            el.setAttribute('checked', true.toString());
            (el as HTMLInputElement).checked = true;
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
    inputs = document.querySelectorAll(`select`);

    inputs.forEach((el) => {
      const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
      const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
      const initialName = this.evaluateInputName(el.getAttribute("name") || "", !this.settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
      let valueChanged = false;

      if ((el as HTMLSelectElement).options) {
        for (let i = 0; i < (el as HTMLSelectElement).options.length; ++i) {
          const initialValue = this.evaluateInputValue(initialName, !this.settings.ignoreDataOptionIndex ? dataOptionPosition || "" : "", (el as HTMLSelectElement).options[i].getAttribute('value') || "", el.getAttribute("data-option-value-id"));

          if (initialName === formFieldName || initialName === formFieldLabel) {
            foundControl = true;

            if (initialValue === formFieldValue || initialValue === valueLabel) {
              if (!valueChanged && !(el as HTMLSelectElement).options[i].selected) {
                valueChanged = true;
              }

              (el as HTMLSelectElement).options[i].setAttribute('selected', true.toString());
              (el as HTMLSelectElement).options[i].selected = true;

              el.setAttribute('value', formFieldValue);
              (el as HTMLSelectElement).value = initialValue === formFieldValue ? formFieldValue : valueLabel;
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
    inputs = document.querySelectorAll(`input[type="text"],input[type="hidden"],input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="month"],input[type="number"],input[type="tel"],input[type="time"],input[type="url"],input[type="week"]`);

    if (inputs && inputs.length > 0) {
      inputs.forEach((el) => {
        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
        const initialName = this.evaluateInputName(el.getAttribute("name") || "", !this.settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
        const initialValue = this.evaluateInputValue(initialName, !this.settings.ignoreDataOptionIndex ? dataOptionPosition || "" : "", (el as HTMLInputElement).value, el.getAttribute("data-option-value-id"));
        let valueChanged = false;

        if (initialName === formFieldName) {
          foundControl = true;

          if (!valueChanged && el.getAttribute("value") !== initialValue) {
            valueChanged = true;
          }

          el.setAttribute("value", initialValue);
        } else if (initialName === formFieldLabel) {
          foundControl = true;

          if (!valueChanged && el.getAttribute("value") !== valueLabel) {
            valueChanged = true;
          }

          el.setAttribute("value", valueLabel);
        }

        if (valueChanged) {
          el.dispatchEvent(new Event('change'));
        }
      });
    }

    //Update variant id in url
    const currentProductOptions = this.getSelectedProductOptions();

    if (!foundControl) {
      //We have to update the current product options, which still do not include the current change
      //Get the correct variant option first
      if (this.product && this.product.productOptions) {
        const lowerFormFieldName = formFieldName.toLowerCase();
        const lowerFormFieldLabel = (formFieldLabel || formFieldName).toLowerCase();

        const selectedOption = this.product.productOptions.find((x) => {
          const lowerName = x.name.toLowerCase();

          return lowerName === lowerFormFieldName || lowerName === lowerFormFieldLabel;
        });

        if (selectedOption && selectedOption.optionValues) {
          const lowerValue = formFieldValue.toLowerCase();
          const lowerValueLabel = (valueLabel || formFieldValue).toLowerCase();

          const selectedValue = selectedOption.optionValues.find((x) => {
            const lowerName = x.name.toLowerCase();

            return lowerName === lowerValue || lowerName === lowerValueLabel;
          });

          if (selectedValue) {
            currentProductOptions[selectedOption.name] = selectedValue.name;
          }
        }
      }
    }

    const variant = this.getVariantByProductOptions(currentProductOptions, true);

    if (this.product && this.productVariants && this.productVariants.length > 1) {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const urlVariantId = urlParams.get('variant');

      const variantId = variant ? variant.id.toString() : this.product.id.toString();

      try {
        if (urlVariantId) {
          if (urlVariantId != variantId) {
            window.history.replaceState({}, '', window.location.href.replace("variant=" + urlVariantId, "variant=" + variantId));
          }
        } else {
          window.history.replaceState({}, '', `${window.location.href}${variantId ? `?variant=${variantId}` : ''}`);
        }
      } catch (e) {
        console.error(e);
      }
    }

    this.updateVariantInput(variant);


    //update price
    const priceTextDisplay = this.getThemePriceDisplay(this.themeProductNodes.productContainer);

    if (priceTextDisplay && variant) {
      const fullVariant = await this.getFullVariant(variant);

      const price = await this.getPriceInCentAsync(this.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(this.product, fullVariant ? fullVariant.price.amount : 0.0), PrintessShopifySlimUi.convertToPrintessVariant(fullVariant)), fullVariant?.price.amount || 0.0, {});

      priceTextDisplay.innerHTML = PrintessShopifySlimUi.formatPrice(price, this.settings.priceFormat, false);
    }
  }

  private updateVariantInput(variant: IShortVariant | null = null) {
    if (!variant) {
      const currentProductOptions = this.getSelectedProductOptions();
      variant = this.getVariantByProductOptions(currentProductOptions, true);
    }

    //set current variant id
    const idInput = this.themeProductNodes.productForm.querySelector('input[name="id"],select[name="id"]') as HTMLInputElement | HTMLSelectElement;

    if (idInput && variant) {
      idInput.value = variant.id.toString();
    }
  }

  private async initThumbnails(currentImageUrl?: string): Promise<{ url: string, imageFrameDimensions: Record<string, iExternalImageFrameDimensions> }[]> {
    const secondThumbnails = this.getThemeLargeProductThumbnails(this.themeProductNodes.productContainer);
    const ret: { url: string, imageFrameDimensions: Record<string, iExternalImageFrameDimensions> }[] = [];

    //Get Previews
    let currentThumbnailIndex = 0;
    let maxProductThumbnails = 3;

    if (typeof this.settings.slimUi.maxProductThumbnails === "number" && this.settings.slimUi.maxProductThumbnails > 0) {
      maxProductThumbnails = this.settings.slimUi.maxProductThumbnails;
    }

    let previews = this.slimUi!.previews;

    if (!previews || previews.length === 0) {
      previews = [{ pageCount: 1, docName: "", facingPages: false }];
    }

    if (previews) {
      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];
        for (let j = 0; j < preview.pageCount && j <= maxProductThumbnails; j++) {//1: Skip first image as this is the default display image that is already displayed
          const thumbnailInfo = await this.slimUi!.getPreviewImageInfo(i, j);

          if (this.themeProductNodes.productThumbnails.length > currentThumbnailIndex) {
            const thumbnailImage = this.themeProductNodes.productThumbnails[currentThumbnailIndex];


            thumbnailImage.src = thumbnailInfo.url;

            if (typeof thumbnailImage.srcset !== "undefined" && thumbnailImage.srcset) {
              thumbnailImage.srcset = thumbnailInfo.url;
            }

            ret.push(thumbnailInfo);

            if (secondThumbnails != null && secondThumbnails.length > currentThumbnailIndex) {
              const thumbnailImage = secondThumbnails[currentThumbnailIndex];


              thumbnailImage.src = thumbnailInfo.url;

              if (typeof thumbnailImage.srcset !== "undefined" && thumbnailImage.srcset) {
                thumbnailImage.srcset = thumbnailInfo.url;
              }
            }
          }

          currentThumbnailIndex++;
        }
      }
    }

    if (currentImageUrl && secondThumbnails != null && secondThumbnails.length > 0) {
      const thumbnailImage = secondThumbnails[0] as HTMLImageElement;
      thumbnailImage.src = currentImageUrl;

      if (typeof thumbnailImage.srcset !== "undefined" && thumbnailImage.srcset) {
        thumbnailImage.srcset = currentImageUrl;
      }
    }

    return ret;
  }

  private static async waitForResult<T>(result: T | Promise<T>): Promise<T> {
    if (typeof result == "undefined" || result == null) {
      return <T>result;
    }

    if (result instanceof Promise) {
      return await result;
    } else {
      return result;
    }
  }

  private async getCurrentTemplateName(urlParams: IUrlParams, product: IShopifyProduct, variant?: IShortVariant | null): Promise<string> {
    let ret = urlParams && urlParams.saveToken ? urlParams.saveToken : ((variant ? variant.templateName : "") || product.templateName?.value) || "";

    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getTemplateNameAsync === "function") {
          const val = await PrintessShopifySlimUi.waitForResult(plugin.getTemplateNameAsync(this.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(product, 0), PrintessShopifySlimUi.convertToPrintessVariant(null)), ret));

          if (typeof val !== "undefined" && val) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  private async mapFormFields(formFields: INameValuePair[]): Promise<INameValuePair[]> {
    let ret: INameValuePair[] = formFields;
    const plugins = this.pluginContainer.getPlugins();
    const pluginContext = this.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(this.product, 0), PrintessShopifySlimUi.convertToPrintessVariant(null));

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.mapFormFielsdAsync === "function") {
          const val = await PrintessShopifySlimUi.waitForResult(plugin.mapFormFielsdAsync(pluginContext, ret, { mappings: {} }));

          if (typeof val !== "undefined" && val) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  private async unmapFormField(formField: string, formFieldValue: string, formFieldLabel: string, formFieldValueLabel: string): Promise<INameValuePair> {
    let ret: INameValuePair = { name: formField, value: formFieldValue };
    const plugins = this.pluginContainer.getPlugins();
    const pluginContext = this.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(this.product, 0), PrintessShopifySlimUi.convertToPrintessVariant(null));

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.unmapFormFieldAsync === "function") {
          const val = await PrintessShopifySlimUi.waitForResult(plugin.unmapFormFieldAsync(pluginContext, ret, {
            formFieldLabel: formFieldLabel,
            formFieldName: formField,
            formFieldValue: formFieldValue,
            formFieldValueLabel: formFieldValueLabel,
            mappings: {}
          }));

          if (typeof val !== "undefined" && val) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  private static async create(settings: IShopifySettings, integrationButton: IIntegrationButton, pluginContainer: IPluginContainer): Promise<PrintessShopifySlimUi> {
    const ret = new PrintessShopifySlimUi(settings, integrationButton, integrationButton.product!, pluginContainer);
    const graphQl = new PrintessShopifyGraphQlApi(settings.apiDomain || "", settings.shopToken, settings.graphQlToken, settings.graphQlLanguage || "");

    //Show image progress indicator
    PrintessShopifySlimUi.showOrHideElement(ret.themeProductNodes.imageProgressIndicator, true);

    ret.productVariants = await graphQl.getProductVariants(integrationButton.product!.id);
    ret.usedVariantOptions = ret.getUsedProductOptions();

    const currentProductOptions = ret.getSelectedProductOptions();
    ret.currentVariant = ret.getVariantByProductOptions(currentProductOptions, true)!;

    let templateName: string = await ret.getCurrentTemplateName(ret.urlParams, ret.product, ret.currentVariant);

    let formFields: iFormFieldNameValue[] | null = null;
    let mergeTemplates: iMergeTemplate[] | null = null;

    if (!templateName.startsWith("st:")) {
      formFields = await ret.mapFormFields(ret.getProductFormFieldValues().map((x) => {
        return {
          name: x.name,
          value: (x.value || "").toString()
        }
      }));

      mergeTemplates = PrintessSharedTools.parseMergeTemplate(ret.product.mergeTemplates?.value || "");
      ret.originalSaveToken = "";
      ret.currentSaveToken = "";
    } else {
      ret.originalSaveToken = templateName;
      ret.currentSaveToken = templateName;
    }

    //Support form field mappings

    if (ret.urlParams && typeof ret.urlParams.quantity !== "undefined" && ret.urlParams.quantity > 0) {
      const qtyCtrl = ret.getThemeQuantitySelector(ret.themeProductNodes.productContainer);

      if (qtyCtrl && typeof qtyCtrl.value !== "undefined") {
        qtyCtrl.value = ret.urlParams.quantity.toString();
      }
    }

    if (ret.urlParams && ret.urlParams.saveToken && ret.urlParams.basketKey) {
      ret.mode = "cartedit";
    }

    const createParams: iSlimUiLoadParams = {
      disableProductImageUploadOnStartup: settings.slimUi.doNotUpdateThumbnailOnLoad === true,
      previewContainer: document.createElement("div"),
      uiContainer: ret.themeProductNodes.slimUiContainer as HTMLDivElement,
      previewImage: ret.themeProductNodes.productThumbnails.length > 0 ? ret.themeProductNodes.productThumbnails[0] : document.createElement("img"),
      loader: ret.themeProductNodes.imageProgressIndicator,
      shopToken: ret.settings.shopToken,
      templateName: templateName,
      published: true,
      formFields: formFields || [],
      apiDomain: ret.settings.apiDomain || "api.printess.com",
      //mergeTemplates: mergeTemplates,
      theme: ret.settings.printessThemeName || "DEFAULT",
      formFieldChangedCallback: function (name: string, value: string, tag: string, label: string, ffLabel: string): void {
        ret.unmapFormField(name, value, ffLabel, label).then((mappedFormField) => {
          ret.setProductOptionValue(mappedFormField.name, mappedFormField.value, ffLabel, label);
        });
      },
      renderPreviewImageCallback: (thumbnailUrl: string | string[]) => {
        ret.initThumbnails(Array.isArray(thumbnailUrl) ? thumbnailUrl[0] : thumbnailUrl).then((thumbnails) => {
          ret.currentPreviewImages = thumbnails;

          ret.getFullVariant(ret.currentVariant).then((variant) => {
            if (ret.settings.uiSelectors?.cssProductLargePreviewImagesSelector) {
              const productContainer = ret.themeProductNodes.productContainer;
              let rootNode = productContainer.querySelector(ret.settings.uiSelectors!.cssProductMediaSelector!);
              let selector = ret.settings.uiSelectors?.cssProductLargePreviewImagesSelector;

              if (selector.startsWith("{PRODUCT}")) {
                rootNode = productContainer;
                selector = selector.substring("{PRODUCT}".length);
              } else if (selector.startsWith("{GLOBAL}")) {
                rootNode = document.querySelector("body")!;
                selector = selector.substring("{GLOBAL}".length);
              }

              if (rootNode) {
                const productThumbnails = rootNode.querySelectorAll<HTMLImageElement>(selector);

                if (productThumbnails && productThumbnails.length > 0 && thumbnails.length > 0) {
                  for (let i = 0; i < productThumbnails.length && i < thumbnails.length; ++i) {
                    if (typeof productThumbnails[i].src !== "undefined") {
                      productThumbnails[i].src = thumbnails[i].url;
                    }

                    if (typeof productThumbnails[i].srcset !== "undefined" && productThumbnails[i].srcset) {
                      productThumbnails[i].srcset = thumbnails[i].url;
                    }
                  }
                }
              }
            }

            ret.onThumbnailsChangedAsync(ret.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(ret.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant)), {
              thumbnails: !Array.isArray(thumbnailUrl) ? [thumbnailUrl] : thumbnailUrl
            });
          });
        }).finally(() => {

        });
      },
      progressStateChangedCallback(show: boolean): void {
        if (show) {
          ret.themeProductNodes.imageProgressIndicator?.classList.remove("printess-hidden");

          if (ret.themeProductNodes.imageProgressIndicator?.classList.contains("hidden")) {
            ret.themeProductNodes.imageProgressIndicator?.classList.remove("hidden");
          }

        } else {
          ret.themeProductNodes.imageProgressIndicator?.classList.add("printess-hidden");
        }

        ret.getFullVariant(ret.currentVariant).then((variant) => {
          ret.onProgressIndicatorAsync(ret.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(ret.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant)), {
            show: show
          });
        });
      }
    };

    if (ret.product && ret.product.printessSettings && ret.product.printessSettings.value) {
      try {
        const productSettings = <IPrintessProductSettings>JSON.parse(ret.product.printessSettings.value);

        if (productSettings && productSettings.layout) {
          createParams.layout = productSettings.layout;
        }
      } catch (e) {
        console.error("Printess Integration: Unable to deserialize product settings: " + JSON.stringify(e));
      }
    }

    //Short time compatibility layer
    (<any>createParams).callbacks = {
      renderPreviewImageCallback: (thumbnailUrl: string | string[]) => {
        ret.initThumbnails(Array.isArray(thumbnailUrl) ? thumbnailUrl[0] : thumbnailUrl).then((thumbnails) => {
          ret.currentPreviewImages = thumbnails;

          ret.getFullVariant(ret.currentVariant).then((variant) => {
            ret.onThumbnailsChangedAsync(ret.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(ret.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant)), {
              thumbnails: !Array.isArray(thumbnailUrl) ? [thumbnailUrl] : thumbnailUrl
            });
          });
        });
      },
      progressStateChangedCallback(show: boolean): void {
        if (show) {
          ret.themeProductNodes.imageProgressIndicator?.classList.remove("printess-hidden");

          if (ret.themeProductNodes.imageProgressIndicator?.classList.contains("hidden")) {
            ret.themeProductNodes.imageProgressIndicator?.classList.remove("hidden");
          }
        } else {
          ret.themeProductNodes.imageProgressIndicator?.classList.add("printess-hidden");
        }

        ret.getFullVariant(ret.currentVariant).then((variant) => {
          ret.onProgressIndicatorAsync(ret.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(ret.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant)), {
            show: show
          });
        });
      }
    };

    const editorUrl = PrintessSharedTools.urlConcat(PrintessSharedTools.ensureHttpProtocol(PrintessSharedTools.sanitizeHost(ret.settings.editorDomain || "https://editor.printess.com")), ret.settings.editorVersion || "", "slim-ui.js");

    const imports = await PrintessSharedTools.importIntoGlobalNamespaceAsync(editorUrl);

    const createSlimUi = typeof (<any>imports)["createSlimUi"] === "function" ? (<any>imports)["createSlimUi"] : (<any>imports)["PrintessSlimUi"]?.createSlimUi;

    if (typeof createSlimUi !== "function") {
      throw "Printess Integration: Slim Ui not found";
    }

    ret.slimUi = await createSlimUi(createParams);

    ret.themeProductNodes.slimUiContainer.classList.remove("printess-hidden");

    ret.integrationButton.printessSetStatus("slimui");

    if (ret.urlParams && ret.urlParams.saveToken && ret.urlParams.basketKey) {
      ret.mode = "cartedit";

      integrationButton.printessSetCaption(ret.settings.captions?.saveBasketItem || "Save");
    }

    ret.integrationButton.addEventListener('click', async function (): Promise<void> {
      await ret.onBasketItemClick();
    });

    if (settings.slimUi?.doNotUpdateThumbnailOnLoad === true) {
      ret.themeProductNodes.imageProgressIndicator?.classList.add("printess-hidden");
    }

    ret.getFullVariant(ret.currentVariant).then((variant) => {
      ret.onInitialized(ret.createPluginContext(PrintessShopifySlimUi.convertToPrintessProduct(ret.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant)));
    }).finally(() => {
      ret.addFullEditorButton();
    });

    return ret;
  }

  private static async getBasketItemForSaveToken(saveToken: string): Promise<any> {
    const result = await fetch('/cart.js', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!result || !result.ok) {
      return result;
    }

    const json = await result.json();

    const { items } = json;

    return items.find((item: any) => { return item.properties && item.properties._printessSaveToken ? item.properties && item.properties._printessSaveToken === saveToken : false; });
  }

  private setProductFormPrintessValues(saveToken: string, thumbnailUrl: string, additionalProperties: Record<string, string>) {
    if (this.integrationButton) {
      let saveTokenEdit: HTMLInputElement | null = this.themeProductNodes.productForm.querySelector('input[name="properties\\[_printessSaveToken\\]"]');

      if (!saveTokenEdit) {
        saveTokenEdit = document.createElement("input");
        saveTokenEdit.setAttribute("type", "hidden");
        saveTokenEdit.setAttribute("name", "properties[_printessSaveToken]");

        this.themeProductNodes.productForm.appendChild(saveTokenEdit);
      }

      saveTokenEdit.value = saveToken || "";

      let thumbnailUrlEdit: HTMLInputElement | null = this.themeProductNodes.productForm.querySelector('input[name="properties\\[_printessThumbnail\\]"]');

      if (!thumbnailUrlEdit) {
        thumbnailUrlEdit = document.createElement("input");
        thumbnailUrlEdit.setAttribute("type", "hidden");
        thumbnailUrlEdit.setAttribute("name", "properties[_printessThumbnail]");

        this.themeProductNodes.productForm.appendChild(thumbnailUrlEdit);
      }

      thumbnailUrlEdit.value = thumbnailUrl || "";

      PrintessSharedTools.forEach(additionalProperties, (value: string, index?: number, arr?, key?: string) => {
        let input: HTMLInputElement = this.themeProductNodes.productForm.querySelector(`input[name="properties\\[${key}\\]"]`) as HTMLInputElement;

        if (!input) {
          input = document.createElement("input");
          input.setAttribute("type", "hidden");
          input.setAttribute("data-printess-created", "true");
          input.setAttribute("name", `properties[${key}]`);

          this.themeProductNodes.productForm.appendChild(input);
        }

        input.value = value;
      });
    }
  }

  public static parseJsonHtmlDecode<T>(json: string): T | null {
    try {
      try {
        return JSON.parse(json) as T || null;
      }
      catch {
        var txt = document.createElement("textarea");
        txt.innerHTML = json;
        return JSON.parse(txt.value) as T;
      }
    }
    catch (e) {
      console.error(e);
      return null;
    }
  }

  public async doAllowAddToBasket(product: IPrintessProduct, variant: IPrintessProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string
  }): Promise<boolean> {
    const that = this;
    const context = await this.createPluginContext(product, variant);
    let ret: boolean = true;

    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowAddToBasketAsync === "function") {
          const val = await plugin.doAllowAddToBasketAsync(context, params);

          if (typeof val === "boolean") {
            ret = val;

            if (!ret) {
              break;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public onInitialized(context: IPluginContext): void {
    const that = this;
    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onInitialized === "function") {
          plugin.onInitialized(this, "slimui");
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  private static convertToPrintessProduct(product: IShopifyProduct, price: number): IPrintessProduct {
    const ret: IMixedProduct = {
      ...product,
      price: price,

      getId(): string {
        return ret.id.toString();
      },
      getLabel(): string {
        return ret.title;
      },
      getPrice(): number {
        return ret.price;
      },
      getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[] {
        return ret.mergeTemplates ? ret.mergeTemplates.value || "" : "";
      },
      getSettings(): IPrintessProductSettings {
        return ret.printessSettings && ret.printessSettings.value ? <IPrintessProductSettings>JSON.parse(ret.printessSettings.value) : {};
      },
      getDropshipProductDefinitionId(): number {
        if (ret.productDefinitionId && typeof ret.productDefinitionId.value !== "undefined") {
          const iId = parseInt(ret.productDefinitionId.value);

          if (!isNaN(iId) && isFinite(iId)) {
            return iId;
          }
        }

        return -1;
      },
      getPrintTemplateName(): string {
        if (ret.printTemplateName && ret.printTemplateName.value) {
          return ret.printTemplateName.value;
        }

        return "";
      },
      getTemplateName(): string {
        if (ret.templateName && ret.templateName.value) {
          return ret.templateName.value;
        }

        return "";
      },
      getProductOptions(): { name: string, values: string[] }[] {
        const result: {
          name: string,
          values: string[]
        }[] = [];

        if (ret.productOptions) {
          ret.productOptions.forEach((x) => {
            const entry = {
              name: x.name,
              values: x.optionValues.map((y) => {
                return y.name;
              })
            };

            result.push(entry);
          });
        }

        return result;
      },
      getUrl(variant: IMixedProductVariant | null): string {
        let _ret = `https://${window.location.hostname}/products/${ret.handle}`;

        if (variant) {
          _ret += `?variant=${variant.id}`;
        }

        return _ret;
      },
      getThumbnailUrl(variant: IMixedProductVariant | null): string {
        return variant?.image || ret.featuredImage || "";
      }
    };

    return ret;
  }

  private static convertToPrintessVariant(variant: IShopifyVariant<number> | null): IPrintessProductVariant {
    if (variant) {
      const result: IMixedProductVariant = {
        ...variant,
        getId(): string {
          return result.id.toString();
        },
        getLabel(): string {
          return result.title;
        },
        getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[] {
          return result.mergeTemplates ? result.mergeTemplates.value || "" : "";
        },
        getPrice(): number {
          return result.price?.amount || 0.00;
        },
        getPrintTemplateName(): string {
          if (result.printTemplateName && result.printTemplateName.value) {
            return result.printTemplateName.value || "";
          }

          return "";
        },
        getTemplateName(): string {
          return result.templateName?.value || "";
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
    } else {
      return {
        getId(): string {
          return "";
        },
        getLabel(): string {
          return "";
        },
        getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[] {
          return [];
        },
        getPrice() {
          return 0.0;
        },
        getPrintTemplateName(): string {
          return "";
        },
        getTemplateName(): string {
          return "";
        },
        getVariantOptions(): INameValuePair[] {
          return [];
        },
        getSettings(): IPrintessVariantSettings {
          return {};
        }
      };
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

  private getProductDefinitionIdForBasketItem(): number {
    var strValue = (this.product.productDefinitionId?.value ? this.product.productDefinitionId?.value : "").trim();

    if (strValue) {
      var numberValue = parseInt(strValue);

      if (!isNaN(numberValue) && isFinite(numberValue) && Number.isInteger(numberValue) && numberValue >= 0) {
        return numberValue;
      }
    }

    return -1;
  }

  private async onAddToBasket(saveToken: string, thumbnailUrl: string): Promise<void> {
    const variant = await this.getFullVariant(this.currentVariant);

    try {
      const printessSettings = {
        printTemplateName: variant?.printTemplateName?.value ? variant.printTemplateName.value : (this.product.printTemplateName?.value ? this.product.printTemplateName?.value : ""),
        productDefinitionId: this.getProductDefinitionIdForBasketItem(),
        printessProductType: this.product.productType?.value ? this.product.productType.value : "",
        saveTokenToDelete: this.urlParams.saveToken || undefined,
        originalSaveToken: this.originalSaveToken,
        slimUi: true
      }

      const additionalValues: Record<string, string> = {
        _printessSettings: JSON.stringify(printessSettings)
      };

      const doAdd: boolean = await this.doAllowAddToBasket(PrintessShopifySlimUi.convertToPrintessProduct(this.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant), {
        saveToken: saveToken,
        thumbnailUrl: thumbnailUrl,
        propertyValuesToWrite: additionalValues,
        previousSaveToken: "",
        originalSaveToken: ""
      });

      if (doAdd === true) {
        this.setProductFormPrintessValues(saveToken, thumbnailUrl, additionalValues);

        this.updateVariantInput();

        this.currentSaveToken = saveToken;

        const basketButton = this.integrationButton.printessGetAddToBasketButton();

        if (basketButton) {
          if (typeof this.settings.redirectToCartAfterAddToBasketClick === "undefined" || this.settings.redirectToCartAfterAddToBasketClick === true) {
            PrintessSharedTools.onHookFetch((url: string, init: RequestInit | null, response: Response): "cancel" | "continue" => {
              if (PrintessShopifySlimUi.urlIsCartAdd(url)) {
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
          }

          basketButton.click();
        } else {
          console.error("Printess integration: Can not add new item to basket. Add to basket button not found.");
        }
      }
    }
    catch (e) {
      console.error(e);
    } finally {
      //this._productForm?.querySelector(this._settings.addToBasketButtonSelector)?.classList.remove("printess-hidden");
    }

    return Promise.resolve();
  }

  private readQuantity(defaultValue: number = 1): number {
    const quantityCtrl = this.themeProductNodes.productForm.querySelector<HTMLInputElement | HTMLSelectElement>('input[name="quantity"],select[name="quantity"],input[name="qty"],select[name="qty"]');

    if (quantityCtrl && quantityCtrl.value) {
      const iValue = parseInt(quantityCtrl.value);

      if (!isNaN(iValue) && isFinite(iValue) && iValue) {
        return iValue;
      }
    }

    return defaultValue;
  }

  private async addNewItemToBasket(saveToken: string, valuesToWrite: Record<string, any>, retries: number = 0): Promise<void> {
    const result = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [valuesToWrite]
      })
    });

    if (!result.ok) {
      console.error("Unable to add item to basket: [" + result.status.toString() + "] " + result.statusText);

      if (retries > 4) {
        console.error("Unable to add item to basket giving up (" + saveToken + ")");
      } else {
        await PrintessSharedTools.sleepAsync(250);

        await this.addNewItemToBasket(saveToken, valuesToWrite, retries + 1);
      }
    }
  }

  private async deleteBasketItemBySaveToken(saveToken: string, retries = 0): Promise<void> {
    const basketItem = await PrintessShopifySlimUi.getBasketItemForSaveToken(saveToken);

    if (!basketItem) {
      console.error("Unable to delete item from basket: [" + basketItem.status.toString() + "] " + basketItem.statusText);

      if (retries > 4) {
        console.error("Unable to remove item from basket giving up (" + saveToken + ")");
      } else {
        await PrintessSharedTools.sleepAsync(250);

        await this.deleteBasketItemBySaveToken(saveToken, retries + 1);
      }
    } else {
      await PrintessShopifySlimUi.deleteBasketItemByKey(basketItem.key);
    }
  }

  private static async deleteBasketItemByKey(key: string, retries = 0): Promise<void> {
    const result = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: key,
        quantity: 0
      }),
    });

    if (!result || !result.ok) {
      console.error("!Unable to delete item from basket: [" + result.status.toString() + "] " + result.statusText);

      if (retries > 4) {
        console.error("!Unable to remove item from basket giving up (Basket Item Key: " + key + ")");
      } else {
        await PrintessSharedTools.sleepAsync(250);

        await this.deleteBasketItemByKey(key, retries + 1);
      }
    }
  }

  public async doAllowReplaceBasketItem(product: IPrintessProduct, variant: IPrintessProductVariant, params: {
    quantity: number,
    properties: Record<string, string>
  }): Promise<boolean> {
    const that = this;
    const context = await this.createPluginContext(product, variant);
    let ret: boolean = true;

    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowReplaceBasketItemAsync === "function") {
          const val = await plugin.doAllowReplaceBasketItemAsync(context, params);

          if (typeof val === "boolean") {
            ret = val;

            if (!ret) {
              break;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  private async onReplaceBasketItem(originalBasketItem: any | null, saveToken: string, thumbnailUrl: string): Promise<void> {
    const productOptions = this.getSelectedProductOptions();
    const selectedVariant: IShortVariant | null = await this.getVariantByProductOptions(productOptions, true);
    const variant = selectedVariant ? await this.getFullVariant(selectedVariant) : null;

    if (!originalBasketItem || (typeof originalBasketItem.ok !== "undefined" && !originalBasketItem.ok)) {
      console.error("Could not find basket item for save token " + saveToken);
    }

    let basketItemProperties = { ...originalBasketItem.properties ? originalBasketItem.properties : {} } as Record<string, string>;

    let printessSettings: Record<string, any> = basketItemProperties["printessSettings"] ? PrintessShopifySlimUi.parseJsonHtmlDecode<Record<string, any>>(basketItemProperties["_printessSettings"]) || {} : {};

    printessSettings = {
      ...printessSettings,
      printTemplateName: variant?.printTemplateName?.value ? variant.printTemplateName.value : (this.product.printTemplateName ? this.product.printTemplateName : ""),
      productDefinitionId: this.product.productDefinitionId?.value ? this.product.productDefinitionId?.value : "",
      printessProductType: this.product.productType?.value ? this.product.productType.value : "",
      saveTokenToDelete: this.urlParams.saveToken || undefined,
    }

    if (!printessSettings.originalSaveToken) {
      printessSettings.originalSaveToken = this.originalSaveToken;
    }

    basketItemProperties = {
      ...basketItemProperties,
      _printessSaveToken: saveToken,
      _printessThumbnail: thumbnailUrl,
      _printessSettings: JSON.stringify(printessSettings),
      _printessSlimUi: "true"
    };

    let quantity = this.readQuantity(-1);

    if (quantity < 0) {
      if (this.urlParams && typeof this.urlParams.quantity !== "undefined" && this.urlParams.quantity > 0) {
        quantity = this.urlParams.quantity;
      } else {
        quantity = 1;
      }
    }

    const valuesToWrite = {
      id: selectedVariant ? selectedVariant.id : this.product.id,
      quantity: quantity,
      properties: basketItemProperties
    };

    const allowReplace = await this.doAllowReplaceBasketItem(PrintessShopifySlimUi.convertToPrintessProduct(this.product, variant ? variant.price.amount : 0), PrintessShopifySlimUi.convertToPrintessVariant(variant), {
      quantity: quantity,
      properties: basketItemProperties
    });

    if (allowReplace) {
      await this.addNewItemToBasket(saveToken, valuesToWrite);

      this.currentSaveToken = saveToken;


      if (originalBasketItem) {
        if (originalBasketItem && originalBasketItem.properties && originalBasketItem.properties._printessSaveToken) {
          await this.deleteBasketItemBySaveToken(originalBasketItem.properties._printessSaveToken);
        } else {

        }
      }

      window.location.replace('/cart');
    }
  }

  private static removeUrlParamsInString(url: string, params: Record<string, string>): { url: string, modified: boolean } {
    let ret = url || "";
    let modified = false;

    if (params) {
      for (const proper in params) {
        if (params.hasOwnProperty(proper)) {
          const searchValue = (ret.indexOf("?" + proper) >= 0 ? "?" : "&") + proper + "=" + encodeURIComponent(params[proper]);
          ret = ret.replace(searchValue, "");
        }
      }
    }

    return {
      url: ret,
      modified: ret != url
    }
  }

  setAddToBasketErrorMessage(message: string): void {
    if (this.integrationButton) {
      const addToBasketButton = this.integrationButton.printessGetAddToBasketButton();

      if (!addToBasketButton || !addToBasketButton.parentElement) {
        return;
      }

      let messageElement = addToBasketButton.parentElement.querySelector(".printess-validation-message");

      if (!message) {
        if (messageElement) {
          messageElement.classList.add("printess-hidden");
        }

        return;
      }

      if (!messageElement) {
        messageElement = document.createElement("div");
        messageElement.classList.add("printess-validation-message");
        messageElement.textContent = message;


        if (addToBasketButton) {
          addToBasketButton.after(messageElement);
        }
      } else {
        if (message) {
          messageElement.textContent = message;
          messageElement.classList.remove("printess-hidden");
        } else {
          messageElement.classList.add("printess-hidden");
        }
      }
    }
  }

  private static removeUrlParams(): void {
    const urlParams = new URLSearchParams(window.location.search);

    const replaceResult = PrintessShopifySlimUi.removeUrlParamsInString(window.location.href, {
      "printesssavetoken": urlParams.get("printesssavetoken") || "",
      "basketkey": urlParams.get("basketkey") || "",
      "qty": urlParams.get("qty") || "",
      "pao": urlParams.get("pao") || ""
    });

    if (replaceResult.modified) {
      window.history.replaceState({}, '', replaceResult.url);
    }
  }

  private async onBasketItemClick(): Promise<void> {
    const originalStatus = this.integrationButton.printessGetStatus();

    try {
      this.integrationButton.printessSetStatus("loading");
      this.integrationButton.printessSetCaption(this.settings.captions?.saving || "Saving");

      const result = await this.slimUi!.createSaveToken();

      const currentOptions = this.getSelectedProductOptions();

      if (this.urlParams && this.urlParams.saveToken && this.urlParams.basketKey) {
        //Download basket item
        const basketItem = await PrintessShopifySlimUi.getBasketItemForSaveToken(this.urlParams.saveToken);

        if (!basketItem || (typeof (basketItem as any).ok !== "undefined" && !(basketItem as any).ok)) {
          console.error("Can not find basket item for save token " + this.urlParams.saveToken);
        }

        await this.onReplaceBasketItem(basketItem, result.saveToken, result.thumbnailUrl);
      } else {
        await this.onAddToBasket(result.saveToken, result.thumbnailUrl);
      }

      this.setAddToBasketErrorMessage("");
    } catch (e) {
      let errorMessage: string = "";

      if (Array.isArray(e)) {
        (<[]>e).forEach((x) => {
          errorMessage += typeof (<any>x).errorMessage !== "undefined" ? (<any>x).errorMessage : (x || "") + "; ";
        });
      } else {
        errorMessage = typeof (<any>e).errorMessage !== "undefined" ? (<any>e).errorMessage : (e || "").toString();
      }

      this.integrationButton.printessSetStatus(originalStatus);

      this.setAddToBasketErrorMessage(errorMessage);

      throw e;
    } finally {
      // this.showFormsProgressIndicator(true);
      // this.showImageProgressIndicator(true);
      // PrintessShopifySlimUi.showElement(designNowButton, false);
      PrintessShopifySlimUi.removeUrlParams();
    }
  }

  public setFormFieldValue(formFieldName: string, formFieldValue: string): void {
    this.slimUi.setFormFieldValue(formFieldName, formFieldValue, true);
  }

  public async uploadImageAsync(imgUrl: string, formFieldName: string, dimensionFormFields?: IImageDimensionFormFields): Promise<iExternalImage | null> {
    let fileName: string = "";

    if (!imgUrl) {
      return null;
    }

    let downloadedImage: File | null = null;

    const images = await PrintessSharedTools.downloadImages([imgUrl]);

    if (images && images.length > 0) {
      downloadedImage = images[0].data;
      fileName = images[0].name;
    }

    if (!downloadedImage) {
      return null;
    }

    const dimensions = await PrintessSharedTools.getImageDimensions(downloadedImage);

    const image: iImage = await this.slimUi.importImageFromFile(downloadedImage, formFieldName, undefined, true);

    if (dimensionFormFields) {
      if (dimensionFormFields.widthFormField) {
        this.setFormFieldValue(dimensionFormFields.widthFormField, dimensions.width.toString());
      }

      if (dimensionFormFields.heightFormField) {
        this.setFormFieldValue(dimensionFormFields.heightFormField, dimensions.height.toString());
      }

      if (dimensionFormFields.dimensionsFormField) {
        this.setFormFieldValue(dimensionFormFields.dimensionsFormField, dimensions.width.toString() + "x" + dimensions.height.toString());
      }

      if (dimensionFormFields.fileNameFormField) {
        this.setFormFieldValue(dimensionFormFields.fileNameFormField, fileName);
      }

      if (dimensionFormFields.formatFormField) {
        let format = "";

        if (dimensions.width === dimensions.height) {
          format = "square";
        } else if (dimensions.width > dimensions.height) {
          format = "landscape";
        } else {
          format = "portrait";
        }

        this.setFormFieldValue(dimensionFormFields.formatFormField, format);
      }
    }

    return {
      id: "",
      average: image.average || 0,
      fileHash: image.original?.fileHash || "",
      group: image.originalGroup || "",
      height: image.original?.height || 0,
      inUse: true,
      lastModified: 0,
      name: fileName,
      originalImageUrl: image.original.url || "",
      thumbCssUrl: "",
      thumbUrl: image.scaledVersions && image.scaledVersions.length > 0 ? image.scaledVersions[0].url : "",
      width: image.original.width,
      uploaded: 0,
      useCount: 0,
      photobook: undefined,
      pngImageUrl: ""
    } as iExternalImage;
  }

  public getImageInfoForUrl(url: string): Promise<{ width: number, height: number, imageFormat: TImageFormat, fileName: string } | null> {
    return PrintessSharedTools.getImageInfoForUrl(url) as Promise<{ width: number, height: number, imageFormat: TImageFormat, fileName: string } | null>;
  }

  public getThemeThumbnailNodes(): HTMLImageElement[] {
    return this.themeProductNodes.productThumbnails;
  }

  public getCurrentPreviewImageUrls(): string[] {
    const ret: string[] = [];

    this.currentPreviewImages.forEach((x) => {
      ret.push(x.url);
    });

    return ret;
  }

  public async save(): Promise<{ saveToken: string, thumbnailUrl: string }> {
    const currentStatus = this.integrationButton.printessGetStatus();

    try {
      if (currentStatus != "loading") {
        this.integrationButton.printessSetStatus("loading");
      }

      const result = await this.slimUi!.createSaveToken();

      this.setAddToBasketErrorMessage("");

      return result;
    } catch (e) {
      let errorMessage: string = "";

      if (Array.isArray(e)) {
        (<[]>e).forEach((x) => {
          errorMessage += typeof (<any>x).errorMessage !== "undefined" ? (<any>x).errorMessage : (x || "") + "; ";
        });
      } else {
        errorMessage = typeof (<any>e).errorMessage !== "undefined" ? (<any>e).errorMessage : (e || "").toString();
      }

      this.integrationButton.printessSetStatus(currentStatus);

      this.setAddToBasketErrorMessage(errorMessage);

      throw e;
    } finally {
      this.integrationButton.printessSetStatus("slimui");
    }
  }

  private createPluginContext(product: IPrintessProduct, variant: IPrintessProductVariant | null): IPluginContext {
    const ret: IPluginContext = {
      integration: this,
      product: product,
      type: "editor",
      variant: variant
    };

    return ret;
  }

  public async onThumbnailsChangedAsync(context: IPluginContext, params: {
    thumbnails: string[]
  }): Promise<void> {

    const that = this;
    let ret: boolean = true;

    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onThumbnailsChangedAsync === "function") {
          await plugin.onThumbnailsChangedAsync(context, params);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onProgressIndicatorAsync(context: IPluginContext, params: {
    show: boolean
  }): Promise<void> {
    const that = this;
    let ret: boolean = true;

    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onProgressIndicatorAsync === "function") {
          await plugin.onProgressIndicatorAsync(context, params);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async getPriceInCentAsync(context: IPluginContext, currentPrice: number, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    printedRecordCount?: number
  }): Promise<number> {
    const that = this;
    let ret: number = currentPrice;

    const plugins = this.pluginContainer.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getPriceInCentAsync === "function") {
          const val = await plugin.getPriceInCentAsync(context, ret, params);

          if (typeof val === "number") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  private static createFullEditorButton(integrationButton: HTMLButtonElement, buttonLabel?: string, buttonClasses?: string, integrationUrl?: string): HTMLButtonElement {
    const button = document.createElement("button");

    button.classList.add("printess-editor-button");
    button.classList.add("printess-hidden");
    button.setAttribute("type", "button");

    (buttonClasses || "button btn button--primary").split(" ").forEach((className) => {
      if (className) {
        button.classList.add(className);
      }
    });

    const label = document.createElement("span");
    label.classList.add("label");
    label.innerText = buttonLabel || "Advanced editing";

    button.appendChild(label);

    const createEventListener = (button: HTMLElement): ((event: Event) => void) => {
      return async (evt: Event): Promise<void> => {
        if (evt.target && (<HTMLElement>evt.target).matches(".printess-editor-button") || ((evt.target as HTMLElement).parentElement && (evt.target as HTMLElement).parentElement?.matches(".printess-editor-button"))) {
          evt.stopPropagation();
          evt.preventDefault();

          const parent = <HTMLElement>button.parentElement;

          if (!parent) {
            return;
          }

          const integrationButton = parent.querySelector(".printess-integration-button") as IIntegrationButton | null;

          if (!integrationButton) {
            return;
          }

          const status = integrationButton.printessGetStatus();

          if (status !== "slimui") {
            return;
          }

          integrationButton.printessSetStatus("loading");

          const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace((integrationUrl || "https://editor.printess.com/shopify-panelui/") + "printess-shopify.js");

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

          if (exports && typeof exports["PrintessShopify"] === "undefined" || typeof (<any>exports["PrintessShopify"]).createSaveTokenIntegration === "undefined") {
            return;
          }

          const saveTokenResult = await integrationButton.integration?.save();

          if (saveTokenResult && saveTokenResult.saveToken) {
            await (<any>window)["PrintessShopify"].createSaveTokenIntegration((<any>window)["printessSettings"], integrationButton, saveTokenResult.saveToken, pluginProvider);

            integrationButton.printessSetStatus("slimui");
            button.classList.remove("printess-hidden");
          } else {
            integrationButton.printessSetStatus("slimui");
          }
        }
      }
    };

    button.addEventListener("click", createEventListener(button));

    return button;
  }

  private addFullEditorButton(): void {
    if (typeof PrintessIntegrationLauncher !== undefined) {
      const serializedSettings = this.product.printessSettings ? this.product.printessSettings.value || "" : "";
      const basketButton = this.integrationButton.printessGetAddToBasketButton();
      let deserializedSettings: IPrintessProductSettings = {};

      if (!basketButton) {
        return;
      }

      if (serializedSettings) {
        try {
          deserializedSettings = (JSON.parse(serializedSettings) || {}) as IPrintessProductSettings;
        } catch (e) {
          console.error(e);
        }
      }

      if (this.settings.slimUi && this.settings.slimUi.hasFullEditor === true || deserializedSettings.hasFullEditorButton) {
        let wrapperDiv = this.integrationButton.closest(".printess-integration-button-wrapper");

        if (!wrapperDiv) {
          wrapperDiv = document.createElement("div");
          wrapperDiv.classList.add("printess-integration-button-wrapper");
          basketButton.after(wrapperDiv);
          wrapperDiv.appendChild(this.integrationButton);
        }

        let fullEditorButton = wrapperDiv.querySelector(".printess-editor-button");

        if (!fullEditorButton) {
          fullEditorButton = PrintessShopifySlimUi.createFullEditorButton(this.integrationButton, this.settings.captions?.advancedButtonText, this.settings.advancedButtonClasses, this.settings.integrationUrl);

          if (!fullEditorButton) {
            return;
          }

          wrapperDiv.appendChild(fullEditorButton);
        }

        fullEditorButton.classList.remove("printess-hidden");
      }
    }
  }
}