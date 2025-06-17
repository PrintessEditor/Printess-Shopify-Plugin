class PrintessShopifySlimUi {
    /** Interface Implementation */
    async setFormfieldValue(formField, value, label, valueLabel) {
    }
    onClassChange(node, callback) {
        let lastClassString = node.classList.toString();
        const mutationObserver = new MutationObserver((mutationList) => {
            for (const item of mutationList) {
                if (item.attributeName === "class") {
                    const classString = node.classList.toString();
                    if (classString !== lastClassString) {
                        callback(mutationObserver, classString);
                        lastClassString = classString;
                        break;
                    }
                }
            }
        });
        mutationObserver.observe(node, { attributes: true });
    }
    async initialize() {
        try {
            const variantContainer = document.createElement("div");
            variantContainer.classList.add("printess-item-container", "printess-ui");
            const mediaImage = this._mediaContainer.querySelector(this._settings.imageSelector);
            if (this._variantSelector && this._variantSelector.parentElement) {
                this._variantSelector.parentElement.insertBefore(variantContainer, this._variantSelector.nextSibling);
                //this._variantSelector.parentElement.appendChild(variantContainer);
            }
            const loader = this._mediaContainer.querySelector(this._settings.loaderSelector);
            const that = this;
            this.onClassChange(loader, (observer, classList) => {
                if (classList.indexOf("printess-loader-visible") >= 0) {
                    loader.classList.remove("hidden");
                    PrintessShopifySlimUi._callbacks.showProgressIndicator(that, loader);
                }
                else {
                    loader.classList.add("hidden");
                    PrintessShopifySlimUi._callbacks.hideProgressIndicator(that, loader);
                }
            });
            const templateName = await PrintessShopifySlimUi._callbacks.getTemplateNameAsync(this, this._product, this._product.templateName.value);
            const theme = await PrintessShopifySlimUi._callbacks.getThemeAsync(this, this._product, this._product.theme?.value || "DEFAULT");
            let formFields = null;
            let mergeTemplates = null;
            if (!PrintessShopifySlimUi.isSaveToken(templateName)) {
                formFields = this.getProductFormFieldValues();
                formFields = await PrintessShopifySlimUi._callbacks.getFormFieldValuesAsync(this, formFields);
                mergeTemplates = await PrintessShopifySlimUi._callbacks.getMergeTemplatesAsync(this, this._product, []);
            }
            PrintessShopifySlimUi.hideFormsStartupProgress(this._section, this._settings.productInfoSelector);
            this._state = await window["createSlimUi"]({
                previewContainer: document.createElement("div"),
                uiContainer: variantContainer,
                previewImage: mediaImage ? mediaImage : null,
                loader: loader,
                shopToken: this._settings.shopToken,
                templateName: templateName,
                published: true,
                formFields: formFields,
                mergeTemplates: mergeTemplates,
                theme: theme
            });
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
        let variants = this._product.variants;
        for (const name in options) {
            if (options.hasOwnProperty(name)) {
                variants = variants.filter((variant) => {
                    const options = variant.options.filter(x => x.optionName === name && x.optionValue === options[name]);
                    return options.length > 1;
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
        if (this._settings.useVariantIdField === true) {
            const variantIdCtrl = document.querySelector('input[name="variant_id"],select[name="variant_id"]');
            if (variantIdCtrl && variantIdCtrl.value) {
                const values = this.getProductOptionValuesByVariantId(parseInt(variantIdCtrl.value));
                if (typeof values[formFieldName] !== "undefined" || typeof values[formFieldLabel] === "undefined") {
                    values[formFieldName] = formFieldValue;
                }
                else {
                    values[formFieldLabel] = valueLabel;
                }
                const variant = this.getVariantByProductOptions(values, true);
                variantIdCtrl.value = variant.id.toString();
            }
        }
    }
    getProductFormFieldValues() {
        const ret = [];
        const optionValues = this.getSelectedProductOptions();
        const variant = this.getVariantByProductOptions(optionValues, false);
        if (!variant) {
            console.error("Could not find variant for these option values: " + JSON.stringify(optionValues));
        }
        else {
        }
        return ret;
    }
    static showInitialProgressIndicator(section, mediaSelector, loaderSelector, show) {
        const mediaBox = section.querySelector(mediaSelector);
        const loader = mediaBox?.querySelector(loaderSelector);
        if (loader) {
            if (show) {
                if (loader.classList.toString().indexOf("") < 0) {
                    loader.classList.add("printess-loader-visible");
                }
                PrintessShopifySlimUi._callbacks.showProgressIndicator(null, loader);
            }
            else {
                if (loader.classList.toString().indexOf("") >= 0) {
                    loader.classList.remove("printess-loader-visible");
                }
                PrintessShopifySlimUi._callbacks.hideProgressIndicator(null, loader);
            }
        }
    }
    static showFormsStartupProgress(section, productInfoSelector, variantSelector, formInsertPosition) {
        let productInfoSection = section.querySelector(productInfoSelector);
        let variantSelectorElement = section.querySelector(variantSelector);
        if (variantSelectorElement) {
            variantSelectorElement.classList.add("printess-hidden");
        }
        let progressIndicator = productInfoSection.querySelector(".printess-progress-indicator");
        if (!progressIndicator) {
            progressIndicator = document.createElement("div");
            progressIndicator.classList.add("printess-progress-indicator");
            if (!variantSelectorElement) {
                if (productInfoSection) {
                    if (formInsertPosition === -1 || formInsertPosition >= productInfoSection.children.length) {
                        productInfoSection.appendChild(progressIndicator);
                    }
                    else {
                        productInfoSection.children[formInsertPosition].before(progressIndicator);
                    }
                }
            }
            else {
                variantSelectorElement.before(progressIndicator);
            }
        }
        progressIndicator.style.display = "block";
    }
    static hideFormsStartupProgress(section, productInfoSelector) {
        let productInfoSection = section.querySelector(productInfoSelector);
        let progressIndicator = productInfoSection?.querySelector(".printess-progress-indicator");
        if (progressIndicator) {
            progressIndicator.style.display = "none";
        }
    }
    /** Initialization */
    static async initializeSections(settings) {
        settings.productFormSelector = settings.productFormSelector || 'form[data-type="add-to-cart-form"],form.product-single__form,form.shopify-product-form[id^=product-form-template],form[action="/cart/add"]';
        settings.productIdSelector = settings.productIdSelector || 'input[name="product-id"],input[name="product-id"]';
        settings.variantSelectorSelector = settings.variantSelectorSelector || 'variant-selects,variant-picker,.selector-wrapper,variant-radios,.product-form__controls-group,variant-picker__form';
        settings.productInfoSelector = settings.productInfoSelector || '.product__info-wrapper  product-info';
        settings.formInsertPosition = settings.formInsertPosition === -1 ? -1 : (settings.formInsertPosition || 2);
        settings.mediaSelector = settings.mediaSelector || "media-gallery,.product-single__media-wrapper";
        settings.sectionSelector = settings.sectionSelector || 'section[id^="MainProduct-template"]';
        settings.imageSelector = settings.imageSelector || "slider-component ul li .product__media img";
        settings.loaderSelector = settings.loaderSelector || "slider-component ul li .loading-overlay__spinner";
        if (!PrintessShopifySlimUi._callbacks) {
            PrintessShopifySlimUi._callbacks = PrintessShopifySlimUi.createCallbackExecutor();
        }
        const ret = [];
        const productLookup = {};
        /** Query all sections on the page and load product information */
        //Go throug all sections and query the product form for product ids
        document.querySelectorAll(settings.sectionSelector).forEach((section) => {
            PrintessShopifySlimUi.showFormsStartupProgress(section, settings.productInfoSelector, settings.variantSelectorSelector, settings.formInsertPosition);
            const productForm = section.querySelector(settings.productFormSelector);
            if (!productForm) {
                return;
            }
            let idElement = productForm.querySelector(settings.productIdSelector);
            if (!idElement || typeof idElement.value === "undefined") {
                return;
            }
            const productId = parseInt(idElement.value);
            if (isNaN(productId) || !isFinite(productId)) {
                return;
            }
            PrintessShopifySlimUi.showInitialProgressIndicator(section, settings.mediaSelector, settings.loaderSelector, true);
            const integration = new PrintessShopifySlimUi();
            integration._settings = settings;
            integration._parent = section;
            integration._productForm = productForm;
            integration._productId = productId;
            if (section) {
                section.setAttribute("data-printess-forms-status", "loading");
            }
            let productInfoSection = section.querySelector(settings.productInfoSelector);
            let variantSelector = section.querySelector(settings.variantSelectorSelector);
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
            integration._section = section;
            const mediaSelector = section.querySelector(settings.mediaSelector);
            if (mediaSelector) {
                integration._mediaContainer = mediaSelector;
                //mediaSelector.classList.add("printess-hidden");
            }
            if (!productLookup[productId]) {
                productLookup[productId] = null;
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
                                PrintessShopifySlimUi.showInitialProgressIndicator(ret[index]._section, settings.mediaSelector, settings.loaderSelector, false);
                                PrintessShopifySlimUi.hideFormsStartupProgress(ret[index]._section, settings.productInfoSelector);
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
        //Assign products to section instances
        ret.forEach((printessForm) => {
            if (printessForm && productLookup[printessForm._productId]) {
                printessForm._product = productLookup[printessForm._productId];
                if (printessForm._parent) {
                    printessForm._parent.setAttribute("data-printess-forms-status", "initializing");
                }
            }
            printessForm.initialize();
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
            }
        };
        return ret;
    }
}
PrintessShopifySlimUi._callbacks = null;