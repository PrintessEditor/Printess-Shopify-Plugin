class PrintessSharedTools {
    static async createSaveToken(shopToken, params) {
        const response = await fetch('https://api.printess.com/production/savetoken/create', {
            method: 'POST',
            redirect: "follow",
            headers: {
                "Content-Type": 'application/json',
                "Authorization": `Bearer ${shopToken}`,
            },
            body: JSON.stringify(params)
        });
        if (!response.ok) {
            console.error("Unable to create save token: [" + response.status + "] " + response.statusText);
            return null;
        }
        return (await response.json());
    }
    static decodeHTML(encoded) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = encoded;
        return textarea.value;
    }
    static parseMergeTemplate(template, globalMergeModeOverwrite) {
        let ret = [];
        if (template) {
            if (Array.isArray(template)) {
                template.forEach((x) => {
                    ret = [
                        ...ret,
                        ...PrintessSharedTools.parseMergeTemplate(x)
                    ];
                });
            }
            else {
                if (typeof template !== "string") {
                    ret.push(template);
                }
                else {
                    try {
                        let deserialized = JSON.parse(template);
                        ret = [
                            ...ret,
                            ...PrintessSharedTools.parseMergeTemplate(deserialized)
                        ];
                    }
                    catch {
                        try {
                            let deserialized = JSON.parse(PrintessSharedTools.decodeHTML(template));
                            ret = [
                                ...ret,
                                ...PrintessSharedTools.parseMergeTemplate(deserialized)
                            ];
                        }
                        catch {
                            ret.push({
                                templateName: template
                            });
                        }
                    }
                }
            }
        }
        if (globalMergeModeOverwrite) {
            ret.forEach((mergeTemplate) => {
                mergeTemplate.mergeMode = globalMergeModeOverwrite;
            });
        }
        return ret;
    }
    static sleepAsync(timeoutMs) {
        return new Promise((resolve) => setTimeout(resolve, timeoutMs));
    }
    static queryItem(itemQuery, callback, failedCallback = null, timeout = 200, maxRetires = 20, retries = 0) {
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
                PrintessSharedTools.queryItem(itemQuery, callback, failedCallback, timeout, maxRetires, retries + 1);
            }
        }, timeout);
    }
    static async queryItemAsync(itemQuery, timeout = 50, maxRetires = 20) {
        return new Promise((resolve, reject) => PrintessSharedTools.queryItem(itemQuery, resolve, reject, timeout, maxRetires));
    }
    static forEach(items, callback) {
        if (!items || typeof callback !== "function") {
            return;
        }
        if (Array.isArray(items)) {
            items.forEach(callback);
        }
        else {
            let index = 0;
            for (const prop in items) {
                if (items.hasOwnProperty(prop)) {
                    callback(items[prop], index, items, prop);
                    ++index;
                }
            }
        }
    }
    static map(items, callback) {
        if (!items || typeof callback !== "function") {
            return [];
        }
        if (Array.isArray(items)) {
            return items.map(callback);
        }
        else {
            const ret = [];
            let index = 0;
            for (const prop in items) {
                if (items.hasOwnProperty(prop)) {
                    ret.push(callback(items[prop], index, items, prop));
                    ++index;
                }
            }
            return ret;
        }
    }
    static filter(items, callback) {
        const ret = {};
        PrintessSharedTools.forEach(items, (value, index, arr, key) => {
            if (callback(value, items, key, index) === true) {
                ret[key] = value;
            }
        });
        return ret;
    }
    static filterAsArray(items, callback) {
        const ret = [];
        PrintessSharedTools.forEach(items, (value, index, arr, key) => {
            if (callback(value, items, key, index) === true) {
                ret.push({
                    key: key,
                    value: value
                });
            }
        });
        return ret;
    }
    static ensureHttpProtocol(domain) {
        let ret = ((typeof domain !== "string" ? domain.apiDomain : domain) || "").trim();
        if (ret.indexOf("http://") !== 0 && ret.indexOf("https://")) {
            if (ret.length > 1 && ret[0] === "/" && ret[1] === "/") {
                ret = ret.substring(2);
            }
            else if (ret.length > 0 && ret[0] === "/") {
                ret = ret.substring(1);
            }
            ret = "https://" + ret;
        }
        return ret;
    }
    static urlConcat(url, ...parts) {
        let ret = url || "";
        const filteredParts = (parts || []).filter(x => x ? true : false);
        filteredParts.forEach((part) => {
            if (part.length > 1) {
                if (ret && ret[ret.length - 1] !== "/") {
                    ret += "/";
                }
                ret += part[0] !== "/" ? part : part.substring(1);
            }
            else if (part[0] !== "/") {
                if (ret && ret[ret.length - 1] !== "/") {
                    ret += "/";
                }
                ret += part;
            }
        });
        return ret;
    }
    static sanitizeHost(host) {
        if (host) {
            host = host.trim();
            if (host.endsWith("/")) {
                return host;
            }
            return host + "/";
        }
        return host || "";
    }
    static async postJsonAsync(url, params, token, additionalHeaders) {
        const headers = {
            "Content-Type": 'application/json'
        };
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        if (additionalHeaders) {
            PrintessSharedTools.forEach(additionalHeaders, (value, index, headers, key) => {
                if (key && value) {
                    headers[key] = value;
                }
            });
        }
        const response = await fetch('https://api.printess.com/shop/savetoken/split', {
            method: 'POST',
            redirect: "follow",
            headers: headers,
            body: JSON.stringify(params)
        });
        if (!response.ok) {
            throw `Unable to post json to ${url}: [${response.status}]: ${response.statusText}`;
        }
        return await response.json();
    }
    loadTagsAsync(settings) {
        return PrintessSharedTools.postJsonAsync(PrintessSharedTools.urlConcat(PrintessSharedTools.ensureHttpProtocol(settings), "snippets/tags/load"), { includeGlobal: settings.includeGlobalTags === true }, settings.serviceToken);
    }
    static generateUUID() {
        var d = new Date().getTime(); //Timestamp
        var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16; //random number between 0 and 16
            if (d > 0) { //Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            }
            else { //Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
    static getFileNameFromUrl(fileName) {
        return (fileName || "").split('#')[0].split('?')[0].split('/').pop();
    }
    static async downloadImages(images) {
        const ret = [];
        if (Array.isArray(images)) {
            for (let i = 0; i < images.length; ++i) {
                const response = await fetch(images[i].value);
                if (response.ok) {
                    const blob = await response.blob();
                    ret.push({
                        name: images[i].name,
                        data: new File([blob], this.getFileNameFromUrl(images[i].value), { type: blob.type })
                    });
                }
                else {
                    console.error("Unable to download image " + images[i].value + "; [" + response.status.toString() + "] " + response.statusText + ": " + await response.text());
                }
            }
        }
        else {
            for (const fileName in images) {
                if (images.hasOwnProperty(fileName)) {
                    const fileUrl = images[fileName];
                    const response = await fetch(fileUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        ret.push({
                            name: fileName,
                            data: new File([blob], this.getFileNameFromUrl(fileUrl), { type: blob.type })
                        });
                    }
                    else {
                        console.error("Unable to download image " + images[fileName] + "; [" + response.status.toString() + "] " + response.statusText + ": " + await response.text());
                    }
                }
            }
        }
        return ret;
    }
}
class PrintessEditor {
    constructor(settings) {
        this.lastSaveDate = new Date();
        this.calculateCurrentPrices = async (priceInfo) => {
            const r = await this.getPriceCategories();
            let basePrice = r.basePrice;
            if (priceInfo.snippetPriceCategories) {
                priceInfo.snippetPriceCategories.forEach((x) => {
                    if (x && x.amount > 0 && PrintessEditor.currentContext.snippetPrices[x.priceCategory - 1]) {
                        basePrice += PrintessEditor.currentContext.snippetPrices[x.priceCategory - 1].priceInCent; // * x.amount;
                    }
                });
            }
            r.price = PrintessEditor.currentContext.formatMoney(basePrice);
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
    save(callbacks) {
        let printessComponent = document.querySelector("printess-component") || null;
        if (printessComponent) {
            if (printessComponent && printessComponent.editor) {
                printessComponent.editor.api.saveAndGenerateBasketThumbnailUrl().then((result) => {
                    callbacks.onSaveAsync(result.saveToken, result.basketUrl).then(() => {
                    });
                });
            }
        }
        else {
            let iFrame = document.getElementById("printess");
            if (iFrame) {
                iFrame.contentWindow?.postMessage({ cmd: "saveAndGenerateBasketThumbnailUrl", parameters: [] }, "*");
            }
        }
    }
    static applyFormFieldMappings(formFields, mappings) {
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
    async initializeIFrame(callbacks, settings) {
        const that = this;
        let iFrame = document.getElementById("printess");
        const closeTabListener = (evt) => {
            if (callbacks && typeof callbacks.onCloseTab === "function") {
                callbacks.onCloseTab(evt);
            }
        };
        const eventListener = async (evt) => {
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
                    const addToBasket = (saveToken, thumbnailUrl) => {
                        window.removeEventListener('message', eventListener);
                        window.removeEventListener('beforeunload', closeTabListener);
                        window.removeEventListener('unload', closeTabListener);
                        iFrame.setAttribute("printessHasListener", "false");
                        if (callbacks && typeof callbacks.onAddToBasketAsync === "function") {
                            callbacks.onAddToBasketAsync(evt.data.token, evt.data.thumbnailUrl).then(() => { });
                        }
                    };
                    try {
                        if (typeof PrintessEditor.currentContext.onAllowAddToBasket === "function") {
                            const result = PrintessEditor.currentContext.onAllowAddToBasket(evt.data.token, evt.data.thumbnailUrl);
                            if (typeof result !== "boolean" || result === true) {
                                addToBasket(evt.data.token, evt.data.thumbnailUrl);
                            }
                        }
                        else if (typeof PrintessEditor.currentContext.onAllowAddToBasketAsync === "function") {
                            PrintessEditor.currentContext.onAllowAddToBasketAsync(evt.data.token, evt.data.thumbnailUrl).then((result) => {
                                if (typeof result !== "boolean" || result === true) {
                                    addToBasket(evt.data.token, evt.data.thumbnailUrl);
                                }
                            });
                        }
                        else {
                            addToBasket(evt.data.token, evt.data.thumbnailUrl);
                        }
                    }
                    catch (ex) {
                        console.error(ex);
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
                case "getFormField": {
                    if (callbacks && typeof callbacks.onGetFormField === "function") {
                        callbacks.onGetFormField(evt.data.result);
                    }
                    break;
                }
                case 'save': {
                    if (callbacks && typeof callbacks.onSaveAsync === "function") {
                        callbacks.onSaveAsync(evt.data.token, evt.data.thumbnailUrl);
                    }
                    break;
                }
                case "saveAndGenerateBasketThumbnailUrl": {
                    if (callbacks && typeof callbacks.onSaveAsync === "function") {
                        callbacks.onSaveAsync(evt.data.result.saveToken, evt.data.result.basketUrl);
                    }
                    break;
                }
                case 'loaded': {
                    if (that.Settings.autoImportImageUrlsInFormFields === true) {
                        try {
                            const images = await that.downloadImages(that.getImagesInFormFields(PrintessEditor.applyFormFieldMappings(PrintessEditor.currentContext.getCurrentFormFieldValues(), PrintessEditor.currentContext.getFormFieldMappings())));
                            if (!that.tempUploadImages) {
                                that.tempUploadImages = images;
                            }
                            else {
                                that.tempUploadImages = [
                                    ...that.tempUploadImages,
                                    ...images
                                ];
                            }
                            if (images.length > 0) {
                                that.uploadImageToClassicEditor(iFrame, images[0].data, images[0].name);
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    if (that.Settings.autoImportUserImages === true) {
                        let userId = await PrintessEditor.getUserId();
                        let basketId = await PrintessEditor.getOrGenerateBasketId();
                        if (userId || basketId) {
                            that.uploadUserImagesToClassicEditor(iFrame, basketId, userId);
                        }
                    }
                    if (callbacks && typeof callbacks.onLoadAsync === "function") {
                        callbacks.onLoadAsync(PrintessEditor.currentContext.templateNameOrSaveToken);
                    }
                    break;
                }
                case "uploadImage": {
                    if (this.tempUploadImages && evt.data.result) {
                        const images = this.tempUploadImages;
                        if (images && images.length > 0) {
                            const currentImage = images[0];
                            const imageName = evt.data.result.name;
                            images.shift();
                            iFrame.contentWindow?.postMessage({ cmd: "setFormFieldValue", parameters: [currentImage.name, imageName] }, "*");
                            if (images.length > 0) {
                                this.uploadImageToClassicEditor(iFrame, images[0].data, images[0].name);
                            }
                        }
                    }
                    break;
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
    getFileNameFromUrl(fileName) {
        return (fileName || "").split('#')[0].split('?')[0].split('/').pop();
    }
    getImagesInFormFields(formFields) {
        const ret = [];
        const supportedExtensions = ["png", "jpg", "gif", "webp", "svg", "heic"];
        formFields.forEach((ff) => {
            if (ff.value) {
                const lowerValue = ff.value.toLowerCase();
                if (lowerValue.startsWith("http://") || lowerValue.startsWith("https://")) {
                    const fileName = this.getFileNameFromUrl(lowerValue);
                    const fileParts = fileName.split(".");
                    if (fileParts.length > 0 && supportedExtensions.includes(fileParts[1])) {
                        ret.push(ff);
                    }
                }
            }
        });
        return ret;
    }
    async getPriceCategories(formFieldValues = null) {
        let price = 0;
        if (!formFieldValues) {
            formFieldValues = PrintessEditor.currentContext.getCurrentFormFieldValues();
        }
        if (typeof PrintessEditor.currentContext.getPriceForFormFieldsAsync === "function") {
            price = await PrintessEditor.currentContext.getPriceForFormFieldsAsync(formFieldValues);
        }
        else if (typeof PrintessEditor.currentContext.getPriceForFormFields === "function") {
            price = PrintessEditor.currentContext.getPriceForFormFields(formFieldValues);
        }
        const r = {
            snippetPrices: PrintessEditor.currentContext.snippetPrices.map((x) => x ? x.label : null),
            priceCategories: {},
            price: PrintessEditor.currentContext.formatMoney(price),
            basePrice: price,
            productName: PrintessEditor.currentContext.getProductName(),
            legalNotice: PrintessEditor.currentContext.legalText,
            infoUrl: PrintessEditor.currentContext.legalTextUrl
        };
        return r;
    }
    ;
    usePanelUi() {
        const loweruiVersion = this.Settings.uiSettings && this.Settings.uiSettings.uiVersion ? this.Settings.uiSettings.uiVersion.toLowerCase().trim() : "";
        return loweruiVersion === "bcui" || loweruiVersion === "panelui";
    }
    async onPriceChanged(priceChangedInfo) {
        try {
            let priceInfo = null;
            try {
                if (typeof priceChangedInfo.pageCount !== "undefined") {
                    if (PrintessEditor.currentContext.currentPageCount !== priceChangedInfo.pageCount) {
                        PrintessEditor.currentContext.currentPageCount = priceChangedInfo.pageCount;
                        if (PrintessEditor.currentContext.additionalAttachParams && typeof PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"] !== "undefined") {
                            if (typeof PrintessEditor.currentContext.onFormFieldChanged === "function") {
                                try {
                                    PrintessEditor.currentContext.onFormFieldChanged(PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"], PrintessEditor.currentContext.currentPageCount.toString(), "", "");
                                }
                                catch (ex) {
                                    console.error(ex);
                                }
                            }
                            if (typeof PrintessEditor.currentContext.onFormFieldChangedAsync === "function") {
                                try {
                                    await PrintessEditor.currentContext.onFormFieldChangedAsync(PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"], PrintessEditor.currentContext.currentPageCount.toString(), "", "");
                                }
                                catch (ex) {
                                    console.error(ex);
                                }
                            }
                        }
                    }
                }
                if (priceChangedInfo.snippetPriceCategories && priceChangedInfo.snippetPriceCategories.length > 0) {
                    PrintessEditor.currentContext.stickers = priceChangedInfo.snippetPriceCategories.filter((x) => PrintessEditor.currentContext.snippetPrices && PrintessEditor.currentContext.snippetPrices.length >= x.priceCategory).map((x) => {
                        return {
                            productVariantId: PrintessEditor.currentContext.snippetPrices[x.priceCategory - 1].variantId,
                            quantity: x.amount
                        };
                    });
                }
                else {
                    PrintessEditor.currentContext.stickers = [];
                }
                if (typeof priceChangedInfo.printedRecordsCount !== "undefined" && priceChangedInfo.printedRecordsCount > 0 && typeof PrintessEditor.currentContext.propertyChanged === "function" && priceChangedInfo.hasCirculationColumn === true) {
                    PrintessEditor.currentContext.propertyChanged("circulationRecordCount", priceChangedInfo.printedRecordsCount.toString());
                }
                priceInfo = await this.calculateCurrentPrices(priceChangedInfo);
            }
            catch (e) {
                console.error(e);
            }
            if (!PrintessEditor.currentContext.hidePricesInEditor) {
                const iframe = document.getElementById("printess");
                if (iframe) {
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
        }
        catch (e) {
        }
    }
    ;
    hideBcUiVersion(closeButtonClicked) {
        if (!PrintessEditor.visible) {
            return;
        }
        try {
            const editor = this.getPrintessComponent();
            if (editor && editor.editor) {
                editor.editor.ui.hide();
            }
            if (typeof PrintessEditor.currentContext.editorClosed === "function") {
                PrintessEditor.currentContext.editorClosed(closeButtonClicked === true);
            }
            //Hide the web page scrolling
            document.body.classList.remove('hideAll');
        }
        finally {
            PrintessEditor.visible = false;
        }
    }
    async downloadImages(images) {
        const ret = [];
        for (let i = 0; i < images.length; ++i) {
            const response = await fetch(images[i].value);
            if (response.ok) {
                const blob = await response.blob();
                ret.push({
                    name: images[0].name,
                    data: new File([blob], this.getFileNameFromUrl(images[i].value), { type: blob.type })
                });
            }
            else {
                console.error("Unable to download image " + images[i].value + "; [" + response.status.toString() + "] " + response.statusText + ": " + await response.text());
            }
        }
        return ret;
    }
    async uploadImagesToBcUiEditor(files, editor) {
        if (files) {
            for (let i = 0; i < files.length; ++i) {
                const result = await editor.api.uploadImage(files[i].data, null, false);
                if (result) {
                    await editor.api.setFormFieldValue(files[i].name, result.name);
                }
            }
        }
    }
    async uploadUserImagesToBcUiEditor(editor, basketId = null, userId = null) {
        if (userId || basketId) {
            const result = await editor.api.importImages(userId || "", basketId);
        }
    }
    uploadImageToClassicEditor(iframe, file, formFieldName) {
        if (file) {
            iframe.contentWindow?.postMessage({ cmd: "uploadImage", parameters: [file, null, false, "ff_" + formFieldName] }, "*");
        }
    }
    uploadUserImagesToClassicEditor(iframe, basketId = null, userId = null) {
        if (basketId || userId) {
            iframe.contentWindow?.postMessage({ cmd: "importImages", parameters: [userId || "", basketId] }, "*");
        }
    }
    static generateUUID() {
        var d = new Date().getTime(); //Timestamp
        var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16; //random number between 0 and 16
            if (d > 0) { //Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            }
            else { //Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
    static async getOrGenerateBasketId() {
        let ret = null;
        if (PrintessEditor.currentContext) {
            ret = typeof PrintessEditor.currentContext.getBasketId === "function" ? PrintessEditor.currentContext.getBasketId() : "";
            if (!ret && typeof PrintessEditor.currentContext.getBasketIdAsync === "function") {
                ret = await PrintessEditor.currentContext.getBasketIdAsync() || null;
            }
        }
        if (!ret) {
            try {
                ret = localStorage.getItem("printessUniqueBasketId");
            }
            catch (e) {
                console.warn("Unable to read user id from local storage.");
            }
        }
        if (!ret) {
            ret = window["printessUniqueBasketId"];
        }
        if (!ret) {
            ret = PrintessEditor.generateUUID() + "_" + new Date().valueOf().toString();
            try {
                localStorage.setItem("printessUniqueBasketId", ret);
            }
            catch (e) {
                window["printessUniqueBasketId"] = ret;
                console.warn("Unable to write user id to local storage.");
            }
        }
        return ret || null;
    }
    static async getUserId() {
        let ret = null;
        if (PrintessEditor.currentContext) {
            ret = typeof PrintessEditor.currentContext.getUserId === "function" ? PrintessEditor.currentContext.getUserId() : null;
            if (!ret && typeof PrintessEditor.currentContext.getUserIdAsync === "function") {
                ret = await PrintessEditor.currentContext.getUserIdAsync();
            }
        }
        return ret;
    }
    async getFormFieldValue(formFieldName) {
        if (this.usePanelUi()) {
            const editor = this.getPrintessComponent();
            if (editor && editor.editor) {
                const formFieldValue = await editor.editor.api.getFormField(formFieldName);
                if (formFieldValue) {
                }
            }
        }
        else {
            document.getElementById("printess")?.contentWindow?.postMessage({ cmd: "getFormField", parameters: [formFieldName] }, "*");
        }
    }
    static closeAllHtmlDialogs() {
        document.querySelectorAll(":not(.printess-owned) dialog,dialog:not(.printess-owned)").forEach((x) => {
            if (x && !x.classList.contains("printess-owned") && typeof x.close === "function") {
                try {
                    x.close();
                }
                catch (ex) {
                    console.error(ex);
                }
            }
        });
    }
    async showBcUiVersion(callbacks) {
        const that = this;
        const priceInfo = PrintessEditor.currentContext.getPriceInfo();
        let isSaveToken = PrintessEditor.currentContext.templateNameOrSaveToken && PrintessEditor.currentContext.templateNameOrSaveToken.indexOf("st:") === 0;
        let pageCount = null;
        let useCustomLoader = false;
        let formFields = null;
        let mergeTemplates = null;
        PrintessEditor.closeAllHtmlDialogs();
        if (!isSaveToken) {
            formFields = PrintessEditor.applyFormFieldMappings(PrintessEditor.currentContext.getCurrentFormFieldValues(), PrintessEditor.currentContext.getFormFieldMappings());
            mergeTemplates = PrintessEditor.currentContext.getMergeTemplates();
            if (PrintessEditor.currentContext.additionalAttachParams && typeof PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"] !== "undefined") {
                const pageFormField = formFields.filter(x => x.name === PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"]);
                if (pageFormField && pageFormField.length > 0) {
                    let intValue = PrintessEditor.extractNumber(pageFormField[0].value);
                    if (!isNaN(intValue) && isFinite(intValue)) {
                        pageCount = intValue;
                    }
                }
            }
        }
        const globalSettings = PrintessEditor.getGlobalShopSettings();
        if (globalSettings && globalSettings.customLoader && typeof globalSettings.customLoader.onShowLoader === "function") {
            try {
                globalSettings.customLoader.onShowLoader();
                useCustomLoader = true;
            }
            catch (e) {
                console.error(e);
            }
        }
        const startupParams = {};
        const loaderUrl = that.getLoaderUrl(this.Settings.editorUrl, this.Settings.editorVersion, startupParams);
        const printessLoader = await import(/* webpackIgnore: true */ loaderUrl);
        let printessComponent = that.getPrintessComponent();
        const closeTabListener = (evt) => {
            if (callbacks && typeof callbacks.onCloseTab === "function") {
                callbacks.onCloseTab(evt);
            }
        };
        if (this.Settings.showAlertOnTabClose === true) {
            window.addEventListener('beforeunload', closeTabListener);
            window.addEventListener('unload', closeTabListener);
        }
        if (printessComponent && printessComponent.editor) {
            printessComponent.style.display = "block";
            await printessComponent.editor.api.loadTemplateAndFormFields(PrintessEditor.currentContext.templateNameOrSaveToken, mergeTemplates, formFields, null, null, true);
            if (!isSaveToken && pageCount !== null && pageCount > 0) {
                await printessComponent.editor.api.setBookInsidePages(pageCount);
            }
            setTimeout(async function () {
                if (PrintessEditor.currentContext.hidePricesInEditor !== true) {
                    that.calculateCurrentPrices({}).then((priceChangedInfo) => {
                        printessComponent.editor.ui.refreshPriceDisplay(priceChangedInfo);
                    });
                }
                if (that.Settings.autoImportImageUrlsInFormFields === true) {
                    try {
                        const images = await that.downloadImages(that.getImagesInFormFields(PrintessEditor.applyFormFieldMappings(PrintessEditor.currentContext.getCurrentFormFieldValues(), PrintessEditor.currentContext.getFormFieldMappings())));
                        await that.uploadImagesToBcUiEditor(images, printessComponent.editor);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                if (that.Settings.autoImportUserImages === true) {
                    try {
                        let userId = await PrintessEditor.getUserId();
                        let basketId = await PrintessEditor.getOrGenerateBasketId();
                        if (userId || basketId) {
                            await that.uploadUserImagesToBcUiEditor(printessComponent.editor, basketId, userId);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                await callbacks.onLoadAsync(PrintessEditor.currentContext.templateNameOrSaveToken);
                if (globalSettings && globalSettings.customLoader && typeof globalSettings.customLoader.onHideLoader === "function") {
                    try {
                        globalSettings.customLoader.onHideLoader();
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }, 1000);
            printessComponent.editor.ui.show();
        }
        else {
            let theme = that.Settings.uiSettings ? (that.Settings.uiSettings.theme || "") : "";
            if (typeof theme !== "string" && theme.error) {
                theme = theme.error;
            }
            if (!theme || theme.indexOf("json not allowed") === 0) {
                theme = "DEFAULT";
            }
            const attachParams = {
                suppressLoadingAnimation: useCustomLoader,
                domain: that.Settings.apiDomain,
                mergeTemplates: mergeTemplates,
                formFields: formFields,
                token: that.Settings.shopToken,
                templateName: PrintessEditor.currentContext.templateNameOrSaveToken, // "Premier Test-3",// "test Trigger Dialog",  // "price-tester", // "Premier Test", //  "Children's book", // "Label FF Test", //"test Trigger Dialog",   "test Trigger Dialog", // "Bathrobe Man", //
                //templateVersion: "publish",//"draft"
                translationKey: "auto", //"en"
                basketId: await PrintessEditor.getOrGenerateBasketId(),
                shopUserId: await PrintessEditor.getUserId(),
                // mobileMargin: {left: 20, right: 40, top: 30, bottom: 40},
                // allowZoomAndPan: false,
                snippetPriceCategoryLabels: priceInfo && priceInfo.snippetPrices ? priceInfo.snippetPrices : null,
                theme: theme,
                skipExchangeStateApplication: true,
                addToBasketCallback: (token, thumbnailUrl) => {
                    const addToBasket = (saveToken, thumbnailUrl) => {
                        window.removeEventListener('beforeunload', closeTabListener);
                        window.removeEventListener('unload', closeTabListener);
                        if (callbacks && typeof callbacks.onAddToBasketAsync === "function") {
                            callbacks.onAddToBasketAsync(token, thumbnailUrl).then(() => { });
                        }
                    };
                    if (typeof PrintessEditor.currentContext.onAllowAddToBasket === "function") {
                        const result = PrintessEditor.currentContext.onAllowAddToBasket(token, thumbnailUrl);
                        if (typeof result !== "boolean" || result === true) {
                            addToBasket(token, thumbnailUrl);
                        }
                    }
                    else if (typeof PrintessEditor.currentContext.onAllowAddToBasketAsync === "function") {
                        PrintessEditor.currentContext.onAllowAddToBasketAsync(token, thumbnailUrl).then((result) => {
                            if (typeof result !== "boolean" || result === true) {
                                addToBasket(token, thumbnailUrl);
                            }
                        });
                    }
                    else {
                        addToBasket(token, thumbnailUrl);
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
                    window.removeEventListener('beforeunload', closeTabListener);
                    window.removeEventListener('unload', closeTabListener);
                    that.hideBcUiVersion(true);
                },
                saveTemplateCallback: (saveToken, type, thumbnailUrl) => {
                    if (typeof callbacks.onSaveAsync === "function") {
                        callbacks.onSaveAsync(saveToken, thumbnailUrl);
                    }
                    if (type && type === "close") {
                        that.hideBcUiVersion(true);
                    }
                },
                loadingDoneCallback: () => {
                    if (globalSettings && globalSettings.customLoader && typeof globalSettings.customLoader.onHideLoader === "function") {
                        try {
                            globalSettings.customLoader.onHideLoader();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
            };
            if (typeof PrintessEditor.currentContext.showSplitterGridSizeButton !== "undefined" && PrintessEditor.currentContext.showSplitterGridSizeButton !== null) {
                attachParams["showSplitterGridSizeButton"] = PrintessEditor.currentContext.showSplitterGridSizeButton === true || PrintessEditor.currentContext.showSplitterGridSizeButton === "true";
            }
            if (!isSaveToken && pageCount !== null && pageCount >= 1) {
                attachParams["bookInsidePages"] = pageCount;
            }
            const globalSettings = PrintessEditor.getGlobalShopSettings();
            if (typeof globalSettings.getFormFieldProperties === "function") {
                attachParams.formFieldProperties = globalSettings.getFormFieldProperties();
            }
            const printess = await printessLoader.load(attachParams);
            printessComponent = that.getPrintessComponent();
            printessComponent.editor = printess;
            setTimeout(async function () {
                const printessComponent = that.getPrintessComponent();
                if (!printessComponent) {
                    return;
                }
                if (PrintessEditor.currentContext.hidePricesInEditor !== true) {
                    const priceChangedInfo = await that.calculateCurrentPrices({});
                    printessComponent.editor.ui.refreshPriceDisplay(priceChangedInfo);
                }
                if (that.Settings.autoImportImageUrlsInFormFields === true) {
                    try {
                        const images = await that.downloadImages(that.getImagesInFormFields(PrintessEditor.applyFormFieldMappings(PrintessEditor.currentContext.getCurrentFormFieldValues(), PrintessEditor.currentContext.getFormFieldMappings())));
                        await that.uploadImagesToBcUiEditor(images, printessComponent.editor);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                if (that.Settings.autoImportUserImages === true) {
                    try {
                        let userId = await PrintessEditor.getUserId();
                        let basketId = await PrintessEditor.getOrGenerateBasketId();
                        if (userId || basketId) {
                            await that.uploadUserImagesToBcUiEditor(printessComponent.editor, basketId, userId);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                await callbacks.onLoadAsync(attachParams.templateName);
            }, 1000);
        }
    }
    static extractNumber(inputStr) {
        let c = "0123456789";
        function check(x) {
            return c.includes(x) ? true : false;
        }
        return parseInt([...inputStr].reduce((x, y) => (check(y) ? x + y : x), ""));
    }
    async show(shopContext) {
        if (PrintessEditor.visible) {
            return false;
        }
        PrintessEditor.visible = true;
        PrintessEditor.currentContext = shopContext;
        const that = this;
        this.lastSaveDate = new Date();
        let isSaveToken = shopContext && shopContext.templateNameOrSaveToken && shopContext.templateNameOrSaveToken.indexOf("st:") === 0;
        PrintessEditor.closeAllHtmlDialogs();
        const callbacks = {
            onBack: () => {
                that.hide(true);
            },
            onAddToBasketAsync: async (saveToken, thumbnailUrl) => {
                let result = null;
                if (typeof PrintessEditor.currentContext.onAddToBasketAsync === "function") {
                    result = await PrintessEditor.currentContext.onAddToBasketAsync(saveToken, thumbnailUrl);
                }
                else {
                    result = PrintessEditor.currentContext.onAddToBasket(saveToken, thumbnailUrl);
                }
                if (result && result.waitUntilClosingMS) {
                    setTimeout(function () {
                        if (typeof result.executeBeforeClosing === "function") {
                            result.executeBeforeClosing();
                        }
                        that.hide(false);
                    }, result.waitUntilClosingMS);
                }
                else {
                    if (result && typeof result.executeBeforeClosing === "function") {
                        result.executeBeforeClosing();
                    }
                    that.hide(false);
                }
            },
            onFormFieldChangedAsync: async (formFieldName, formFieldValue, formFieldLabel, formFieldValueLabel) => {
                const formField = that.reverseFormFieldMapping(formFieldName, formFieldValue, PrintessEditor.currentContext.getFormFieldMappings());
                if (typeof PrintessEditor.currentContext.onFormFieldChangedAsync === "function") {
                    await PrintessEditor.currentContext.onFormFieldChanged(formField.name, formField.value, formFieldLabel, formFieldValueLabel);
                }
                else if (typeof PrintessEditor.currentContext.onFormFieldChanged === "function") {
                    PrintessEditor.currentContext.onFormFieldChanged(formField.name, formField.value, formFieldLabel, formFieldValueLabel);
                }
            },
            onPriceChangedAsync: async (priceInfo) => {
                await that.onPriceChanged(priceInfo);
            },
            onGetFormField: (result) => {
                if (typeof PrintessEditor.currentContext.onGetFormField === "function") {
                    PrintessEditor.currentContext.onGetFormField(result);
                }
            },
            onSaveAsync: async (saveToken, thumbnailUrl) => {
                that.lastSaveDate = new Date();
                if (typeof PrintessEditor.currentContext.onSaveAsync === "function") {
                    await PrintessEditor.currentContext.onSaveAsync(saveToken, thumbnailUrl);
                }
                else if (typeof PrintessEditor.currentContext.onSave === "function") {
                    PrintessEditor.currentContext.onSave(saveToken, thumbnailUrl);
                }
            },
            onLoadAsync: async (currentTemplateNameOrSaveToken) => {
                if (typeof PrintessEditor.currentContext.onLoadAsync === "function") {
                    await PrintessEditor.currentContext.onLoadAsync(currentTemplateNameOrSaveToken);
                }
                else if (typeof PrintessEditor.currentContext.onLoad === "function") {
                    PrintessEditor.currentContext.onLoad(currentTemplateNameOrSaveToken);
                }
            },
            onCloseTab: (evt) => {
                evt.preventDefault();
                evt.returnValue = '';
            }
        };
        PrintessEditor.currentContext.save = function () {
            that.save(callbacks);
        };
        if (this.usePanelUi()) {
            that.showBcUiVersion(callbacks);
        }
        else {
            const priceInfo = PrintessEditor.currentContext.getPriceInfo();
            let pageCount = null;
            let formFields = null;
            let mergeTemplates = null;
            if (!isSaveToken) {
                formFields = PrintessEditor.applyFormFieldMappings(PrintessEditor.currentContext.getCurrentFormFieldValues(), PrintessEditor.currentContext.getFormFieldMappings());
                mergeTemplates = PrintessEditor.currentContext.getMergeTemplates();
                if (PrintessEditor.currentContext.additionalAttachParams && typeof PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"] !== "undefined") {
                    const pageFormField = formFields.filter(x => x.name === PrintessEditor.currentContext.additionalAttachParams["pageCountFormField"]);
                    if (pageFormField && pageFormField.length > 0) {
                        let intValue = PrintessEditor.extractNumber(pageFormField[0].value);
                        if (!isNaN(intValue) && isFinite(intValue)) {
                            pageCount = intValue;
                        }
                    }
                }
            }
            const iFrame = await this.initializeIFrame(callbacks, this.Settings);
            if (iFrame.getAttribute('data-attached') === "false") {
                try {
                    const attachParams = {
                        domain: that.Settings.apiDomain,
                        token: this.Settings.shopToken || "",
                        templateName: PrintessEditor.currentContext.templateNameOrSaveToken,
                        showBuyerSide: true,
                        templateUserId: '',
                        basketId: await PrintessEditor.getOrGenerateBasketId(),
                        shopUserId: await PrintessEditor.getUserId(),
                        formFields: formFields,
                        snippetPriceCategoryLabels: priceInfo && priceInfo.snippetPrices ? priceInfo.snippetPrices : null,
                        mergeTemplates: mergeTemplates,
                        skipExchangeStateApplication: true
                    };
                    if (typeof PrintessEditor.currentContext.showSplitterGridSizeButton !== "undefined" && PrintessEditor.currentContext.showSplitterGridSizeButton !== null) {
                        attachParams["showSplitterGridSizeButton"] = PrintessEditor.currentContext.showSplitterGridSizeButton === true || PrintessEditor.currentContext.showSplitterGridSizeButton === "true";
                    }
                    const globalSettings = PrintessEditor.getGlobalShopSettings();
                    if (typeof globalSettings.getFormFieldProperties === "function") {
                        attachParams.formFieldProperties = globalSettings.getFormFieldProperties();
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
                    if (PrintessEditor.currentContext.additionalAttachParams) {
                        for (const prop in PrintessEditor.currentContext.additionalAttachParams) {
                            if (PrintessEditor.currentContext.additionalAttachParams.hasOwnProperty(prop)) {
                                attachParams[prop] = PrintessEditor.currentContext.additionalAttachParams[prop];
                            }
                        }
                    }
                    if (!isSaveToken && pageCount !== null && pageCount >= 1) {
                        attachParams["bookInsidePages"] = pageCount;
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
                    templateNameOrToken: PrintessEditor.currentContext.templateNameOrSaveToken,
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
                if (PrintessEditor.currentContext && PrintessEditor.currentContext.additionalAttachParams) {
                    if (PrintessEditor.currentContext.additionalAttachParams.formFieldProperties) {
                        loadParams.formFieldProperties = PrintessEditor.currentContext.additionalAttachParams.formFieldProperties;
                    }
                    if (typeof PrintessEditor.currentContext.additionalAttachParams.clearExchangeCaches !== "undefined") {
                        loadParams.clearExchangeCaches = PrintessEditor.currentContext.additionalAttachParams.clearExchangeCaches === false ? false : true;
                    }
                }
                iFrame.contentWindow.postMessage({
                    cmd: "loadTemplateAndFormFields",
                    parameters: [loadParams.templateNameOrToken, loadParams.mergeTemplates, loadParams.formFields, loadParams.snippetPriceCategoryLabels, loadParams.formFieldProperties, loadParams.clearExchangeCaches]
                }, '*');
                setTimeout(function () { iFrame.contentWindow.focus(); }, 0);
                if (!isSaveToken && pageCount !== null && pageCount > 0) {
                    setTimeout(function () {
                        iFrame.contentWindow.postMessage({
                            cmd: "setPageInsidePages",
                            parameters: [pageCount]
                        }, '*');
                    }, 0);
                }
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
        if (!this.show.saveInterval) {
            this.show.saveInterval = setInterval(function () {
                if (PrintessEditor.visible && PrintessEditor.currentContext.currentSaveTimerInMinutes !== null && PrintessEditor.currentContext.currentSaveTimerInMinutes > 0 && typeof PrintessEditor.currentContext.onSaveTimer === "function") {
                    const timeDifferenceMs = ((new Date()).getTime() - that.lastSaveDate.getTime());
                    if (timeDifferenceMs > (PrintessEditor.currentContext.currentSaveTimerInMinutes * 60000)) {
                        that.lastSaveDate = new Date();
                        PrintessEditor.currentContext.onSaveTimer();
                    }
                }
            }, 30000);
        }
    }
    hide(closeButtonClicked) {
        if (!PrintessEditor.visible) {
            return;
        }
        PrintessEditor.visible = false;
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
        if (typeof PrintessEditor.currentContext.editorClosed === "function") {
            PrintessEditor.currentContext.editorClosed(closeButtonClicked === true);
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
    static ensureScriptExecution(scriptId, methodName = null, params = null) {
        const scriptTag = document.getElementById(scriptId);
        if (scriptTag && !scriptTag.getAttribute("data-replaced")) {
            const newTag = document.createElement('script');
            newTag.setAttribute("id", scriptId);
            newTag.setAttribute("data-replaced", "true");
            newTag.type = 'text/javascript';
            newTag.text = scriptTag.text;
            scriptTag.replaceWith(newTag);
        }
        if (methodName && typeof window[methodName] === "function") {
            window[methodName].apply(null, params);
        }
    }
}
PrintessEditor.visible = false;function initPrintessEditor(shopToken, editorUrl, editorVersion, startupLogoUrl, showStartupAnimation, theme, startupBackgroundColor = "") {
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
            autoImportUserImages: shopToken["autoImportUserImages"] ? shopToken["autoImportUserImages"] === true : false
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
    constructor(graphQlToken, language = null) {
        this.language = null;
        this.graphQlToken = graphQlToken;
        this.language = language ? language.toUpperCase() : null;
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
    applyLanguageSettings(query) {
        if (this.language) {
            query.variables.language = this.language;
            query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{LANG_PARAM}", ", $language: LanguageCode!");
            query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{IN_CONTEXT_PARAM}", " @inContext(language: $language)");
        }
        else {
            query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{LANG_PARAM}", "");
            query.query = PrintessShopifyGraphQlApi.strReplaceAll(query.query, "{IN_CONTEXT_PARAM}", "");
        }
    }
    async getProductOptions(productId) {
        const that = this;
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
                            }
                        }
                    }
                }`,
            variables: queryVariables
        };
        query.query = query.query.replace("{METHOD_ARGUMENTS}", methodArguments).replace("{DEFAULT_VARIANT}", returnDefault ? defaulVariantQuery : "").replace("{VARIANT_FILTER}", variantFilter);
        this.applyLanguageSettings(query);
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
                query GetProductVariantById($variantId: ID!{LANG_PARAM}){IN_CONTEXT_PARAM} {
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
        this.applyLanguageSettings(query);
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
                query GetProductsById($productId: ID!{CURSOR1}{LANG_PARAM}){IN_CONTEXT_PARAM} {
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
        this.applyLanguageSettings(query);
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
class PrintessShopifyCart {
    constructor(printessSettings) {
        this.formFieldAsProperties = {};
        this.settings = printessSettings;
        this.shopifyApi = new PrintessShopifyGraphQlApi(printessSettings.graphQlToken, printessSettings.graphQlLanguage);
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
    async addTableQuantityItems(settings, saveToken, thumbnailUrl, reloadBasket = false) {
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
                    id: (await this.getVariantForFormFields({ ...this.basketItemVariantOptions, ...currentVariantValues })).id,
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
        if (reloadBasket) {
            window.location.replace('/cart');
        }
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
            await this.addTableQuantityItems(settings, saveToken, thumbnailUrl, false);
            if (!settings.keepOriginalBasketItem === true) {
                await this.deleteBasketItem(this.cartItemConfig.templateNameOrSaveToken);
            }
            window.location.replace('/cart');
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
        if (typeof additionalProperties["printQtyOption"] !== "undefined" && typeof additionalProperties["printQtyOption"] && typeof basketItemProperties[additionalProperties["printQtyOption"]] !== "undefined") {
            const quantity = PrintessEditor.extractNumber(basketItemProperties[additionalProperties["printQtyOption"]]);
            if (!isNaN(quantity) && isFinite(quantity)) {
                additionalProperties["printQty"] = quantity.toString();
            }
        }
        if (additionalProperties && additionalProperties["formFieldsAsProperties"]) {
            const fields = PrintessShopifyCart.parseFormFieldAsPropertyValue(additionalProperties && additionalProperties["formFieldsAsProperties"]);
            fields.forEach((x, index) => {
                if (typeof this.formFieldAsProperties[x.formfieldName] !== "undefined") {
                    basketItemProperties[x.propertyName] = typeof this.formFieldAsProperties[x.formfieldName] !== "undefined" ? this.formFieldAsProperties[x.formfieldName] : x.defaultValue || "";
                }
            });
        }
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
        if (additionalProperties && typeof additionalProperties["circulationRecordCount"] !== "undefined") {
            const storedValue = parseInt(additionalProperties["circulationRecordCount"]);
            if (!isNaN(storedValue) && isFinite(storedValue)) {
                valuesToWrite.quantity = storedValue;
            }
        }
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
                        return PrintessShopifyCart.parseMergeTemplates(mergeTemplates, this.settings.globalMergeModeOverride);
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
                if (context.additionalAttachParams && typeof context.additionalAttachParams["pageCountFormField"] !== "undefined" && context.additionalAttachParams["pageCountFormField"] === formField) {
                    if (that.product.productOptions) {
                        const selectedOption = that.product.productOptions.filter(x => x.name === formField);
                        if (selectedOption && selectedOption.length > 0) {
                            const optionValue = selectedOption[0].optionValues.filter(x => PrintessEditor.extractNumber(x.name).toString() === value);
                            if (optionValue && optionValue.length > 0) {
                                value = optionValue[0].name;
                            }
                        }
                    }
                }
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
                if (typeof that.formFieldAsProperties[formField] !== "undefined") {
                    that.formFieldAsProperties[formField] = valueLabel || value || "";
                }
                else if (typeof that.formFieldAsProperties[formFieldLabel] !== "undefined") {
                    that.formFieldAsProperties[formFieldLabel] = valueLabel || value || "";
                }
                if (that.basketItemVariantOptions) {
                    for (const itemName in that.basketItemVariantOptions) {
                        if (that.basketItemVariantOptions.hasOwnProperty(itemName)) {
                            if (itemName === formFieldLabel) {
                                optionFound = true;
                                that.basketItemVariantOptions[itemName] = valueLabel;
                            }
                            else if (itemName === formField) {
                                optionFound = true;
                                that.basketItemVariantOptions[itemName] = value;
                            }
                        }
                    }
                }
                if (that.basketItemOptions) {
                    for (const itemName in that.basketItemOptions) {
                        if (that.basketItemOptions.hasOwnProperty(itemName)) {
                            if (itemName === formFieldLabel) {
                                optionFound = true;
                                that.basketItemOptions[itemName] = valueLabel;
                            }
                            else if (itemName === formField) {
                                optionFound = true;
                                that.basketItemOptions[itemName] = value;
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
                let priceMultiplication = 1.0;
                const additionalLineItemProperties = this.cartItemConfig.additionalSettings ? this.cartItemConfig.additionalSettings : null;
                if (additionalLineItemProperties && additionalLineItemProperties && typeof additionalLineItemProperties["circulationRecordCount"] !== "undefined") {
                    let printedRecordsCount = 0;
                    const storedValue = parseInt(additionalLineItemProperties["circulationRecordCount"]);
                    if (!isNaN(storedValue) && isFinite(storedValue)) {
                        priceMultiplication = storedValue;
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
                    return price * priceMultiplication;
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
                    return variant.price.amount * priceMultiplication;
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
            onSaveAsync: async (saveToken, thumbnailUrl) => {
                context.cameFromSave = true;
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
            },
            propertyChanged: (propertyName, propertyValue) => {
                const additionalLineItemProperties = this.cartItemConfig.additionalSettings ? { ...this.cartItemConfig.additionalSettings } : {};
                switch (propertyName) {
                    case "circulationRecordCount": {
                        let printedRecordsCount = 0;
                        const intValue = parseInt(propertyValue);
                        if (additionalLineItemProperties && typeof additionalLineItemProperties["circulationRecordCount"] !== "undefined") {
                            const storedValue = parseInt(additionalLineItemProperties["circulationRecordCount"]);
                            if (!isNaN(storedValue) && isFinite(storedValue)) {
                                printedRecordsCount = storedValue;
                            }
                        }
                        if (!isNaN(intValue) && isFinite(intValue) && printedRecordsCount !== intValue) {
                            additionalLineItemProperties["circulationRecordCount"] = intValue.toString();
                        }
                        break;
                    }
                }
                this.cartItemConfig.additionalSettings = additionalLineItemProperties;
            },
            async getBasketIdAsync() {
                const globalSettings = PrintessEditor.getGlobalShopSettings();
                let ret = null;
                if (globalSettings) {
                    ret = typeof globalSettings.getBasketId === "function" ? globalSettings.getBasketId() : null;
                    if (!ret && typeof globalSettings.getBasketIdAsync === "function") {
                        ret = await globalSettings.getBasketIdAsync();
                    }
                }
                if (!ret) {
                    ret = that.settings.basketId || null;
                }
                return ret;
            },
            async getUserIdAsync() {
                const globalSettings = PrintessEditor.getGlobalShopSettings();
                let ret = null;
                if (globalSettings) {
                    ret = typeof globalSettings.getShopUserId === "function" ? globalSettings.getShopUserId() : null;
                    if (!ret && typeof globalSettings.getShopUserIdAsync === "function") {
                        ret = await globalSettings.getShopUserIdAsync();
                    }
                }
                if (!ret) {
                    ret = that.settings.shopUserId || null;
                }
                return ret;
            }
        };
        return context;
    }
    static parseMergeTemplates(valueString, globalMergeModeOverride) {
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
                if (globalMergeModeOverride) {
                    if (x) {
                        x.mergeMode = globalMergeModeOverride;
                    }
                }
                else {
                    if (!x.mergeMode) {
                        x.mergeMode = "layout-snippet-no-repeat";
                    }
                }
            });
        }
        return ret;
    }
    static parseFormFieldAsPropertyValue(value) {
        if (!value) {
            return;
        }
        try {
            const propertyDefs = JSON.parse(value);
            if (propertyDefs) {
                if (Array.isArray(propertyDefs)) {
                    return propertyDefs;
                }
                else {
                    return [propertyDefs];
                }
            }
        }
        catch (e) {
            const splits = value.split(",");
            const ret = [];
            splits.forEach((x) => {
                ret.push({
                    formfieldName: x,
                    propertyName: x
                });
            });
            return ret;
        }
        return [];
    }
    static parseBasketItemConfig(product, basketItemOptions, unknownSettings, variantSettings, formFieldsAsProeprties) {
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
                                            case "formFieldsAsProperties": {
                                                const fields = PrintessShopifyCart.parseFormFieldAsPropertyValue(basketItemConfig.additionalSettings[settingName]);
                                                fields.forEach((x) => {
                                                    if (typeof basketItemOptions[x.propertyName] !== "undefined") {
                                                        formFieldsAsProeprties[x.formfieldName] = basketItemOptions[x.propertyName] || "";
                                                    }
                                                    else {
                                                        formFieldsAsProeprties[x.formfieldName] = x.defaultValue || "";
                                                    }
                                                });
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
                if (quantity === null) {
                    //Quantity control not found, so use cart item quantity
                    quantity = settings.quantity || 1;
                }
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
        this.cartItemConfig = PrintessShopifyCart.parseBasketItemConfig(this.product, showSettings.basketItemOptions, this.basketItemOptions, this.basketItemVariantOptions, this.formFieldAsProperties) || {};
        this.cartItemConfig.basketItemId = showSettings.basketItemId;
        this.initialSaveToken = this.cartItemConfig.templateNameOrSaveToken && this.cartItemConfig.templateNameOrSaveToken.indexOf("st:") === 0 ? this.cartItemConfig.templateNameOrSaveToken : "";
        this.initTableQuantityVariants(showSettings);
        if (showSettings.theme) {
            this.cartItemConfig.theme = showSettings.theme;
            if (!this.settings.theme) {
                this.settings.theme = showSettings.theme;
            }
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
    static initCirculationCartItem(cartItemSelector, quantitySelectorSelector, cartItemKey, cartItemProperties, recordQuantityText = "{NUMBER} Records") {
        if (cartItemProperties && typeof cartItemProperties["_printessAdditionalProperties"] !== "undefined") {
            cartItemSelector = cartItemSelector || ".cart-item";
            quantitySelectorSelector = quantitySelectorSelector || "quantity-input,.cart-quantity,.quantity";
            recordQuantityText = (recordQuantityText || "{NUMBER} Records");
            let additionalProperties = cartItemProperties["_printessAdditionalProperties"];
            if (typeof additionalProperties === "string") {
                try {
                    additionalProperties = JSON.parse(additionalProperties);
                }
                catch (e) {
                    //For some reason this is sometimes html encoded
                    var txt = document.createElement("textarea");
                    txt.innerHTML = cartItemProperties["_printessAdditionalProperties"];
                    additionalProperties = JSON.parse(txt.value);
                }
            }
            if (additionalProperties && additionalProperties["circulationRecordCount"]) {
                const storedValue = parseInt(additionalProperties["circulationRecordCount"]);
                if (!isNaN(storedValue) && isFinite(storedValue)) {
                    const quantitySelector = document.getElementById("printessCustomizeButton" + cartItemKey)?.closest(cartItemSelector)?.querySelector(quantitySelectorSelector);
                    if (quantitySelector) {
                        if (recordQuantityText.indexOf("{NUMBER}") >= 0) {
                            recordQuantityText = recordQuantityText.replace("{NUMBER}", storedValue.toString());
                        }
                        else {
                            recordQuantityText = storedValue.toString() + recordQuantityText;
                        }
                        const quantityDisplay = document.createElement("span");
                        quantityDisplay.id = "printess_quantity_indicator" + cartItemKey;
                        quantityDisplay.innerText = recordQuantityText;
                        quantitySelector.replaceWith(quantityDisplay);
                    }
                }
            }
        }
    }
}
const showPrintessEditorFallback = (itemId, loopCount = 0, keepOriginalBasketItem = false, addToBasketDirect = false) => {
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
                    showPrintessEditorFallback(itemId, ++loopCount, keepOriginalBasketItem, addToBasketDirect);
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
            window[showMethodName1](keepOriginalBasketItem, addToBasketDirect);
        if (typeof window[showMethodName2] !== "undefined")
            window[showMethodName2](null, keepOriginalBasketItem, addToBasketDirect);
    }
};
const initPrintessShopifyEditor = (printessSettings) => {
    if (typeof window["printessShopifyEditor"] === "undefined") {
        const addToBasketButtonSelector = printessSettings && printessSettings.productButtonSelector ? printessSettings.productButtonSelector : 'button[type="submit"][name="add"], button.product-form__add-button[data-action="add-to-cart"],button#AddToCart,.add-to-cart-button,#AddToCart';
        if (printessSettings && printessSettings.theme && typeof printessSettings.theme !== "string" && printessSettings.theme.error) {
            printessSettings.theme = printessSettings.theme.error;
        }
        const editor = {
            productCache: {},
            productFormSelector: printessSettings && printessSettings.productFormSelector ? printessSettings.productFormSelector : 'form[data-type="add-to-cart-form"],form.product-single__form,form.shopify-product-form[id^=product-form-template],form[action="/cart/add"]',
            tableQuantityVariants: null,
            lastSaveToken: "",
            initialSaveToken: "",
            originalSaveToken: "",
            ignoreDataOptionIndex: printessSettings && typeof printessSettings.ignoreDataOptionIndex !== "undefined" && printessSettings.ignoreDataOptionIndex === true, //Some themes write data-option-position or data-option-index as option index some as value position inside the option
            formFieldAsProperties: {},
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
            getProductOptionValuesByVariantId: (variantId, product) => {
                const ret = {};
                const variantOptionNames = {};
                if (!product.variants) {
                    return null;
                }
                if (typeof variantId === "string") {
                    variantId = parseInt(variantId);
                }
                const selectedVariant = product.variants.filter(x => x.id === variantId);
                if (!selectedVariant || selectedVariant.length < 1) {
                    return null;
                }
                product.optionDetails.forEach((x) => {
                    variantOptionNames[x.position] = x.name;
                });
                if (selectedVariant[0].options) {
                    for (let i = 0; i < selectedVariant[0].options.length; ++i) {
                        ret[variantOptionNames[i + 1]] = selectedVariant[0].options[i];
                    }
                }
                return ret;
            },
            getCurrentProductOptionValues: (product) => {
                let ret = {};
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
                if (printessSettings.useVariantIdField === true) {
                    const variantIdCtrl = document.querySelector('input[name="variant_id"],select[name="variant_id"],input[name="id"],select[name="id"]');
                    if (variantIdCtrl && variantIdCtrl.value) {
                        ret = {
                            ...ret,
                            ...editor.getProductOptionValuesByVariantId(parseInt(variantIdCtrl.value), product)
                        };
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
            getOptionNameAndValue: (product, formField, value, label, valueLabel) => {
                if (product && product.optionDetails) {
                    let option = product.optionDetails.filter(x => x.name === formField);
                    if (!option || option.length === 0) {
                        option = product.optionDetails.filter(x => x.name === label);
                    }
                    if (option && option.length > 0) {
                        let filteredValue = option[0].values.filter(x => x.name === value);
                        if (!filteredValue || filteredValue.length === 0) {
                            filteredValue = option[0].values.filter(x => x.name === valueLabel);
                        }
                        if (filteredValue && filteredValue.length > 0) {
                            return {
                                name: option[0].name,
                                value: filteredValue[0].name
                            };
                        }
                    }
                }
                return null;
            },
            setFormFieldValue: (product, formField, value, formFieldLabel, valueLabel) => {
                if ((valueLabel === null || valueLabel === "") && (value !== null && value !== "")) {
                    valueLabel = value;
                }
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
                inputs = document.querySelectorAll(`input[type="text"],input[type="hidden"],input[type="color"],input[type="date"],input[type="datetime-local"],input[type="email"],input[type="month"],input[type="number"],input[type="tel"],input[type="time"],input[type="url"],input[type="week"]`);
                if (inputs && inputs.length > 0) {
                    const nameAndValue = editor.getOptionNameAndValue(product, formField, value, formFieldLabel, valueLabel);
                    inputs.forEach((el) => {
                        const dataOptionPosition = el.getAttribute("data-option-position") || el.getAttribute("data-option-index");
                        const dataOptionName = el.getAttribute("data-option-name") || el.getAttribute("data-name") || el.getAttribute("name") || el.getAttribute("aria-label") || el.getAttribute("data-index");
                        const initialName = editor.evaluateInputName(product, el.getAttribute("name"), !editor.ignoreDataOptionIndex ? dataOptionPosition : "", dataOptionName, el.getAttribute("data-option-value-id"));
                        const initialValue = editor.evaluateInputValue(product, initialName, !editor.ignoreDataOptionIndex ? dataOptionPosition : "", el.value, el.getAttribute("data-option-value-id"));
                        let valueChanged = false;
                        if (nameAndValue) {
                            if (initialName === nameAndValue.name && initialValue !== nameAndValue.value) {
                                valueChanged = true;
                                el.setAttribute("value", nameAndValue.value);
                            }
                        }
                        else {
                            if (initialName === formField) {
                                if (initialValue !== value) {
                                    valueChanged = true;
                                    el.setAttribute("value", value);
                                }
                            }
                            else if (initialName === formFieldLabel && initialValue !== valueLabel) {
                                valueChanged = true;
                                el.setAttribute("value", valueLabel);
                            }
                        }
                        if (valueChanged) {
                            el.dispatchEvent(new Event('change'));
                        }
                    });
                }
                if (printessSettings.useVariantIdField === true) {
                    const variantIdCtrl = document.querySelector('input[name="variant_id"],select[name="variant_id"],input[name="id"],select[name="id"]');
                    if (variantIdCtrl && variantIdCtrl.value) {
                        const values = editor.getProductOptionValuesByVariantId(parseInt(variantIdCtrl.value), product);
                        if (typeof values[formField] !== "undefined" || typeof values[formFieldLabel] === "undefined") {
                            values[formField] = value;
                        }
                        else {
                            values[formFieldLabel] = valueLabel;
                        }
                        const variant = editor.getVariantByProductOptions(values, product, true);
                        variantIdCtrl.value = variant.id.toString();
                    }
                }
            },
            setProductProperty: (settings, formField, value, formFieldLabel, valueLabel, useFallback = false) => {
                if ((valueLabel === null || valueLabel === "") && (value !== null && value !== "")) {
                    valueLabel = value;
                }
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
                if (settings.additionalLineItemProperties && settings.additionalLineItemProperties["formFieldsAsProperties"]) {
                    const fields = editor.parseFormFieldAsPropertyValue(settings.additionalLineItemProperties["formFieldsAsProperties"]);
                    fields.forEach(x => editor.formFieldAsProperties[x.formfieldName] = (x.defaultValue || ""));
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
            addToBasketWithoutPersonalization: async (settings) => {
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
                shopContext["isUnpersonalized"] = true;
                shopContext.disableCartEditing = true;
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
                if (settings.additionalLineItemProperties && settings.additionalLineItemProperties["formFieldsAsProperties"]) {
                    const fields = editor.parseFormFieldAsPropertyValue(settings.additionalLineItemProperties["formFieldsAsProperties"]);
                    fields.forEach(x => editor.formFieldAsProperties[x.formfieldName] = (x.defaultValue || ""));
                }
                const isSaveToken = shopContext.templateNameOrSaveToken && shopContext.templateNameOrSaveToken.indexOf("st:") === 0;
                const formFields = {};
                let mergeTemplates = null;
                if (!isSaveToken) {
                    PrintessEditor.applyFormFieldMappings(shopContext.getCurrentFormFieldValues(), shopContext.getFormFieldMappings()).forEach((x) => {
                        formFields[x.name] = x.value;
                    });
                    mergeTemplates = shopContext.getMergeTemplates();
                }
                const params = {
                    mergeTemplates: mergeTemplates,
                    formFields: formFields,
                    templateName: shopContext.templateNameOrSaveToken,
                    usePublishedVersion: true,
                    shopInfo: {
                        basketId: await PrintessEditor.getOrGenerateBasketId(),
                        userId: await PrintessEditor.getUserId(),
                    }
                };
                const result = await PrintessSharedTools.createSaveToken(printessSettings.shopToken, params);
                if (result && result.saveToken) {
                    shopContext.onAddToBasket(result.saveToken, result.thumbnailUrl);
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
            parseFormFieldAsPropertyValue(value) {
                if (!value) {
                    return;
                }
                try {
                    const propertyDefs = JSON.parse(value);
                    if (propertyDefs) {
                        if (Array.isArray(propertyDefs)) {
                            return propertyDefs;
                        }
                        else {
                            return [propertyDefs];
                        }
                    }
                }
                catch (e) {
                    const splits = value.split(",");
                    const ret = [];
                    splits.forEach((x) => {
                        ret.push({
                            formfieldName: x,
                            propertyName: x
                        });
                    });
                    return ret;
                }
                return [];
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
                                return editor.parseMergeTemplates(settings.mergeTemplates, printessSettings.globalMergeModeOverwrite);
                            }
                            else {
                                if (printessSettings.globalMergeModeOverwrite) {
                                    settings.mergeTemplates.forEach((mergeTemplate) => {
                                        if (mergeTemplate) {
                                            mergeTemplate.mergeMode = printessSettings.globalMergeModeOverwrite;
                                        }
                                    });
                                }
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
                        if (typeof editor.formFieldAsProperties[formField] !== "undefined") {
                            editor.formFieldAsProperties[formField] = valueLabel || value || "";
                        }
                        else if (typeof editor.formFieldAsProperties[formFieldLabel] !== "undefined") {
                            editor.formFieldAsProperties[formFieldLabel] = valueLabel || value || "";
                        }
                        if (context.additionalAttachParams && typeof context.additionalAttachParams["pageCountFormField"] !== "undefined" && context.additionalAttachParams["pageCountFormField"] === formField) {
                            if (settings.product.optionDetails) {
                                const selectedOption = settings.product.optionDetails.filter(x => x.name === formField);
                                if (selectedOption && selectedOption.length > 0) {
                                    const optionValue = selectedOption[0].values.filter(x => PrintessEditor.extractNumber(x.name).toString() === value);
                                    if (optionValue && optionValue.length > 0) {
                                        value = optionValue[0].name;
                                    }
                                }
                            }
                        }
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
                            editor.addNewItemToBasket(settings, saveToken, thumbnailUrl, context.disableCartEditing === true, context["isUnpersonalized"] === true ? false : true);
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
                        let priceMultiplication = 1.0;
                        if (settings.additionalLineItemProperties && typeof settings.additionalLineItemProperties["circulationRecordCount"] !== "undefined") {
                            let printedRecordsCount = 0;
                            const additionalLineItemProperties = settings.additionalLineItemProperties || {};
                            const storedValue = parseInt(additionalLineItemProperties["circulationRecordCount"]);
                            if (!isNaN(storedValue) && isFinite(storedValue)) {
                                priceMultiplication = storedValue;
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
                            return price * priceMultiplication;
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
                                    return callback(formFields, variant.price, callbackParams) * priceMultiplication;
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            }
                            return variant.price * priceMultiplication;
                        }
                    },
                    async getBasketIdAsync() {
                        const globalSettings = PrintessEditor.getGlobalShopSettings();
                        let ret = null;
                        if (globalSettings) {
                            ret = typeof globalSettings.getBasketId === "function" ? globalSettings.getBasketId() : null;
                            if (!ret && typeof globalSettings.getBasketIdAsync === "function") {
                                ret = await globalSettings.getBasketIdAsync();
                            }
                        }
                        if (!ret) {
                            ret = printessSettings.basketId || null;
                        }
                        return ret;
                    },
                    async getUserIdAsync() {
                        const globalSettings = PrintessEditor.getGlobalShopSettings();
                        let ret = null;
                        if (globalSettings) {
                            ret = typeof globalSettings.getShopUserId === "function" ? globalSettings.getShopUserId() : null;
                            if (!ret && typeof globalSettings.getShopUserIdAsync === "function") {
                                ret = await globalSettings.getShopUserIdAsync();
                            }
                        }
                        if (!ret) {
                            ret = printessSettings.shopUserId || null;
                        }
                        return ret;
                    },
                    onSave: (saveToken, thumbnailUrl) => {
                        context.cameFromSave = true;
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
                                "printessAdditionalPropertiesEdit" + settings.product.id,
                                "printessUnpersonalizedEditing" + settings.product.id
                            ], "");
                        }
                    },
                    propertyChanged: (propertyName, propertyValue) => {
                        switch (propertyName) {
                            case "circulationRecordCount": {
                                let printedRecordsCount = 0;
                                const intValue = parseInt(propertyValue);
                                const additionalLineItemProperties = settings.additionalLineItemProperties || {};
                                if (typeof additionalLineItemProperties["circulationRecordCount"] !== "undefined") {
                                    const storedValue = parseInt(additionalLineItemProperties["circulationRecordCount"]);
                                    if (!isNaN(storedValue) && isFinite(storedValue)) {
                                        printedRecordsCount = storedValue;
                                    }
                                }
                                if (!isNaN(intValue) && isFinite(intValue) && printedRecordsCount !== intValue) {
                                    additionalLineItemProperties["circulationRecordCount"] = intValue.toString();
                                    settings.additionalLineItemProperties = additionalLineItemProperties;
                                }
                                break;
                            }
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
            parseMergeTemplates: (valueString, globalMergeModeOverride) => {
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
                        if (globalMergeModeOverride) {
                            x.mergeMode = globalMergeModeOverride;
                        }
                        else {
                            if (!x.mergeMode) {
                                x.mergeMode = "layout-snippet-no-repeat";
                            }
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
            addNewItemToBasket: (settings, saveToken, thumbnailUrl, disableEditing, isPersonalized = true) => {
                if (settings && settings.legacyAddToBasket === true) {
                    const selectedOptions = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                    const variantRelatedOptions = editor.getProductOptionValuesForVariants(selectedOptions, settings.product);
                    const selectedVariant = editor.getVariantByProductOptions(variantRelatedOptions, settings.product, true);
                    let basketItemProperties = settings.basketItemOptions ? Object.assign({}, settings.basketItemOptions) : {};
                    basketItemProperties = Object.assign(Object.assign({}, basketItemProperties), { _printessSaveToken: saveToken, _printessThumbnail: thumbnailUrl, _printessProductDefinitionId: "" + settings.productDefinitionId, _printessOutputType: "" + settings.outputFormat || "pdf", _printessDpi: "" + settings.outputDpi || "300", _printessTheme: printessSettings.theme });
                    if (isPersonalized === false) {
                        basketItemProperties["_printessUnpersonalized"] = "true";
                    }
                    if (settings.printQuantityOption && typeof selectedOptions[settings.printQuantityOption] !== "undefined") {
                        const quantity = PrintessEditor.extractNumber(selectedOptions[settings.printQuantityOption]);
                        if (!isNaN(quantity) && isFinite(quantity)) {
                            if (!settings.additionalLineItemProperties) {
                                settings.additionalLineItemProperties = {};
                            }
                            settings.additionalLineItemProperties["printQty"] = quantity.toString();
                            settings.additionalLineItemProperties["printQtyOption"] = settings.printQuantityOption;
                        }
                    }
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
                if (isPersonalized === false) {
                    editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessUnpersonalized]", "printessUnpersonalizedEditing" + settings.product.id, "true");
                }
                if (disableEditing === true) {
                    editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessDisableEditing]", "printessDisableEditing" + settings.product.id, "true");
                }
                else {
                    editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessDisableEditing]", "printessDisableEditing" + settings.product.id, null);
                }
                if (settings.additionalLineItemProperties && settings.additionalLineItemProperties["formFieldsAsProperties"]) {
                    const fields = editor.parseFormFieldAsPropertyValue(settings.additionalLineItemProperties["formFieldsAsProperties"]);
                    fields.forEach((x, index) => {
                        if (typeof editor.formFieldAsProperties[x.formfieldName] !== "undefined") {
                            editor.addOrRemoveTextField(editor.productFormSelector, "properties[" + x.propertyName + "]", "ffProperty" + index + settings.product.id, typeof editor.formFieldAsProperties[x.formfieldName] !== "undefined" ? editor.formFieldAsProperties[x.formfieldName] : x.defaultValue || "");
                        }
                    });
                }
                //in some cases the id field is not correctly set and we have to set it (only do it in case we are having variant related options)
                const selectedOptions = typeof settings.basketItemId !== "undefined" && settings.basketItemId ? settings.basketItemOptions : editor.getCurrentProductOptionValues(settings.product);
                const writeBackVariant = editor.hasVariantRelatedOptions(settings.product, selectedOptions);
                if (settings.printQuantityOption && typeof selectedOptions[settings.printQuantityOption] !== "undefined") {
                    const quantity = PrintessEditor.extractNumber(selectedOptions[settings.printQuantityOption]);
                    if (!isNaN(quantity) && isFinite(quantity)) {
                        if (!settings.additionalLineItemProperties) {
                            settings.additionalLineItemProperties = {};
                        }
                        settings.additionalLineItemProperties["printQty"] = quantity.toString();
                        settings.additionalLineItemProperties["printQtyOption"] = settings.printQuantityOption;
                    }
                }
                if (printessSettings && printessSettings.uiVersion) {
                    if (!settings.additionalLineItemProperties) {
                        settings.additionalLineItemProperties = {};
                    }
                    settings.additionalLineItemProperties["uiVersion"] = printessSettings.uiVersion;
                }
                if (settings.additionalLineItemProperties) {
                    editor.addOrRemoveTextField(editor.productFormSelector, "properties[_printessAdditionalProperties]", "printessAdditionalPropertiesEdit" + settings.product.id, JSON.stringify(settings.additionalLineItemProperties) || "");
                }
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
                if (settings.additionalLineItemProperties && typeof settings.additionalLineItemProperties["circulationRecordCount"] !== "undefined") {
                    const storedValue = parseInt(settings.additionalLineItemProperties["circulationRecordCount"]);
                    if (!isNaN(storedValue) && isFinite(storedValue)) {
                        const quantityInput = document.querySelector(settings.quantityInputSelector || 'input[name="quantity"],select[name="quantity"]');
                        if (quantityInput) {
                            quantityInput.value = storedValue.toString();
                        }
                        else {
                            let form = document.querySelector(addToBasketButtonSelector)?.closest("form");
                            if (form) {
                                const input = document.createElement("input");
                                input.type = "hidden";
                                input.value = storedValue.toString();
                                input.name = "quantity";
                                form.appendChild(quantityInput);
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
                if (settings.printQuantityOption && typeof settings.basketItemOptions[settings.printQuantityOption] !== "undefined") {
                    const quantity = PrintessEditor.extractNumber(settings.basketItemOptions[settings.printQuantityOption]);
                    if (!isNaN(quantity) && isFinite(quantity)) {
                        if (!settings.additionalLineItemProperties) {
                            settings.additionalLineItemProperties = {};
                        }
                        settings.additionalLineItemProperties["printQty"] = quantity.toString();
                        settings.additionalLineItemProperties["printQtyOption"] = settings.printQuantityOption;
                    }
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
                            if (settings.additionalLineItemProperties && settings.additionalLineItemProperties["formFieldsAsProperties"]) {
                                const fields = editor.parseFormFieldAsPropertyValue(settings.additionalLineItemProperties["formFieldsAsProperties"]);
                                fields.forEach((x, index) => {
                                    if (typeof editor.formFieldAsProperties[x.formfieldName] !== "undefined") {
                                        basketItemProperties[x.propertyName] = typeof editor.formFieldAsProperties[x.formfieldName] !== "undefined" ? editor.formFieldAsProperties[x.formfieldName] : x.defaultValue || "";
                                    }
                                });
                            }
                            let quantity = typeof settings.quantity !== "undefined" && settings.quantity > 1 ? settings.quantity : 1;
                            if (settings.additionalLineItemProperties && typeof settings.additionalLineItemProperties["circulationRecordCount"] !== "undefined") {
                                const storedValue = parseInt(settings.additionalLineItemProperties["circulationRecordCount"]);
                                if (!isNaN(storedValue) && isFinite(storedValue)) {
                                    quantity = storedValue;
                                }
                            }
                            if (basketItemProperties["_printessUnpersonalized"]) {
                                delete basketItemProperties["_printessUnpersonalized"];
                            }
                            const valuesToWrite = {
                                id: curr.id,
                                quantity: quantity,
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
            },
            onGetFormField: (result) => {
                alert(JSON.stringify(result));
            }
        };
        window["printessShopifyEditor"] = editor;
    }
    return window["printessShopifyEditor"];
};
class PrintessShopifyDirectAddToBasket {
    static addToBasketDirect(jsReference, shopToken, templateName, productId, mergeTemplates, printTemplateName, autoOpenCartView, globalMergeModeOverwrite) {
        return PrintessShopifyDirectAddToBasket.addToBasket({
            shopToken: shopToken,
            templateName: templateName,
            productId: productId,
            mergeTemplates: mergeTemplates,
            printTemplateName: printTemplateName,
            autoOpenCart: autoOpenCartView,
            globalMergeModeOverwrite: globalMergeModeOverwrite
        });
    }
    static async addToBasket(settings) {
        if (!settings.shopToken) {
            throw "No Printess shop token provided!";
        }
        if (!settings.templateName) {
            throw "No Printess template name provided!";
        }
        const mergeTemplates = settings.mergeTemplates ? PrintessSharedTools.parseMergeTemplate(settings.mergeTemplates, settings.globalMergeModeOverwrite) : null;
        const saveToken = await PrintessSharedTools.createSaveToken(settings.shopToken, {
            templateName: settings.templateName,
            formFields: settings.formFields ? settings.formFields : null,
            mergeTemplates: mergeTemplates,
            usePublishedVersion: true,
            shopInfo: {
                userId: settings.userId || "",
                basketId: settings.basketId ? settings.basketId : await PrintessEditor.getOrGenerateBasketId()
            }
        });
        const basketItemProperties = {
            _printessSaveToken: saveToken.saveToken,
            _printessThumbnail: saveToken.thumbnailUrl
        };
        if (typeof settings.productDefinitionId !== "undefined" && settings.productDefinitionId !== null) {
            basketItemProperties["_printessProductDefinitionId"] = settings.productDefinitionId.toString();
        }
        if (settings.productType) {
            basketItemProperties["_printessProductType"] = settings.productType;
        }
        if (settings.printTemplateName) {
            basketItemProperties["_printessAdditionalProperties"] = JSON.stringify({
                printTemplate: settings.printTemplateName
            });
        }
        else {
            if (settings.outputType) {
                basketItemProperties["_printessOutputType"] = settings.outputType;
            }
            if (settings.dpi) {
                basketItemProperties["_printessDpi"] = settings.dpi.toString();
            }
            basketItemProperties["_printessUnpersonalized"] = "true";
        }
        const items = [
            {
                id: settings.productId,
                quantity: 1,
                properties: basketItemProperties
            }
        ];
        const added = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items
            }),
        });
        if (settings.autoOpenCart === true) {
            window.location.replace('/cart');
        }
        else {
        }
        return;
    }
}
class PrintessShopifyCartVariantSwitcher {
    constructor(settings) {
        this._settings = settings;
        document.querySelectorAll(".printess_cart_variant_switcher").forEach(x => this.addBasketItem(x));
        if (settings.itemListSelector) {
            const item = document.querySelector(settings.itemListSelector);
            const that = this;
            if (item) {
                const observer = new MutationObserver((mutationList, observer) => {
                    for (const mutation of mutationList) {
                        if (mutation.type === "childList") {
                            item.querySelectorAll(".printess_cart_variant_switcher").forEach(x => this.addBasketItem(x));
                        }
                    }
                });
                observer.observe(item, {
                    childList: true,
                    subtree: true
                });
            }
        }
    }
    getVariantByOptions(product, options) {
        let variants = product.variants;
        for (const propertyName in options) {
            if (options.hasOwnProperty(propertyName)) {
                variants = variants.filter((x) => {
                    const option = x.options.filter(y => y.optionName === propertyName && y.optionValue === options[propertyName]);
                    return option && option.length > 0;
                });
            }
        }
        if (variants && variants.length > 0) {
            return variants[0];
        }
        return null;
    }
    async getProduct(productId) {
        if (PrintessShopifyCartVariantSwitcher._productCache[productId]) {
            return PrintessShopifyCartVariantSwitcher._productCache[productId];
        }
        const graphQlApi = new PrintessShopifyGraphQlApi(this._settings.graphQlToken);
        const product = await graphQlApi.getProductById(productId, true);
        if (!product) {
            console.error("Can not get product information for product with id " + productId);
            return null;
        }
        product.variants = await graphQlApi.getProductVariants(product.id);
        PrintessShopifyCartVariantSwitcher._productCache[productId] = product;
        return PrintessShopifyCartVariantSwitcher._productCache[productId];
    }
    selectionChangedEvent(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        const selectCtrl = evt.target;
        const variantValues = {};
        this.getProduct(parseInt(selectCtrl.getAttribute("data-product-id"))).then((product) => {
            const variantId = parseInt(selectCtrl.getAttribute("data-variant-id"));
            const selectedVariant = product.variants.filter(x => x.id === variantId)[0];
            selectedVariant.options.forEach((x) => {
                variantValues[x.optionName] = x.optionValue;
            });
            variantValues[product.variantSwitchingOption.value] = selectCtrl.value;
            const variant = this.getVariantByOptions(product, variantValues);
            if (variant) {
                selectCtrl.disabled = true;
            }
            PrintessShopifyCartVariantSwitcher.onReplaceBasketItem(selectCtrl, product.id, variant).then(() => {
                window.location.replace('/cart');
            });
        });
    }
    static decodeHtml(value) {
        var txt = document.createElement("textarea");
        txt.innerHTML = value;
        return txt.value;
    }
    static async onReplaceBasketItem(selectControl, newProductId, newVariant) {
        let properties = {};
        const serialized = JSON.parse(selectControl.getAttribute("data-basket-properties"));
        if (Array.isArray(serialized)) {
            serialized.forEach((x) => {
                properties[x[0]] = x[1];
            });
        }
        else {
            properties = serialized;
        }
        //There are some html encoding issues that we have to solve by removing the html encoding
        for (const prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                if (typeof properties[prop] === "string") {
                    properties[prop] = PrintessShopifyCartVariantSwitcher.decodeHtml(properties[prop]);
                }
            }
        }
        if (properties["_printessAdditionalProperties"]) {
            const propertiesJson = JSON.parse(properties["_printessAdditionalProperties"]);
            if (newVariant && propertiesJson && propertiesJson["printQtyOption"]) {
                const option = newVariant.options.filter(x => x.optionName === propertiesJson["printQtyOption"]);
                if (option && option.length > 0) {
                    const intValue = PrintessEditor.extractNumber(option[0].optionValue);
                    if (!isNaN(intValue) && isFinite(intValue)) {
                        propertiesJson["printQty"] = intValue;
                        properties["_printessAdditionalProperties"] = JSON.stringify(propertiesJson);
                    }
                }
            }
        }
        let result = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{
                        id: newVariant.id || newProductId,
                        quantity: 1,
                        properties: properties
                    }]
            })
        });
        if (!result.ok) {
            console.error("Unable to add item to basket: [" + result.status.toString() + "] " + result.statusText);
            return;
        }
        result = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: selectControl.getAttribute("data-basket-item-key"),
                quantity: 0
            }),
        });
        if (!result || !result.ok) {
            console.error("!Unable to delete item from basket: [" + result.status.toString() + "] " + result.statusText);
        }
    }
    initSelectControl(selectCtrl, product) {
        const variantId = parseInt(selectCtrl.getAttribute("data-variant-id"));
        if (!selectCtrl || !product || !product.variants || !product.variantSwitchingOption || !product.productOptions) {
            return null;
        }
        const selectedVariant = product.variants.filter(x => x.id === variantId);
        if (!selectedVariant || selectedVariant.length < 1) {
            return;
        }
        selectCtrl.innerHTML = ""; //Clear all options
        const option = product.productOptions.filter(x => x.name === product.variantSwitchingOption.value);
        if (option && option.length > 0) {
            const selectedOptionValue = selectedVariant[0].options.filter(x => x.optionName === product.variantSwitchingOption.value);
            option[0].optionValues.forEach(x => {
                const optionElement = document.createElement("option");
                optionElement.setAttribute("value", x.name);
                if (this._settings.selectElementClasses) {
                    optionElement.setAttribute("class", this._settings.selectElementClasses);
                }
                optionElement.innerHTML = x.name;
                if (selectedOptionValue && selectedOptionValue.length > 0) {
                    if (selectedOptionValue[0].optionValue === x.name) {
                        optionElement.setAttribute("selected", "selected");
                        selectCtrl.value = x.name;
                    }
                }
                selectCtrl.appendChild(optionElement);
            });
        }
        selectCtrl.style.display = "block";
        const parentItem = selectCtrl.closest(this._settings.parentSelector || ".cart-item");
        (parentItem || document).querySelectorAll(this._settings.elementToHideSelector || "quantity-input,.quantity.cart-quantity").forEach((x) => { x.style.display = "none"; });
        if (!selectCtrl.getAttribute("data-printess-initialized")) {
            selectCtrl.setAttribute("data-printess-initialized", "true");
            const that = this;
            selectCtrl.addEventListener("change", function (e) {
                that.selectionChangedEvent(e);
            });
        }
    }
    async addBasketItem(selectControl) {
        if (selectControl) {
            if (selectControl.getAttribute("data-printess-initialized")) {
                return;
            }
            this.initSelectControl(selectControl, await this.getProduct(parseInt(selectControl.getAttribute("data-product-id"))));
        }
    }
}
PrintessShopifyCartVariantSwitcher._productCache = {};