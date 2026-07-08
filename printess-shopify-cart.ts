import { ICartItem, IShopifySettings } from "./printess-shopify.d"

export interface IPrintessCartIntegration extends HTMLButtonElement {

}

export interface ICartUrlSettings {
  editLink: string;
  parameters: Record<string, string>;
}

export class PrintessShopifyCartIntegration {
  private integrationButton: IPrintessCartIntegration;
  private settings: IShopifySettings;
  private cartItem: ICartItem;

  private constructor(printessSettings: IShopifySettings, integrationButton: IPrintessCartIntegration, cartItem: ICartItem) {
    this.settings = printessSettings;
    this.integrationButton = integrationButton;
    this.cartItem = cartItem;
  }

  private createEditLink(parentElement: HTMLElement): ICartUrlSettings {
    const parameters: Record<string, string> = {};
    let quantity: number = typeof this.cartItem.quantity !== "number" || isNaN(this.cartItem.quantity) || !isFinite(this.cartItem.quantity) || this.cartItem.quantity < 0 ? 1 : this.cartItem.quantity;
    const quantityCtrl = parentElement.querySelector(this.settings.uiSelectors?.cssCartItemQuantitySelector || ".quantity__input") as HTMLInputElement | HTMLSelectElement | null;

    if (quantityCtrl) {
      const parsedQuantity = quantityCtrl.value ? parseInt(quantityCtrl.value) : quantity;

      if (!isNaN(parsedQuantity) && isFinite(parsedQuantity) && parsedQuantity > 0) {
        quantity = parsedQuantity;
      }
    }

    const ui: string = this.cartItem.properties && this.cartItem.properties["_printessSettings"] && ("" + this.cartItem.properties["_printessSettings"]).toString().indexOf("slimUi") < 0 ? "editor" : "";

    parameters["qty"] = quantity.toString();
    parameters["ui"] = ui ? ui : "";
    parameters["printesssavetoken"] = this.cartItem.properties["_printessSaveToken"];
    parameters["basketkey"] = this.cartItem.key;

    const urlParams = `printesssavetoken=${encodeURIComponent(this.cartItem.properties["_printessSaveToken"])}&basketkey=${encodeURIComponent(this.cartItem.key)}&qty=${quantity}` + (ui ? `&ui=${ui}` : "");

    return {
      editLink: this.cartItem.url + (this.cartItem.url.indexOf("?") > 0 ? "&" : "?") + urlParams,
      parameters: parameters
    }
  }

  private static writeEditParametersToStorage(params: Record<string, string>) {
    try {
      const json = localStorage.getItem("printessUrlParams");

      if (json) {
        let jsonParams = <Record<string, string>[] | null | undefined>JSON.parse(json);

        if (!jsonParams || !Array.isArray(jsonParams)) {
          jsonParams = [];
        }

        jsonParams.push(params);

        localStorage.setItem("printessUrlParams", JSON.stringify(jsonParams));
      } else {
        localStorage.setItem("printessUrlParams", JSON.stringify([params]));
      }
    } catch {
      const json = sessionStorage.getItem("printessUrlParams");

      if (json) {
        let jsonParams = <Record<string, string>[] | null | undefined>JSON.parse(json);

        if (!jsonParams || !Array.isArray(jsonParams)) {
          jsonParams = [];
        }

        jsonParams.push(params);

        sessionStorage.setItem("printessUrlParams", JSON.stringify(jsonParams));
      } else {
        sessionStorage.setItem("printessUrlParams", JSON.stringify([params]));
      }
    }
  }

  private openProductPage(): void {
    const parentElement = <HTMLElement | null>this.integrationButton.closest(this.settings.uiSelectors?.cssCartItemSelector || ".cart-item ");

    if (parentElement) {
      const created = this.createEditLink(parentElement);

      PrintessShopifyCartIntegration.writeEditParametersToStorage(created.parameters);

      window.location.replace(created.editLink);
    }
  }

  public static create(printessSettings: IShopifySettings, integrationButton: IPrintessCartIntegration, cartItem: ICartItem): PrintessShopifyCartIntegration {
    const ret = new PrintessShopifyCartIntegration(printessSettings, integrationButton, cartItem);

    const parentElement = <HTMLElement | null>ret.integrationButton.closest(ret.settings.uiSelectors?.cssCartItemSelector || ".cart-item ");

    if (parentElement) {
      if (cartItem && cartItem.properties["_printessThumbnail"]) {
        const imageElement = parentElement.querySelector(printessSettings.uiSelectors?.cssCartItemImageSelector || "img") as HTMLImageElement | null;

        if (imageElement) {
          const thumbnailUrl = cartItem.properties["_printessThumbnail"];

          if (typeof imageElement.src !== "undefined") {
            imageElement.src = thumbnailUrl;
          }

          if (typeof imageElement.srcset !== "undefined") {
            imageElement.srcset = thumbnailUrl;
          }

          // Some themes overwrite src/srcset after initial render (lazy loaders,
          // reactive re-renders). Watch for those changes and restore our value.
          let thumbnailRestoreScheduled = false;
          const thumbnailObserver = new MutationObserver(() => {
            if (thumbnailRestoreScheduled) return;
            thumbnailRestoreScheduled = true;
            setTimeout(() => {
              if (imageElement.src !== thumbnailUrl) imageElement.src = thumbnailUrl;
              if (imageElement.srcset !== thumbnailUrl) imageElement.srcset = thumbnailUrl;
              thumbnailRestoreScheduled = false;
            }, 100);
          });

          thumbnailObserver.observe(imageElement, { attributes: true, attributeFilter: ["src", "srcset"] });
        }
      }

      if (cartItem && cartItem.properties["_printessSaveToken"]) {
        let cartItemIsEditable = true;

        ("printess-cart-integration-button " + (ret.settings.cartButtonClasses || "button btn button--primary")).split(" ").forEach((className) => {
          if (className) {
            integrationButton.classList.add(className);
          }
        });

        if (cartItem && cartItem.properties["_printessSettings"]) {
          try {
            const cartItemSettings = JSON.parse(cartItem.properties["_printessSettings"]);

            if (cartItemSettings && cartItemSettings["withoutPersonalization"] === true) {
              cartItemIsEditable = false;
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (cartItemIsEditable) {
          if (printessSettings.cartLinkIsEditLink === true) {
            parentElement.querySelectorAll(printessSettings.uiSelectors?.cssCartItemLinkSelector || "a").forEach((x) => {
              const linkParams = ret.createEditLink(parentElement);
              const clickHandler = function (e: Event) {
                PrintessShopifyCartIntegration.writeEditParametersToStorage(linkParams.parameters);

                (<HTMLElement>e.currentTarget).removeEventListener("click", clickHandler);
              };

              x.addEventListener("click", clickHandler);

              if (typeof (x as HTMLAnchorElement).href !== "undefined") {
                (x as HTMLAnchorElement).href = linkParams.editLink;
              }
            });
          }

          ret.integrationButton.addEventListener("click", function () {
            ret.openProductPage();
          });

          integrationButton.classList.remove("printess-hidden");
        }
      }
    } else {
      console.warn("PrintessIntegration: No cart item using cart item selector found. Edit button is rendered invisible.");
    }

    return ret;
  }

  private static initIntegrationButton(printessSettings: IShopifySettings, button: HTMLElement): PrintessShopifyCartIntegration | null {
    button.textContent = printessSettings.captions?.cartEditButton || "Edit";

    button.setAttribute("data-printess-attached", "true");

    let cartItem: ICartItem | null;

    try {
      cartItem = JSON.parse(button.getAttribute("data-cart-item") || "") as ICartItem | null;
    } catch (e) {
      console.error("Printess integration: Skipping cart item due to unreadable cart item json: " + button.getAttribute("data-cart-item") || "\"\"");
      return null;
    }

    if (!cartItem) {
      console.warn("Printess integration: Skipping cart item due to empty cart item json.");
      return null;
    }

    if (!cartItem.properties || !cartItem.properties["_printessSaveToken"]) {
      button.remove();
      return null;
    }

    return PrintessShopifyCartIntegration.create(printessSettings, <IPrintessCartIntegration>button, cartItem);
  }

  public static initializeCartPage(printessSettings: IShopifySettings): PrintessShopifyCartIntegration[] {
    if (!printessSettings.uiSelectors) {
      printessSettings.uiSelectors = {
        cssProductMediaSelector: ""
      };
    }

    // Watch the entire document for Printess buttons appearing or re-appearing after
    // cart re-renders. If a scan is already scheduled, the observer does nothing — the
    // pending timeout will pick up whatever DOM state exists when it fires.
    let scanScheduled = false;
    const globalObserver = new MutationObserver(() => {
      if (scanScheduled) return;
      scanScheduled = true;
      setTimeout(() => {
        document.querySelectorAll<HTMLButtonElement>("button.printess-cart-integration-button:not([data-printess-attached='true'])").forEach((btn) => {
          PrintessShopifyCartIntegration.initIntegrationButton(printessSettings, btn);
        });
        scanScheduled = false;
      }, 100);
    });
    globalObserver.observe(document.body, { childList: true, subtree: true });

    const integrationButtons = document.querySelectorAll("button.printess-cart-integration-button:not([data-printess-attached='true'])");
    const ret: PrintessShopifyCartIntegration[] = [];

    if (integrationButtons.length === 0) {
      console.warn("Printess integration: No cart integration buttons found. The mutation observer will pick them up when they appear.");
      return ret;
    }

    for (let i = 0; i < integrationButtons.length; ++i) {
      const integration = PrintessShopifyCartIntegration.initIntegrationButton(printessSettings, integrationButtons[i] as HTMLElement);

      if (integration) {
        ret.push(integration);
      }
    }

    return ret;
  }
}
