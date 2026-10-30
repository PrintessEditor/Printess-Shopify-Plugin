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

import { ICartItem, IShopifySettings } from "./printess-shopify.d"

export interface IPrintessCartIntegration extends HTMLButtonElement {

}

export interface ICartUrlSettings {
  editLink: string;
  parameters: Record<string, string>;
}

/**
 * Stays exported although the theme app extension loads the built file as a plain script, where a top level
 * export is a syntax error: dropping it here does not help, as the type import above keeps this file a module
 * and tsc then emits an `export {};` marker at the end instead. build.sh strips the export on the way into the
 * app's assets - see the copy step there.
 */
export class PrintessShopifyCartIntegration {
  private static readonly maxThumbnailRewrites = 5;
  private static readonly thumbnailRewriteWindow = 2000;
  private static thumbnailRewrites: WeakMap<HTMLImageElement, { count: number, since: number, gaveUp: boolean }> = new WeakMap();
  private static cartObserverInitialized = false;
  //What a click on an edit button / cart item link has to act on right now. Morphing themes keep these elements
  //across re-renders and create runs again for each re-render, so the listeners are added only once per element
  //and look up their current target here - instead of one more listener per re-render, each holding the cart
  //item of its own, possibly outdated, create call.
  private static clickListenerAdded: WeakSet<Element> = new WeakSet();
  private static buttonIntegrations: WeakMap<Element, PrintessShopifyCartIntegration> = new WeakMap();
  private static editLinkParameters: WeakMap<Element, Record<string, string>> = new WeakMap();

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

    const properties = this.cartItem.properties;
    const isSlimUi = properties?.["_printessSlimUi"] === "true";
    const settings = properties?.["_printessSettings"];
    const settingsMentionSlimUi = !!settings && ("" + settings).indexOf("slimUi") >= 0;

    // Default is the full editor; only items created with the slim UI switch back to it
    const ui: string = isSlimUi || settingsMentionSlimUi ? "" : "editor";

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

  //Compares and writes the attributes, not the src / srcset properties: the properties return the url as resolved
  //by the browser, which does not have to equal the raw thumbnail url - and then a rewrite would never settle.
  private static applyThumbnail(imageElement: HTMLImageElement, thumbnailUrl: string): boolean {
    const srcDiffers = imageElement.getAttribute("src") !== thumbnailUrl;
    const srcsetDiffers = imageElement.getAttribute("srcset") !== thumbnailUrl;

    if (!srcDiffers && !srcsetDiffers) {
      return false;
    }

    //Safety net for themes or other apps that keep writing their own url into the image (lazy loaders, responsive
    //image components): we would answer every write with ours and the browser would reload both images forever.
    //After a few rewrites in a short time that image is left alone. A re-rendered image is a new element and
    //starts over.
    const now = Date.now();
    let rewrites = PrintessShopifyCartIntegration.thumbnailRewrites.get(imageElement);

    if (!rewrites || now - rewrites.since > PrintessShopifyCartIntegration.thumbnailRewriteWindow) {
      rewrites = { count: 0, since: now, gaveUp: rewrites?.gaveUp === true };
      PrintessShopifyCartIntegration.thumbnailRewrites.set(imageElement, rewrites);
    }

    if (rewrites.gaveUp) {
      return false;
    }

    if (++rewrites.count > PrintessShopifyCartIntegration.maxThumbnailRewrites) {
      rewrites.gaveUp = true;
      console.warn("Printess integration: Something keeps overwriting the cart image, stopped replacing it with the Printess thumbnail.", imageElement);
      return false;
    }

    if (srcDiffers) {
      imageElement.setAttribute("src", thumbnailUrl);
    }

    if (srcsetDiffers) {
      imageElement.setAttribute("srcset", thumbnailUrl);
    }

    //Image components of Horizon based themes (<img is="responsive-image">) keep the image hidden until they saw it
    //load. After changing such an element, the theme's own morph tells it so by calling its updatedCallback - and
    //we have to do the same: a morph resets the component's loaded state, and when it checks the image right
    //after, the theme's image has not loaded yet. Changing the image behind its back after that leaves our
    //thumbnail loaded but invisible.
    if (imageElement.hasAttribute("is") && typeof (<any>imageElement).updatedCallback === "function") {
      queueMicrotask(() => {
        try {
          (<any>imageElement).updatedCallback();
        } catch (e) {
          console.error(e);
        }
      });
    }

    return true;
  }

  //Gives every cart row the thumbnail of the cart line it currently shows. Everything is read from the current dom,
  //nothing is remembered in between: a theme may keep the row and its image while showing another line in it, or
  //replace parts of it, and either way the button's cart item json is the only reliable source.
  private static syncCartThumbnails(printessSettings: IShopifySettings): void {
    document.querySelectorAll<HTMLButtonElement>("button.printess-cart-integration-button").forEach((button) => {
      let cartItem: ICartItem | null = null;

      try {
        cartItem = JSON.parse(button.getAttribute("data-cart-item") || "") as ICartItem | null;
      } catch {
        return;
      }

      const thumbnailUrl = cartItem?.properties ? cartItem.properties["_printessThumbnail"] : "";

      if (!thumbnailUrl) {
        return;
      }

      const parentElement = button.closest(printessSettings.uiSelectors?.cssCartItemSelector || ".cart-item ");
      const imageElement = parentElement ? parentElement.querySelector(printessSettings.uiSelectors?.cssCartItemImageSelector || "img") as HTMLImageElement | null : null;

      if (imageElement) {
        PrintessShopifyCartIntegration.applyThumbnail(imageElement, thumbnailUrl);
      }
    });
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

        //Themes overwriting the image later on (lazy loaders, re-renders) are handled by the one document wide
        //observer in initializeCartPage. No observer per image here: create runs again for the same image every
        //time a morphing theme re-renders the cart, and observers stacked up that way, each holding the thumbnail
        //of its own call, overwrote each other forever.
        if (imageElement) {
          //Getting here again for an image we already know means the theme re-rendered the row (that is what strips
          //the attached marker off the button). Each re-render legitimately puts the theme's image back, so it must
          //not count towards the rewrite limit - otherwise a few quantity changes in a row would make us give up on
          //an image that is kept by a morphing theme, and it would show the product image from then on.
          PrintessShopifyCartIntegration.thumbnailRewrites.delete(imageElement);
          PrintessShopifyCartIntegration.applyThumbnail(imageElement, cartItem.properties["_printessThumbnail"]);
        }
      }

      //A kept row may now show another cart line, so whatever the previous create set up for its button and links
      //must not apply any longer. The editable branch below sets the current targets again.
      PrintessShopifyCartIntegration.buttonIntegrations.delete(integrationButton);
      parentElement.querySelectorAll(printessSettings.uiSelectors?.cssCartItemLinkSelector || "a").forEach((x) => {
        PrintessShopifyCartIntegration.editLinkParameters.delete(x);
      });

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

              if (!PrintessShopifyCartIntegration.clickListenerAdded.has(x)) {
                PrintessShopifyCartIntegration.clickListenerAdded.add(x);

                x.addEventListener("click", function () {
                  const parameters = PrintessShopifyCartIntegration.editLinkParameters.get(x);

                  if (parameters) {
                    PrintessShopifyCartIntegration.writeEditParametersToStorage(parameters);
                  }
                });
              }

              PrintessShopifyCartIntegration.editLinkParameters.set(x, linkParams.parameters);

              if (typeof (x as HTMLAnchorElement).href !== "undefined") {
                (x as HTMLAnchorElement).href = linkParams.editLink;
              }
            });
          }

          if (!PrintessShopifyCartIntegration.clickListenerAdded.has(integrationButton)) {
            PrintessShopifyCartIntegration.clickListenerAdded.add(integrationButton);

            integrationButton.addEventListener("click", function () {
              PrintessShopifyCartIntegration.buttonIntegrations.get(integrationButton)?.openProductPage();
            });
          }

          PrintessShopifyCartIntegration.buttonIntegrations.set(integrationButton, ret);

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
    // cart re-renders, and for cart images being overwritten. If a scan is already scheduled,
    // the observer does nothing — the pending timeout will pick up whatever DOM state exists
    // when it fires. Only ever one observer, a second one would scan everything twice.
    if (!PrintessShopifyCartIntegration.cartObserverInitialized) {
      PrintessShopifyCartIntegration.cartObserverInitialized = true;

      const cartItemSelector = printessSettings.uiSelectors?.cssCartItemSelector || ".cart-item ";
      let scanScheduled = false;

      const globalObserver = new MutationObserver((mutations) => {
        if (scanScheduled) return;

        // A morphing theme keeps the image and only changes its attributes, so those have to be watched as well -
        // but only inside cart rows, lazy loaded images anywhere else on the page are none of our business.
        const isRelevant = mutations.some((mutation) => mutation.type === "childList" || (mutation.target instanceof Element && mutation.target.closest(cartItemSelector) !== null));

        if (!isRelevant) return;

        scanScheduled = true;
        setTimeout(() => {
          scanScheduled = false;

          document.querySelectorAll<HTMLButtonElement>("button.printess-cart-integration-button:not([data-printess-attached='true'])").forEach((btn) => {
            PrintessShopifyCartIntegration.initIntegrationButton(printessSettings, btn);
          });

          // Our own writes in here trigger the observer once more, that pass finds nothing left to change.
          PrintessShopifyCartIntegration.syncCartThumbnails(printessSettings);
        }, 100);
      });

      globalObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset"] });
    }

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
