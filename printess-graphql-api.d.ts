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

export interface IQuery {
  query: string,
  variables?: Record<string, any>
}

export interface IdNamePair<IdType> {
  id: IdType;
  name: string;
}

export interface IProductOptionValue<T> extends IdNamePair<T> {
  /** The name in the storefront language the buyer is on. Only set if the launcher renamed a preloaded product of a translated storefront to the api's language. */
  localizedName?: string;
}

export interface IProductOption<T> extends IdNamePair<T> {
  position: number;
  optionValues: IProductOptionValue<T>[]
  /** The name in the storefront language the buyer is on. Only set if the launcher renamed a preloaded product of a translated storefront to the api's language. */
  localizedName?: string;
}

interface IResult {
  data?: Record<string, any>,
  errors?: {
    message: string,
    locations: {
      line: number,
      columns: number
    }[]
  }[]
}

export interface IValueProperty {
  value?: string;
}

export interface IProduct {
  id: number
  templateName?: IValueProperty
  title: string
  tags: string | string[]
  handle: string
  optionNameMapping?: IValueProperty
  productType?: IValueProperty
  productDefinitionId?: IValueProperty
  mergeTemplates?: IValueProperty
  printessSettings?: IValueProperty
  outputDpi?: IValueProperty
  outputFormat?: IValueProperty
  tableQuantityFormField?: IValueProperty
  ignoreDropshipBundling?: IValueProperty
  dropshipBundlingId?: IValueProperty
  productOptions?: IProductOption<number>[];
  variantSwitchingOption?: IValueProperty
  theme?: IValueProperty
  printTemplateName?: IValueProperty
  featuredImage?: string | null;
  additionalPrices?: IValueProperty
}

export interface IVariant<T> {
  title: string;
  id: T;
  available: boolean;
  printessTemplateName?: IValueProperty
  templateName?: IValueProperty
  printTemplateName?: IValueProperty
  mergeTemplates?: IValueProperty
  printessSettings?: IValueProperty
  sku: string;
  requires_shipping: boolean;
  taxable: boolean;
  image?: string | null;
  price: {
    "amount": number;
  },
  compareAtPrice: {
    "amount": number;
  },
  optionLookup: {
    "name": string,
    "value": string
  }[];

  //Filled internally
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  options?: string[] | null;
}

export interface IVariantResponse<T> {
  defaultVariant?: IVariant<T> | null | undefined;
  variantBySelectedOptions?: IVariant<T> | null | undefined;
}

export interface IOptionSelector {
  optionName: string;
  optionValue: string;
}

export interface IShortVariant {
  id: number;
  available: boolean;
  templateName?: string;
  options: IOptionSelector[];
}

export interface IProductVariantsResponse {
  "edges": {
    "node": {
      "id": string,
      "available": boolean,
      "templateName": { value?: string },
      "selectedOptions": {
        "name": string
        "value": string
      }[]
    }
  }[],
  "pageInfo": {
    "hasNextPage": boolean,
    "endCursor": string
  }
}

export interface IPrintessShopifyGraphQlApi {
  getProductOptions(productId: number): Promise<IProductOption<number>[]>
  getProductById(id: number, autoloadOptions: boolean, metaFields?: string[] | null): Promise<IProduct | null>
  getProductByHandle(handle: string, autoloadOptions: boolean, metaFields?: string[] | null): Promise<IProduct | null>
  getProductVariantByOptions(id: number, options: Record<string, string>, returnDefault?: boolean): Promise<IVariantResponse<number> | null>
  getProductVariants(productId: number): Promise<IShortVariant[]>
}

declare global {
  function createPrintessShopifyApi(apiDomain: string, shopToken: string, graphQlToken: string, language: string | null = null): IPrintessShopifyGraphQlApi;
}