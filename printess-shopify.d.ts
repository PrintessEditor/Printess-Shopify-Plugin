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
  product?: IShopifyProductWithVariants | null;
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
  printQuantity?: number,
  printQuantityOption?: string,
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

  save: () => Promise<{ saveToken: string, thumbnailUrl: string }>;

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