/*Printess Shopify Integration Version: 2.6*/
class PrintessEditor{constructor(e){if(this.calculateCurrentPrices=async(e,t)=>{var i=await this.getPriceCategories(t);let a=i.basePrice;return e.snippetPriceCategories&&e.snippetPriceCategories.forEach(e=>{e&&0<e.amount&&t.snippetPrices[e.priceCategory-1]&&(a+=t.snippetPrices[e.priceCategory-1].priceInCent)}),i.price=t.formatMoney(a),i},!e||!e.shopToken)throw"No shop token provided";this.Settings={...e};e={};null!=this.Settings.uiSettings&&(e.showAnimation=!0===this.Settings.uiSettings.showStartupAnimation||"true"==this.Settings.uiSettings.showStartupAnimation,this.Settings.uiSettings.startupLogoUrl&&(e.imageUrl=this.Settings.uiSettings.startupLogoUrl),this.Settings.uiSettings.startupBackgroundColor)&&(e.background=this.Settings.uiSettings.startupBackgroundColor),this.ClassicEditorUrl=this.getClassicEditorUrl(this.Settings.editorUrl,this.Settings.editorVersion,e)+"#"+encodeURIComponent(JSON.stringify(e))}stripEditorVersion(e){if(void 0!==(e=(e||"").trim())&&null!=e)if(e){for(;0==e.indexOf("/");)e=e.substring(1);for(;0<e.length&&"/"===e[e.length-1];)e=e.substring(0,e.length-1)}else e="";return e}sanitizeHost(e){return e?(e=e.trim()).endsWith("/")?e:e+"/":e||""}getClassicEditorUrl(e,t,i){var a=(e=e||"https://editor.printess.com/").indexOf("#");if(0<a){var n=e.substring(a+1);if(n)try{var o=JSON.parse(decodeURIComponent(n));if(o)for(var s in o)o.hasOwnProperty(s)&&(i[s]=o[s])}catch(e){}e=e.substring(0,a)}return e.toLowerCase().endsWith(".html")||(e=this.sanitizeHost(e),t&&(e+=(t=this.stripEditorVersion(t))+(t?"/":"")),e+="printess-editor/embed.html"),e=0!==e.toLowerCase().indexOf("https://")&&0!==e.toLowerCase().indexOf("http://")?"https://"+e:e}getLoaderUrl(e,t,i){var a=(e=e||"https://editor.printess.com/").indexOf("#");if(0<a){var n=e.substring(a+1);if(n)try{var o=JSON.parse(decodeURIComponent(n));if(o)for(var s in o)o.hasOwnProperty(s)&&(i[s]=o[s])}catch(e){}e=e.substring(0,a)}return(e=e.toLocaleLowerCase().endsWith("embed.html")?e.substring(0,e.length-"embed.html".length):e).toLowerCase().endsWith(".html")||(e=this.sanitizeHost(e),t&&(e+=(t=this.stripEditorVersion(t))+(t?"/":"")),e.toLowerCase().endsWith("printess-editor/")||(e+="printess-editor/"),e+="loader.js"),e=0!==e.toLowerCase().indexOf("https://")&&0!==e.toLowerCase().indexOf("http://")?"https://"+e:e}getPrintessComponent(){return document.querySelector("printess-component")||null}applyFormFieldMappings(t,i){var a=[];if(!i)for(var e in t)t.hasOwnProperty(e)&&a.push({name:e,value:t[e]});if(t)for(var n in t)if(t.hasOwnProperty(n)){var o=t[n],s=void 0!==i[n]&&void 0!==i[n].formField?i[n].formField:n;let e=o;void 0!==i[n]&&void 0!==i[n].values&&void 0!==i[n].values[e]&&(e=i[n].values[o]),a.push({name:s,value:e})}return a}reverseFormFieldMapping(e,t,i){let a=e||"",n=t||"";if(i)for(var o in i)if(i.hasOwnProperty(o)&&i[o].formField===e){if(i[a=o].values)for(var s in i[o].values)if(i[o].values.hasOwnProperty(s)&&i[o].values[s]===t){n=s;break}break}return{name:a,value:n}}setViewportMeta(){var i=document.getElementsByTagName("head");if(i&&0<i.length){let e=i[0].querySelector("meta[name=viewport]"),t=(e||((e=document.createElement("meta")).setAttribute("name","viewport"),i[0].appendChild(e)),e.getAttribute("content"));t?t.indexOf("interactive-widget")<0&&(t=t+(t?", ":"")+"interactive-widget=resizes-content",e.setAttribute("content",t)):e.setAttribute("content","interactive-widget=resizes-content")}}async initializeIFrame(n,o,i){let s=this,r=document.getElementById("printess"),l=e=>{n&&"function"==typeof n.onCloseTab&&n.onCloseTab(e)},d=e=>{switch(e.data.cmd){case"back":window.removeEventListener("message",d),window.removeEventListener("beforeunload",l),window.removeEventListener("unload",l),r.setAttribute("printessHasListener","false"),n&&"function"==typeof n.onBack&&n.onBack();break;case"basket":window.removeEventListener("message",d),window.removeEventListener("beforeunload",l),window.removeEventListener("unload",l),r.setAttribute("printessHasListener","false"),n&&"function"==typeof n.onAddToBasketAsync&&n.onAddToBasketAsync(e.data.token,e.data.thumbnailUrl).then(()=>{});break;case"formFieldChanged":n&&"function"==typeof n.onFormFieldChangedAsync&&n.onFormFieldChangedAsync(e.data.n||e.data.name,e.data.v||e.data.value,e.data.ffCaption||"",e.data.l||e.data.label).then(()=>{});break;case"priceChanged":n&&"function"==typeof n.onPriceChangedAsync&&n.onPriceChangedAsync(e.data.priceInfo).then(()=>{});break;case"renderFirstPageImage":n&&"function"==typeof n.onRenderedFirstPageImageAsync&&n.onRenderedFirstPageImageAsync(e.data.result);break;case"save":n&&"function"==typeof n.onSaveAsync&&n.onSaveAsync(e.data.token);break;case"loaded":if(!0===this.Settings.autoImportImageUrlsInFormFields)try{this.downloadImages(this.getImagesInFormFields(s.applyFormFieldMappings(o.getCurrentFormFieldValues(),o.getFormFieldMappings()))).then(e=>{this.tempUploadImages?this.tempUploadImages=[...this.tempUploadImages,...e]:this.tempUploadImages=e,0<e.length&&this.uploadImageToClassicEditor(r,e[0].data,e[0].name)})}catch(e){console.error(e)}n&&"function"==typeof n.onLoadAsync&&n.onLoadAsync(o.templateNameOrSaveToken);break;case"uploadImage":var t,i,a;this.tempUploadImages&&e.data.result&&(t=this.tempUploadImages)&&0<t.length&&(i=t[0],a=e.data.result.name,t.shift(),r.contentWindow?.postMessage({cmd:"setFormFieldValue",parameters:[i.name,a]},"*"),0<t.length)&&this.uploadImageToClassicEditor(r,t[0].data,t[0].name)}};return new Promise(e=>{var t;r?("true"!==r.getAttribute("printessHasListener")&&(window.addEventListener("message",d),!0===i.showAlertOnTabClose&&(window.addEventListener("beforeunload",l),window.addEventListener("unload",l)),r.setAttribute("printessHasListener","true")),e(r)):((t=document.createElement("div")).setAttribute("id","printess-container"),t.setAttribute("style","display: none; position: absolute; top: 0; bottom: 0; right: 0; left: 0; width: 100%; height: 100%; z-index: 100000;"),(r=document.createElement("iframe")).setAttribute("src",this.ClassicEditorUrl),r.setAttribute("id","printess"),r.setAttribute("style","width:100%; heigth:100%;"),r.setAttribute("data-attached","false"),r.setAttribute("allow","xr-spatial-tracking; clipboard-read; clipboard-write;"),r.setAttribute("allowfullscreen","true"),r.classList.add("printess-owned"),t.appendChild(r),r.onload=()=>{e(r)},window.addEventListener("message",d),!0===i.showAlertOnTabClose&&(window.addEventListener("beforeunload",l),window.addEventListener("unload",l)),r.setAttribute("printessHasListener","true"),window.visualViewport&&window.visualViewport.addEventListener("scroll",()=>{r.contentWindow?.postMessage({cmd:"viewportScroll",height:window.visualViewport?.height,offsetTop:window.visualViewport?.offsetTop},"*")},{passive:!0}),s.setViewportMeta(),document.body.append(t))})}getFileNameFromUrl(e){return(e||"").split("#")[0].split("?")[0].split("/").pop()}getImagesInFormFields(e){let i=[],a=["png","jpg","gif","webp","svg","heic"];return e.forEach(e=>{var t;e.value&&((t=e.value.toLowerCase()).startsWith("http://")||t.startsWith("https://"))&&0<(t=this.getFileNameFromUrl(t).split(".")).length&&a.includes(t[1])&&i.push(e)}),i}async getPriceCategories(e,t=null){let i=0;return t=t||e.getCurrentFormFieldValues(),"function"==typeof e.getPriceForFormFieldsAsync?i=await e.getPriceForFormFieldsAsync(t):"function"==typeof e.getPriceForFormFields&&(i=e.getPriceForFormFields(t)),{snippetPrices:e.snippetPrices.map(e=>e?e.label:null),priceCategories:{},price:e.formatMoney(i),basePrice:i,productName:e.getProductName(),legalNotice:e.legalText,infoUrl:e.legalTextUrl}}usePanelUi(){var e=this.Settings.uiSettings&&this.Settings.uiSettings.uiVersion?this.Settings.uiSettings.uiVersion.toLowerCase().trim():"";return"bcui"===e||"panelui"===e}async onPriceChanged(i,a){try{let e=null;try{if(void 0!==i.pageCount&&a.currentPageCount!==i.pageCount&&(a.currentPageCount=i.pageCount,a.additionalAttachParams)&&void 0!==a.additionalAttachParams.pageCountFormField){if("function"==typeof a.onFormFieldChanged)try{a.onFormFieldChanged(a.additionalAttachParams.pageCountFormField,a.currentPageCount.toString(),"","")}catch(e){console.error(e)}if("function"==typeof a.onFormFieldChangedAsync)try{await a.onFormFieldChangedAsync(a.additionalAttachParams.pageCountFormField,a.currentPageCount.toString(),"","")}catch(e){console.error(e)}}i.snippetPriceCategories&&0<i.snippetPriceCategories.length?a.stickers=i.snippetPriceCategories.filter(e=>a.snippetPrices&&a.snippetPrices.length>=e.priceCategory).map(e=>({productVariantId:a.snippetPrices[e.priceCategory-1].variantId,quantity:e.amount})):a.stickers=[],e=await this.calculateCurrentPrices(i,a)}catch(e){console.error(e)}let t=document.getElementById("printess");t&&!a.hidePricesInEditor&&setTimeout(()=>{t.contentWindow.postMessage({cmd:"refreshPriceDisplay",priceDisplay:e},"*")},0);var n=this.getPrintessComponent();n&&n.editor&&n.editor.ui.refreshPriceDisplay(e)}catch(e){}}hideBcUiVersion(e,t){var i=this.getPrintessComponent();i&&i.editor&&i.editor.ui.hide(),"function"==typeof e.editorClosed&&e.editorClosed(!0===t),document.body.classList.remove("hideAll")}async downloadImages(t){var i=[];for(let e=0;e<t.length;++e){var a,n=await fetch(t[e].value);n.ok?(a=await n.blob(),i.push({name:t[0].name,data:new File([a],this.getFileNameFromUrl(t[e].value),{type:a.type})})):console.error("Unable to download image "+t[e].value+"; ["+n.status.toString()+"] "+n.statusText+": "+await n.text())}return i}async uploadImagesToBcUiEditor(t,i){if(t)for(let e=0;e<t.length;++e){var a=await i.api.uploadImage(t[e].data,null,!1);a&&await i.api.setFormFieldValue(t[e].name,a.name)}}uploadImageToClassicEditor(e,t,i){t&&e.contentWindow?.postMessage({cmd:"uploadImage",parameters:[t,null,!1,"ff_"+i]},"*")}static generateUUID(){var i=(new Date).getTime(),a="undefined"!=typeof performance&&performance.now&&1e3*performance.now()||0;return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=16*Math.random();return 0<i?(t=(i+t)%16|0,i=Math.floor(i/16)):(t=(a+t)%16|0,a=Math.floor(a/16)),("x"===e?t:3&t|8).toString(16)})}getOrGenerateBasketId(e){let t="function"==typeof e.getBasketId?e.getBasketId():"";if(!t||"some-unique-basket-or-session-id"==t.toLowerCase()||"some-unique-shop-user-id"==t.toLowerCase()){if(!t)try{t=localStorage.getItem("printessUniqueBasketId")}catch(e){console.warn("Unable to read user id from local storage.")}if(!(t=t||window.printessUniqueBasketId)){t=PrintessEditor.generateUUID()+"_"+(new Date).valueOf().toString();try{localStorage.setItem("printessUniqueBasketId",t)}catch(e){window.printessUniqueBasketId=t,console.warn("Unable to write user id to local storage.")}}}return t||"Some-Unique-Basket-Or-Session-Id"}async showBcUiVersion(a,o){let n=this;var t=a.getPriceInfo(),s=a&&a.templateNameOrSaveToken&&0===a.templateNameOrSaveToken.indexOf("st:");let r=null,l=null,d=null;s||(l=n.applyFormFieldMappings(a.getCurrentFormFieldValues(),a.getFormFieldMappings()),d=a.getMergeTemplates(),a.additionalAttachParams&&void 0!==a.additionalAttachParams.pageCountFormField&&(c=l.filter(e=>e.name===a.additionalAttachParams.pageCountFormField))&&0<c.length&&(c=PrintessEditor.extractNumber(c[0].value),!isNaN(c))&&isFinite(c)&&(r=c));var c=n.getLoaderUrl(this.Settings.editorUrl,this.Settings.editorVersion,{}),c=await import(c);let p=n.getPrintessComponent();if(p&&p.editor)p.style.display="block",a.renderFirstPageImageAsync=async(e,t)=>{e=await p.editor.api.renderFirstPageImage("thumbnail.png",void 0,e,t);a&&"function"==typeof a.onRenderFirstPageImageAsync?await a.onRenderFirstPageImageAsync(e):a&&"function"==typeof a.onRenderFirstPageImage&&a.onRenderFirstPageImage(e)},await p.editor.api.loadTemplateAndFormFields(a.templateNameOrSaveToken,d,l,null),!s&&null!==r&&0<r&&await p.editor.api.setBookinsidePages(r),p.editor.ui.show();else{let e=n.Settings.uiSettings&&n.Settings.uiSettings.theme||"",i=(e&&0!==e.indexOf("json not allowed")||(e="DEFAULT"),{domain:n.Settings.apiDomain,mergeTemplates:d,formFields:l,token:n.Settings.shopToken,templateName:a.templateNameOrSaveToken,translationKey:"auto",basketId:this.getOrGenerateBasketId(a),shopUserId:"Some-Unique-Shop-User-Id",snippetPriceCategoryLabels:t&&t.snippetPrices?t.snippetPrices:null,theme:e,addToBasketCallback:(e,t)=>{o&&"function"==typeof o.onAddToBasketAsync&&o.onAddToBasketAsync(e,t).then(()=>{})},formFieldChangedCallback:(e,t,i,a,n)=>{o&&"function"==typeof o.onFormFieldChangedAsync&&o.onFormFieldChangedAsync(e,t,n,a).then(()=>{})},priceChangeCallback:e=>{o&&"function"==typeof o.onPriceChangedAsync&&o.onPriceChangedAsync(e).then(()=>{})},backButtonCallback:e=>{n.hideBcUiVersion(a,!0)},saveTemplateCallback:(e,t)=>{"function"==typeof o.onSaveAsync&&o.onSaveAsync(e),t&&"close"===t&&n.hideBcUiVersion(a,!0)}});!s&&null!==r&&1<=r&&(i.bookInsidePages=r);t=await c.load(i);(p=n.getPrintessComponent()).editor=t,setTimeout(function(){let t=n.getPrintessComponent();if(t){if(!0===n.Settings.autoImportImageUrlsInFormFields)try{n.downloadImages(n.getImagesInFormFields(n.applyFormFieldMappings(a.getCurrentFormFieldValues(),a.getFormFieldMappings()))).then(e=>{n.uploadImagesToBcUiEditor(e,t.editor).then(e=>{})})}catch(e){console.error(e)}!0!==a.hidePricesInEditor&&n.calculateCurrentPrices({},a).then(e=>{t.editor.ui.refreshPriceDisplay(e)}),o.onLoadAsync(i.templateName)}},1e3)}}static extractNumber(e){return parseInt([...e].reduce((e,t)=>"0123456789".includes(t)?e+t:e,""))}async show(n){let o=this;var s=n&&n.templateNameOrSaveToken&&0===n.templateNameOrSaveToken.indexOf("st:"),r={onBack:()=>{o.hide(n,!0)},onAddToBasketAsync:async(e,t)=>{let i=null;(i="function"==typeof n.onAddToBasketAsync?await n.onAddToBasketAsync(e,t):n.onAddToBasket(e,t))&&i.waitUntilClosingMS?setTimeout(function(){"function"==typeof i.executeBeforeClosing&&i.executeBeforeClosing(),o.hide(n,!1)},i.waitUntilClosingMS):(i&&"function"==typeof i.executeBeforeClosing&&i.executeBeforeClosing(),o.hide(n,!1))},onFormFieldChangedAsync:async(e,t,i,a)=>{e=o.reverseFormFieldMapping(e,t,n.getFormFieldMappings());"function"==typeof n.onFormFieldChangedAsync?await n.onFormFieldChanged(e.name,e.value,i,a):"function"==typeof n.onFormFieldChanged&&n.onFormFieldChanged(e.name,e.value,i,a)},onPriceChangedAsync:async e=>{await o.onPriceChanged(e,n)},onRenderedFirstPageImageAsync:async e=>{"function"==typeof n.onRenderFirstPageImageAsync?await n.onRenderFirstPageImageAsync(e):"function"==typeof n.onRenderFirstPageImage&&n.onRenderFirstPageImage(e)},onSaveAsync:async e=>{"function"==typeof n.onSaveAsync?await n.onSaveAsync(e,""):"function"==typeof n.onSave&&n.onSave(e,"")},onLoadAsync:async e=>{"function"==typeof n.onLoadAsync?await n.onLoadAsync(e):"function"==typeof n.onLoad&&n.onLoad(e)},onCloseTab:e=>{e.preventDefault(),e.returnValue=""}};if(this.usePanelUi())o.showBcUiVersion(n,r);else{var l=n.getPriceInfo();let e=null,t=null,i=null,a=(s||(t=this.applyFormFieldMappings(n.getCurrentFormFieldValues(),n.getFormFieldMappings()),i=n.getMergeTemplates(),n.additionalAttachParams&&void 0!==n.additionalAttachParams.pageCountFormField&&(m=t.filter(e=>e.name===n.additionalAttachParams.pageCountFormField))&&0<m.length&&(m=PrintessEditor.extractNumber(m[0].value),!isNaN(m))&&isFinite(m)&&(e=m)),await this.initializeIFrame(r,n,this.Settings));if(n.renderFirstPageImageAsync=(e,t)=>(setTimeout(function(){a.contentWindow.postMessage({cmd:"renderFirstPageImage",properties:{}},"*")},0),Promise.resolve()),"false"===a.getAttribute("data-attached"))try{var d={domain:o.Settings.apiDomain,token:this.Settings.shopToken||"",templateName:n.templateNameOrSaveToken,showBuyerSide:!0,templateUserId:"",basketId:this.getOrGenerateBasketId(n),shopUserId:"function"==typeof n.getUserId?n.getUserId()||"Some-Unique-Basket-Or-Session-Id":"Some-Unique-Shop-User-Id",formFields:t,snippetPriceCategoryLabels:l&&l.snippetPrices?l.snippetPrices:null,mergeTemplates:i};if(null!=n.showSplitterGridSizeButton&&(d.showSplitterGridSizeButton=!0===n.showSplitterGridSizeButton||"true"===n.showSplitterGridSizeButton),this.Settings.uiSettings&&this.Settings.uiSettings.theme&&(d.theme=this.Settings.uiSettings.theme),this.Settings.attachParams)for(var c in this.Settings.attachParams)this.Settings.attachParams.hasOwnProperty(c)&&(d[c]=this.Settings.attachParams[c]);if(n.additionalAttachParams)for(var p in n.additionalAttachParams)n.additionalAttachParams.hasOwnProperty(p)&&(d[p]=n.additionalAttachParams[p]);!s&&null!==e&&1<=e&&(d.bookInsidePages=e),a.contentWindow.postMessage({cmd:"attach",properties:d},"*"),a.setAttribute("data-attached","true"),setTimeout(function(){a.contentWindow.focus()},0)}catch(e){console.error(e)}else{var m={templateNameOrToken:n.templateNameOrSaveToken,mergeTemplates:i,formFields:t,snippetPriceCategoryLabels:l&&l.snippetPrices?l.snippetPrices:null,formFieldProperties:void 0,clearExchangeCaches:!0};this.Settings.attachParams&&(this.Settings.attachParams.formFieldProperties&&(m.formFieldProperties=this.Settings.attachParams.formFieldProperties),void 0!==this.Settings.attachParams.clearExchangeCaches)&&(m.clearExchangeCaches=!1!==this.Settings.attachParams.clearExchangeCaches),n&&n.additionalAttachParams&&(n.additionalAttachParams.formFieldProperties&&(m.formFieldProperties=n.additionalAttachParams.formFieldProperties),void 0!==n.additionalAttachParams.clearExchangeCaches)&&(m.clearExchangeCaches=!1!==n.additionalAttachParams.clearExchangeCaches),a.contentWindow.postMessage({cmd:"loadTemplateAndFormFields",parameters:[m.templateNameOrToken,m.mergeTemplates,m.formFields,m.snippetPriceCategoryLabels,m.formFieldProperties,m.clearExchangeCaches]},"*"),setTimeout(function(){a.contentWindow.focus()},0),!s&&null!==e&&0<e&&setTimeout(function(){a.contentWindow.postMessage({cmd:"setPageInsidePages",parameters:[e]},"*")},0)}}document.body.classList.add("hideAll");r=document.getElementsByTagName("html"),r&&0<r.length&&r[0].classList.add("printess-editor-open"),l=document.getElementById("printess-container");l&&l.style.setProperty("display","block","important")}hide(e,t){this.usePanelUi()?(i=this.getPrintessComponent())&&i.editor&&i.editor.ui.hide():(i=document.getElementById("printess-container"))&&(i.style.display="none"),document.body.classList.remove("hideAll");var i=document.getElementsByTagName("html");i&&0<i.length&&i[0].classList.remove("printess-editor-open"),"function"==typeof e.editorClosed&&e.editorClosed(!0===t)}static getGlobalShopSettings(){return window&&window.printessGlobalConfig?window.printessGlobalConfig:{}}static getGlobalFormFields(){var e=PrintessEditor.getGlobalShopSettings();let t;if(null!=typeof e.formFields&&e.formFields)if("function"==typeof e.formFields)try{t=e.formFields()}catch(e){console.error(e)}else t=e.formFields;return t||{}}}function initPrintessEditor(e,t,i,a,n,o,s=""){let r;return r=e&&"string"!=typeof e?{apiDomain:e.apiDomain||null,shopToken:e.shopToken||"",editorUrl:e.editorUrl||"",editorVersion:e.editorVersion||"",attachParams:e.attachParams||"",showAlertOnTabClose:null!=e.showTabClosingAlert&&!0===e.showTabClosingAlert,uiSettings:{showStartupAnimation:null==e.showStartupAnimation||!0===e.showStartupAnimation,startupBackgroundColor:e.startupBackgroundColor||"#ffffff",theme:e.theme||"",startupLogoUrl:e.startupLogoUrl||"",uiVersion:e.uiVersion||""},...e}:{apiDomain:null,shopToken:e||"",editorUrl:t,editorVersion:i,uiSettings:{showStartupAnimation:n,startupBackgroundColor:s,startupLogoUrl:a,theme:o}},new PrintessEditor(r)};

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
                        },
                        variantSwitchingOption: metafield(namespace: "printess", key: "variantSwitchingOption") {
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
    getProductVariantsInternal(productId, cursor = null) {
        const query = {
            query: `
                query GetProductsById($productId: ID!{CURSOR1}) {
                    product(id: $productId) {
                        variants(first: 50{CURSOR2}) {
                            edges {
                                node {
                                    id
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
                    const variantIdCtrl = document.querySelector('input[name="variant_id"],select[name="variant_id"]');
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
                if (printessSettings.useVariantIdField === true) {
                    const variantIdCtrl = document.querySelector('input[name="variant_id"],select[name="variant_id"]');
                    if (variantIdCtrl && variantIdCtrl.value) {
                        const values = editor.getProductOptionValuesByVariantId(parseInt(variantIdCtrl.value), product);
                        /*
                        product: IProduct, formField: string, value: string, formFieldLabel: string, valueLabel: string
                        */
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
            PrintessShopifyCartVariantSwitcher.onReplaceBasketItem(selectCtrl, product.id, variant.id).then(() => {
                window.location.replace('/cart');
            });
        });
    }
    static decodeHtml(value) {
        var txt = document.createElement("textarea");
        txt.innerHTML = value;
        return txt.value;
    }
    static async onReplaceBasketItem(selectControl, newProductId, newVariantId) {
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
        let result = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{
                        id: newVariantId || newProductId,
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