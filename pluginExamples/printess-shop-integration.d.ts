import { iExternalImageFrameDimensions, iImage, iFormFieldProperty, IShopData, iFormFieldNameValue, iMergeTemplate } from "./printess-editor.d"

export interface INameValuePair {
  name: string
  value: string;
};

export interface IPrintessProductSettings {
  pageCountOptionName?: string
  photobookTheme?: string
  productType?: string
  layout?: string;//slimui layout setting
  hasFullEditorButton?: boolean;
}

export interface IPrintessProductBase {
  getId(): string
  getLabel(): string
  getPrice(): number
  getTemplateName(): string
  getMergeTemplates(): string | iMergeTemplate | iMergeTemplate[]
  getPrintTemplateName(): string
}

export interface IPrintessProductVariant extends IPrintessProductBase {
  getVariantOptions(): INameValuePair[];
}

export interface IPrintessProduct extends IPrintessProductBase {
  getProductOptions(): { name: string, values: string[] }[];
  getSettings(): IPrintessProductSettings | null;
  getDropshipProductDefinitionId(): number;
  getUrl(variant: IPrintessProductVariant | null): string;
  getThumbnailUrl(variant: IPrintessProductVariant | null): string;
}

export interface IPluginContext {
  integration: IIntegration
  product: IProduct
  variant?: IProductVariant
  type: TUiType
}

export interface IPlugin {
  onInitialized?: (integration: IIntegration) => void;

  onInitializationFinished?: (context: IPluginContext) => void;

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
    originalSaveToken: string
  }) => Promise<void>

  onFormfieldChangedAsync?: (context: IPluginContext, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    formFieldTag: string,
    formFields: INameValuePair[]
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

  onLoginAsync?: (context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    displayName: string,
    shopSaveData: IShopData,
    type: "register" | "login"
  }) => Promise<void>

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
    numberOfPages?: number,
    printedRecordCount?: number
  }) => Promise<number>

  renderPriceAsync?: (context: IPluginContext, priceToRender: number, currentValue: string, params: {
    price: number,
    numberOfPages: number,
    printedRecordCount: number
  }) => Promise<string>

  getOldPriceInCentAsync?: (context: IPluginContext, oldPrice: number | null, params: {
    numberOfPages?: number,
    printedRecordCount?: number
  }) => Promise<number | null>

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

  getProductAsync?: (context: IPluginContext) => Promise<IProduct>;
}