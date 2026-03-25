class PrintessShopifyGraphQlApi {
    constructor(graphQlToken) {
        this.graphQlToken = graphQlToken;
    }
    static strEscapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    static strReplaceAll(str, find, replace) {
        return str.replace(new RegExp(PrintessShopifyGraphQlApi.strEscapeRegExp(find), 'g'), replace);
    }
    getSubObjectByPath(root, path) {
        path = path ? path.trim() : "";
        if (!root || !path) {
            return null;
        }
        const splits = path.split(".");
        let result = root;
        for (let i = 0; i < splits.length; ++i) {
            if (result.hasOwnProperty(splits[i]) && result[splits[i]]) {
                result = result[splits[i]];
            }
            else {
                return null;
            }
        }
        return result;
    }
    async sendGQl(query, resultVarName) {
        const response = await fetch("/api/unstable/graphql.json", {
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
        const json = await response.json();
        if (json.errors && json.errors.length > 0) {
            console.log("Failed query: " + JSON.stringify(json.errors));
            return null;
        }
        console.log(json);
        return this.getSubObjectByPath(json.data, resultVarName);
    }
    async getProductOptions(productId) {
        const that = this;
        const query = {
            variables: {
                productId: "gid://shopify/Product/" + productId.toString()
            },
            query: `
                query GetProductsById($productId: ID!) {
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
        let position = 1;
        const result = (await this.sendGQl(query, "product.options")).map((x) => {
            return {
                ...x,
                id: PrintessShopifyGraphQlApi.parseShopifyId(x.id),
                optionValues: x.optionValues.map((y) => {
                    return {
                        ...y,
                        id: PrintessShopifyGraphQlApi.parseShopifyId(y.id)
                    };
                })
            };
        });
        result.forEach((x, index) => x.position = index + 1);
        return result;
    }
    static parseShopifyId(id) {
        const split = (id || "").split("/");
        return parseInt(split[split.length - 1]);
    }
    async getProductById(id, autoloadOptions) {
        const query = {
            query: `
                query GetProductsById($productId: ID!) {
                    product(id: $productId) {
                        title
                        handle
                        templateName: metafield(namespace: "printess", key: "templateName") {
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
        const product = await this.sendGQl(query, "product");
        if (product) {
            product.id = id;
            if (autoloadOptions) {
                product.productOptions = await this.getProductOptions(id);
            }
            return product;
        }
        return null;
    }
    async GetProductVariantByOptions(id, options, returnDefault = false) {
        const queryVariables = {};
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
                optionLookup: selectedOptions {
                    name,
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
                methodArguments += ",$" + optionName + ": String!,$" + valueName + ": String!";
                count += 1;
            }
        }
        variantFilter = "selectedOptions: [" + variantFilter + "]";
        const query = {
            query: `
                query GetProductsById({METHOD_ARGUMENTS}) {
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
                            }
                        }
                    }
                }`,
            variables: queryVariables
        };
        query.query = query.query.replace("{METHOD_ARGUMENTS}", methodArguments).replace("{DEFAULT_VARIANT}", returnDefault ? defaulVariantQuery : "").replace("{VARIANT_FILTER}", variantFilter);
        const variantResponse = await this.sendGQl(query, "product");
        if (variantResponse) {
            const mapVariant = (variant) => {
                return {
                    ...variant,
                    id: PrintessShopifyGraphQlApi.parseShopifyId(variant.id),
                    option1: variant.optionLookup && variant.optionLookup.length > 0 ? variant.optionLookup[0].value : null,
                    option2: variant.optionLookup && variant.optionLookup.length > 1 ? variant.optionLookup[1].value : null,
                    option3: variant.optionLookup && variant.optionLookup.length > 2 ? variant.optionLookup[2].value : null,
                    options: !variant.optionLookup ? null : variant.optionLookup.map(x => x.value),
                    price: variant.price && typeof variant.price.amount === "string" ? { amount: parseFloat(variant.price.amount) } : variant.price
                };
            };
            if (variantResponse.defaultVariant || variantResponse.variantBySelectedOptions) {
                return {
                    defaultVariant: variantResponse.defaultVariant ? mapVariant(variantResponse.defaultVariant) : null,
                    variantBySelectedOptions: variantResponse.variantBySelectedOptions ? mapVariant(variantResponse.variantBySelectedOptions) : null,
                };
            }
            else {
                return null;
            }
        }
        return null;
    }
    async GetProductVariantById(id) {
        const queryVariables = {};
        queryVariables["variantId"] = "gid://shopify/ProductVariant/" + id.toString();
        const query = {
            query: `
                query GetProductVariantById($variantId: ID!) {
                    productVariant(id: $variantId) {
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
                        }
                    }
                }`,
            variables: queryVariables
        };
        const variantResponse = await this.sendGQl(query, "productVariant");
        if (variantResponse) {
            const mapVariant = (variant) => {
                return {
                    ...variant,
                    id: PrintessShopifyGraphQlApi.parseShopifyId(variant.id),
                    option1: variant.optionLookup && variant.optionLookup.length > 0 ? variant.optionLookup[0].value : null,
                    option2: variant.optionLookup && variant.optionLookup.length > 1 ? variant.optionLookup[1].value : null,
                    option3: variant.optionLookup && variant.optionLookup.length > 2 ? variant.optionLookup[2].value : null,
                    options: !variant.optionLookup ? null : variant.optionLookup.map(x => x.value),
                    price: variant.price && typeof variant.price.amount === "string" ? { amount: parseFloat(variant.price.amount) } : variant.price
                };
            };
            if (variantResponse.variantBySelectedOptions) {
                return mapVariant(variantResponse.variantBySelectedOptions);
            }
            else {
                return null;
            }
        }
        return null;
    }
    getProductVariantsInternal(productId, cursor = null) {
        const query = {
            query: `
                query GetProductsById($productId: ID!{CURSOR1}) {
                    product(id: $productId) {
                        variants(first: 50{CURSOR2}) {
                            edges {
                                node {
                                    id,
                                    available: availableForSale,
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
                productId: "gid://shopify/Product/" + productId.toString()
            }
        };
        query.query = query.query.replace("{CURSOR1}", cursor ? ", $cursor: String" : "").replace("{CURSOR2}", cursor ? ", after: $cursor" : "");
        return this.sendGQl(query, "product.variants");
    }
    async getProductVariants(productId) {
        let ret = [];
        let cursor = "";
        let response;
        let currentReuqestCounter = 0;
        while (currentReuqestCounter < 500) {
            currentReuqestCounter += 1;
            response = await this.getProductVariantsInternal(productId, cursor);
            if (response.edges && response.edges.length > 0) {
                response.edges.forEach((node) => {
                    ret.push({
                        id: PrintessShopifyGraphQlApi.parseShopifyId(node.node.id),
                        available: node.node.available === true,
                        options: node.node.selectedOptions.map((option) => {
                            return {
                                optionName: option.name,
                                optionValue: option.value
                            };
                        })
                    });
                });
                if (response.pageInfo.endCursor != cursor) {
                    cursor = response.pageInfo.endCursor;
                }
                else {
                    break;
                }
                if (!response.pageInfo.hasNextPage) {
                    break;
                }
            }
            else {
                break;
            }
        }
        return ret;
    }
}