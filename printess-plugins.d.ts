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

import { iFormFieldProperty, IShopData, iFormFieldNameValue, iMergeTemplate, iExternalBookSettings } from "./printess-editor.d"

export type TUiType = "editor" | "slim" | "";

export interface INameValuePair {
  name: string,
  value: string
}

export interface IPluginContext {
  integration: IIntegration
  type: TUiType
  product: IPrintessProduct
  variant: IPrintessProductVariant | null
}

export interface IFormFieldMapping {
  formField: string;
  values: Record<string, string>;
}

export interface ISaveFormFieldAsPropertyEntry {
  /** Name of the form field inside the Printess template the value is read from. */
  formfieldName: string;
  /** Display name the value is written under to the cart item. Falls back to formfieldName when not given. */
  propertyName?: string;
  /** Written to the cart item in case the editor does not provide a value for the form field. */
  defaultValue?: string;
}

export interface IEditorSettings {
  hidePriceInEditor?: boolean;
  displayProductName?: boolean;
  editorDomain?: string;
  editorVersion?: string;
  apiDomain?: string;
  shopToken?: string;
  translationKey?: string;
  theme?: string;
  shopDomain?: string;
  savedDesignProductName?: "productName" | "variantName" | "productAndVariantName";
  /** Imports every image the current user uploaded before into a newly started design. Never applied when a saved design is opened. */
  autoImportUserImages?: boolean;
  /**
   * Restricts `autoImportUserImages` to customers who are logged in, so uploads of whoever used a shared browser
   * before stay out of the next design. Defaults to true, set it to false explicitly to import for anonymous
   * visitors as well.
   */
  autoImportRequiresLogin?: boolean;
  /**
   * CSS selector of an element on the product page whose text is shown as the price inside the editor instead of
   * the calculated price, e.g. for themes / apps that render their own price. Only the current price is replaced,
   * the struck-through old price stays untouched. Ignored when the element is missing or empty.
   */
  priceDisplayElementSelector?: string;
}

export type TVariantPersonalizationOption = "none" | "personalize" | "directAdd" | "both" //None: Not personalizable; personalize: Show Design Now Button; directAdd: Add printess item to basket without personalization; both: Has Design now button + Direct Add to basket button
/**
 * pageNavigation: slim-ui renders its own strip of page previews above the product image and the
 *   theme's thumbnails are hidden.
 * thumbnailNavigation: the theme's OWN thumbnail strip drives slim-ui's current preview page, so
 *   clicking the thumbnail of a page tells slim-ui the shopper is now looking at that page. Opt-in,
 *   because shops already running slim-ui rely on those thumbnails switching nothing but the theme's
 *   own image. Ignored when pageNavigation is active, which hides that strip anyway.
 */
export type TSlimUiFeature = "pageNavigation" | "thumbnailNavigation" | "personalizeButton"

export interface IPrintessProductSettings {
  pageCountOptionName?: string
  photobookTheme?: string
  productType?: string
  layout?: string;//slimui layout setting
  hasFullEditorButton?: boolean;
  formFields?: Record<string, string>;
  bookSettings?: iExternalBookSettings | null;
  personalizationMode?: TVariantPersonalizationOption | null;
  printQtyOption?: string | null;
  theme?: string | null;
  slimUiFeatures?: TSlimUiFeature | TSlimUiFeature[];
  slimUiMerge1?: string | null;
  /**
   * Slim UI only, `personalizeButton` feature: the preview page the button switches the preview over to. Either the
   * name of a preview document, whose first page is used, or a page position counted across every preview document
   * of the template and zero based - the same order the page thumbnails are in. A document of that name wins over
   * the position, so a template with documents named "1" and "2" stays addressable by name.
   */
  slimUiPersonalizePageIndex?: number | string | null;
  /**
   * Slim UI only, `personalizeButton` feature: the page inside the preview document `slimUiPersonalizePageIndex`
   * names, zero based, so 0 is its first page. Optional, the first page is used without it. Ignored where
   * `slimUiPersonalizePageIndex` holds a page position instead of a document name, as a position already names a
   * single page of its own.
   */
  slimUiPersonalizeDocumentPageIndex?: number | string | null;
  /**
   * Slim UI only: the layout snippet search tags handed to slim-ui, replacing the ones configured in the template.
   * Either a list of tags or a single comma separated string, as the metafield is written by hand as well as by the
   * account portal. Left out or empty, the template's own tags apply.
   */
  layoutSnippetSearchTags?: string[] | string | null;
  /**
   * Form field values written to the cart item as separate, customer visible properties. Either a single form field
   * name, which is used as property name and value source, or a serialized ISaveFormFieldAsPropertyEntry[]. Extends
   * the entries the plugins provide instead of replacing them.
   */
  formFieldsAsProperties?: ISaveFormFieldAsPropertyEntry[] | string | null;
}

export interface IPrintessVariantSettings {
  personalizationMode?: TVariantPersonalizationOption
}

export interface IPrintessProductBase {
  getId(): string
  getLabel(): string
  getPrice(): number
  getTemplateName(): string
  getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[]
  getPrintTemplateName(): string | null
}

export interface IPrintessProductVariant extends IPrintessProductBase {
  getVariantOptions(): INameValuePair[];
  getSettings(): IPrintessVariantSettings;
  /**
   * True if the shop created this variant implicitly because the product has no real options (shopify names it "Default Title").
   * Its label carries no product information and must not be displayed. Optional, plugins not implementing it fall back to a heuristic.
   */
  isDefaultVariant?(): boolean;
}

export interface IPrintessProduct extends IPrintessProductBase {
  getProductOptions(): { name: string, values: string[] }[];
  getSettings(): IPrintessProductSettings | null;
  getDropshipProductDefinitionId(): number;
  getUrl(variant: IPrintessProductVariant | null): string;
  getThumbnailUrl(variant: IPrintessProductVariant | null): string;
}

export interface IPriceInformation {
  legalNotice?: string,
  productName?: string
  infoUrl?: string
}

export interface IPricingInfo extends IPriceInformation {
  price: string,
  oldPrice?: string
  priceCategoryLabels?: Record<string, string>
}


export type TInitializeType = "integration" | "editor" | "slimui"

export interface IPlugin {
  onInitialized?: (integration: IIntegration, type: TInitializeType) => void;

  doAllowOpenAsync?: (context: IPluginContext, params: {
    templateName: string,
    formFields: INameValuePair[],
    mergeTemplates: iMergeTemplate[],
    formFieldProperties: iFormFieldProperty[]
  }) => Promise<boolean>

  doAllowCloseAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }) => Promise<boolean>

  doAllowSaveAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<boolean>

  doAllowAddToBasketAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<boolean>

  doAllowReplaceBasketItemAsync?: (context: IPluginContext, params: {
    quantity: number,
    properties: Record<string, string>
  }) => Promise<boolean>

  onAddToBasketAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string,
    variant: IVariant
  }) => Promise<void>

  onFormfieldChangedAsync?: (context: IPluginContext, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    formFieldTag: string,
    formFields: INameValuePair[],
    newVariant?: IVariant | null
  }) => Promise<void>

  onPageCountChangedAsync?: (context: IPluginContext, params: {
    pageCount: number
  }) => Promise<void>

  onPrintedRecordCountChangedAsync?: (context: IPluginContext, params: {
    printedRecordCount: number
  }) => Promise<void>

  onSaveAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<void>;

  onLoadButtonClickedAsync?: (context: IPluginContext, params: {
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<void>;

  onLoginAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    displayName: string,
    shopSaveData: IShopData,
    type: "register" | "login"
  }) => Promise<void>

  onOpenAsync?: (context: IPluginContext, params: {
    templateName: string,
    formFields: INameValuePair[],
    mergeTemplates: iMergeTemplate[],
    formFieldProperties: iFormFieldProperty[]
  }) => Promise<void>

  onLoadSavedStateAsync?: (context: IPluginContext, shopData: IShopData) => Promise<void>;

  onCloseAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }) => Promise<void>

  onThumbnailsChangedAsync?: (context: IPluginContext, params: {
    thumbnails: string[]
  }) => Promise<void>

  onProgressIndicatorAsync?: (context: IPluginContext, params: {
    show: boolean
  }) => Promise<void>

  getPriceInCentAsync?: (context: IPluginContext, currentPrice: number, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    pureRecordCount?: number,
    printedRecordCount?: number
  }) => Promise<number>

  renderPriceAsync?: (context: IPluginContext, priceToRender: number, currentValue: string, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    price: number,
    numberOfPages: number,
    pureRecordCount?: number,
    printedRecordCount?: number
  }) => Promise<string>

  getOldPriceInCentAsync?: (context: IPluginContext, oldPrice: number | null, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    pureRecordCount?: number,
    printedRecordCount?: number
  }) => Promise<number | null>

  getEditorThemeAsync?: (context: IPluginContext, currentValue: string) => Promise<string>

  getPriceCategoryLabelsAsync?: (context: IPluginContext, currentValue: INameValuePair[], params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    pureRecordCount?: number,
    printedRecordCount?: number
  }) => Promise<INameValuePair[]>

  getPricingDisplayValuesAsync?: (context: IPluginContext, currentValue: IPricingInfo, params: any) => Promise<IPricingInfo>;

  unmapFormFieldAsync?: (context: IPluginContext, currentValue: INameValuePair, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    mappings: Record<string, IFormFieldMapping> | null
  }) => Promise<INameValuePair>;

  mapFormFielsdAsync?: (context: IPluginContext, currentValue: INameValuePair[], params: {
    mappings: Record<string, IFormFieldMapping> | null
  }) => Promise<INameValuePair[]>;

  supportsSavingAsync?: (context: IPluginContext) => Promise<boolean>;

  userIsLoggedInAsync?: (context: IPluginContext) => Promise<boolean>;

  getShopSaveDataAsync?: (context: IPluginContext, currentValue: IShopData | null) => Promise<IShopData | null>;

  getFormFieldsAsync?: (context: IPluginContext, formFields: INameValuePair[]) => Promise<INameValuePair[]>;

  getAttachParametersAsync?: (context: IPluginContext) => Promise<Record<string, any>>;

  onError?: (context: IPluginContext, params: {
    errorMessage: string,
    params?: Record<string, any> | null
  }) => void;

  getProductAsync?: (context: IPluginContext, currentValue?: IProduct | null) => Promise<IProduct>;
  getCurrentVariantAsync?(context: IPluginContext, currentValue?: IVariant | null): Promise<IVariant>;
  getVariantByProductOptionsAsync?: (context: IPluginContext, options: INameValuePair[], currentVariant?: IVariant | null) => Promise<IVariant | null>;
  getBasketIdAsync?: (context: IPluginContext, currentValue?: string | null) => Promise<string | null>;
  getUserIdAsync?: (context: IPluginContext, currentValue?: string | null) => Promise<string | null>;
  getFormFieldMappingsAsync?: (context: IPluginContext, currentValue?: Record<string, IFormFieldMapping> | null) => Promise<Record<string, IFormFieldMapping> | null>;
  getFormFieldPropertiesAsync?: (context: IPluginContext, currentValue?: iFormFieldProperty[] | null) => Promise<iFormFieldProperty[]>;
  getCustomLoader?: (context: IPluginContext) => { hide: () => void, show: () => void } | null;
  getFormFieldsAsPropertiesAsync?: (context: IPluginContext, currentValue?: ISaveFormFieldAsPropertyEntry[] | string | null) => Promise<ISaveFormFieldAsPropertyEntry[] | string | null>;
  getEditorSettings?: (context: IPluginContext, currentValue?: IEditorSettings | null) => IEditorSettings;

  productIsPersonalizableAsync?(context: IPluginContext, currentValue: boolean): Promise<boolean>;
  getVariantPersonalizationSettings?()
  getTemplateNameAsync?(context: IPluginContext, currentValue: string): Promise<string>;
  hasDirectAddToBasketButtonAsync?(context: IPluginContext, currentValue: boolean): Promise<boolean>;
  getPhotobookSettingsAsync?(context: IPluginContext, currentValue: iExternalBookSettings | null): Promise<iExternalBookSettings | null>;
  getVariantPersonalizationTypeAsync?(context: IPluginContext, variant: IPrintessProductVariant, currentValue: TVariantPersonalizationOption): Promise<TVariantPersonalizationOption>;

  getPriceInformationAsync?: (context: IPluginContext, currentInfo: IPriceInformation, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    printedRecordCount?: number
  }) => Promise<IPriceInformation>;

  onTabClose?: (context: IPluginContext, e: Event) => void;

  getTranslationKeyAsync?(context: IPluginContext, currentLanguage: string): Promise<string>;
}