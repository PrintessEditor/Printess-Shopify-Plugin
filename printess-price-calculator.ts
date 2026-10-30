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

// Master copy: panelUi/build.sh copies this file unchanged into the cart transform function
// (currentApp/printess/extensions/printess-additional-options/src), so edit it in panelUi only.

export interface IPrintessNameAndValue {
  name: string
  value: string
}

export interface IPrintessFormfieldAndValue extends IPrintessNameAndValue {
  formFieldLabel?: string | null
  valueLabel?: string | null
}

export interface IPrintessVariantPrice {
  variantId: string
  pricePerUnit: number
}

export interface IPrintessFormFieldPrice {
  formFields: IPrintessNameAndValue | IPrintessNameAndValue[]
  price?: IPrintessVariantPrice
  pricePerPage?: IPrintessVariantPrice
}

export interface IPrintessQuantityTier {
  minQuantity: number//The tier applies from this cart line quantity on, the matching tier with the highest minQuantity wins
  pricePerUnit?: number | null//Replaces the unit price of the product itself; empty keeps the variant price
  pricePerPage?: number | null//Replaces pricePerPage.pricePerUnit (the variant stays the same); empty keeps the configured page price
}

export interface IPrintessPriceConfig {
  displayName?: string | null
  includedPageCount?: number | null
  disableQuantity?: boolean | null
  pricePerPage?: IPrintessVariantPrice
  formFieldPrices?: IPrintessFormFieldPrice[]
  quantityTiers?: IPrintessQuantityTier[] | null
}

export interface ICalculatedAdditionalPrices {
  variants: {
    variantId: string
    quantity: number
    pricePerUnit: number
  }[]
  totalPrice: number//Sum of the additional prices only, the unit price of the product itself is not part of it
  unitPrice: number | null//Replacement unit price of the product from the matching quantity tier, null keeps the variant price
}

export class PrintessPriceCalculator {
  private static hasValue(item: any): boolean {
    return typeof item !== "undefined" && item !== null;
  }

  private static hasMatch(values: IPrintessFormfieldAndValue[], condition: IPrintessNameAndValue): boolean {
    const lowerName = (condition.name || "").toLowerCase();
    const lowerValue = (condition.value || "").toLowerCase();

    let matchingFF = values.find((x) => {
      return x.name.toLowerCase() === lowerName;
    });

    if (!matchingFF) {
      matchingFF = values.find((x) => {
        return x.formFieldLabel ? x.formFieldLabel?.toLowerCase() === lowerName : false;
      });
    }

    if (!matchingFF) {
      return false;
    }

    const lowerFFValue = (matchingFF.value || "").toLowerCase();
    const lowerFFValueLabel = (matchingFF.valueLabel || "").toLowerCase();

    if (!lowerFFValueLabel) {
      return lowerValue === lowerFFValue;
    } else {
      return lowerValue === lowerFFValue || lowerValue === lowerFFValueLabel;
    }
  }

  private static evaluateFormFields(condition: IPrintessNameAndValue | IPrintessFormfieldAndValue[], values: IPrintessFormfieldAndValue[]): boolean {
    const that = this;

    if (!Array.isArray(condition)) {
      return this.evaluateFormFields([condition], values);
    }

    const matchedValues = condition.filter((x) => {
      return that.hasMatch(values, x);
    });

    return matchedValues.length === condition.length;
  }

  private static isPrice(value: any): value is number {
    return typeof value === "number" && isFinite(value) && value >= 0;
  }

  /**
   * The quantity tier for the given cart line quantity: the tier with the highest minQuantity that is not above the quantity.
   */
  public static getQuantityTier(config: IPrintessPriceConfig | null | undefined, quantity: number): IPrintessQuantityTier | null {
    if (!config || !Array.isArray(config.quantityTiers) || config.quantityTiers.length === 0) {
      return null;
    }

    let ret: IPrintessQuantityTier | null = null;

    for (const x of config.quantityTiers) {
      if (!x || typeof x.minQuantity !== "number" || !isFinite(x.minQuantity) || x.minQuantity > quantity) {
        continue;
      }

      if (ret === null || x.minQuantity > ret.minQuantity) {
        ret = x;
      }
    }

    return ret;
  }

  public static calculatePrice(numberOfPages: number, formFieldValues: IPrintessFormfieldAndValue[], config: IPrintessPriceConfig | string, quantity: number = 1): ICalculatedAdditionalPrices {
    const that = this;

    const ret: ICalculatedAdditionalPrices = {
      totalPrice: 0.0,
      variants: [],
      unitPrice: null
    };

    if (config && typeof config === "string") {
      config = <IPrintessPriceConfig>JSON.parse(config);
    }

    if (!config) {
      return ret;
    }

    config = <IPrintessPriceConfig>config;//Make compiler happy

    const quantityTier = this.getQuantityTier(config, quantity);

    if (quantityTier && this.isPrice(quantityTier.pricePerUnit)) {
      ret.unitPrice = quantityTier.pricePerUnit;
    }

    const pricePerPage: number = quantityTier && this.isPrice(quantityTier.pricePerPage) ? quantityTier.pricePerPage : (config.pricePerPage?.pricePerUnit || 0);

    //Calculate price per page values
    if (numberOfPages > 0) {
      if (this.hasValue(config.pricePerPage) && this.hasValue(config.pricePerPage?.variantId) && config.pricePerPage?.variantId && typeof pricePerPage === "number" && pricePerPage > 0) {
        let pricePerUnit: number = pricePerPage;
        let quantity: number = numberOfPages;

        if (config.disableQuantity === true) {
          pricePerUnit = pricePerUnit * numberOfPages;
          quantity = 1;
        }

        ret.variants.push({
          pricePerUnit: pricePerUnit,
          quantity: quantity,
          variantId: config.pricePerPage?.variantId
        });
      }

      if (this.hasValue(config.formFieldPrices) && Array.isArray(config.formFieldPrices) && config.formFieldPrices.length > 0) {
        config.formFieldPrices.forEach((x) => {
          if (!x || !x.formFields || !x.formFields || (Array.isArray(x.formFields) && x.formFields.length == 0) || !that.hasValue(x.pricePerPage) || !x.pricePerPage?.variantId || typeof x.pricePerPage.pricePerUnit !== "number" || x.pricePerPage.pricePerUnit <= 0) {
            return;
          }

          if (that.evaluateFormFields(x.formFields, formFieldValues)) {
            let price = x.pricePerPage?.pricePerUnit || 0;
            let quantity = numberOfPages;

            if (config.disableQuantity === true) {
              price = price * quantity;
              quantity = 1;
            }

            ret.variants.push({
              pricePerUnit: price,
              variantId: x.pricePerPage?.variantId,
              quantity: quantity
            });
          }
        });
      }
    }

    //Calculate non page prices
    if (this.hasValue(config.formFieldPrices) && Array.isArray(config.formFieldPrices) && config.formFieldPrices.length > 0) {
      config.formFieldPrices.forEach((x) => {
        if (!x || !x.formFields || !x.formFields || (Array.isArray(x.formFields) && x.formFields.length == 0) || !that.hasValue(x.price) || !x.price?.variantId || typeof x.price.pricePerUnit !== "number" || x.price.pricePerUnit <= 0) {
          return;
        }

        if (that.evaluateFormFields(x.formFields, formFieldValues)) {
          ret.variants.push({
            pricePerUnit: x.price?.pricePerUnit,
            variantId: x.price?.variantId,
            quantity: 1
          });
        }
      });
    }

    //Calculate total
    ret.variants.forEach((x) => {
      ret.totalPrice += x.quantity * x.pricePerUnit;
    });

    return ret;
  }
}