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

import { IPrintessShopifyGraphQlApi, IProduct as IShopifyProduct, IVariant as IShopifyVariant } from "./printess-graphql-api.d";
import { iExternalImageFrameDimensions, iImage, iFormFieldProperty, IShopData, iFormFieldNameValue, iMergeTemplate } from "./printess-editor.d"
import { INameValuePair, IPlugin, IPriceInformation, IPrintessProductVariant, IPrintessProduct as IProduct } from "./printess-plugins.d"

declare global {
  function registerPrintessPlugin(plugin: IPlugin): void;
}

export interface IUiSelectors {
  cssProductContainerSelector?: string; // used in slim and panel
  cssCartItemSelector?: string; // used in slim & panel
  cssAddToBasketButtonSelector?: string; // used in slim & panel
  cssProductInfoSelector?: string; // usedls in slim, must be child of cssProductContainerSelector
  cssProductMediaSelector: string;
  cssImageSelector?: string;
  cssPriceTextSelector?: string;
  cssProductFormSelector?: string;
  cssProgressIndicatorSelector?: string;
  cssVariantSwitchSelector?: string;
  cssQuantityInputSelector?: string;
  cssProductThumbnailImageSelector?: string;
  cssProductThumbnailNavigationSelector?: string; // theme thumbnail strip, hidden when the slimUi "pageNavigation" feature is active
  cssProductLargePreviewImagesSelector?: string;
  cssCartItemLinkSelector?: string;
  cssCartItemImageSelector?: string;
  cssCartItemQuantitySelector?: string;
  cssProductIdSelector?: string;
  cssCartItemListSelector?: string;
}

export interface IButtonCaptions {
  addToBasket?: string;
  designNow?: string;
  saveBasketItem?: string;
  saving?: string;
  cancel?: string;
  loadingButtonText?: string;
  cartEditButton?: string;
  advancedButtonText?: string;
  /** Slim UI only, `personalizeButton` feature: caption of the button that jumps to the personalized preview page. */
  personalize?: string;
}

export interface IShopSettings {
  shopToken: string;
  apiDomain?: string;
  editorDomain?: string;
  editorVersion?: string;
  attachParams: Record<string, any>;
  printessThemeName?: string;
  customerId?: string;
  customerIsLoggedIn?: boolean;
  supportsSaving?: boolean;
}

export interface IShopifyShopLevelSettings {
  editorTheme?: string | null
  useAdditionalPricing?: boolean
}

export interface IShopifyProductWithVariants extends IShopifyProduct {
  variants: IShopifyVariant<number>[]
  options: string[]
  optionDetails: { name: string, value: string, position: number, values: { name: string, value: string, id: number }[] }[]
}

export interface IShopifySettings extends IShopSettings {
  graphQlToken: string;
  graphQlLanguage?: string;
  ignoreDataOptionIndex?: boolean;
  uiSelectors?: IUiSelectors;
  captions?: IButtonCaptions;
  useVariantIdField?: boolean;
  priceFormat: string;
  importProductOptionsFromVariantId?: boolean;
  hidePricesInEditor?: boolean;
  displayProductName?: boolean;
  translationKey?: string;
  editorUrlParams?: Record<string, any>;
  integrationButtonClasses?: string;
  addDirectToCartButtonClasses?: string;
  cartButtonClasses?: string;
  advancedButtonClasses?: string;
  integrationUrl?: string;
  additionalProductMetaFields?: string[];
  additionalVariantMetaFields?: string[];
  internalShopDomain: string;
  loginUrl: string;
  registrationUrl: string;
  redirectToCartAfterAddToBasketClick?: boolean
  cartLinkIsEditLink?: boolean;
  cartItemPropertyName?: string;
  cartItemPropertyValue?: string;
  savedDesignProductName?: "productName" | "variantName" | "productAndVariantName",
  autoImportUserImages: boolean;
  /**
   * Import previously uploaded images only for customers who are logged in, and start a new basket session as
   * soon as one logs in, so nothing an anonymous visitor of the same browser uploaded can reach him. Meant for
   * shared devices like kiosk systems. Defaults to true, set it to false explicitly to import for anonymous
   * visitors as well.
   */
  autoImportRequiresLogin?: boolean;
  slimUi: {
    shopThemeName?: string;
    formInsertPosition: number;
    carouselMode: boolean;
    buttonClasses: string;
    maxProductThumbnails: number;
    hasFullEditor: boolean;
    maxThumbnailHeight?: string;
    doNotUpdateThumbnailOnLoad?: boolean;
  },
  getShopLevelSettings?: () => IShopifyShopLevelSettings;
  /** The "Disable Product Preload" setting of the app block. Product, productOptions, productMetaFields and variantMetaData must not be used then, even if present. */
  disableProductPreload?: boolean | null;
  /** Liquid only: true if the page is rendered in the shop's primary language, the language the api answers in. Preloaded option names and values only match the api's then, on false the launcher renames them to the api's language. */
  productPreloadIsPrimaryLocale?: boolean | null;
  product?: IShopifyProductWithVariants | null;
  /** Liquid only: true if the product has no real options and shopify created an implicit default variant for it. The storefront graphQl api does not expose this flag. */
  hasOnlyDefaultVariant?: boolean | null;
  productOptions?: { name: string, position: number, values: { name: string, id: number, available: boolean }[] }[]
  productMetaFields?: Record<string, string>
  variantMetaData?: { variantId: number, metaFields: Record<string, string>, customMetaFields?: Record<string, string> }[];
}

export type PrintessDesignButtonStatus = "loading" | "editor" | "slimui" | "direct_add_to_basket" | "hidden";

export interface IIntegrationButton extends HTMLButtonElement {
  product?: IShopifyProduct
  integration?: IIntegration
  secondIntegration?: IIntegrationButton
  printessSetStatus: (status: PrintessDesignButtonStatus) => void
  printessGetStatus: () => PrintessDesignButtonStatus
  printessGetAddToBasketButton: () => HTMLElement
  printessGetAddToBasketForm: () => HTMLFormElement | null
  /** Rebinds the button to a newly rendered add to basket button and moves it back into the dom (themes rerendering the product form on variant switch) */
  printessSetAddToBasketButton?: (basketButton: HTMLElement) => void
  /** False if the button itself or its add to basket button got removed from the dom */
  printessIsAttached?: () => boolean
  printessRemoveButton: () => void
  printessGetProductId: () => string | null
  executeAfterInitialization: (callback: ((integrationButton: IIntegrationButton) => void)) => void
  printessSetCaption: (caption: string) => string
}

export interface IPrintessEditor {
  getCurrentTemplateName(): string;
  getPrintessComponent(): iPrintessComponent;
  getPrintessApi(): iPrintessApi;
  getProduct(): IProduct | null;
  getCurrentVariant(): IPrintessProductVariant | null;
}

export interface IShopSettings {
  shopToken: string;
  apiDomain?: string;
  editorDomain?: string;
  editorVersion?: string;
  attachParams: Record<string, any>;
  designButtonClasses?: string;
}

export interface IButtonCaptions {
  addToBasket?: string;
  designNow?: string;
  saveBasketItem?: string;
  cancel?: string;
  loadingButtonText?: string;
}

export interface ISessionSettings {
  printTemplateName?: string;
  originalSaveToken?: string;
  previousSaveToken?: string;
  productDefinitionId?: number;
  printessProductType?: string;
  formFieldsAsProperties?: Record<string, string>,
  printQty?: number,
  printQtyOption?: string,
  tableQuantityField?: string,
  circulationRecordCount?: string,
  saveTokenToDelete?: string;
  ignoreDropshipBundling?: boolean;
  dropshipBundlingId?: string;
  ignoreProduction?: boolean;
  projectName?: string;
  withoutPersonalization?: boolean;
}

export interface IUrlParams {
  saveToken: string;
  quantity: number;
  autoOpenEditor: boolean;
  basketKey: string;
  ui: TUiType;
  loginData?: string | null;
  productOptions?: INameValuePair[]
}

export type ISlimUiMode = "edit" | "cartedit";

export interface ICartItem {
  key: string;
  id: number;
  handle: string;
  properties: Record<string, string>;
  product_id: number;
  url: string;
  quantity: number;
  options_with_values: { name: string, value: any }[];
}

export type TImageFormat = "square" | "portrait" | "landscape";

export interface IIntegration extends IPlugin {
  getGraphQlApi(): IPrintessShopifyGraphQlApi;
  setFormFieldValue(formFieldName: string, formFieldValue: string);
  uploadImageAsync(img: string | File, formFieldName: string, dimensionFormFields?: IImageDimensionFormFields): Promise<iExternalImage | string | null>;
  getImageInfoForUrl(url: string): Promise<{ width: number, height: number, imageFormat: TImageFormat, fileName: string } | null>;
  getIntegrationButton(): IIntegrationButton | null;
  /** Called after the integration button had to be moved back into the dom because the theme rerendered the product form */
  onIntegrationButtonReattached?: (integrationButton: IIntegrationButton) => void;

  save: () => Promise<{ saveToken: string, thumbnailUrl: string }>;

  /* a way to load a save token into the editor in case the customer clicked on the templates load button  */
  loadSaveToken?: (saveToken: string) => Promise<boolean>;

  getComponent?: () => iPrintessComponent | null;
  getApi?: () => iPrintessApi | null;
  getPlugins?: () => IPlugin[];
}

export interface IPluginContainer {
  registerPlugin(plugin: IPlugin);
  getPlugins(): IPlugin[];
}

export interface IImageDimensionFormFields {
  dimensionsFormField?: string;
  widthFormField?: string;
  heightFormField?: string;
  formatFormField?: string;
  fileNameFormField?: string;
}