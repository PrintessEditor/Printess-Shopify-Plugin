async function attachSlimUi(params) {
    model.previewContainer = params.previewContainer;
    model.uiContainer = params.uiContainer;
    model.previewImage = params.previewImage;
    model.loader = params.loader;
    model.shopToken = params.shopToken;
    model.templateName = params.templateName;
    model.published = params.published;
    await loadTemplateInfos();
    model.previewImage.onload = () => {
        if (model.loader) {
            model.loader.style.display = "none";
        }
        if (model.previewImage) {
            model.previewImage.style.opacity = "1";
        }
    };
    render();
    renderPreviewImage(0);
}
function gl(x) {
    return x;
}
const model = {
    props: [],
    aspect: 1,
    uiContainer: null,
    previewContainer: null,
    previewImage: null,
    loader: null,
    shopToken: "",
    templateName: "",
    published: true
};
function setProperty(p, newValue) {
    const v = [];
    for (const pp of model.props) {
        if (pp.id === p.id) {
            v.push({ ...pp, value: newValue });
        }
        else {
            v.push(pp);
        }
    }
    model.props = v;
    renderPreviewImage(p.listMeta?.list?.length ? 0 : 1000);
}
function getFormFields() {
    const formFields = {};
    for (const p of model.props) {
        if (p.ffName) {
            formFields[p.ffName] = p.value;
        }
    }
    return formFields;
}
async function loadTemplateInfos() {
    const response = await postJson("template/initialproperties", {
        id: model.templateName,
        p: model.published,
        userId: "",
        versionId: null
    });
    if (!response.ok) {
        throw new Error("Cannot get initialproperties url.");
    }
    const responseJson = await response.json();
    if (responseJson && responseJson.initialProperties) {
        const m = responseJson.initialProperties;
        model.props = m.props;
        model.aspect = m.aspect;
    }
    return null;
}
let debounceHandle = 0;
function renderPreviewImage(timeout) {
    if (model.previewImage && model.loader) {
        model.loader.style.display = "block";
        model.previewImage.style.opacity = "0.5";
        if (debounceHandle) {
            window.clearTimeout(debounceHandle);
        }
        if (timeout === 0) {
            _renderPreviewImageDirect();
        }
        else {
            debounceHandle = window.setTimeout(_renderPreviewImageDirect, timeout);
        }
    }
}
;
async function _renderPreviewImageDirect() {
    if (model.previewImage) {
        const m = {
            templateName: model.templateName,
            formFields: getFormFields(),
            documentName: "Book",
            pagesToSkip: 0
        };
        const response = await postJson("saas/mockup/url/create", m);
        if (!response.ok) {
            throw new Error("Cannot get mockup url.");
        }
        const responseJson = await response.json();
        model.previewImage.src = responseJson.url;
    }
}
async function getSaveToken() {
    const m = {
        templateName: model.templateName,
        formFields: getFormFields(),
    };
    const response = await postJson("production/savetoken/create", m);
    if (!response.ok) {
        throw new Error("Cannot get save token.");
    }
    const responseJson = await response.json();
    const saveToken = responseJson.saveToken;
    const thumbnailUrl = responseJson.thumbnailUrl;
    console.log(responseJson);
    prompt(saveToken);
}
function render() {
    const ui = model.uiContainer;
    if (!ui) {
        alert("No UI Div found");
        return;
    }
    ui.innerHTML = "";
    for (const p of model.props) {
        if (p.kind === "single-line-text") {
            const inp = document.createElement("input");
            inp.type = "text";
            inp.value = p.value.toString();
            inp.oninput = () => {
                setProperty(p, inp.value);
            };
            const label = document.createElement("label");
            const caption = document.createElement("p");
            caption.innerText = gl(p.label);
            label.appendChild(caption);
            label.appendChild(inp);
            ui.appendChild(label);
        }
        else if (p.kind === "label") {
            const h5 = document.createElement("h3");
            h5.innerText = gl(p.label);
            ui.appendChild(h5);
        }
        else if (p.kind === "image-list") {
            const caption = document.createElement("p");
            caption.innerText = gl(p.label);
            ui.appendChild(caption);
            ui.appendChild(getImageSelectList(p));
        }
    }
    const basketButton = document.createElement("button");
    const basketToken = document.createElement("div");
    const basketThumb = document.createElement("img");
    basketButton.innerText = "Add to Basket";
    basketButton.onclick = async () => {
        getSaveToken();
    };
    ui.appendChild(basketButton);
    ui.appendChild(basketThumb);
    ui.appendChild(basketToken);
}
function getImageSelectList(p) {
    const container = document.createElement("div");
    if (p.listMeta && p.listMeta.list) {
        const cssId = p.id.replace("#", "-");
        if (p.listMeta.imageCss) {
            const st = document.createElement("style");
            const css = p.listMeta.imageCss.replace(/\.image/g, ".image" + cssId);
            st.innerHTML = css.split("\n").join("");
            container.appendChild(st);
        }
        const imageList = document.createElement("div");
        imageList.classList.add("image-select-list");
        for (const entry of p.listMeta.list) {
            const thumb = document.createElement("div");
            thumb.className = "no-selection image" + cssId;
            thumb.style.position = "relative";
            if (entry.imageUrl) {
                thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
            }
            else if (p.kind === "color-list") {
                thumb.style.backgroundColor = entry.key;
            }
            if (!entry.enabled) {
                thumb.classList.add("disabled");
            }
            thumb.style.width = p.listMeta.thumbWidth + "px";
            thumb.style.height = p.listMeta.thumbHeight + "px";
            if (entry.key === p.value && entry.enabled) {
                thumb.classList.add("selected");
            }
            thumb.onclick = async () => {
                setProperty(p, entry.key);
                imageList.childNodes.forEach((c) => c.classList.remove("selected"));
                thumb.classList.add("selected");
                p.value = entry.key;
            };
            imageList.appendChild(thumb);
        }
        container.appendChild(imageList);
    }
    return container;
}
async function postJson(url, payload) {
    return fetch("https://api.printess.com/" + url, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "omit",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + model.shopToken
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(payload)
    });
}
//# sourceMappingURL=slim-ui.js.map