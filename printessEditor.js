/*Printess Shopify Integration Version: 2.6*/class PrintessEditor {
    constructor(settings) {
        this.calculateCurrentPrices = async (priceInfo, context) => {
            const r = await this.getPriceCategories(context);
            let basePrice = r.basePrice;
            if (priceInfo.snippetPriceCategories) {
                priceInfo.snippetPriceCategories.forEach((x) => {
                    if (x && x.amount > 0 && context.snippetPrices[x.priceCategory - 1]) {
                        basePrice += context.snippetPrices[x.priceCategory - 1].priceInCent; // * x.amount;
                    }
                });
            }
            r.price = context.formatMoney(basePrice);
            return r;
        };
        if (!settings || !settings.shopToken) {
            throw "No shop token provided";
        }
        this.Settings = {
            ...settings
        };
        const hasUiSettings = typeof this.Settings.uiSettings !== "undefined" && this.Settings.uiSettings !== null;
        const startupSettings = {};
        if (hasUiSettings) {
            startupSettings["showAnimation"] = this.Settings.uiSettings.showStartupAnimation === true || this.Settings.uiSettings.showStartupAnimation == "true";
            if (this.Settings.uiSettings.startupLogoUrl) {
                startupSettings["imageUrl"] = this.Settings.uiSettings.startupLogoUrl;
            }
            if (this.Settings.uiSettings.startupBackgroundColor) {
                startupSettings["background"] = this.Settings.uiSettings.startupBackgroundColor;
            }
        }
        this.ClassicEditorUrl = this.getClassicEditorUrl(this.Settings.editorUrl, this.Settings.editorVersion, startupSettings) + "#" + encodeURIComponent(JSON.stringify(startupSettings));
    }
    stripEditorVersion(editorVersion) {
        editorVersion = (editorVersion ? editorVersion : "").trim();
        if (typeof editorVersion !== "undefined" && editorVersion != null) {
            if (!editorVersion) {
                editorVersion = "";
            }
            else {
                while (editorVersion.indexOf("/") == 0) {
                    editorVersion = editorVersion.substring(1);
                }
                while (editorVersion.length > 0 && editorVersion[editorVersion.length - 1] === "/") {
                    editorVersion = editorVersion.substring(0, editorVersion.length - 1);
                }
            }
        }
        return editorVersion;
    }
    sanitizeHost(host) {
        if (host) {
            host = host.trim();
            if (host.endsWith("/")) {
                return host;
            }
            return host + "/";
        }
        return host || "";
    }
    getClassicEditorUrl(editorDomain, editorVersion, startupSettings) {
        editorDomain = editorDomain || "https://editor.printess.com/";
        const hashIndex = editorDomain.indexOf("#");
        if (hashIndex > 0) {
            let json = editorDomain.substring(hashIndex + 1);
            if (json) {
                try {
                    const decodedJson = JSON.parse(decodeURIComponent(json));
                    if (decodedJson) {
                        for (let propertyName in decodedJson) {
                            if (decodedJson.hasOwnProperty(propertyName)) {
                                startupSettings[propertyName] = decodedJson[propertyName];
                            }
                        }
                    }
                }
                catch (e) {
                }
            }
            editorDomain = editorDomain.substring(0, hashIndex);
        }
        if (!editorDomain.toLowerCase().endsWith(".html")) {
            editorDomain = this.sanitizeHost(editorDomain);
            if (editorVersion) {
                editorVersion = this.stripEditorVersion(editorVersion);
                editorDomain += editorVersion + (editorVersion ? "/" : "");
            }
            editorDomain += 'printess-editor/embed.html';
        }
        if (editorDomain.toLowerCase().indexOf("https://") !== 0 && editorDomain.toLowerCase().indexOf("http://") !== 0) {
            editorDomain = "https://" + editorDomain;
        }
        return editorDomain;
    }
    getLoaderUrl(editorDomain, editorVersion, urlSettings) {
        editorDomain = editorDomain || "https://editor.printess.com/";
        const hashIndex = editorDomain.indexOf("#");
        if (hashIndex > 0) {
            let json = editorDomain.substring(hashIndex + 1);
            if (json) {
                try {
                    const decodedJson = JSON.parse(decodeURIComponent(json));
                    if (decodedJson) {
                        for (let propertyName in decodedJson) {
                            if (decodedJson.hasOwnProperty(propertyName)) {
                                urlSettings[propertyName] = decodedJson[propertyName];
                            }
                        }
                    }
                }
                catch (e) {
                }
            }
            editorDomain = editorDomain.substring(0, hashIndex);
        }
        if (editorDomain.toLocaleLowerCase().endsWith("embed.html")) {
            editorDomain = editorDomain.substring(0, editorDomain.length - "embed.html".length);
        }
        if (!editorDomain.toLowerCase().endsWith(".html")) {
            editorDomain = this.sanitizeHost(editorDomain);
            if (editorVersion) {
                editorVersion = this.stripEditorVersion(editorVersion);
                editorDomain += editorVersion + (editorVersion ? "/" : "");
            }
            if (!editorDomain.toLowerCase().endsWith("printess-editor/")) {
                editorDomain += "printess-editor/";
            }
            editorDomain += 'loader.js';
        }
        if (editorDomain.toLowerCase().indexOf("https://") !== 0 && editorDomain.toLowerCase().indexOf("http://") !== 0) {
            editorDomain = "https://" + editorDomain;
        }
        return editorDomain;
    }
    getPrintessComponent() {
        return document.querySelector("printess-component") || null;
    }
    applyFormFieldMappings(formFields, mappings) {
        const ret = [];
        if (!mappings) {
            for (const ffName in formFields) {
                if (formFields.hasOwnProperty(ffName)) {
                    ret.push({
                        name: ffName,
                        value: formFields[ffName]
                    });
                }
            }
        }
        if (formFields) {
            for (const property in formFields) {
                if (formFields.hasOwnProperty(property)) {
                    const ff = formFields[property];
                    const ffName = typeof mappings[property] !== "undefined" && typeof mappings[property].formField !== "undefined" ? mappings[property].formField : property;
                    let ffValue = ff;
                    if (typeof mappings[property] !== "undefined" && typeof mappings[property].values !== "undefined" && typeof mappings[property].values[ffValue] !== "undefined") {
                        ffValue = mappings[property].values[ff];
                    }
                    ret.push({
                        name: ffName,
                        value: ffValue
                    });
                }
            }
        }
        return ret;
    }
    reverseFormFieldMapping(formFieldName, formFieldValue, mappings) {
        let name = formFieldName || "";
        let value = formFieldValue || "";
        if (mappings) {
            for (let optionName in mappings) {
                if (mappings.hasOwnProperty(optionName)) {
                    if (mappings[optionName].formField === formFieldName) {
                        name = optionName;
                        if (mappings[optionName].values) {
                            for (let optionValue in mappings[optionName].values) {
                                if (mappings[optionName].values.hasOwnProperty(optionValue)) {
                                    if (mappings[optionName].values[optionValue] === formFieldValue) {
                                        value = optionValue;
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        return {
            name: name,
            value: value
        };
    }
    setViewportMeta() {
        const headElements = document.getElementsByTagName("head");
        if (headElements && headElements.length > 0) {
            let metaTag = headElements[0].querySelector('meta[name=viewport]');
            if (!metaTag) {
                metaTag = document.createElement("meta");
                metaTag.setAttribute("name", "viewport");
                headElements[0].appendChild(metaTag);
            }
            let content = metaTag.getAttribute("content");
            if (content) {
                if (content.indexOf("interactive-widget") < 0) {
                    content += content ? ", " : "";
                    content += "interactive-widget=resizes-content";
                    metaTag.setAttribute("content", content);
                }
            }
            else {
                metaTag.setAttribute("content", "interactive-widget=resizes-content");
            }
        }
    }
    async initializeIFrame(callbacks, context, settings) {
        const that = this;
        let iFrame = document.getElementById("printess");
        const closeTabListener = (evt) => {
            if (callbacks && typeof callbacks.onCloseTab === "function") {
                callbacks.onCloseTab(evt);
            }
        };
        const eventListener = (evt) => {
            switch (evt.data.cmd) {
                case 'back':
                    window.removeEventListener('message', eventListener);
                    window.removeEventListener('beforeunload', closeTabListener);
                    window.removeEventListener('unload', closeTabListener);
                    iFrame.setAttribute("printessHasListener", "false");
                    if (callbacks && typeof callbacks.onBack === "function") {
                        callbacks.onBack();
                    }
                    break;
                case 'basket':
                    window.removeEventListener('message', eventListener);
                    window.removeEventListener('beforeunload', closeTabListener);
                    window.removeEventListener('unload', closeTabListener);
                    iFrame.setAttribute("printessHasListener", "false");
                    if (callbacks && typeof callbacks.onAddToBasketAsync === "function") {
                        callbacks.onAddToBasketAsync(evt.data.token, evt.data.thumbnailUrl).then(() => { });
                    }
                    break;
                case 'formFieldChanged':
                    if (callbacks && typeof callbacks.onFormFieldChangedAsync === "function") {
                        callbacks.onFormFieldChangedAsync(evt.data.n || evt.data.name, evt.data.v || evt.data.value, evt.data.ffCaption || "", evt.data.l || evt.data.label).then(() => { });
                    }
                    break;
                case 'priceChanged': {
                    if (callbacks && typeof callbacks.onPriceChangedAsync === "function") {
                        callbacks.onPriceChangedAsync(evt.data.priceInfo).then(() => { });
                    }
                    break;
                }
                case 'renderFirstPageImage': {
                    if (callbacks && typeof callbacks.onRenderedFirstPageImageAsync === "function") {
                        callbacks.onRenderedFirstPageImageAsync(evt.data.result);
                    }
                    break;
                }
                case 'save': {
                    if (callbacks && typeof callbacks.onSaveAsync === "function") {
                        callbacks.onSaveAsync(evt.data.token);
                    }
                }
                case 'load': {
                    if (callbacks && typeof callbacks.onLoadAsync === "function") {
                        callbacks.onLoadAsync(context.templateNameOrSaveToken);
                    }
                }
                default:
                    break;
            }
        };
        return new Promise((resolve) => {
            if (!iFrame) {
                const container = document.createElement('div');
                container.setAttribute('id', 'printess-container');
                container.setAttribute('style', 'display: none; position: absolute; top: 0; bottom: 0; right: 0; left: 0; width: 100%; height: 100%; z-index: 100000;');
                iFrame = document.createElement('iframe');
                iFrame.setAttribute('src', this.ClassicEditorUrl);
                iFrame.setAttribute('id', 'printess');
                iFrame.setAttribute('style', 'width:100%; heigth:100%;');
                iFrame.setAttribute('data-attached', 'false');
                iFrame.setAttribute('allow', 'xr-spatial-tracking; clipboard-read; clipboard-write;');
                iFrame.setAttribute('allowfullscreen', 'true');
                iFrame.classList.add("printess-owned");
                container.appendChild(iFrame);
                iFrame.onload = () => {
                    resolve(iFrame);
                };
                window.addEventListener('message', eventListener);
                if (settings.showAlertOnTabClose === true) {
                    window.addEventListener('beforeunload', closeTabListener);
                    window.addEventListener('unload', closeTabListener);
                }
                iFrame.setAttribute("printessHasListener", "true");
                if (window.visualViewport) {
                    window.visualViewport.addEventListener("scroll", () => {
                        // unfortunately an iframe on iOS is not able to receive the correct visual-viewport, so we forward it. 
                        iFrame.contentWindow?.postMessage({ cmd: "viewportScroll", height: window.visualViewport?.height, offsetTop: window.visualViewport?.offsetTop }, "*");
                    }, { passive: true });
                }
                that.setViewportMeta();
                document.body.append(container);
            }
            else {
                if (iFrame.getAttribute("printessHasListener") !== "true") {
                    window.addEventListener('message', eventListener);
                    if (settings.showAlertOnTabClose === true) {
                        window.addEventListener('beforeunload', closeTabListener);
                        window.addEventListener('unload', closeTabListener);
                    }
                    iFrame.setAttribute("printessHasListener", "true");
                }
                resolve(iFrame);
            }
        });
    }
    async getPriceCategories(context, formFieldValues = null) {
        let price = 0;
        if (!formFieldValues) {
            formFieldValues = context.getCurrentFormFieldValues();
        }
        if (typeof context.getPriceForFormFieldsAsync === "function") {
            price = await context.getPriceForFormFieldsAsync(formFieldValues);
        }
        else if (typeof context.getPriceForFormFields === "function") {
            price = context.getPriceForFormFields(formFieldValues);
        }
        const r = {
            snippetPrices: context.snippetPrices.map((x) => x ? x.label : null),
            priceCategories: {},
            price: context.formatMoney(price),
            basePrice: price,
            productName: context.getProductName(),
            legalNotice: context.legalText,
            infoUrl: context.legalTextUrl
        };
        return r;
    }
    ;
    usePanelUi() {
        const loweruiVersion = this.Settings.uiSettings && this.Settings.uiSettings.uiVersion ? this.Settings.uiSettings.uiVersion.toLowerCase().trim() : "";
        return loweruiVersion === "bcui" || loweruiVersion === "panelui";
    }
    async onPriceChanged(priceChangedInfo, context) {
        try {
            let priceInfo = null;
            try {
                if (priceChangedInfo.snippetPriceCategories && priceChangedInfo.snippetPriceCategories.length > 0) {
                    context.stickers = priceChangedInfo.snippetPriceCategories.filter((x) => context.snippetPrices && context.snippetPrices.length >= x.priceCategory).map((x) => {
                        return {
                            productVariantId: context.snippetPrices[x.priceCategory - 1].variantId,
                            quantity: x.amount
                        };
                    });
                }
                else {
                    context.stickers = [];
                }
                priceInfo = await this.calculateCurrentPrices(priceChangedInfo, context);
            }
            catch (e) {
                console.error(e);
            }
            const iframe = document.getElementById("printess");
            if (iframe && !context.hidePricesInEditor) {
                setTimeout(() => {
                    iframe.contentWindow.postMessage({
                        cmd: "refreshPriceDisplay",
                        priceDisplay: priceInfo
                    }, "*");
                }, 0);
            }
            //BcUI
            const component = this.getPrintessComponent();
            if (component && component.editor) {
                component.editor.ui.refreshPriceDisplay(priceInfo);
            }
        }
        catch (e) {
        }
    }
    ;
    hideBcUiVersion(context, closeButtonClicked) {
        const editor = this.getPrintessComponent();
        if (editor && editor.editor) {
            editor.editor.ui.hide();
        }
        if (typeof context.editorClosed === "function") {
            context.editorClosed(closeButtonClicked === true);
        }
        //Hide the web page scrolling
        document.body.classList.remove('hideAll');
    }
    async showBcUiVersion(context, callbacks) {
        const that = this;
        const priceInfo = context.getPriceInfo();
        let isSaveToken = context && context.templateNameOrSaveToken && context.templateNameOrSaveToken.indexOf("st:") === 0;
        let formFields = null;
        let mergeTemplates = null;
        if (!isSaveToken) {
            formFields = that.applyFormFieldMappings(context.getCurrentFormFieldValues(), context.getFormFieldMappings());
            mergeTemplates = context.getMergeTemplates();
        }
        const startupParams = {};
        const loaderUrl = that.getLoaderUrl(this.Settings.editorUrl, this.Settings.editorVersion, startupParams);
        const printessLoader = await import(/* webpackIgnore: true */ loaderUrl);
        let printessComponent = that.getPrintessComponent();
        if (printessComponent && printessComponent.editor) {
            printessComponent.style.display = "block";
            context.renderFirstPageImageAsync = async (maxThumbnailWidth, maxThumbnailHeight) => {
                const url = await printessComponent.editor.api.renderFirstPageImage("thumbnail.png", undefined, maxThumbnailWidth, maxThumbnailHeight);
                if (context && typeof context.onRenderFirstPageImageAsync === "function") {
                    await context.onRenderFirstPageImageAsync(url);
                }
                else if (context && typeof context.onRenderFirstPageImage === "function") {
                    context.onRenderFirstPageImage(url);
                }
            };
            await printessComponent.editor.api.loadTemplateAndFormFields(context.templateNameOrSaveToken, mergeTemplates, formFields, null);
            printessComponent.editor.ui.show();
        }
        else {
            const attachParams = {
                domain: that.Settings.apiDomain,
                mergeTemplates: mergeTemplates,
                formFields: formFields,
                token: that.Settings.shopToken,
                templateName: context.templateNameOrSaveToken,
                //templateVersion: "publish",//"draft"
                translationKey: "",
                basketId: typeof context.getBasketId === "function" ? context.getBasketId() || 'Some-Unique-Basket-Or-Session-Id' : 'Some-Unique-Basket-Or-Session-Id',
                shopUserId: typeof context.getUserId === "function" ? context.getUserId() || 'Some-Unique-Basket-Or-Session-Id' : 'Some-Unique-Shop-User-Id',
                // mobileMargin: {left: 20, right: 40, top: 30, bottom: 40},
                // allowZoomAndPan: false,
                snippetPriceCategoryLabels: priceInfo && priceInfo.snippetPrices ? priceInfo.snippetPrices : null,
                theme: that.Settings.uiSettings ? (that.Settings.uiSettings.theme || "") : "",
                addToBasketCallback: (token, thumbnailUrl) => {
                    if (callbacks && typeof callbacks.onAddToBasketAsync === "function") {
                        callbacks.onAddToBasketAsync(token, thumbnailUrl).then(() => { });
                    }
                },
                formFieldChangedCallback: (name, value, tag, label, ffLabel) => {
                    if (callbacks && typeof callbacks.onFormFieldChangedAsync === "function") {
                        callbacks.onFormFieldChangedAsync(name, value, ffLabel, label).then(() => { });
                    }
                },
                priceChangeCallback: (priceInfo) => {
                    if (callbacks && typeof callbacks.onPriceChangedAsync === "function") {
                        callbacks.onPriceChangedAsync(priceInfo).then(() => { });
                    }
                },
                backButtonCallback: (saveToken) => {
                    that.hideBcUiVersion(context, true);
                },
                saveTemplateCallback: (saveToken, type) => {
                    if (typeof callbacks.onSaveAsync === "function") {
                        callbacks.onSaveAsync(saveToken);
                    }
                    if (type && type === "close") {
                        that.hideBcUiVersion(context, true);
                    }
                },
                loadTemplateCallback: (param) => {
                    callbacks.onLoadAsync(attachParams.templateName);
                }
            };
            const printess = await printessLoader.load(attachParams);
            printessComponent = that.getPrintessComponent();
            if (printessComponent) {
                printessComponent.editor = printess;
            }
        }
    }
    async show(context) {
        const that = this;
        let isSaveToken = context && context.templateNameOrSaveToken && context.templateNameOrSaveToken.indexOf("st:") === 0;
        const callbacks = {
            onBack: () => {
                that.hide(context, true);
            },
            onAddToBasketAsync: async (saveToken, thumbnailUrl) => {
                let result = null;
                if (typeof context.onAddToBasketAsync === "function") {
                    result = await context.onAddToBasketAsync(saveToken, thumbnailUrl);
                }
                else {
                    result = context.onAddToBasket(saveToken, thumbnailUrl);
                }
                if (result && result.waitUntilClosingMS) {
                    setTimeout(function () {
                        if (typeof result.executeBeforeClosing === "function") {
                            result.executeBeforeClosing();
                        }
                        that.hide(context, false);
                    }, result.waitUntilClosingMS);
                }
                else {
                    if (result && typeof result.executeBeforeClosing === "function") {
                        result.executeBeforeClosing();
                    }
                    that.hide(context, false);
                }
            },
            onFormFieldChangedAsync: async (formFieldName, formFieldValue, formFieldLabel, formFieldValueLabel) => {
                const formField = that.reverseFormFieldMapping(formFieldName, formFieldValue, context.getFormFieldMappings());
                if (typeof context.onFormFieldChangedAsync === "function") {
                    await context.onFormFieldChanged(formField.name, formField.value, formFieldLabel, formFieldValueLabel);
                }
                else if (typeof context.onFormFieldChanged === "function") {
                    context.onFormFieldChanged(formField.name, formField.value, formFieldLabel, formFieldValueLabel);
                }
            },
            onPriceChangedAsync: async (priceInfo) => {
                await that.onPriceChanged(priceInfo, context);
            },
            onRenderedFirstPageImageAsync: async (result) => {
                if (typeof context.onRenderFirstPageImageAsync === "function") {
                    await context.onRenderFirstPageImageAsync(result);
                }
                else if (typeof context.onRenderFirstPageImage === "function") {
                    context.onRenderFirstPageImage(result);
                }
            },
            onSaveAsync: async (saveToken) => {
                if (typeof context.onSaveAsync === "function") {
                    await context.onSaveAsync(saveToken, "");
                }
                else if (typeof context.onSave === "function") {
                    context.onSave(saveToken, "");
                }
            },
            onLoadAsync: async (currentTemplateNameOrSaveToken) => {
                if (typeof context.onLoadAsync === "function") {
                    await context.onLoadAsync(currentTemplateNameOrSaveToken);
                }
                else if (typeof context.onLoad === "function") {
                    context.onLoad(currentTemplateNameOrSaveToken);
                }
            },
            onCloseTab: (evt) => {
                evt.preventDefault();
                evt.returnValue = '';
            }
        };
        if (this.usePanelUi()) {
            that.showBcUiVersion(context, callbacks);
        }
        else {
            const priceInfo = context.getPriceInfo();
            let formFields = null;
            let mergeTemplates = null;
            if (!isSaveToken) {
                formFields = this.applyFormFieldMappings(context.getCurrentFormFieldValues(), context.getFormFieldMappings());
                mergeTemplates = context.getMergeTemplates();
            }
            const iFrame = await this.initializeIFrame(callbacks, context, this.Settings);
            context.renderFirstPageImageAsync = (maxThumbnailWidth, maxThumbnailHeight) => {
                setTimeout(function () {
                    iFrame.contentWindow.postMessage({
                        cmd: "renderFirstPageImage",
                        properties: {}
                    }, "*");
                }, 0);
                return Promise.resolve();
            };
            if (iFrame.getAttribute('data-attached') === "false") {
                try {
                    const attachParams = {
                        domain: that.Settings.apiDomain,
                        token: this.Settings.shopToken || "",
                        templateName: context.templateNameOrSaveToken,
                        showBuyerSide: true,
                        templateUserId: '',
                        basketId: typeof context.getBasketId === "function" ? context.getBasketId() || 'Some-Unique-Basket-Or-Session-Id' : 'Some-Unique-Basket-Or-Session-Id',
                        shopUserId: typeof context.getUserId === "function" ? context.getUserId() || 'Some-Unique-Basket-Or-Session-Id' : 'Some-Unique-Shop-User-Id',
                        formFields: formFields,
                        snippetPriceCategoryLabels: priceInfo && priceInfo.snippetPrices ? priceInfo.snippetPrices : null,
                        mergeTemplates: mergeTemplates
                    };
                    if (typeof context.showSplitterGridSizeButton !== "undefined" && context.showSplitterGridSizeButton !== null) {
                        attachParams["showSplitterGridSizeButton"] = context.showSplitterGridSizeButton === true || context.showSplitterGridSizeButton === "true";
                    }
                    if (this.Settings.uiSettings && this.Settings.uiSettings.theme) {
                        attachParams["theme"] = this.Settings.uiSettings.theme;
                    }
                    if (this.Settings.attachParams) {
                        for (const paramName in this.Settings.attachParams) {
                            if (this.Settings.attachParams.hasOwnProperty(paramName)) {
                                attachParams[paramName] = this.Settings.attachParams[paramName];
                            }
                        }
                    }
                    if (typeof context.additionalAttachParams !== "undefined" || context.additionalAttachParams !== null) {
                        for (const prop in context.additionalAttachParams) {
                            if (context.additionalAttachParams.hasOwnProperty(prop)) {
                                attachParams[prop] = context.additionalAttachParams[prop];
                            }
                        }
                    }
                    iFrame.contentWindow.postMessage({
                        cmd: 'attach',
                        properties: attachParams
                    }, '*');
                    iFrame.setAttribute('data-attached', "true");
                    setTimeout(function () { iFrame.contentWindow.focus(); }, 0);
                }
                catch (e) {
                    console.error(e);
                }
            }
            else {
                let undef;
                const loadParams = {
                    templateNameOrToken: context.templateNameOrSaveToken,
                    mergeTemplates: mergeTemplates,
                    formFields: formFields,
                    snippetPriceCategoryLabels: priceInfo && priceInfo.snippetPrices ? priceInfo.snippetPrices : null,
                    formFieldProperties: undef,
                    clearExchangeCaches: true
                };
                if (this.Settings.attachParams) {
                    if (this.Settings.attachParams.formFieldProperties) {
                        loadParams.formFieldProperties = this.Settings.attachParams.formFieldProperties;
                    }
                    if (typeof this.Settings.attachParams.clearExchangeCaches !== "undefined") {
                        loadParams.clearExchangeCaches = this.Settings.attachParams.clearExchangeCaches === false ? false : true;
                    }
                }
                if (context && context.additionalAttachParams) {
                    if (context.additionalAttachParams.formFieldProperties) {
                        loadParams.formFieldProperties = context.additionalAttachParams.formFieldProperties;
                    }
                    if (typeof context.additionalAttachParams.clearExchangeCaches !== "undefined") {
                        loadParams.clearExchangeCaches = context.additionalAttachParams.clearExchangeCaches === false ? false : true;
                    }
                }
                iFrame.contentWindow.postMessage({
                    cmd: "loadTemplateAndFormFields",
                    parameters: [loadParams.templateNameOrToken, loadParams.mergeTemplates, loadParams.formFields, loadParams.snippetPriceCategoryLabels, loadParams.formFieldProperties, loadParams.clearExchangeCaches]
                }, '*');
                setTimeout(function () { iFrame.contentWindow.focus(); }, 0);
            }
        }
        //Hide the web page scrolling
        document.body.classList.add('hideAll');
        var root = document.getElementsByTagName('html');
        if (root && root.length > 0) {
            root[0].classList.add('printess-editor-open');
        }
        const iframeWrapper = document.getElementById("printess-container");
        if (iframeWrapper) {
            // iframeWrapper.style.display = "block !important";
            iframeWrapper.style.setProperty('display', 'block', 'important');
        }
    }
    hide(context, closeButtonClicked) {
        if (this.usePanelUi()) {
            const editor = this.getPrintessComponent();
            if (editor && editor.editor) {
                editor.editor.ui.hide();
            }
        }
        else {
            const iframeWrapper = document.getElementById("printess-container");
            if (iframeWrapper) {
                iframeWrapper.style.display = "none";
            }
        }
        document.body.classList.remove('hideAll');
        var root = document.getElementsByTagName('html');
        if (root && root.length > 0) {
            root[0].classList.remove('printess-editor-open');
        }
        if (typeof context.editorClosed === "function") {
            context.editorClosed(closeButtonClicked === true);
        }
    }
    static getGlobalShopSettings() {
        return (window && window["printessGlobalConfig"] ? window["printessGlobalConfig"] : {});
    }
    static getGlobalFormFields() {
        const settings = PrintessEditor.getGlobalShopSettings();
        let formFields;
        if (typeof settings.formFields != undefined && settings.formFields) {
            if (typeof settings.formFields == "function") {
                try {
                    formFields = settings.formFields();
                }
                catch (e) {
                    console.error(e);
                }
            }
            else {
                formFields = settings.formFields;
            }
        }
        return formFields || {};
    }
}function initPrintessEditor(shopToken, editorUrl, editorVersion, startupLogoUrl, showStartupAnimation, theme, startupBackgroundColor = "") {
    let editorSettings;
    if (shopToken && typeof shopToken !== "string") {
        editorSettings = {
            apiDomain: shopToken["apiDomain"] ? shopToken["apiDomain"] : null,
            shopToken: shopToken["shopToken"] ? shopToken["shopToken"] : "",
            editorUrl: shopToken["editorUrl"] ? shopToken["editorUrl"] : "",
            editorVersion: shopToken["editorVersion"] ? shopToken["editorVersion"] : "",
            attachParams: shopToken["attachParams"] ? shopToken["attachParams"] : "",
            showAlertOnTabClose: typeof shopToken["showTabClosingAlert"] !== "undefined" && shopToken["showTabClosingAlert"] !== null ? shopToken["showTabClosingAlert"] === true : false,
            uiSettings: {
                showStartupAnimation: typeof shopToken["showStartupAnimation"] !== "undefined" && shopToken["showStartupAnimation"] !== null ? shopToken["showStartupAnimation"] === true : true,
                startupBackgroundColor: shopToken["startupBackgroundColor"] || "#ffffff",
                theme: shopToken["theme"] || "",
                startupLogoUrl: shopToken["startupLogoUrl"] || "",
                uiVersion: shopToken["uiVersion"] || ""
            },
            ...shopToken,
        };
    }
    else {
        editorSettings = {
            apiDomain: null,
            shopToken: shopToken || "",
            editorUrl: editorUrl,
            editorVersion: editorVersion,
            uiSettings: {
                showStartupAnimation: showStartupAnimation,
                startupBackgroundColor: startupBackgroundColor,
                startupLogoUrl: startupLogoUrl,
                theme: theme
            }
        };
    }
    return new PrintessEditor(editorSettings);
}




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
}



class PrintessShopifyCart {
    constructor(printessSettings) {
        this.onFirstPageImageToken = "";
        this.settings = printessSettings;
        this.shopifyApi = new PrintessShopifyGraphQlApi(printessSettings.graphQlToken);
    }
    async initialize(productId) {
        if (!this.product || this.product.id !== productId) {
            this.product = await this.shopifyApi.getProductById(productId, true);
            if (!this.product) {
                console.error("Unable to load produt with id " + productId.toString());
                return;
            }
        }
    }
    static sleepAsync(timeoutMs) {
        return new Promise((resolve) => setTimeout(resolve, timeoutMs));
    }
    async getVariantForFormFields(formFields = null) {
        if (!formFields) {
            formFields = this.basketItemVariantOptions;
        }
        else {
            const variantOptionNameLookup = {};
            if (this.product) {
                if (this.product.productOptions) {
                    this.product.productOptions.forEach(x => variantOptionNameLookup[x.name] = true);
                }
            }
            const filteredFormFields = {};
            for (const ffName in formFields) {
                if (formFields.hasOwnProperty(ffName) && variantOptionNameLookup[ffName]) {
                    filteredFormFields[ffName] = formFields[ffName];
                }
            }
            formFields = filteredFormFields;
        }
        if (!this.product || !formFields) {
            return null;
        }
        let variants = this.variantCache;
        for (const optionName in formFields) {
            if (formFields.hasOwnProperty(optionName)) {
                variants = variants.filter(x => x.optionLookup && x.optionLookup.filter(y => y.name === optionName && y.value === formFields[optionName]).length > 0);
            }
        }
        if (variants.length === 0) {
            const variants = await this.shopifyApi.GetProductVariantByOptions(this.product.id, formFields, this.defaultVariant === null);
            if (variants) {
                if (variants.defaultVariant) {
                    this.defaultVariant = variants.defaultVariant;
                }
                if (variants.variantBySelectedOptions) {
                    this.variantCache = this.variantCache.concat(variants.variantBySelectedOptions);
                    return variants.variantBySelectedOptions;
                }
            }
            return this.defaultVariant;
        }
        else {
            return variants[0];
        }
    }
    handleTableQuantityVariants(formField, value, formFieldLabel, valueLabel) {
        if (this.tableQuantityVariants.tableName === formField || this.tableQuantityVariants.tableName === formFieldLabel) {
            try {
                const table = JSON.parse(value);
                if (table && table.length > 0) {
                    this.tableQuantityVariants.variants = [];
                    table.forEach((row) => {
                        const currentEntry = {
                            quantity: 0,
                            values: {}
                        };
                        for (const property in row) {
                            if (row.hasOwnProperty(property)) {
                                if (property === this.tableQuantityVariants.quantityColumnName) {
                                    currentEntry.quantity = parseInt(row[property] || "0");
                                }
                                else {
                                    currentEntry.values[property] = row[property];
                                }
                            }
                        }
                        this.tableQuantityVariants.variants.push(currentEntry);
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
            return true;
        }
        return false;
    }
    async splitSaveToken(showParams, saveToken, quantityColumnName) {
        let thumbnailWidth = 0;
        let thumbnailHeight = 0;
        let intValue = 0;
        if (showParams.additionalAttachParams) {
            if (typeof showParams.additionalAttachParams.basketThumbnailMaxWidth !== "undefined" && showParams.additionalAttachParams.basketThumbnailMaxWidth) {
                intValue = parseInt("" + showParams.additionalAttachParams.basketThumbnailMaxWidth);
                if (!isNaN(intValue) && isFinite(intValue) && intValue > -1) {
                    thumbnailWidth = intValue;
                }
            }
            if (typeof showParams.additionalAttachParams.basketThumbnailMaxHeight !== "undefined" && showParams.additionalAttachParams.basketThumbnailMaxHeight) {
                intValue = parseInt("" + showParams.additionalAttachParams.basketThumbnailMaxHeight);
                if (!isNaN(intValue) && isFinite(intValue) && intValue > -1) {
                    thumbnailHeight = intValue;
                }
            }
        }
        const response = await fetch('https://api.printess.com/shop/savetoken/split', {
            method: 'POST',
            redirect: "follow",
            headers: {
                "Content-Type": 'application/json',
                "Authorization": `Bearer ${this.settings.shopToken}`,
            },
            body: JSON.stringify({
                saveToken: saveToken,
                zeroCheckFieldName: quantityColumnName,
                width: thumbnailWidth,
                height: thumbnailHeight
            })
        });
        if (!response.ok) {
            console.error("Unable to split save token: [" + response.status + "] " + response.statusText);
            return [];
        }
        return await response.json();
    }
    static mapRecord(record, callback) {
        const ret = {};
        if (record) {
            for (const property in record) {
                if (record.hasOwnProperty(property)) {
                    const result = callback(property, record[property]);
                    if (result) {
                        ret[result.key] = result.value;
                    }
                }
            }
        }
        return ret;
    }
    isProductOption(optionName) {
        if (this.product && this.product.productOptions) {
            return this.product.productOptions.filter(x => x.name === optionName).length > 0;
        }
        return false;
    }
    async addTableQuantityItems(settings, saveToken, thumbnailUrl) {
        const that = this;
        const additionalLineItemProperties = this.cartItemConfig.additionalSettings ? { ...this.cartItemConfig.additionalSettings } : {};
        if (this.cartItemConfig.tableQuantityField && this.tableQuantityVariants && this.tableQuantityVariants.tableName) {
            additionalLineItemProperties["tableQuantityField"] = this.cartItemConfig.tableQuantityField;
        }
        const values = await this.splitSaveToken(settings, saveToken, this.tableQuantityVariants.quantityColumnName);
        const basketItems = [];
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];
            const currentVariantValues = {
                ...this.basketItemOptions,
                ...this.basketItemVariantOptions,
                ...value.dataRow,
            };
            const basketItemProperties = {
                ...PrintessShopifyCart.mapRecord(currentVariantValues, (key, value) => {
                    const namesToIgnore = ["quantity", "fix", "newsletter"];
                    const ret = {
                        key: key,
                        value: value
                    };
                    if ((key || "").startsWith("contact[") || namesToIgnore.includes((key || "").toLowerCase()) || this.isProductOption(key)) {
                        return null;
                    }
                    return ret;
                }),
                _printessSaveToken: value.saveToken,
                _printessThumbnail: value.previewUrl,
                _printessProductDefinitionId: "" + this.cartItemConfig.productDefinitionId,
                _printessOutputType: "" + this.cartItemConfig.outputType || "pdf",
                _printessOptionValueMappings: this.cartItemConfig.formFieldMappings,
                _printessDpi: "" + this.cartItemConfig.outputDpi || "300",
                _printessAdditionalProperties: additionalLineItemProperties,
                _printessTheme: this.cartItemConfig.theme,
                _printessProductType: this.cartItemConfig.productType
            };
            let quantity = 1;
            if (typeof value.dataRow[this.tableQuantityVariants.quantityColumnName] !== "undefined" && value.dataRow[this.tableQuantityVariants.quantityColumnName]) {
                const intValue = parseInt(("" + value.dataRow[this.tableQuantityVariants.quantityColumnName]) || "1");
                if (!isNaN(intValue) && isFinite(intValue)) {
                    quantity = intValue;
                }
            }
            if (quantity > 0) {
                const valuesToWrite = {
                    id: (await this.getVariantForFormFields()).id,
                    quantity: quantity,
                    properties: basketItemProperties
                };
                basketItems.push(valuesToWrite);
            }
        }
        const result = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: basketItems
            }),
        });
        window.location.replace('/cart');
    }
    hasVariantRelatedOptions() {
        if (this.basketItemVariantOptions) {
            for (const option in this.basketItemVariantOptions) {
                if (this.basketItemVariantOptions.hasOwnProperty(option)) {
                    return true;
                }
            }
        }
        return false;
    }
    async getBasketItemForSaveToken(saveToken) {
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
        return items.find(item => item.properties && item.properties._printessSaveToken ? item.properties && item.properties._printessSaveToken === this.cartItemConfig.templateNameOrSaveToken : false);
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
                await PrintessShopifyCart.sleepAsync(250);
                await this.addNewItemToBasket(saveToken, valuesToWrite, retries + 1);
            }
        }
    }
    async deleteBasketItem(saveToken, retries = 0) {
        const basketItem = await this.getBasketItemForSaveToken(saveToken);
        if (typeof basketItem.ok !== "undefined" && !basketItem) {
            console.error("Unable to delete item from basket: [" + basketItem.status.toString() + "] " + basketItem.statusText);
            if (retries > 4) {
                console.error("Unable to remove item from basket giving up (" + saveToken + ")");
            }
            else {
                await PrintessShopifyCart.sleepAsync(250);
                await this.deleteBasketItem(saveToken, retries + 1);
            }
        }
        else {
            if (basketItem) {
                const { key } = basketItem;
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
                    console.error("!Unable to delete item from basket: [" + basketItem.status.toString() + "] " + basketItem.statusText);
                    if (retries > 4) {
                        console.error("!Unable to remove item from basket giving up (" + saveToken + ")");
                    }
                    else {
                        await PrintessShopifyCart.sleepAsync(250);
                        await this.deleteBasketItem(saveToken, retries + 1);
                    }
                }
            }
        }
    }
    async replaceBasketItem(settings, saveToken, thumbnailUrl) {
        const namesToIgnore = ["fix", "newsletter"];
        if (this.cartItemConfig.tableQuantityField && this.tableQuantityVariants) {
            await this.addTableQuantityItems(settings, saveToken, thumbnailUrl);
            if (!settings.keepOriginalBasketItem === true) {
                await this.deleteBasketItem(this.cartItemConfig.templateNameOrSaveToken);
            }
            return;
        }
        const selectedVariant = await this.getVariantForFormFields();
        const basketItem = await this.getBasketItemForSaveToken(this.cartItemConfig.templateNameOrSaveToken);
        if (!basketItem || (typeof basketItem.ok !== "undefined" && !basketItem.ok)) {
            console.error("Could not find basket item for save token " + this.cartItemConfig.templateNameOrSaveToken);
        }
        let basketItemProperties = { ...basketItem.properties ? basketItem.properties : {} };
        if (settings.basketItemOptions) {
            for (let property in settings.basketItemOptions) {
                if (!property.startsWith("contact[") && !namesToIgnore.includes(property) && basketItemProperties && basketItemProperties.hasOwnProperty(property) && settings.basketItemOptions.hasOwnProperty(property)) {
                    basketItemProperties[property] = settings.basketItemOptions[property];
                }
            }
        }
        const additionalProperties = this.cartItemConfig.additionalSettings ? this.cartItemConfig.additionalSettings : {};
        additionalProperties["deletedBasketItem"] = this.cartItemConfig.templateNameOrSaveToken;
        basketItemProperties = {
            ...basketItemProperties,
            _printessSaveToken: saveToken,
            _printessThumbnail: thumbnailUrl,
            _printessProductDefinitionId: "" + this.cartItemConfig.productDefinitionId,
            _printessOutputType: "" + this.cartItemConfig.outputType || "pdf",
            _printessOptionValueMappings: this.cartItemConfig.formFieldMappings,
            _printessDpi: "" + this.cartItemConfig.outputDpi || "300",
            _printessAdditionalProperties: JSON.stringify(additionalProperties),
            _printessTheme: this.cartItemConfig.theme,
            _printessProductType: this.cartItemConfig.productType
        };
        let quantity = typeof settings.quantity !== "undefined" && settings.quantity > 1 ? settings.quantity : 1;
        //Quantity might be wrong, so read it from inputs.
        if (this.cartItemConfig.basketItemId) {
            const temp = PrintessShopifyCart.readBasketItemQuantityInput(this.cartItemConfig.basketItemId);
            if (temp != null) {
                quantity = temp;
            }
        }
        const valuesToWrite = {
            id: basketItem.id,
            quantity: quantity,
            properties: basketItemProperties
        };
        if (this.hasVariantRelatedOptions()) {
            valuesToWrite.id = selectedVariant.id;
        }
        const price = selectedVariant.price.amount;
        const globalSettings = PrintessEditor.getGlobalShopSettings();
        const callbackParams = {
            lastSaveToken: this.lastSaveToken,
            initialSaveToken: this.initialSaveToken,
            originalSaveToken: this.originalSaveToken,
            selectedVariant: await this.getVariantForFormFields(),
            formFieldValues: basketItemProperties,
            basketItemId: settings.basketItemId || null,
            product: this.product
        };
        if (typeof settings.onAddToBasket === "function") {
            try {
                settings.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
            }
            catch (e) {
                console.error(e);
            }
        }
        if (typeof globalSettings.onAddToBasket === "function") {
            try {
                globalSettings.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
            }
            catch (e) {
                console.error(e);
            }
        }
        if (typeof globalSettings.getPriceForFormFields === "function") {
            try {
                const newPrice = globalSettings.getPriceForFormFields(basketItemProperties, price, callbackParams);
                if (typeof newPrice === "number" && newPrice != price) {
                    valuesToWrite[price] = newPrice;
                }
            }
            catch (e) {
                console.error(e);
            }
        }
        await this.addNewItemToBasket(saveToken, valuesToWrite);
        if (!settings.keepOriginalBasketItem) {
            await this.deleteBasketItem(this.cartItemConfig.basketItemId);
        }
        window.location.replace('/cart');
    }
    createShopContext(showSettings) {
        const that = this;
        const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
        const attachParams = showSettings.additionalAttachParams ? showSettings.additionalAttachParams : {};
        const context = {
            templateNameOrSaveToken: that.cartItemConfig.templateNameOrSaveToken,
            stickers: [],
            legalText: showSettings.legalText || "",
            legalTextUrl: showSettings.legalTextUrl || "",
            snippetPrices: [],
            chargeEachStickerUsage: false,
            hidePricesInEditor: typeof this.settings.hidePricesInEditor !== "undefined" && this.settings.hidePricesInEditor === true,
            showSplitterGridSizeButton: showSettings.showSplitterGridSizeButton,
            additionalAttachParams: attachParams,
            cameFromSave: false,
            getProductName: function () {
                if (typeof showSettings.displayProductName !== "undefined" && showSettings.displayProductName === false) {
                    return "";
                }
                return that.product ? that.product.title || "" : "";
            },
            getPriceInfo: function () {
                return null;
            },
            getMergeTemplates: function () {
                let mergeTemplates = that.product.mergeTemplates?.value || showSettings.mergeTemplates || null;
                if (mergeTemplates) {
                    if (typeof mergeTemplates === "string") {
                        return PrintessShopifyCart.parseMergeTemplates(mergeTemplates);
                    }
                    else {
                        return mergeTemplates;
                    }
                }
                return [];
            },
            formatMoney: function (price) {
                const format = that.settings.shopMoneyFormat ? that.settings.shopMoneyFormat : "${{amount}}";
                let ret = PrintessShopifyCart.formatMoney(price * 100 /*GraphQl does not return money in cents, but format function expects it*/, format); //parseFloat("" + (price / 100)).toFixed(2);
                if (that.settings.priceDisplayElementSelector) {
                    try {
                        const priceDisplay = document.querySelector(that.settings.priceDisplayElementSelector);
                        if (priceDisplay) {
                            ret = priceDisplay.textContent;
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                return ret;
            },
            onFormFieldChanged: function (formField, value, formFieldLabel, valueLabel) {
                let optionFound = false;
                let formFieldChangedCallback = null;
                if (PrintessEditor && PrintessEditor.getGlobalShopSettings) {
                    const settings = PrintessEditor.getGlobalShopSettings();
                    if (typeof settings.onFormFieldChanged === "function") {
                        formFieldChangedCallback = settings.onFormFieldChanged;
                    }
                }
                if (that.cartItemConfig.tableQuantityField) {
                    if (that.handleTableQuantityVariants(formField, value, formFieldLabel, valueLabel)) {
                        if (formFieldChangedCallback) {
                            try {
                                const callbackParams = {
                                    selectedVariant: that.getVariantForFormFields(),
                                    formFieldValues: {
                                        ...that.basketItemOptions,
                                        ...that.basketItemVariantOptions
                                    },
                                    basketItemId: showSettings.basketItemId || null,
                                    product: that.product
                                };
                                formFieldChangedCallback(formField, value, formFieldLabel, valueLabel, callbackParams);
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                    }
                    return;
                }
                if (that.basketItemVariantOptions) {
                    for (const itemName in that.basketItemVariantOptions) {
                        if (that.basketItemVariantOptions.hasOwnProperty(itemName)) {
                            if (itemName === formField) {
                                optionFound = true;
                                that.basketItemVariantOptions[itemName] = value;
                            }
                            else if (itemName === formFieldLabel) {
                                optionFound = true;
                                that.basketItemVariantOptions[itemName] = valueLabel;
                            }
                        }
                    }
                }
                if (that.basketItemOptions) {
                    for (const itemName in that.basketItemOptions) {
                        if (that.basketItemOptions.hasOwnProperty(itemName)) {
                            if (itemName === formField) {
                                optionFound = true;
                                that.basketItemOptions[itemName] = value;
                            }
                            else if (itemName === formFieldLabel) {
                                optionFound = true;
                                that.basketItemOptions[itemName] = valueLabel;
                            }
                        }
                    }
                }
                if (formFieldChangedCallback) {
                    try {
                        const callbackParams = {
                            selectedVariant: that.getVariantForFormFields(),
                            formFieldValues: {
                                ...that.basketItemOptions,
                                ...that.basketItemVariantOptions
                            },
                            basketItemId: showSettings.basketItemId,
                            product: that.product
                        };
                        formFieldChangedCallback(formField, value, formFieldLabel, valueLabel, callbackParams);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            },
            onAddToBasket: function (saveToken, thumbnailUrl) {
                if (that.originalSaveToken) {
                    if (!that.cartItemConfig.additionalSettings) {
                        that.cartItemConfig.additionalSettings = {};
                    }
                    that.cartItemConfig.additionalSettings["originalSaveToken"] = that.originalSaveToken;
                }
                const callbackParams = {
                    lastSaveToken: that.lastSaveToken,
                    initialSaveToken: that.initialSaveToken,
                    originalSaveToken: that.originalSaveToken,
                    selectedVariant: that.getVariantForFormFields(),
                    formFieldValues: {
                        ...that.basketItemOptions,
                        ...that.basketItemVariantOptions
                    },
                    basketItemId: showSettings.basketItemId,
                    product: that.product
                };
                try {
                    if (typeof showSettings.onAddToBasket === "function") {
                        showSettings.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
                    }
                }
                catch (e) {
                    console.error(e);
                }
                const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                try {
                    if (conf && typeof conf.onAddToBasket === "function") {
                        conf.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
                    }
                }
                catch (e) {
                    console.error(e);
                }
                that.replaceBasketItem(showSettings, saveToken, thumbnailUrl).then(() => {
                    that.lastSaveToken = saveToken;
                });
            },
            getCurrentFormFieldValues: function () {
                return {
                    ...that.basketItemVariantOptions,
                    ...that.basketItemOptions,
                    "cartItem": "true"
                };
            },
            getPriceForFormFieldsAsync: async (formFields) => {
                let callback = null;
                if (PrintessEditor && PrintessEditor.getGlobalShopSettings) {
                    const settings = PrintessEditor.getGlobalShopSettings();
                    if (typeof settings.getPriceForFormFields === "function") {
                        callback = settings.getPriceForFormFields;
                    }
                }
                if (that.cartItemConfig.tableQuantityField) {
                    let price = 0;
                    if (that.tableQuantityVariants) {
                        for (let i = 0; i < that.tableQuantityVariants.variants.length; ++i) {
                            const tableVariant = that.tableQuantityVariants.variants[i];
                            const variantValues = {
                                ...formFields,
                                ...tableVariant.values
                            };
                            const variant = await that.getVariantForFormFields(variantValues);
                            price += variant.price.amount * tableVariant.quantity;
                        }
                    }
                    if (callback) {
                        try {
                            const callbackParams = {
                                lastSaveToken: that.lastSaveToken,
                                initialSaveToken: that.initialSaveToken,
                                originalSaveToken: that.originalSaveToken,
                                selectedVariant: await that.getVariantForFormFields(),
                                formFieldValues: {
                                    ...that.basketItemOptions,
                                    ...that.basketItemVariantOptions
                                },
                                basketItemId: showSettings.basketItemId || null,
                                product: that.product
                            };
                            return callback(formFields, price, callbackParams);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    return price;
                }
                else {
                    const variant = await that.getVariantForFormFields();
                    const callbackParams = {
                        selectedVariant: variant,
                        formFieldValues: formFields,
                        basketItemId: showSettings.basketItemId || null,
                        product: that.product
                    };
                    if (callback) {
                        try {
                            return callback(formFields, variant.price.amount, callbackParams);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    return variant.price.amount;
                }
            },
            getFormFieldMappings: function () {
                let ret = {};
                if (context.__ffMappings) {
                    return context.__ffMappings;
                }
                const formFieldMappings = that.cartItemConfig.formFieldMappings || that.product.optionNameMapping?.value || "";
                if (formFieldMappings) {
                    try {
                        let mappings;
                        try {
                            mappings = JSON.parse(formFieldMappings);
                        }
                        catch (e) {
                            //For some reason this is sometimes html encoded
                            var txt = document.createElement("textarea");
                            txt.innerHTML = formFieldMappings;
                            mappings = JSON.parse(txt.value);
                        }
                        if (mappings && typeof mappings !== "string" && typeof mappings !== "number" && !Array.isArray(mappings) && typeof mappings !== "boolean" && typeof mappings === "object") {
                            ret = mappings;
                            context.__ffMappings = ret;
                        }
                    }
                    catch {
                    }
                }
                return ret;
            },
            onRenderFirstPageImageAsync: async (thumbnailUrl) => {
                if (context.cameFromSave && that.onFirstPageImageToken) {
                    try {
                        await context.onSaveAsync(that.onFirstPageImageToken, thumbnailUrl, true);
                    }
                    catch (e) {
                        console.error(e);
                    }
                    that.onFirstPageImageToken = "";
                    context.cameFromSave = false;
                }
            },
            onSaveAsync: async (saveToken, thumbnailUrl, cameFromFirstpageImage = false) => {
                context.cameFromSave = true;
                if (!cameFromFirstpageImage && typeof context.renderFirstPageImageAsync === "function") {
                    let maxThumbnailWidth = 400;
                    let maxThumbnailHeight = 400;
                    if (showSettings.additionalAttachParams) {
                        if (typeof showSettings.additionalAttachParams.basketThumbnailMaxWidth !== "undefined" && showSettings.additionalAttachParams.basketThumbnailMaxWidth) {
                            const intValue = parseInt("" + showSettings.additionalAttachParams.basketThumbnailMaxWidth);
                            if (!isNaN(intValue) && isFinite(intValue) && intValue > -1) {
                                maxThumbnailWidth = intValue;
                            }
                        }
                        if (typeof showSettings.additionalAttachParams.basketThumbnailMaxHeight !== "undefined" && showSettings.additionalAttachParams.basketThumbnailMaxHeight) {
                            const intValue = parseInt("" + showSettings.additionalAttachParams.basketThumbnailMaxHeight);
                            if (!isNaN(intValue) && isFinite(intValue) && intValue > -1) {
                                maxThumbnailHeight = intValue;
                            }
                        }
                    }
                    that.onFirstPageImageToken = saveToken;
                    await context.renderFirstPageImageAsync(maxThumbnailWidth, maxThumbnailHeight);
                }
                else {
                    const callbackParams = {
                        lastSaveToken: that.lastSaveToken,
                        initialSaveToken: that.initialSaveToken,
                        originalSaveToken: that.originalSaveToken,
                        selectedVariant: await that.getVariantForFormFields(),
                        formFieldValues: {
                            ...that.basketItemOptions,
                            ...that.basketItemVariantOptions
                        },
                        basketItemId: that.cartItemConfig.basketItemId || null,
                        product: that.product
                    };
                    try {
                        if (typeof showSettings.onSave === "function") {
                            showSettings.onSave(saveToken, thumbnailUrl, callbackParams);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                    const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                    try {
                        if (conf && typeof conf.onSave === "function") {
                            conf.onSave(saveToken, thumbnailUrl, callbackParams);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                    that.lastSaveToken = saveToken;
                }
            },
            onLoadAsync: async (currentTemplateNameOrSaveToken) => {
                const callbackParams = {
                    lastSaveToken: that.lastSaveToken,
                    initialSaveToken: that.initialSaveToken,
                    originalSaveToken: that.originalSaveToken,
                    selectedVariant: await that.getVariantForFormFields(),
                    formFieldValues: {
                        ...that.basketItemOptions,
                        ...that.basketItemVariantOptions
                    },
                    basketItemId: that.cartItemConfig.basketItemId || null,
                    product: that.product
                };
                const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                try {
                    if (conf && typeof conf.onLoad === "function") {
                        conf.onLoad(currentTemplateNameOrSaveToken, callbackParams);
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
        };
        return context;
    }
    static parseMergeTemplates(valueString) {
        let ret = null;
        if (!valueString) {
            return ret;
        }
        try {
            const json = JSON.parse(valueString);
            if (typeof json === "string") {
                ret = [{
                        "templateName": json,
                        "mergeMode": "layout-snippet-no-repeat"
                    }];
            }
            else {
                if (!Array.isArray(json)) {
                    ret = [json];
                }
                else {
                    ret = json;
                }
            }
        }
        catch (e) {
            ret = [{
                    "templateName": valueString,
                    "mergeMode": "layout-snippet-no-repeat"
                }];
        }
        if (ret) {
            ret.forEach((x) => {
                if (!x.mergeMode) {
                    x.mergeMode = "layout-snippet-no-repeat";
                }
            });
        }
        return ret;
    }
    static parseBasketItemConfig(product, basketItemOptions, unknownSettings, variantSettings) {
        const basketItemConfig = {
            templateNameOrSaveToken: null,
            productDefinitionId: null,
            outputType: null,
            outputDpi: null,
            formFieldMappings: null,
            theme: null,
            additionalSettings: null,
            tableQuantityField: null,
            basketItemId: null
        };
        const variantOptionNameLookup = {};
        if (product) {
            if (product.productOptions) {
                product.productOptions.forEach(x => variantOptionNameLookup[x.name] = true);
            }
        }
        if (basketItemOptions) {
            for (const prop in basketItemOptions) {
                if (basketItemOptions.hasOwnProperty(prop)) {
                    const value = basketItemOptions[prop] || "";
                    switch (prop) {
                        case "_printessSaveToken": {
                            basketItemConfig.templateNameOrSaveToken = value;
                            break;
                        }
                        case "_printessThumbnailUrl": {
                            //basketItemConfig. = value;
                            break;
                        }
                        case "_printessProductDefinitionId": {
                            basketItemConfig.productDefinitionId = parseInt(value || "-1");
                            if (isNaN(basketItemConfig.productDefinitionId) || !isFinite(basketItemConfig.productDefinitionId)) {
                                basketItemConfig.productDefinitionId = -1;
                            }
                            break;
                        }
                        case "_printessOutputType": {
                            basketItemConfig.outputType = value || "pdf";
                            break;
                        }
                        case "_printessDpi": {
                            basketItemConfig.outputDpi = parseInt(value || "300");
                            if (isNaN(basketItemConfig.outputDpi) || !isFinite(basketItemConfig.outputDpi)) {
                                basketItemConfig.outputDpi = 300;
                            }
                            break;
                        }
                        case "_printessOptionValueMappings": {
                            basketItemConfig.formFieldMappings = value;
                            break;
                        }
                        case "_printessTheme": {
                            if (!basketItemConfig.theme && value) {
                                basketItemConfig.theme = value;
                            }
                            break;
                        }
                        case "_printessProductType": {
                            if (!basketItemConfig.productType && value) {
                                basketItemConfig.productType = value;
                            }
                            break;
                        }
                        case "_printessAdditionalProperties": {
                            try {
                                basketItemConfig.additionalSettings = typeof value === "string" ? JSON.parse(value) : value;
                            }
                            catch (e) {
                                //In case it is html encoded
                                var txt = document.createElement("textarea");
                                txt.innerHTML = value;
                                basketItemConfig.additionalSettings = typeof value === "string" ? JSON.parse(txt.value) : value;
                            }
                            if (basketItemConfig.additionalSettings) {
                                for (const settingName in basketItemConfig.additionalSettings) {
                                    if (basketItemConfig.additionalSettings.hasOwnProperty(settingName)) {
                                        switch (settingName) {
                                            case "tableQuantityField": {
                                                basketItemConfig.tableQuantityField = basketItemConfig.additionalSettings[settingName];
                                                break;
                                            }
                                            default: {
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        }
                        default: {
                            if (variantOptionNameLookup[prop]) {
                                variantSettings[prop] = value;
                            }
                            else {
                                unknownSettings[prop] = value;
                            }
                        }
                    }
                }
            }
        }
        return basketItemConfig;
    }
    static formatMoney(cents, format) {
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
            const numberStr = (number / 100.0).toFixed(precision);
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
    static parseTableQuantityField(fieldName) {
        const ret = {
            tableName: fieldName || "",
            quantityColumn: ""
        };
        if (fieldName) {
            const ptPos = fieldName.indexOf(".");
            if (ptPos >= 0 && ptPos < fieldName.length) {
                ret.tableName = fieldName.substring(0, ptPos);
                if (ptPos < fieldName.length - 1) {
                    ret.quantityColumn = fieldName.substring(ptPos + 1);
                }
            }
        }
        return ret;
    }
    static readBasketItemQuantityInput(basketItemId) {
        const test = "".toString();
        const customizeButton = document.getElementById("printessCustomizeButton" + (basketItemId || "").toString().replace(":", "_"));
        if (!customizeButton) {
            return null;
        }
        const parent = customizeButton.closest(".cart-item");
        if (!parent) {
            return null;
        }
        const input = parent.querySelector("input.quantity__input");
        if (input) {
            return parseInt(input.getAttribute("value"));
        }
        return null;
    }
    initTableQuantityVariants(settings) {
        if (this.cartItemConfig.tableQuantityField) {
            const names = PrintessShopifyCart.parseTableQuantityField(this.cartItemConfig.tableQuantityField);
            if (names.quantityColumn) {
                let quantity = PrintessShopifyCart.readBasketItemQuantityInput(settings.basketItemId);
                this.tableQuantityVariants = {
                    "tableName": names.tableName,
                    "quantityColumnName": names.quantityColumn,
                    "variants": [{
                            "quantity": quantity,
                            "values": {
                                ...this.basketItemOptions,
                                ...this.basketItemVariantOptions
                            }
                        }]
                };
            }
        }
    }
    async show(showSettings) {
        await this.initialize(showSettings.productId);
        if (!this.product) {
            console.error("Printess integration not initialized properly.");
            return;
        }
        this.basketItemOptions = {};
        this.basketItemVariantOptions = {};
        this.variantCache = [];
        this.defaultVariant = null;
        this.tableQuantityVariants = null;
        this.lastSaveToken = "";
        this.originalSaveToken = "";
        this.cartItemConfig = PrintessShopifyCart.parseBasketItemConfig(this.product, showSettings.basketItemOptions, this.basketItemOptions, this.basketItemVariantOptions) || {};
        this.cartItemConfig.basketItemId = showSettings.basketItemId;
        this.initialSaveToken = this.cartItemConfig.templateNameOrSaveToken && this.cartItemConfig.templateNameOrSaveToken.indexOf("st:") === 0 ? this.cartItemConfig.templateNameOrSaveToken : "";
        this.initTableQuantityVariants(showSettings);
        if (showSettings.theme) {
            this.cartItemConfig.theme = showSettings.theme;
        }
        const context = this.createShopContext(showSettings);
        if (this.cartItemConfig.additionalSettings && this.cartItemConfig.additionalSettings["originalSaveToken"]) {
            this.originalSaveToken = this.cartItemConfig.additionalSettings["originalSaveToken"];
        }
        else if (this.initialSaveToken) {
            this.originalSaveToken = this.initialSaveToken;
        }
        //Specify ui version
        if (this.cartItemConfig && this.cartItemConfig.additionalSettings && this.cartItemConfig.additionalSettings["uiVersion"]) {
            this.settings.uiVersion = this.cartItemConfig.additionalSettings["uiVersion"];
        }
        if (typeof window["initPrintessEditor"] === "function") {
            const editor = window["initPrintessEditor"](this.settings);
            editor.show(context);
        }
        else if (typeof initPrintessEditor === "function") {
            const editor = initPrintessEditor(this.settings);
            editor.show(context);
        }
    }
    static async deleteUndeletedBasketItem() {
        if (!PrintessShopifyCart.deleteUndeletedBasketItem.running) {
            PrintessShopifyCart.deleteUndeletedBasketItem.running = true;
        }
        else {
            return;
        }
        //Get all basket items and check for a save tokens that should be deleted.
        const result = await fetch('/cart.js', {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!result || !result.ok) {
            console.error("Unable to retrieve basket items");
            return;
        }
        const json = await result.json();
        let { items } = json;
        //Filter for printess itmes
        items = items.filter(item => item.properties && item.properties._printessSaveToken ? item.properties && item.properties._printessSaveToken : false);
        //Check if we have items that need to be deleted
        const saveTokensToDelete = {};
        items.forEach((x) => {
            if (x.properties && x.properties._printessAdditionalProperties) {
                try {
                    x.properties._printessAdditionalProperties = typeof x.properties._printessAdditionalProperties === "string" ? JSON.parse(x.properties._printessAdditionalProperties) : x.properties._printessAdditionalProperties;
                }
                catch (e) {
                    //In case it is html encoded
                    var txt = document.createElement("textarea");
                    txt.innerHTML = x.properties._printessAdditionalProperties;
                    x.properties._printessAdditionalProperties = typeof x.properties._printessAdditionalProperties === "string" ? JSON.parse(txt.value) : x.properties._printessAdditionalProperties;
                }
                if (x.properties._printessAdditionalProperties.deletedBasketItem) {
                    saveTokensToDelete[x.properties._printessAdditionalProperties.deletedBasketItem] = true;
                }
            }
        });
        //Check each item if it needs to be deleted
        for (let i = 0; i < items.length; ++i) {
            if (items[i].properties && items[i].properties._printessSaveToken && saveTokensToDelete[items[i].properties._printessSaveToken]) {
                const result = await fetch('/cart/change.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: items[i].key,
                        quantity: 0
                    })
                });
                if (!result.ok) {
                    console.error("Unable to delete basket item " + items[i].properties._printessSaveToken + "[" + result.status.toString() + "] " + result.statusText);
                }
                window.location.replace('/cart');
                break;
            }
        }
    }
}




const showPrintessEditorFallback = (itemId, loopCount = 0, keepOriginalBasketItem = false) => {
    const showMethodName1 = "openPrintessEditor" + itemId;
    const showMethodName2 = "showPrintessEditor" + itemId;
    if (typeof window[showMethodName1] === "undefined" && typeof window[showMethodName2] === "undefined") {
        const scriptTag = document.getElementById("printess_script_" + itemId);
        if (scriptTag) {
            const newTag = document.createElement('script');
            newTag.setAttribute("id", "printess_script_" + itemId);
            newTag.type = 'text/javascript';
            newTag.text = scriptTag.text;
            scriptTag.replaceWith(newTag);
            if (loopCount < 10) {
                setTimeout(function () {
                    showPrintessEditorFallback(itemId, ++loopCount, keepOriginalBasketItem);
                }, 200);
            }
            else {
                console.error(showMethodName1 + "/" + showMethodName2 + " not found.");
            }
            ;
        }
    }
    else {
        if (typeof window[showMethodName1] !== "undefined")
            window[showMethodName1](keepOriginalBasketItem);
        if (typeof window[showMethodName2] !== "undefined")
            window[showMethodName2](null, keepOriginalBasketItem);
    }
};
const initPrintessShopifyEditor = (printessSettings) => {
    if (typeof window["printessShopifyEditor"] === "undefined") {
        const addToBasketButtonSelector = printessSettings && printessSettings.productButtonSelector ? printessSettings.productButtonSelector : 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart';
        const editor = {
            productCache: {},
            productFormSelector: printessSettings && printessSettings.productFormSelector ? printessSettings.productFormSelector : 'form[data-type="add-to-cart-form"],form.product-single__form,form.shopify-product-form[id^=product-form-template],form[action="/cart/add"]',
            tableQuantityVariants: null,
            lastSaveToken: "",
            initialSaveToken: "",
            originalSaveToken: "",
            onRenderFirstPageImageToken: "",
            ignoreDataOptionIndex: printessSettings && typeof printessSettings.ignoreDataOptionIndex !== "undefined" && printessSettings.ignoreDataOptionIndex === true,
            debounce: function (func, timeout = 300) {
                let timer = undefined;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => { func.apply(this, args); }, timeout);
                };
            },
            mapOptionValue: (optionName, optionIndex, value, product) => {
                let ret = null;
                if (product.optionDetails) {
                    for (let currentOption = 0; currentOption < product.optionDetails.length; ++currentOption) {
                        const option = product.optionDetails[currentOption];
                        if ((optionName === option.name || optionIndex === option.position) && option.values) {
                            for (let currentValue = 0; currentValue < option.values.length; ++currentValue) {
                                const _value = option.values[currentValue];
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
                }
                return ret || value;
            },
            evaluateInputName(product, name, dataOptionPosition, dataOptionName, dataOptionValueId) {
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
                    if (product.options && _name.indexOf("option") === 0) {
                        const index = parseInt(_name.substring("option".length, _name.length));
                        if (!isNaN(index) && isFinite(index) && index > 0 && index <= product.options.length) { //Data option position is 1 based in shopify
                            optionPosition = index;
                        }
                    }
                }
                if (product && product.optionDetails && !dataOptionPosition && optionPosition < 1 && dataOptionValueId) {
                    if (typeof dataOptionValueId !== "number") {
                        dataOptionValueId = parseInt(dataOptionValueId);
                    }
                    for (let i = 0; i < product.optionDetails.length; ++i) {
                        if (product.optionDetails[i].values) {
                            for (let j = 0; j < product.optionDetails[i].values.length; ++j) {
                                if (product.optionDetails[i].values[j].id === dataOptionValueId) {
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
                    if (!isNaN(index) && isFinite(index) && index > 0 && index <= product.options.length) { //Data option position is 1 based in shopify
                        optionPosition = index;
                    }
                }
                if (product.optionDetails && optionPosition > 0 && optionPosition <= product.options.length) {
                    _name = product.options[optionPosition - 1];
                }
                return _name;
            },
            evaluateInputValue(product, optionName, optionIndex, value, dataOptionValueId) {
                if (product.options && optionName && !optionIndex) {
                    for (let i = 0; i < product.options.length; ++i) {
                        if (product.options[i] === optionName) {
                            optionIndex = (i + 1).toString();
                            break;
                        }
                    }
                }
                if (product && !optionIndex && dataOptionValueId) {
                    if (typeof dataOptionValueId !== "number") {
                        dataOptionValueId = parseInt(dataOptionValueId);
                    }
                    for (let i = 0; i < product.optionDetails.length; ++i) {
                        if (product.optionDetails[i].values) {
                            for (let j = 0; j < product.optionDetails[i].values.length; ++j) {
                                if (product.optionDetails[i].values[j].id === dataOptionValueId) {
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
                if (product.options && optionIndex) {
                    const index = parseInt(optionIndex);
                    if (!isNaN(index) && isFinite(index) && index > 0 && index <= product.options.length) {
                        return editor.mapOptionValue(optionName, index, value, product);
                    }
                }
                return value;
            },
            getInputs() {
                const ret = [];
                const inputSelector = 'select,input[type="radio"]:checked,input[type="checkbox"]:checked,input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="hidden"],input[type="month"],input[type="number"],input[type="password"],input[type="tel"],input[type="text"],input[type="time"],input[type="url"],input[type="week"]';
                document.querySelectorAll(inputSelector).forEach((x) => {
                    ret.push(x);
                });
                return ret;
            },
            hasVariantRelatedOptions(product, selectedOptions) {
                const variantRelatedOptions = editor.getProductOptionValuesForVariants(selectedOptions, product);
                for (const propertyName in variantRelatedOptions) {
                    if (variantRelatedOptions.hasOwnProperty(propertyName)) {
                        return true;
                    }
                }
                return false;
            },
            getCurrentProductOptionValues: (product) => {
                const ret = {};
                //Check if there are predefined form field values and include these
                if (PrintessEditor && PrintessEditor.getGlobalFormFields) {
                    const globalFormFields = PrintessEditor.getGlobalFormFields();
                    for (const property in globalFormFields) {
                        if (globalFormFields.hasOwnProperty(property)) {
                            ret[property] = globalFormFields[property];
                        }
                    }
                }
                editor.getInputs().forEach((input) => {
                    let dataOptionPosition = input.getAttribute("data-option-position") || input.getAttribute("data-option-index");
                    let dataOptionName = input.getAttribute("data-option-name") || input.getAttribute("data-name") || input.getAttribute("name") || input.getAttribute("aria-label") || input.getAttribute("data-index");
                    let name = editor.evaluateInputName(product, input.getAttribute("name"), !editor.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, input.getAttribute("data-option-value-id"));
                    let value = editor.evaluateInputValue(product, name, !editor.ignoreDataOptionIndex ? dataOptionPosition : "", input.value, input.getAttribute("data-option-value-id"));
                    const namesToIgnore = ["form_type", "utf8", "id", "product-id", "section-id"];
                    if (name && name[0] !== "_" && namesToIgnore.indexOf(name) === -1 && name.indexOf("printess") !== 0) {
                        ret[name] = value;
                    }
                });
                if (PrintessEditor && PrintessEditor.getGlobalShopSettings) {
                    const settings = PrintessEditor.getGlobalShopSettings();
                    if (typeof settings.filterFormFields === "function") {
                        try {
                            return settings.filterFormFields(ret);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                return ret;
            },
            getOptionsLookup: (product) => {
                const optionLookup = {};
                if (!product || !product.options) {
                    return optionLookup;
                }
                for (let i = 0; i < product.options.length; ++i) {
                    optionLookup[product.options[i]] = i;
                    optionLookup["option" + (i + 1)] = i;
                }
                return optionLookup;
            },
            isProductOption: (product, optionaName) => {
                const lowerName = (optionaName || "").toLowerCase();
                if (product || product.options) {
                    for (let i = 0; i < product.options.length; ++i) {
                        if ((product.options[i] || "").toLowerCase() === lowerName) {
                            return true;
                        }
                    }
                }
                return false;
            },
            mapRecord: (record, callback) => {
                const ret = {};
                if (record) {
                    for (const property in record) {
                        if (record.hasOwnProperty(property)) {
                            const result = callback(property, record[property]);
                            if (result) {
                                ret[result.key] = result.value;
                            }
                        }
                    }
                }
                return ret;
            },
            getProductOptionValuesForVariants: (productOptions, product) => {
                const optionLookup = editor.getOptionsLookup(product);
                const ret = {};
                for (const optionName in productOptions) {
                    if (productOptions.hasOwnProperty(optionName) && optionLookup[optionName] >= 0) {
                        ret[optionName] = productOptions[optionName];
                    }
                }
                return ret;
            },
            parseInputName: (name) => {
                name = (name || "").trim();
                let hyphenIndex = -1;
                if (name.length > 2 && (hyphenIndex = name.indexOf("-")) > 0) {
                    const optionIndex = parseInt(name.substring(hyphenIndex + 1, name.length));
                    if (optionIndex >= 0 && !isNaN(optionIndex) && isFinite(optionIndex)) {
                        name = name.substring(0, hyphenIndex);
                    }
                }
                if (name) {
                    if (name[name.length - 1] === "]") {
                        name = name.substr(0, name.length - 1);
                        const index = name.indexOf("[");
                        if (index > -1) {
                            name = name.substr(index + 1);
                        }
                    }
                }
                return name;
            },
            addVariantChangeHandler: (product, variantChangeCallback) => {
                const getFormFieldsKey = function (formFields) {
                    let ret = "";
                    for (const ffName in formFields) {
                        if (formFields.hasOwnProperty(ffName)) {
                            ret += ffName + ";" + formFields[ffName] + "_";
                        }
                    }
                    return ret;
                };
                const triggerVariantChange = () => {
                    editor.debounce(() => {
                        const key = getFormFieldsKey(editor.getProductOptionValuesForVariants(editor.getCurrentProductOptionValues(product), product));
                        if (editor.addVariantChangeHandler.lastValue != key) {
                            editor.addVariantChangeHandler.lastValue = key;
                            if (typeof variantChangeCallback === "function") {
                                variantChangeCallback(editor.getVariantByProductOptions(editor.getCurrentProductOptionValues(product), product, true));
                            }
                        }
                    }, 100)();
                };
                const form = editor.getAddToBasketForm(editor.productFormSelector);
                if (form) {
                    const inputs = [];
                    form.querySelectorAll("input,select").forEach(x => inputs.push(x));
                    document.querySelectorAll("input[form='" + form.getAttribute("id") + "'],select[form='" + form.getAttribute("id") + "']").forEach(x => inputs.push(x));
                    inputs.forEach((x) => {
                        if (x.nodeName.toLowerCase() === "select" || (x.getAttribute("type") || "").toLowerCase() === "radio" || ((x.getAttribute("name") === "id") && x.getAttribute("type") === "hidden")) {
                            x.setAttribute("printessAddedEventHandler", "true");
                            x.addEventListener("change", triggerVariantChange);
                            console.log("Name: " + x.name + "; node: " + x.nodeName + ": type: " + x.getAttribute("type"));
                        }
                    });
                }
            },
            getVariantByProductOptions: (formFields, product, returnDefaultVariantOnFail = false) => {
                const variantProductOptionValues = editor.getProductOptionValuesForVariants(formFields, product);
                const optionLookup = editor.getOptionsLookup(product);
                let variants = product.variants;
                for (const x in variantProductOptionValues) {
                    if (variantProductOptionValues.hasOwnProperty(x)) {
                        let optionIndex = typeof optionLookup[x] !== "undefined" && optionLookup[x] >= 0 ? optionLookup[x] : -1;
                        if (optionIndex > -1) {
                            variants = variants.filter((variant) => {
                                if (variant.options && variant.options.length > optionIndex) {
                                    if (variant.options[optionIndex] == variantProductOptionValues[x]) {
                                        return true;
                                    }
                                }
                            });
                        }
                    }
                }
                if (variants.length === 0) {
                    variants = product.variants;
                    for (const x in variantProductOptionValues) {
                        if (variantProductOptionValues.hasOwnProperty(x) && x.indexOf("option") === 0) {
                            variants = variants.filter((variant) => {
                                if (typeof variant[x] !== "undefined" && variant[x] === variantProductOptionValues[x]) {
                                    return true;
                                }
                            });
                        }
                    }
                }
                if (variants.length === 0 && !returnDefaultVariantOnFail) {
                    return null;
                }
                else {
                    if (variants.length === 0) {
                        return product.variants[0];
                    }
                    return variants[0];
                }
            },
            postMessage: (cmd, properties) => {
                const iFrame = document.getElementById("printess");
                if (iFrame) {
                    setTimeout(function () {
                        iFrame.contentWindow.postMessage({
                            cmd: cmd,
                            properties: properties || {}
                        }, "*");
                    }, 0);
                }
            },
            setFormFieldValue: (product, formField, value, formFieldLabel, valueLabel) => {
                //Radio buttons
                let inputs = document.querySelectorAll(`input[type="radio"]`);
                if (inputs && inputs.length > 0) {
                    inputs.forEach((el) => {
                        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
                        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
                        const initialName = editor.evaluateInputName(product, el.getAttribute("name"), !editor.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
                        const initialValue = editor.evaluateInputValue(product, initialName, !editor.ignoreDataOptionIndex ? dataOptionPosition : "", el.value, el.getAttribute("data-option-value-id"));
                        let valueChanged = false;
                        if (initialName === formField || initialName === formFieldLabel) {
                            if (initialValue === value || initialValue === valueLabel) {
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
                    const initialName = editor.evaluateInputName(product, el.getAttribute("name"), !editor.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
                    let valueChanged = false;
                    if (el.options) {
                        for (let i = 0; i < el.options.length; ++i) {
                            const initialValue = editor.evaluateInputValue(product, initialName, !editor.ignoreDataOptionIndex ? dataOptionPosition : "", el.options[i].getAttribute('value'), el.getAttribute("data-option-value-id"));
                            if (initialName === formField || initialName === formFieldLabel) {
                                if (initialValue === value || initialValue === valueLabel) {
                                    if (!valueChanged && !el.options[i].selected) {
                                        valueChanged = true;
                                    }
                                    el.options[i].setAttribute('selected', true.toString());
                                    el.options[i].selected = true;
                                    el.setAttribute('value', value);
                                    el.value = initialValue === value ? value : valueLabel;
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
                inputs = document.querySelectorAll(`input[type="text"],input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="month"],input[type="number"],input[type="tel"],input[type="time"],input[type="url"],input[type="week"]`);
                if (inputs && inputs.length > 0) {
                    inputs.forEach((el) => {
                        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
                        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
                        const initialName = editor.evaluateInputName(product, el.getAttribute("name"), !editor.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
                        const initialValue = editor.evaluateInputValue(product, initialName, !editor.ignoreDataOptionIndex ? dataOptionPosition : "", el.value, el.getAttribute("data-option-value-id"));
                        let valueChanged = false;
                        if (initialName === formField) {
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
            },
            setProductProperty: (settings, formField, value, formFieldLabel, valueLabel, useFallback = false) => {
                if (!settings.basketItemOptions) {
                    settings.basketItemOptions = {};
                }
                const formFieldName = !useFallback ? formField : formFieldLabel;
                const formFieldValue = !useFallback ? value : valueLabel || value;
                if (typeof settings.basketItemOptions[formFieldName] !== "undefined") {
                    settings.basketItemOptions[formFieldName] = formFieldValue;
                }
                else {
                    if (!useFallback) {
                        editor.setProductProperty(settings, formField, value, formFieldLabel, valueLabel, true);
                    }
                    else {
                        settings.basketItemOptions[formField] = value;
                    }
                }
            },
            initProductPage: (initialTemplateName, product, variantMetaData) => {
                if (initialTemplateName === null) {
                    return;
                }
                const showOrHideCustomizeButton = function (variant = null, initialCall = undefined) {
                    const selectedVariant = variant !== null ? variant : editor.getVariantByProductOptions(editor.getCurrentProductOptionValues(product), product, true);
                    let templateNameToUse = initialTemplateName || "";
                    if (selectedVariant && selectedVariant.templateName) {
                        templateNameToUse = selectedVariant.templateName;
                    }
                    const printessButton = window.document.getElementById("printessCustomizeButton" + product.id);
                    const showPrintessButton = selectedVariant !== null && !(typeof selectedVariant.available !== "undefined" && selectedVariant.available === false) && templateNameToUse;
                    editor.showOrHideElement({ elementSelector: 'button[name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart' }, !showPrintessButton, "block");
                    editor.showOrHideElement({ elementSelector: 'button[type="button"].shopify-payment-button__button' }, !showPrintessButton, "block");
                    if (printessButton) {
                        printessButton.style.display = showPrintessButton ? "flex" : "none";
                        if (initialCall === true) {
                            window["printessEditor" + product.id] = editor;
                            // (printessButton as any).printessEditor = editor;
                        }
                    }
                };
                editor.addVariantChangeHandler(product, showOrHideCustomizeButton);
                showOrHideCustomizeButton(null, true);
            },
            showOrHideElement: (elementSelector, show, displayValue = "block", retryCount = 10) => {
                if (retryCount <= 0) {
                    return;
                }
                let element = typeof elementSelector.elementId !== "undefined" ? window.document.getElementById(elementSelector.elementId) : window.document.querySelectorAll(elementSelector.elementSelector);
                if (element && typeof element.length !== "undefined") {
                    if (element.length > 0) {
                        element = element[0];
                    }
                    else {
                        element = null;
                    }
                }
                if (element) {
                    if (!element.originalDisplayStyle) {
                        element.originalDisplayStyle = element.style.display || displayValue;
                    }
                    element.style.display = !show ? "none" : element.originalDisplayStyle;
                }
                else {
                    setTimeout(function () {
                        editor.showOrHideElement(elementSelector, show, displayValue, retryCount - 1);
                    }, 200);
                }
            },
            parseTableQuantityField: (fieldName) => {
                const ret = {
                    tableName: fieldName || "",
                    quantityColumn: ""
                };
                if (fieldName) {
                    const ptPos = fieldName.indexOf(".");
                    if (ptPos >= 0 && ptPos < fieldName.length) {
                        ret.tableName = fieldName.substring(0, ptPos);
                        if (ptPos < fieldName.length - 1) {
                            ret.quantityColumn = fieldName.substring(ptPos + 1);
                        }
                    }
                }
                return ret;
            },
            initTableQuantityVariants: (settings) => {
                if (settings.tableQuantityField) {
                    const names = editor.parseTableQuantityField(settings.tableQuantityField);
                    if (names.quantityColumn) {
                        const currentValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                        let quantity = currentValues["quantity"] ? parseInt(currentValues["quantity"]) || 1 : 1;
                        if (typeof settings.basketItemId !== "undefined" && settings.basketItemId) {
                            quantity = editor.readBasketItemQuantityInput(settings.basketItemId);
                        }
                        editor.tableQuantityVariants = {
                            "tableName": names.tableName,
                            "quantityColumnName": names.quantityColumn,
                            "variants": [{
                                    "quantity": quantity,
                                    "values": currentValues
                                }]
                        };
                    }
                }
            },
            show: (settings) => {
                const globalSettings = PrintessEditor.getGlobalShopSettings();
                if (globalSettings && typeof globalSettings.onValidateEditorOpen === "function") {
                    try {
                        if (!globalSettings.onValidateEditorOpen(settings)) {
                            return;
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                const shopContext = editor.createShopContext(settings);
                editor.lastSaveToken = "";
                editor.originalSaveToken = "";
                editor.initialSaveToken = settings.templateNameOrSaveToken && settings.templateNameOrSaveToken.indexOf("st:") === 0 ? settings.templateNameOrSaveToken : "";
                editor.initTableQuantityVariants(settings);
                if (settings.additionalLineItemProperties && settings.additionalLineItemProperties["originalSaveToken"]) {
                    editor.originalSaveToken = settings.additionalLineItemProperties["originalSaveToken"];
                }
                else if (editor.initialSaveToken) {
                    editor.originalSaveToken = editor.initialSaveToken;
                }
                if (typeof window["initPrintessEditor"] === "function") {
                    const editor = window["initPrintessEditor"](printessSettings);
                    editor.show(shopContext);
                }
                else if (typeof initPrintessEditor === "function") {
                    const editor = initPrintessEditor(printessSettings);
                    editor.show(shopContext);
                }
            },
            getAddToBasketForm(formSelector) {
                const forms = document.querySelectorAll(formSelector);
                const formsToConsider = [];
                for (let i = 0; i < forms.length; ++i) {
                    const idInput = forms[i].querySelector('input[name="id"],select[name="id"]');
                    if (idInput) {
                        formsToConsider.push(forms[i]);
                    }
                }
                if (formsToConsider.length === 1) {
                    return forms[0];
                }
                const button = document.querySelector(addToBasketButtonSelector);
                let ret;
                if (button) {
                    const form = formsToConsider.forEach((form) => {
                        if (!ret && form.contains(button)) {
                            ret = form;
                        }
                    });
                }
                return ret || forms[0];
            },
            handleTableQuantityVariants: (formField, value, formFieldLabel, valueLabel) => {
                if (editor.tableQuantityVariants.tableName === formField || editor.tableQuantityVariants.tableName === formFieldLabel) {
                    try {
                        const table = JSON.parse(value);
                        if (table && table.length > 0) {
                            editor.tableQuantityVariants.variants = [];
                            table.forEach((row) => {
                                const currentEntry = {
                                    quantity: 0,
                                    values: {}
                                };
                                for (const property in row) {
                                    if (row.hasOwnProperty(property)) {
                                        if (property === editor.tableQuantityVariants.quantityColumnName) {
                                            currentEntry.quantity = parseInt(row[property] || "0");
                                        }
                                        else {
                                            currentEntry.values[property] = row[property];
                                        }
                                    }
                                }
                                editor.tableQuantityVariants.variants.push(currentEntry);
                            });
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                    return true;
                }
                return false;
            },
            createShopContext: (settings) => {
                const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                const attachParams = settings.additionalAttachParams ? settings.additionalAttachParams : {};
                if (conf && conf.attachParams) {
                    for (const prop in conf.attachParams) {
                        if (conf.attachParams.hasOwnProperty(prop)) {
                            attachParams[prop] = conf.attachParams[prop];
                        }
                    }
                }
                const context = {
                    cameFromSave: false,
                    templateNameOrSaveToken: settings.templateNameOrSaveToken,
                    stickers: [],
                    legalText: settings.legalText || "",
                    legalTextUrl: settings.legalUrl || "",
                    snippetPrices: [],
                    chargeEachStickerUsage: false,
                    hidePricesInEditor: typeof printessSettings.hidePricesInEditor !== "undefined" && printessSettings.hidePricesInEditor === true,
                    showSplitterGridSizeButton: settings.showSplitterGridSizeButton,
                    additionalAttachParams: attachParams,
                    getProductName: () => {
                        if (typeof printessSettings.displayProductName !== "undefined" && printessSettings.displayProductName === false) {
                            return "";
                        }
                        return settings.product ? settings.product.name || "" : "";
                    },
                    getPriceInfo: () => {
                        return null;
                    },
                    getFormFieldMappings: () => {
                        let ret = {};
                        if (context.__ffMappings) {
                            return context.__ffMappings;
                        }
                        if (settings.optionValueMappings) {
                            try {
                                let mappings;
                                try {
                                    mappings = JSON.parse(settings.optionValueMappings);
                                }
                                catch (e) {
                                    //For some reason this is sometimes html encoded
                                    var txt = document.createElement("textarea");
                                    txt.innerHTML = settings.optionValueMappings;
                                    mappings = JSON.parse(txt.value);
                                }
                                if (mappings && typeof mappings !== "string" && typeof mappings !== "number" && !Array.isArray(mappings) && typeof mappings !== "boolean" && typeof mappings === "object") {
                                    ret = mappings;
                                    context.__ffMappings = ret;
                                }
                            }
                            catch {
                            }
                        }
                        return ret;
                    },
                    getMergeTemplates: () => {
                        if (settings.mergeTemplates) {
                            if (typeof settings.mergeTemplates === "string") {
                                return editor.parseMergeTemplates(settings.mergeTemplates);
                            }
                            else {
                                return settings.mergeTemplates;
                            }
                        }
                        return [];
                    },
                    formatMoney: (price) => {
                        const format = printessSettings.shopMoneyFormat ? printessSettings.shopMoneyFormat : "${{amount}}";
                        let ret = editor.formatMoney(price, format); //parseFloat("" + (price / 100)).toFixed(2);
                        if (settings.priceDisplayElementSelector) {
                            try {
                                const priceDisplay = document.querySelector(settings.priceDisplayElementSelector);
                                if (priceDisplay) {
                                    ret = priceDisplay.textContent;
                                }
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                        return ret;
                    },
                    onFormFieldChanged: (formField, value, formFieldLabel, valueLabel) => {
                        let formFieldChangedCallback = null;
                        if (PrintessEditor && PrintessEditor.getGlobalShopSettings) {
                            const settings = PrintessEditor.getGlobalShopSettings();
                            if (typeof settings.onFormFieldChanged === "function") {
                                formFieldChangedCallback = settings.onFormFieldChanged;
                            }
                        }
                        if (settings.tableQuantityField) {
                            if (editor.handleTableQuantityVariants(formField, value, formFieldLabel, valueLabel)) {
                                if (formFieldChangedCallback) {
                                    try {
                                        const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                                        const callbackParams = {
                                            selectedVariant: editor.getVariantByProductOptions(currentProductValues, settings.product, true),
                                            formFieldValues: currentProductValues,
                                            basketItemId: settings.basketItemId || null,
                                            product: settings.product
                                        };
                                        formFieldChangedCallback(formField, value, formFieldLabel, valueLabel, callbackParams);
                                    }
                                    catch (e) {
                                        console.error(e);
                                    }
                                }
                                //No page controls need to be updatet
                                return;
                            }
                        }
                        if (typeof settings.basketItemId !== "undefined") {
                            //We are in basket view
                            editor.setProductProperty(settings, formField, value, formFieldLabel, valueLabel);
                        }
                        else {
                            editor.setFormFieldValue(settings.product, formField, value, formFieldLabel, valueLabel);
                        }
                        if (formFieldChangedCallback) {
                            try {
                                const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                                const callbackParams = {
                                    selectedVariant: editor.getVariantByProductOptions(currentProductValues, settings.product, true),
                                    formFieldValues: currentProductValues,
                                    basketItemId: settings.basketItemId || null,
                                    product: settings.product
                                };
                                formFieldChangedCallback(formField, value, formFieldLabel, valueLabel, callbackParams);
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                    },
                    onAddToBasket: (saveToken, thumbnailUrl) => {
                        const isSave = typeof settings.basketItemId !== "undefined";
                        if (editor.originalSaveToken) {
                            if (!settings.additionalLineItemProperties) {
                                settings.additionalLineItemProperties = {};
                            }
                            settings.additionalLineItemProperties["originalSaveToken"] = editor.originalSaveToken;
                        }
                        const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                        const callbackParams = {
                            lastSaveToken: editor.lastSaveToken,
                            initialSaveToken: editor.initialSaveToken,
                            originalSaveToken: editor.originalSaveToken,
                            selectedVariant: editor.getVariantByProductOptions(currentProductValues, settings.product, true),
                            formFieldValues: currentProductValues,
                            basketItemId: settings.basketItemId || null,
                            product: settings.product
                        };
                        try {
                            if (typeof settings.onAddToBasket === "function") {
                                settings.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                        const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                        try {
                            if (conf && typeof conf.onAddToBasket === "function") {
                                conf.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                        if (!isSave) {
                            editor.addNewItemToBasket(settings, saveToken, thumbnailUrl);
                        }
                        else {
                            editor.replaceBasketItem(settings, saveToken, thumbnailUrl);
                        }
                        editor.lastSaveToken = saveToken;
                    },
                    getCurrentFormFieldValues: () => {
                        let ret;
                        if (typeof settings.basketItemId !== "undefined" && settings.basketItemId.length > 0) {
                            ret = {
                                "cartItem": "true",
                                ...settings.basketItemOptions,
                            };
                        }
                        else {
                            ret = {
                                "cartItem": "false",
                                ...editor.getCurrentProductOptionValues(settings.product)
                            };
                        }
                        if (settings.tableQuantityField && editor.tableQuantityVariants) {
                            const rows = [];
                            editor.tableQuantityVariants.variants.forEach((variant) => {
                                const value = { ...variant.values };
                                value[editor.tableQuantityVariants.quantityColumnName] = variant.quantity;
                                rows.push(value);
                            });
                            ret[editor.tableQuantityVariants.tableName] = JSON.stringify(rows);
                        }
                        return ret;
                    },
                    getPriceForFormFields: (formFields) => {
                        let callback = null;
                        if (PrintessEditor && PrintessEditor.getGlobalShopSettings) {
                            const settings = PrintessEditor.getGlobalShopSettings();
                            if (typeof settings.getPriceForFormFields === "function") {
                                callback = settings.getPriceForFormFields;
                            }
                        }
                        if (settings.tableQuantityField) {
                            let price = 0;
                            if (editor.tableQuantityVariants) {
                                editor.tableQuantityVariants.variants.forEach((tableVariant) => {
                                    const variantValues = {
                                        ...formFields,
                                        ...tableVariant.values
                                    };
                                    const variant = editor.getVariantByProductOptions(variantValues, settings.product, true);
                                    price += variant.price * tableVariant.quantity;
                                });
                            }
                            if (callback) {
                                try {
                                    const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                                    const callbackParams = {
                                        lastSaveToken: editor.lastSaveToken,
                                        initialSaveToken: editor.initialSaveToken,
                                        originalSaveToken: editor.originalSaveToken,
                                        selectedVariant: editor.getVariantByProductOptions(formFields, settings.product, true),
                                        formFieldValues: formFields,
                                        basketItemId: settings.basketItemId || null,
                                        product: settings.product
                                    };
                                    return callback(formFields, price, callbackParams);
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                            return price;
                        }
                        else {
                            const variantRelevantOptions = editor.getProductOptionValuesForVariants(formFields, settings.product);
                            const variant = editor.getVariantByProductOptions(formFields, settings.product, true);
                            const callbackParams = {
                                selectedVariant: variant,
                                formFieldValues: formFields,
                                basketItemId: settings.basketItemId || null,
                                product: settings.product
                            };
                            if (callback) {
                                try {
                                    return callback(formFields, variant.price, callbackParams);
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                            return variant.price;
                        }
                    },
                    getBasketId: () => {
                        return "Not yet implemented";
                    },
                    onRenderFirstPageImage: (thumbnailUrl) => {
                        if (context.cameFromSave && editor.onRenderFirstPageImageToken) {
                            try {
                                context.onSave(editor.onRenderFirstPageImageToken, thumbnailUrl, true);
                            }
                            catch (e) {
                                console.error(e);
                            }
                            context.cameFromSave = false;
                            editor.onRenderFirstPageImageToken = "";
                        }
                    },
                    onSave: (saveToken, thumbnailUrl, cameFromFirstpageImage = false) => {
                        context.cameFromSave = true;
                        if (!cameFromFirstpageImage) {
                            editor.onRenderFirstPageImageToken = saveToken;
                            editor.postMessage("renderFirstPageImage", null);
                        }
                        else {
                            const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                            const callbackParams = {
                                lastSaveToken: editor.lastSaveToken,
                                initialSaveToken: editor.initialSaveToken,
                                originalSaveToken: editor.originalSaveToken,
                                selectedVariant: editor.getVariantByProductOptions(currentProductValues, settings.product, true),
                                formFieldValues: currentProductValues,
                                basketItemId: settings.basketItemId || null,
                                product: settings.product
                            };
                            try {
                                if (typeof settings.onSave === "function") {
                                    settings.onSave(saveToken, thumbnailUrl, callbackParams);
                                }
                            }
                            catch (e) {
                                console.error(e);
                            }
                            const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                            try {
                                if (conf && typeof conf.onSave === "function") {
                                    conf.onSave(saveToken, thumbnailUrl, callbackParams);
                                }
                            }
                            catch (e) {
                                console.error(e);
                            }
                            editor.lastSaveToken = saveToken;
                        }
                    },
                    onLoad: (currentTemplateNameOrSaveToken, params) => {
                        const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                        const callbackParams = {
                            lastSaveToken: editor.lastSaveToken,
                            initialSaveToken: editor.initialSaveToken,
                            originalSaveToken: editor.originalSaveToken,
                            selectedVariant: editor.getVariantByProductOptions(currentProductValues, settings.product, true),
                            formFieldValues: currentProductValues,
                            basketItemId: settings.basketItemId || null,
                            product: settings.product
                        };
                        const conf = PrintessEditor && PrintessEditor.getGlobalShopSettings ? PrintessEditor.getGlobalShopSettings() : {};
                        try {
                            if (conf && typeof conf.onLoad === "function") {
                                conf.onLoad(currentTemplateNameOrSaveToken, callbackParams);
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    },
                    editorClosed: (closeButtonClicked) => {
                        if (closeButtonClicked) {
                            //Remove all printess inputs from the product form
                            editor.addOrRemoveTextField(editor.productFormSelector, "", [
                                "printessSaveTokenEdit" + settings.product.id,
                                "printessThumbnailEdit" + settings.product.id,
                                "printessProductDefinitionIdEdit" + settings.product.id,
                                "printessOutputTypeEdit" + settings.product.id,
                                "printessDpiEdit" + settings.product.id,
                                "printessOptionValueMappingsEdit" + settings.product.id,
                                "printessProductTypeEdit" + settings.product.id,
                                "printessThemeEdit" + settings.product.id,
                                "printessAdditionalPropertiesEdit" + settings.product.id
                            ], "");
                        }
                    }
                };
                if (!context.templateNameOrSaveToken) {
                    const currentVariant = editor.getVariantByProductOptions(context.getCurrentFormFieldValues(), settings.product, false);
                    if (currentVariant && currentVariant.templateName) {
                        context.templateNameOrSaveToken = currentVariant.templateName;
                    }
                }
                return context;
            },
            parseMergeTemplates: (valueString) => {
                let ret = null;
                if (!valueString) {
                    return ret;
                }
                try {
                    const json = JSON.parse(valueString);
                    if (typeof json === "string") {
                        ret = [{
                                "templateName": json,
                                "mergeMode": "layout-snippet-no-repeat"
                            }];
                    }
                    else {
                        if (!Array.isArray(json)) {
                            ret = [json];
                        }
                        else {
                            ret = json;
                        }
                    }
                }
                catch (e) {
                    ret = [{
                            "templateName": valueString,
                            "mergeMode": "layout-snippet-no-repeat"
                        }];
                }
                if (ret) {
                    ret.forEach((x) => {
                        if (!x.mergeMode) {
                            x.mergeMode = "layout-snippet-no-repeat";
                        }
                    });
                }
                return ret;
            },
            getProductByHandle: async function (productHandle) {
                if (editor.productCache[productHandle]) {
                    return editor.productCache[productHandle];
                }
                let ret = null;
                await fetch('/products/' + encodeURIComponent(productHandle) + '.js').then(function (response) {
                    return response.json();
                }).then(function (product) {
                    const result = {
                        optionDetails: [],
                        ...product,
                        name: product.title,
                        options: product.options ? product.options.map((x) => x.name) : []
                    };
                    editor.productCache[productHandle] = result;
                    ret = result;
                });
                return ret;
            },
            formatMoney: (cents, format) => {
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
                    const numberStr = (number / 100.0).toFixed(precision);
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
            },
            addOrRemoveTextField: (formSelector, textFieldName, textFieldId, value) => {
                value = typeof value != undefined && value !== null ? ("" + value) : "";
                if (Array.isArray(textFieldId)) {
                    textFieldId.forEach((id) => {
                        editor.addOrRemoveTextField(formSelector, textFieldName, id, value);
                    });
                }
                else {
                    let button = document.getElementById(textFieldId);
                    if (value) {
                        const form = typeof formSelector === "string" ? editor.getAddToBasketForm(formSelector) : formSelector;
                        if (!button && form) {
                            button = document.createElement("input");
                            button.setAttribute("id", textFieldId);
                            button.setAttribute("name", textFieldName);
                            button.setAttribute("type", "hidden");
                            button.style.display = "none";
                            form.appendChild(button);
                        }
                        if (button) {
                            button.setAttribute("value", value);
                        }
                    }
                    else {
                        if (button) {
                            button.remove();
                        }
                    }
                }
            },
            splitSaveToken: async (showParams, saveToken, quantityColumnName) => {
                let thumbnailWidth = 0;
                let thumbnailHeight = 0;
                let intValue = 0;
                if (showParams.additionalAttachParams) {
                    if (typeof showParams.additionalAttachParams.basketThumbnailMaxWidth !== "undefined" && showParams.additionalAttachParams.basketThumbnailMaxWidth) {
                        intValue = parseInt("" + showParams.additionalAttachParams.basketThumbnailMaxWidth);
                        if (!isNaN(intValue) && isFinite(intValue) && intValue > -1) {
                            thumbnailWidth = intValue;
                        }
                    }
                    if (typeof showParams.additionalAttachParams.basketThumbnailMaxHeight !== "undefined" && showParams.additionalAttachParams.basketThumbnailMaxHeight) {
                        intValue = parseInt("" + showParams.additionalAttachParams.basketThumbnailMaxHeight);
                        if (!isNaN(intValue) && isFinite(intValue) && intValue > -1) {
                            thumbnailHeight = intValue;
                        }
                    }
                }
                const response = await fetch('https://api.printess.com/shop/savetoken/split', {
                    method: 'POST',
                    redirect: "follow",
                    headers: {
                        "Content-Type": 'application/json',
                        "Authorization": `Bearer ${printessSettings.shopToken}`,
                    },
                    body: JSON.stringify({
                        saveToken: saveToken,
                        zeroCheckFieldName: quantityColumnName,
                        width: thumbnailWidth,
                        height: thumbnailHeight
                    })
                });
                if (!response.ok) {
                    console.error("Unable to split save token: [" + response.status + "] " + response.statusText);
                    return [];
                }
                return await response.json();
            },
            addTableQuantityItems(settings, saveToken, thumbnailUrl) {
                const currentProductValues = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                const additionalLineItemProperties = settings.additionalLineItemProperties ? { ...settings.additionalLineItemProperties } : {};
                if (settings.tableQuantityField && editor.tableQuantityVariants && editor.tableQuantityVariants.tableName) {
                    additionalLineItemProperties["tableQuantityField"] = settings.tableQuantityField;
                }
                editor.splitSaveToken(settings, saveToken, editor.tableQuantityVariants.quantityColumnName).then((values) => {
                    const basketItems = [];
                    values.forEach((value) => {
                        const currentVariantValues = {
                            ...currentProductValues,
                            ...value.dataRow,
                        };
                        const currentVariant = editor.getVariantByProductOptions(currentVariantValues, settings.product, true);
                        const basketItemProperties = {
                            ...editor.mapRecord(currentVariantValues, (key, value) => {
                                const namesToIgnore = ["quantity", "fix", "newsletter"];
                                const ret = {
                                    key: key,
                                    value: value
                                };
                                if ((key || "").startsWith("contact[") || namesToIgnore.includes((key || "").toLowerCase()) || editor.isProductOption(settings.product, key)) {
                                    return null;
                                }
                                return ret;
                            }),
                            _printessSaveToken: value.saveToken,
                            _printessThumbnail: value.previewUrl,
                            _printessProductDefinitionId: "" + settings.productDefinitionId,
                            _printessOutputType: "" + settings.outputFormat || "pdf",
                            _printessOptionValueMappings: settings.optionValueMappings,
                            _printessDpi: "" + settings.outputDpi || "300",
                            _printessAdditionalProperties: additionalLineItemProperties
                        };
                        let quantity = 1;
                        if (typeof value.dataRow[editor.tableQuantityVariants.quantityColumnName] !== "undefined" && value.dataRow[editor.tableQuantityVariants.quantityColumnName]) {
                            const intValue = parseInt(("" + value.dataRow[editor.tableQuantityVariants.quantityColumnName]) || "1");
                            if (!isNaN(intValue) && isFinite(intValue)) {
                                quantity = intValue;
                            }
                        }
                        if (quantity > 0) {
                            const valuesToWrite = {
                                id: currentVariant.id,
                                quantity: quantity,
                                properties: basketItemProperties
                            };
                            basketItems.push(valuesToWrite);
                        }
                    });
                    fetch('/cart/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            items: basketItems
                        }),
                    }).then(() => {
                        window.location.replace('/cart');
                    });
                });
            },
            addNewItemToBasket: (settings, saveToken, thumbnailUrl) => {
                if (settings && settings.legacyAddToBasket === true) {
                    const selectedOptions = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                    const variantRelatedOptions = editor.getProductOptionValuesForVariants(selectedOptions, settings.product);
                    const selectedVariant = editor.getVariantByProductOptions(variantRelatedOptions, settings.product, true);
                    let basketItemProperties = settings.basketItemOptions ? Object.assign({}, settings.basketItemOptions) : {};
                    basketItemProperties = Object.assign(Object.assign({}, basketItemProperties), { _printessSaveToken: saveToken, _printessThumbnail: thumbnailUrl, _printessProductDefinitionId: "" + settings.productDefinitionId, _printessOutputType: "" + settings.outputFormat || "pdf", _printessDpi: "" + settings.outputDpi || "300" });
                    const items = [
                        {
                            id: selectedVariant ? selectedVariant.id : (settings && settings.product && settings.product.variants && settings.product.variants.length > 0 ? settings.product.variants[0].id : settings.product.id),
                            quantity: typeof settings.quantity !== "undefined" && settings.quantity > 1 ? settings.quantity : 1,
                            properties: basketItemProperties
                        }
                    ];
                    fetch('/cart/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            items: items
                        }),
                    }).then(() => {
                        window.location.replace('/cart');
                    });
                    return;
                }
                if (settings.tableQuantityField && editor.tableQuantityVariants) {
                    editor.addTableQuantityItems(settings, saveToken, thumbnailUrl);
                    return;
                }
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessSaveToken]", "printessSaveTokenEdit" + settings.product.id, saveToken);
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessThumbnail]", "printessThumbnailEdit" + settings.product.id, thumbnailUrl);
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessProductDefinitionId]", "printessProductDefinitionIdEdit" + settings.product.id, settings.productDefinitionId);
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessOutputType]", "printessOutputTypeEdit" + settings.product.id, "" + settings.outputFormat || "pdf");
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessDpi]", "printessDpiEdit" + settings.product.id, "" + settings.outputDpi || "300");
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessOptionValueMappings]", "printessOptionValueMappingsEdit" + settings.product.id, "" + settings.optionValueMappings || "");
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessProductType]", "printessProductTypeEdit" + settings.product.id, settings.productType || "");
                editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessTheme]", "printessThemeEdit" + settings.product.id, printessSettings.theme || "");
                if (settings.additionalLineItemProperties) {
                    editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessAdditionalProperties]", "printessAdditionalPropertiesEdit" + settings.product.id, JSON.stringify(settings.additionalLineItemProperties) || "");
                }
                //in some cases the id field is not correctly set and we have to set it (only do it in case we are having variant related options)
                const selectedOptions = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                const writeBackVariant = editor.hasVariantRelatedOptions(settings.product, selectedOptions);
                if (writeBackVariant) {
                    const variantRelatedOptions = editor.getProductOptionValuesForVariants(selectedOptions, settings.product);
                    const selectedVariant = editor.getVariantByProductOptions(variantRelatedOptions, settings.product, true);
                    if (selectedVariant) {
                        const productForm = editor.getAddToBasketForm(editor.productFormSelector);
                        let idSelectList;
                        if (productForm) {
                            idSelectList = productForm.querySelectorAll("select[name='id']");
                        }
                        if (!idSelectList || idSelectList.length === 0) {
                            idSelectList = document.querySelectorAll("select[name='id']");
                        }
                        if (idSelectList && idSelectList.length > 0) {
                            const idSelect = idSelectList[0];
                            idSelect.value = selectedVariant.id.toString();
                            idSelect.setAttribute("value", selectedVariant.id.toString());
                            for (let i = 0; i < idSelect.options.length; ++i) {
                                idSelect.options[i].selected = idSelect.options[i].getAttribute("value") === selectedVariant.id.toString();
                            }
                        }
                        else {
                            let idInputs = null;
                            if (productForm && productForm.length > 0) {
                                idInputs = productForm.querySelectorAll("input[name='id']");
                            }
                            if (!idInputs || idInputs.length === 0) {
                                idInputs = document.querySelectorAll("input[name='id']");
                            }
                            if (idInputs && idInputs.length > 0) {
                                idInputs.forEach((idInput) => {
                                    idInput.setAttribute("value", selectedVariant.id.toString());
                                });
                            }
                        }
                    }
                }
                const addToBasketButton = document.querySelector(addToBasketButtonSelector);
                if (addToBasketButton) {
                    addToBasketButton.click();
                }
            },
            deleteBasketItem: async (settings) => {
                const cartItems = await fetch('/cart.js', {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                if (!cartItems.ok) {
                    console.error("Unable to load read cart items: [" + cartItems.status + "] " + cartItems.statusText);
                    return;
                }
                const json = await cartItems.json();
                const curr = json.items.find((item) => item.properties && item.properties._printessSaveToken ? item.properties && item.properties._printessSaveToken === settings.templateNameOrSaveToken : (item.id === (settings && settings.product && settings.product.variants && settings.product.variants.length > 0 ? settings.product.variants[0].id : settings.product.id)));
                if (curr) {
                    const { key } = curr;
                    //At first remove the item
                    const deleted = await fetch('/cart/change.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: key,
                            quantity: 0
                        }),
                    });
                    if (!deleted.ok) {
                        console.error("Unable to delete cart item with id " + settings.basketItemId + ": [" + deleted.status + "] " + deleted.statusText);
                    }
                }
                else {
                    console.error("Could not find basket item with id " + settings.basketItemId);
                }
            },
            replaceBasketItem: (settings, saveToken, thumbnailUrl) => {
                if (settings.tableQuantityField && editor.tableQuantityVariants) {
                    if (settings.keepOriginalBasketItem === true) {
                        editor.addTableQuantityItems(settings, saveToken, thumbnailUrl);
                    }
                    else {
                        editor.deleteBasketItem(settings).then(() => {
                            editor.addTableQuantityItems(settings, saveToken, thumbnailUrl);
                        });
                    }
                    return;
                }
                const variantRelatedOptions = editor.getProductOptionValuesForVariants(settings.basketItemOptions, settings.product);
                const selectedVariant = editor.getVariantByProductOptions(variantRelatedOptions, settings.product, true);
                fetch('/cart.js', {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }).then((result) => {
                    const namesToIgnore = ["fix", "newsletter"];
                    result.json().then((json) => {
                        const { items } = json;
                        const curr = items.find((item) => item.properties && item.properties._printessSaveToken ? item.properties && item.properties._printessSaveToken === settings.templateNameOrSaveToken : (item.id === (settings && settings.product && settings.product.variants && settings.product.variants.length > 0 ? settings.product.variants[0].id : settings.product.id)));
                        if (curr) {
                            const { key } = curr;
                            let basketItemProperties = { ...curr.properties };
                            if (settings.basketItemOptions) {
                                for (let property in settings.basketItemOptions) {
                                    if (!property.startsWith("contact[") && !namesToIgnore.includes(property) && curr.properties && curr.properties.hasOwnProperty(property) && settings.basketItemOptions.hasOwnProperty(property)) {
                                        basketItemProperties[property] = settings.basketItemOptions[property];
                                    }
                                }
                            }
                            basketItemProperties = {
                                ...basketItemProperties,
                                _printessSaveToken: saveToken,
                                _printessThumbnail: thumbnailUrl,
                                _printessProductDefinitionId: "" + settings.productDefinitionId,
                                _printessOutputType: "" + settings.outputFormat || "pdf",
                                _printessOptionValueMappings: settings.optionValueMappings,
                                _printessDpi: "" + settings.outputDpi || "300",
                                _printessAdditionalProperties: settings.additionalLineItemProperties ? JSON.stringify(settings.additionalLineItemProperties) : "{}"
                            };
                            const valuesToWrite = {
                                id: curr.id,
                                quantity: typeof settings.quantity !== "undefined" && settings.quantity > 1 ? settings.quantity : 1,
                                properties: basketItemProperties
                            };
                            if (editor.hasVariantRelatedOptions(settings.product, settings.basketItemOptions)) {
                                valuesToWrite.id = selectedVariant.id;
                            }
                            const price = selectedVariant.price;
                            const globalSettings = PrintessEditor.getGlobalShopSettings();
                            const callbackParams = {
                                lastSaveToken: editor.lastSaveToken,
                                initialSaveToken: editor.initialSaveToken,
                                originalSaveToken: editor.originalSaveToken,
                                selectedVariant: editor.getVariantByProductOptions(basketItemProperties, settings.product, true),
                                formFieldValues: basketItemProperties,
                                basketItemId: settings.basketItemId || null,
                                product: settings.product
                            };
                            if (typeof settings.onAddToBasket === "function") {
                                try {
                                    settings.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                            if (typeof globalSettings.onAddToBasket === "function") {
                                try {
                                    globalSettings.onAddToBasket(saveToken, thumbnailUrl, callbackParams);
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                            if (typeof globalSettings.getPriceForFormFields === "function") {
                                try {
                                    const newPrice = globalSettings.getPriceForFormFields(basketItemProperties, price, callbackParams);
                                    if (typeof newPrice === "number" && newPrice != price) {
                                        valuesToWrite[price] = newPrice;
                                    }
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                            const addToBasket = () => {
                                fetch('/cart/add', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        items: [valuesToWrite]
                                    })
                                }).then(() => {
                                    window.location.replace('/cart');
                                });
                            };
                            if (settings.keepOriginalBasketItem === true) {
                                addToBasket();
                            }
                            else {
                                //At first remove the item
                                fetch('/cart/change.js', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        id: key,
                                        quantity: 0
                                    }),
                                }).then((x) => {
                                    //Now add a new item with the new variant id
                                    addToBasket();
                                });
                            }
                        }
                    });
                });
            },
            readBasketItemQuantityInput: (basketItemId) => {
                const test = "".toString();
                const customizeButton = document.getElementById("printessCustomizeButton" + (basketItemId || "").toString().replace(":", "_"));
                if (!customizeButton) {
                    return null;
                }
                const parent = customizeButton.closest(".cart-item");
                if (!parent) {
                    return null;
                }
                const input = parent.querySelector("input.quantity__input");
                if (input) {
                    return parseInt(input.getAttribute("value"));
                }
                return null;
            }
        };
        window["printessShopifyEditor"] = editor;
    }
    return window["printessShopifyEditor"];
};