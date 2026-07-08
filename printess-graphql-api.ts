import { IPrintessShopifyGraphQlApi, IProduct, IProductOption, IProductVariantsResponse, IQuery, IResult, IShortVariant, IVariant, IVariantResponse } from "./printess-graphql-api.d";

interface IGraphQlResponse<T> {
  errors?: { message: string }[]
  userErrors?: { message: string }[]
  data?: T
}

interface IProductOptionRequest {
  domain: string
  language?: string | null
  productId: number
}

interface IServiceVariant extends IVariant<number> {
  metaData: Record<string, string>
}

interface IInternalProductVariantResponse {
  variants: IServiceVariant[]
  "pageInfo": {
    "hasNextPage": boolean,
    "endCursor": false
  }
}

export class PrintessShopifyGraphQlApi implements IPrintessShopifyGraphQlApi {
  private graphQlToken: string;
  private language: string | null = null;
  private apiDomain: string;
  private shopToken: string;

  public constructor(apiDomain: string, shopToken: string, graphQlToken: string, language: string | null = null) {
    this.apiDomain = apiDomain || "api.printess.com";
    this.graphQlToken = graphQlToken;
    this.language = language ? language.toUpperCase() : null;
    this.shopToken = shopToken;
  }

  private static usePrintessApi(token: string): boolean {
    return (token || "").includes("myshopify.com");
  }

  private static strEscapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static strReplaceAll(str: string, find: string, replace: string): string {
    return str.replace(new RegExp(PrintessShopifyGraphQlApi.strEscapeRegExp(find), 'g'), replace);
  }

  private getSubObjectByPath<T>(root: Record<string, any>, path: string): T | null {
    path = path ? path.trim() : "";

    if (!root || !path) {
      return null;
    }

    const splits = path.split(".");

    let result: Record<string, any> = root;

    for (let i = 0; i < splits.length; ++i) {
      if (result.hasOwnProperty(splits[i]) && result[splits[i]]) {
        result = result[splits[i]];
      } else {
        return null;
      }
    }

    return result as T;
  }

  private async sendGQl<T>(query: IQuery, resultVarName: string): Promise<T | null> {
    const response = await fetch("/api/unstable/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": this.graphQlToken,
          "Accept": "application/json"
        },
        body: JSON.stringify(query),
      });

    if (!response.ok) {
      console.log("Failed query: [" + response.status + "] " + response.statusText);
      return null;
    }

    const json = await response.json() as IResult;

    if (json.errors && json.errors.length > 0) {
      console.log("Failed query: " + JSON.stringify(json.errors));
      return null;
    }

    return this.getSubObjectByPath<T>(json.data || {}, resultVarName);
  }

  private async sendPrintessApiRequest<T, U>(path: string, model: T): Promise<U | null> {
    const response = await fetch(`https://${this.apiDomain}/${path}`, {
      method: 'POST',
      redirect: "follow",
      headers: {
        "Content-Type": 'application/json',
        "Authorization": `Bearer ${this.shopToken}`,
      },
      body: JSON.stringify(model)
    });

    if (!response.ok) {
      console.error(`Printess Integration: Unable to execute graphql query: [${response.status}] ${response.statusText}`);
      return null;
    }

    const json = await response.json()
    const graphQlResponse = <IGraphQlResponse<U>>(json);

    if (graphQlResponse.errors && graphQlResponse.errors.length > 0) {
      graphQlResponse.errors.forEach((x) => {
        console.error(`Printess Integration: Unable to execute graphql query: [${response.status}] ${response.statusText}`);
      });

      return null;
    }

    if (graphQlResponse.userErrors && graphQlResponse.userErrors.length > 0) {
      graphQlResponse.userErrors.forEach((x) => {
        console.error(`Printess Integration: Unable to execute graphql query: [${response.status}] ${response.statusText}`);
      });

      return null;
    }

    return graphQlResponse.data || null;
  }

  private applyLanguageSettings(query: IQuery): void {
    if (!query.variables) {
      query.variables = {};
    }

    if (this.language) {
      query.variables.language = this.language;
      query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{LANG_PARAM}", ", $language: LanguageCode!");
      query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{IN_CONTEXT_PARAM}", " @inContext(language: $language)");
    } else {
      query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{LANG_PARAM}", "");
      query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{IN_CONTEXT_PARAM}", "");
    }
  }

  public async getProductOptions(productId: number): Promise<IProductOption<number>[]> {
    if (PrintessShopifyGraphQlApi.usePrintessApi(this.graphQlToken)) {
      const ret = await this.sendPrintessApiRequest<IProductOptionRequest, IProductOption<number>[]>("shops/shopify/product/options", {
        domain: this.graphQlToken,
        language: this.language || null,
        productId: productId
      });

      return ret || [];
    }

    const query = {
      variables: {
        productId: "gid://shopify/Product/" + productId.toString()
      },
      query: `
                query GetProductsById($productId: ID!{LANG_PARAM}){IN_CONTEXT_PARAM} {
                    product(id: $productId) {
                            options(first: 4) {
                                name,
                                id,
                                optionValues {
                                    id,
                                    name
                                }
                            }
                    }
                }`
    };

    this.applyLanguageSettings(query);

    let position = 1;

    const result: IProductOption<number>[] = ((await this.sendGQl<IProductOption<string>[]>(query, "product.options")) ?? []).map((x) => {
      return {
        ...x,
        id: PrintessShopifyGraphQlApi.parseShopifyId(x.id),
        optionValues: x.optionValues.map((y) => {
          return {
            ...y,
            id: PrintessShopifyGraphQlApi.parseShopifyId(y.id)
          }
        })
      }
    });

    result.forEach((x, index) => x.position = index + 1);

    return result;
  }

  private static parseShopifyId(id: string): number {
    const split = (id || "").split("/");

    return parseInt(split[split.length - 1]);
  }

  public async getProductByHandle(handle: string, autoloadOptions: boolean = true, metaFields: string[] | null = null): Promise<IProduct | null> {
    const query = {
      query: `
                query getProductByHandle($handle: String!{LANG_PARAM}){IN_CONTEXT_PARAM} {
                    product(handle: $handle) {
                        title
                        handle
                        tags
                        id
                        templateName: metafield(namespace: "printess", key: "templateName") {
                            value
                        },
                        printTemplateName: metafield(namespace: "printess", key: "printTemplateName") {
                            value
                        },
                        optionNameMapping: metafield(namespace: "printess", key: "optionNameMapping") {
                            value
                        },
                        productType: metafield(namespace: "printess", key: "productType") {
                            value
                        },
                        productDefinitionId: metafield(namespace: "printess", key: "productDefinitionId") {
                            value
                        },
                        mergeTemplates: metafield(namespace: "printess", key: "mergeTemplates") {
                            value
                        },
                        printessSettings: metafield(namespace: "printess", key: "settings") {
                            value
                        },
                        outputDpi: metafield(namespace: "printess", key: "dpi") {
                            value
                        },
                        outputFormat: metafield(namespace: "printess", key: "outputFormat") {
                            value
                        },
                        tableQuantityFormField: metafield(namespace: "printess", key: "tableQuantityFormField") {
                            value
                        },
                        ignoreDropshipBundling: metafield(namespace: "printess", key: "ignoreDropshipBundling") {
                            value
                        },
                        dropshipBundlingId: metafield(namespace: "printess", key: "dropshipBundlingId") {
                            value
                        },
                        variantSwitchingOption: metafield(namespace: "printess", key: "variantSwitchingOption") {
                            value
                        },
                        theme: metafield(namespace: "printess", key: "theme") {
                            value
                        }
                    }
                }`,
      variables: {
        handle: handle
      }
    };

    let product: IProduct | null = null;

    if (PrintessShopifyGraphQlApi.usePrintessApi(this.graphQlToken)) {
      const apiProduct = await this.sendPrintessApiRequest<any, { id: string, title: string, handle: string, tags: string, metaData: Record<string, string> }>("shops/shopify/product/get", {
        domain: this.graphQlToken,
        language: this.language || null,
        productHandle: handle,
        metaFields: metaFields || null
      });

      if (apiProduct == null) {
        return null;
      }

      const idParts = apiProduct.id.split("/");

      product = {
        id: parseInt(idParts[idParts.length - 1]),
        handle: apiProduct.handle || "",
        title: apiProduct.title,
        dropshipBundlingId: {
          value: apiProduct.metaData && apiProduct.metaData["dropshipBundlingId"] ? (apiProduct.metaData["dropshipBundlingId"] || undefined) : undefined,
        },
        ignoreDropshipBundling: {
          value: apiProduct.metaData && apiProduct.metaData["ignoreDropshipBundling"] ? (apiProduct.metaData["ignoreDropshipBundling"] || undefined) : undefined,
        },
        optionNameMapping: {
          value: apiProduct.metaData && apiProduct.metaData["optionNameMapping"] ? (apiProduct.metaData["optionNameMapping"] || undefined) : undefined,
        },
        outputDpi: {
          value: apiProduct.metaData && apiProduct.metaData["dpi"] ? (apiProduct.metaData["dpi"] || undefined) : undefined,
        },
        outputFormat: {
          value: apiProduct.metaData && apiProduct.metaData["outputFormat"] ? (apiProduct.metaData["outputFormat"] || undefined) : undefined,
        },
        printTemplateName: {
          value: apiProduct.metaData && apiProduct.metaData["printTemplateName"] ? (apiProduct.metaData["printTemplateName"] || undefined) : undefined,
        },
        tableQuantityFormField: {
          value: apiProduct.metaData && apiProduct.metaData["tableQuantityFormField"] ? (apiProduct.metaData["tableQuantityFormField"] || undefined) : undefined,
        },
        tags: apiProduct.tags,
        templateName: {
          value: apiProduct.metaData && apiProduct.metaData["templateName"] ? (apiProduct.metaData["templateName"] || "") : "",
        },
        printessSettings: {
          value: apiProduct.metaData && apiProduct.metaData["settings"] ? (apiProduct.metaData["settings"] || "") : "",
        }
      };

      if (apiProduct.metaData) {
        for (const propertyName in apiProduct.metaData) {
          if (apiProduct.metaData.hasOwnProperty(propertyName) && typeof (<any>product)[propertyName] == "undefined") {
            (<any>product)[propertyName] = {
              value: apiProduct.metaData[propertyName] || null
            }
          }
        }
      }
    } else {
      product = await this.sendGQl<IProduct>(query, "product");
    }

    if (product) {
      if (typeof product.tags === "string") {
        try {
          product.tags = JSON.parse(product.tags);

          if (!Array.isArray(product.tags)) {
            product.tags = (product.tags || "").split(",");
          }
        } catch (e) {
          console.log("Printess Integration: Tags are not serialized json: " + e);
        }
      }

      if (autoloadOptions) {
        product.productOptions = await this.getProductOptions(product.id);
      }

      return product;
    }

    return null;
  }

  public async getProductById(id: number, autoloadOptions: boolean = true, metaFields: string[] | null = null): Promise<IProduct | null> {
    const query = {
      query: `
                query GetProductsById($productId: ID!) {
                    product(id: $productId) {
                        title
                        handle
                        tags
                        templateName: metafield(namespace: "printess", key: "templateName") {
                            value
                        },
                        printTemplateName: metafield(namespace: "printess", key: "printTemplateName") {
                            value
                        },
                        optionNameMapping: metafield(namespace: "printess", key: "optionNameMapping") {
                            value
                        },
                        productType: metafield(namespace: "printess", key: "productType") {
                            value
                        },
                        productDefinitionId: metafield(namespace: "printess", key: "productDefinitionId") {
                            value
                        },
                        mergeTemplates: metafield(namespace: "printess", key: "mergeTemplates") {
                            value
                        },
                        printessSettings: metafield(namespace: "printess", key: "settings") {
                            value
                        },
                        outputDpi: metafield(namespace: "printess", key: "dpi") {
                            value
                        },
                        outputFormat: metafield(namespace: "printess", key: "outputFormat") {
                            value
                        },
                        tableQuantityFormField: metafield(namespace: "printess", key: "tableQuantityFormField") {
                            value
                        },
                        ignoreDropshipBundling: metafield(namespace: "printess", key: "ignoreDropshipBundling") {
                            value
                        },
                        dropshipBundlingId: metafield(namespace: "printess", key: "dropshipBundlingId") {
                            value
                        },
                        variantSwitchingOption: metafield(namespace: "printess", key: "variantSwitchingOption") {
                            value
                        },
                        theme: metafield(namespace: "printess", key: "theme") {
                            value
                        }
                    }
                }`,
      variables: {
        productId: "gid://shopify/Product/" + id.toString()
      }
    };

    let product: IProduct | null = null;

    if (PrintessShopifyGraphQlApi.usePrintessApi(this.graphQlToken)) {
      const apiProduct = await this.sendPrintessApiRequest<any, { title: string, handle: string, tags: string, metaData: Record<string, string> }>("shops/shopify/product/get", {
        domain: this.graphQlToken,
        language: this.language || null,
        productId: id,
        metaFields: metaFields || null
      });

      if (apiProduct == null) {
        return null;
      }

      product = {
        id: id,
        handle: apiProduct.handle || "",
        title: apiProduct.title,
        dropshipBundlingId: {
          value: apiProduct.metaData && apiProduct.metaData["dropshipBundlingId"] ? (apiProduct.metaData["dropshipBundlingId"] || undefined) : undefined,
        },
        ignoreDropshipBundling: {
          value: apiProduct.metaData && apiProduct.metaData["ignoreDropshipBundling"] ? (apiProduct.metaData["ignoreDropshipBundling"] || undefined) : undefined,
        },
        optionNameMapping: {
          value: apiProduct.metaData && apiProduct.metaData["optionNameMapping"] ? (apiProduct.metaData["optionNameMapping"] || undefined) : undefined,
        },
        outputDpi: {
          value: apiProduct.metaData && apiProduct.metaData["dpi"] ? (apiProduct.metaData["dpi"] || undefined) : undefined,
        },
        outputFormat: {
          value: apiProduct.metaData && apiProduct.metaData["outputFormat"] ? (apiProduct.metaData["outputFormat"] || undefined) : undefined,
        },
        printTemplateName: {
          value: apiProduct.metaData && apiProduct.metaData["printTemplateName"] ? (apiProduct.metaData["printTemplateName"] || undefined) : undefined,
        },
        tableQuantityFormField: {
          value: apiProduct.metaData && apiProduct.metaData["tableQuantityFormField"] ? (apiProduct.metaData["tableQuantityFormField"] || undefined) : undefined,
        },
        tags: apiProduct.tags,
        templateName: {
          value: apiProduct.metaData && apiProduct.metaData["templateName"] ? (apiProduct.metaData["templateName"] || "") : "",
        },
        printessSettings: {
          value: apiProduct.metaData && apiProduct.metaData["settings"] ? (apiProduct.metaData["settings"] || "") : "",
        }
      };

      if (apiProduct.metaData) {
        for (const propertyName in apiProduct.metaData) {
          if (apiProduct.metaData.hasOwnProperty(propertyName) && typeof (<any>product)[propertyName] == "undefined") {
            (<any>product)[propertyName] = {
              value: apiProduct.metaData[propertyName] || null
            }
          }
        }
      }
    } else {
      product = await this.sendGQl<IProduct>(query, "product");
    }

    if (product) {
      product.id = id;

      if (typeof product.tags === "string") {
        try {
          product.tags = JSON.parse(product.tags);

          if (!Array.isArray(product.tags)) {
            product.tags = (product.tags || "").split(",");
          }
        } catch (e) {
          console.log("Printess Integration: Tags are not serialized json: " + e);
        }
      }

      if (autoloadOptions) {
        product.productOptions = await this.getProductOptions(id)
      }

      return product;
    }

    return null;
  }

  public async getProductVariantByOptions(id: number, options: Record<string, string>, returnDefault: boolean = false): Promise<IVariantResponse<number> | null> {
    if (PrintessShopifyGraphQlApi.usePrintessApi(this.graphQlToken)) {
      const response = await this.sendPrintessApiRequest<any, IVariantResponse<number>>("shops/shopify/variant/getbyoptions", {
        domain: this.graphQlToken,
        language: this.language || null,
        productId: id,
        productOptions: options,
        returnDefaultVariant: returnDefault,
        metaField: null
      });

      if (response?.defaultVariant) {
        const metaData = (<any>response.defaultVariant).metaData;

        if (metaData) {
          for (var propertyName in metaData) {
            if (metaData.hasOwnProperty(propertyName)) {
              (<any>response.defaultVariant)[propertyName] = metaData[propertyName];
            }
          }
        }
      }

      if (response?.variantBySelectedOptions) {
        const metaData = (<any>response.variantBySelectedOptions).metaData;

        if (metaData) {
          for (var propertyName in metaData) {
            if (metaData.hasOwnProperty(propertyName)) {
              (<any>response.variantBySelectedOptions)[propertyName] = metaData[propertyName];
            }
          }
        }
      }

      if (response) {
        const mapVariant = (variant: IVariant<number>): IVariant<number> => {
          return {
            ...variant,
            id: variant.id,
            option1: variant.optionLookup && variant.optionLookup.length > 0 ? variant.optionLookup[0].value : null,
            option2: variant.optionLookup && variant.optionLookup.length > 1 ? variant.optionLookup[1].value : null,
            option3: variant.optionLookup && variant.optionLookup.length > 2 ? variant.optionLookup[2].value : null,
            options: !variant.optionLookup ? null : variant.optionLookup.map(x => x.value),
            price: variant.price && typeof variant.price.amount === "string" ? { amount: parseFloat(variant.price.amount) } : variant.price,
            templateName: variant.printessTemplateName?.value,
            printTemplateName: variant.printTemplateName?.value || "",
            mergeTemplates: variant.mergeTemplates?.value || ""
          } as IVariant<number>
        };

        if (response.defaultVariant || response.variantBySelectedOptions) {
          return {
            defaultVariant: response.defaultVariant ? mapVariant(response.defaultVariant) : null,
            variantBySelectedOptions: response.variantBySelectedOptions ? mapVariant(response.variantBySelectedOptions) : null,
          }
        } else {
          return null;
        }
      }

      return response;
    }

    const queryVariables: Record<string, string> = {};
    queryVariables["productId"] = "gid://shopify/Product/" + id.toString();
    let count = 0;
    let variantFilter = "";
    let methodArguments = "$productId: ID!";
    const defaulVariantQuery = `
            defaultVariant: selectedOrFirstAvailableVariant {
        				title,
        				id,
        				available: availableForSale,
        				sku,
        				requires_shipping: requiresShipping,
        				taxable,
        				price {amount},
                printessTemplateName: metafield(namespace: "printess", key: "templateName") {
                    value
                },
                printTemplateName: metafield(namespace: "printess", key: "printTemplateName") {
                    value
                },
                optionLookup: selectedOptions {
                    name,
                    value
                },
                mergeTemplates: metafield(namespace: "printess", key: "mergeTemplates") {
                    value
                }
			},
        `;

    for (const propertyName in options) {
      if (options.hasOwnProperty(propertyName)) {
        const optionName = "optionName" + count;
        const valueName = "valueName" + count;

        queryVariables[optionName] = propertyName;
        queryVariables[valueName] = options[propertyName];

        if (variantFilter) {
          variantFilter += ",";
        }

        variantFilter += "{name: $" + optionName + ", value: $" + valueName + "}";
        methodArguments += ",$" + optionName + ": String!,$" + valueName + ": String!"

        count += 1;
      }
    }

    variantFilter = "selectedOptions: [" + variantFilter + "]";

    const query = {
      query: `
                query GetProductsById({METHOD_ARGUMENTS}{LANG_PARAM}){IN_CONTEXT_PARAM} {
                    product(id: $productId) {
                        {DEFAULT_VARIANT}
                        variantBySelectedOptions({VARIANT_FILTER}){
                            title,
                            id,
                            available: availableForSale,
                            requires_shipping: requiresShipping,
                            taxable,
                            sku,
                            printessTemplateName: metafield(namespace: "printess", key: "templateName") {
                                value
                            },
                            price {amount},
                            optionLookup: selectedOptions {
                                name,
                                value
                            },
                            mergeTemplates: metafield(namespace: "printess", key: "mergeTemplates") {
                                value
                            }
                        }
                    }
                }`,
      variables: queryVariables
    };

    query.query = query.query.replace("{METHOD_ARGUMENTS}", methodArguments).replace("{DEFAULT_VARIANT}", returnDefault ? defaulVariantQuery : "").replace("{VARIANT_FILTER}", variantFilter);

    this.applyLanguageSettings(query);

    const variantResponse: IVariantResponse<string> | null = await this.sendGQl<IVariantResponse<string>>(query, "product");

    if (variantResponse) {
      const mapVariant = (variant: IVariant<string>): IVariant<number> => {
        return {
          ...variant,
          id: PrintessShopifyGraphQlApi.parseShopifyId(variant.id),
          option1: variant.optionLookup && variant.optionLookup.length > 0 ? variant.optionLookup[0].value : null,
          option2: variant.optionLookup && variant.optionLookup.length > 1 ? variant.optionLookup[1].value : null,
          option3: variant.optionLookup && variant.optionLookup.length > 2 ? variant.optionLookup[2].value : null,
          options: !variant.optionLookup ? null : variant.optionLookup.map(x => x.value),
          price: variant.price && typeof variant.price.amount === "string" ? { amount: parseFloat(variant.price.amount) } : variant.price,
          templateName: variant.printessTemplateName?.value,
          printTemplateName: variant.printTemplateName?.value || "",
          mergeTemplates: variant.mergeTemplates?.value || ""
        } as IVariant<number>
      };

      if (variantResponse.defaultVariant || variantResponse.variantBySelectedOptions) {
        return {
          defaultVariant: variantResponse.defaultVariant ? mapVariant(variantResponse.defaultVariant) : null,
          variantBySelectedOptions: variantResponse.variantBySelectedOptions ? mapVariant(variantResponse.variantBySelectedOptions) : null,
        }
      } else {
        return null;
      }
    }

    return null;
  }

  private async getProductVariantsInternal(productId: number, metaFields: string[], cursor: string | null = null): Promise<IProductVariantsResponse | null> {
    if (PrintessShopifyGraphQlApi.usePrintessApi(this.graphQlToken)) {
      const response = await this.sendPrintessApiRequest<any, IInternalProductVariantResponse>("shops/shopify/variant/get", {
        domain: this.graphQlToken,
        language: this.language || null,
        productId: productId,
        cursor: cursor
      });

      if (response) {
        const ret = {
          edges: [] as {
            "node": {
              "id": string,
              "available": boolean,
              "title"?: string,
              "sku"?: string,
              "requires_shipping"?: boolean,
              "taxable"?: boolean,
              "price"?: { "amount": number },
              "templateName": { value: string },
              "selectedOptions": {
                "name": string,
                "value": string
              }[]
            }
          }[],
          pageInfo: {
            "hasNextPage": response?.pageInfo?.hasNextPage || true,
            "endCursor": response?.pageInfo?.endCursor || ""
          }
        };

        if (response.variants) {
          response.variants.forEach((variant) => {
            const mappedVariant = {
              node: {
                available: variant.available,
                id: variant.id.toString(),
                selectedOptions: variant.optionLookup,
                price: variant.price && typeof variant.price.amount === "string" ? { amount: parseFloat(variant.price.amount) } : variant.price,
                title: variant.title,
                sku: variant.sku,
                requires_shipping: variant.requires_shipping,
                taxable: variant.taxable,
                templateName: { value: variant.templateName ? variant.templateName?.value || "" : "" },
                option1: variant.optionLookup && variant.optionLookup.length > 0 ? variant.optionLookup[0].value : null,
                option2: variant.optionLookup && variant.optionLookup.length > 1 ? variant.optionLookup[1].value : null,
                option3: variant.optionLookup && variant.optionLookup.length > 2 ? variant.optionLookup[2].value : null,
                options: !variant.optionLookup ? null : variant.optionLookup.map(x => x.value)
              }
            };

            if (variant.metaData) {
              for (const property in variant.metaData) {
                if (variant.metaData.hasOwnProperty(property)) {
                  (<any>variant)[property] = { value: variant.metaData[property] || "" }
                }
              }
            }

            ret.edges.push(mappedVariant);
          });
        }

        return ret;
      }

      return {
        "edges": [],
        "pageInfo": {
          "hasNextPage": false,
          "endCursor": ""
        }
      }
    };

    const query = {
      query: `
                query GetProductsById($productId: ID!{CURSOR1}{LANG_PARAM}){IN_CONTEXT_PARAM} {
                    product(id: $productId) {
                        variants(first: 50{CURSOR2}) {
                            edges {
                                node {
                                    id,
                                    available: availableForSale,
                                    templateName: metafield(namespace: "printess", key: "templateName") {
                                        value
                                    },
                                    selectedOptions {
                                        name
                                        value
                                    }
                                }
                            }
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                        }
                    }
                }`,
      "variables": {
        productId: "gid://shopify/Product/" + productId.toString(),
        cursor: cursor
      }
    };

    query.query = query.query.replace("{CURSOR1}", cursor ? ", $cursor: String" : "").replace("{CURSOR2}", cursor ? ", after: $cursor" : "");

    this.applyLanguageSettings(query);

    return await this.sendGQl<IProductVariantsResponse>(query, "product.variants");
  }

  public async getProductVariants(productId: number, metaFields: string[] = ["templateName", "mergeTemplates"]): Promise<IShortVariant[]> {
    let ret: IShortVariant[] = [];
    let cursor = "";
    let response: IProductVariantsResponse | null;
    let currentReuqestCounter = 0;

    while (currentReuqestCounter < 500) {
      currentReuqestCounter += 1;

      response = await this.getProductVariantsInternal(productId, metaFields, cursor);

      if (response && response.edges && response.edges.length > 0) {
        response.edges.forEach((node) => {
          ret.push({
            id: PrintessShopifyGraphQlApi.parseShopifyId(node.node.id),
            available: node.node.available === true,
            templateName: node.node.templateName?.value || "",
            options: node.node.selectedOptions.map((option) => {
              return {
                optionName: option.name,
                optionValue: option.value
              };
            })
          });
        });

        if (response.pageInfo.endCursor != cursor && response.edges.length > 0 && response.edges.length >= 50) {
          cursor = response.pageInfo.endCursor;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return ret;
  }
}

export function createPrintessShopifyApi(apiDomain: string, shopToken: string, graphQlToken: string, language: string | null = null): IPrintessShopifyGraphQlApi {
  return new PrintessShopifyGraphQlApi(apiDomain, shopToken, graphQlToken, language);
}