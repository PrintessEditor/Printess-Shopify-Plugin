import { IPrintessShopifyGraphQlApi, IProduct, IProductOption } from "./printess-graphql-api.d";
import { IIntegration, IIntegrationButton, IPluginContainer, IShopifySettings, PrintessDesignButtonStatus } from "./printess-shopify.d";
import { IPlugin } from "./printess-plugins.d";

export class PrintessIntegrationLauncher {
  private static callbacks: ((editorButtons: IIntegrationButton[], slimUiButtons: IIntegrationButton[]) => void)[] | null = [];
  private static editorButtons: IIntegrationButton[] | null = null;
  private static slimUiButtons: IIntegrationButton[] | null = null;
  public static plugins: IPlugin[] = [];

  public static executeAfterLoading(callback: (editorButtons: IIntegrationButton[], slimUiButtons: IIntegrationButton[]) => void) {
    if (PrintessIntegrationLauncher.callbacks) {
      PrintessIntegrationLauncher.callbacks.push(callback);
    } else {
      callback(PrintessIntegrationLauncher.editorButtons!, PrintessIntegrationLauncher.slimUiButtons!);
    }
  }

  public static async initialize(settings: IShopifySettings): Promise<void> {
    settings.integrationUrl = settings.integrationUrl || "https://editor.printess.com/shopify-panelui/";

    PrintessIntegrationLauncher.preconfigureTheme(settings);

    if (PrintessIntegrationLauncher.editorButtons || PrintessIntegrationLauncher.slimUiButtons) {
      //Do not initialize 2 or more times
      return;
    } else {
      PrintessIntegrationLauncher.editorButtons = [];
      PrintessIntegrationLauncher.slimUiButtons = [];
    }

    let addToBasketButtonCount = 0;
    const addedButtons: IIntegrationButton[] = [];

    //Create integration button, hide add to basket button and display loading status
    document.querySelectorAll(settings?.uiSelectors?.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart').forEach((addToBasketButton: Element) => {
      if (!addToBasketButton || (!(addToBasketButton instanceof HTMLElement) && !(addToBasketButton instanceof HTMLButtonElement))) {
        return;
      }

      ++addToBasketButtonCount;

      if (addToBasketButton.getAttribute("data-printess-attached")) {
        return;
      }

      addToBasketButton.setAttribute("data-printess-attached", "true");

      const designNowButton = PrintessIntegrationLauncher.createDesignNowButton(addToBasketButton, settings.captions?.loadingButtonText || "Loading ...", settings.captions?.designNow || "Design now", settings.captions?.addToBasket || "Add to basket", settings.designButtonClasses);

      //if (!settings.slimUi?.hasFullEditor) {
      addToBasketButton.after(designNowButton);
      // } else {
      //   const wrapperDiv = document.createElement("div");
      //   wrapperDiv.classList.add("printess-integration-button-wrapper");
      //   wrapperDiv.appendChild(designNowButton);

      //   const fullButton = PrintessIntegrationLauncher.createFullEditorButton(designNowButton, settings.captions?.advancedButtonText, settings.advancedButtonClasses, settings.integrationUrl);
      //   wrapperDiv.appendChild(fullButton);


      //   addToBasketButton.after(wrapperDiv);
      // }

      addedButtons.push(designNowButton);
    });

    //Download graphqlapi and check all buttons if they should use the printess integration
    let graphQlApi: IPrintessShopifyGraphQlApi | null = null;

    if (!(<any>window)["PrintessShopifyGraphQlApi"] && !((<any>window)["createPrintessShopifyApi"])) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-graphql-api.js");

      if (typeof createPrintessShopifyApi === "undefined" && typeof exports["createPrintessShopifyApi"] === "undefined") {
        addedButtons.forEach((x) => {
          x.printessRemoveButton();
        });

        console.error("Printess Integration: Unable to download graphql api.");
        return;
      }

      graphQlApi = (createPrintessShopifyApi || exports["createPrintessShopifyApi"])(settings.apiDomain || "", settings.shopToken, settings.graphQlToken, settings.graphQlLanguage || "");
    }

    const products: Record<string, IProduct> = {};
    const buttonsArray = [...addedButtons];

    for (let index = 0; index < buttonsArray.length; ++index) {
      const button = buttonsArray[index];

      const productId = button.printessGetProductId();

      if (!productId) {
        button.printessRemoveButton();
        addedButtons.splice(index, 1);

        console.warn("Printess Integration: Removed button as product form does not contain product id");

        continue;
      }

      if (!products[productId]) {
        let metaFields: string[] = ["templateName", "printTemplateName", "optionNameMapping", "productType", "productDefinitionId", "mergeTemplates", "settings", "dpi", "outputFormat", "tableQuantityFormField", "ignoreDropshipBundling", "dropshipBundlingId", "variantSwitchingOption", "theme", "additionalPrices"];

        if (settings.additionalProductMetaFields && settings.additionalProductMetaFields.length > 0) {
          metaFields = [...metaFields, ...settings.additionalProductMetaFields];
        }

        let product = PrintessIntegrationLauncher.getPreloadedProduct(parseInt(productId), settings);

        if (!product) {
          product = await graphQlApi?.getProductById(parseInt(productId), true, metaFields) || null;
        }

        if (!product) {
          button.printessRemoveButton();
          addedButtons.splice(index, 1);

          console.warn("Printess Integration: Removed button. Unable to download product information for product with id " + productId);
          continue;
        }

        products[productId] = product;
      }

      const product = products[productId];

      if (!product.templateName) {
        button.printessRemoveButton();
        addedButtons.splice(index, 1);

        console.info(`Printess Integration: Removed integration button as product with id ${productId} is no printess product`);

        continue;
      }

      button.product = product;

      if (product.tags && Array.isArray(product.tags)) {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get("ui") !== "editor" && product.tags.includes("printess-slimui")) {
          PrintessIntegrationLauncher.slimUiButtons.push(button);
        } else {
          PrintessIntegrationLauncher.editorButtons.push(button);
        }
      } else {
        PrintessIntegrationLauncher.editorButtons.push(button);
      }
    }

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

    if (typeof (<any>window)["initPrintessPlugins"] === "function") {
      try {
        const plugins = (<any>window)["initPrintessPlugins"]();

        if (plugins) {
          if (Array.isArray(plugins)) {
            plugins.forEach((x) => {
              pluginProvider.registerPlugin(x);
            });
          } else {
            pluginProvider.registerPlugin(plugins);
          }
        }
      } catch (e) {
        console.error("Printess Integration: Unable to retrieve plugins: " + e);
      }
    }

    //Init standard editor integrations
    if (PrintessIntegrationLauncher.editorButtons.length > 0) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-shopify.js");

      if (exports && typeof exports["PrintessShopify"] !== "undefined" && typeof (<any>exports["PrintessShopify"]).createProductIntegration !== "undefined") {
        PrintessIntegrationLauncher.editorButtons.forEach((button) => {
          (<any>exports["PrintessShopify"]).createProductIntegration(settings, button, pluginProvider).then((integration: IIntegration) => {
            button.integration = integration;

            //Trigger execution of all init callbacks
            button.executeAfterInitialization((btn: IIntegrationButton) => { });
          });
        });
      } else {
        PrintessIntegrationLauncher.editorButtons.forEach((button) => {
          button.printessRemoveButton();
        });

        console.error("Printess Integration: Unable to import printess editor integration.");
      }
    }

    //Init Slimui integrations
    if (PrintessIntegrationLauncher.slimUiButtons.length > 0) {
      const exports = await PrintessIntegrationLauncher.importIntoGlobalNamespace(settings.integrationUrl + "printess-shopify-slimui.js");

      if (exports && typeof exports["PrintessShopifySlimUi"] !== "undefined" && typeof (<any>exports["PrintessShopifySlimUi"]).create !== "undefined") {
        PrintessIntegrationLauncher.slimUiButtons.forEach((button) => {
          (<any>exports["PrintessShopifySlimUi"]).create(settings, button, pluginProvider).then((integration: IIntegration) => {
            button.integration = integration;

            //Trigger execution of all init callbacks
            button.executeAfterInitialization((btn: IIntegrationButton) => { });
          });
        });
      } else {
        PrintessIntegrationLauncher.slimUiButtons.forEach((button) => {
          button.printessRemoveButton();
        });

        console.error("Printess Integration: Unable to import printess editor integration.");
      }
    }

    if (addToBasketButtonCount === 0) {
      console.warn("Printess Integration: Printess integration deactivated. No add to basket button found.");
      return;
    }

    //Execute the loading callbacks
    PrintessIntegrationLauncher.callbacks?.forEach((callback) => {
      try {
        callback(PrintessIntegrationLauncher.editorButtons!, PrintessIntegrationLauncher.slimUiButtons!);
      } catch (e) {
        console.error();
      }
    });

    PrintessIntegrationLauncher.callbacks = null;
  }

  private static preconfigureTheme(settings: IShopifySettings) {
    if (!settings.uiSelectors) {
      settings.uiSelectors = {
        cssProductMediaSelector: ""
      };
    }

    const globalNamespace: any = window;
    const themeName = globalNamespace["Shopify"] && globalNamespace["Shopify"].theme ? (globalNamespace["Shopify"].theme.schema_name || globalNamespace["Shopify"].theme.name) : "";

    if (themeName) {
      switch (themeName.toLowerCase()) {
        case "horizon": {
          settings.uiSelectors.cssAddToBasketButtonSelector = settings.uiSelectors.cssAddToBasketButtonSelector || `button[type="submit"][name="add"]:not(.quick-add__button),button.product-form__add-button[data-action="add-to-cart"]:not(.quick-add__button),button#AddToCart:not(.quick-add__button),.add-to-cart-button:not(.quick-add__button),#AddToCart:not(.quick-add__button)`;
          settings.uiSelectors.cssProductContainerSelector = settings.uiSelectors.cssProductContainerSelector || ".product-information";
          settings.uiSelectors.cssCartItemSelector = settings.uiSelectors.cssCartItemSelector || "tr.cart-items__table-row"
          break;
        }
        case "spotlight":
        case "sense":
        case "dawn":
        default: {
          settings.uiSelectors.cssCartItemListSelector = settings.uiSelectors.cssCartItemListSelector || ".cart__items>.js-contents,cart-drawer,#cart-notification-product";
          settings.uiSelectors.cssCartItemSelector = settings.uiSelectors.cssCartItemSelector || "tr.cart-item";
          settings.uiSelectors.cssCartItemLinkSelector = settings.uiSelectors.cssCartItemLinkSelector || "td.cart-item__details>a";
          settings.designButtonClasses = settings.designButtonClasses || "product-form__submit button button--full-width button--primary"
          break;
        }
      }
    }
  }

  private static printessCreateSpinnerSvg(): SVGElement {
    const ret: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;

    ret.classList.add("inline");
    ret.classList.add("w-4");
    ret.classList.add("h-4");
    ret.classList.add("me-3");
    ret.classList.add("text-white");
    ret.classList.add("printess-animate-spin");

    ret.setAttribute("aria-hidden", "true");
    ret.setAttribute("role", "status");
    ret.setAttribute("viewBox", "0 0 100 101");
    ret.setAttribute("fill", "none");
    ret.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const path1: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', "path") as SVGPathElement;
    path1.setAttribute("d", "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z");
    path1.setAttribute("fill", "darkgray");//E5E7EB

    const path2: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', "path") as SVGPathElement;
    path2.setAttribute("d", "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z");
    path2.setAttribute("fill", "black");//white

    ret.appendChild(path1);
    ret.appendChild(path2);

    return ret;
  }

  public static createDirectAddToBasketButton(addToBasketText?: string, savingText?: string, additionalClasses?: string): IIntegrationButton {
    const button = document.createElement("button") as IIntegrationButton;

    button.classList.add("printess-direct-to-basket-button");
    button.setAttribute("type", "button");

    ("printess-integration-button " + (additionalClasses || "button btn button--primary")).split(" ").forEach((className) => {
      if (className) {
        button.classList.add(className);
      }
    });

    const label = document.createElement("span");
    label.classList.add("label");
    label.innerText = addToBasketText || "Add to basket";

    button.printessSetStatus = (status: PrintessDesignButtonStatus): void => {
      switch (status) {
        case "loading": {
          button.classList.add("show-progress");
          button.setAttribute("disabled", "disabled");
          label.innerText = savingText || "Saving ...";

          break;
        }
        case "hidden": {
          button.style.display = "none";

          break;
        }
        case "direct_add_to_basket":
        default: {
          button.classList.remove("show-progress");
          label.innerText = addToBasketText || "Add to basket";
          button.removeAttribute("disabled");
          button.style.display = "block";

          break;
        }
      }

      button.setAttribute("data-printess-status", status);
    };

    button.printessGetStatus = (): PrintessDesignButtonStatus => {
      return (button.getAttribute("data-printess-status") as PrintessDesignButtonStatus | null) || "hidden";
    };

    button.appendChild(PrintessIntegrationLauncher.printessCreateSpinnerSvg());
    button.appendChild(label);

    return button;
  }

  private static createDesignNowButton(basketButton: HTMLElement, loadingText?: string, designNowText?: string, addToBasketText?: string, additionalClasses?: string): IIntegrationButton {
    const button = document.createElement("button") as IIntegrationButton;
    button.classList.add("printess-integration-button");
    button.setAttribute("type", "button");

    loadingText = loadingText || "Loading ...";
    designNowText = designNowText || "Design now";

    ("printess-integration-button " + (additionalClasses || "button btn button--primary")).split(" ").forEach((className) => {
      if (className) {
        button.classList.add(className);
      }
    });

    const label = document.createElement("span");
    label.classList.add("label");
    label.innerText = loadingText || "Loading ...";

    button.printessSetStatus = (status: PrintessDesignButtonStatus): void => {
      switch (status) {
        case "loading": {
          button.classList.add("show-progress");
          button.setAttribute("disabled", "disabled");
          label.innerText = loadingText || "Loading ...";

          if (basketButton) {
            if (basketButton.style.display && basketButton.style.display !== "none") {
              basketButton.setAttribute("data-printess-display", basketButton.style.display);
            }

            basketButton.style.display = "none";
          }

          if (button.parentElement && button.parentElement.matches(".printess-integration-button-wrapper")) {
            const fullButton = button.parentElement.querySelector(".printess-editor-button");

            if (fullButton) {
              fullButton.classList.add("printess-hidden");
            }
          }

          break;
        }
        case "hidden": {
          button.style.display = "none";

          if (basketButton) {
            basketButton.style.display = basketButton.getAttribute("data-printess-display") || "block";
          }

          if (button.parentElement && button.parentElement.matches(".printess-integration-button-wrapper")) {
            const fullButton = button.parentElement.querySelector(".printess-editor-button");

            if (fullButton) {
              fullButton.classList.add("printess-hidden");
            }
          }

          break;
        }
        default:
        case "slimui": {
          const wrapper = basketButton.closest(".printess-integration-button-wrapper");

          if (wrapper) {
            wrapper.querySelector(".printess-editor-button")?.classList.remove("printess-hidden");
          } else {
            basketButton.parentElement?.querySelector(".printess-editor-button")?.classList.remove("printess-hidden");
          }
          //Add no break here, needs to fall through to editor
        }
        case "direct_add_to_basket":
        case "editor": {
          button.classList.remove("show-progress");
          label.innerText = status == "editor" ? (designNowText || "Design now") : (addToBasketText || "Add to basket");
          button.removeAttribute("disabled");
          button.style.display = "block";

          if (basketButton) {
            if (basketButton.style.display && basketButton.style.display !== "none") {
              basketButton.setAttribute("data-printess-display", basketButton.style.display);
            }

            basketButton.style.display = "none";
          }

          break;
        }
      }

      button.setAttribute("data-printess-status", status);
    };

    button.printessGetStatus = (): PrintessDesignButtonStatus => {
      return (button.getAttribute("data-printess-status") as PrintessDesignButtonStatus | null) || "hidden";
    };

    button.printessGetAddToBasketForm = (): HTMLFormElement | null => {
      let form = null;

      if (basketButton instanceof HTMLButtonElement) {
        form = basketButton.form;
      }

      if (!form) {
        form = basketButton.closest("form");
      }

      return form;
    };

    button.printessGetProductId = (): string | null => {
      const form = button.printessGetAddToBasketForm();

      if (!form) {
        return null;
      }

      const productInput: HTMLInputElement | HTMLSelectElement | null = form.querySelector('input[name="product-id"],select[name="product-id"]') as HTMLInputElement | HTMLSelectElement | null;

      return productInput ? productInput.value : null;
    };

    button.printessGetAddToBasketButton = () => {
      return basketButton;
    };

    button.printessRemoveButton = () => {
      button.printessSetStatus("hidden");

      button.remove();
    };

    button.printessSetCaption = (caption: string): string => {
      const label = button.querySelector<HTMLSpanElement>(".label");

      if (label && caption) {
        const ret = label.innerText;

        label.innerText = caption;

        return ret;
      } else {
        return "";
      }
    };

    let afterCallbacks: ((integrationButton: IIntegrationButton) => void)[] | null = [];

    button.executeAfterInitialization = (callback: ((integrationButton: IIntegrationButton) => void)): void => {
      if (typeof callback === "function") {
        if (button.integration) {
          if (afterCallbacks) {
            afterCallbacks.push(callback);

            afterCallbacks.forEach((cb) => {
              try {
                cb(button);
              } catch (e) {
                console.error(e);
              }
            });

            afterCallbacks = null;
          } else {
            try {
              callback(button);
            } catch (e) {
              console.error(e);
            }
          }
        } else {
          afterCallbacks?.push(callback);
        }
      }
    };

    button.appendChild(PrintessIntegrationLauncher.printessCreateSpinnerSvg());
    button.appendChild(label);

    (button as any).printessSetStatus("loading", basketButton);

    return button;
  }

  private static async importIntoGlobalNamespace(url: string): Promise<Record<string, any>> {
    const file = await import(/* webpackIgnore: true */ url) as Record<string, any>;

    if (file) {
      for (const exportEntry in file) {
        if (file[exportEntry] && !(<any>window)[exportEntry]) {
          (<any>window)[exportEntry] = file[exportEntry];
        }
      }
    }

    return file;
  }

  private static getPreloadedProduct(productId: number, settings: IShopifySettings): IProduct | null {
    let ret: IProduct | null = null;
    const optionNameLookUp: Record<number, string> = {};

    if (settings && settings.product && productId === settings.product.id) {
      ret = settings.product;

      if (settings.productOptions) {
        if (settings.productOptions.length > 0 && settings.productOptions[0]) {
          if (!ret.productOptions) {
            ret.productOptions = [];
          }

          settings.productOptions.forEach((option, index) => {
            if (option) {
              const productOption: IProductOption<number> = {
                name: option.name,
                id: 0,
                position: option.position,
                optionValues: option.values
              };

              optionNameLookUp[option.position] = option.name;

              ret!.productOptions!.push(productOption);
            }
          });

          if (settings.product.variants) {
            settings.product.variants.forEach((variant) => {
              if (!variant.optionLookup && variant.options) {
                variant.optionLookup = variant.options.map((optionValue, index) => {
                  return {
                    name: optionNameLookUp[index + 1] ? optionNameLookUp[index + 1] : "",
                    value: optionValue
                  }
                });
              }
            });
          }
        }
      }

      if (settings.productMetaFields) {
        (<any>ret).metaData = settings.productMetaFields;

        for (const propertyName in settings.productMetaFields) {
          if (settings.productMetaFields.hasOwnProperty(propertyName)) {
            let key = propertyName;
            let value = settings.productMetaFields[propertyName];

            if (propertyName === "settings") {
              key = "printessSettings";

              if (typeof value !== "string") {
                value = JSON.stringify(value);
              }
            }
            (<any>ret)[key] = { value: value || "" };
          }
        }
      }

      if (settings.variantMetaData && settings.product && settings.product.variants) {
        settings.variantMetaData.forEach((metaData) => {
          const variant = settings.product!.variants.find(x => x.id === metaData.variantId);

          if (variant) {
            (<any>variant).metaData = metaData.metaFields;

            if (metaData.customMetaFields) {
              (<any>variant).metaData = {
                ...metaData.customMetaFields,
                ...(<any>variant).metaData
              };
            }

            for (const propertyName in metaData.metaFields) {
              if (metaData.metaFields.hasOwnProperty(propertyName)) {
                let key = propertyName;
                let value = metaData.metaFields[propertyName];

                if (propertyName === "settings") {
                  key = "printessSettings";

                  if (typeof value !== "string") {
                    value = JSON.stringify(value);
                  }
                }

                (<any>variant)[key] = { value: value };
              }
            }
          }
        });
      }
    }

    return ret;
  }

  public static getEditorButtons() {
    return [...PrintessIntegrationLauncher.editorButtons || []];
  }

  public static getSlimuiButtons() {
    return [...PrintessIntegrationLauncher.slimUiButtons || []];
  }
}

function registerPrintessPlugin(plugin: IPlugin): void {
  if (plugin) {
    PrintessIntegrationLauncher.plugins.push(plugin);
  }
}