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
  formfieldName: string;
  propertyName: string;
  defaultValue: string;
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
}

export type TVariantPersonalizationOption = "none" | "personalize" | "directAdd" | "both" //None: Not personalizable; personalize: Show Design Now Button; directAdd: Add printess item to basket without personalization; both: Has Design now button + Direct Add to basket button

export interface IPrintessProductSettings {
  pageCountOptionName?: string
  photobookTheme?: string
  productType?: string
  layout?: string;//slimui layout setting
  hasFullEditorButton?: boolean;
  formFields?: Record<string, string>;
  bookSettings?: iExternalBookSettings | null;
  personalizationMode?: TVariantPersonalizationOption | null
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
    printedRecordCount?: number
  }) => Promise<number>

  renderPriceAsync?: (context: IPluginContext, priceToRender: number, currentValue: string, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    price: number,
    numberOfPages: number,
    printedRecordCount: number
  }) => Promise<string>

  getOldPriceInCentAsync?: (context: IPluginContext, oldPrice: number | null, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    printedRecordCount?: number
  }) => Promise<number | null>

  getPriceCategoryLabelsAsync?: (context: IPluginContext, currentValue: INameValuePair[], params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
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
}