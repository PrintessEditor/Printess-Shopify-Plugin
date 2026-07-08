import { iExternalBookSettings, iFormFieldProperty, iMergeTemplate, IShopData } from "./printess-editor.d";
import { IIntegration } from "./printess-shopify.d";
import { INameValuePair, IFormFieldMapping, IPluginContext, IPlugin, TInitializeType, ISaveFormFieldAsPropertyEntry, IEditorSettings, IPriceInformation, IPricingInfo, IPrintessProduct as IProduct, IPrintessProductVariant as IVariant, TVariantPersonalizationOption } from "./printess-plugins.d";

export interface IPluginHost extends IPlugin {
  hasTabCloseHandlers(): boolean;
}

export class PrintessPluginHost implements IPluginHost {
  private plugins: IPlugin[] = [];
  private pluginProvider: (() => IPlugin[]) | null = null;
  private lastPluginToExecute: IPlugin | null = null;

  public constructor(pluginProvider?: (() => IPlugin[]) | null, lastPluginToExecute?: IPlugin | null) {
    this.lastPluginToExecute = lastPluginToExecute || null;

    if (pluginProvider) {
      this.pluginProvider = pluginProvider;
    }
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

  private getPlugins(ignoreLastPluginOrder: boolean = false): IPlugin[] {
    let ret = [
      ...this.plugins,
      ...(this.pluginProvider ? this.pluginProvider() : [])
    ];

    if (!ignoreLastPluginOrder && this.lastPluginToExecute) {
      ret = ret.filter((x) => x !== this.lastPluginToExecute);
      ret.push(this.lastPluginToExecute);
    }

    return ret;
  }

  public registerPlugin(plugin: IPlugin): void {
    if (plugin && this.plugins.indexOf(plugin) === -1) {
      this.plugins.push(plugin);
    }
  }

  public onInitialized(integration: IIntegration, type: TInitializeType): void {
    const plugins = this.getPlugins();

    plugins.forEach((plugin) => {
      try {
        if (typeof plugin.onInitialized === "function") {
          plugin.onInitialized(integration, type);
        }
      }
      catch (e) {
        console.error(e);
      }
    });
  }

  public async doAllowOpenAsync(context: IPluginContext, params: {
    templateName: string,
    formFields: INameValuePair[],
    mergeTemplates: iMergeTemplate[],
    formFieldProperties: iFormFieldProperty[]
  }): Promise<boolean> {
    let ret: boolean = true;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowOpenAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.doAllowOpenAsync(context, params));

          if (typeof val === "boolean") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async doAllowCloseAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }): Promise<boolean> {
    let ret: boolean = true;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowCloseAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.doAllowCloseAsync(context, params));

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

  public async doAllowSaveAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }): Promise<boolean> {
    let ret: boolean = true;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowSaveAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.doAllowSaveAsync(context, params));

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

  public async doAllowAddToBasketAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string,
    withoutPersonalization?: boolean
  }): Promise<boolean> {
    let ret: boolean = true;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowAddToBasketAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.doAllowAddToBasketAsync(context, params));

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

  public async doAllowReplaceBasketItemAsync(context: IPluginContext, params: {
    quantity: number,
    properties: Record<string, string>
  }): Promise<boolean> {
    let ret: boolean = true;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.doAllowReplaceBasketItemAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.doAllowReplaceBasketItemAsync(context, params));

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

  public async onAddToBasketAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string,
    variant: IVariant
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onAddToBasketAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onAddToBasketAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onFormfieldChangedAsync(context: IPluginContext, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    formFieldTag: string,
    formFields: INameValuePair[],
    newVariant?: IVariant | null
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onFormfieldChangedAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onFormfieldChangedAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onPageCountChangedAsync(context: IPluginContext, params: {
    pageCount: number
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onPageCountChangedAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onPageCountChangedAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onPrintedRecordCountChangedAsync(context: IPluginContext, params: {
    printedRecordCount: number
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onPrintedRecordCountChangedAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onPrintedRecordCountChangedAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onSaveAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onSaveAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onSaveAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onLoadButtonClickedAsync(context: IPluginContext, params: {
    previousSaveToken: string,
    originalSaveToken: string
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onLoadButtonClickedAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onLoadButtonClickedAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onLoginAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    displayName: string,
    shopSaveData: IShopData,
    type: "register" | "login"
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onLoginAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onLoginAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onOpenAsync(context: IPluginContext, params: {
    templateName: string,
    formFields: INameValuePair[],
    mergeTemplates: iMergeTemplate[],
    formFieldProperties: iFormFieldProperty[]
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onOpenAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onOpenAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onCloseAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    isAddToBasket: boolean
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onCloseAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onCloseAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onThumbnailsChangedAsync(context: IPluginContext, params: {
    thumbnails: string[]
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onThumbnailsChangedAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onThumbnailsChangedAsync(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async onProgressIndicatorAsync(context: IPluginContext, params: {
    show: boolean
  }): Promise<void> {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onProgressIndicatorAsync === "function") {
          await PrintessPluginHost.waitForResult(plugin.onProgressIndicatorAsync(context, params));
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
    let ret: number = currentPrice;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getPriceInCentAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getPriceInCentAsync(context, ret, params));

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

  public async renderPriceAsync(context: IPluginContext, priceToRender: number, currentValue: string, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    price: number,
    numberOfPages: number,
    printedRecordCount: number
  }): Promise<string> {
    let ret: string = currentValue;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.renderPriceAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.renderPriceAsync(context, priceToRender, ret, params));

          if (typeof val === "string" && val) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getOldPriceInCentAsync(context: IPluginContext, oldPrice: number | null, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    printedRecordCount?: number
  }): Promise<number | null> {
    let ret: number | null = null;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getOldPriceInCentAsync === "function") {
          const val: number | null = await PrintessPluginHost.waitForResult(plugin.getOldPriceInCentAsync(context, ret, params));

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

  public async getPriceCategoryLabelsAsync(context: IPluginContext, currentValue: INameValuePair[], params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    printedRecordCount?: number
  }): Promise<INameValuePair[]> {
    let ret: INameValuePair[] = [];
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getPriceCategoryLabelsAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getPriceCategoryLabelsAsync(context, ret, params));

          if (typeof val !== "undefined" && val && val.length > 0) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getPricingDisplayValuesAsync(context: IPluginContext, currentValue: IPricingInfo, params: any): Promise<IPricingInfo> {
    let ret: IPricingInfo = currentValue;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getPricingDisplayValuesAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getPricingDisplayValuesAsync(context, ret, params));

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

  public async unmapFormFieldAsync(context: IPluginContext, currentValue: INameValuePair, params: {
    formFieldName: string,
    formFieldValue: string,
    formFieldLabel: string,
    formFieldValueLabel: string,
    mappings: Record<string, IFormFieldMapping> | null
  }): Promise<INameValuePair> {
    let ret: INameValuePair = currentValue;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.unmapFormFieldAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.unmapFormFieldAsync(context, ret, params));

          if (typeof val !== "undefined") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async mapFormFielsdAsync(context: IPluginContext, currentValue: INameValuePair[], params: {
    mappings: Record<string, IFormFieldMapping> | null
  }): Promise<INameValuePair[]> {
    let ret: INameValuePair[] = currentValue;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.mapFormFielsdAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.mapFormFielsdAsync(context, ret, params));

          if (typeof val !== "undefined" && val !== null) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async supportsSavingAsync(context: IPluginContext): Promise<boolean> {
    let ret: boolean = false;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.supportsSavingAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.supportsSavingAsync(context));

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

  public async userIsLoggedInAsync(context: IPluginContext): Promise<boolean> {
    let ret: boolean = false;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.userIsLoggedInAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.userIsLoggedInAsync(context));

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

  public async getShopSaveDataAsync(context: IPluginContext, currentValue: IShopData | null): Promise<IShopData | null> {
    let ret: IShopData | null = currentValue;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getShopSaveDataAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getShopSaveDataAsync(context, ret));

          if (typeof val !== "undefined" && val !== null) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getFormFieldsAsync(context: IPluginContext, formFields: INameValuePair[]): Promise<INameValuePair[]> {
    let ret: INameValuePair[] = formFields;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getFormFieldsAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getFormFieldsAsync(context, ret));

          if (typeof val !== "undefined" && val !== null) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getAttachParametersAsync(context: IPluginContext): Promise<Record<string, any>> {
    let ret: Record<string, any> = {};
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getAttachParametersAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getAttachParametersAsync(context));

          if (typeof val !== "undefined" && val !== null) {
            ret = {
              ...val
            };
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public onError(context: IPluginContext, params: {
    errorMessage: string,
    params?: Record<string, any> | null
  }): void {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onError === "function") {
          PrintessPluginHost.waitForResult(plugin.onError(context, params));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public async getProductAsync(context: IPluginContext, currentValue?: IProduct | null): Promise<IProduct> {
    let ret: IProduct | null = currentValue || null;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getProductAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getProductAsync(context, ret));

          if (typeof val !== "undefined" && val != null) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!ret) {
      throw "PrintessIntegration: No product received";
    }

    return ret;
  }

  public async getCurrentVariantAsync(context: IPluginContext, currentValue: IVariant | null): Promise<IVariant> {
    let ret: IVariant | null = currentValue;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getCurrentVariantAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getCurrentVariantAsync(context, ret));

          if (typeof val !== "undefined" && val != null) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!ret) {
      throw "PrintessIntegration: No product received";
    }

    return ret;
  }

  public async getPriceInformationAsync(context: IPluginContext, currentInfo: IPriceInformation, params: {
    currentFormFieldValues?: { name: string, value: string }[],
    numberOfPages?: number,
    printedRecordCount?: number
  }): Promise<IPriceInformation> {
    let ret = currentInfo;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getPriceInformationAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getPriceInformationAsync(context, ret, params));

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

  public async getBasketIdAsync(context: IPluginContext, currentValue?: string | null): Promise<string | null> {
    let ret: string | null = currentValue || null;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getBasketIdAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getBasketIdAsync(context, ret));

          if (typeof val !== "undefined") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getUserIdAsync(context: IPluginContext, currentValue?: string | null): Promise<string | null> {
    let ret: string | null = currentValue || null;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getUserIdAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getUserIdAsync(context, ret));

          if (typeof val !== "undefined") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getFormFieldMappingsAsync(context: IPluginContext, currentValue?: Record<string, IFormFieldMapping> | null): Promise<Record<string, IFormFieldMapping> | null> {
    let ret: Record<string, IFormFieldMapping> | null = currentValue || null;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getFormFieldMappingsAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getFormFieldMappingsAsync(context, ret));

          if (typeof val !== "undefined") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getVariantByProductOptionsAsync(context: IPluginContext, options: INameValuePair[], currentVariant?: IVariant | null): Promise<IVariant | null> {
    let ret: IVariant | null = currentVariant || null;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getVariantByProductOptionsAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getVariantByProductOptionsAsync(context, options, ret));

          if (typeof val !== "undefined") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getFormFieldPropertiesAsync(context: IPluginContext, currentValue?: iFormFieldProperty[] | null): Promise<iFormFieldProperty[]> {
    let ret = currentValue ?? [];
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getFormFieldPropertiesAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getFormFieldPropertiesAsync(context, ret));

          if (typeof val !== "undefined" && val !== null && Array.isArray(val)) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public hasTabCloseHandlers(): boolean {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      if (typeof plugin.onTabClose === "function") {
        return true;
      }
    }

    return false;
  }

  public OnTabClose(context: IPluginContext, e: Event): void {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.onTabClose === "function") {
          plugin.onTabClose(context, e);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  public getCustomLoader(context: IPluginContext): { hide: () => void, show: () => void } | null {
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getCustomLoader === "function") {
          const val = plugin.getCustomLoader(context);

          if (typeof val !== "undefined" && val !== null) {
            return val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return null;
  }

  public static parseFormFieldsAsProperties(formFieldName?: string | ISaveFormFieldAsPropertyEntry[] | null): ISaveFormFieldAsPropertyEntry[] {
    if (!formFieldName) {
      return [];
    }

    if (typeof formFieldName === "string") {
      try {
        const ret = JSON.parse(formFieldName);

        if (typeof ret != "string") {
          return Array.isArray(ret) ? ret : [ret];
        } else {
          return [{
            defaultValue: "",
            formfieldName: ret,
            propertyName: ret,
          }] as ISaveFormFieldAsPropertyEntry[]
        }
      } catch {
        return [{
          defaultValue: "",
          formfieldName: formFieldName,
          propertyName: formFieldName,
        }] as ISaveFormFieldAsPropertyEntry[]
      }
    }

    return Array.isArray(formFieldName) ? formFieldName : [formFieldName];
  }

  public async getFormFieldsAsPropertiesAsync(context: IPluginContext, currentValue?: ISaveFormFieldAsPropertyEntry[] | string | null): Promise<ISaveFormFieldAsPropertyEntry[] | string | null> {
    let ret: ISaveFormFieldAsPropertyEntry[] = PrintessPluginHost.parseFormFieldsAsProperties(currentValue);
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getFormFieldsAsPropertiesAsync === "function") {
          let val = await PrintessPluginHost.waitForResult(plugin.getFormFieldsAsPropertiesAsync(context, ret));

          if (val) {
            val = PrintessPluginHost.parseFormFieldsAsProperties(val);
          }

          if (typeof val !== "undefined" && val !== null && Array.isArray(val)) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public getEditorSettings(context: IPluginContext, currentValue?: IEditorSettings | null): IEditorSettings {
    let ret: IEditorSettings = {
      ...(currentValue ? currentValue : {})
    };
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getEditorSettings === "function") {
          const val = plugin.getEditorSettings(context, ret);

          if (typeof val !== "undefined" && val !== null) {
            ret = {
              ...ret,
              ...val
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async productIsPersonalizableAsync(context: IPluginContext, currentValue: boolean): Promise<boolean> {
    let ret: boolean = currentValue === true;
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.productIsPersonalizableAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.productIsPersonalizableAsync(context, ret));

          if (typeof val !== "undefined") {
            ret = val === true;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getTemplateNameAsync(context: IPluginContext, currentValue: string): Promise<string> {
    let ret: string = currentValue || "";
    const plugins = this.getPlugins(true);

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getTemplateNameAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getTemplateNameAsync(context, ret));

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

  public async hasDirectAddToBasketButtonAsync(context: IPluginContext, currentValue: boolean): Promise<boolean> {
    let ret: boolean = currentValue === true;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.hasDirectAddToBasketButtonAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.hasDirectAddToBasketButtonAsync(context, ret));

          if (typeof val !== "undefined") {
            ret = val === true;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getVariantPersonalizationTypeAsync(context: IPluginContext, variant: IVariant, currentValue: TVariantPersonalizationOption): Promise<TVariantPersonalizationOption> {
    const personalizationTypes: TVariantPersonalizationOption[] = ["both", "directAdd", "personalize", "none"];
    let ret = currentValue;

    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getVariantPersonalizationTypeAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getVariantPersonalizationTypeAsync(context, variant, ret));

          if (typeof val !== "undefined" && typeof val === "string" && personalizationTypes.includes(val)) {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }

  public async getPhotobookSettingsAsync(context: IPluginContext, currentValue: iExternalBookSettings | null): Promise<iExternalBookSettings | null> {
    let ret: iExternalBookSettings | null = currentValue;
    const plugins = this.getPlugins();

    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i];

      try {
        if (typeof plugin.getPhotobookSettingsAsync === "function") {
          const val = await PrintessPluginHost.waitForResult(plugin.getPhotobookSettingsAsync(context, ret));

          if (typeof val !== "undefined") {
            ret = val;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return ret;
  }
}