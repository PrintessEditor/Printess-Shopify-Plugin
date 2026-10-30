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

import { IShortVariant, IVariant } from "./printess-graphql-api.d";
import { IShopifySettings } from "./printess-shopify.d";

/**
 * The fields of a variant as liquid's "product | json" renders it that are read here. The inline script of the theme
 * app extension rewrites the prices into { amount } in place, the raw cent values are accepted as well so nothing
 * depends on that script.
 */
interface ILiquidVariant {
  id: number;
  title: string;
  available: boolean;
  sku?: string | null;
  requires_shipping?: boolean;
  taxable?: boolean;
  options?: string[] | null;
  price?: number | { amount: number } | null;
  compare_at_price?: number | { amount: number } | null;
  featured_image?: { src?: string | null } | null;
}

interface ILiquidProduct {
  id: number | string;
  options?: string[] | null;
  featured_image?: string | null;
  variants?: ILiquidVariant[] | null;
}

/**
 * Reads the product data the theme app extension renders into the theme html (window.printessSettings) in the exact
 * format the graphql api delivers it, so it can replace the api call without the integration noticing.
 *
 * Only used where the result is guaranteed to be identical to the api's. Liquid renders option names and values in
 * the language of the storefront the buyer is on, while the api answers in the shop's primary language (or in
 * graphQlLanguage), so translated storefronts keep loading from the api.
 *
 * The settings object itself is never modified: the launcher writes its own conversion into
 * printessSettings.product, so only the fields liquid rendered are read and the result does not depend on who
 * touched the settings before.
 */
export class PrintessPreloadedProduct {
  /**
   * Liquid's product.variants never returns more than 250 variants, a product with more of them can only be loaded
   * completely through the api.
   */
  private static readonly maxLiquidVariants = 250;

  /**
   * The variant meta fields the api delivers if no meta fields are requested explicitly (DefaultProductVariantMetaFields
   * in net/ShopifyIntegration/Internal/Storefront/GraphQlApi.cs).
   */
  private static readonly apiVariantMetaFields = ["templateName", "mergeTemplates", "variantSettings"];

  private settings: IShopifySettings;
  private liquidProduct: ILiquidProduct;
  private variants: ILiquidVariant[];
  private shortVariants: IShortVariant[] | null = null;

  private constructor(settings: IShopifySettings, liquidProduct: ILiquidProduct, variants: ILiquidVariant[]) {
    this.settings = settings;
    this.liquidProduct = liquidProduct;
    this.variants = variants;
  }

  /**
   * Returns null if the shop disabled the preload, nothing got preloaded, the preloaded product is not the requested
   * one or the preloaded data could differ from what the api delivers. A page can contain several integrations,
   * while only the product of the product page is preloaded.
   */
  public static fromSettings(settings: IShopifySettings | null | undefined, productId: number | string): PrintessPreloadedProduct | null {
    if (!settings || settings.disableProductPreload === true || !settings.product) {
      return null;
    }

    //Only set by app versions that know about this check, older ones and self hosted integrations keep using the api
    if (settings.productPreloadIsPrimaryLocale !== true || settings.graphQlLanguage) {
      return null;
    }

    const liquidProduct = <ILiquidProduct><unknown>settings.product;
    const variants = liquidProduct.variants;

    if (!Array.isArray(variants) || variants.length === 0 || variants.length >= PrintessPreloadedProduct.maxLiquidVariants) {
      return null;
    }

    const preloadedId = Number(liquidProduct.id);

    if (!preloadedId || preloadedId !== Number(productId)) {
      return null;
    }

    return new PrintessPreloadedProduct(settings, liquidProduct, variants);
  }

  /**
   * Option names by position, position 1 at index 0.
   */
  private getOptionNames(): string[] {
    if (this.settings.productOptions && this.settings.productOptions.length > 0) {
      const ret: string[] = [];

      this.settings.productOptions.forEach((option) => {
        if (option && option.position > 0) {
          ret[option.position - 1] = option.name;
        }
      });

      return ret;
    }

    return this.liquidProduct.options ? [...this.liquidProduct.options] : [];
  }

  private getVariantTemplateName(variantId: number): string {
    const entry = (this.settings.variantMetaData || []).find((x) => x && Number(x.variantId) === variantId);
    const templateName: unknown = entry && entry.metaFields ? entry.metaFields["templateName"] : null;

    return typeof templateName === "string" ? templateName : "";
  }

  /**
   * The meta fields the way the api returns them: always the same keys, every value a string. Liquid renders json meta
   * fields as objects.
   */
  private getApiVariantMetaData(variantId: number): Record<string, string> {
    const entry = (this.settings.variantMetaData || []).find((x) => x && Number(x.variantId) === variantId);
    const ret: Record<string, string> = {};

    PrintessPreloadedProduct.apiVariantMetaFields.forEach((key) => {
      const value: unknown = entry && entry.metaFields ? entry.metaFields[key] : null;

      ret[key] = typeof value === "undefined" || value === null ? "" : (typeof value === "string" ? value : JSON.stringify(value));
    });

    return ret;
  }

  /**
   * Liquid renders urls protocol relative ("//shop.com/cdn/...").
   */
  private static toAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }

    return url.startsWith("//") ? "https:" + url : url;
  }

  private static toAmount(price: number | { amount: number } | null | undefined): { amount: number } | null {
    if (typeof price === "number") {
      return { amount: price / 100 };
    }

    if (price && typeof price.amount === "number") {
      return { amount: price.amount };
    }

    return null;
  }

  /**
   * Same result as PrintessShopifyGraphQlApi.getProductVariants
   */
  public getShortVariants(): IShortVariant[] {
    if (!this.shortVariants) {
      const optionNames = this.getOptionNames();

      this.shortVariants = this.variants.map((variant) => {
        return {
          id: variant.id,
          available: variant.available === true,
          templateName: this.getVariantTemplateName(variant.id),
          options: (variant.options || []).map((value, index) => {
            return {
              optionName: optionNames[index] || "",
              optionValue: value
            };
          })
        };
      });
    }

    return this.shortVariants;
  }

  /**
   * Same result as PrintessShopifyGraphQlApi.getProductVariantByOptions(...).variantBySelectedOptions, including its
   * quirks: templateName ends up undefined, mergeTemplates and printTemplateName empty and variantSettings as raw
   * string, which is what plugins see today. Fixing that has to happen in both places at once.
   *
   * The price is the one of the buyer's market, as shown by the theme and charged by the cart, the api always returns
   * the price of the primary market.
   *
   * Only the printess api path is reproduced, shops querying shopify's storefront api directly get null.
   */
  public getVariant(variantId: number): IVariant<number> | null {
    if (!(this.settings.graphQlToken || "").includes("myshopify.com")) {
      return null;
    }

    const variant = this.variants.find((x) => x.id === variantId);

    if (!variant) {
      return null;
    }

    const optionNames = this.getOptionNames();
    const optionLookup = (variant.options || []).map((value, index) => {
      return {
        name: optionNames[index] || "",
        value: value
      };
    });

    const metaData = this.getApiVariantMetaData(variant.id);

    const ret: Record<string, unknown> = {
      title: variant.title,
      id: variant.id,
      available: variant.available === true,
      sku: variant.sku || null,
      requiresShipping: variant.requires_shipping === true,
      taxable: variant.taxable === true,
      price: PrintessPreloadedProduct.toAmount(variant.price),
      compareAtPrice: PrintessPreloadedProduct.toAmount(variant.compare_at_price),
      //Like the storefront api, which falls back to the product image if the variant has none
      image: PrintessPreloadedProduct.toAbsoluteUrl(variant.featured_image?.src) || PrintessPreloadedProduct.toAbsoluteUrl(this.liquidProduct.featured_image),
      optionLookup: optionLookup,
      options: optionLookup.map((x) => x.value),
      metaData: metaData,
      templateName: undefined,
      mergeTemplates: "",
      variantSettings: metaData["variantSettings"],
      option1: optionLookup.length > 0 ? optionLookup[0].value : null,
      option2: optionLookup.length > 1 ? optionLookup[1].value : null,
      option3: optionLookup.length > 2 ? optionLookup[2].value : null,
      printTemplateName: ""
    };

    return <IVariant<number>><unknown>ret;
  }
}
