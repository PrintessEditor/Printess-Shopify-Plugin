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

import { IShopifySettings, IIntegrationButton, IUiSelectors, IUrlParams, ISlimUiMode, IIntegration, IImageDimensionFormFields, TImageFormat, IPluginContainer } from "./printess-shopify.d";
import { IPrintessShopifyGraphQlApi, IProduct as IShopifyProduct, IShortVariant, IVariant as IShopifyVariant } from "./printess-graphql-api.d";
import { PrintessShopifyGraphQlApi } from "./printess-graphql-api.js";
import { PrintessPreloadedProduct } from "./printess-preloaded-product.js";
import { iExternalImage, iExternalImageFrameDimensions, iFormFieldNameValue, iImage, iMergeTemplate, IProduct } from "./printess-editor.d";
import { PrintessSharedTools } from "./printess-shared-tools.js";
import { iSlimPreviewPosition, iSlimState, iSlimUiLoadParams } from "../../../slim-ui/slim/slim-ui.d";
import { INameValuePair, IPlugin, IPluginContext, IPrintessProduct, IPrintessProductSettings, IPrintessProductVariant, IPrintessVariantSettings, TSlimUiFeature, TUiType } from "./printess-plugins.d"

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
  /** The product data rendered into the theme, null if it is not used for this product */
  private preloadedProduct: PrintessPreloadedProduct | null = null;
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
  private slimUiFeatures: TSlimUiFeature[] = [];
  /**
   * `personalizeButton` feature: the configured preview page as it was written - a preview document name or a page
   * position - or null when the product does not configure one. Kept unresolved, as which of the two it is can only
   * be decided once slim-ui has reported the template's preview documents.
   */
  private personalizePage: string | null = null;
  /**
   * `personalizeButton` feature: the page inside the configured preview document, zero based, or null where the
   * product configures none - which is its first page. Only meaningful next to a document name: a page position
   * addresses a single page already, so `getPersonalizePreviewPage()` ignores this there.
   */
  private personalizeDocumentPage: number | null = null;
  /** So a value naming no document and no page of the template is reported once, not on every rendered preview. */
  private personalizePageWarningLogged = false;

  /**
   * Which preview page `initThumbnails()` rendered onto each theme thumbnail, by thumbnail position -
   * the lookup the `thumbnailNavigation` feature needs to turn a click into a `setPreview()` call.
   * Sparse where a thumbnail has no preview page behind it (a product photo the merchant added).
   */
  private previewPagesByThumbnailIndex: Array<iSlimPreviewPosition> = [];

  /**
   * The thumbnail slot slim-ui's current page belongs on, as last set from here. Only read on editor builds
   * without `getPreview()`, which is the authority wherever it exists - see `getCurrentPreviewThumbnailIndex()`.
   */
  private currentPreviewThumbnailIndex = 0;
  private pageNavigationContainer: HTMLDivElement | null = null;

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
        ret.cssProductFormSelector = ret.cssProductFormSelector || 'form[action$="/cart/add"]';
        ret.cssVariantSwitchSelector = ret.cssVariantSwitchSelector || "[data-dynamic-variants-enabled]";
        ret.cssPriceTextSelector = ret.cssPriceTextSelector || ".product__price";
        ret.cssQuantityInputSelector = ret.cssQuantityInputSelector || '[name="quantity"],[name="qty"]';

        break;
      }
    }

    ret.cssProductContainerSelector = ret.cssProductContainerSelector || 'product-info .product';
    ret.cssProductInfoSelector = ret.cssProductInfoSelector || '.product__info-wrapper > .product__info-container';
    ret.cssProductFormSelector = ret.cssProductFormSelector || 'form[data-type="add-to-cart-form"],form[action$="/cart/add"][id^="product-form-template"],form.shopify-product-form[id^=product-form-template],form.product-single__form';
    ret.cssVariantSwitchSelector = ret.cssVariantSwitchSelector || 'variant-selects,variant-picker,.selector-wrapper,variant-radios,.product-form__controls-group,variant-picker__form,variant-selects';
    ret.cssProductMediaSelector = ret.cssProductMediaSelector || "media-gallery,.product-single__media-wrapper,.product__media";
    ret.cssImageSelector = ret.cssImageSelector || "slider-component ul li .product__media img,slider-component ul li .product__media img";
    ret.cssProgressIndicatorSelector = ret.cssProgressIndicatorSelector || "slider-component ul li .loading-overlay__spinner,slider-component ul li .loading__spinner";
    ret.cssPriceTextSelector = ret.cssPriceTextSelector || ".price__regular>span.price-item.price-item--regular";
    ret.cssQuantityInputSelector = ret.cssQuantityInputSelector || '[name="quantity"],[name="qty"]';
    ret.cssProductThumbnailImageSelector = ret.cssProductThumbnailImageSelector || "slider-component ul li .product__media img,slider-component ul";
    ret.cssProductThumbnailNavigationSelector = ret.cssProductThumbnailNavigationSelector || "slider-component.thumbnail-slider,.thumbnail-list,.product-single__thumbnails";
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

  private static parseSlimUiFeatures(productSettings: IPrintessProductSettings | null | undefined): TSlimUiFeature[] {
    const features = productSettings?.slimUiFeatures;

    if (!features) {
      return [];
    }

    return Array.isArray(features) ? features : [features];
  }

  private hasSlimUiFeature(feature: TSlimUiFeature): boolean {
    return this.slimUiFeatures.indexOf(feature) >= 0;
  }

  /**
   * The layout snippet search tags slim-ui is started with, read leniently as the metafield is written by hand as
   * well as by the account portal: a list of tags or a comma separated string. Null when there are none, as slim-ui
   * takes even an empty list over the template's own tags.
   */
  private static parseLayoutSnippetSearchTags(productSettings: IPrintessProductSettings | null | undefined): string[] | null {
    const value = productSettings?.layoutSnippetSearchTags;

    if (typeof value === "undefined" || value === null) {
      return null;
    }

    const entries = Array.isArray(value) ? value : ("" + value).split(",");
    const tags: string[] = [];

    for (const entry of entries) {
      const tag = typeof entry === "string" ? entry.trim() : "";

      if (tag && tags.indexOf(tag) < 0) {
        tags.push(tag);
      }
    }

    return tags.length > 0 ? tags : null;
  }

  /**
   * The preview page the `personalizeButton` feature jumps to, as written. Read leniently, as the metafield is
   * written by hand as well as by the account portal, so the value can arrive as a number or as a string. It is
   * deliberately not interpreted here: a document name can only be recognized against a loaded template, so
   * anything non empty is carried through and `getPersonalizePreviewPage()` decides what it names.
   */
  private static parsePersonalizePage(productSettings: IPrintessProductSettings | null | undefined): string | null {
    //Cast, as a hand written metafield can carry a document name although the setting is typed as a number.
    const value = productSettings?.slimUiPersonalizePageIndex as number | string | null | undefined;

    if (typeof value === "undefined" || value === null) {
      return null;
    }

    const text = ("" + value).trim();

    return text === "" ? null : text;
  }

  /**
   * The page inside the configured preview document, as written. Read leniently like `parsePersonalizePage()`, and
   * anything that is not a page number is dropped rather than reported: the setting is optional, so falling back to
   * the document's first page is the same as leaving it empty, while a document that has no such page is reported
   * by `ensurePersonalizeButton()`.
   */
  private static parsePersonalizeDocumentPage(productSettings: IPrintessProductSettings | null | undefined): number | null {
    //Cast, as a hand written metafield can carry the page as a string although the setting is typed as a number.
    const value = productSettings?.slimUiPersonalizeDocumentPageIndex as number | string | null | undefined;

    if (typeof value === "undefined" || value === null) {
      return null;
    }

    const text = ("" + value).trim();

    if (text === "") {
      return null;
    }

    const index = parseInt(text, 10);

    return isNaN(index) || !isFinite(index) || index < 0 ? null : index;
  }

  /**
   * Resolves the configured value to the preview document and page `setPreview()` takes. A preview document of that
   * name is looked for first and wins, so a template whose documents happen to be named "1" and "2" stays
   * addressable by name; only a value no document carries is read as a page position. Returns null when it names
   * neither, which is what keeps the button off a template it cannot navigate.
   *
   * The page inside a named document comes from `personalizeDocumentPage`. A page position needs none, as it counts
   * across the documents and so addresses one page on its own.
   */
  private getPersonalizePreviewPage(): iSlimPreviewPosition | null {
    const value = this.personalizePage;

    if (value === null) {
      return null;
    }

    const previews = this.slimUi && this.slimUi.previews && this.slimUi.previews.length > 0 ? this.slimUi.previews : null;
    const namedPreviewIndex = PrintessShopifySlimUi.findPreviewByDocumentName(previews, value);

    if (previews && namedPreviewIndex >= 0) {
      //`docName` names the whole document and the pages in it carry no name of their own, so which page of it the
      //personalization sits on is configured separately - and without that it is the first page, as it always was.
      const pageIndex = this.personalizeDocumentPage === null ? 0 : this.personalizeDocumentPage;

      //A page the document does not have cannot be switched to, so the button stays off instead of jumping to a
      //page nobody configured. Reported below, as a page miscounted by one looks exactly like a name not found.
      return pageIndex < previews[namedPreviewIndex].pageCount ? { previewIndex: namedPreviewIndex, pageIndex: pageIndex } : null;
    }

    //No document of that name, so the value is meant as a page position - the only thing accepted before names were.
    const index = parseInt(value, 10);

    if (isNaN(index) || !isFinite(index) || index < 0) {
      return null;
    }

    return PrintessShopifySlimUi.resolvePreviewPagePosition(previews, index);
  }

  /**
   * The index of the preview document carrying a name, or -1. Compared trimmed and case insensitively: the name is
   * typed by hand into the metafield and was typed by hand into the template, so a difference in case or padding is
   * an accident rather than an intent to name something else.
   */
  private static findPreviewByDocumentName(previews: iSlimState["previews"] | null, name: string): number {
    const wanted = name.trim().toLowerCase();

    if (!previews || wanted === "") {
      return -1;
    }

    for (let previewIndex = 0; previewIndex < previews.length; ++previewIndex) {
      const docName = previews[previewIndex].docName;

      if (typeof docName === "string" && docName.trim().toLowerCase() === wanted) {
        return previewIndex;
      }
    }

    return -1;
  }

  /**
   * Resolves a page position to the preview document and page `setPreview()` takes. The position counts across every
   * preview document, in the same order `initThumbnails()` assigns pages to the theme thumbnails, so a merchant can
   * count it off the thumbnail strip. Unlike the thumbnails it is not capped by `maxProductThumbnails`, which keeps
   * a page reachable that has no thumbnail of its own. It also counts the documents a document condition currently
   * hides, which the thumbnails leave out: that keeps a setting on the same page whatever the form-field values are,
   * and `ensurePersonalizeButton()` hides the button while that page is hidden.
   */
  private static resolvePreviewPagePosition(previews: iSlimState["previews"] | null, index: number): iSlimPreviewPosition | null {
    if (!previews) {
      //A template without preview documents has the single page slim-ui renders, so only index 0 exists.
      return index === 0 ? { previewIndex: 0, pageIndex: 0 } : null;
    }

    let position = 0;

    for (let previewIndex = 0; previewIndex < previews.length; ++previewIndex) {
      //Taken as it is, so a document without pages is skipped here exactly as `initThumbnails()` skips it.
      const pageCount = previews[previewIndex].pageCount;

      if (index < position + pageCount) {
        return { previewIndex: previewIndex, pageIndex: index - position };
      }

      position += pageCount;
    }

    return null;
  }

  /**
   * True while slim-ui already shows the page the Personalize button jumps to, which is when the button has
   * nothing left to do. Needs `getPreview()`: without it the current page cannot be read back, and a button that
   * stays visible is the better of the two wrong answers, as it still switches to the right page when clicked.
   */
  private isOnPersonalizePreviewPage(page: iSlimPreviewPosition): boolean {
    if (typeof this.slimUi?.getPreview !== "function") {
      return false;
    }

    const current = this.slimUi.getPreview();

    return current.previewIndex === page.previewIndex && current.pageIndex === page.pageIndex;
  }

  /**
   * `personalizeButton` feature: adds a button directly in front of the slim-ui add to basket button that switches
   * the preview over to the page the personalization sits on - the inside of a card, the back of a shirt - so the
   * shopper sees what they are filling in, and with per-preview property clusters gets that page's properties.
   *
   * Nothing is rendered when the page cannot be reached: an index pointing past the template's pages, or an editor
   * build without `setPreview()`. A button that visibly does nothing is worse than no button at all.
   *
   * Re-runs on every rendered preview, which is both what keeps the button hidden while its own page is the one
   * on screen, and what puts it back after a theme rerendered its product form on a variant change. The existing
   * node is reused, so this does not stack up buttons.
   */
  private ensurePersonalizeButton(): void {
    if (!this.hasSlimUiFeature("personalizeButton")) {
      return;
    }

    if (typeof this.slimUi?.setPreview !== "function") {
      return;
    }

    const page = this.getPersonalizePreviewPage();

    if (!page) {
      if (!this.personalizePageWarningLogged) {
        this.personalizePageWarningLogged = true;

        //Both settings, as a document that exists but has no such page fails on the page alone.
        const configured = "\"" + this.personalizePage + "\""
          + (this.personalizeDocumentPage === null ? "" : ", page " + this.personalizeDocumentPage);

        console.warn("Printess Integration: The Personalize button is switched on, but slimUiPersonalizePageIndex (" + configured + ") names neither a page of a preview document nor a page position of this template.");
      }

      return;
    }

    const addToBasketButton = this.integrationButton.printessGetAddToBasketButton();

    if (!addToBasketButton || !addToBasketButton.parentElement) {
      return;
    }

    let button = addToBasketButton.parentElement.querySelector<HTMLButtonElement>(".printess-personalize-button");

    if (!button) {
      button = document.createElement("button");

      button.classList.add("printess-personalize-button");
      button.setAttribute("type", "button");

      (this.settings.slimUi.buttonClasses || "button btn button--primary").split(" ").forEach((className) => {
        if (className) {
          button!.classList.add(className);
        }
      });

      button.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        this.onPersonalizeClick();
      });

      addToBasketButton.parentElement.insertBefore(button, addToBasketButton);
    }

    button.innerText = this.settings.captions?.personalize || "Personalize";

    //Steps out of the way once the shopper is on that page, a click would only repaint the page already shown, and
    //while its document condition hides that page, as `setPreview()` ignores a hidden preview.
    PrintessShopifySlimUi.showOrHideElement(button, this.isPersonalizePreviewPageVisible(page) && !this.isOnPersonalizePreviewPage(page));
  }

  /** False while the document condition of the preview the Personalize button jumps to does not hold. */
  private isPersonalizePreviewPageVisible(page: iSlimPreviewPosition): boolean {
    const previews = this.slimUi?.previews;

    //A template without preview documents has the single page slim-ui renders, which is always shown.
    if (!previews || previews.length === 0) {
      return true;
    }

    return PrintessShopifySlimUi.isPreviewVisible(previews[page.previewIndex]);
  }

  private onPersonalizeClick(): void {
    const page = this.getPersonalizePreviewPage();

    if (page) {
      this.applyPreviewPage(page);
    }
  }

  /**
   * The page navigation replaces the theme thumbnails, so every product image besides the main one
   * (which stays the slim-ui preview image) and the theme thumbnail strip are hidden. `initThumbnails()`
   * stops rendering them as well, as nobody would see them.
   */
  private hideThemeProductThumbnails(): void {
    const thumbnails = this.themeProductNodes.productThumbnails;

    for (let i = 1; i < thumbnails.length; ++i) {
      PrintessShopifySlimUi.showOrHideElement(thumbnails[i].closest<HTMLElement>("li") || thumbnails[i], false);
    }

    const navigationSelector = this.settings.uiSelectors?.cssProductThumbnailNavigationSelector;

    if (navigationSelector) {
      this.themeProductNodes.productContainer.querySelectorAll<HTMLElement>(navigationSelector).forEach((x) => {
        PrintessShopifySlimUi.showOrHideElement(x, false);
      });
    }
  }

  /**
   * In page-navigation mode a single image slot has to show portrait covers and landscape inside
   * pages alike. Theme CSS usually forces one aspect (object-fit: cover), so instead of handing
   * slim-ui the theme's own <img> - which it swaps the src of directly on every page change - the
   * original is hidden in place (kept in the layout so the slot keeps its theme-driven size) and a
   * same-sized overlay image with object-fit: contain is created to receive the preview instead,
   * so every orientation is always fully shown, never cropped.
   */
  private createFittedPreviewImage(originalImage: HTMLImageElement): HTMLImageElement {
    const parent = originalImage.parentElement;

    if (!parent) {
      return originalImage;
    }

    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }

    originalImage.classList.add("printess-preview-source-hidden");

    const fittedImage = document.createElement("img");
    fittedImage.classList.add("printess-fitted-preview-image");

    parent.insertBefore(fittedImage, originalImage.nextSibling);

    return fittedImage;
  }

  /** Creates the full width container slim-ui renders its page navigation into, above the main product image. */
  private getOrCreatePageNavigationContainer(): HTMLDivElement {
    const mediaNode = this.themeProductNodes.productContainer.querySelector(this.settings.uiSelectors!.cssProductMediaSelector!);

    if (!mediaNode) {
      throw "Printess Integration: Media container not found.";
    }

    const existing = mediaNode.querySelector<HTMLDivElement>(".printess-page-navigation");

    if (existing) {
      return existing;
    }

    const container = document.createElement("div");
    container.classList.add("page-navigation", "printess-page-navigation");

    mediaNode.insertBefore(container, mediaNode.firstChild);

    return container;
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

    //Translated storefront: the theme uses the localized option names
    if (this.product.productOptions && optionPosition < 1 && _name) {
      const index = this.product.productOptions.findIndex((x) => x.localizedName === _name);

      if (index >= 0) {
        optionPosition = index + 1;
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
    }

    const preloadedVariant = this.preloadedProduct ? this.preloadedProduct.getVariant(variant.id) : null;

    if (preloadedVariant) {
      PrintessShopifySlimUi.fullVariantCache[variant.id] = preloadedVariant;

      return preloadedVariant;
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
    // Runs before the `pageNavigation` exit below, as that feature renders previews as well and the button has to
    // follow the page shown there too. Reads nothing this method writes, so the position here costs nothing.
    this.ensurePersonalizeButton();

    if (this.hasSlimUiFeature("pageNavigation")) {
      // the thumbnails are hidden and slim-ui renders the page navigation itself, so requesting a
      // preview render per page here would only cost render time nobody gets to see
      return currentImageUrl ? [{ url: currentImageUrl, imageFrameDimensions: {} }] : [];
    }

    const secondThumbnails = this.getThemeLargeProductThumbnails(this.themeProductNodes.productContainer);
    const ret: { url: string, imageFrameDimensions: Record<string, iExternalImageFrameDimensions> }[] = [];

    //Get Previews
    let currentThumbnailIndex = 0;
    let maxProductThumbnails = 3;

    if (typeof this.settings.slimUi.maxProductThumbnails === "number" && this.settings.slimUi.maxProductThumbnails > 0) {
      maxProductThumbnails = this.settings.slimUi.maxProductThumbnails;
    }

    let previews = this.slimUi!.previews;
    const previewPages: Array<{ previewIndex: number, pageIndex: number }> = [];

    if (!previews || previews.length === 0) {
      previews = [{ pageCount: 1, docName: "", facingPages: false, visible: true }];
    }

    if (previews) {
      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];

        // Its document condition does not hold for the current form-field values. Skipped before rendering it, so
        // the visible pages fill the slots from the first one on - slot 0 being the main image slim-ui renders to.
        if (!PrintessShopifySlimUi.isPreviewVisible(preview)) {
          continue;
        }

        for (let j = 0; j < preview.pageCount && j <= maxProductThumbnails; j++) {//1: Skip first image as this is the default display image that is already displayed
          const thumbnailInfo = await this.slimUi!.getPreviewImageInfo(i, j);

          if (this.themeProductNodes.productThumbnails.length > currentThumbnailIndex) {
            PrintessShopifySlimUi.setThumbnailSlotImage(this.themeProductNodes.productThumbnails[currentThumbnailIndex], thumbnailInfo.url);

            previewPages[currentThumbnailIndex] = { previewIndex: i, pageIndex: j };
            ret.push(thumbnailInfo);

            if (secondThumbnails != null && secondThumbnails.length > currentThumbnailIndex) {
              PrintessShopifySlimUi.setThumbnailSlotImage(secondThumbnails[currentThumbnailIndex], thumbnailInfo.url);
            }
          }

          currentThumbnailIndex++;
        }
      }
    }

    // A slot past the visible pages may still show the render of a page that has been hidden since, so it gets its
    // merchant photo back. Slot 0 is left alone, it is the image slim-ui renders the current page to.
    for (let i = Math.max(1, currentThumbnailIndex); i < this.themeProductNodes.productThumbnails.length; ++i) {
      PrintessShopifySlimUi.restoreThumbnailSlotImage(this.themeProductNodes.productThumbnails[i]);
    }

    if (secondThumbnails != null) {
      for (let i = Math.max(1, currentThumbnailIndex); i < secondThumbnails.length; ++i) {
        PrintessShopifySlimUi.restoreThumbnailSlotImage(secondThumbnails[i]);
      }
    }

    this.previewPagesByThumbnailIndex = previewPages;

    // `currentImageUrl` is the page slim-ui has just rendered, which belongs on the slot showing that page -
    // thumbnail 0 only while nothing has moved the current page (see `getCurrentPreviewThumbnailIndex()`).
    // Writing it to 0 unconditionally would paint the current page over page 1 as soon as the shopper has
    // switched pages at all.
    const currentThumbnailSlot = this.getCurrentPreviewThumbnailIndex();

    if (currentImageUrl && secondThumbnails != null && secondThumbnails.length > currentThumbnailSlot) {
      PrintessShopifySlimUi.setThumbnailSlotImage(secondThumbnails[currentThumbnailSlot], currentImageUrl);
    }

    // Re-run on every refresh: a variant change has the theme replace its own media markup, taking
    // any listener bound to the old nodes with it. Marked per container, so this does not stack.
    this.registerThumbnailNavigation();

    return ret;
  }

  /**
   * False while the document condition of a preview does not hold for the current form-field values. Editor builds
   * from before document conditions do not send the flag, and every preview of theirs is shown.
   */
  private static isPreviewVisible(preview: iSlimState["previews"][number] | null | undefined): boolean {
    return !!preview && preview.visible !== false;
  }

  /**
   * Writes a rendered page onto a theme image, remembering the merchant photo it showed before on the first write,
   * so `restoreThumbnailSlotImage()` can put it back once no visible page is left for that slot.
   */
  private static setThumbnailSlotImage(image: HTMLImageElement, url: string): void {
    if (typeof image.dataset.printessOriginalSrc === "undefined") {
      image.dataset.printessOriginalSrc = image.getAttribute("src") || "";
      image.dataset.printessOriginalSrcset = image.getAttribute("srcset") || "";
    }

    image.src = url;

    if (typeof image.srcset !== "undefined" && image.srcset) {
      image.srcset = url;
    }
  }

  /** Puts the merchant photo back onto a theme image `setThumbnailSlotImage()` has written to, does nothing otherwise. */
  private static restoreThumbnailSlotImage(image: HTMLImageElement): void {
    const originalSrc = image.dataset.printessOriginalSrc;

    if (typeof originalSrc === "undefined" || image.getAttribute("src") === originalSrc) {
      return;
    }

    if (image.dataset.printessOriginalSrcset) {
      image.srcset = image.dataset.printessOriginalSrcset;
    }

    image.src = originalSrc;
  }

  /** The thumbnail slot a preview page was rendered onto, or -1 when no thumbnail shows that page. */
  private findThumbnailIndexOfPreviewPage(page: iSlimPreviewPosition): number {
    return this.previewPagesByThumbnailIndex.findIndex((x) => {
      return x && x.previewIndex === page.previewIndex && x.pageIndex === page.pageIndex;
    });
  }

  /**
   * The thumbnail slot the page slim-ui currently shows belongs on. `getPreview()` is the authority, so a page
   * slim-ui moved to on its own - its own page navigation, or a template that does not open on its first page -
   * counts as well. It only reaches shops once the editor domain serves a build that has it, so the position this
   * integration last set itself stays the fallback, exactly as `setPreview()` is feature detected.
   */
  private getCurrentPreviewThumbnailIndex(): number {
    if (typeof this.slimUi?.getPreview === "function") {
      const index = this.findThumbnailIndexOfPreviewPage(this.slimUi.getPreview());

      if (index >= 0) {
        return index;
      }
    }

    return this.currentPreviewThumbnailIndex;
  }

  /**
   * Switches slim-ui over to a preview page and remembers the thumbnail slot it belongs on, so the next render
   * lands on that slot instead of on the one the shopper was looking at before. `thumbnailIndex` is passed in
   * where the caller already knows it, which is the thumbnail the shopper clicked.
   */
  private applyPreviewPage(page: iSlimPreviewPosition, thumbnailIndex?: number): void {
    if (typeof this.slimUi?.setPreview !== "function") {
      return;
    }

    const index = typeof thumbnailIndex === "number" ? thumbnailIndex : this.findThumbnailIndexOfPreviewPage(page);

    if (index >= 0) {
      this.currentPreviewThumbnailIndex = index;
    }

    this.slimUi.setPreview(page.previewIndex, page.pageIndex);

    //`getPreview()` is up to date from here on, so the button state does not have to wait for the render.
    this.ensurePersonalizeButton();
  }

  /**
   * `thumbnailNavigation` feature: lets the theme's own thumbnail strip drive slim-ui's current
   * preview page, so clicking the thumbnail showing page 2 tells slim-ui the shopper is looking at
   * page 2 - a template saved with "Properties Per Preview Document" then shows that page's
   * properties, and every following render lands on that thumbnail instead of on the first one.
   *
   * Deliberately opt-in per product: on shops already running slim-ui those thumbnails switch nothing
   * but the theme's own image, and silently giving them a second effect would change behaviour under
   * live products. Skipped under `pageNavigation`, which hides this strip and renders its own.
   */
  private registerThumbnailNavigation(): void {
    if (!this.hasSlimUiFeature("thumbnailNavigation") || this.hasSlimUiFeature("pageNavigation")) {
      return;
    }

    const selector = this.settings.uiSelectors?.cssProductThumbnailNavigationSelector;

    if (!selector) {
      return;
    }

    this.themeProductNodes.productContainer.querySelectorAll<HTMLElement>(selector).forEach((container) => {
      if (container.dataset.printessThumbnailNavigation === "true") {
        return;
      }

      container.dataset.printessThumbnailNavigation = "true";
      container.addEventListener("click", (event) => this.onThumbnailNavigationClick(container, event));
    });
  }

  /**
   * Resolves the clicked thumbnail to its position among the container's thumbnail images, which is
   * the same "by position" mapping `initThumbnails()` uses to assign preview pages to thumbnails.
   * Themes wrap each thumbnail in a button/link/list item, so the click is matched against every
   * thumbnail's nearest clickable ancestor rather than against the <img> itself.
   *
   * `setPreview()` is feature-detected: it is absent from older editor builds, and a thumbnail click
   * doing nothing extra is a far better outcome than a TypeError inside a theme's click handler.
   */
  private onThumbnailNavigationClick(container: HTMLElement, event: Event): void {
    if (typeof this.slimUi?.setPreview !== "function") {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (!target) {
      return;
    }

    const thumbnails = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
    const index = thumbnails.findIndex((thumbnail) => {
      const clickable = thumbnail.closest("li, button, a, [role=button]") ?? thumbnail;

      return clickable.contains(target);
    });

    if (index < 0) {
      return;
    }

    const page = this.previewPagesByThumbnailIndex[index];

    if (!page) {
      // A product photo the merchant added themselves, with no preview page rendered onto it -
      // slim-ui stays on the page it is on rather than repainting it onto that photo's slot.
      return;
    }

    this.applyPreviewPage(page, index);
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
    ret.preloadedProduct = PrintessPreloadedProduct.fromSettings(settings, integrationButton.product!.id);

    //Show image progress indicator
    PrintessShopifySlimUi.showOrHideElement(ret.themeProductNodes.imageProgressIndicator, true);

    ret.productVariants = ret.preloadedProduct ? ret.preloadedProduct.getShortVariants() : await graphQl.getProductVariants(integrationButton.product!.id);
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

    let productSettings: IPrintessProductSettings | undefined | null;

    if (ret.product && ret.product.printessSettings && ret.product.printessSettings.value) {
      try {
        productSettings = <IPrintessProductSettings>JSON.parse(ret.product.printessSettings.value);
      } catch (e) {
        console.error("Printess Integration: Unable to deserialize product settings: " + JSON.stringify(e));
      }
    }

    ret.slimUiFeatures = PrintessShopifySlimUi.parseSlimUiFeatures(productSettings);
    ret.personalizePage = PrintessShopifySlimUi.parsePersonalizePage(productSettings);
    ret.personalizeDocumentPage = PrintessShopifySlimUi.parsePersonalizeDocumentPage(productSettings);

    if (ret.hasSlimUiFeature("pageNavigation")) {
      ret.hideThemeProductThumbnails();
      ret.pageNavigationContainer = ret.getOrCreatePageNavigationContainer();
    }

    let editorTheme = "DEFAULT";

    if (ret.product?.theme?.value) {
      editorTheme = ret.product.theme.value;
    } else if (productSettings?.theme) {
      editorTheme = productSettings.theme;
    } else if (ret.settings?.printessThemeName) {
      editorTheme = ret.settings?.printessThemeName;
    }

    const createParams: iSlimUiLoadParams = {
      disableProductImageUploadOnStartup: settings.slimUi.doNotUpdateThumbnailOnLoad === true,
      uiContainer: ret.themeProductNodes.slimUiContainer as HTMLDivElement,
      previewImage: ret.themeProductNodes.productThumbnails.length > 0
        ? (ret.hasSlimUiFeature("pageNavigation")
          ? ret.createFittedPreviewImage(ret.themeProductNodes.productThumbnails[0])
          : ret.themeProductNodes.productThumbnails[0])
        : document.createElement("img"),
      pageNavigation: ret.pageNavigationContainer ?? undefined,
      loader: ret.themeProductNodes.imageProgressIndicator,
      shopToken: ret.settings.shopToken,
      templateName: templateName,
      published: true,
      formFields: formFields || [],
      apiDomain: ret.settings.apiDomain || "api.printess.com",
      //mergeTemplates: mergeTemplates,
      theme: editorTheme,
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
                  for (let i = 0; i < productThumbnails.length; ++i) {
                    if (typeof productThumbnails[i].src === "undefined") {
                      continue;
                    }

                    if (i < thumbnails.length) {
                      PrintessShopifySlimUi.setThumbnailSlotImage(productThumbnails[i], thumbnails[i].url);
                    } else {
                      //Showed a page that is hidden by its document condition now
                      PrintessShopifySlimUi.restoreThumbnailSlotImage(productThumbnails[i]);
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

    // Never merged onto a save token: in cartedit/reorder mode `templateName` IS the item's save
    // token, i.e. a finished design the customer already personalized, and a merge replaces exactly
    // the layout-origin properties they filled in with the merge template's defaults - silently
    // discarding their work. Only a real template name gets merged into.
    let mergeTemplate = "";
    if (productSettings && productSettings.slimUiMerge1 && !templateName.startsWith("st:")) {
      mergeTemplate = productSettings.slimUiMerge1;

      if (mergeTemplate === "mergeTemplate" && ret.product && ret.product.mergeTemplates) {
        if (Array.isArray(ret.product.mergeTemplates) && ret.product.mergeTemplates.length > 0 && ret.product.mergeTemplates[0].value) {
          mergeTemplate = ret.product.mergeTemplates[0].value;
        } else if (ret.product.mergeTemplates.value) {
          mergeTemplate = ret.product.mergeTemplates.value;
        }
      } else if (mergeTemplate === "shopifyHandle") {
        mergeTemplate = ret.product.handle;
      }

      (createParams as any).merge1 = mergeTemplate;
    }

    //Todo:Neeads to be removed later
    (createParams as any).previewContainer = document.createElement("div");


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

    const layoutSnippetSearchTags = PrintessShopifySlimUi.parseLayoutSnippetSearchTags(productSettings);

    if (layoutSnippetSearchTags) {
      createParams.layoutSnippetSearchTags = layoutSnippetSearchTags;
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

    //Needs the live slim ui, the button is only shown for a page the template really has.
    ret.ensurePersonalizeButton();

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
    const result = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart.js"), {
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
        const settings: IPrintessProductSettings = ret.printessSettings && ret.printessSettings.value ? <IPrintessProductSettings>JSON.parse(ret.printessSettings.value) || {} : {};

        //Fall back to the printess.productType meta field in case the settings do not contain a product type
        if (!settings.productType && ret.productType?.value) {
          settings.productType = ret.productType.value;
        }

        return settings;
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

      if (this.settings.cartItemPropertyName && this.settings.cartItemPropertyValue) {
        additionalValues[this.settings.cartItemPropertyName] = this.settings.cartItemPropertyValue;
      }

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
    const result = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart/add"), {
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
    const result = await fetch(PrintessSharedTools.getShopifyRouteUrl("cart/change.js"), {
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

    let printessSettings: Record<string, any> = basketItemProperties["_printessSettings"] ? PrintessShopifySlimUi.parseJsonHtmlDecode<Record<string, any>>(basketItemProperties["_printessSettings"]) || {} : {};

    printessSettings = {
      ...printessSettings,
      printTemplateName: variant?.printTemplateName?.value ? variant.printTemplateName.value : (this.product.printTemplateName?.value ? this.product.printTemplateName?.value : ""),
      productDefinitionId: this.getProductDefinitionIdForBasketItem(),
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

      window.location.replace(PrintessSharedTools.getShopifyCartUrl());
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
      type: "slim",
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