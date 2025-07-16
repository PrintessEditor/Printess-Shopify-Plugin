class PrintessShopifySlimUi {
    constructor() {
        this._fullVariantCache = {};
        this._urlParams = null;
    }
    static classExists(c) {
        return typeof c === "function" && typeof c.prototype === "object";
    }
    static sleepAsync(timeoutMs) {
        return new Promise((resolve) => setTimeout(resolve, timeoutMs));
    }
    static printessQueryItem(itemQuery, callback, failedCallback = null, timeout = 200, maxRetires = 20, retries = 0) {
        if (retries >= maxRetires) {
            if (typeof failedCallback === "function") {
                failedCallback();
            }
            return;
        }
        const element = itemQuery();
        if (element) {
            callback(element);
            return;
        }
        setTimeout(function () {
            const element = itemQuery();
            if (element) {
                callback(element);
            }
            else {
                PrintessShopifySlimUi.printessQueryItem(itemQuery, callback, failedCallback, timeout, maxRetires, retries + 1);
            }
        }, timeout);
    }
    static async printessQueryItemAsync(itemQuery, timeout = 50, maxRetires = 20) {
        return new Promise((resolve, reject) => PrintessShopifySlimUi.printessQueryItem(itemQuery, resolve, reject, timeout, maxRetires));
    }
    onClassChange(node, callback) {
        let lastClassString = node?.classList.toString();
        const mutationObserver = new MutationObserver((mutationList) => {
            for (const item of mutationList) {
                if (item.attributeName === "class") {
                    const classString = node?.classList.toString();
                    if (classString !== lastClassString) {
                        callback(mutationObserver, classString);
                        lastClassString = classString;
                        break;
                    }
                }
            }
        });
        if (node) {
            mutationObserver.observe(node, { attributes: true });
        }
    }
    async initialize(instanceIndex) {
        try {
            const variantContainer = document.createElement("div");
            variantContainer.classList.add("printess-item-container", "printess-ui", "printess-hidden");
            const mediaImage = this.getUiNode("image");
            if (this._variantSelector && this._variantSelector.parentElement) {
                this._variantSelector.parentElement.insertBefore(variantContainer, this._variantSelector.nextSibling);
            }
            if (instanceIndex === 0) {
                this._urlParams = PrintessShopifySlimUi.getUrlParams();
            }
            const loader = PrintessShopifySlimUi.getOrCreateProgressIndicator(this.getUiNode("image")?.parentElement, this.getUiNode("progressIndicator"), false);
            const that = this;
            this.onClassChange(loader, (observer, classList) => {
                if (classList.indexOf("printess-loader-visible") >= 0) {
                    this.showImageProgressIndicator(true);
                }
                else {
                    this.showImageProgressIndicator(false);
                }
            });
            let templateName = this._urlParams && this._urlParams.saveToken ? this._urlParams.saveToken : this._product.templateName.value;
            templateName = await PrintessShopifySlimUi._callbacks.getTemplateNameAsync(this, this._product, templateName);
            const theme = await PrintessShopifySlimUi._callbacks.getThemeAsync(this, this._product, this._product.theme?.value || "DEFAULT");
            let formFields = null;
            let mergeTemplates = null;
            if (!PrintessShopifySlimUi.isSaveToken(templateName)) {
                formFields = this.getProductFormFieldValues();
                formFields = await PrintessShopifySlimUi._callbacks.getFormFieldValuesAsync(this, formFields);
                mergeTemplates = await PrintessShopifySlimUi._callbacks.getMergeTemplatesAsync(this, this._product, []);
            }
            this._state = await (typeof window["createSlimUi"] === "function" ? window["createSlimUi"] : window["PrintessSlimUi"].createSlimUi)({
                previewContainer: document.createElement("div"),
                uiContainer: variantContainer,
                previewImage: mediaImage ? mediaImage : null,
                loader: loader,
                shopToken: this._settings.shopToken,
                templateName: templateName,
                published: true,
                formFields: formFields,
                mergeTemplates: mergeTemplates,
                theme: theme,
                formFieldChangedCallback: function (name, value, tag, label, ffLabel) { that.setProductOptionValue(name, value, ffLabel, label); }
            });
            variantContainer.classList.remove("printess-hidden");
            this.showImageProgressIndicator(false);
            this.showFormsProgressIndicator(false);
            this.addAddToBasketButton();
        }
        catch (e) {
            console.error(e);
        }
        finally {
            if (this._parent) {
                this._parent.setAttribute("data-printess-forms-status", "initialized");
            }
        }
    }
    async onBasketItemClick(designNowButton) {
        this.showFormsProgressIndicator(true);
        this.showImageProgressIndicator(true);
        PrintessShopifySlimUi.showElement(designNowButton, false);
        try {
            const result = await this._state.createSaveToken();
            const currentOptions = this.getSelectedProductOptions();
            if (this._urlParams && this._urlParams.saveToken && this._urlParams.basketKey) {
                //Download basket item
                const basketItem = await PrintessShopifySlimUi.getBasketItemForSaveToken(this._urlParams.saveToken);
                if (!basketItem || (typeof basketItem.ok !== "undefined" && !basketItem.ok)) {
                    console.error("Can not find basket item for save token " + this._urlParams.saveToken);
                }
                if ((await PrintessShopifySlimUi._callbacks.replaceBasketItemAsync(this, this._product, basketItem, result.saveToken, result.thumbnailUrl, currentOptions, true)) === true) {
                    await this.onReplaceBasketItem(basketItem, result.saveToken, result.thumbnailUrl);
                }
            }
            else {
                if ((await PrintessShopifySlimUi._callbacks.addToBasketAsync(this, this._product, result.saveToken, result.thumbnailUrl, currentOptions, true)) === true) {
                    this.onAddToBasket();
                }
            }
        }
        finally {
            this.showFormsProgressIndicator(true);
            this.showImageProgressIndicator(true);
            PrintessShopifySlimUi.showElement(designNowButton, false);
            PrintessShopifySlimUi.removeUrlParams();
        }
    }
    addAddToBasketButton() {
        const that = this;
        const addToBasketButton = this.getUiNode("addToBasketButton");
        if (!addToBasketButton) {
            return;
        }
        if (addToBasketButton) {
            let designNowButton = addToBasketButton.parentElement?.querySelector("printess-design-now-button");
            if (!designNowButton) {
                designNowButton = document.createElement("div");
                designNowButton.setAttribute("class", addToBasketButton.classList.toString());
                designNowButton.classList.add("printess-design-now-button");
                designNowButton.classList.remove("printess-hidden");
                designNowButton.addEventListener('click', async function () {
                    await that.onBasketItemClick(designNowButton);
                });
                addToBasketButton.after(designNowButton);
            }
            let textNode = designNowButton.querySelector("span");
            if (!textNode) {
                textNode = document.createElement("span");
                designNowButton.appendChild(textNode);
            }
            if (that._urlParams && that._urlParams.saveToken && that._urlParams.basketKey) {
                textNode.innerText = this._settings.captions?.saveBasketItem || "Save changes";
            }
            else {
                textNode.innerText = this._settings.captions?.addToBasket || "Add to basket";
            }
        }
    }
    static removeUrlParamsInString(url, params) {
        let ret = url || "";
        let modified = false;
        if (params) {
            for (const proper in params) {
                if (params.hasOwnProperty(proper)) {
                    const searchValue = (ret.indexOf("?" + proper) >= 0 ? "?" : "&") + proper + "=" + encodeURIComponent(params[proper]);
                    ret = ret.replace(searchValue, "");
                }
            }
        }
        return {
            url: ret,
            modified: ret != url
        };
    }
    static removeUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const replaceResult = PrintessShopifySlimUi.removeUrlParamsInString(window.location.href, {
            "printesssavetoken": urlParams.get("printesssavetoken") || "",
            "basketkey": urlParams.get("basketkey") || "",
            "qty": urlParams.get("qty") || "",
            "pao": urlParams.get("pao") || ""
        });
        if (replaceResult.modified) {
            window.history.replaceState({}, '', replaceResult.url);
        }
    }
    static getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const ret = {
            saveToken: urlParams.get("printesssavetoken") || "",
            autoOpenEditor: false,
            quantity: 1,
            basketKey: urlParams.get("basketkey")
        };
        const quantityString = urlParams.get("qty");
        const autoOpenString = (urlParams.get("pao") || "").toLowerCase().trim();
        const qty = quantityString ? parseInt(quantityString) : 1;
        if (!isNaN(qty) && isFinite(qty) && qty < 0) {
            ret.quantity = qty;
        }
        if (autoOpenString) {
            ret.autoOpenEditor = autoOpenString === "true" || autoOpenString === "1";
        }
        return ret;
    }
    static addOrSetBasketInput(productForm, textBoxName, textBoxValue) {
        let textbox = productForm.querySelector('input[name="' + textBoxName + '"]');
        if (!textbox) {
            textbox = document.createElement("input");
            textbox.setAttribute("type", "hidden");
            textbox.setAttribute("name", textBoxName);
            textbox.setAttribute("value", textBoxValue);
            productForm.appendChild(textbox);
        }
    }
    updateVariantInput(variant = null) {
        if (!variant) {
            const currentProductOptions = this.getSelectedProductOptions();
            variant = this.getVariantByProductOptions(currentProductOptions, true);
        }
        //set current variant id
        const idInput = this._productForm.querySelector('input[name="id"],select[name="id"]');
        if (idInput) {
            idInput.value = variant.id.toString();
        }
    }
    async onAddToBasket() {
        this.getUiNode("addToBasketButton")?.classList.add("printess-hidden");
        try {
            const response = await this._state.createSaveToken();
            PrintessShopifySlimUi.addOrSetBasketInput(this._productForm, "properties[_printessSaveToken]", response.saveToken);
            PrintessShopifySlimUi.addOrSetBasketInput(this._productForm, "properties[_printessThumbnail]", response.thumbnailUrl);
            this.updateVariantInput();
        }
        catch (e) {
            console.error(e);
        }
        finally {
            //this._productForm?.querySelector(this._settings.addToBasketButtonSelector)?.classList.remove("printess-hidden");
        }
        const addToBasketButton = this.getUiNode("addToBasketButton");
        if (addToBasketButton) {
            addToBasketButton.click();
        }
    }
    static async getBasketItemForSaveToken(saveToken) {
        const result = await fetch('/cart.js', {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!result || !result.ok) {
            return result;
        }
        const json = await result.json();
        const { items } = json;
        return items.find(item => item.properties && item.properties._printessSaveToken ? item.properties && item.properties._printessSaveToken === saveToken : false);
    }
    readQuantity() {
        const quantityInput = this.getUiNode("quantity");
        if (quantityInput.value) {
            const iValue = parseInt(quantityInput.value);
            if (!isNaN(iValue) && isFinite(iValue) && iValue) {
                return iValue;
            }
        }
        return 1;
    }
    async addNewItemToBasket(saveToken, valuesToWrite, retries = 0) {
        const result = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [valuesToWrite]
            })
        });
        if (!result.ok) {
            console.error("Unable to add item to basket: [" + result.status.toString() + "] " + result.statusText);
            if (retries > 4) {
                console.error("Unable to add item to basket giving up (" + saveToken + ")");
            }
            else {
                await PrintessShopifySlimUi.sleepAsync(250);
                await this.addNewItemToBasket(saveToken, valuesToWrite, retries + 1);
            }
        }
    }
    async deleteBasketItemBySaveToken(saveToken, retries = 0) {
        const basketItem = await PrintessShopifySlimUi.getBasketItemForSaveToken(saveToken);
        if (!basketItem) {
            console.error("Unable to delete item from basket: [" + basketItem.status.toString() + "] " + basketItem.statusText);
            if (retries > 4) {
                console.error("Unable to remove item from basket giving up (" + saveToken + ")");
            }
            else {
                await PrintessShopifySlimUi.sleepAsync(250);
                await this.deleteBasketItemBySaveToken(saveToken, retries + 1);
            }
        }
        else {
            await PrintessShopifySlimUi.deleteBasketItemByKey(basketItem.key);
        }
    }
    static async deleteBasketItemByKey(key, retries = 0) {
        const result = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: key,
                quantity: 0
            }),
        });
        if (!result || !result.ok) {
            console.error("!Unable to delete item from basket: [" + result.status.toString() + "] " + result.statusText);
            if (retries > 4) {
                console.error("!Unable to remove item from basket giving up (Basket Item Key: " + key + ")");
            }
            else {
                await PrintessShopifySlimUi.sleepAsync(250);
                await this.deleteBasketItemByKey(key, retries + 1);
            }
        }
    }
    async onReplaceBasketItem(originalBasketItem, saveToken, thumbnailUrl) {
        const namesToIgnore = ["fix", "newsletter"];
        const productOptions = this.getSelectedProductOptions();
        const selectedVariant = await this.getVariantByProductOptions(productOptions, true);
        if (!originalBasketItem || (typeof originalBasketItem.ok !== "undefined" && !originalBasketItem.ok)) {
            console.error("Could not find basket item for save token " + saveToken);
        }
        let basketItemProperties = { ...originalBasketItem.properties ? originalBasketItem.properties : {} };
        basketItemProperties = {
            ...basketItemProperties,
            _printessSaveToken: saveToken,
            _printessThumbnail: thumbnailUrl
        };
        const valuesToWrite = {
            id: selectedVariant.id,
            quantity: this.readQuantity(),
            properties: basketItemProperties
        };
        await this.addNewItemToBasket(saveToken, valuesToWrite);
        if (originalBasketItem) {
            if (originalBasketItem && originalBasketItem.properties && originalBasketItem.properties._printessSaveToken) {
                await this.deleteBasketItemBySaveToken(originalBasketItem.properties._printessSaveToken);
            }
            else {
            }
        }
        window.location.replace('/cart');
    }
    static isSaveToken(templateName) {
        return (templateName || "").indexOf("st:") === 0;
    }
    mapOptionValue(optionName, optionIndex, value) {
        let ret = null;
        if (!this._product || !this._product.productOptions) {
            return value;
        }
        for (let currentOption = 0; currentOption < this._product.productOptions.length; ++currentOption) {
            const option = this._product.productOptions[currentOption];
            if ((optionName === option.name || optionIndex === option.position) && option.optionValues) {
                for (let currentValue = 0; currentValue < option.optionValues.length; ++currentValue) {
                    const _value = option.optionValues[currentValue];
                    if (_value.name === value || _value.id === parseInt(value)) {
                        ret = _value.name;
                        break;
                    }
                }
                break;
            }
            if (ret != null) {
                break;
            }
        }
        return ret || value;
    }
    evaluateInputName(name, dataOptionPosition, dataOptionName, dataOptionValueId) {
        let _name = ((dataOptionName || name) || "").trim();
        let optionPosition = 0;
        if (_name && _name.length > 2 && _name[_name.length - 2] == "\r" && _name[_name.length - 2] == "\n") {
            _name = _name.substring(0, _name.length - 2);
        }
        if (_name && _name.length > 1 && _name[_name.length - 1] == "\n") {
            _name = _name.substring(0, _name.length - 1);
        }
        let hyphenIndex = -1;
        if (_name.length > 2 && (hyphenIndex = _name.indexOf("-")) > 0) {
            const optionIndex = parseInt(_name.substring(hyphenIndex + 1, _name.length));
            if (optionIndex >= 0 && !isNaN(optionIndex) && isFinite(optionIndex)) {
                _name = _name.substring(0, hyphenIndex);
            }
        }
        if (_name.indexOf("properties[") === 0 && _name.lastIndexOf("]") === _name.length - 1) {
            _name = _name.substring("properties[".length, _name.length - 1);
        }
        else if (_name.indexOf("options[") === 0 && _name.lastIndexOf("]") === _name.length - 1) {
            _name = _name.substring("options[".length, _name.length - 1);
        }
        if (!dataOptionPosition && _name) {
            if (this._product.productOptions && _name.indexOf("option") === 0) {
                const index = parseInt(_name.substring("option".length, _name.length));
                if (!isNaN(index) && isFinite(index) && index > 0 && index <= this._product.productOptions.length) { //Data option position is 1 based in shopify
                    optionPosition = index;
                }
            }
        }
        if (this._product.productOptions && !dataOptionPosition && optionPosition < 1 && dataOptionValueId) {
            if (typeof dataOptionValueId !== "number") {
                dataOptionValueId = parseInt(dataOptionValueId);
            }
            for (let i = 0; i < this._product.productOptions.length; ++i) {
                if (this._product.productOptions[i].optionValues) {
                    for (let j = 0; j < this._product.productOptions[i].optionValues.length; ++j) {
                        if (this._product.productOptions[i].optionValues[j].id === dataOptionValueId) {
                            optionPosition = i + 1;
                            break;
                        }
                    }
                }
                if (optionPosition > 0) {
                    break;
                }
            }
        }
        if (dataOptionPosition) {
            const index = parseInt(dataOptionPosition);
            if (!isNaN(index) && isFinite(index) && index > 0 && index <= this._product.productOptions.length) { //Data option position is 1 based in shopify
                optionPosition = index;
            }
        }
        if (this._product.productOptions && optionPosition > 0 && optionPosition <= this._product.productOptions.length) {
            _name = this._product.productOptions[optionPosition - 1].name;
        }
        return _name;
    }
    evaluateInputValue(optionName, optionIndex, value, dataOptionValueId) {
        if (!this._product || !this._product.productOptions) {
            return value;
        }
        if (optionName && !optionIndex) {
            for (let i = 0; i < this._product.productOptions.length; ++i) {
                if (this._product.productOptions[i].name === optionName) {
                    optionIndex = (i + 1).toString();
                    break;
                }
            }
        }
        if (!optionIndex && dataOptionValueId) {
            if (typeof dataOptionValueId !== "number") {
                dataOptionValueId = parseInt(dataOptionValueId);
            }
            for (let i = 0; i < this._product.productOptions.length; ++i) {
                if (this._product.productOptions[i].optionValues) {
                    for (let j = 0; j < this._product.productOptions[i].optionValues.length; ++j) {
                        if (this._product.productOptions[i].optionValues[j].id === dataOptionValueId) {
                            optionIndex = (i + 1).toString();
                            break;
                        }
                    }
                }
                if (optionIndex) {
                    break;
                }
            }
        }
        if (optionIndex) {
            const index = parseInt(optionIndex);
            if (!isNaN(index) && isFinite(index) && index > 0 && index <= this._product.productOptions.length) {
                return this.mapOptionValue(optionName, index, value);
            }
        }
        return value;
    }
    getInputs() {
        const ret = [];
        const inputSelector = 'select,input[type="radio"]:checked,input[type="checkbox"]:checked,input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="hidden"],input[type="month"],input[type="number"],input[type="password"],input[type="tel"],input[type="text"],input[type="time"],input[type="url"],input[type="week"]';
        this._parent.querySelectorAll(inputSelector).forEach((x) => {
            ret.push(x);
        });
        return ret;
    }
    getSelectedProductOptions() {
        let ret = {};
        this.getInputs().forEach((input) => {
            let dataOptionPosition = input.getAttribute("data-option-position") || input.getAttribute("data-option-index");
            let dataOptionName = input.getAttribute("data-option-name") || input.getAttribute("data-name") || input.getAttribute("name") || input.getAttribute("aria-label") || input.getAttribute("data-index");
            let name = this.evaluateInputName(input.getAttribute("name"), !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, input.getAttribute("data-option-value-id"));
            let value = this.evaluateInputValue(name, !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", input.value, input.getAttribute("data-option-value-id"));
            const namesToIgnore = ["form_type", "utf8", "id", "product-id", "section-id"];
            if (name && name[0] !== "_" && namesToIgnore.indexOf(name) === -1 && name.indexOf("printess") !== 0) {
                //Make sure this is an existing product option name
                if (this._product.productOptions.filter((x) => x, name === name).length > 0) {
                    ret[name] = value;
                }
            }
        });
        return ret;
    }
    getVariantByProductOptions(options, returnDefraultVariant = true) {
        if (!this._product || !this._product.variants || this._product.variants.length === 0) {
            return null;
        }
        const optionFilter = {};
        this._product.usedOptions?.forEach(x => optionFilter[x.name] = true);
        let variants = this._product.variants;
        for (const name in options) {
            if (options.hasOwnProperty(name) && optionFilter[name]) {
                variants = variants.filter((variant) => {
                    const options2 = variant.options.filter(x => x.optionName === name && x.optionValue === options[name]);
                    return options2.length > 0;
                });
            }
        }
        if (variants.length > 0) {
            return variants[0];
        }
        if (returnDefraultVariant) {
            return this._product.variants[0];
        }
        else {
            return null;
        }
    }
    getProductOptionValuesByVariantId(variantId) {
        if (!this._product || !this._product.variants) {
            return {};
        }
        const ret = {};
        const variant = this._product.variants.filter(x => x.id === variantId);
        if (variant.length > 0) {
            variant[0].options.forEach((option) => {
                ret[option.optionName] = option.optionValue;
            });
        }
        return ret;
    }
    static formatPrice(cents, format, priceIsInCent) {
        if (typeof cents == 'string') {
            cents = parseInt(cents.replace('.', ''));
        }
        var value = '';
        var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
        var formatString = format;
        function defaultOption(opt, def) {
            return (typeof opt == 'undefined' || opt === null ? def : opt);
        }
        function formatWithDelimiters(number, precision, thousands = null, decimal = null) {
            precision = defaultOption(precision, 2);
            thousands = defaultOption(thousands, ',');
            decimal = defaultOption(decimal, '.');
            if (isNaN(number) || number == null) {
                return "0";
            }
            const numberStr = (priceIsInCent ? (number / 100.0) : number).toFixed(precision);
            var parts = numberStr.split('.'), dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands), cents = parts[1] ? (decimal + parts[1]) : '';
            return dollars + cents;
        }
        switch (formatString.match(placeholderRegex)[1]) {
            case 'amount':
                value = formatWithDelimiters(cents, 2);
                break;
            case 'amount_no_decimals':
                value = formatWithDelimiters(cents, 0);
                break;
            case 'amount_with_comma_separator':
                value = formatWithDelimiters(cents, 2, '.', ',');
                break;
            case 'amount_no_decimals_with_comma_separator':
                value = formatWithDelimiters(cents, 0, '.', ',');
                break;
        }
        return formatString.replace(placeholderRegex, value);
    }
    setProductOptionValue(formFieldName, formFieldValue, formFieldLabel, valueLabel) {
        let inputs = document.querySelectorAll(`input[type="radio"]`);
        if (inputs && inputs.length > 0) {
            inputs.forEach((el) => {
                const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
                const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
                const initialName = this.evaluateInputName(el.getAttribute("name"), !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
                const initialValue = this.evaluateInputValue(initialName, !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", el.value, el.getAttribute("data-option-value-id"));
                let valueChanged = false;
                if (initialName === formFieldName || initialName === formFieldLabel) {
                    if (initialValue === formFieldValue || initialValue === valueLabel) {
                        if (!valueChanged && !el.checked) {
                            valueChanged = true;
                        }
                        el.setAttribute('checked', true.toString());
                        el.checked = true;
                    }
                    else {
                        if (!valueChanged && el.checked === true) {
                            valueChanged = true;
                        }
                        el.removeAttribute('checked');
                        el.checked = false;
                    }
                }
                if (valueChanged) {
                    el.dispatchEvent(new Event('change'));
                }
            });
        }
        //In case select / drop down is used
        inputs = document.querySelectorAll(`select`);
        inputs.forEach((el) => {
            const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
            const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
            const initialName = this.evaluateInputName(el.getAttribute("name"), !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
            let valueChanged = false;
            if (el.options) {
                for (let i = 0; i < el.options.length; ++i) {
                    const initialValue = this.evaluateInputValue(initialName, !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", el.options[i].getAttribute('value'), el.getAttribute("data-option-value-id"));
                    if (initialName === formFieldName || initialName === formFieldLabel) {
                        if (initialValue === formFieldValue || initialValue === valueLabel) {
                            if (!valueChanged && !el.options[i].selected) {
                                valueChanged = true;
                            }
                            el.options[i].setAttribute('selected', true.toString());
                            el.options[i].selected = true;
                            el.setAttribute('value', formFieldValue);
                            el.value = initialValue === formFieldValue ? formFieldValue : valueLabel;
                        }
                        else {
                            if (!valueChanged && el.options[i].selected === true) {
                                valueChanged = true;
                            }
                            el.options[i].removeAttribute('selected');
                            el.options[i].selected = false;
                        }
                    }
                }
            }
            if (valueChanged) {
                el.dispatchEvent(new Event('change'));
            }
        });
        //Text boxes
        inputs = document.querySelectorAll(`input[type="text"],input[type="hidden"],input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="month"],input[type="number"],input[type="tel"],input[type="time"],input[type="url"],input[type="week"]`);
        if (inputs && inputs.length > 0) {
            inputs.forEach((el) => {
                const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
                const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
                const initialName = this.evaluateInputName(el.getAttribute("name"), !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
                const initialValue = this.evaluateInputValue(initialName, !this._settings.ignoreDataOptionIndex ? dataOptionPosition : "", el.value, el.getAttribute("data-option-value-id"));
                let valueChanged = false;
                if (initialName === formFieldName) {
                    if (!valueChanged && el.getAttribute("value") !== initialValue) {
                        valueChanged = true;
                    }
                    el.setAttribute("value", initialValue);
                }
                else if (initialName === formFieldLabel) {
                    if (!valueChanged && el.getAttribute("value") !== valueLabel) {
                        valueChanged = true;
                    }
                    el.setAttribute("value", valueLabel);
                }
                if (valueChanged) {
                    el.dispatchEvent(new Event('change'));
                }
            });
        }
        //Update variant id in url
        const currentProductOptions = this.getSelectedProductOptions();
        const variant = this.getVariantByProductOptions(currentProductOptions, true);
        if (this._product.variants.length > 1) {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const urlVariantId = urlParams.get('variant');
            try {
                if (urlVariantId) {
                    if (urlVariantId != variant.id.toString()) {
                        window.history.replaceState({}, '', window.location.href.replace("variant=" + urlVariantId, "variant=" + variant.id.toString()));
                    }
                }
                else {
                    window.history.replaceState({}, '', `${window.location.href}${variant.id ? `?variant=${variant.id}` : ''}`);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
        this.updateVariantInput(variant);
        //update price
        const priceTextDisplay = this.getUiNode("price");
        if (priceTextDisplay) {
            PrintessShopifySlimUi._callbacks.getPriceInCentAsync(this, this._product, variant, 0.0).then(((price) => {
                priceTextDisplay.innerHTML = PrintessShopifySlimUi.formatPrice(price, this._settings.priceFormat, false);
            }));
        }
    }
    getProductFormFieldValues() {
        let ret = [];
        const optionValues = this.getSelectedProductOptions();
        for (const optionName in optionValues) {
            if (optionValues.hasOwnProperty(optionName)) {
                ret.push({
                    name: optionName,
                    value: optionValues[optionName]
                });
            }
        }
        return ret;
    }
    static getOrCreateProgressIndicator(parentElement, themeProgressIndicator, hideNow = true) {
        let ret = null;
        if (themeProgressIndicator) {
            ret = themeProgressIndicator;
        }
        else if (parentElement) {
            ret = parentElement.querySelector(".printess-progress-indicator");
            if (!ret) {
                ret = document.createElement("div");
                ret.classList.add("printess-progress-indicator");
                const wrapperDiv = document.createElement("div");
                wrapperDiv.classList.add("printess-progress-wrapper");
                const circleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                circleSvg.classList.add("printess-circle");
                circleSvg.setAttribute("viewBox", "25 25 50 50");
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.classList.add("printess-path");
                circle.setAttribute("cx", "50");
                circle.setAttribute("cy", "50");
                circle.setAttribute("r", "20");
                circle.setAttribute("fill", "none");
                circle.setAttribute("stroke-width", "5");
                circle.setAttribute("stroke-miterlimit", "10");
                circleSvg.appendChild(circle);
                wrapperDiv.appendChild(circleSvg);
                ret.appendChild(wrapperDiv);
                parentElement.appendChild(ret);
            }
        }
        if (ret && hideNow) {
            ret.classList.add("printess-hidden");
        }
        return ret;
    }
    static showElement(element, show = true) {
        if (element) {
            if (show) {
                if (element.classList.contains("printess-hidden")) {
                    element.classList.remove("printess-hidden");
                }
                if ((element.style.display || "").toLowerCase() === "none") {
                    element.style.display = "block";
                }
            }
            else {
                if (!element.classList.contains("printess-hidden")) {
                    element.classList.add("printess-hidden");
                }
            }
        }
    }
    showImageProgressIndicator(show = true) {
        let progressIndicator = this.getUiNode("progressIndicator");
        if (!progressIndicator) {
            progressIndicator = PrintessShopifySlimUi.getOrCreateProgressIndicator(this.getUiNode("image")?.parentElement, null, false);
            if (progressIndicator) {
                progressIndicator.classList.add("printess-image-progress-wrapper");
            }
        }
        else {
            if (show) {
                progressIndicator.classList.remove("hidden");
            }
            else {
                progressIndicator.classList.add("hidden");
            }
        }
        PrintessShopifySlimUi.showElement(progressIndicator, show);
        if (show) {
            PrintessShopifySlimUi._callbacks.showProgressIndicator(null, progressIndicator);
        }
        else {
            PrintessShopifySlimUi._callbacks.hideProgressIndicator(null, progressIndicator);
        }
        return progressIndicator;
    }
    showFormsProgressIndicator(show) {
        const productInfo = this.getUiNode("productInfo");
        if (!productInfo) {
            return null;
        }
        let progressIndicator = productInfo.querySelector(".printess-progress-indicator");
        if (!progressIndicator) {
            progressIndicator = PrintessShopifySlimUi.getOrCreateProgressIndicator(productInfo, null, true);
            const variantSelector = this.getUiNode("variantSelector");
            if (!variantSelector) {
                if (this._settings.formInsertPosition === -1 || this._settings.formInsertPosition >= productInfo.children.length) {
                    productInfo.appendChild(progressIndicator);
                }
                else {
                    productInfo.children[this._settings.formInsertPosition].before(progressIndicator);
                }
            }
            else {
                variantSelector.before(progressIndicator);
            }
        }
        PrintessShopifySlimUi.showElement(progressIndicator, show);
        if (show) {
            PrintessShopifySlimUi._callbacks.showProgressIndicator(null, progressIndicator);
        }
        else {
            PrintessShopifySlimUi._callbacks.hideProgressIndicator(null, progressIndicator);
        }
        return progressIndicator;
    }
    static applyShopThemeSupport(selectors, themeName) {
        const ret = selectors ? { ...selectors } : {};
        switch (themeName) {
            case "impulse": {
                ret.cssProductContainerSelector = ret.cssProductContainerSelector || ".grid--product-images--partial";
                ret.cssProductInfoSelector = ret.cssProductInfoSelector || ".product-single__meta";
                ret.cssProductMediaSelector = ret.cssProductMediaSelector || "[data-product-images]";
                ret.cssImageSelector = ret.cssImageSelector || ".image-element";
                ret.cssProductFormSelector = ret.cssProductFormSelector || 'form[action="/cart/add"]';
                ret.cssAddToBasketButtonSelector = ret.cssAddToBasketButtonSelector || ".btn.add-to-cart";
                ret.cssVariantSwitchSelector = ret.cssVariantSwitchSelector || "[data-dynamic-variants-enabled]";
                ret.cssPriceTextSelector = ret.cssPriceTextSelector || ".product__price";
                ret.cssQuantityInputSelector = ret.cssQuantityInputSelector || '[name="quantity"]';
                break;
            }
        }
        ret.cssProductContainerSelector = ret.cssProductContainerSelector || 'product-info .product';
        ret.cssProductInfoSelector = ret.cssProductInfoSelector || '.product__info-wrapper > .product__info-container';
        ret.cssProductFormSelector = ret.cssProductFormSelector || 'form[data-type="add-to-cart-form"],form[action="/cart/add"][id^="product-form-template"],form.shopify-product-form[id^=product-form-template],form.product-single__form';
        ret.cssProductIdSelector = ret.cssProductIdSelector || 'input[name="product-id"],input[name="product-id"]';
        ret.cssVariantSwitchSelector = ret.cssVariantSwitchSelector || 'variant-selects,variant-picker,.selector-wrapper,variant-radios,.product-form__controls-group,variant-picker__form,variant-selects';
        ret.cssProductMediaSelector = ret.cssProductMediaSelector || "media-gallery,.product-single__media-wrapper,.product__media";
        ret.cssImageSelector = ret.cssImageSelector || "slider-component ul li .product__media img,slider-component ul li .product__media img";
        ret.cssProgressIndicatorSelector = ret.cssProgressIndicatorSelector || "slider-component ul li .loading-overlay__spinner,slider-component ul li .loading__spinner";
        ret.cssAddToBasketButtonSelector = ret.cssAddToBasketButtonSelector || 'button[type="submit"][name="add"]';
        ret.cssPriceTextSelector = ret.cssPriceTextSelector || ".price__regular>span.price-item.price-item--regular";
        ret.cssQuantityInputSelector = ret.cssQuantityInputSelector || '[name="quantity"]';
        return ret;
    }
    /** Initialization */
    static async initializeSections(settings) {
        settings.uiSelectors = PrintessShopifySlimUi.applyShopThemeSupport(settings.uiSelectors, settings.shopThemeName);
        settings.formInsertPosition = settings.formInsertPosition === -1 ? -1 : (settings.formInsertPosition || 4);
        settings.buttonClasses = settings.buttonClasses || "button--full-width button--secondary";
        settings.priceFormat = settings.priceFormat || "{{amount_with_comma_separator}}$";
        if (!PrintessShopifySlimUi._callbacks) {
            PrintessShopifySlimUi._callbacks = PrintessShopifySlimUi.createCallbackExecutor();
        }
        if (settings.callbacks) {
            PrintessShopifySlimUi.registerCallbacks(settings.callbacks);
        }
        const ret = [];
        const productLookup = {};
        /** Query all sections on the page and load product information */
        //Go throug all sections and query the product form for product ids
        document.querySelectorAll(settings.uiSelectors.cssProductContainerSelector).forEach((section) => {
            const integration = new PrintessShopifySlimUi();
            integration._settings = settings;
            integration._parent = section;
            integration._productContainer = section;
            integration._productForm = integration.getUiNode("productForm");
            integration.showImageProgressIndicator(true);
            integration.showFormsProgressIndicator(true);
            PrintessShopifySlimUi.showElement(integration.getUiNode("addToBasketButton"), false);
            if (!integration._productForm) {
                return;
            }
            let idElement = integration.getUiNode("productId");
            if (!idElement || typeof idElement.value === "undefined") {
                return;
            }
            integration._productId = parseInt(idElement.value);
            if (isNaN(integration._productId) || !isFinite(integration._productId)) {
                return;
            }
            if (section) {
                section.setAttribute("data-printess-forms-status", "loading");
            }
            let productInfoSection = integration.getUiNode("productInfo");
            let variantSelector = integration.getUiNode("variantSelector");
            if (variantSelector) {
                variantSelector.classList.add("printess-hidden");
            }
            if (!variantSelector && productInfoSection) {
                if (settings.formInsertPosition === -1 || settings.formInsertPosition >= productInfoSection.children.length) {
                    if (productInfoSection.children.length === 0) {
                        const dummy = document.createElement("div");
                        productInfoSection.appendChild(dummy);
                        variantSelector = dummy;
                    }
                    else {
                        variantSelector = productInfoSection.children[productInfoSection.children.length - 1];
                    }
                }
                else {
                    variantSelector = productInfoSection.children[settings.formInsertPosition];
                }
            }
            integration._variantSelector = variantSelector;
            const mediaSelector = integration.getUiNode("media");
            if (mediaSelector) {
                integration._mediaContainer = mediaSelector;
            }
            if (!productLookup[integration._productId]) {
                productLookup[integration._productId] = null;
            }
            ret.push(integration);
        });
        //Go through all product ids and load the product information
        const graphql = new PrintessShopifyGraphQlApi(settings.frontendAppToken);
        for (const productId in { ...productLookup }) {
            if (productLookup.hasOwnProperty(productId)) {
                const product = await graphql.getProductById(parseInt(productId), true);
                //Add product to lookup or remove it in case its not a printess product
                if (product) {
                    if (!product.templateName || !product.templateName.value) {
                        delete productLookup[product.id];
                        [...ret].forEach((x, index) => {
                            if (x._productId === product.id) {
                                ret[index]._parent.removeAttribute("data-printess-forms-status");
                                ret[index].showImageProgressIndicator(false);
                                ret[index].showFormsProgressIndicator(false);
                                PrintessShopifySlimUi.showElement(ret[index].getUiNode("addToBasketButton"), true);
                                if (ret[index]._mediaContainer) {
                                    ret[index]._mediaContainer.classList.remove("printess-hidden");
                                }
                                if (ret[index]._variantSelector) {
                                    ret[index]._variantSelector.classList.remove("printess-hidden");
                                }
                                ret.splice(index, 1);
                            }
                        });
                    }
                    else {
                        productLookup[product.id] = product;
                    }
                    product.variants = await graphql.getProductVariants(product.id);
                    if (product.variants) {
                        const productOptions = {};
                        product.variants.forEach((variant) => {
                            if (!variant.available) {
                                return;
                            }
                            variant.options?.forEach((option) => {
                                if (!productOptions[option.optionName]) {
                                    productOptions[option.optionName] = [option.optionValue];
                                }
                                else {
                                    if (!productOptions[option.optionName].includes(option.optionValue)) {
                                        productOptions[option.optionName].push(option.optionValue);
                                    }
                                }
                            });
                        });
                        product.usedOptions = [];
                        for (const optionName in productOptions) {
                            if (productOptions.hasOwnProperty(optionName)) {
                                product.usedOptions.push({
                                    name: optionName,
                                    values: productOptions[optionName]
                                });
                            }
                        }
                    }
                }
            }
        }
        //Waiting up to 30 seconds until slim-ui js is loaded
        try {
            await PrintessShopifySlimUi.printessQueryItemAsync(() => {
                return typeof window["createSlimUi"] === "function" || typeof window["PrintessSlimUi"] !== "undefined" && window["PrintessSlimUi"] !== null;
            }, 30000, 100);
        }
        catch (e) {
            console.error("Download of product configurator did not finish within timeframe of 30 seconds");
            alert("Unable to download product configurator within 30 seconds");
        }
        //Assign products to section instances
        ret.forEach((printessForm, index) => {
            if (printessForm && productLookup[printessForm._productId]) {
                printessForm._product = productLookup[printessForm._productId];
                if (printessForm._parent) {
                    printessForm._parent.setAttribute("data-printess-forms-status", "initializing");
                }
            }
            printessForm.initialize(index);
        });
        return ret;
    }
    static registerCallback(name, callback) {
        if (name && typeof callback === "function") {
            if (!PrintessShopifySlimUi._registeredCallbacks[name]) {
                PrintessShopifySlimUi._registeredCallbacks[name] = [callback];
            }
            else {
                PrintessShopifySlimUi._registeredCallbacks[name].push(callback);
            }
        }
    }
    static registerCallbacks(callbacks) {
        if (callbacks) {
            if (Array.isArray(callbacks)) {
                callbacks.forEach((callback) => {
                    PrintessShopifySlimUi.registerCallbacks(callback);
                });
            }
            else {
                for (const callbackName in callbacks) {
                    if (callbacks.hasOwnProperty(callbackName)) {
                        PrintessShopifySlimUi.registerCallback(callbackName, callbacks[callbackName]);
                    }
                }
            }
        }
    }
    async getFullVariant(variant) {
        if (this._fullVariantCache[variant.id]) {
            return this._fullVariantCache[variant.id];
        }
        else {
            const graphql = new PrintessShopifyGraphQlApi(this._settings.frontendAppToken);
            //const variant = await graphql.GetProductVariantById(variantId);
            const variantOptions = {};
            variant.options?.forEach(x => variantOptions[x.optionName] = x.optionValue);
            const fullVariant = await graphql.GetProductVariantByOptions(this._product.id, variantOptions);
            if (fullVariant) {
                this._fullVariantCache[variant.id] = fullVariant.variantBySelectedOptions;
                return fullVariant.variantBySelectedOptions;
            }
        }
        return null;
    }
    //private
    getUiNode(nodeName) {
        return PrintessShopifySlimUi._callbacks.getUiNode(this, nodeName, this._productContainer, null, this._settings.uiSelectors);
    }
    static createCallbackExecutor() {
        const ret = {
            showProgressIndicator: (instance, progressIndicator) => {
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["showProgressIndicator"]) {
                    PrintessShopifySlimUi._registeredCallbacks["showProgressIndicator"].forEach((callback) => {
                        try {
                            callback(instance, progressIndicator);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    });
                }
            },
            hideProgressIndicator: (instance, progressIndicator) => {
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["hideProgressIndicator"]) {
                    PrintessShopifySlimUi._registeredCallbacks["hideProgressIndicator"].forEach((callback) => {
                        try {
                            callback(instance, progressIndicator);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    });
                }
            },
            getFormFieldValues: (instance, currentFormfields) => {
                let ffValues = currentFormfields;
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getFormFieldValues"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getFormFieldValuesAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getFormFieldValuesAsync"][i];
                            const x = callback(instance, ffValues);
                            if (x && Array.isArray(x)) {
                                ffValues = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                if (!ffValues || !Array.isArray(ffValues)) {
                    return currentFormfields;
                }
                else {
                    return ffValues;
                }
            },
            getFormFieldValuesAsync: async (instance, currentFormfields) => {
                let ffValues = ret.getFormFieldValues(instance, currentFormfields);
                if (!ffValues || !Array.isArray(ffValues)) {
                    ffValues = currentFormfields;
                }
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getFormFieldValuesAsync"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getFormFieldValuesAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getFormFieldValuesAsync"][i];
                            const x = await callback(instance, ffValues);
                            if (x && Array.isArray(x)) {
                                ffValues = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                if (!ffValues || !Array.isArray(ffValues)) {
                    return currentFormfields;
                }
                else {
                    return ffValues;
                }
            },
            getTemplateName: (instance, product, currentTemplateName) => {
                let templateName = currentTemplateName;
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getTemplateName"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getTemplateName"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getTemplateName"][i];
                            const x = callback(instance, product, templateName);
                            if (x) {
                                templateName = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return templateName;
            },
            getTemplateNameAsync: async (instance, product, currentTemplateName) => {
                let templateName = ret.getTemplateName(instance, product, currentTemplateName);
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getTemplateNameAsync"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getTemplateNameAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getTemplateNameAsync"][i];
                            const x = await callback(instance, product, templateName);
                            if (x) {
                                templateName = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return templateName;
            },
            getMergeTemplates: (instance, product, currentTemplates) => {
                let templates = currentTemplates;
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getMergeTemplates"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getMergeTemplates"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getMergeTemplates"][i];
                            const x = callback(instance, product, templates);
                            if (x && Array.isArray(x)) {
                                templates = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return templates;
            },
            getMergeTemplatesAsync: async (instance, product, currentTemplates) => {
                let templates = ret.getMergeTemplates(instance, product, currentTemplates);
                if (!templates || !Array.isArray(templates)) {
                    templates = currentTemplates;
                }
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getMergeTemplatesAsync"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getMergeTemplatesAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getMergeTemplatesAsync"][i];
                            const x = await callback(instance, product, templates);
                            if (x && Array.isArray(x)) {
                                templates = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                if (!templates || !Array.isArray(templates)) {
                    return currentTemplates;
                }
                else {
                    return templates;
                }
            },
            getTheme: (instance, product, currentTheme) => {
                let theme = currentTheme;
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getTheme"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getTheme"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getTheme"][i];
                            const x = callback(instance, product, theme);
                            if (x) {
                                theme = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return theme;
            },
            getThemeAsync: async (instance, product, currentTheme) => {
                let theme = ret.getTheme(instance, product, currentTheme);
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getThemeAsync"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getThemeAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getThemeAsync"][i];
                            const x = await callback(instance, product, theme);
                            if (x) {
                                theme = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return theme;
            },
            getPriceInCentAsync: async (instance, product, variant, currentPriceInCent) => {
                const fullVariant = await instance.getFullVariant(variant);
                if (!fullVariant) {
                    return 0;
                }
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getPriceInCentAsync"]) {
                    let currentPrice = fullVariant.price.amount;
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getPriceInCentAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getPriceInCentAsync"][i];
                            const x = await callback(instance, product, variant, currentPrice);
                            if (typeof x !== "undefined" && x !== null) {
                                currentPrice = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    return currentPrice;
                }
                return fullVariant.price.amount;
            },
            addToBasket: (instance, product, saveToken, thumbnailUrl, currentOptions, add) => {
                let addItem = add;
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["addToBasket"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["addToBasket"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["addToBasket"][i];
                            const x = callback(instance, product, saveToken, thumbnailUrl, currentOptions, addItem);
                            if (typeof x !== "undefined") {
                                addItem = x === true;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return addItem;
            },
            addToBasketAsync: async (instance, product, saveToken, thumbnailUrl, currentOptions, add) => {
                let addItem = ret.addToBasket(instance, product, saveToken, thumbnailUrl, currentOptions, add);
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["addToBasketAsync"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["addToBasketAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["addToBasketAsync"][i];
                            const x = await callback(instance, product, saveToken, thumbnailUrl, currentOptions, addItem);
                            if (typeof x !== "undefined") {
                                addItem = x === true;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return addItem;
            },
            replaceBasketItem: (instance, product, originalCartItem, saveToken, thumbnailUrl, currentOptions, replace) => {
                let addItem = replace;
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["replaceBasketItem"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["replaceBasketItem"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["replaceBasketItem"][i];
                            const x = callback(instance, product, originalCartItem, saveToken, thumbnailUrl, currentOptions, addItem);
                            if (typeof x !== "undefined") {
                                addItem = x === true;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return addItem;
            },
            replaceBasketItemAsync: async (instance, product, originalCartItem, saveToken, thumbnailUrl, currentOptions, replace) => {
                let addItem = ret.replaceBasketItem(instance, product, originalCartItem, saveToken, thumbnailUrl, currentOptions, replace);
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["replaceBasketItemAsync"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["replaceBasketItemAsync"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["replaceBasketItemAsync"][i];
                            const x = await callback(instance, product, originalCartItem, saveToken, thumbnailUrl, currentOptions, addItem);
                            if (typeof x !== "undefined") {
                                addItem = x === true;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return addItem;
            },
            getUiNode: (instance, nodeName, productContainer, nodeUsedByPrintess, settings = null) => {
                switch (nodeName) {
                    case "productInfo": {
                        nodeUsedByPrintess = productContainer?.querySelector(settings.cssProductInfoSelector);
                        break;
                    }
                    case "media": {
                        nodeUsedByPrintess = productContainer?.querySelector(settings.cssProductMediaSelector);
                        break;
                    }
                    case "image": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "media", productContainer, null, settings)?.querySelector(settings.cssImageSelector);
                        break;
                    }
                    case "price": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "productInfo", productContainer, null, settings)?.querySelector(settings.cssPriceTextSelector);
                        break;
                    }
                    case "productForm": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "productInfo", productContainer, null, settings)?.querySelector(settings.cssProductFormSelector);
                        break;
                    }
                    case "productId": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "productForm", productContainer, null, settings)?.querySelector(settings.cssProductIdSelector);
                        break;
                    }
                    case "progressIndicator": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "media", productContainer, null, settings)?.querySelector(settings.cssProgressIndicatorSelector);
                        break;
                    }
                    case "addToBasketButton": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "productForm", productContainer, null, settings)?.querySelector(settings.cssAddToBasketButtonSelector);
                        break;
                    }
                    case "variantSelector": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "productInfo", productContainer, null, settings)?.querySelector(settings.cssVariantSwitchSelector);
                        break;
                    }
                    case "quantity": {
                        nodeUsedByPrintess = ret.getUiNode(instance, "productInfo", productContainer, null, settings)?.querySelector(settings.cssQuantityInputSelector);
                        break;
                    }
                    default:
                    //return null;
                }
                if (PrintessShopifySlimUi._registeredCallbacks && PrintessShopifySlimUi._registeredCallbacks["getUiNode"]) {
                    for (let i = 0; i < PrintessShopifySlimUi._registeredCallbacks["getUiNode"].length; ++i) {
                        try {
                            const callback = PrintessShopifySlimUi._registeredCallbacks["getUiNode"][i];
                            const x = callback(instance, nodeName, nodeUsedByPrintess);
                            if (x) {
                                nodeUsedByPrintess = x;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                if (!nodeUsedByPrintess) {
                    console.error("Html node for " + nodeName + " not found");
                }
                return nodeUsedByPrintess;
            }
        };
        return ret;
    }
}
PrintessShopifySlimUi._callbacks = null; class PrintessShopifySlimUiCart {
    static async openProductPage(saveToken, productUrl, basketItemKey, quantity, cartItemSelector, quantitySelector) {
        quantity = typeof quantity !== "number" || isNaN(quantity) || !isFinite(quantity) || quantity < 0 ? 1 : quantity;
        quantitySelector = quantitySelector || ".quantity__input";
        cartItemSelector = cartItemSelector || ".cart-item";
        if (!productUrl) {
            console.error("No product url provided");
            return;
        }
        const editButton = document.getElementById("printessButton" + basketItemKey.replace("-", "_").replace(":", "_"));
        if (!editButton) {
            console.error("Unable to locate edit button for cart item with key " + basketItemKey);
            return;
        }
        const cartItem = editButton.closest(cartItemSelector);
        if (!cartItem) {
            console.error("Unable to locate cart item node for selector " + cartItemSelector);
            return;
        }
        const quantityInput = cartItem.querySelector(quantitySelector);
        if (!quantityInput) {
            console.error("Unable to find quantity input");
        }
        else {
            const parsedQuantity = quantityInput.value ? parseInt(quantityInput.value) : quantity;
            if (!isNaN(parsedQuantity) && isFinite(parsedQuantity) && parsedQuantity > 0) {
                quantity = parsedQuantity;
            }
        }
        const urlParams = `printesssavetoken=${encodeURIComponent(saveToken)}&basketkey=${encodeURIComponent(basketItemKey)}&qty=${quantity}`;
        const url = productUrl + (productUrl.indexOf("?") > 0 ? "&" : "?") + urlParams;
        window.location.replace(url);
    }
}