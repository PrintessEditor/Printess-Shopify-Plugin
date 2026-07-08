import { iExternalBookSettings, iExternalImage, iExternalPriceDisplay, iExternalProductPriceInfo, iFormFieldNameValue, iFormFieldProperty, iMergeTemplate, iPrintessApi, iPrintessComponent, IShopData } from "./printess-editor.d";
import { IImageDimensionFormFields, IIntegration, IPluginContainer, ISessionSettings } from "./printess-shopify.d";
import { PrintessSharedTools } from "./printess-shared-tools.js";
import { IFormFieldMapping, IPlugin, IPluginContext, INameValuePair, ISaveFormFieldAsPropertyEntry, IPriceInformation, IPrintessProduct, IPrintessProductVariant } from "./printess-plugins.d";
import { IPluginHost, PrintessPluginHost } from "./printess-plugin-host.js";
import { iExternalPhotobookStep } from "../../../editor/custom-ui/printess-editor";

interface IEditorContext {
  editorDomain: string;
  editorVersion: string;
  apiDomain: string;
  shopToken: string;
  translationLanguage?: string;
  showLoadingScreen: boolean;
  theme: string | null;

  getBasketIdAsync(): Promise<string | null>;
  getUserIdAsync(): Promise<string | null>;

  onAddToBasketAsync(token: string, thumbnailUrl: string): void;
  onFormFieldChanged(name: string, value: string, tag: string, label: string, ffLabel: string): void;
  onPriceChanged(priceInfo: iExternalProductPriceInfo): void;
  onGoBack(saveToken: string, thumbnailUrl: string): void;
  onSave(saveToken: string, thumbnailUrl: string): void;
  onLoadButtonClicked(): void;
  onError(msg: string, data?: Record<string, string>): void;
  onTabClose?(evt: Event): void;
}

interface IPriceRelevantInfo {
  formFields: { name: string, value: string, formFieldLabel?: string | null, valueLabel?: string | null }[];
  pageCount?: number | null,
  minPages?: number | null,
  additionalPages?: number | null,
  variant?: IPrintessProductVariant | null;
}

export class PrintessEditorFrontend {
  private static _component: iPrintessComponent;
  private static _api: iPrintessApi;
  private static _currentContext: IEditorContext | null = null;
  private static _loader: any | null;
  private static _editorIsOpen: boolean = false;
  private static _currentTemplateNameOrSaveToken: string = "";
  private static _currentThumbnailUrl: string = "";

  private constructor() {

  }

  public static getComponent(): iPrintessComponent {
    return PrintessEditorFrontend._component || null;
  }

  public static getApi(): iPrintessApi | null {
    return PrintessEditorFrontend._api || null;
  }

  public static editorIsOpen(): boolean {
    return PrintessEditorFrontend._editorIsOpen;
  }

  public static getCurrentContext(): IEditorContext | null {
    return PrintessEditorFrontend._currentContext;
  }

  public static getCurrentTemplateNameOrSaveToken(): string {
    return PrintessEditorFrontend._currentTemplateNameOrSaveToken;
  }

  public static getCurrentThumbnailUrl(): string {
    return PrintessEditorFrontend._currentThumbnailUrl;
  }

  private static onTabCloseEventHandler(e: Event) {
    if (PrintessEditorFrontend._currentContext && typeof PrintessEditorFrontend._currentContext.onTabClose === "function") {
      PrintessEditorFrontend._currentContext.onTabClose(e);
    }
  }

  private static stripEditorVersion(editorVersion: string): string {
    editorVersion = (editorVersion ? editorVersion : "").trim();
    if (typeof editorVersion !== "undefined" && editorVersion != null) {
      if (!editorVersion) {
        editorVersion = "";
      } else {
        while (editorVersion.indexOf("/") == 0) {
          editorVersion = editorVersion.substring(1);
        }

        while (editorVersion.length > 0 && editorVersion[editorVersion.length - 1] === "/") {
          editorVersion = editorVersion.substring(0, editorVersion.length - 1);
        }
      }
    }
    return editorVersion;
  }

  private static getEditorLoaderUrl(editorDomain: string, editorVersion: string): { url: string, urlSettings: Record<string, any> } {
    editorDomain = editorDomain || "https://editor.printess.com/";
    const urlSettings: Record<string, string> = {};

    const hashIndex = editorDomain.indexOf("#");

    if (hashIndex > 0) {
      let json = editorDomain.substring(hashIndex + 1);

      if (json) {
        try {
          const decodedJson = JSON.parse(decodeURIComponent(json)) as Record<string, any>;

          if (decodedJson) {
            for (let propertyName in decodedJson) {
              if (decodedJson.hasOwnProperty(propertyName)) {
                urlSettings[propertyName] = decodedJson[propertyName];
              }
            }
          }
        } catch (e) {

        }
      }

      editorDomain = editorDomain.substring(0, hashIndex);
    }

    if (editorDomain.toLocaleLowerCase().endsWith("embed.html")) {
      editorDomain = editorDomain.substring(0, editorDomain.length - "embed.html".length);
    }

    if (!editorDomain.toLowerCase().endsWith(".html")) {
      editorDomain = PrintessSharedTools.sanitizeHost(editorDomain);

      if (editorVersion) {
        editorVersion = PrintessEditorFrontend.stripEditorVersion(editorVersion);

        editorDomain += editorVersion + (editorVersion ? "/" : "");
      }

      if (!editorDomain.toLowerCase().endsWith("printess-editor/")) {
        editorDomain += "printess-editor/";
      }


      editorDomain += 'loader.js';
    }

    if (editorDomain.toLowerCase().indexOf("https://") !== 0 && editorDomain.toLowerCase().indexOf("http://") !== 0) {
      editorDomain = "https://" + editorDomain;
    }

    return {
      url: editorDomain,
      urlSettings: urlSettings
    }
  }

  public static async preloadEditor(editorDomain: string, editorVersion: string): Promise<void> {
    if (!PrintessEditorFrontend._loader) {
      PrintessEditorFrontend._loader = await import(/* webpackIgnore: true */PrintessEditorFrontend.getEditorLoaderUrl(editorDomain, editorVersion).url);
    }
  }

  private static setViewportMeta() {
    const headElements = document.getElementsByTagName("head");

    if (headElements && headElements.length > 0) {
      let metaTag = headElements[0].querySelector('meta[name=viewport]');

      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", "viewport");
        headElements[0].appendChild(metaTag);
      }

      let content = metaTag.getAttribute("content");

      if (content) {
        if (content.indexOf("interactive-widget") < 0) {
          content += content ? ", " : "";

          content += "interactive-widget=resizes-content";

          metaTag.setAttribute("content", content);
        }
      } else {
        metaTag.setAttribute("content", "interactive-widget=resizes-content");
      }
    }
  }

  private static async embed(templateName: string, formFields: iFormFieldNameValue[], mergeTemplates: iMergeTemplate[], formFieldProperties?: iFormFieldProperty[], additionalAttachParams?: Record<string, any>): Promise<boolean> {
    if (!PrintessEditorFrontend._currentContext) {
      return false;
    }

    if (!templateName) {
      throw "No template name provided";
    }

    const component = document.querySelector("printess-component") || null;

    if (!component) {
      await PrintessEditorFrontend.preloadEditor(PrintessEditorFrontend._currentContext.editorDomain, PrintessEditorFrontend._currentContext.editorVersion);

      if (!PrintessEditorFrontend._loader) {
        return false;
      }

      PrintessEditorFrontend.setViewportMeta();

      const loadSaveToken = templateName.startsWith("st:");

      const attachParams = {
        ...(additionalAttachParams || {}),
        token: PrintessEditorFrontend._currentContext.shopToken,
        domain: PrintessEditorFrontend._currentContext.apiDomain || "api.printess.com",
        translationKey: PrintessEditorFrontend._currentContext.translationLanguage || "auto",
        div: undefined,
        mobileMargin: undefined,
        desktopMargin: undefined,
        templateName: templateName,
        formFields: !loadSaveToken ? formFields : [],
        mergeTemplates: !loadSaveToken ? mergeTemplates : null,
        suppressLoadingAnimation: PrintessEditorFrontend._currentContext.showLoadingScreen === false,
        formFieldProperties: formFieldProperties || [],
        basketId: await PrintessEditorFrontend._currentContext.getBasketIdAsync(),
        shopUserId: await PrintessEditorFrontend._currentContext.getUserIdAsync(),
        theme: PrintessEditorFrontend._currentContext.theme || "DEFAULT",
        buttons: null,
        useBCUILocalCode: false,
        skipExchangeStateApplication: true,
        addToBasketCallback: (token: string, thumbnailUrl: string): void => {
          PrintessEditorFrontend._currentTemplateNameOrSaveToken = token;
          PrintessEditorFrontend._currentThumbnailUrl = thumbnailUrl;

          PrintessEditorFrontend._currentContext?.onAddToBasketAsync(token, thumbnailUrl);
        },
        formFieldChangedCallback: (name: string, value: string, tag: string, label: string, ffLabel: string): void => {
          PrintessEditorFrontend._currentContext?.onFormFieldChanged(name, value, tag, label, ffLabel);
        },
        priceChangeCallback: (priceInfo: iExternalProductPriceInfo): void => {
          PrintessEditorFrontend._currentContext?.onPriceChanged(priceInfo);
        },
        backButtonCallback: (saveToken: string, thumbnailUrl: string): void => {
          PrintessEditorFrontend._currentTemplateNameOrSaveToken = saveToken;
          PrintessEditorFrontend._currentThumbnailUrl = thumbnailUrl;

          PrintessEditorFrontend._currentContext?.onGoBack(saveToken, thumbnailUrl);
        },
        saveTemplateCallback: (saveToken: string, type: "save" | "close", thumbnailUrl: string): void => {
          PrintessEditorFrontend._currentTemplateNameOrSaveToken = saveToken;
          PrintessEditorFrontend._currentThumbnailUrl = thumbnailUrl;

          PrintessEditorFrontend._currentContext?.onSave(saveToken, thumbnailUrl);

          if (type === "close") {
            PrintessEditorFrontend._currentContext?.onGoBack(saveToken, thumbnailUrl);
          }
        },
        loadTemplateButtonCallback: (): void => {
          PrintessEditorFrontend._currentContext?.onLoadButtonClicked();
        },
        errorCallback(msg: string, data?: Record<string, string>) {
          PrintessEditorFrontend._currentContext?.onError(msg, data);
        }
      };

      const printess = await PrintessEditorFrontend._loader.load(attachParams);

      PrintessEditorFrontend._api = printess.api;
      PrintessEditorFrontend._component = printess.ui;

      const printessComponent: HTMLElement | null = document.querySelector("printess-component");

      if (printessComponent) {
        if (!(<any>printessComponent).api) {
          (<any>printessComponent).api = this._api;
        }

        if (!(<any>printessComponent).component) {
          (<any>printessComponent).component = this._component;
        }
      }

      return true;
    }

    return false;
  }

  private static closeAllHtmlDialogs() {
    document.querySelectorAll(":not(.printess-owned) dialog,dialog:not(.printess-owned)").forEach((x) => {
      if (x && !x.classList.contains("printess-owned") && typeof (x as HTMLDialogElement).close === "function") {
        try {
          (x as HTMLDialogElement).close();
        } catch (ex) {
          console.error(ex);
        }
      }
    });
  }

  public static async show(context: IEditorContext, templateNameOrSaveToken: string, formFields: iFormFieldNameValue[], mergeTemplates: iMergeTemplate[], formFieldProperties?: iFormFieldProperty[], additionalAttachParams?: Record<string, any>): Promise<boolean> {
    if (PrintessEditorFrontend._editorIsOpen) {
      return false;
    }

    PrintessEditorFrontend._editorIsOpen = true;
    PrintessEditorFrontend._currentContext = context;
    PrintessEditorFrontend._currentTemplateNameOrSaveToken = templateNameOrSaveToken;

    //Make sure that html dialogs that are rendered by the browser in front of everything are closed
    PrintessEditorFrontend.closeAllHtmlDialogs();

    if (!await PrintessEditorFrontend.embed(templateNameOrSaveToken, formFields, mergeTemplates, formFieldProperties, additionalAttachParams)) {
      if (!PrintessEditorFrontend._api || !PrintessEditorFrontend._component) {
        PrintessEditorFrontend._editorIsOpen = false;
        PrintessEditorFrontend._currentContext = null;
        PrintessEditorFrontend._currentTemplateNameOrSaveToken = "";
        return false;
      }

      await PrintessEditorFrontend._api.loadTemplateAndFormFields(templateNameOrSaveToken, mergeTemplates, formFields, null, null, true);

      PrintessEditorFrontend._component.show();
    }

    const printessComponent: HTMLElement | null = document.querySelector("printess-component");

    if (printessComponent) {
      printessComponent.style.display = "block";
    }

    document.body.classList.add('hideAll');

    var root = document.getElementsByTagName('html');

    if (root && root.length > 0) {
      root[0].classList.add('printess-editor-open');
    }

    if (typeof PrintessEditorFrontend._currentContext.onTabClose === "function") {
      window.addEventListener('beforeunload', PrintessEditorFrontend.onTabCloseEventHandler);
      window.addEventListener('unload', PrintessEditorFrontend.onTabCloseEventHandler);
    }

    return true;
  }

  public static hide(): boolean {
    if (!PrintessEditorFrontend._editorIsOpen) {
      return false;
    }

    const printessComponent: HTMLElement | null = document.querySelector("printess-component");

    if (printessComponent) {
      printessComponent.style.display = "none";
    }

    window.removeEventListener('beforeunload', PrintessEditorFrontend.onTabCloseEventHandler);
    window.removeEventListener('unload', PrintessEditorFrontend.onTabCloseEventHandler);

    //Hide the web page scrolling
    document.body.classList.remove('hideAll');

    var root = document.getElementsByTagName('html');

    if (root && root.length > 0) {
      root[0].classList.remove('printess-editor-open');
    }

    if (PrintessEditorFrontend._component) {
      PrintessEditorFrontend._component.hide();
    }

    PrintessEditorFrontend._currentContext = null;
    PrintessEditorFrontend._currentTemplateNameOrSaveToken = "";
    PrintessEditorFrontend._currentThumbnailUrl = "";
    PrintessEditorFrontend._editorIsOpen = false;

    return true;
  }
}

export class PrintessEditor {
  private _integration: IIntegration;
  private _product: IPrintessProduct;
  private _variant: IPrintessProductVariant;
  private _printedRecordCount: number | null;
  private _currentNumberOfPages: number = 0;
  private _editorIsOpen: boolean = false;
  private _session: ISessionSettings = {};
  private _formFieldsAsProperties: ISaveFormFieldAsPropertyEntry[] = [];
  private _currentTemplateNameOrSaveToken: string;
  private _currentShopSaveData: Record<string, string> = {};
  private _pluginHost: PrintessPluginHost;

  private constructor(integration: IIntegration) {
    if (!integration) {
      throw "No shop integration provided.";
    }

    this._integration = integration;
    this._pluginHost = new PrintessPluginHost(() => {
      if (typeof integration.getPlugins === "function") {
        return integration.getPlugins();
      }

      return [];
    }, integration);

    this._pluginHost.registerPlugin(integration as any as IPlugin);

    const editorSettings = this._pluginHost.getEditorSettings({ integration: integration, product: {} as any as IPrintessProduct, type: "editor", variant: null });

    if (!editorSettings.shopToken) {
      throw "No shop token provided.";
    }
  }

  public editorIsOpen() {
    return PrintessEditorFrontend.editorIsOpen();
  }

  private getPluginContext(variant: IPrintessProductVariant | null): IPluginContext {
    return {
      integration: this._integration,
      type: "editor",
      product: this._product,
      variant: variant || null
    };
  }

  public setCurrentProjectName(projectName: string) {
    this._session.projectName = projectName || "";
  }

  public getPluginHost(): IPlugin {
    return this._pluginHost;
  }

  public getComponent(): iPrintessComponent {
    return PrintessEditorFrontend.getComponent();
  }

  public getApi(): iPrintessApi | null {
    return PrintessEditorFrontend.getApi();
  }

  public getProduct(): IPrintessProduct {
    return this._product;
  }

  public getVariant(): IPrintessProductVariant {
    return this._variant;
  }

  public async updateProduct(): Promise<boolean> {
    if (this._editorIsOpen) {
      return false;
    }

    this._product = await this._pluginHost.getProductAsync(this.getPluginContext(null));

    this._variant = await this._pluginHost.getCurrentVariantAsync(this.getPluginContext(null), null);

    return true;
  }

  public getIntegration(): IIntegration {
    return this._integration;
  }

  public static async getOrGenerateBasketId(pluginHost: IPluginHost, pluginContext: IPluginContext): Promise<string | null> {
    let ret = typeof pluginHost.getBasketIdAsync === "function" ? await pluginHost.getBasketIdAsync(pluginContext, "") : "";

    if (!ret) {
      if (!ret) {
        try {
          ret = localStorage.getItem("printessUniqueBasketId");
        }
        catch (e) {
          console.warn("Unable to read basket id from local storage.");
        }
      }

      if (!ret) {
        ret = (window as any)["printessUniqueBasketId"];
      }

      if (!ret) {
        ret = PrintessSharedTools.generateUUID() + "_" + new Date().valueOf().toString();

        try {
          localStorage.setItem("printessUniqueBasketId", ret);
        }
        catch (e) {
          (window as any)["printessUniqueBasketId"] = ret;

          console.warn("Unable to write user id to local storage.");
        }
      }
    }

    return ret || null;
  }

  public async getPriceRelevantData(priceInfo?: iExternalProductPriceInfo | null): Promise<IPriceRelevantInfo> {
    const ret: IPriceRelevantInfo = {
      formFields: []
    };

    const priceRelevantData = priceInfo || this.getApi()?.getPriceRelevantData();
    const pageInfo = this.getApi()?.getAllDocsAndSpreads(true).find(x => x.isBook === true);
    const priceRelevantFormFields: { name: string, value: string, formFieldLabel?: string | null, valueLabel?: string | null }[] = [];

    if (pageInfo && typeof pageInfo.minPages !== "undefined" && pageInfo.minPages > 0) {
      ret.minPages = pageInfo.minPages;

      if (typeof pageInfo.pageCount !== undefined && pageInfo.pageCount > 0) {
        ret.pageCount = pageInfo.pageCount;
        ret.additionalPages = Math.abs(pageInfo.pageCount - pageInfo.minPages);
      }
    }

    if (priceRelevantData?.priceRelevantFormFields) {
      for (const formFieldName in priceRelevantData.priceRelevantFormFields) {
        if (priceRelevantData.priceRelevantFormFields.hasOwnProperty(formFieldName)) {
          const unmapped = await this.reverseFormFieldMapping(formFieldName, priceRelevantData.priceRelevantFormFields[formFieldName].value, (<any>priceRelevantData.priceRelevantFormFields[formFieldName]).uiLabel || "", (<any>priceRelevantData.priceRelevantFormFields[formFieldName]).label || "", typeof this._pluginHost.getFormFieldMappingsAsync === "function" ? (await this._pluginHost.getFormFieldMappingsAsync(this.getPluginContext(null), null)) : null);

          priceRelevantFormFields.push({
            ...priceRelevantData.priceRelevantFormFields[formFieldName],
            name: unmapped.name,
            value: unmapped.value,
            formFieldLabel: (<any>priceRelevantData.priceRelevantFormFields[formFieldName]).uiLabel || null,
            valueLabel: (<any>priceRelevantData.priceRelevantFormFields[formFieldName]).label || null
          });
        }
      }
    }

    const currentVariant: IPrintessProductVariant | null = await this._pluginHost.getCurrentVariantAsync(this.getPluginContext(null), null);

    currentVariant?.getVariantOptions().forEach((nameAndValue) => {
      ret.formFields.push({
        name: nameAndValue.name,
        value: nameAndValue.value
      });
    });

    priceRelevantFormFields.forEach((formField) => {
      const lowerFFName: string = formField.name.toLowerCase();
      const lowerFFLabel: string | null = formField.formFieldLabel ? formField.formFieldLabel.toLowerCase() : null;

      let index = ret.formFields.findIndex(x => x.name.toLowerCase() === lowerFFName);

      if (index < 0 && lowerFFLabel !== null) {
        index = ret.formFields.findIndex(x => x.name.toLowerCase() === lowerFFLabel);
      }

      if (index > -1) {
        ret.formFields[index] = formField;
      } else {
        ret.formFields.push(formField);
      }
    });

    ret.variant = await this.getVariantByCurrentFormFieldValues(ret.formFields);

    if (pageInfo?.pageCount) {
      ret.pageCount = pageInfo.pageCount;
    } else if (priceRelevantData?.pageCount) {
      ret.pageCount = priceRelevantData.pageCount;
    }

    if (pageInfo?.minPages) {
      ret.minPages = pageInfo.minPages;

      if (ret.pageCount) {
        ret.additionalPages = Math.abs(ret.pageCount - pageInfo.minPages);
      }
    }

    return ret;
  }

  private async getUserId(): Promise<string | null> {
    return typeof this._pluginHost.getUserIdAsync === "function" ? await this._pluginHost.getUserIdAsync(this.getPluginContext(this._variant), null) : null;
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

  public static MergeFormFieldValues(formFields1: INameValuePair[], formFields2: INameValuePair[]): INameValuePair[] {
    const ret = [...formFields1];

    formFields2.forEach((x) => {
      PrintessEditor.setFormFieldArrayValue(ret, x.name, x.value);
    });

    return ret;
  }

  private getVariantOptionsForFormfield(formFieldName: string, formFieldLabel: string): { optionName: string, values: string[] } | null {
    const lowerFormFieldName = (formFieldName || "").toLowerCase();
    const lowerFormFieldLabel = (formFieldLabel || "").toLowerCase();
    const productOptions = this._product.getProductOptions();

    let option = productOptions.find((option) => {
      return option.name.toLowerCase() === lowerFormFieldName;
    });

    if (!option) {
      option = productOptions.find((option) => {
        return option.name.toLowerCase() === lowerFormFieldLabel;
      });
    }

    return !option ? null : {
      optionName: option.name,
      values: option.values
    };
  }

  private getVariantOptionAndValue(formFieldName: string, value: string, formFieldLabel: string, valueLabel: string): { name: string, value: string } | null {
    const optionValues = this.getVariantOptionsForFormfield(formFieldName, formFieldLabel);

    if (optionValues) {
      const lowerValue = (value || "").toLowerCase();
      const lowerValueLabel = (valueLabel || "").toLowerCase();

      let variantOptionValue = optionValues.values.filter((x) => { return (x || "").toLowerCase() === lowerValue; });

      if (!variantOptionValue || variantOptionValue.length === 0) {
        variantOptionValue = optionValues.values.filter((x) => { return (x || "").toLowerCase() === lowerValueLabel; });
      }

      if (variantOptionValue && variantOptionValue.length > 0) {
        return {
          name: optionValues.optionName,
          value: variantOptionValue[0]
        }
      }
    }

    return null;
  }

  private async onAddToBasketAsync(saveToken: string, thumbnailUrl: string): Promise<void> {
    const priceRelevantData = await this.getPriceRelevantData();

    if (priceRelevantData.variant) {
      this._variant = priceRelevantData.variant;
    }

    const propertyValuesToWrite: Record<string, string> = {
      ...this._session.formFieldsAsProperties || {},
      _printessSettings: JSON.stringify({
        ...this._session,
        printTemplateName: priceRelevantData.variant?.getPrintTemplateName() ? priceRelevantData.variant?.getPrintTemplateName() : (this._product.getPrintTemplateName() ? this._product.getPrintTemplateName() : this._session.printTemplateName || ""),
      })
    };

    if (priceRelevantData.pageCount) {
      propertyValuesToWrite["_printessPageCount"] = priceRelevantData.pageCount.toString();

      if (priceRelevantData.minPages) {
        propertyValuesToWrite["_printessMinPages"] = priceRelevantData.minPages.toString();
      }

      if (priceRelevantData.additionalPages) {
        propertyValuesToWrite["_printessAdditionalPages"] = priceRelevantData.additionalPages.toString();
      }

      try {
        const spine = this.getApi()?.getSpine();

        if (spine) {
          propertyValuesToWrite["_printessSpineWidth"] = JSON.stringify(spine);
        }
      } catch (e) {
        console.error("Unable to query spine width: " + JSON.stringify(e));
      }
    }

    if (priceRelevantData.formFields && priceRelevantData.formFields.length > 0) {
      propertyValuesToWrite["_printessFormFields"] = JSON.stringify(priceRelevantData.formFields.map((x) => {
        const ret: { name: string, value: string, ffLabel?: string, valueLabel?: string } = {
          name: x.name,
          value: x.value,
        };

        if (x.formFieldLabel) {
          ret.ffLabel = x.formFieldLabel;
        }

        if (x.valueLabel) {
          ret.valueLabel = x.valueLabel;
        }

        return ret;
      }));
    }

    if (this._product.getDropshipProductDefinitionId() > -1) {
      propertyValuesToWrite["_printessProductDefinitionId"] = this._product.getDropshipProductDefinitionId().toString() || "";
    }

    const params = {
      ...priceRelevantData,
      saveToken: saveToken,
      thumbnailUrl: thumbnailUrl,
      propertyValuesToWrite: propertyValuesToWrite,
      previousSaveToken: this._currentTemplateNameOrSaveToken,
      originalSaveToken: this._session.originalSaveToken || ""
    };

    if (!(await this._pluginHost.doAllowAddToBasketAsync(this.getPluginContext(priceRelevantData.variant || null), params))) {
      return;
    }

    if (priceRelevantData.variant) {
      await this._pluginHost.onAddToBasketAsync(this.getPluginContext(priceRelevantData.variant || null), {
        saveToken: saveToken,
        thumbnailUrl: thumbnailUrl,
        propertyValuesToWrite: propertyValuesToWrite,
        previousSaveToken: this._currentTemplateNameOrSaveToken,
        originalSaveToken: this._session.originalSaveToken || "",
        variant: priceRelevantData.variant
      });

      // await this._integration.onAddToBasketAsync(saveToken, thumbnailUrl, this._variant, propertyValuesToWrite);
    }

    await this.hideInternal(true, saveToken, thumbnailUrl);
  }

  private async getVariantByCurrentFormFieldValues(formFieldValues: (INameValuePair | { name: string, value: string, formFieldLabel: string, valueLabel: string })[]): Promise<IPrintessProductVariant | null> {
    const currentVariantValues: INameValuePair[] = this._variant.getVariantOptions() || [];

    formFieldValues.forEach((entry) => {
      const variantOption = this.getVariantOptionAndValue(entry.name, entry.value, typeof (<any>entry).formFieldLabel !== "undefined" ? (<any>entry).formFieldLabel : "", typeof (<any>entry).valueLabel !== "undefined" ? (<any>entry).valueLabel : "");

      if (variantOption) {
        let foundItem = currentVariantValues.find((x) => {
          return x.name === variantOption.name;
        });

        if (!foundItem) {
          foundItem = {
            name: variantOption.name,
            value: variantOption.value
          };

          currentVariantValues.push(foundItem);
        } else {
          foundItem.value = variantOption.value;
        }
      }
    });

    const variant = await this._pluginHost.getVariantByProductOptionsAsync(this.getPluginContext(null), currentVariantValues, null);

    return variant;
  }

  private async onFormFieldChangedAsync(name: string, value: string, tag: string, label: string, ffLabel: string): Promise<void> {
    let entry = this._formFieldsAsProperties.find((x) => { x.formfieldName === name });

    if (entry) {
      if (!this._session.formFieldsAsProperties) {
        this._session.formFieldsAsProperties = {};
      }

      this._session.formFieldsAsProperties[entry.propertyName || entry.formfieldName] = value;
    } else {
      entry = this._formFieldsAsProperties.find((x) => { x.formfieldName === ffLabel });

      if (entry) {
        if (!this._session.formFieldsAsProperties) {
          this._session.formFieldsAsProperties = {};
        }

        this._session.formFieldsAsProperties[entry.propertyName || entry.formfieldName] = label;
      }
    }

    const variant = await this.getVariantByCurrentFormFieldValues([{ name: name, value: value, formFieldLabel: ffLabel, valueLabel: label }]);

    if (variant) {
      //Change the current selected variant
      this._variant = variant;
    }

    let currentFormFields: INameValuePair[] | null = null;

    if (typeof this._pluginHost.getFormFieldsAsync === "function") {
      currentFormFields = await this._pluginHost.getFormFieldsAsync(this.getPluginContext(variant), []);
    }

    await this._pluginHost.onFormfieldChangedAsync(this.getPluginContext(variant), {
      formFieldName: name,
      formFieldValue: value,
      formFieldLabel: ffLabel,
      formFieldValueLabel: label,
      formFieldTag: tag,
      formFields: currentFormFields || [],
      newVariant: variant || null
    });
  }

  private async onPriceChangedAsync(priceInfo: iExternalProductPriceInfo): Promise<void> {
    const priceRelevantData = await this.getPriceRelevantData(priceInfo);
    const variant = priceRelevantData.variant || this._variant;

    if (priceRelevantData.pageCount && priceRelevantData.pageCount !== this._currentNumberOfPages) {
      this._currentNumberOfPages = priceRelevantData.pageCount;

      await this._pluginHost.onPageCountChangedAsync(this.getPluginContext(variant), {
        ...priceRelevantData,
        pageCount: priceRelevantData.pageCount
      });

      if (this._product.getSettings()?.pageCountOptionName) {
        const mapped = await this.reverseFormFieldMapping(this._product.getSettings()?.pageCountOptionName || "", priceInfo.pageCount.toString(), "", "", typeof this._pluginHost.getFormFieldMappingsAsync === "function" ? (await this._pluginHost.getFormFieldMappingsAsync(this.getPluginContext(priceRelevantData.variant || null))) : null);

        await this.onFormFieldChangedAsync(mapped.name, mapped.value, "", "", "");
      }
    }

    if (priceInfo.hasCirculationColumn && this._printedRecordCount !== priceInfo.printedRecordsCount) {
      this._printedRecordCount = priceInfo.printedRecordsCount;

      await this._pluginHost.onPrintedRecordCountChangedAsync(this.getPluginContext(variant || null), {
        printedRecordCount: this._printedRecordCount
      });
    }

    let currentPrice: number = variant.getPrice() * 100;

    if (typeof this._pluginHost.getPriceInCentAsync === "function") {
      currentPrice = await this._pluginHost.getPriceInCentAsync(this.getPluginContext(variant || null), currentPrice, {
        ...priceRelevantData,
        currentFormFieldValues: priceRelevantData.formFields,
        numberOfPages: this._currentNumberOfPages,
        printedRecordCount: typeof this._printedRecordCount === "number" ? this._printedRecordCount : 0
      });
    }

    let renderedPrice: string = parseFloat("" + (currentPrice / 100)).toFixed(2);

    if (typeof this._pluginHost.renderPriceAsync === "function") {
      renderedPrice = await this._pluginHost.renderPriceAsync(this.getPluginContext(variant || null), currentPrice, "", {
        ...priceRelevantData,
        currentFormFieldValues: priceRelevantData.formFields,
        price: currentPrice,
        numberOfPages: this._currentNumberOfPages,
        printedRecordCount: this._printedRecordCount != null ? this._printedRecordCount : 0
      });
    }

    let additionalPriceInfo: IPriceInformation = {
      productName: (variant.getLabel() ? variant.getLabel() : (this._product.getLabel() ? this._product.getLabel() : "")),
      legalNotice: "",
      infoUrl: ""
    };

    if (typeof this._pluginHost.getPriceInformationAsync !== "undefined") {
      additionalPriceInfo = await this._pluginHost.getPriceInformationAsync(this.getPluginContext(variant), additionalPriceInfo, {
        ...priceRelevantData,
        currentFormFieldValues: priceRelevantData.formFields,
        numberOfPages: this._currentNumberOfPages,
        printedRecordCount: this._printedRecordCount != null ? this._printedRecordCount : 0
      });
    }

    let oldPriceInCent: number | null = null;

    if (typeof this._pluginHost.getOldPriceInCentAsync === "function") {
      oldPriceInCent = await this._pluginHost.getOldPriceInCentAsync(this.getPluginContext(variant), currentPrice, {
        ...priceRelevantData,
        currentFormFieldValues: priceRelevantData.formFields,
        numberOfPages: this._currentNumberOfPages,
        printedRecordCount: this._printedRecordCount != null ? this._printedRecordCount : 0
      });
    }

    let displayOldPrice: string = "";

    if (oldPriceInCent !== null) {
      displayOldPrice = parseFloat("" + ((oldPriceInCent ?? 100) / 100)).toFixed(2);

      if (typeof this._pluginHost.renderPriceAsync === "function") {
        displayOldPrice = await this._pluginHost.renderPriceAsync(this.getPluginContext(variant), oldPriceInCent, displayOldPrice, {
          ...priceRelevantData,
          currentFormFieldValues: priceRelevantData.formFields,
          price: oldPriceInCent,
          numberOfPages: this._currentNumberOfPages,
          printedRecordCount: this._printedRecordCount != null ? this._printedRecordCount : 0
        });
      }
    }

    let categoryLabels: Record<string, string> | null = null;
    if (typeof this._pluginHost.getPriceCategoryLabelsAsync === "function") {
      const labels = await this._pluginHost.getPriceCategoryLabelsAsync(this.getPluginContext(variant), [], {
        ...priceRelevantData,
        currentFormFieldValues: priceRelevantData.formFields,
        numberOfPages: this._currentNumberOfPages,
        printedRecordCount: typeof this._printedRecordCount === "number" ? this._printedRecordCount : 0
      });

      if (labels) {
        labels.forEach((x) => {
          categoryLabels = categoryLabels ? categoryLabels : {};

          categoryLabels[x.name] = x.value;
        });
      }
    }

    const editorSettings = this._pluginHost.getEditorSettings(this.getPluginContext(this._variant), null);

    let info: iExternalPriceDisplay = {
      price: editorSettings.hidePriceInEditor === true ? "" : renderedPrice,
      productName: editorSettings.displayProductName ? additionalPriceInfo.productName : "",
      legalNotice: additionalPriceInfo.legalNotice,
      infoUrl: additionalPriceInfo.infoUrl,
      oldPrice: editorSettings.hidePriceInEditor === true ? "" : displayOldPrice,
      priceCategoryLabels: categoryLabels || undefined
    };

    if (typeof this._pluginHost.getPricingDisplayValuesAsync === "function") {
      info = await this._pluginHost.getPricingDisplayValuesAsync(this.getPluginContext(variant), info, priceInfo);
    }

    PrintessEditorFrontend.getComponent()?.refreshPriceDisplay(info);
  }

  private async onGoBackAsync(saveToken: string, thumbnailUrl: string): Promise<void> {
    this.hideInternal(false, saveToken, thumbnailUrl);
  }

  private async onSave(saveToken: string, thumbnailUrl: string) {
    const saveParams = {
      product: this._product,
      variant: this._variant,

    };

    const doAllow = await this._pluginHost.doAllowSaveAsync(this.getPluginContext(this._variant), {
      saveToken: saveToken,
      thumbnailUrl: thumbnailUrl,
      previousSaveToken: this._currentTemplateNameOrSaveToken,
      originalSaveToken: this._session.originalSaveToken || ""
    });

    if (doAllow !== true) {
      return;
    }

    await this._pluginHost.onSaveAsync(this.getPluginContext(this._variant), {
      saveToken: saveToken,
      thumbnailUrl: thumbnailUrl,
      previousSaveToken: this._currentTemplateNameOrSaveToken,
      originalSaveToken: this._session.originalSaveToken || ""
    });
  }

  private async onLoadButtonmClicked() {
    const saveParams = {
      product: this._product,
      variant: this._variant,

    };

    await this._pluginHost.onLoadButtonClickedAsync(this.getPluginContext(this._variant), {
      previousSaveToken: this._currentTemplateNameOrSaveToken,
      originalSaveToken: this._session.originalSaveToken || ""
    });
  }

  private async reverseFormFieldMapping(formFieldName: string, formFieldValue: string, formFieldLabel: string, valueLabel: string, mappings: Record<string, IFormFieldMapping> | null): Promise<INameValuePair> {
    if (!mappings) {
      if (typeof this._pluginHost.unmapFormFieldAsync === "function") {
        const ret = await this._pluginHost.unmapFormFieldAsync(this.getPluginContext(this._variant), { name: formFieldName, value: formFieldValue }, {
          formFieldName: formFieldName,
          formFieldValue: formFieldValue,
          formFieldLabel: formFieldLabel,
          formFieldValueLabel: valueLabel,
          mappings: mappings
        });

        return {
          name: ret.name,
          value: typeof ret.value === "string" ? ret.value : ""
        }
      }
    }

    const lowerPrintessName = (formFieldName || "").toLowerCase();
    const lowerPrintessValue = (formFieldValue || "").toLowerCase();

    for (const shopName in mappings) {
      if (mappings.hasOwnProperty(shopName)) {
        if ((mappings[shopName].formField).toLowerCase() === lowerPrintessName) {
          formFieldName = shopName;

          for (const shopValue in mappings[shopName].values) {
            if (mappings[shopName].values.hasOwnProperty(shopValue)) {
              if ((mappings[shopName].values[shopValue] || "").toLowerCase() === lowerPrintessValue) {
                formFieldValue = shopValue;

                break;
              }
            }
          }

          break;
        }
      }
    }

    const ret = {
      name: formFieldName,
      value: formFieldValue
    };

    if (typeof this._pluginHost.unmapFormFieldAsync === "function") {
      const _ret = await this._pluginHost.unmapFormFieldAsync(this.getPluginContext(this._variant), { name: formFieldName, value: formFieldValue }, {
        formFieldName: formFieldName,
        formFieldValue: formFieldValue,
        formFieldLabel: formFieldLabel,
        formFieldValueLabel: valueLabel,
        mappings: mappings
      });

      return {
        name: _ret.name,
        value: _ret.value
      }
    } else {
      return ret;
    }
  }

  private createContext(): IEditorContext {
    const that = this;

    const customLoader = typeof this._pluginHost.getCustomLoader === "function" ? this._pluginHost.getCustomLoader(this.getPluginContext(this._variant)) : null;
    const editorSettings = this._pluginHost.getEditorSettings(this.getPluginContext(this._variant));

    const ret: IEditorContext = {
      editorDomain: editorSettings.editorDomain || "editor.printess.com",
      editorVersion: editorSettings.editorVersion || "",
      apiDomain: editorSettings.apiDomain || "api.printess.com",
      shopToken: editorSettings.shopToken || "",
      translationLanguage: editorSettings.translationKey,
      showLoadingScreen: !(customLoader && typeof customLoader.show === "function" && typeof customLoader.hide === "function"),
      theme: (<any>this._product)?.theme?.value || editorSettings.theme || "DEFAULT",

      getBasketIdAsync(): Promise<string | null> {
        return PrintessEditor.getOrGenerateBasketId(that._pluginHost, that.getPluginContext(null));
      },
      getUserIdAsync(): Promise<string | null> {
        return that.getUserId();
      },
      onAddToBasketAsync(token: string, thumbnailUrl: string): void {
        that.onAddToBasketAsync(token, thumbnailUrl);
      },
      onFormFieldChanged(name: string, value: string, tag: string, label: string, ffLabel: string): void {
        if (typeof that._pluginHost.getFormFieldMappingsAsync === "function") {
          that._pluginHost.getFormFieldMappingsAsync(that.getPluginContext(that._variant)).then((mapping) => {
            that.reverseFormFieldMapping(name, value, ffLabel, label, mapping).then((mapped) => {
              that.onFormFieldChangedAsync(mapped.name, mapped.value, tag, label, ffLabel);
            });
          });
        } else {
          that.reverseFormFieldMapping(name, value, ffLabel, label, null).then((mapped) => {
            that.onFormFieldChangedAsync(mapped.name, mapped.value, tag, label, ffLabel);
          });
        }
      },
      onPriceChanged(priceInfo: iExternalProductPriceInfo): void {
        that.onPriceChangedAsync(priceInfo);
      },
      onGoBack(saveToken: string, thumbnailUrl: string): void {
        that.onGoBackAsync(saveToken, thumbnailUrl);
      },
      onSave(saveToken: string, thumbnailUrl: string): void {
        that.onSave(saveToken, thumbnailUrl);
      },
      onLoadButtonClicked(): void {
        that.onLoadButtonmClicked();
      },
      onError(msg: string, data?: Record<string, string>): void {
        if (typeof that._pluginHost.onError === "function") {
          that._pluginHost.onError(that.getPluginContext(that._variant), {
            errorMessage: msg,
            params: data
          });
        }
      },
      onTabClose: this._pluginHost.hasTabCloseHandlers() ? function (e: Event) { that._pluginHost.OnTabClose(that.getPluginContext(that._variant), e); } : undefined
    };

    return ret;
  }

  public static async applyFormFieldMappings(pluginHost: IPluginHost, pluginContext: IPluginContext, formFields: INameValuePair[], mappings: Record<string, IFormFieldMapping> | null): Promise<INameValuePair[]> {
    let ret: INameValuePair[] = [];

    formFields.forEach((x) => {
      if (!mappings) {
        ret.push({
          name: x.name || "",
          value: x.value
        });
      } else {
        const lowerFormFieldName = (x.name || "").toLowerCase();
        const lowerFormFieldValue = (x.value || "").toLowerCase();

        let printessFormFieldName = x.name;
        let printessFormFieldValue = x.value;

        for (const shopName in mappings) {
          if (mappings.hasOwnProperty(shopName)) {
            if ((shopName || "").toLowerCase() === lowerFormFieldName) {
              printessFormFieldName = mappings[shopName].formField;

              for (const shopValue in mappings[shopName].values) {
                if (mappings[shopName].values.hasOwnProperty(shopValue)) {
                  if ((shopValue || "").toLowerCase() === lowerFormFieldValue) {
                    printessFormFieldValue = mappings[shopName].values[shopValue];

                    break;
                  }
                }
              }

              break;
            }
          }
        }

        ret.push({
          name: printessFormFieldName || "",
          value: printessFormFieldValue
        });
      }
    });

    if (typeof pluginHost.mapFormFielsdAsync === "function") {
      ret = await pluginHost.mapFormFielsdAsync(pluginContext, ret, {
        mappings: mappings
      });
    }

    return ret;
  }

  public static async create(integration: IIntegration): Promise<PrintessEditor | null> {
    const ret = new PrintessEditor(integration);

    await ret.updateProduct();

    if (typeof ret._pluginHost.onInitialized === "function") {
      ret._pluginHost.onInitialized(ret._integration, "editor");
    }

    return ret;
  }

  private async getPhotobookSettings(variant: IPrintessProductVariant, attachParams: Record<string, any>): Promise<iExternalBookSettings | null> {
    let photobookSettings: iExternalBookSettings | null = null;//(additionalAttachParams (<iExternalBookSettings>additionalAttachParams["bookSettings"]) || null;

    if (attachParams && attachParams["bookSettings"]) {
      photobookSettings = (<iExternalBookSettings>attachParams["bookSettings"]);
    }

    photobookSettings = await this._pluginHost.getPhotobookSettingsAsync(this.getPluginContext(variant), photobookSettings);

    return photobookSettings || null;
  }
  public async show(templateNameOrSaveToken: string, session?: ISessionSettings): Promise<boolean> {
    if (this._editorIsOpen) {
      return false;
    }

    this._editorIsOpen = true;

    this._session = session ? { ...session } : {};

    this._currentShopSaveData = {};

    this._formFieldsAsProperties = PrintessPluginHost.parseFormFieldsAsProperties(await this._pluginHost.getFormFieldsAsPropertiesAsync(this.getPluginContext(this._variant)));

    this.updateProduct();

    templateNameOrSaveToken = templateNameOrSaveToken || "";
    let formFields: INameValuePair[] = [];
    const templateNameToApply = templateNameOrSaveToken ? templateNameOrSaveToken : (this._variant && this._variant.getTemplateName() ? this._variant.getTemplateName() : this._product.getTemplateName() || "");
    const templateNameIsSaveToken: boolean = templateNameOrSaveToken.startsWith("st:");
    const formFieldMappings = await this._pluginHost.getFormFieldMappingsAsync(this.getPluginContext(this._variant));

    this._currentTemplateNameOrSaveToken = templateNameIsSaveToken ? templateNameToApply : "";

    const mergeTemplates = templateNameIsSaveToken ? [] : (this._variant.getMergeTemplates() ? PrintessSharedTools.parseMergeTemplate(this._variant.getMergeTemplates()) : (this._product.getMergeTemplates() ? PrintessSharedTools.parseMergeTemplate(this._product.getMergeTemplates()) : []));

    if (!templateNameIsSaveToken) {
      formFields = await PrintessEditor.applyFormFieldMappings(this._pluginHost, this.getPluginContext(this._variant), PrintessEditor.MergeFormFieldValues(await this._pluginHost.getFormFieldsAsync(this.getPluginContext(this._variant), formFields), this._variant.getVariantOptions()), formFieldMappings);

      //Apply photobook theme
      if (this._product && this._product.getSettings() && this._product.getSettings()?.photobookTheme) {
        PrintessEditor.setFormFieldArrayValue(formFields, "PHOTOBOOK_THEME", this._product.getSettings()?.photobookTheme || "");
      }
    }

    let attachParams: Record<string, any> = {};

    if (typeof this._pluginHost.getAttachParametersAsync === "function") {
      attachParams = {
        templateVersion: "publish",
        ...attachParams,
        ...await this._pluginHost.getAttachParametersAsync(this.getPluginContext(this._variant))
      };
    }

    let supportsSaving = false;

    if (typeof this._pluginHost.supportsSavingAsync === "function") {
      supportsSaving = await this._pluginHost.supportsSavingAsync(this.getPluginContext(this._variant));
    }

    if (supportsSaving) {
      const that = this;

      attachParams["isShopUserLoggedInCallback"] = async (): Promise<boolean> => {
        const userId = await that.getUserId();
        let loggedIn = false;

        if (typeof userId !== undefined && userId !== null && userId) {
          loggedIn = true;
        }

        if (typeof that._pluginHost.userIsLoggedInAsync === "function") {
          loggedIn = await that._pluginHost.userIsLoggedInAsync(that.getPluginContext(that._variant));
        }

        return loggedIn;
      };

      attachParams["getShopDataCallback"] = async (): Promise<IShopData> => {
        let formFieldValues: INameValuePair[] = [];

        if (typeof that._pluginHost.getFormFieldsAsync === "function") {
          formFieldValues = await that._pluginHost.getFormFieldsAsync(that.getPluginContext(that._variant), []);
        }

        let shopData: Record<string, any> = {
          ...this._currentShopSaveData
        };

        formFieldValues.forEach((x) => {
          shopData[x.name] = x.value;
        });

        const productName = that._variant?.getLabel() || that._product.getLabel();

        const editorSettings = that._pluginHost.getEditorSettings(that.getPluginContext(that._variant));

        const params: IShopData = {
          product: {
            id: that._product.getId(),
            displayName: productName,
            thumbnailUrl: that._product.getThumbnailUrl(that._variant),
            shopUrl: that._product.getUrl(that._variant)
          },
          shopId: editorSettings.shopDomain || "",
          shopUserId: await that.getUserId() || "",
          data: shopData
        };

        let ret: IShopData | null = params;

        if (typeof that._pluginHost.getShopSaveDataAsync === "function") {
          ret = await that._pluginHost.getShopSaveDataAsync(that.getPluginContext(that._variant), params);
        }

        return ret || params;
      };

      attachParams["shopLoginCallback"] = (type: "register" | "login", saveToken: string, thumbnailUrl: string, displayName: string): void => {
        attachParams["getShopDataCallback"]().then((saveData: IShopData) => {
          that._pluginHost.onLoginAsync(that.getPluginContext(that._variant), {
            saveToken,
            thumbnailUrl,
            displayName,
            shopSaveData: saveData,
            type
          }).then(() => {
            // that._integration.doLogin(type, saveToken, thumbnailUrl, displayName);
          });
        });
      };

      attachParams["getShopSavedDataCallback"] = (shopData: IShopData): void => {
        that._currentShopSaveData = <Record<string, string>>shopData.data || {};

        if ((<any>shopData).displayName) {
          that._session.projectName = (<any>shopData).displayName;
        }

        if (that._currentShopSaveData) {
          const promises: Promise<void>[] = [];

          for (const property in that._currentShopSaveData) {
            if (that._currentShopSaveData.hasOwnProperty(property)) {
              promises.push(that.onFormFieldChangedAsync(property, this._currentShopSaveData[property], "", "", ""));
            }
          }
        }
      };

      attachParams["getShopProjectDisplayNameCallback"] = () => {
        return this._session.projectName || that._product.getLabel(); //that._variant?.getLabel() ||
      }

      attachParams["getShopProductDisplayNameCallback"] = () => {
        return this._session.projectName || that._product.getLabel(); //that._variant?.getLabel() ||
      }
    }

    const formFieldProperties: iFormFieldProperty[] = typeof this._pluginHost.getFormFieldPropertiesAsync === "function" ? (await this._pluginHost.getFormFieldPropertiesAsync(this.getPluginContext(this._variant))) : [];

    if (!(await this._pluginHost.doAllowOpenAsync(this.getPluginContext(this._variant), {
      formFieldProperties: formFieldProperties,
      formFields: formFields,
      mergeTemplates: mergeTemplates,
      templateName: templateNameToApply
    }))) {
      this._editorIsOpen = false;
      return false;
    }

    const photobookSettings = await this.getPhotobookSettings(this._variant, attachParams);

    if (attachParams["bookSettings"]) {
      delete attachParams["bookSettings"];
    }

    if (await PrintessEditorFrontend.show(this.createContext(), templateNameToApply, formFields, mergeTemplates, formFieldProperties, attachParams)) {
      if ((this._product.getSettings()?.productType || "").toLocaleLowerCase() !== "magicphotobook" && this._product.getSettings()?.pageCountOptionName) {
        const that = this;
        const pageCountFormField = formFields.filter((ff) => {
          return ff.name === this._product.getSettings()?.pageCountOptionName;
        });

        if (pageCountFormField && pageCountFormField.length > 0) {
          const number = Number(pageCountFormField[0].value);

          if (typeof pageCountFormField[0].value === 'string' && !Number.isNaN(number) && Number.isFinite(number) && Number.isInteger(number) && number > 0) {
            try {
              await this.getApi()?.setBookInsidePages(number);
            } catch (ex) {
              console.error(ex);
            }
          }
        }
      }

      if (photobookSettings) {
        try {
          await this.getApi()?.adjustBook(photobookSettings);
        } catch (e) {
          console.error(e);
        }
      }

      //In case of save token opening, formField changed is not called for price relevant data, we have to do that now
      if ((templateNameToApply || "").toLowerCase().startsWith("st:")) {
        const priceRelevantData = await this.getPriceRelevantData();

        if (priceRelevantData.formFields) {
          const that = this;

          await Promise.all(priceRelevantData.formFields.map(async (x) => {
            await that.onFormFieldChangedAsync(x.name, x.value, "", x.valueLabel || "", x.formFieldLabel || "");
          }));
        }
      }

      await this._pluginHost.onOpenAsync(this.getPluginContext(this._variant), {
        formFieldProperties: formFieldProperties,
        formFields: formFields,
        mergeTemplates: mergeTemplates,
        templateName: templateNameToApply
      });

      return true;
    } else {
      this._editorIsOpen = false;

      return false;
    }
  }

  public hide(): Promise<boolean> {
    return this.hideInternal(false, "", "");
  }

  private async hideInternal(isAddToBasket: boolean, saveToken: string, thumbnailUrl: string): Promise<boolean> {
    if (!this._editorIsOpen) {
      return false;
    }

    if (!(await this._pluginHost.doAllowCloseAsync(this.getPluginContext(this._variant), {
      saveToken: saveToken,
      thumbnailUrl: thumbnailUrl,
      isAddToBasket: isAddToBasket
    }))) {
      return false;
    }

    await this._pluginHost.onCloseAsync(this.getPluginContext(this._variant), {
      saveToken: saveToken,
      thumbnailUrl: thumbnailUrl,
      isAddToBasket: isAddToBasket
    });

    this._editorIsOpen = false;

    PrintessEditorFrontend.hide();

    return true;
  }

  public setFormFieldValue(formFieldName: string, formFieldValue: string) {
    const api = this.getApi();

    if (api) {
      api.setFormFieldValue(formFieldName, formFieldValue);
    }
  }

  public async uploadImageAsync(img: string | File, formFieldName: string, dimensionFormFields?: IImageDimensionFormFields): Promise<iExternalImage | null> {
    const api = this.getApi();
    let downloadedFile: File | null = null;
    let downloadedFileName: string = "";
    let ret: iExternalImage | null = null;

    if (api) {
      if (img instanceof File) {
        downloadedFile = img;
        downloadedFileName = img.name;
      } else if (typeof img === "string") {
        const downloaded = await PrintessSharedTools.downloadImages([img], dimensionFormFields !== null);

        if (downloaded && downloaded.length > 0) {
          downloadedFile = downloaded[0].data;
          downloadedFileName = downloaded[0].name;
        }
      }
    }

    if (downloadedFile) {
      ret = (await (<any>api).uploadImage(downloadedFile, null, false)) as iExternalImage | null;

      if (ret) {
        downloadedFileName = ret.name;

        if (formFieldName) {
          this.setFormFieldValue(formFieldName, ret.id);
        }

        if (dimensionFormFields) {
          if (dimensionFormFields.widthFormField) {
            this.setFormFieldValue(dimensionFormFields.widthFormField, ret.width.toString());
          }

          if (dimensionFormFields.heightFormField) {
            this.setFormFieldValue(dimensionFormFields.heightFormField, ret.height.toString());
          }

          if (dimensionFormFields.dimensionsFormField) {
            this.setFormFieldValue(dimensionFormFields.dimensionsFormField, ret.width.toString() + "x" + ret.height.toString());
          }

          if (dimensionFormFields.fileNameFormField) {
            this.setFormFieldValue(dimensionFormFields.fileNameFormField, downloadedFileName);
          }

          if (dimensionFormFields.formatFormField) {
            let format = "";

            if (ret.width === ret.height) {
              format = "square";
            } else if (ret.width > ret.height) {
              format = "landscape";
            } else {
              format = "portrait";
            }

            this.setFormFieldValue(dimensionFormFields.formatFormField, format);
          }
        }
      }
    }

    return ret;
  }

  public async save(): Promise<{ saveToken: string, thumbnailUrl: string }> {
    const api = this.getApi();

    if (api) {
      const result = await api.saveAndGenerateBasketThumbnailUrl();

      return {
        saveToken: result.saveToken,
        thumbnailUrl: result.basketUrl || ""
      };
    }

    return {
      saveToken: "",
      thumbnailUrl: ""
    };
  }
}