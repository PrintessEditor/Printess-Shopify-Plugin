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

export interface IPrintessPriceConfig {
  displayName?: string | null
  includedPageCount?: number | null
  disableQuantity?: boolean | null
  pricePerPage?: IPrintessVariantPrice
  formFieldPrices?: IPrintessFormFieldPrice[]
}

export interface ICalculatedAdditionalPrices {
  variants: {
    variantId: string
    quantity: number
    pricePerUnit: number
  }[]
  totalPrice: number
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

  public static calculatePrice(numberOfPages: number, formFieldValues: IPrintessFormfieldAndValue[], config: IPrintessPriceConfig | string): ICalculatedAdditionalPrices {
    const that = this;

    const ret: ICalculatedAdditionalPrices = {
      totalPrice: 0.0,
      variants: []
    };

    if (config && typeof config === "string") {
      config = <IPrintessPriceConfig>JSON.parse(config);
    }

    if (!config) {
      return ret;
    }

    config = <IPrintessPriceConfig>config;//Make compiler happy

    //Calculate price per page values
    if (numberOfPages > 0) {
      if (this.hasValue(config.pricePerPage) && this.hasValue(config.pricePerPage?.variantId) && config.pricePerPage?.variantId && this.hasValue(config.pricePerPage?.pricePerUnit) && typeof config.pricePerPage?.pricePerUnit === "number" && config.pricePerPage?.pricePerUnit > 0) {
        let pricePerUnit: number = config.pricePerPage?.pricePerUnit || 0;
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