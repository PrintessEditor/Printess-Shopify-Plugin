import { IPrintessShopifyGraphQlApi, IProduct as IShopifyProduct } from "./printess-graphql-api.d";
import { iExternalImageFrameDimensions, iImage, iFormFieldProperty, IShopData, iFormFieldNameValue, iMergeTemplate } from "./printess-editor.d"
import { INameValuePair, IPlugin, IPrintessProduct as IProduct } from "./printess-shop-integration.d"

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

export interface IShopifySettings extends IShopSettings {
  graphQlToken: string;
  graphQlLanguage?: string;
  ignoreDataOptionIndex?: boolean;
  uiSelectors?: IUiSelectors;
  captions?: IButtonCaptions;
  useVariantIdField?: boolean;
  priceFormat: string;
  importProductOptionsFromVariantId?: boolean;
  displayProductName?: boolean;
  editorUrlParams?: Record<string, any>;
  integrationButtonClasses?: string;
  cartButtonClasses?: string;
  advancedButtonClasses?: string;
  integrationUrl?: string;
  additionalProductMetaFields?: string[];
  internalShopDomain: string;
  loginUrl: string;
  registrationUrl: string;
  slimUi: {
    shopThemeName?: string;
    formInsertPosition: number;
    carouselMode: boolean;
    buttonClasses: string;
    maxProductThumbnails: number;
    hasFullEditor: boolean;
    maxThumbnailHeight?: string;
  }
}

export type PrintessDesignButtonStatus = "loading" | "editor" | "slimui" | "hidden";

export interface IIntegrationButton extends HTMLButtonElement {
  product?: IShopifyProduct
  integration?: IIntegration
  secondIntegration?: IIntegrationButton
  printessSetStatus: (status: PrintessDesignButtonStatus) => void
  printessGetStatus: () => PrintessDesignButtonStatus
  printessGetAddToBasketButton: () => HTMLElement
  printessGetAddToBasketForm: () => HTMLFormElement | null
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
  getCurrentVariant(): IProductVariant | null;
}

export interface IFormFieldMapping {
  formField: string;
  values: Record<string, string>;
}

export interface IShopSettings {
  shopToken: string;
  apiDomain?: string;
  editorDomain?: string;
  editorVersion?: string;
  attachParams: Record<string, any>;
  designButtonClasses?: string;
}

export interface ISaveFormFieldAsPropertyEntry {
  formfieldName: string;
  propertyName: string;
  defaultValue: string;
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
  printQuantity?: number,
  printQuantityOption?: string,
  tableQuantityField?: string,
  circulationRecordCount?: string,
  saveTokenToDelete?: string;
  ignoreDropshipBundling?: boolean;
  dropshipBundlingId?: string;
  ignoreProduction?: boolean;
  projectName?: string;
}

export interface IShopIntegration extends IPluginProvider {
  shopToken: string;
  apiDomain?: string;
  editorDomain?: string;
  editorVersion?: string;
  editorUrlParams?: Record<string, any>;
  theme?: string;
  hidePriceInEditor?: boolean;
  displayProductName?: boolean;

  translationKey?: string;

  formFieldsAsProperties?: ISaveFormFieldAsPropertyEntry[] | string;


  getProductAsync(): Promise<IProduct>;
  getVariantByProductOptionsAsync(options: INameValuePair[]): Promise<IProductVariant>;
  getCurrentVariantAsync(): Promise<IProductVariant>;
  getFormFieldMappingsAsync?(): Promise<Record<string, IFormFieldMapping>>;
  getTemplateNameOverwriteAsync?(): Promise<string>;
  getFormFieldPropertiesAsync?(): Promise<iFormFieldProperty[]>;
  getBasketIdAsync?(): Promise<string | null>;
  getUserIdAsync?(): Promise<string | null>;
  getProductInfoUrlAsync?(product: IProduct, variant: IProductVariant): Promise<string>;
  getProductLegalInfoAsync?(product: IProduct, variant: IProductVariant): Promise<string>;
  getProductDisplayNameAsync?(product: IProduct, variant: IProductVariant): Promise<string>;
  getTabCloseEventHandler?(): (e: Event) => void | null;
  getCustomLoader?(): { hide: () => void, show: () => void } | null;
  getShopDomain(): string;

  onFormFieldChangedAsync(name: string, value: string, label: string, valueLabel: string, tag: string, newVariant?: IProductVariant | null): Promise<void>;
  onAddToBasketAsync(saveToken: string, thumbnailUrl: string, selectedVariant: IProductVariant, printessBasketItemProperties: Record<string, string>): Promise<void>;
}

export type TUiType = "editor" | "slim" | "";

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

export interface IPluginProvider {
  onInitialized: () => void;

  doAllowOpenAsync: (product: IProduct, variant: IProductVariant, params: {
    templateName: string,
    formFields: INameValuePair[],
    mergeTemplates: iMergeTemplate[],
    formFieldProperties: iFormFieldProperty[]
  }) => Promise<boolean>


  doAllowCloseAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }) => Promise<boolean>

  doAllowSaveAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<boolean>

  doAllowAddToBasketAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<boolean>

  doAllowReplaceBasketItemAsync: (product: IProduct, variant: IProductVariant, params: {
    quantity: number,
    properties: Record<string, string>
  }) => Promise<boolean>

  onAddToBasketPluginAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<void>

  onFormfieldChangedPluginAsync: (product: IProduct, variant: IProductVariant, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    formFieldTag: string,
    formFields: INameValuePair[]
  }) => Promise<void>

  onPageCountChangedAsync: (product: IProduct, variant: IProductVariant, params: {
    pageCount: number
  }) => Promise<void>

  onPrintedRecordCountChangedAsync: (product: IProduct, variant: IProductVariant, params: {
    printedRecordCount: number
  }) => Promise<void>

  onSavePluginAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }) => Promise<void>;

  onLoginAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    displayName: string,
    shopSaveData: IShopData,
    type: "register" | "login"
  }) => Promise<void>

  onCloseAsync: (product: IProduct, variant: IProductVariant, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }) => Promise<void>

  onThumbnailsChangedAsync?: (product: IProduct, variant: IProductVariant, params: {
    thumbnails: string[]
  }) => Promise<void>

  onProgressIndicatorAsync?: (product: IProduct, variant: IProductVariant, params: {
    show: boolean
  }) => Promise<void>

  getPriceInCentAsync?: (product: IProduct, variant: IProductVariant, currentPrice: number, params: {
    numberOfPages?: number,
    printedRecordCount?: number
  }) => Promise<number>

  renderPriceAsync?: (product: IProduct, variant: IProductVariant, priceToRender: number, params: {
    price: number,
    numberOfPages: number,
    printedRecordCount: number
  }) => Promise<string>

  getOldPriceInCentAsync?: (product: IProduct, variant: IProductVariant, params: {
    numberOfPages?: number,
    printedRecordCount?: number
  }) => Promise<number | null>

  unmapFormFieldAsync?: (product: IProduct, variant: IProductVariant, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    mappings: Record<string, IFormFieldMapping> | null
  }) => Promise<INameValuePair>;

  mapFormFielsdAsync?: (product: IProduct, variant: IProductVariant, currentValue: INameValuePair[], params: {
    mappings: Record<string, IFormFieldMapping> | null
  }) => Promise<INameValuePair[]>;

  supportsSavingAsync?: (product: IProduct, variant: IProductVariant) => Promise<boolean>;

  userIsLoggedInAsync?: (product: IProduct, variant: IProductVariant) => Promise<boolean>;

  getShopSaveDataAsync?: (product: IProduct, variant: IProductVariant, shopData: IShopData | null) => Promise<IShopData | null>;

  getFormFieldsAsync?: (product: IProduct, variant: IProductVariant) => Promise<INameValuePair[]>;

  getAttachParametersAsync?: (product: IProduct, variant: IProductVariant) => Promise<Record<string, any>>;

  onError?: (product: IProduct, variant: IProductVariant, params: {
    errorMessage: string,
    params?: Record<string, any> | null
  }) => void;

  onGetProductAsync?: (product: IProduct) => Promise<IProduct>;
}

export type TImageFormat = "square" | "portrait" | "landscape";

export interface IIntegration {
  getGraphQlApi(): IPrintessShopifyGraphQlApi;

  setFormFieldValue(formFieldName: string, formFieldValue: string);
  uploadImageAsync(img: string | File, formFieldName: string, dimensionFormFields?: IImageDimensionFormFields): Promise<iExternalImage | string | null>;
  getImageInfoForUrl(url: string): Promise<{ width: number, height: number, imageFormat: TImageFormat, fileName: string } | null>;
  getIntegrationButton(): IIntegrationButton | null;

  save: () => Promise<{ saveToken: string, thumbnailUrl: string }>;
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