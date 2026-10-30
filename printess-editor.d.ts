// ImportFrame/ImportImage/ImportSimpleText/ImportShape/ImportEffects/ImportTransform are the payload shapes of the
// frame verbs below. They were used without being imported, so the published copy of this file did
// not compile against those methods at all - it only ever passed because nothing called them and
// consumers run with skipLibCheck. build.sh rewrites this specifier to the public url and ships the
// schema next to it, so naming them here is enough.
// The ONLY import this file may have, and it must stay that way: template-import-interfaces is
// interface-only, so it costs a consumer nothing. `iStore` used to be imported here for one patch type
// and reached most of the editor through its own imports - which inflated every consumer's build and
// broke the slim one. Anything this file needs is declared here or in that interface file.
import { ImportDocument, ImportEffects, ImportFormField, ImportFrame, ImportImage, ImportShape, ImportSimpleText, ImportTransform, TemplateImportOptions, TemplateImportTask } from "https://editor.printess.com/printess-editor/template-import-interfaces.d.ts"

/**
 * Main call to attach the Printess to div-element of your choice.
 * In ```printessAttachParameters``` you can pass authorization, template-name and other parameters.
 * Returns the externalApi (iPrintessApi) instance all further calls go through.
 * #ai-api:core
 */
/**
 * Attaches the editor to `p.div` and returns its api. The editor is one per page: a second call does not set it up again,
 * it applies what can be applied to the running editor - the callbacks, the container (the editor moves into the new
 * `div`, and back into the same `div` when the page emptied it in between), `basketId` and `shopUserId`, the language
 * (`translationKey`), the template with its merges, form fields and
 * settings - and returns the same api. The token, the domain, the resource path and `showBuyerSide` stay as the first
 * call set them. `loader.load()` behaves the same.
 */
export declare function attachPrintess(p: printessAttachParameters): Promise<iPrintessApi>;


type SdxlStyle = "No Style" | "photographic" | "3d-model" | "analog-film" | "cinematic" | "Tilt-Shift" | "Long Exposure" |
  "anime" | "comic-book" | "Craft Clay" | "digital-art" | "enhance" | "Advertising" |
  "Alien" | "Horror" | "Neon Noir" | "Silhouette" |
  "fantasy-art" | "line-art" | "low-poly" | "origami" | "pixel-art" |
  "Abstract" | "Cubist" | "Graffiti" | "Impressionist" | "Pointillism" | "Pop Art" | "Psychedelic" | "Renaissance" |
  "Steampunk" | "Surrealist" | "Watercolor" | "Retro Game" | "Architectural" | "Disco" | "Dreamscape" | "Dystopian" |
  "Fairy Tale" | "Gothic" | "Grunge" | "Minimalist" | "Monochrome" | "Space" | "Stained Glass" |
  "Tribal" | "Zentangle" | "Flat Papercut" | "Papercut Shadow Box" | "Stacked Papercut" | "Kirigami" | "Paper Mache" | "Paper Quilling" | "Papercut Collage" |
  "Thick Layered Papercut"


interface iImage {
  fileName: string,
  original: iScaledImage,
  source?: iScaledImage, // in case it's not png or jpg, this one contains the info about the source file (pdf, svg, tif etc)
  scaledVersions?: iScaledImage[]
  originalOrder?: number,
  originalGroup?: string,
  version?: number,
  average?: number // number ranging from 0-255 (0 full black, 255 full white), the average of the image pixel values
}

interface iScaledImage {
  id: string,
  url: string,
  width: number,
  height: number,
  userState?: string | number | Record<string, unknown>,
  isImmutable?: boolean,
  fileHash?: string,
  version?: number
}

interface StoppingToken {
  isCancellationRequested: boolean
}

interface iRect {
  left: number;
  top: number;
  width: number;
  height: number;
}


/*
************** NEW GENERATE AI IMAGE INTERFACES ************
*/

/**
 * Every model takes `allowCache`: with `true` an identical earlier request of the same account (same model and options,
 * in any basket) returns its image again, without generating or charging a new one. The account portal sets how long
 * cached images are kept (AI Limits, 365 days by default, at most 10 years).
 * A request without `allowCache` for a request that is cached (a regenerate) adds its new image to the cache as another
 * variant, and the image the same basket / shop user got last counts as regenerated; a cached request returns the variant
 * regenerated least. Without a basket or shop user id a regenerate is not cached.
 */
export type iExternalGenImageModel =
  | ImgModel_Sdxl
  | ImgModel_FluxSchnell
  | ImgModel_FluxDev
  | ImgModel_FluxPro
  | ImgModel_FluxUltra
  | ImgModel_FluxProKontextEdit
  | ImgModel_Flux2Klein4BEdit
  | ImgModel_NanoBanana
  | ImgModel_NanoBananaEdit
  | ImgModel_NanoBananaPro
  | ImgModel_NanoBananaProEdit
  | ImgModel_NanoBanana2
  | ImgModel_NanoBanana2Edit
  | ImgModel_GptImage1
  | ImgModel_GptImage1Edit
  | ImgModel_GptImage1_5
  | ImgModel_GptImage1_5Edit
  | ImgModel_GptImage2
  | ImgModel_GptImage2Edit
  | ImgModel_GptImage2_5Flare
  | ImgModel_GptImage2_5FlareEdit
  | ImgModel_GptImage2_5Sunburst
  | ImgModel_GptImage2_5SunburstEdit
  | ImgModel_Ideogram4
  | ImgModel_Ideogram4Edit

export type iExternalGenImageFollowUpAction = "remove-background" | "assign-to-frame"

export interface ImgModel_Sdxl {
  model: "SDXL"
  prompt: string,
  negativePrompt?: string,
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_FluxSchnell {
  model: "FluxSchnell"
  prompt: string,
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_FluxDev {
  model: "FluxDev"
  prompt: string,
  stylePreset?: string
  allowCache?: boolean
}

// flux-2-pro
export interface ImgModel_FluxPro {
  model: "FluxPro"
  prompt: string,
  stylePreset?: string
  allowCache?: boolean
}

// flux-pro/v1.1-ultra
export interface ImgModel_FluxUltra {
  model: "FluxUltra"
  prompt: string,
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_FluxProKontextEdit {
  model: "FluxProKontextEdit"
  prompt: string,
  inputImageUrl: string
  enhancePrompt?: boolean,
  allowCache?: boolean
}

export interface ImgModel_Flux2Klein4BEdit {
  model: "Flux2Klein4BEdit"
  prompt: string,
  inputImageUrls: string[]
  allowCache?: boolean
}

export interface ImgModel_NanoBanana {
  model: "NanoBanana"
  prompt: string
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_NanoBananaEdit {
  model: "NanoBananaEdit"
  prompt: string;
  inputImageUrls: string[]
  allowCache?: boolean
}

export interface ImgModel_NanoBananaPro {
  model: "NanoBananaPro"
  prompt: string
  resolution?: "1K" | "2K" | "4K"
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_NanoBananaProEdit {
  model: "NanoBananaProEdit"
  prompt: string;
  inputImageUrls: string[]
  resolution?: "1K" | "2K" | "4K"
  allowCache?: boolean
}

export interface ImgModel_NanoBanana2 {
  model: "NanoBanana2"
  prompt: string
  resolution?: "0.5K" | "1K" | "2K" | "4K"
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_NanoBanana2Edit {
  model: "NanoBanana2Edit"
  prompt: string;
  inputImageUrls: string[]
  resolution?: "0.5K" | "1K" | "2K" | "4K"
  allowCache?: boolean
}

/**
 * @deprecated gpt-image-1 is retired. From 2026-10-22 the server runs every request for it on GPT Image
 * 2.5 Flare, at the same sizes and with quality capped at "high". Use `ImgModel_GptImage2_5Flare`.
 */
export interface ImgModel_GptImage1 {
  model: "GptImage1"
  prompt: string;
  quality?: "low" | "medium" | "high"
  background?: "transparent" | "opaque" | "auto"
  stylePreset?: string
  allowCache?: boolean
}

/**
 * @deprecated gpt-image-1 is retired. From 2026-10-22 the server runs every request for it on GPT Image
 * 2.5 Flare, at the same sizes and with quality capped at "high". Use `ImgModel_GptImage2_5FlareEdit`.
 */
export interface ImgModel_GptImage1Edit {
  model: "GptImage1Edit"
  prompt: string;
  inputImageUrls: string[]
  quality?: "low" | "medium" | "high"
  background?: "transparent" | "opaque" | "auto"
  allowCache?: boolean
}

/**
 * @deprecated gpt-image-1.5 is retired. From 2026-10-22 the server runs every request for it on GPT Image
 * 2.5 Flare, at the same sizes and with quality capped at "high". Use `ImgModel_GptImage2_5Flare`.
 */
export interface ImgModel_GptImage1_5 {
  model: "GptImage1_5"
  prompt: string;
  quality?: "low" | "medium" | "high"
  background?: "transparent" | "opaque" | "auto"
  stylePreset?: string
  allowCache?: boolean
}

/**
 * @deprecated gpt-image-1.5 is retired. From 2026-10-22 the server runs every request for it on GPT Image
 * 2.5 Flare, at the same sizes and with quality capped at "high". Use `ImgModel_GptImage2_5FlareEdit`.
 */
export interface ImgModel_GptImage1_5Edit {
  model: "GptImage1_5Edit"
  prompt: string;
  inputImageUrls: string[]
  quality?: "low" | "medium" | "high"
  background?: "transparent" | "opaque" | "auto"
  allowCache?: boolean
}

export interface ImgModel_GptImage2 {
  model: "GptImage2"
  prompt: string;
  quality?: "low" | "medium" | "high"
  resolution?: "1K" | "2K" | "4K"
  background?: "transparent" | "opaque" | "auto"
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_GptImage2Edit {
  model: "GptImage2Edit"
  prompt: string;
  inputImageUrls: string[]
  quality?: "low" | "medium" | "high"
  resolution?: "1K" | "2K" | "4K"
  background?: "transparent" | "opaque" | "auto"
  allowCache?: boolean
}

export interface ImgModel_GptImage2_5Flare {
  model: "GptImage2_5Flare"
  prompt: string;
  quality?: "low" | "medium" | "high" | "xhigh" | "max"
  resolution?: "1K" | "2K" | "4K"
  background?: "transparent" | "opaque" | "auto"
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_GptImage2_5FlareEdit {
  model: "GptImage2_5FlareEdit"
  prompt: string;
  inputImageUrls: string[]
  quality?: "low" | "medium" | "high" | "xhigh" | "max"
  resolution?: "1K" | "2K" | "4K"
  background?: "transparent" | "opaque" | "auto"
  allowCache?: boolean
}

export interface ImgModel_GptImage2_5Sunburst {
  model: "GptImage2_5Sunburst"
  prompt: string;
  quality?: "low" | "medium" | "high" | "xhigh" | "max"
  resolution?: "1K" | "2K" | "4K"
  background?: "transparent" | "opaque" | "auto"
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_GptImage2_5SunburstEdit {
  model: "GptImage2_5SunburstEdit"
  prompt: string;
  inputImageUrls: string[]
  quality?: "low" | "medium" | "high" | "xhigh" | "max"
  resolution?: "1K" | "2K" | "4K"
  background?: "transparent" | "opaque" | "auto"
  allowCache?: boolean
}

export interface ImgModel_Ideogram4 {
  model: "Ideogram4"
  prompt: string;
  quality?: "low" | "medium" | "high" // used for the "rendering_speed" setting
  promptExpansion?: "None" | "Medium" | "Large"
  acceleration?: "none" | "low" | "regular" | "high"
  stylePreset?: string
  allowCache?: boolean
}

export interface ImgModel_Ideogram4Edit {
  model: "Ideogram4Edit"
  prompt: string;
  inputImageUrl: string
  quality?: "low" | "medium" | "high" // used for the "rendering_speed" setting
  promptExpansion?: "None" | "Medium" | "Large"
  acceleration?: "none" | "low" | "regular" | "high"
  allowCache?: boolean
}


/*
************** GENERATE AI TEXT INTERFACES ************
*/

type TextModel_Anthropic = "opus-5.5" | "opus-5.0" | "opus-4.8" | "opus-4.7" | "sonnet-5.5" | "sonnet-5.0" | "sonnet-4.6" | "haiku-4.5"

type TextModel_OpenAi = "gpt-5.6-terra" | "gpt-5.6-luna" | "gpt-5.4-mini" | "gpt-5.4-nano" | "gpt-4o"

export type iExternalGenTextModelName = TextModel_Anthropic | TextModel_OpenAi

type TextEffort_Anthropic = "low" | "medium" | "high" | "xhigh" | "max"

export interface iExternalGenTextModel {
  /** Which LLM to prompt. */
  model: iExternalGenTextModelName

  /**
   * The prompt. `${...}` expressions are evaluated against the current form fields first,
   * so `` `Write a birthday card for ${form.name}` `` works.
   */
  prompt: string

  /**
   * Upper bound for the generated text, in tokens. Defaults to the chosen model's maximum.
   */
  maxTokens?: number

  /**
   * How much the model thinks before it answers: more is slower and costs more tokens. Leave it out
   * to use the model's default (`medium` on opus-5.5, `high` on the others). A level the model does
   * not support is replaced by the closest one it does (`xhigh` on sonnet-4.6 becomes `high`), and
   * it is ignored for haiku-4.5 and the OpenAI models.
   */
  effort?: TextEffort_Anthropic

  /**
   * Publicly reachable image urls handed to the model alongside the prompt.
   */
  imageUrls?: string[]
}




export type AiTextEditOptionAllow = "allowAiTextRewrite" | "allowAiTextFixSpelling" | "allowAiTextAddMoreText" | "allowAiTextShortenText" | "allowAiTextChangeWritingStyle" | "allowAiTextGenerateQuiz";


export type ErrorName = "templateNotFound" | "addToBasketFailed"

export type externalMessageTopic = "SplitterFrameToText" | "ShowAlert" | "OpenImageUpload" | "MobileImagesUpload" | "MobileImagesRejected" | "BuyerUploadedImages";

export type appliedLayoutInfo = null | {
  // template name
  tn: string,

  // document name
  dn: string,

  // document id
  did: string,

  // snippet id
  id?: string,

  // split variant
  spvarid?: string | null

  /** isThemeDesign Flag */
  des: boolean
};

/******* PANEL UI ******/

interface iBcBaseTheme {
  mobile: iBcPanel[],
  desktop: iBcPanel[],
  breakpoint: number,
  logoUrl: string,
  logoUrlInvers: string,
  loadingImageUrl: string,
  animation: "bars" | "none";
  primary: iBcColor
  text: iBcColor
  name: string
  css: string,
  fontCss: string,
  fontFamily: string,
  hasFallbackCloseButton: "none" | "top-left",
  autoHeightOnMobile: boolean,
  icons: Partial<Record<iconName, string>>,
  lockedPrintessAspectMobile?: number,
  disableBasketButtonOnError: boolean,
  photoAnalysingAnimationLottieUrl: string,
  photoUploadPlaceholderUrl: string,
  photoPrintessMakeWizzardBackdropUrl: string,
  photoMagicPbWizzardBackdropUrl: string,
  photoAiDesignBookUrl: string,
  photoFreestyleBookUrl: string,
  photoBookCreationUrl: string
}


export type iShowPagesPreviewMode = "never" | "mobile" | "desktop" | "both";

/**
 * How a buyer-side table form field lets buyers jump to a group: the groups side by side as
 * clickable buttons, one dropdown listing them, or no navigation at all. Defaults to "none".
 */
export type iTableGroupNav = "pills" | "dropdown" | "none";

export type iBcTheme = iBcBaseTheme & { cssVariables: Record<string, string> }

export type iBcDefaultTheme = iBcBaseTheme & { cssClusters: Array<{ name: string, variables: Record<string, string> }> }

export interface iBcColor {
  '50': string
  '100': string
  '200': string
  '300': string
  '400': string
  '500': string
  '600': string
  '700': string
  '800': string
  '900': string
  '950': string
}

export type iBcPanelName =
  "BcPanelPages" |
  "BcPanelProperties" |
  "BcPanelTabNavigation" |
  "BcPanelBasket" |
  "BcPanelButtonBar" |
  "BcPanelCloseButton" |
  "BcPanelPagesMini" |
  "BcPanelHeaderDesktop" |
  "BcPanelHeaderBlank" |
  "BcPanelHeadline" |
  "BcPanelLogo"


export interface iBcPanel {
  name: iBcPanelName;
  dock: "left" | "right" | "top" | "bottom";
  size: number;
  keyBoardSize?: number;
  insert?: "start" | "end";
  hideOnKeyboardOpen?: boolean;
  background: string;
  borderLeft?: string;
  borderRight?: string;
  borderTop?: string;
  borderBottom?: string;
  borderWidth?: string;

  subSize?: string;
  settings: Record<string, string>
  subPanels?: Array<iBcPanel | "self">
}

export type iPanelOrientation = "vertical" | "horizontal" | "both"


export type formFieldListEntry = {
  key: string,
  label?: string, // multi-language??
  description?: string,
  imageId?: string,
  tag?: string,
  meta1?: string,
  meta2?: string,
  meta3?: string,
  meta4?: string,
  disabled?: boolean
}

export type iExternalButton = {
  /** only-image-upload hides all other upload buttons */
  location: "button-bar" | "image-upload" | "only-image-upload",
  label: string,
  hint?: string,
  icon?: iconName,
  /** only takes effect if no label is ste. "large" is default */
  iconSize?: "small" | "large",
  color: "primary" | "secondary",
  outline: "solid" | "outline",
  /** Where is the button is shown, default is everywhere */
  where?: "desktop" | "mobile",
  /** Callback executed on button click */
  clickCallback: () => any
}

export type iPanelSettingsKey =
  "close-button" | "undo-button" | "zoom-button" | "save-button" | "load-button" | "grid-button" | "proof-button" | "color-schemes" | "pages-preview" | "changeDockForLandscape" | "pagesInPreview" | "frame-bar-big" /* on/off */
  | "frame-bar-zoom" | "frame-bar-captions" | "close-button-style" | "headline-text" | "logo-text" | "headline-align" | "label-style" | "ok-button" | "layout" | "pricing" /* string */
  | "logo-mr" | "logo-ml" | "logo-mt" | "logo-mb" | "headline-mr" | "headline-ml" | "headline-mt" | "headline-mb" | "logoMaxHeight" /* Pixel */
  | "maxThumbWidth" | "maxThumbHeight" | "dockBottomSize" | "dynamicThumbSize" | "basketInPreview"; /* number */

/**
 * The `ui` half of the `{ api, ui }` pair that `printessLoader.load()` returns - the buyer UI around the editor.
 * Printess calls most members here itself; only a few are meant to be called by the surrounding website.
 * Those few carry a `#kb-ui` tag, and the Knowledge Base builds its "UI Object" reference page from them
 * (generate-api-reference.mjs reads this file). Tag a member when a shop page should call it, and write the
 * description for a shop developer - that text is what the page shows.
 */
export interface iPrintessComponent {
  /**
   * internal: the theme as CSS for the editor's rescue dialog, which comes up before the component has applied its theme,
   * and the component's own stylesheet (componentCss), which draws the dialog as the component's own dialogs
   */
  getRescueDialogTheme?(templateThemeName: string): Promise<{ css: string, fontCss: string, componentCss?: string } | null>
  /**
   * Covers the editor with a progress overlay and shows your message in it.
   * Use it while your own shop code is working, for example after the add-to-basket callback,
   * and always end with `hideProgressOverlay()`.
   * @param msg The message to show in the overlay.
   * #kb-ui
   */
  showProgressOverlay(msg: string): void
  /**
   * Removes the progress overlay that `showProgressOverlay()` opened.
   * #kb-ui
   */
  hideProgressOverlay(): void
  hasProgressOverlay(): boolean
  showPhotobookProgress(msg: string, percent: number): void
  hidePhotobookProgress(): void
  hasPhotobookProgress(): boolean
  isModalDialogOpen(): boolean
  notifyUpcomingPriceChange(): void
  propertyChangedBySystem(propertyId: string, newValue: any): void
  reloadFormFieldTab(): void
  selectionChangeCallback: externalSelectionChangeCallback
  spreadChangeCallback: externalSpreadChangeCallback
  docChangeCallback: externalDocChangeCallback
  reset(options: { keepOverlay?: boolean, keepSelection?: boolean, keepTab?: boolean, keepErrors?: boolean, keepPreview?: boolean }): Promise<void>
  resetWizzards(): void
  clearIgnoredErrors(): void
  /** internal: back to the edit view (book preview, pages preview) when a template loads */
  leavePreviews?(): void
  /** internal: closes the open wizards (photo book, design) when a template loads */
  closeWizards?(): void | Promise<void>
  /** internal: closes the open dialogs (validation, confirm) when the editor hides or a template loads */
  closeDialogs?(): void | Promise<void>
  receiveMessage(topic: externalMessageTopic, data: Record<string, any>): void
  refreshPagination(): void
  refreshUndoRedoState(): void
  /**
   * Writes the price, the old price and the legal notice into the basket panel of the editor.
   * Call this from your `priceChangeCallback` as soon as your shop has calculated the new price.
   * @param info The price to show, and optionally an old price, a legal notice and the product name.
   * #kb-ui
   */
  refreshPriceDisplay(info: iExternalPriceDisplay): void
  updatePageThumbnail(spreadId: string, pageId: string, url: string): void,
  startPageThumbnail(spreadId: string, pageId: string): void,
  stopPageThumbnail(spreadId: string, pageId: string): void,
  imageListChangeCallback(): void,
  /**
   * Hides the fullscreen editor and closes its open dialogs. Printess also detaches its event handlers,
   * so your page works normally again while the editor is hidden. In an integration with a `container`
   * your page owns that element, so nothing is hidden here.
   * #kb-ui
   */
  hide(): void,
  /**
   * Shows the fullscreen editor again after `hide()`, and attaches its event handlers again.
   * The design stays as the **Buyer** left it. In an integration with a `container` your page owns that
   * element, so nothing is shown here.
   * #kb-ui
   */
  show(): void,
  writeSetting(key: iPanelSettingsKey, value: string),
  /**
   * Opens a dialog in the style of the editor, with your headline, your message and an OK and a Cancel button.
   * Your `callback` runs when the **Buyer** presses OK, your `cancelCallback` when they press Cancel.
   * Return `"keep-open"` from either one to leave the dialog open.
   * @param options The headline, the labels, the message and the callbacks of the dialog.
   * @returns The content element of the open dialog, so you can put your own HTML into it.
   * #kb-ui
   */
  openGenericDialog(options: IGenericDialogOptions): Promise<HTMLDivElement>,
  /**
   * Closes the dialog that `openGenericDialog()` opened. Your `cancelCallback` does not run.
   * #kb-ui
   */
  closeGenericDialog(): void,
  /**
   * Greys out the OK and the Cancel button of the open dialog and stops them from reacting to a click.
   * Use it while your own code is working on what the **Buyer** entered.
   * #kb-ui
   */
  disableGenericDialogButtons(),
  /**
   * Makes the OK and the Cancel button of the open dialog clickable again after `disableGenericDialogButtons()`.
   * #kb-ui
   */
  enableGenericDialogButtons(),
  selectMenuKeyword(keyword: string): void
  clearLayoutSnippetCache(): void
  applyBackgroundSnippet(snippetUrl: string): Promise<void>
  closePropertiesOverlay(): void
  closeMobileOverlay(): void
  showTextEditOverlay(): void
  hasMiniPageNav(): boolean
  getLastDragContent(): "sticker" | "image-id" | "background" | null
  getLastDragImageId(): string | undefined
  /**
   * Loads another **Buyer Side UI** theme into the open editor, by its name in the **Theme Manager**.
   * The design of the **Buyer** stays as it is, only the user interface around it changes.
   * @param themeName The name of the theme, or an empty string for the default theme.
   * #kb-ui
   */
  loadTheme(themeName: string): Promise<void>
  /**
   * Returns the name of the theme the editor shows at the moment.
   * #kb-ui
   */
  currentTheme(): string
  isFullyLoaded(): boolean
  setIsSinglePhotoDistributionInProgress(value: boolean): void;
  /**
   * Runs the add-to-basket flow of the editor's basket button, for a website which triggers the checkout from a
   * button of its own. It waits for running image uploads, validates all inputs - a validation error shows the
   * validation dialog and ends the flow here -, runs the "onCheckout" script, saves the design and finally calls
   * the `addToBasketCallback` of your attach parameters. It does nothing before a template has loaded.
   * #kb-ui
   */
  addToBasket(): Promise<void>
  /** internal: Printess drives its own tabs, and `iPrintessApi` has a selectTab of its own - never mark this one for the Knowledge Base */
  selectTab(tab: "#NONE" | "#LAYOUTS" | "#PHOTOS" | "#THEME" | "#PAGES" | "#ADD-TEXT" | "#ADD-IMAGE" |
    "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2" | string): void
}


export type PanelUiHintPos = "zoom-in" | "image-upload";
export type PanelUiHintView = "mobile" | "desktop" | "all" | "none";
export interface PanelUiHint {
  view: PanelUiHintView,
  pos: PanelUiHintPos
}
export type iInitialPropertiesClusterType = "group" | "boxes" | "background" | "ffs" | "layout-snippets";

export interface iInitialPropertiesCluster {
  slimIdPrefix: string,
  context: iInitialPropertiesClusterType,
  top: number,
  propertyIds: string[]
}

export type SlimCLusterType = "form-fields" | "layout-snippets" | "frame-properties" | "background";

export interface iSlimSnippetMenuCategory {
  topics: Array<iSlimSnippetMenuTopic>
  name: string
  //title: string
}
export interface iSlimSnippetMenuTopic {
  snippets: Array<iSlimSnippet>;
  keywords: Array<string>;
  name: string;
  //title: string;
  id: string;
}
export interface iSlimSnippet {
  title: string;
  snippetId: string;
  thumbUrl: string;
  extSnippetUrl: string;
  aspect: number;
}

export interface iInitialPropertiesPreview {
  docName: string,
  pageCount: number,
  facingPages: boolean,
  /** Missing only in older templates */
  pageWidth?: number,
  /** Missing only in older templates */
  pageHeight?: number,
  /**
   * The subset of `iInitialProperties.clusters` this preview document actually shows: clusters whose
   * frames sit on the preview document itself or on a document-page placed on it as a sub document,
   * plus form-fields which are global or pinned to one of those documents. A sub document frame shows
   * exactly one spread, so only the properties of that spread are listed, not those of the whole
   * multi-page document. A form-field pinned to several documents appears on every preview showing any
   * of them. Documents which are also flagged as "Preview" list only the form-fields pinned to them.
   * Cluster order and `slimIdPrefix` match the global `clusters` array, only `propertyIds` is narrowed.
   * Only present when "Per Preview Properties" is enabled for the template, otherwise Slim-UI should
   * fall back to the global `clusters`.
   */
  clusters?: Array<iInitialPropertiesCluster>;
  /**
   * `clusters` narrowed down once more per page of this preview document, indexed by the same page
   * index `setPreview()` and `getPreviewImageInfo()` take - so `pageClusters.length` is `pageCount`,
   * and both pages of a facing-pages spread carry the properties of that spread. Slim-UI shows one
   * page of a preview document at a time, so this is the list to display; `clusters` is the union
   * over all pages and stays the fallback.
   * Only written when "Per Preview Properties" is enabled AND the document has more than one page -
   * for a single page preview `clusters` is already exact.
   */
  pageClusters?: Array<Array<iInitialPropertiesCluster>>;
  /**
   * The page indices of this preview document which show where a layout snippet or a merge puts its
   * frames: the laid out spread of the design document, the one the layout snippet clusters are
   * defined on. Empty when this preview does not show it.
   *
   * A layout snippet and a merge template arrive in Slim-UI as their own initial properties, which
   * know nothing about this template's preview documents. This tells Slim-UI which pages their new
   * properties belong to instead of guessing from the layout being replaced - and instead of showing
   * them on every page when there is no previous layout to learn from, as on first load of a merge.
   * Only present when "Per Preview Properties" is enabled for the template.
   */
  layoutPages?: Array<number>;
}

export interface iInitialProperties {
  /** @deprecated ffProps now contained in frameProps */
  ffProps?: Array<iExternalProperty>
  /** contains all kind of properties */
  frameProps: Array<iExternalProperty>
  previews: Array<iInitialPropertiesPreview>
  clusters: Array<iInitialPropertiesCluster>
  aspect: number
  acceptDefaultTextIfMandatory: boolean
  priceCategoryLabels: { [key: string]: string },
  colors: Array<{ name: string, color: string, groupName: string }>,
  fonts: Array<{ name: string, thumbUrl: string, displayName: string, familyName: string, weight: number, isItalic: boolean, groupName: string }>,
  fontSizesInPt: Array<number>,
  fontSizesInPercent: Array<number>,
  paragraphStyles: Array<{ class: string, css: string }>,
  enableCustomColors: boolean,
  scaledImageMinimumDpi: number,
  genImageFrameMultiplier?: number,

  layoutSnippetSearchTags: Array<string> | null,
  layoutSnippetMenuId: string | null,
  includeGlobalSnippets: boolean,
  layoutCategories: iSlimSnippetMenuCategory[] | null // removed in Version 3
  /** 1: Start Version
   *  2: Version with pre-sorted clusters and all ffs in "frameProps"
   *  3: Layouts snippets are dynamically loaded by slim-ui (layoutSnippetSearchTags)
   */
  version: number

  // showCropOverlayButtons: boolean, //Needs A11y 3rd iteration merged first
}

export type iFormFieldProperty = {
  name: string,
  addNew?: "text" | "label",
  addPosition?: "top" | "bottom",   // TODO: Support position
  regExp?: string,
  regExpMessage?: string,
  info?: string,
  maxChars?: number,
  priceDisplay?: number,
  pricePrefix?: string,
  pricePostfix?: string,
  hasPerLetterPricing?: boolean,
  isMandatory?: boolean,
  clearOnFocus?: boolean,
  priceRelevant?: boolean,
  list?: Array<formFieldListEntry>,
  visibility?: "admin" | "buyer" | "condition",
  condition?: string,
  caption?: string,
  classNames?: string
}

export type iFormFieldNameValue = {
  name: string,
  value: string | object
}

export interface IProduct {
  id: string,
  displayName?: string,
  thumbnailUrl?: string,
  shopUrl?: string
}

export interface IShopData {
  shopId: string,
  shopUserId: string,
  product: IProduct,
  data?: unknown,
}

export interface ISavedShopData {
  shopData: IShopData;
  saveToken: string;
  displayName: string;
  thumbnailUrl: string;
  savedOn?: Date;
  expiresOn?: Date;
}

export interface ISaveShopData {
  shopData: IShopData;
  saveToken: string;
  displayName: string;
  thumbnailUrl: string;
}


/**
 * All callbacks Printess can fire into the host UI. Every callback is optional;
 * pass the ones your UI needs as part of ```printessAttachParameters```.
 * A buyer UI minimally handles selection/spread changes plus the basket flow.
 * #ai-api:core
 */
export interface printessCallbacks {
  /**
   * If you application displays a loading animation, this call tells you to start
   * your fade-out animation. Loading will be done soon.
   */
  loadingFadeCallback?: () => void;

  /**
   * Printess has completely loaded the requested template and is now ready to operate.
   */
  loadingDoneCallback?: () => void;

  /**
   * Fires when an template has been opened from the open menu.
   */
  templateOpenedCallback?: (templateName: string, hasPublishedVersion: boolean) => void;

  /**
  * Fires when an template has been saved and published.
  */
  templatePublishedCallback?: (templateName: string) => void;

  /**
   * For every Form Field which is set to **Impact-Price**
   * Printess fires a callback when the value has changed
   */
  formFieldChangedCallback?: externalFormFieldChangeCallback;

  /**
   * Here is the place to draw your properties ui.
   * It gets passed all the current properties and the current scope
   * for the scope "document" means no selected frame and "frames" are selected frames
   */
  selectionChangeCallback?: externalSelectionChangeCallback;

  /**
   * Fires whenever the user selects a new page/spread and passes snippet-lists and spread-info.
   * Now it's time to redraw **Layout-Snippets** and **Group-Snippets/Stickers**
   */
  spreadChangeCallback?: externalSpreadChangeCallback;

  /**
  * Fires whenever the user selects a new document
  */
  docChangeCallback?: externalDocChangeCallback;

  /**
   * To indicate selectable frames Printess fires this callback where you can
   * provide a custom div
   */
  getOverlayCallback?: externalGetOverlayCallback;

  /**
   * Arbitary method used to send messages from printess to the web-ui.
   * Current usages:
   *    `topic="SplitterFrameToText" data={}` Indicates that the user has converted a splitter image to a text frame
   *    `topic="ShowAlert",  data.text="The text to display"`  Asks for an alert box to be shown to the user.
   *    `topic="BuyerUploadedImages",  data.images = iExternalImage[]`  Asks for an alert box to be shown to the user.
   *    `topic="MobileImagesRejected",  data.count = number`  Tells how many of the images announced by the phone upload failed and will not arrive.
  */
  receiveMessageCallback?: receiveMessageCallback;

  /**
   * Is called when the page navigation has changed (and needs redraw) but selection has stayed the same.
   */
  refreshPaginationCallback?: refreshPaginationCallback;

  /**
   * Is called when the undo state has changed (and needs redraw of buttons)
   */
  refreshUndoRedoCallback?: refreshUndoRedoCallback;

  /**
   * Is called when the page thumbnail has been updated to allow buyer-ui to refresh a particular thumbnail only
   */
  updatePageThumbnailCallback?: updatePageThumbnailCallback;

  /**
   * Provide a callback function which is called when the buyer presses the [Add to Basket] button
   * Design is automtically saved and function gets a [token] to load or print this design.
   */
  addToBasketCallback?: (saveToken: string, thumbnailUrl: string) => void,

  /**
   * Provide a callback function which is called when the buyer presses the [Back] button
   * Design is automatically saved and function gets a [token] to load or print this design
   */
  backButtonCallback?: (saveToken: string, thumbnailUrl: string) => void,

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * Design is automatically saved and function gets a [token] to load or print this design
   */
  saveTemplateCallback?: (saveToken: string, type: "save" | "close", thumbnailUrl: string) => void,

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * A save dialog will open and depending on login state the user can login, register or if logged in save the project with a custom displayName
   */
  getShopDataCallback?: (() => Promise<IShopData>),

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * Information about the login state of the user is required
   */
  isShopUserLoggedInCallback?: (() => Promise<boolean>),

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * Information about the display name of the product is required
   */
  getShopProjectDisplayNameCallback?: (() => Promise<string>),

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * Information about the shopData of the user is provided
   */
  getShopSavedDataCallback?: ((shopData: IShopDataProjectName) => void),

  /**
  * Provide a callback function which is called when the buyer presses the [Load] button and is loading a saved project
  * This callback can be used to reinitialize the integration (switching variants / update pricing etc)
  */
  shopDataLoadedCallback?: ((data: ISavedShopData) => void),

  /**
   * Provide a callback function which is called when the buyer presses the [Save] button
   * If the user is not logged in yet the shopLoginCall is required to return if the user click login/register button
   * Besides saveToken, thumbnailUrl and custom project name (displayName) are returned for saving the template
   */
  getShopLoginCallback?: ((type: "register" | "login", saveToken: string, thumbnailUrl: string, displayName: string) => void),

  /**
   * Provide a callback function which is called when the buyer presses the [Load] button
   * No automatic save is executed before.
   */
  loadTemplateButtonCallback?: () => void,

  /**
   * Provide a callback function which is called whenever the buyer-image-list changed or an image is assigned to a frame
   * Use it, to redraw your buyer-image list if you have one.
   */
  imageListChangeCallback?: () => void,


  /**
   * Will be raised if any price relevant information of the design has been changed
   */
  priceChangeCallback?: externalPriceChangeCallback,

  /**
   * Will be raised if any price relevant information of the design has been changed
   */
  zoomChangeCallback?: externalZoomChangeCallback,

  /**
   * Provide a callback function which is called when an error happens.
   */
  errorCallback?: (errorName: ErrorName, data?: Record<string, string>) => void

  /**
   * Triggered when a call using AI credits is made.
   * Possible ai parameter values are:
   * "upscale", "upscale (CutoutPro)", "nsfw", "remove background", "remove background (CutoutPro)", "countour", "face swap", "text generation",
   * "Segment Anything", "Segment Anything 3",
   * "segment face", "segment face (CutoutPro)",
   * "GPT Image 1", "GPT ImageEdit",
   * "OpenAi Image Edit - low", "OpenAi Image Edit - medium", "OpenAi Image Edit - high",
   * "GPT Image 1.5 - low", "GPT Image 1.5 - medium", "GPT Image 1.5 - high",
   * (both retired: from 2026-10-22 the server runs GPT Image 1 and 1.5 on GPT Image 2.5 Flare)
   * "GPT Image 2 - low", "GPT Image 2 - medium", "GPT Image 2 - high",
   * "GPT Image 2.5 Flare - low", "GPT Image 2.5 Flare - medium", "GPT Image 2.5 Flare - high", "GPT Image 2.5 Flare - xhigh", "GPT Image 2.5 Flare - max",
   * "GPT Image 2.5 Sunburst - low", "GPT Image 2.5 Sunburst - medium", "GPT Image 2.5 Sunburst - high", "GPT Image 2.5 Sunburst - xhigh", "GPT Image 2.5 Sunburst - max",
   * "Nano Banana",
   * "Nano Banana Pro", "Nano Banana Pro - 2K", "Nano Banana Pro - 4K",
   * "Nano Banana 2 - 0.5K", "Nano Banana 2", "Nano Banana 2 - 2K", "Nano Banana 2 - 4K",
   * "Flux Ultra", "Flux Pro", "Flux Dev", "Flux Schnell", "Flux 2 Klein 4B", "Flux Pro Kontext"
   * "Claude Design", "Script Creation"
   * "SDXL", "Ideogram 4 - low", "Ideogram 4 - medium", "Ideogram 4 - high",
   * "opus-5.5", "opus-5.0", "opus-4.8", "opus-4.7", "sonnet-5.5", "sonnet-5.0", "sonnet-4.6", "haiku-4.5",
   * "gpt-5.6-terra", "gpt-5.6-luna", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4o",
   */
  onAiUsageCallback?: (ai: string, credits: number) => void

  /**
   * Triggered when the user changes a Tab
   * tabId can have this values: "#NONE" | "#LAYOUTS" | "#PHOTOS" | "#THEME" | "#PAGES" | "#ADD-TEXT" | "#ADD-IMAGE" | "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2" | string;
   */
  uiTabChangeCallback?: externalTabChangeCallback
}


export interface iMakeData {
  businessName: string,
  businessType: string,
  valueProposition: string,
  language: string,
  logoUrl: string,
  email: string,
  website: string,
  tel: string,
  addressLine1: string,
  addressLine2: string,
  addressLine3: string
}

/**
 * Everything attachPrintess() accepts: authorization (token), template to load,
 * the div to render into, UI configuration and all printessCallbacks.
 * #ai-api:core
 */
export interface printessAttachParameters extends printessCallbacks {
  resourcePath?: string;
  domain?: string;
  token?: string;
  uploadProvider?: UploadProvider;
  div: HTMLDivElement;
  makeData?: iMakeData;

  /** New Parameters */
  container?: HTMLDivElement;
  mobileMargin: { top: number, bottom: number, left: number, right: number }
  desktopMargin: { top: number, bottom: number, left: number, right: number }

  /**
   * when used in shop (shop token) scenario, you MUST provide basketId
   */
  basketId?: string,
  /**
   *  when used in shop (shop token) scenario, you CAN provide shopUserId
   */
  shopUserId?: string,

  /**
   * The template to load: a template name or a save token. Mandatory for `loader.load()` (the panel UI), which rejects
   * without one; `attachPrintess()` without the panel UI takes a call without one.
   */
  templateName?: string;
  /**
   *  The template version to load. For production you should go with "published" which is the default.
   * */
  templateVersion?: "draft" | "published",

  /**
   * Optional parameter to merge any number of templates during load
   */
  mergeTemplates?: iMergeTemplate[];

  /**
   * Optional parameter for a content template (save token).
   * This save token can be used to fill out buyer editable images and texts automatically.
   * The content of this template is taken and applied to the template which should be loaded.
   */
  contentTemplate?: {
    saveToken: string,
    content?: "all" | "images" | "text"
  };

  /**
   * Optional parameter to merge all frame and document properties which have an exchange-id set.
   * It loads an existing save token and takes over data onto the newly loaded template.
   * It also can take overform-field values.
   */
  loadExchangeData?: {
    saveToken: string,
    exchangeFormFields: boolean,
    exchangeFrames: boolean,
    exchangeDocuments: boolean
  },

  /**
   * Usually exchange state (everything with exchange ids) is applied on template load or attach. With this setting you can skip it.
   * Please note exchange state is always cleared after attach or template load.
   */
  skipExchangeStateApplication?: boolean;

  /**
   * The rescue mode protects the buyer's changes when the buyer reloads the page by accident, or when the browser crashes.
   * The editor keeps a copy of the buyer's changes in the browser's IndexedDB.
   * When the page attaches the same template again, the editor shows a dialog that asks the buyer whether to restore the copy.
   * `rescueMode` decides what "the same" means, or switches the rescue mode off. `"auto"` by default.
   *
   * `"auto"`: the template setting decides. You find it in the template's buyer side settings ("Other Settings", "Rescue Mode").
   * A template whose rescue mode is `"auto"` (the default) uses the account setting.
   * You find the account setting in the account portal, under "Integration & Workflow Settings", "Advanced Settings".
   * It is `"strict"` by default. It can also be `"template"` or `"disabled"`.
   * A value passed here (`"strict"`, `"template"` or `"disabled"`) wins over the template setting and the account setting.
   *
   * `"disabled"`: the editor keeps no copy and offers none. When the account setting or the template setting disables the rescue mode,
   * the editor also deletes the copy that the browser kept before.
   *
   * `"strict"`: the page must attach the same `templateName` (or save token) with the same parameters as the page that made the copy.
   * These parameters must be the same: `templateVersion`, `templateUserId`, `mergeTemplates`, `loadExchangeData`, `skipExchangeStateApplication`, `contentTemplate`,
   * `formFields`, `formFieldsUrl`, `formFieldProperties`, `bookInsidePages`, `bookSettings`, `singlePrintsSettings` and `photobookThemeMenuId`.
   * If one of them has a different value, the editor loads the template fresh and drops the copy. So a restore never gives the buyer a design that the shop does not ask for anymore, for example in another size.
   * For `formFieldsUrl` the editor compares the URL, not the content behind it.
   * The editor also does not offer the copy when exchange state was stored after the copy was made (`persistExchangeState()`). The fresh template gets that exchange state.
   * The parameters are already part of the copy, so the editor does not apply them again. The buyer keeps the changes they made in the editor.
   *
   * `"template"`: the page must attach the same `templateName` (or save token) with the same `mergeTemplates` (compared by their `templateName`).
   * The other parameters can be different.
   * The editor applies `formFields`, `formFieldsUrl`, `formFieldProperties`, `bookInsidePages`, `bookSettings`, `singlePrintsSettings` and `photobookThemeMenuId` on top of the restored copy,
   * but only the ones that the page passes with a different value than the page that made the copy. For `formFields` this is decided per form field.
   * So the buyer keeps the changes they made in the editor, and a value that the shop changed in between still reaches the design.
   * `templateVersion`, `templateUserId`, `loadExchangeData`, `skipExchangeStateApplication`, `contentTemplate` and stored exchange state only work on a fresh template.
   * With a restored copy the editor does not apply them, and it drops stored exchange state.
   *
   * For all modes:
   * The dialog uses the translation keys `ui.rescueTitle`, `ui.rescueQuestion`, `ui.rescueRestore` and `ui.rescueStartOver`.
   * It looks like the dialogs of BCUI, in the theme BCUI is about to show. Without BCUI it uses the primary color of the editor.
   * If the buyer chooses to start over, the editor loads the template fresh.
   * The editor only asks when the buyer changed the design after it was loaded. A copy without changes is never offered.
   * After a restore, the editor calls `formFieldChangedCallback` for every price-relevant form field, with the value of the restored design.
   * It does this after loading is done, after the attach parameters are applied, and after the form field values the page sets right after attach (`setFormFieldValue()`).
   * The editor drops the copy when the design goes to the basket (`addToBasketCallback`). It does not restore a copy that is older than 24 hours.
   * The browser keeps only one copy. The editor that was attached last owns it.
   * The rescue mode is always off in browsers controlled by automation (`navigator.webdriver`), since nobody is there to answer the question.
   * Where the browser does not allow IndexedDB, the editor works as before, without a copy.
   */
  rescueMode?: "auto" | "strict" | "template" | "disabled";

  /**
   * Activated by default. Deactivating `allowZoomAndPan` freezes the visible Area of the current document.
   * The buyer will not be able to zoom or pan at all. It's handy for simple configurattions on desktop and conjunction with ```autoScale```
   * Handle with care on mobile, since users proably need zoom to have a closer look on their products.
   */
  allowZoomAndPan?: boolean;

  /**
   * 'false'' by default. Setting to 'true' will DENY ANY interaction of the user with the printess-editor-stage.
   * Zoom & Pan and even frame selection is not possible anymore.
   * This setting is useful if you use printess as a static view only.
   * For example in a mobile scenario where the user should scroll force and back to between preview and form-fields.
   * Make sure you pass a container set to "height: auto", when using this setting.
   */
  noUserInteractionOnStage?: boolean;

  /**
   * indicates that new Panel-UI (BCUI) and forces printess to act different in certain ways
   * provides also api to the printessComponent / Panel-UI
   */
  printessComponent?: iPrintessComponent;

  /**
   * Auto scale document view.
   * Mostly useful on iOS devices which tend to crash when using big document sizes.
   * "auto" will automatically check for Safari on iOS devices.
   * Please set it to "always" when using Printess in iOS apps!
   * Default: "auto"
   */
  scaleDocumentView?: "auto" | "always";


  /**
   * When zooming to a selected page, Printess uses a viewport transition. You can either set the transition duration in seconds or pass **0** to
   * turn animation of completely.
   */
  zoomDuration?: number;

  /**
   * How much empty space is left around the page when Printess fits a spread into the viewport, in
   * document pixels.
   *
   * Set this when the editor sits in a layout of your own and the default framing does not suit it: a
   * larger value pulls the page away from the edges, `0` fits it edge to edge. The value is the space
   * around the whole spread, so each side gets half of it.
   *
   * **It overrides the document's own setting.** Each document carries a `zoomPadding` the designer
   * chose (50 unless they changed it), and a host page knows its own viewport better - so passing this
   * wins for every document. Leave it out and each document keeps its own value, which is the previous
   * behaviour and stays the default.
   *
   * A negative value is ignored rather than applied, since it would zoom the page past the viewport.
   */
  zoomPadding?: number;

  /**
   * The AI auth token you created via https://api.printess.com/ai/auth/create to authenticate AI requests.
   */
  aiAuthToken?: string;

  /**
   * Auto scale is only usefull when `allowZoomAndPan`is disabled.
   * Printess will adjust its width or height in between the given dimensions to meet the aspect ratio of the loaded document.
   */
  autoScale?: {
    maxWidth: number;
    maxHeight: number;
  };

  /**
   * list if custom-translations to be used by Printess buyer-side.
   * If set, it overrides all translations from your account-settings
   * https://printess.com/kb/api-reference/custom-integration.html#translations
   */
  translations?: Record<string, Record<string, string> | string>;

  /**
   * Pass key of desired languages, fallbacks to "auto" -> window.navigator.language
   */
  translationKey?: string | "auto";

  /**
   * To prevent the use of offensive language in customizeable texts, you can pass a list of forbidden words.
   * The use of offensive words can either throw an error during the validation or trigger the replacement of a bad word.
   * https://printess.com/kb/api-reference/custom-integration.html#offensive-language
   */
  offensiveWords?: string,

  /**
   * Enables offensive word check for all editable text frames
   */
  offensiveCheckAll?: boolean,


  /**
   * If text is set to mandatory, it only check for empty text input
   * instead of disallowing the default-value. Comes in handy if you write a name like "Axel" in
   * your text box and still want to to turn on mandatory.
   */
  acceptDefaultTextIfMandatory?: boolean

  /**
   * Default value is `true`
   * Set to `false` to avoid that buyer moved/scaled frames will be re-declared as stickers.
   */
  removeLayoutSnippetOriginOnUserInteraction?: boolean

  /**
  * Disables thumbnail-creation when pressing the add to basket button.
  * Its checked only in uiHelper
  * Thumbnails can independendtly created with:
  * `const url = await printess.renderFirstPageImage("thumbnail.png");`
  */
  noBasketThumbnail?: boolean

  /**
   * Optional: set frame warnings via api (can be set in template-presets as well)
   */
  showFrameWarnings?: "sign and hint" | "sign only" | "hint only" | "none";

  /**
   * Turns animations for selected frames of, no matter what is set in the template.
   */
  buyerSelectionAnimation?: boolean;

  /** turns "Unsaved Changes" warning when user closes editor on or of */
  showAlertOnClose?: boolean;

  /**
   * Overides Paste Board Color for all loaded documents
   * Expects a Hex-Color-Value like "#FF0000"
   * Opacity is added automatically according to documents settings.
   * Don't pass opacity in this parameter. Don't use rgb() or rgba() syntax.
   */
  pasteBoardColor?: string,

  /**
   * Force Showing Buyer-Side (Only valid if Service-Token is passed)
   * When Token is Shop-Token, Printess alwyas switches to Buyer-Side.
   */
  showBuyerSide?: boolean;

  /**
   * Elevates the users rights to "BuyerDesigner" which allows the buyer to lock and un-lock buyer-rights and
   * offers more advanced settings in the buyer side.
   * It also enables the expert mode, no matter if the template has it enabled or not.
   */
  isBuyerDesigner?: boolean;


  /**
   * Set page count of book inside pages on attach with this parameter.
   */
  bookInsidePages?: number;

  /**
   * You can pass a full set or some book settings on attach
   */
  bookSettings?: iExternalBookSettings

  /**
   * Overrides the template's photobook theme menu id on attach.
   * !Pass the Menu-ID not the name here!
   * You can copy from the ui in the Account Portal.
   */
  photobookThemeMenuId?: string

  /**
   * The number of images a single prints template takes. Both must be set, with `maxImages` above `minImages`.
   */
  singlePrintsSettings?: { minImages: number, maxImages: number }

  /**
   * URL of a json file with form field values: `{ "environment": { "<form field name>": "<value>", ... } }`.
   * A string value is set as it is, an object value as its json. Applied after `formFieldProperties` and before `formFields`.
   */
  formFieldsUrl?: string;

  /**
   * The initial form fields you want to fill.
   */
  formFields: Array<iFormFieldNameValue>;


  /**
   * Other initial form-field properties you want to change on attach
   * Form field is indentified by name and paramters are set accordingly
   * to enable the priceRelevant you will need special permissions.
   */
  formFieldProperties: Array<iFormFieldProperty>;

  /**
   * Pannel-UI only:
   * Add custom buttons to the ui.
   */
  buttons: Array<iExternalButton>

  /**
  * Minimum width of any image loaded in the browser
  * Default is 1600, best alternatives are 200, 400, 800
  * If you display the Printess editor very small in your website/shop
  * you might want to avoid the editor loading large images into memory.
  * You can also set **minImageWidth** for certain products with many pages.
  */
  minImageWidth?: number;

  /**
   * Set the ui-theme for new panel-ui
   */
  theme?: iBcTheme | string

  /**
   * Only valid for Panel-UI (BCUI)
   * Default is showing the loading animation
   */
  suppressLoadingAnimation: boolean

  /** only for internal debugging  */
  useBCUILocalCode: boolean
  useLocalBuyerJs: boolean

  /** optional name of sort index  */
  sortIndex?: string;
  /** optional tells if printess iframe should show the gallery first  */
  showGallery?: boolean;
  /** optional name of inital category (name from keyword menu) -> for gallery and layout-snippet tab */
  initialCategory?: string;
  /** optional name of inital topic (name from keyword menu) -> for gallery and layout-snippet tab  */
  initialTopic?: string;


  /**
   * Height of the printess canvas in pixel below which the current selection is zoomed.
   * Default value is 400. So if the height of printess canvas drops below 400px the frame zoom behaves like on mobile.
   */
  maxHeightForZoomingToFrames?: number,

  /**
   * The public key which is used to verify the used JWT.
   * Do not touch this parameter when using the Printess public API.
   */
  siginingPublicKey?: string

  /**
   * Activates Printess-Debug-Outputs
   */
  debug?: boolean;

  /**
   * Activate new Text-Area sync for Multi-Line inline editing
   */
  useTextAreaSyncOnMobile?: boolean,

  /**
   * Labels displayed at stickers which have a price categorie-number set
   * e.g. ["1,50â‚¬","2,50â‚¬","3,50â‚¬","4,50â‚¬","5,50â‚¬"]
   */
  snippetPriceCategoryLabels?: Array<string>


  /**
   * Labels displayed at form-fields which have a price tag set
   * e.g. \{
          "mug-front": "+ 2.10 â‚¬",
          "mug-back": "+ 2.10 â‚¬",
        \}
   */
  priceCategoryLabels?: Record<string, string>



  showSplitterGridSizeButton?: boolean,
  showBoxMenuUploadButton?: boolean,

  /**
   * Globally activates image-pixel-size-hints for all templates
   * Is false by default.
   * (hint is shown close to the upload button)
   */
  showImageSizeHint?: boolean

  /**
   * Enables the save button for all templates
   */
  showSaveButton?: boolean

  /**
  * Enables the load button for all templates
  */
  showLoadButton?: boolean

  /**
   * Enables the save and close button for all templates
   */
  showSaveAndCloseButton?: boolean

  /**
   * Icons to overwrite the Printess provided ones.
   * The value of an icon must be an svg.
   * ```js
  *   icons: {
  *         "undo-arrow": "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' viewBox='0 0 46 46'><defs><style>.cls-1 {fill: none;stroke: currentColor;stroke-linecap: round;stroke-linejoin: bevel;stroke-width: 5px;}</style></defs><g><g id='Ebene_1'><path d='M4.1,16l11.7,8.8c1,.7,2.4,0,2.4-1.2V6c0-1.2-1.4-2-2.4-1.2L4.1,13.6c-.8.6-.8,1.8,0,2.4Z'/><path class='cls-1' d='M13.5,14.8h15.2c6.5,0,11.8,5.3,11.8,11.8s-5.3,11.8-11.8,11.8h-15.2'/></g></g></svg>"
  *   }
   * ```
   */
  icons?: Partial<Record<iconName, string>>


  /**
   * List of scripts that add to or overwrite the template scripts
   * The value of a script must be js-string.
   * ```js
   *    scripts: {
   *       "my-script": "function() { alert('Hello World') }"
   *    }
   * ```
   */
  scripts?: Record<string, string>

  /**
   * Url from Logo to show in buyer side.
   */
  shopLogoUrl?: string

  /**
   * Maximum width of basket thumbnails. Default 400. Maximum of 1000 is allowed.
   */
  basketThumbnailMaxWidth?: number

  /**
   * Maximum height of basket thumbnails. Default 400. Maximum of 1000 is allowed.
   */
  basketThumbnailMaxHeight?: number

  /**
   * Experimental feature to upload images in the background and make them available directly as a temporary blob image for so long.
   * Can only work for images without effects or assign actions.
   */
  useBlobWhileImageUploadsInBackground?: boolean

  /**
   * BCUI-EDIT is passed here to indicate theme editor.
   */
  hostApplication?: string

}

/**
 * **iPrintessApi** is returned by the ```attachPrintess()``` call and provides you access to the Printess editor.
 * You can retrieve informations, set properties, add snippets and much more.
 */
export interface iPrintessApi {

  /**
   * retrieves root path for images
   * #ai-api:custom-ui
   */
  getResourcePath(): string;

  /**
    * retrieves any element inside the printess shadow root
    * In script Dialogs ONLY USE this method to find your Elements
   * #ai-api:custom-ui
   */
  querySelector(selectors: string): HTMLElement | null

  /**
   * retrieves the current shop token
   * #ai-api:core
   */
  shopToken(): string;

  /**
   * Returns if Printess is currently attached to the DOM.
   * #ai-api:core
   */
  isAttached(): boolean;

  /**
   * Tells Printess to remove all global event-listeners
   * Logs error if handlers are not currently attached or if scope is not initialized
   * #ai-api:core
   */
  detachAllHandlers(): void;

  /**
   * Tells Printess to re-attach all global event-listeners;
   * This MUST NOT be called initially. Only after you have called detachAllHandlers();
   * Logs error if handlers are not currently detached.
   * #ai-api:core
   */
  attachAllHandlers(): void;

  /**
   * Calculates the brightness of a color, return no-color if color can't be parsed
   * @param color hex or rgb() color
   */
  colorIntensity(color: string): "super-light" | "super-dark" | "light" | "dark" | "normal" | "no-color"


  /**
   *
   * @param key retrieves a regexp expression from dictonary
   */
  getRegExp(key: string | "europe-letters"): string | null


  setBcuiMobile(v: boolean): void

  /**
   * Load a template to the Printess editor.
   * Supports 'exchangeId' on document level. Docs with matching exchange-id's will transfer all user changes.
   * @param templateNameOrToken can be either the name of a template (case sensitive) or the save-token received as a result of a user design save.
   * @param mergeTemplates optional parameter to pass other templates to merge
   * @param takeOverFormFieldValues optional parameter to transfer global form field values from previous to next document
   * @param takeOverMatrixProduct optional take over the matrix product value.
   * @param clearExchangeCaches optional clear exchange cache and last loaded scope, so no data is exchanged when a new template is loaded. Defaults to false.
   * @param templateVersion optional the template version to load, due to backward compatibility the default is "draft", please always use "published" in the live shops.
   * #ai-api:core
   */
  loadTemplate(templateNameOrToken: string, mergeTemplates?: iMergeTemplate[], takeOverFormFieldValues?: boolean, takeOverMatrixProduct?: boolean, clearExchangeCaches?: boolean, templateVersion?: "draft" | "published"): Promise<void>

  /**
   * Loads template first and then exchange state from save-token.
   * @param templateName name of template to load
   * @param saveToken save-token to extract exchange state from
   * @param publishedVersion optional, default is true.
   * #ai-api:core
   */
  loadTemplateWithExchangeToken(templateName: string, saveToken: string, publishedVersion?: boolean): Promise<void>

  /**
   * Logs a message to the save token. Useful for setting user confirmation messages like "accepted low resolution" or "accepted image compliance warning".
   * @param message The message you want to log to the save token. It's automatically prefixed with the current date and time.
   * #ai-api:core
   */
  addBuyerLogEntry(message: string): void;

  /**
   * Returns information about the applied layout snippets per document per spread.
   * The first level contains a mapping of document name to spread info.
   * The second level (spreads) contains the mapping of spread name or id (in case the spread does not have a name set) to the layout info.
   * #ai-api:layouts-snippets
   */
  getAppliedLayouts(): Record<string, Record<string, appliedLayoutInfo>>;

  /**
   * Load a template to the Printess editor and sets form fields.
   * Supports 'exchangeId' on document level. Docs with matching exchange-id's will transfer all user changes.
   * All parameters can also be passed as one object (`iLoadTemplateOptions`): the parameters below by their name, plus the
   * settings `attachPrintess()` applies on top of its template (`bookSettings`, `bookInsidePages`, `singlePrintsSettings`,
   * `photobookThemeMenuId`, `formFieldsUrl`). With the positional parameters, those settings go into the last parameter.
   * @param templateName can be either the name of a template (case sensitive) or the save-token received as a result of a user design save, or an `iLoadTemplateOptions` object that holds all parameters.
   * @param mergeTemplates optional parameter to pass other templates to merge
   * @param formFields optional parameter to pass global form field values
   * @param snippetPriceCategoryLabels optional parameter to pass snippetPriceCategoryLabels
   * @param formFieldProperties optional form field properties to adjust after load
   * @param clearExchangeCaches optional clear exchange cache and last loaded scope, so no data is exchanged when a new template is loaded. Defaults to false.
   * @param templateVersion optional the template version to load, due to backward compatibility the default is "draft", please always use "published" in the live shops.
   * @param settings optional the settings to apply on top of the loaded template, as `attachPrintess()` applies them after its load (see `iLoadTemplateSettings`). They are applied before the form field properties and values of the same call and leave nothing on the undo stack.
   * #ai-api:core
   */
  loadTemplateAndFormFields(
    templateName: string | iLoadTemplateOptions,
    mergeTemplates?: iMergeTemplate[] | null,
    formFields?: iFormFieldNameValue[] | null,
    snippetPriceCategoryLabels?: string[] | null,
    formFieldProperties?: iFormFieldProperty[] | null,
    clearExchangeCaches?: boolean,
    templateVersion?: "draft" | "published",
    settings?: iLoadTemplateSettings): Promise<void>


  /**
   * Centers the current spread in the printess view container
   * #ai-api:viewport-zoom
   */
  centerSpreadInView(part?: "entire" | "left-page" | "right-page"): void

  /**
   * Saves current artwork and returns a save-token.
   * @deprecated Use `save()` instead.
   * @see save
   * #ai-api:core,legacy
   */
  saveJson(): Promise<string>;
  /**
   * Loads previously saved buyer artwork identified by a save-token.
   * @deprecated Use `load()` instead.
   * @see load
   * #ai-api:core,legacy
   */
  loadJson(saveToken: string): Promise<void>;


  /**
   * Returns "true" if template has unsaved changes
   * #ai-api:core
   */
  hasUnsavedChanges(): boolean


  /**
   * Saves current artwork
   * @returns `saveToken` which you can pass on `attachPrintess()` or `load()`
   * #ai-api:core
   */
  save(): Promise<string>;

  /**
   * Saves current artwork and returns the saveToken and a basket thumbnail url.
   * The thumbnail url creation could involve cost, as it is rendered server side.
   * Makes the checkout process faster.
   * @returns `saveToken` which you can pass on `attachPrintess()` or `load()`, plus the `basketUrl` of the server-rendered thumbnail if available,
   * and `expiresOn`: when the save token expires, as the server set it (ISO 8601, UTC, e.g. "2026-11-04T12:34:56.789Z"), so a shop can show
   * the customer how long the project is kept without deriving it from the account's retention setting
   * #ai-api:basket-pricing,core
   */
  saveAndGenerateBasketThumbnailUrl(maxWidth?: number, maxHeight?: number): Promise<{ saveToken: string, basketUrl?: string, expiresOn?: string }>;

  /**
   * Saves current artwork to the shop
   * @param savedShopData relevant shop data for saving artwork
   * #ai-api:core
   */
  saveTemplateToShop(savedShopData: ISavedShopData): Promise<void>;

  /**
   * Load saved artwork from the shop
   * #ai-api:core
   */
  loadSavedShopTemplates(shopId: string, shopUserId: string, productId: string): Promise<{ entries: ISavedShopData[] }>;

  /**
   * Loads template or previously saved buyer artwork (`saveToken`)
   * @param templateNameOrSaveToken a templateName or a `saveToken` you have received from basket- or back-callback or from `save()` call
   * #ai-api:core
   */
  load(templateNameOrSaveToken: string, mode?: "auto" | "loadAlwaysFromServer"): Promise<void>;


  /**
   * Expects a previously saved buyer artwork identified by a saveToken and ensures that this work will never be deleted from DB
   * #ai-api:core
   */
  unexpireJson(saveToken: string): Promise<void>;


  /**
   * Should be called before redirecting to a new template.
   * Will save the current state to the browser storage and apply it automatically to the next loaded template
   * Applies Frame and Document `exchange-ids` as well as template-wide form fields
   * @param frames (default true) add frame exchange-ids (image, text, story)
   * @param documents (default true) add documents with exchange-ids
   * @param formFields (default true) add all user-defined form fields on template level
   * #ai-api:core
   */
  persistExchangeState(frames?: boolean, documents?: boolean, formFields?: boolean): Promise<void>


  /**
   * Method to merge the current document content on another document of the current template
   * @param targetDocId The id of the document to merge on
   * @param frames Which frames should be merged, default to "snippets" which means all frames placed as layout- or sticker-snippet. "all" will delete all frames in the target document before copying over the new frames.
   * #ai-api:pages-documents
   */
  mergeCurrentDocumentToTargetDocument(targetDocId: string, frames: "all" | "snippets"): Promise<void>

  /**
   * Returns if a real user is logged in - in buyer side only mode with only print option
   */
  userInBuyerSide(): boolean

  /**
   * Logs the current printess user out
   * Not available for buyer-side users!
   * Only if userInBuyerSide() === true
   */
  logout(): void

  /**
   * Returns the add to basket callback you have set in `attachPrintess()`
   */
  getAddToBasketCallback(): null | ((saveToken: string, url: string) => void);

  /**
   * Returns the error callback you have set in `attachPrintess()`
   */
  getErrorCallback(): null | ((errorName: ErrorName, data?: Record<string, string>) => void);

  /**
   * Returns true if the `noBasketThumbnail` flag was set on attach.
   * #ai-api:basket-pricing
   */
  noBasketThumbnail(): boolean


  /**
   * Returns true if the system is the Printess SaaS system.
   */
  isPrintessSystem(): boolean

  /**
   * Returns the back button callback you have set in `attachPrintess()`
   */
  getBackButtonCallback(): null | ((saveToken: string, thumbnailUrl: string) => void);

  /**
   * Returns the save button callback you have set in `attachPrintess()`
   */
  getSaveTemplateCallback(): null | ((saveToken: string, type: "save" | "close", thumbnailUrl: string) => void);

  /**
   * Returns the shop data callback you have set in `attachPrintess()`
   */
  getShopDataCallback(): null | (() => Promise<IShopData>);

  /**
   * Returns the login state callback you have set in `attachPrintess()`
   */
  isShopUserLoggedInCallback(): null | (() => Promise<boolean>);

  /**
   * Returns the display name callback you have set in `attachPrintess()`
   */
  getShopProjectDisplayNameCallback(): null | (() => Promise<string>);

  /**
   * Returns the shop saved data callback you have set in `attachPrintess()`
   */
  getShopSavedDataCallback(): null | ((shopData: IShopDataProjectName) => void);

  /**
   * Returns the shop login callback you have set in `attachPrintess()`
   */
  getShopLoginCallback(): null | ((type: "register" | "login", saveToken: string, thumbnailUrl: string, displayName: string) => void);

  /**
  * Returns the shop callback that needs to be called if the user clicks on load and selects a saved design
  */
  getShopDataLoadedCallback(): null | ((data: ISavedShopData) => void),

  /**
    * Returns the `loadTemplateButtonCallback` you have set in `attachPrintess()`
    */
  getLoadTemplateButtonCallback(): null | (() => void);

  /**
   *  Used by panel-ui to call an existing `onTabChanged` script (event)
   */
  raiseTabChangeEvent(tabId: string): void

  /**
   * Returns the Designer Side Aspect Control
   */
  getAspectControl(): HTMLElement | ""

  /**
   * For a11y, select next possible frame (on tab key)
   * #ai-api:frames-selection
   */
  selectNextFrame(): boolean

  /**
   * For a11y, select prev possible frame (on shift+tab key)
   * #ai-api:frames-selection
   */
  selectPrevFrame(): boolean

  /**
   * For a11y, select any possible frame when printess-component receives focus()
   * #ai-api:frames-selection
   */
  selectFirstBuyerBoxOnFocus(): boolean

  /**
   * For a11y, rotate selected frame clockwise or counter clockwise
   * #ai-api:frames-selection
   */
  rotateSelection(counterClockwise: boolean): boolean

  /**
   * For a11y, resize selected frame
   * #ai-api:frames-selection
   */
  resizeSelection(dimension: "height" | "width", mode: "grow" | "shrink"): boolean

  /**
   * For a11y, mirror selected frame vertically or horizontally
   * #ai-api:frames-selection
   */
  mirrorSelection(axis: "x" | "y"): boolean

  /**
   * For a11y, edit selected frame inline, if possible
   * #ai-api:frames-selection
   */
  editSelection(): boolean

  /**
   * For a11y, move selected frame within layers, if possible. Moves all the way to the front/back if `toEnd` is true.
   * #ai-api:frames-selection
   */
  moveSelectionLayer(direction: "front" | "back", toEnd?: boolean): boolean

  /**
   * Returns true if the ui should show a "load" button.
   */
  showLoadButton(): boolean

  /**
   * Clears current printess frames selection and shows document-wide properties like form fields.
   * #ai-api:frames-selection
   */
  clearSelection(): Promise<void>;

  /**
   * Clears current printess frames selection only if active and does not re-center the spread
   * #ai-api:frames-selection
   */
  clearSelectionKeepZoom(): Promise<void>;

  /**
   * Forces selection change callback against buyer side ui
   * #ai-api:frames-selection
   */
  fireSelectionChangeCallback(forceInLegacyUi?: boolean): Promise<void>;

  /**
   * Deletes all selected frames which are allowed to be removed by the buyer
   * #ai-api:frames-selection
   */
  deleteSelectedFrames(): Promise<boolean>;

  /**
   * Select frame by propertyId. Fires a subsequent selection changed callback.
   * #ai-api:frames-selection
   */
  selectFrames(propertyId: string): Promise<void>;

  /**
   * Select frames by class name. Fires a subsequent selection changed callback.
   * #ai-api:frames-selection
   */
  selectFramesByClass(className: string): Promise<void>;

  /**
   * Selects every frame on the current spread that carries this exchange-id - the id used to hand
   * content from one layout snippet to the next. The id may sit on the frame as Exchange Image,
   * Exchange Text or Exchange Story, so an image frame and a text frame sharing an id are both
   * selected. An empty id selects nothing. Fires a subsequent selection changed callback.
   * #ai-api:frames-selection
   */
  selectFramesByExchangeId(exchangeId: string): Promise<void>;

  /**
   * Assign a specified image to frames. The image is selected by id. You can specify the search scope where to look for frames.
   * @param imageId The id of the image you want to assign.
   * @param className The class name to search for in frames.
   * @param searchScope The scope to search frames in.
   * "spread" only looks for matching frames on the currently visible spread.
   * "document" only looks for matching frames on the currently visible document.
   * "template" looks for matching frames in the whole template.
   * @deprecated Typo in the name ("assing") â€” use assignImageByIdToFramesWithClass() instead, it is identical.
   * @see assignImageByIdToFramesWithClass
   * #ai-api:images-editing,legacy
   */
  assingImageByIdToFramesWithClass(imageId: string, className: string, searchScope: "spread" | "document" | "template"): Promise<void>;

  /**
   * Assign a specified image to frames. The image is selected by id. You can specify the search scope where to look for frames.
  * @param imageId The id of the image you want to assign.
  * @param className The class name to search for in frames.
  * @param searchScope The scope to search frames in.
  * "spread" only looks for matching frames on the currently visible spread.
  * "document" only looks for matching frames on the currently visible document.
  * "template" looks for matching frames in the whole template.
  * #ai-api:images-editing
   */
  assignImageByIdToFramesWithClass(imageId: string, className: string, searchScope: "spread" | "document" | "template"): Promise<void>;

  /**
   * Assign a specified image to frames. The image is selected by id. You can specify the search scope where to look for frames.
  * @param imageId The id of the image you want to assign.
  * @param frameNameOrTitle The JsName or Title of the frame
  * #ai-api:images-editing
   */
  assignImageByIdToFrameByNameOrTitle(imageId: string, frameNameOrTitle: string): Promise<void>


  /**
   * Returns first iExternalImage found for class name
   * @param className
   * @deprecated Misleading name (does not return a name) â€” use getImageByClassName() instead, it is identical.
   * @see getImageByClassName
   * #ai-api:images-editing,legacy
   */
  getImageNameByClassName(className: string): iExternalImage & { placement: "fit" | "fill" } | null

  /**
   * Returns first iExternalImage found for class name
   * @param className
   * #ai-api:images-editing
   */
  getImageByClassName(className: string): iExternalImage & { placement: "fit" | "fill" } | null

  /**
   * Returns first iExternalImage found for frame jsName or Title
   * @param frameNameOrTitle jaName or Title of a frame. JsName is checked first.
   * #ai-api:images-editing
   */
  getImageByFrameName(frameNameOrTitle: string): iExternalImage & { placement: "fit" | "fill" } | null


  /**
   * Returns image cluster for all spreads of a document with image Id and thumbUrl
   * @param docId The Id of the document for which to get the images per spread
   * #ai-api:photobook
   */
  getImagesBySpread(docId: string): { spreadId: string; images: { imageId: string; thumbUrl: string; }[] }[] | null

  /**
   * Goes to the spread where the selected image is placed
   * #ai-api:photobook
   */
  goToImageInBook(imageId: string): void

  /**
   * Looks up image by name - case insensitive
   * #ai-api:images-upload
   */
  getImageByName(name: string): iExternalImage | null

  /**
   * Gets the geometry of a specific frame looked up by name or title.
   * Returns null if no frame is selected
   * #ai-api:frames-selection
   */
  getFramePositionByName(frameNameOrTitle: string): {
    left: number,
    top: number,
    width: number,
    height: number,
    anchorX: "left" | "center" | "right",
    anchorY: "top" | "middle" | "bottom",
    rotation: number,
    rotationPositionX: number,
    rotationPositionY: number,
    containerPosition: { left: number, top: number, width: number, height: number }
  } | null

  /**
    * Gets the geometry of the current selected frame or frame-group
    * Returns null if no frame is selected
    * #ai-api:frames-selection
    */
  getSelectionPosition(): {
    left: number,
    top: number,
    width: number,
    height: number,
    anchorX: "left" | "center" | "right",
    anchorY: "top" | "middle" | "bottom",
    rotation: number,
    rotationPositionX: number,
    rotationPositionY: number,
    containerPosition: { left: number, top: number, width: number, height: number }
  } | null

  /**
   * The current selection of frames (one or more) will be positioned depending
   * on the position values you provide. (Just specify only the values you want to modify)
   *
   * All values are absolute pixels of the frame's top-left corner, in the same space
   * getSelectionPosition() returns â€” independent of the frame's own anchor.
   *
   * Sample code moves the frame 50px to the right:
   * ```
  const pos = api.getSelectionPosition();
  pos.left += 50;
  await api.transformSelection(pos);
   * ```
   * Values can be a number (always pixels) or a Length string: "120px", "5cm", "10mm",
   * "0.5inch", "12pt", "50%" or "=<equation>". A unitless string like "100" uses the
   * current document's unit. Percent values resolve against the parent's matching axis.
   *
   * Note: anchorX/anchorY/rotationPositionX/rotationPositionY are currently ignored â€”
   * they exist so the result of getSelectionPosition() can be passed in unchanged.
   * The frame keeps its configured anchor.
   * #ai-api:frames-selection
   */
  transformSelection(position: {
    left?: number | string,
    top?: number | string,
    width?: number | string,
    height?: number | string,
    anchorX?: "left" | "center" | "right",
    anchorY?: "top" | "middle" | "bottom",
    rotation?: number,
    rotationPositionX?: number,
    rotationPositionY?: number,
  }): Promise<void>

  /**
   * A single frame with "name" will be positioned depending
   * on the px position values you provide. (Just specify only the values you want to modify)
   *
   * Values are absolute pixels of the frame's top-left corner. The frame's own anchors
   * are read and kept, so a center/right/bottom pinned frame stays pinned and does not
   * move on the axes you omit. Works without selecting the frame â€” the buyer's current
   * selection is not touched â€” and also finds frames on other spreads/documents.
   *
   * Values can be a number (always pixels) or a Length string: "120px", "5cm", "10mm",
   * "0.5inch", "12pt", "50%" or "=<equation>". A unitless string like "100" uses the
   * current document's unit. Percent values resolve against the parent's matching axis.
   *
   * Note: anchorX/anchorY/rotationPositionX/rotationPositionY are currently ignored;
   * the frame keeps its configured anchor.
   * #ai-api:frames-selection
   */
  transformFrame(o: {
    name: string,
    left?: number | string,
    top?: number | string,
    width?: number | string,
    height?: number | string,
    anchorX?: "left" | "center" | "right",
    anchorY?: "top" | "middle" | "bottom",
    rotation?: number,
    rotationPositionX?: number,
    rotationPositionY?: number,
  }): Promise<void>

  /**
   * Copies the shape of one frame to other frames: its outline and its additional paths. Fill, stroke and text
   * wrapping of each target frame stay as they are - a frame without a shape so far gets the outline with no fill
   * and no stroke. The shape scales with each target frame, like it does when a frame is resized. An image frame
   * which gets the shape is masked by it. A sub-document frame which gets the shape stops tracing its own cut contour,
   * because that contour would replace the copy - in the editor as soon as its document is selected, and in
   * the output.
   *
   * The source frame is found by id, js-name or title. The targets are all frames of the template - on every
   * document and spread - which match `targetFrames` the way `searchBy` says: `"name"` matches the title or
   * the js-name, `"class"` matches one of the class names (a leading "." is ignored). The source frame
   * itself is never a target.
   *
   * All targets change in one undo step. Throws if the source frame is not found or has no shape.
   * @param sourceFrame Id, js-name or title of the frame whose shape is copied
   * @param targetFrames Title or js-name, or class name of the frames which get the shape
   * @param searchBy `"name"` to match `targetFrames` against the title and the js-name, `"class"` to match it against the class names
   * @returns The ids of the frames which got the shape - empty if no frame matches
   * #ai-api:frames-selection
   */
  copyFrameShape(sourceFrame: string, targetFrames: string, searchBy: "name" | "class"): Promise<string[]>

  /**
   * Get frames available on spread.
   * Return first editable frame.
   */
  getFrameUiHintPosition(): Promise<iExternalFrame>

  /** indicates if printess view scrolling has reached the bottom */
  isScrolledToBottom(): boolean

  /** indicates if printess view scrolling has reached the top */
  isScrolledToTop(): boolean

  /**
   * Select and zoom to the frame(s) mentioned in the error object.
   * @param err
   */
  bringErrorIntoView(err: iExternalError): Promise<void>
  bringErrorIntoViewV2(err: iErrorType): Promise<void>

  /**
   * For off-canvas displays of to many frame properties. Determines if the property is suitable to be displayed off canvas.
   * @param p the property to look for
   */
  isOffCanvasProperty(p: iExternalProperty): boolean

  /**
   * Indicates if current selected image can swap
   */
  hasImageSwap(): boolean

  /**
   * Indicates if editor is in image swap mode
   */
  imageSwapActive(): boolean

  /**
   * Activates Image Swap Mode
   */
  startOrStopImageSwap(): void

  /**
   * Indicates if the buyer may pick another image for the current selection from a list of similar images.
   */
  hasSimilarImagePicker(): boolean

  /**
   * Indicates if the given image has at least one similar companion among the buyer side images.
   * Similarity comes from the similarity clusters in iExternalImage.groupAnalysis.
   */
  hasSimilarImages(referenceImageId?: string): boolean

  /**
   * Returns the buyer side images ordered by how similar they are to the reference image
   * (first = near identical, last = vaguely similar). The reference image itself is not included.
   */
  getSimilarImages(referenceImageId?: string, maxImages?: number): Array<iExternalImage>

  /**
   * Indicates if a selected image frame can be splitted in certain directions
   * #ai-api:layouts-snippets
   */
  hasScissorMenu(): "never" | "horizontical" | "vertical" | "both"

  /**
   * Indicates if a splitter cell is selected
   * #ai-api:layouts-snippets
   */
  hasSplitterMenu(): boolean

  /**
   * Indicates if splitter text snippets are available
   * #ai-api:layouts-snippets
   */
  hasSplitterTextSnippets(): boolean

  /**
   * number of active splitter edges
   * #ai-api:layouts-snippets
   */
  splitterEdgesCount(): number

  /**
   * Indicate if the template has static image filters to display, like AI-enhancement for example
   * #ai-api:images-editing
   */
  hasStaticImageFilters(): boolean

  /**
   * Returns all PanelUi button objects defined in global scripts
   */
  getScriptButtons(): Array<iExternalButton>

  /**
   *
   * @param scriptName name of script in current template
   * @param args all arguments as an array of string
   */
  executeScript(scriptName: string, args: string[]): string | Promise<string>


  /**
   * Split an image frame that has splitter option turned on
   * @param direction is either horizontal or vertical depending on how an image should be splitted
   * #ai-api:layouts-snippets
   */
  splitFrame(direction: "horizontal" | "vertical"): Promise<void>

  /**
   * Selects all frames which are marked as **background**
   * #ai-api:layouts-snippets
   */
  selectBackground(): Promise<void>;

  /**
   * Indicates if the current spread has editable background frames.
   * @deprecated Old background handling; returns false when the background-layouts-tab feature is used. Use hasBackgroundLayoutsTab instead.
   * @see hasBackgroundLayoutsTab
   * #ai-api:layouts-snippets,legacy
   */
  hasBackground(): boolean

  /**
   * Indicates if the current spread has background layouts (background-tab feature)
   * #ai-api:layouts-snippets
   */
  hasBackgroundLayoutsTab(): boolean

  /**
   * Loads all background layout snippets for the background-layouts tab (see hasBackgroundLayoutsTab)
   * #ai-api:layouts-snippets
   */
  loadBackgroundLayouts(): Promise<iExternalSnippet[]>

  /**
   * Returns all background Frame Color Properties
   * #ai-api:layouts-snippets
   */
  getBackgroundColorProperties(): iExternalProperty[]

  /**
   * Indicates if background frames are selected
   * #ai-api:layouts-snippets
   */
  isBackgroundSelected(): boolean

  /**
   * Selects a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part` parameter.
   * @param spreadIndex zero-based
   * @param part  "entire" | "left-page" | "right-page"
   * #ai-api:pages-documents
   */
  selectSpread(spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * Selects a document and a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part` parameter.
   * @param docIdOrName ID or Name of document to select
   * @param spreadIndex zero-based
   * @param part  "entire" | "left-page" | "right-page"
   * #ai-api:pages-documents
   */
  selectDocumentAndSpread(docIdOrName: string, spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * for example: in bcui you can close the the overlay if a form field changes
   */
  closePropertiesOverlay(): Promise<void>

  /**
   * If available, selects the first page of the book-inside document
   * @param createThumbnailBeforeSwitch helpfull when triggered on FF change to ensure that the current spread thumbnail gets updated before switching to the inside pages
   * #ai-api:photobook
   */
  selectBookDocument(createThumbnailBeforeSwitch: boolean): Promise<boolean>

  /**
   * Retrieves current document id, returns empty string if doc is not yet loaded.
   * #ai-api:pages-documents
   */
  getCurrentDocumentId(): string

  /**
   * Returns true if the currently selected document is an actual photo-print document
   * (neither the primary document nor the "photo-template").
   * @deprecated The name violates the camelCase convention. A corrected alias isValidSinglePhotoPrintSelected() is planned but does not exist yet â€” keep using this method until it lands.
   * #ai-api:single-photo-prints,legacy
   */
  IsValidSinglePhotoPrintSelected(): boolean

  /**
   * Moves Printess focus to next page if available. Focus on single pages not spreads.
   * #ai-api:pages-documents
   */
  nextPage(): Promise<void>;

  /**
   * Moves Printess focus to previous page if available. Focus on single pages not spreads.
   * #ai-api:pages-documents
   */
  previousPage(): Promise<void>;

  /**
   * Retrieves information about the currently selected page.
   * Returns natural page-number (current) starting from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents.
   * Async version waits for Printess to be fully loaded.
   * #ai-api:pages-documents
   */
  pageInfo(): Promise<{ current: number, max: number, isFirst: boolean, isLast: boolean, spreadId: string }>


  /**
   * Retrieves information about the currently selected page.
   * Returns natural page-number (current) starting from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents.
   * Sync version returns dummy data if Printess is not fully loaded.
   * @param includeDocs If set to true, multiDoc and the isFirst/isLast flags take all editable documents into account, not only the current document.
   * #ai-api:pages-documents
   */
  pageInfoSync(includeDocs?: boolean): { current: number, multiDoc: boolean, max: number, isFirst: boolean, isLast: boolean, spreadId: string, part: "left-page" | "right-page" | "entire", docId: string }

  /**
   * Returns information about all spreads of the displayed document
   * #ai-api:pages-documents
   */
  getAllSpreads(): Array<iExternalSpreadInfo>;

  /**
   * Returns the current documents aspect
   * #ai-api:pages-documents
   */
  getDocumentAspect(): "landscape" | "portrait"

  /**
   * Returns the current document size in pixel
   * #ai-api:pages-documents
   */
  getDocumentSize(): { width: number, height: number } | null

  /**
   * Returns the current spread size including placement rect in pixel
   * #ai-api:pages-documents
   */
  getCurrentSpreadSize(): { width: number, height: number } | null

  /**
   * Returns information about all spreads of ALL buyer-editable documents
   * @param applyLockCoverInside (default is false) If set to "true" and the document has "lockCoverInside" enabled, the call returns the printed amount of spreads and pages
   * #ai-api:pages-documents
   */
  getAllDocsAndSpreads(applyLockCoverInside?: boolean): Array<iExternalDocAndSpreadInfo>;

  /**
   * Returns total number of spreads (not pages)
   * #ai-api:pages-documents
   */
  spreadCount(): number

  /**
   * On IOS returns if iphone has its keyboard expanded.
   * This can never be 100% accurate.
   * #ai-api:viewport-zoom
   */
  isSoftwareKeyBoardExpanded(): boolean

  /**
   * Returns true if the user has made edits on a spread.
   * @param spreadIdOrIndex: ID or Index of Spread to check for - if empty it checks for current spread
   * @param documentName Optional document name; defaults to the current document
   * #ai-api:pages-documents
   */
  hasBuyerContentEdits(spreadIdOrIndex?: string | number, documentName?: string): boolean

  /**
   * Returns on what side of the spread the user has content edits
   * @param spreadIdOrIndex: ID or Index of Spread to check for - if empty it checks for current spread
   * @param documentName Optional document name; defaults to the current document
   * #ai-api:pages-documents
   */
  hasBuyerContentEditsLeftRight(spreadIdOrIndex?: string | number, documentName?: string): { onLeftPage: boolean, onRightPage: boolean, onEntirePage: boolean }


  /**
   * Returns true if any document has buyer content edits on any spread, or if any text form field value has been changed from its default.
   * #ai-api:pages-documents
   */
  hasBuyerContentEditsInAnyDocumentOrFormField(): boolean

  /**
   * Returns only false if property refers to a formfield which is not visible, because it doesn' match a specific condition.
   * @param propertyId ID of property to check
   * #ai-api:form-fields
   */
  isPropertyVisible(propertyId: string, wasVisibleBefore?: boolean): boolean

  /**
   * Returns all available properties in the current document
   * #ai-api:frames-selection
   */
  getAllProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
   * Returns the name of a form field if property-id points to an existing form field
   * @param properyId External Property ID
   * #ai-api:form-fields,frames-selection
   */
  getFormFieldNameByExternalPropertyId(properyId: string): string | null

  /**
   * Runs a form field script, property-id must point to form field.
   */
  executeFormFieldScript(propertyId: string): Promise<string>

  /**
   * Returns a list of all available properties on a specific spread
   * @param spreadId
   * #ai-api:frames-selection
   */
  getAllPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;


  /**
  * Returns a list of all required properties (async)
   * #ai-api:validation-errors
  */
  getAllRequiredProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
    * Returns a list of all required properties (sync)
    */
  getAllRequiredPropertiesSync(): Array<Array<iExternalProperty>>;

  /* returns if buyer ui shows sub document */
  showDocumentBackButton(): boolean

  /**
   * Jumps back to last editable doc if in permanent group editing.
   * Also used to return to the overview from a single-photo document opened via `openSinglePhotoDoc()`.
   * #ai-api:pages-documents
   */
  selectLastDocument(): Promise<void>

  /** get if mobile image crop mode is enabled and should show the circular image pan-icon */
  getMobileImageCropModeEnabled(): boolean

  /** toggle mobile image crop mode */
  toggleMobileImageCropModeEnabled(): boolean

  /**
  * Returns a list of all required properties on a specific spread (async)
  * @param spreadId
   * #ai-api:validation-errors
  */
  getAllRequiredPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;

  /**
   * Returns a list of all required properties on a specific spread (sync)
   * @param spreadId
   */
  getAllRequiredPropertiesBySpreadIdSync(spreadId: string): Array<Array<iExternalProperty>>;

  /**
   * Mobile UI helper method to convert a list of properties to a list of mobile buttons to show to the buyer
   * @param properties list of properties to get buttons from
   * @param propertyIdFilter can be the *id* of a specific property to get only property related buttons (for images and multi-line text)
   *                         "all" returns only top level buttons (no sub/meta property buttons)
   *                         "root" returns only top-level properties but sets the `hasCollapsedMetaProperties` flag if applicable
   */
  getMobileUiButtons(properties: Array<iExternalProperty>, propertyIdFilter: "all" | "root" | string, customHandwriting?: boolean): Array<iMobileUIButton>;

  /**
   * Used in BCUI, gets new basic image categorie buttons
   */
  getFirstLevelImageButtons(p: iExternalProperty, addImageTools: boolean): Array<iMobileUIButton>

  /**
   * Returns change background button if available
   */
  getMobileUiBackgroundButton(): Array<iMobileUIButton>

  /**
   * Returns change layouts button for splitter text frames
   */
  getMobileUiSplitterLayoutsButton(): Array<iMobileUIButton>

  /**
   * Returns grid gap button for splitter frames
   */
  getMobileUiSplitterGapButton(): Array<iMobileUIButton>

  /**
  * Returns image to text convert button if available
  */
  getMobileUiSplitterToTextButton(): Array<iMobileUIButton>

  /**
   * Returns text to image convert button if available
   */
  getMobileUiSplitterToImageButton(): Array<iMobileUIButton>

  /**
   * Mobile UI helper method to go through a table form-field which is set as data-source in the template
   * @param type up or down for arrow/data direction
   */
  getMobileUiRecordNavigationArrows(): Array<iMobileUIButton>

  /**
   * Returns horizontal and vertical scissor buttons if available
   */
  getMobileUiScissorsButtons(): Array<iMobileUIButton>

  /**
   * Mobile UI helper method to get model to draw a circle button including icons, gauge, etc.
   * uiHelper contains a method to create an SVG from this circle model
   * @param m The mobile button to create a circle for
   * @param isSelected If the button is selected
   */
  getButtonCircleModel(m: iMobileUIButton, isSelected: boolean, customHandwriting?: boolean, customSplitterButton?: boolean, customTableRecordButton?: boolean): iButtonCircle

  /**
   * Returns a simple ui to change the postion of an image
   * @param propertyId
   * @param forDesktopDialog give more space if for desktop dialog
   */
  createCropUi(propertyId: string, forDesktopDialog: boolean): null | { container: HTMLDivElement, setScale: (s: number) => void, getCropBox(): { top: number, left: number, width: number, height: number } }

  /**
   * Creates a new cropped image and assigns it to the passed form-field. Takes the currently assigned image as master
   * @param propertyId id of a form-field-property (type of image-id) pointing to a valid image
   * @param box all box coordinates are expected to be in the range of 0 to 1
   * #ai-api:images-editing
   */
  cropImage(propertyId: string, box: { left: number, top: number, width: number, height: number }): Promise<iExternalImage | null>

  /**
   * Returns if a iMobileUIButton should display text instead of an icon
   */
  isTextButton(m: iMobileUIButton): boolean


  /**
   * Returns if property is a form field of type font
   * @param propertyId
   * #ai-api:form-fields
   */
  isFontFormField(propertyId: string): Promise<boolean>;


  /**
   * Sets the value of any top-level property passed to the external UI
   * @param propertyId
   * @param propertyValue Must be string and will be converted if neccessary
   * #ai-api:frames-selection,form-fields
   */
  setProperty(propertyId: string, propertyValue: string | number | iStoryContent): Promise<void | (iExternalImageScaleHints & { scale: number })>; // | Array<iExternalColorUpdate>>;

  /**
   * Sets a background color property by index
   * @param mode apply the color to the current page ("page") or to all pages ("all")
   * #ai-api:layouts-snippets
   */
  setBackgroundColor(colorIndex: number, propertyValue: string, mode: "page" | "all"): Promise<void>

  /**
   * Sets a list of paragraph texts at once.
   * @param propertyId
   * @param paragraphs list of paragraph values
   * #ai-api:text-editing
   */
  setStoryParagraphs(propertyId: string, paragraphs: Array<{ index: number, newValue: string }>): Promise<void>

  /**
   * Sets the value of a form field
   * Important! setFormFieldValue should always be called with 'await' to make sure the change gets populated!
   * @param fieldName Name of the Form-Field or Form-Field Property-ID. If `name` is not found, Printess will try to find the Form-Field by its `label`. This fallback scenario is helpfull for shop integrations where the shop has no way to map labels to name.
   * @param newValue Must be string and will be converted if neccessary
   * #ai-api:form-fields
   */
  setFormFieldValue(fieldName: string, newValue: string): Promise<void>;

  /**
    * Retrieves the current value of a form field
    * Not async and always reads the live document, so it is safe to call at any time - including
    * from inside an already open dialog or panel, where `form.<name>` may still report the value
    * from before your own setFormFieldValue().
    * Returns `undefined` if no form field of that name exists. A `table` field returns its rows as
    * an array, a `number` field a number, a `label` field always "", everything else a string.
    * The value is unformatted, so it can be passed straight back into setFormFieldValue().
    * @param fieldName Name of the Form-Field or Form-Field Property-ID. If `name` is not found, Printess will try to find the Form-Field by its `label`. This fallback scenario is helpfull for shop integrations where the shop has no way to map labels to name.
    * #ai-api:form-fields
    */
  getFormFieldValue(fieldName: string): undefined | string | number | Array<Record<string, any>>;


  /**
   * Forces re-rendering of current document
   * #ai-api:viewport-zoom
   */
  reRender(): Promise<void>

  /**
   * Same like in the attach parameter, allows e.g. to modify list values in response to a user interaction.
   * @param formFieldProperties List of FormField-Names (key) and their respective properties to change
   * #ai-api:form-fields
   */
  setFormFieldProperties(formFieldProperties?: iFormFieldProperty[]): Promise<void>

  /**
   * Allows to set the disabled flag for certain items in a form field list.
   * @param ffName FF-Name to address
   * @param states List of value/disabled pairs
   * #ai-api:form-fields
   */
  setFormFieldListDisabledStates(ffName: string, states: Array<{ value: string, disabled: boolean }>): Promise<void>

  /**
   * Sets the number of inside pages of a book
   * @param bookInsidePages the number of pages the book should have. Must be >= 4.
   * @param applyLockCoverInside (default is false) If set to "true" and the document has "lockCoverInside" enabled, the call sets the printed amount of spreads and pages
   * #ai-api:photobook
   */
  setBookInsidePages(bookInsidePages: number, applyLockCoverInside?: boolean): Promise<void>

  /**
   * Sets the spine width, could be any Length value, like an equation or a fixed value with unit.
   * @param formular like `=spine.pages * 0.3mm` or just `2cm`
   * #ai-api:photobook
   */
  setSpineFormular(formular: string): Promise<void>

  /**
   * Returns spine values for the first cover of a book
   * Return null if no cover can be found.
   * #ai-api:photobook
   */
  getSpine(): null | { formular: string, spine: { value: number, unit: string }, hinge: { value: number, unit: string } }

  /**
   * Sets the all spine related values.
   * #ai-api:photobook
   */
  adjustBook(spine: iExternalBookSettings): Promise<void>

  /**
   * Adjusts margin settings on the current document.
   * #ai-api:pages-documents
   */
  adjustMargins(settings: iExternalMarginSettings): Promise<void>

  /**
   * Returns the current margin settings of the current document.
   * #ai-api:pages-documents
   */
  getMargins(): iExternalMarginSettings

  /**
   * updates a specific cell of a form field of type "table"
   * Any then all other updates,
   * this will NOT trigger a selection change event on buyer side
   */
  setTableCell(fieldNameOrId: string, rowIndex: number, col: iExternalTableColumn, value: string | number | boolean): Promise<iExternalError | null>
  setTableCellV2(fieldNameOrId: string, rowIndex: number, col: iExternalTableColumn, value: string | number | boolean): Promise<iErrorType | null>

  /**
   * Adds a new row to a table form field.
   * Returns row-index of added row.
   * @param fieldNameOrId The property-id or a form-field-name or form-field-id
   * @param type each form field table should have a type column which can be set on insert.
   */
  addTableRow(fieldNameOrId: string, type: string): number | null

  /**
   * Adds a new row to a table form field.
   * Returns row-index of added row and the added row itself.
   * @param fieldNameOrId The property-id or a form-field-name or form-field-id
   * @param type each form field table should have a type column which can be set on insert.
   */
  addTableRowExt(fieldNameOrId: string, type: string, insertPosition?: number): { index: number | null; row: Record<string, any> | null }

  /**
   * Tells if user is allowed to paste JSON data to a table form field.
   */
  canPasteTableRowsJSON(propertyId: string): boolean

  /**
   * Tells if a change position input should be displayed for the table row that is being edited
   * changing the position (index) value in the table edit row moves the row accordingly to the new position
   */
  canChangeTableRowIndex(propertyId: string): boolean

  /**
   * Tells if user is allowed to ignore low image resoution warnings
   */
  canIgnoreLowImageResolution(): boolean

  /**
   * Only for internal use by the Printess buyer UI: records that the buyer dismissed this error
   * with an "Ignore" button, so that `validateAsyncV2` returns it with `isIgnored: true`.
   * You only need this if you replace the buyer UI with your own validation dialog.
   */
  reportIgnoredError(err: iErrorType): void

  /**
   * Returns the row-indizies of a table form field to add to another table form field.
   * An array of those indizies can be passed to 'addTableRows()'
   * @param ffName Form Field Name
   */
  getTableRowsToAdd(ffName: string): Array<{ index: number, label: string }>

  /**
   * Adds multiple table rows at once from another table from field
   *  * Returns row-index of added row.
   * @param fieldNameOrId The property-id or a form-field-name or form-field-id
   * @param type each form field table should have a type column which can be set on insert.
   * @param ffLibName Name of form-field which contains row-library
   * @param libIndizies list if row-indizies of row-library
   */
  addTableRows(fieldNameOrId: string, type: string, ffLibName: string, libIndizies: Array<number>): number | null

  /**
   * Adds multiple table rows at once from another table from field
   *  * Returns row-index of added row and the table rows.
   * @param fieldNameOrId The property-id or a form-field-name or form-field-id
   * @param type each form field table should have a type column which can be set on insert.
   * @param ffLibName Name of form-field which contains row-library
   * @param libIndizies list if row-indizies of row-library
   */
  addTableRowsExt(fieldNameOrId: string, type: string, ffLibName: string, libIndizies: Array<number>, insertPosition?: number): { index: number | null, table: Array<Record<string, any>> | null }

  /**
   * Sets the size of a specific document
   * @param documentName Name of the document to change
   * @param widthInDocUnit 12 equals e.g. "12cm"
   * @param heightInDocUnit 12 equals e.g. "12cm"
   * #ai-api:pages-documents
   */
  setDocumentSize(documentName: string, widthInDocUnit: number, heightInDocUnit: number): Promise<void>

  /**
   * Sets the four bleeds of a specific document. Values are in the document's unit
   * (e.g. 1 equals "1cm" when the document unit is cm). "inside"/"outside" are the
   * binding-relative left/right edges for facing-page documents.
   * @param documentName Name of the document to change
   * @param bleedInside Inside (spine-side) bleed
   * @param bleedTop Top bleed
   * @param bleedOutside Outside bleed
   * @param bleedBottom Bottom bleed
   * #ai-api:pages-documents
   */
  setDocumentBleed(documentName: string, bleedInside: number, bleedTop: number, bleedOutside: number, bleedBottom: number): Promise<void>

  /**
   * Re-creates the cut contour of every frame in a document which shows a given sub-document.
   * A frame with an active cut contour keeps the outline of the sub-document it displays, so after
   * that sub-document's content has changed the outline of the referencing frames is stale. Call
   * this to bring them up to date. Frames without an active cut contour are left untouched.
   * Throws if either document name is unknown.
   * @param documentName Name of the document which holds the referencing frames
   * @param subDocumentName Name of the sub-document whose content has changed
   * #ai-api:pages-documents
   */
  updateCutContoursOfSubDocument(documentName: string, subDocumentName: string): Promise<void>

  /**
   * Looks for sub doc in current selection, resizes it and also resize referencing frame
   * #ai-api:pages-documents,frames-selection
   */
  resizeSubDocAndBox(newWidth: number, newHeight: number, boxToDocScale: number): Promise<boolean>

  /**
   * removes image for rich-text-frames which have a handwriting image set
   * Sets back to text
   */
  removeHandwritingImage(): Promise<boolean>;

  /**
   * Indicates if form fields are available
   * #ai-api:form-fields
   */
  hasFormFields(): boolean

  /**
   * Retrieves all Form Fields for UI rendering.
   *
   * Omit `tabId` to get every root form field of the loaded template, whichever tab it sits on - that
   * is the call a host page drawing its own product-options panel wants. Pass one to narrow to a single
   * tab. Fields pinned to a box are never included; those belong to a frame's selection, not to the
   * product.
   *
   * @param tabId optional to get FFs for certain tab only
   * #ai-api:form-fields
   */
  getFormFieldsAsProperties(tabId?: "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2"): iExternalProperty[]

  /**
   * Get the id if the tab to display on start-up
   * default is `#PHOTOS`
   */
  getInitialTabId(): string

  /**
   * Returns passed tab-id or initial tab id if current is invalid
   */
  validateCurrentTabId(curTabId: string): string

  /**
   * If Tab-Navigation is enabled, this method tells if a "PHOTO" tab makes sense.
   */
  showPhotoTab(): boolean

  /**
   * Indicates if current spread has editable text or images with properties suitable for the frame bar
   * @returns Separate flags for editable `text` and `image` frames on the current spread.
   * #ai-api:frames-selection
   */
  currentSpreadHasEditableFrames(): { text: boolean, image: boolean }

  /**
   * Called by BCUI when fully loaded and executes center spread in view first center
   */
  bcuiLoaded(): Promise<void>

  /**
   * Returns the current form field value and its possible list values if available
   * Important: Only returns values of price-relevant form-fields!
   * @param fieldName Name of the Form-Field or Form-Field Property-ID
   * #ai-api:form-fields
   */
  getFormField(fieldName: string): Promise<{
    value: null | string | number | Array<Record<string, any>>,
    list?: Array<{
      key: string,
      label?: string,
      description?: string,
      imageId?: string,
      tag?: string,
      meta1?: string,
      meta2?: string,
      meta3?: string,
      meta4?: string,
      disabled?: boolean
    }>
  } | undefined>

  /** Looks up a Form Field with fieldName and if the Form Field has a selected image in its list
   * or if the Form Field is of type "imageId" it returns the selected image.
   * #ai-api:form-fields
   */
  getFormFieldSelectedImage(fieldName: string): iExternalImage | undefined

  /**
   * Returns a list of images from the Form Field Select List
   * #ai-api:form-fields
   */
  getFormFieldImageList(fieldName: string): Array<iExternalFormFieldImageListItem>

  /**
   * Mounts the panel-script bound to a Form Field of `dataType = "panel-script"` into
   * `container`. The script runs once with `api`, `form`, `html`, `render` in scope, calls
   * `await api.openPanel()` to obtain the container, and manages its own re-renders / internal
   * state from there on (mirroring the `api.openDialog()` pattern).
   * Returns `undefined` when the panel was started, or a human-readable error string when it
   * could not be - a missing field, the wrong dataType, no script, or a body that threw
   * synchronously.
   *
   * A panel that fails *later* cannot be reported that way, so it reports itself: an error after
   * the script's first `await` - `api.openPanel()` and the whole first render included - is written
   * into `container` as a `.bc-panel-script-error` element, and a panel that renders nothing at all
   * says so there within a few seconds. Style that class when mounting panels into your own page.
   * #ai-api:custom-ui,form-fields
   */
  mountFormFieldPanel(formFieldName: string, container: HTMLDivElement): string | undefined

  /**
   * Inside a `panel_*` script body, returns the mount container the panel should render into.
   * Mirrors `openDialog()` without buttons or headline. Must be called while a panel script is
   * being invoked by the host; throws otherwise.
   * #ai-api:custom-ui
   */
  openPanel(): Promise<HTMLDivElement>

  /**
   * Persists JSON-serialisable state into a hidden (admin-visibility) text-area Form Field, so
   * a `panel_*` script can restore its UI on tab change OR on a full template reload.
   *
   * If `fieldName` does not yet exist, a Form Field is created on the fly: dataType `string`,
   * uiControl `text-area`, visibility `admin` (invisible to the buyer). If it already exists,
   * the value is overwritten and the schema is left alone â€” pick a unique name per panel.
   *
   * Returns `undefined` on success, or a human-readable error string on failure.
   * #ai-api:custom-ui,form-fields
   */
  writeStateToFormField(fieldName: string, state: unknown): Promise<string | undefined>

  /**
   * Companion to `writeStateToFormField` â€” reads and JSON-parses the value back. Returns the
   * parsed state, or `undefined` when the field does not exist, is empty, or is not valid JSON.
   * Never throws; safe to call eagerly when a panel mounts.
   * #ai-api:custom-ui,form-fields
   */
  readStateFromFormField<T = unknown>(fieldName: string): T | undefined


  /**
   * Indicates if a table can be edited in fullscreen mode
   */
  editTableFullscreen(): boolean

  /**
   * Returns group type as string for table form fields
   */
  getTableGroupType(): string

  /**
   * Returns which jump-to-group navigation buyer-side tables offer. Only tables which are
   * organised by groups - i.e. which offer adding one - show it.
   */
  getTableGroupNav(): iTableGroupNav

  /**
   * Returns name/value-list only from table form field
   * @param ffName Name of FormField
   */
  getTableSelectListByFormFieldName(ffName: string): Array<{ value: string, label: string }> | null

  /**
   * Returns the number UI model for any numeric property
   * `iExternalNumberUi` and value will be returned and has min, max and step info
   * Important: Number models can have different value ranges than the values stored in printess for better user experience
   * uiHelper contains a method to create a slider control from this model
   * @param property
   * @param metaProperty
   * #ai-api:frames-selection
   */
  getNumberUi(property: iExternalProperty, metaProperty?: iExternalMetaPropertyKind | null): {
    meta: iExternalNumberUi;
    value: number;
  } | undefined;

  /**
   * Sets a numric values based on a retrieved number model.
   * Number models can have different value ranges than the values stored in printess
   * If a number value has been retrieved by `getNumberUi` its mandatory to set it via `setNumberUiProperty`
   * @param property
   * @param metaProperty
   * @param value
   * #ai-api:frames-selection
   */
  setNumberUiProperty(property: iExternalProperty, metaProperty: iExternalMetaPropertyKind | null, value: number): Promise<void>;

  /**
   * Replaces multi-line text only works with a current active multi-line-text-editor
   * @param text The text to insert into the active multi-line editor
   */
  setEditorText(text: string): boolean

  /**
   * Returns list of available Font Sizes based on "size" unit.
   * @param size
   */
  getAvailableFontSizes(size: string): { sizes: Array<number>, unit: string }

  /**
   * Gets the current font-size either in text-editor or form mode as Length (string like 12% or 14pt)
   * @param direction: Length | null
   * @param propertyId
   */
  getScaledFontSize(direction: "up" | "down", propertyId: string | "ED_selection", overrideSize?: string): string | null

  /**
   * Method to set a text style meta-property
   * @param propertyId
   * @param name
   * @param value
   * @param textStyleMode
   */
  setTextStyleProperty(propertyId: string, name: "font" | "lineHeight" | "color" | "size" | "tracking" | "hAlign" | "vAlign" | "pStyle" | "baselineScript", value: string, textStyleMode?: textStyleModeEnum): Promise<string>;

  /**
   * Method to set an image meta-property
   * Set the image itself via `setProperty()`
   * @param propertyId
   * @param name
   * @param value
   * #ai-api:images-editing
   */
  setImageMetaProperty(propertyId: string, name: "scale" | "sepia" | "brightness" | "saturate" | "invert" | "contrast" | "grayscale" | "vivid" | "hueRotate", value: string | number): Promise<void>;

  /**
   * Resets all image filters (meta-values) of an image-property to default
   * @param propertyId
   * @param imageMeta optional parameter, can be used to set all image-filters to specific values.
   * #ai-api:images-editing
   */
  resetImageFilters(
    propertyId: string,
    imageMeta?: {
      brightness?: number,
      sepia?: number,
      invert?: number,
      hueRotate?: number,
      contrast?: number,
      vivid?: number
    }): Promise<void>;

  /**
   * Retrieve image borders on current spread
   * #ai-api:images-editing
   */
  getImageBordersOnCurrentSpread(): { innerWidth: number, outerWidth: number, innerColor: string, outerColor: string }

  /**
   * Sets image inner and outer border for all images on current spread
   * Image borders are only rendered for non images without effects or warps or path-geometrie
   * #ai-api:images-editing
   */
  setImageBordersOnCurrentSpread(b: { innerWidth?: number, outerWidth?: number, innerColor?: string, outerColor?: string }, onlySplitterFrames: boolean): Promise<void>


  /**
   * Indicates single photo print order mode: returns true when the template's single-photo mode is set to "photo".
   * #ai-api:single-photo-prints
   */
  isSinglePhotoMode(): boolean

  /**
   * Indicates photo-wall order mode: returns true when the template's single-photo mode is set to "wall".
   * #ai-api:single-photo-prints
   */
  isPhotoWallMode(): boolean

  /**
   * Maximum number of images allowed in single-photo or photo-wall mode.
   * Returns 99 while the template is not yet loaded.
   * #ai-api:single-photo-prints
   */
  singlePhotoMaxImages(): number

  /**
   * Minimum number of images required in single-photo or photo-wall mode.
   * Returns 99 while the template is not yet loaded.
   * #ai-api:single-photo-prints
   */
  singlePhotoMinImages(): number

  /**
   * Single photo "photo" mode: whether the buyer may open a photo-print for full document editing.
   * #ai-api:single-photo-prints
   */
  singlePhotoCanEditDocument(): boolean

  /**
   * Sets the per-document print count of a single photo-print document (values below 1 are clamped to 1).
   * Persists the change and fires the external price-change callback.
   * @param docId id of the photo-print document
   * @param count new print count for this document
   * #ai-api:single-photo-prints
   */
  setSinglePhotoCount(docId: string, count: number): Promise<void>

  /**
   * Gets the per-document print count of a single photo-print document.
   * @returns the count, or -1 if the document cannot be found
   * #ai-api:single-photo-prints
   */
  getSinglePhotoCount(docId: string): number

  /**
   * True when the "photo-template" document offers layout-snippets for single photo prints.
   * #ai-api:single-photo-prints
   */
  hasSinglePhotoLayoutSnippets(): boolean

  /**
   * Loads the layout-snippet clusters defined on the first spread of the "photo-template" document.
   * These are the layouts a buyer can apply to their single photo prints.
   * Returns an empty array when not in single-photo ("photo") mode.
   * #ai-api:single-photo-prints
   */
  getSinglePhotoLayoutSnippets(): Promise<Array<iExternalSnippetCluster>>

  /**
   * Single-photo mode ("photo") only: applies a layout-snippet to the targeted photo-print
   * document(s), takes over the previously placed image and refreshes the overview thumbnails.
   * @param snippetUrl the layout-snippet to apply
   * @param allDocs apply to every photo-print document (true) or only the current one (false)
   * #ai-api:single-photo-prints
   */
  insertSinglePhotoLayoutSnippet(snippetUrl: string, allDocs: boolean): Promise<void>

  /**
   * Photo-wall mode only: starts the automatic arrangement of the wall images.
   * @returns true if the arrangement ran, false when not in photo-wall mode
   * #ai-api:single-photo-prints
   */
  arrangeWallImages(): Promise<boolean>

  /**
   * Uploads one or many images to Printess and auto assigns the first image if an image frame is selected
   * If no frame is selected it distributes to the next possible frame or
   * automatically distributes all images depending on the template settings
   * @param files
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id. Pass "NONE" to NOT assign the image.
   * @param progressCallback
   * @param isHandwritingImage Toggle the current textframe to handwriting mode und assigns image
   * #ai-api:images-upload,images-editing
   */
  uploadAndDistributeImages(files: FileList | null, propertyId: string, progressCallback?: (percent: number, state: "upload" | "optimization") => void, isHandwritingImage?: boolean): Promise<iExternalImage[]>;

  /*
   * Uploads one or many images to Printess and can auto assign the first image
   * @deprecated Its deprecated, because buyer side never create frames on image upload. Just via stickers, use uploadAndDistributeImages() instead
   * @param files
   * @param progressCallback
   * @param assignToFrameOrNewFrame Auto assigns the first image to the current slection or a specific frame
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id.
    uploadImages(files: FileList | null, progressCallback?: (percent: number, state?: "upload" | "optimization") => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage[]>;
  */

  //  * Uploads a single image to Printess and can auto assign this image
  //  * @deprecated Its deprecated, because buyer side never create frames on image upload. Just via stickers
  //  * @param file
  //  * @param progressCallback
  //  * @param assignToFrameOrNewFrame
  //  * @param propertyId
  // uploadImage(file: File, progressCallback?: (percent: number, state?: "upload" | "optimization") => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage | null>;

  /**
   * If no selection is present this call finds the first unassigned image and assigns it
   * If all images are already assigned it takes the first image and re-assigns it
   * #ai-api:images-editing,generative-ai
   */
  assignImageToNextPossibleFrame(imgId: string, origin?: "upload" | "thumb-click"): Promise<boolean>

  /**
   * Assigns image found by name to single selected frame only.
   * @param imageName Name of the image to assign
   * @param options Optional placement ("fit" | "fill"), focal point and onlyAssignToAllowedImages flag; may be null
   * @deprecated The name carries a typo ("assing"). A corrected alias assignImageByNameToSelection() is planned but does not exist yet â€” keep using this method until it lands.
   * #ai-api:images-editing,legacy
   */
  assingImageByNameToSelection(imageName: string, options: null | { placement?: "fit" | "fill", horizontalFocalPoint?: number, verticalFocalPoint?: number, onlyAssignToAllowedImages?: boolean }): Promise<boolean>

  /**
   * Will use current selection or insert a new frame on the spread.
   * @param imgId Existing image-id to assign
   * #ai-api:images-editing
   */
  assignImageToSelectionOrInsertAsNewFrame(imgId: string): Promise<void>

  /**
   * Will insert a new image frame on the current spread as a sticker;
   * Returns false if image was not found.
   * @param imageId Existing image-id to assign
   * #ai-api:images-editing
   */
  insertImageFrame(imageId: string): Promise<boolean>

  /** @internal which "place a photo" choices the current spread offers, same rules as the desktop drop zones */
  getPhotoPlacementContext(): { canAddLayout: boolean, canAddFrame: boolean, clickPlacesItself: boolean, pageNumbers: number[] }
  /** @internal the layouts with one more slot for this photo, as many as the desktop drop zones offer */
  getPhotoPlacementLayouts(imageId: string): Promise<iExternalCollageLayout[]>
  /** @internal re-splits the current spread into this layout and places the photo with the ones already there */
  placePhotoInNewLayout(imageId: string, splitVariantId: string): Promise<void>

  /**
   * Transfers the uploaded image from one image frame to another.
   * Also applies assign-actions if applicable
   * @param fromBoxName Name of from frame
   * @param toBoxName Name of to frame
   * @param options Optional placement ("fit" | "fill") and focal point
   * #ai-api:images-editing
   */
  transferImageByFrameName(fromBoxName: string, toBoxName: string, options?: { placement: "fit" | "fill", horizontalFocalPoint: number, verticalFocalPoint: number }): Promise<boolean>

  /**
   * Returns true if the magic photobook wizzard flag is enabled
   * #ai-api:photobook
   */
  isMagicPhotobook(): boolean

  /**
   * Returns current photo distribution mode
   * #ai-api:photobook
   */
  getPhotobookDistributionMode(): PhotobookDistribution

  /**
   * Returns true if the cover images should not appear again on the inside of the photobook
   * #ai-api:photobook
   */
  useExclusiveCoverImages(): boolean

  /**
   * Returns true if the photobook uses a debossed cover
   * #ai-api:photobook
   */
  useDebossedCover(): boolean

  /**
   * Number of images (0-4) distributed onto a debossed cover
   * #ai-api:photobook
   */
  debossedCoverImageCount(): number

  /**
   * Returns true if the image border button should be shown in the buyer UI.
   * #ai-api:images-editing
   */
  allowSimpleImageBorder(): boolean

  /**
   * Tells UI to show pages-overview after magic-photobook-wizzard has been completeted
   */
  showPagesOnLoad(): iShowPagesPreviewMode

  /**
   * Tells UI to show simplified pages view as last step of the magic-photobook-wizzard
   */
  showSimplifiedPagesView(): iShowPagesPreviewMode

  /**
   * Returns headline to display in wizard for magic photobooks.
   */
  getMagicPhotobookWizardHeadline(): string;

  /**
   * Returns headline to display in wizard for freestyle photobooks.
   */
  getFreestylePhotobookWizardHeadline(): string;

  /**
   * Returns tab displayed in magic photobook settings
   */
  getMagicPhotobookSettingsTab(): "NONE" | "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2"

  /**
   * Select new photobook theme
   * @param name Name of photobook theme
   * #ai-api:photobook
   */
  selectPhotobookTheme(name: string): Promise<iPhotobookTheme>

  /**
   * Retrieves id of current photobook theme keyword menu
   * #ai-api:photobook
   */
  getPhotobookThemeMenuId(): string

  /**
   * Retrieves name of current photobook theme
   * #ai-api:photobook
   */
  getSelectedPhotobookThemeName(): string

  /**
   * Retrieves current photobook theme object
   * #ai-api:photobook
   */
  getSelectedPhotobookTheme(): Promise<iPhotobookTheme>

  /**
   * Load all available photobook themes
   * @param keywords Optional: only return themes matching the given keywords
   * @param reload Optional: forces a fresh reload of the theme list
   * #ai-api:photobook
   */
  loadPhotobookThemeList(keywords?: string[], reload?: boolean): Promise<iPhotobookThemeListEntryDto[]>

  /**
   * Returns if text-editing should be displayed as overlay on desktop
   */
  hasOverlayTextEditing(): boolean

  /**
   * Returns if desktop ui should display a frame properties bar
   */
  canHaveDesktopFramePropertiesBar(): boolean

  /**
   * Returns if auto image layout selection is enabled
   */
  hasImageLayoutSelection(): boolean

  /**
   * Check if image zoom is allowed
   * @param propertyId
   * #ai-api:images-editing
   */
  canScale(propertyId: string): boolean;

  /**
   * Current zoom of an image frame: the scale it sits on, plus the min/max range it may move in.
   * Cropping an image is a zoom, so read this after `rotateImage` or `rotateAndCropImage` to
   * update a zoom slider. Returns null if the property is not an image frame.
   * @param propertyId
   * #ai-api:images-editing
   */
  getImageScaleHints(propertyId: string): (iExternalImageScaleHints & { scale: number }) | null;

  /**
   * Rotates an image by 90deg and saves the result as new image and assigns rotated image to frame automatically.
   * @param propertyId
   * @param angle
   * #ai-api:images-editing
   */
  rotateImage(propertyId: string, angle: "0" | "90" | "180" | "270", crop?: { ws: number, hs: number, px: number, py: number }): Promise<iExternalImage | null>;

  /**
   * Rotates image with any given angle.
   * @param propertyId
   * @param rotation
   * #ai-api:images-editing
   */
  rotateAndCropImage(propertyId: string, rotation: iExternalImageRotation): Promise<iExternalImage | null>

  /**
  * Imports a single image to Printess and can auto assign this image
  * @param url The url to the image you want to import to Printess.
  * @param assignToFrameOrNewFrame Default is `true`. Assign this image to the current frame, or create a new frame in case none is selected.
  * @param propertyId (optional) if a propertyId is submitted, printess will assign the image to that particular frame
   * #ai-api:images-upload
  */
  importImageFromUrl(url: string, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage | null>;

  /**
   * #ai-api:images-upload
   */
  getSerializedImage(imageId: string): string | null;
  /**
   * #ai-api:images-upload
   */
  addSerializedImage(imageJson: string, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage>;

  /**
   * Imports up to 50 previously uploaded user images. You can either provide the shopUserId and basketId to load images uploaded in this basket session,
   * or only provide the shopUserId to load the images from the user.
   * Please make sure you are using non guessable shop user and basket ids.
   * #ai-api:images-upload
   */
  importUserUploadedImages(shopUserId?: string, basketId?: string): Promise<iExternalImage[]>;

  /**
   * Imports the given external images and optionally assigns them to frames.
   * @param assignToFrameOrNewFrame The default value is false
   * #ai-api:images-upload
   */
  importImagesFromExternal(images: iImage[], assignToFrameOrNewFrame?: boolean): Promise<iExternalImage[]>;

  /**
   * Tells to render a new image after cropping even with no rotation
   * #ai-api:images-editing
   */
  alwaysRenderCroppedImage(): boolean

  /**
   * generates AI image with various models
   * #ai-api:generative-ai
   */
  generateImage(model: iExternalGenImageModel, targetFrameName: string | null, action: Array<iExternalGenImageFollowUpAction>): Promise<{ resultImage: iExternalImage }>

  /**
   * Generates AI text with an Anthropic or OpenAI model and returns it as `{ text }`.
   * A prompt and optionally images go in, one text comes out: the model has no tools, no
   * skills and no memory of earlier calls, so it can only answer - it can never read or
   * change the template beyond the images you hand it via `imageUrls`.
   * Consumes AI credits based on the tokens used - images are billed as input tokens.
   * #ai-api:generative-ai
   */
  generateText(model: iExternalGenTextModel): Promise<{ text: string }>

  /**
   * Returns the AI prompt of the image currently placed in the given frame, wrapped as
   * { prompt } â€” the text-to-image prompt, or the image-edit prompt if that is what
   * created it, with any ${...} placeholders evaluated. Null if the frame holds no
   * AI-generated image or the frame is not found.
   * @param frameNameOrTitle js-name or title of the frame
   * #ai-api:generative-ai
   */
  getImagePromptByFrameName(frameNameOrTitle: string): { prompt: string } | null

  /**
   * Returns all AI settings of the image in the given frame: text-to-image and image-edit
   * prompts, models and quality settings, the assign action and the segmentation, background
   * removal and upscale tasks. Prompts are returned as stored, so ${...} placeholders are not
   * evaluated - use getImagePromptByFrameName for the evaluated prompt. Null if the frame is
   * not found or is not an image frame.
   * @param frameNameOrTitle js-name or title of the frame
   * #ai-api:generative-ai
   */
  getImageAiByFrameName(frameNameOrTitle: string): iExternalImageAi | null

  /**
   * Returns not null if buyer should be able to use generative ai image creation
   */
  showText2Image(): null | { selectStyle: boolean, prompt: string, prefix: string, postfix: string, defaultPrompt: string, style: SdxlStyle | null, negativePrompt: string, model: string, transparency: string, allowUpload: boolean }

  /**
   * Returns if buyer should be able to use advanced ai image effects
   */
  showAiImageEffects(): boolean

  /**
   * loads all available Image AI Filters
   */
  getAiImageEffects(): Promise<ImageAIFilterCategory[]>

  /**
   * Returns list of available SDXL Styles
   */
  getText2ImageStyles(): Array<string>

  /**
   * Creates an image based on a prompt and style and uploads & assigns it to current frame.
   */
  createText2Image(prompt: string, style: SdxlStyle, negativePrompt?: string, model?: string, imageInfo?: { boxId: string | undefined, aspect: number, parentBoxId?: string }): Promise<void>

  /**
   * Modifies an existing image based on a prompt and uploads & assigns it to current frame.
   */
  createImageEdit(propertyId: string, prompt: string, quality?: iExternalImageEditQuality, images?: string[], imageInfo?: { boxId: string | undefined, aspect: number, parentBoxId?: string }, model?: string, settings?: ImageEditSettings): Promise<boolean>

  /**
   * Sets image placement based on selection, can only handle a single selected image for now.
   * @param propertyId TODO: Support for propertyId will follow
   * @returns Scale hints including the applied scale, when available
   * #ai-api:images-editing
   */
  setImagePlacement(which: "fit" | "fill", propertyId?: string): Promise<void | (iExternalImageScaleHints & { scale: number })>


  /**
   * Allow AI Text editing like spell checking, changing writing-style, etc.
   */
  showAiTextEditOptions(): boolean;

  /**
   * returns an array of AI Text Edit Options the customer can choose from (in a dropdown) when enabling the showAiTextEditOptions.
   */
  aiTextEditOptionAllows(): Array<AiTextEditOptionAllow>;


  /**
   * Streams AI-generated text based on the given prompt and current editor content.
   * Updates the editor live as the response is received in chunks.
   *
   * @param promptForAI - Instructional prompt to guide the AI generation.
   *
   * NEVER add an ai-api area tag to this method â€” not even the literal tag token inside this
   * comment, which alone would emit it into core.d.ts. Document it here only. It drives the
   * built-in AI text UI: it writes into a text property live and owns the editor while it
   * streams. Scripts use generateText instead, which just returns the text.
   */
  generateLiveTextFromAI(pid: string, promptForAI: string, usePreviousText: boolean): Promise<void>;

  /**
   * Returns Buyer-Side Flag if ui should show left tab bar
   */
  showTabNavigation(): boolean;

  /**
   * Returns Buyer-Side Flag if ui should show bottom tab bar on mobile
   */
  showMobileTabNavigation(): boolean;


  /**
   * returns if snippets are present on any spread in the template
   * #ai-api:layouts-snippets
   */
  templateHasSnippets(): boolean

  /**
   * Returns the pure setting from buyer-side dialog
   */
  showTabNavigationSetting(): boolean;

  /**
   * Enables snippet preview overlay on snippet thumbnail hover
   */
  showSnippetPreviewOverlay(): boolean;

  /**
   * Indicates if a Layouts Dialog should be displayed when initially opening the Buyer Side to choose a Layout Snippet
   */
  showLayoutsDialog(): boolean;

  /**
   * Indicates if a Layouts Tab should be auto selected;
   */
  selectLayoutsTabOneTime(): boolean;

  /**
   * Returns how many columns a Change Layout overview should have to display layout snippets more properly
   */
  numberOfColumns(): number;

  /**
   * Apply number of columns for layouts also to mobile Layout Selection Overlay
   */
  applyNumOfColsToLayoutsDialogMobile(): boolean;
  /**
   * Returns if buyer is allowed to upload pdf files
   * #ai-api:images-upload
   */
  allowPdfUpload(): boolean;

  /**
   * Returns if buyer is allowed to upload svg files
   * #ai-api:images-upload
   */
  allowSvgUpload(): boolean;

  /**
   * Returns if buyer is only allowed to upload vector (svg) files
   * #ai-api:images-upload
   */
  allowOnlyVectorImageUpload(): boolean;

  /**
   * automatically distribute images to frames on the cover document.
   * Returns a list of all applied image-ids.
   * #ai-api:photobook
   */
  distributeImagesOnCover(images?: iExternalImage[]): Promise<Array<string>>

  /**
   * automatically distribute all non used uploaded images to frames which have not been assigned yet.
   * Returns a list of all applied image-ids.
   * Force needs to be true if "manual" distribution is active
   * #ai-api:images-editing
   */
  distributeImages(force?: boolean): Promise<Array<string>>

  /**
   * check number of distributable image boxes
   * if greater than 1 return true
   * #ai-api:images-editing
   */
  allowImageDistribution(): boolean

  /**
   * Tells UI to always show image distribution button.
   * #ai-api:images-editing
   */
  showImageDistributionButton(): boolean

  /**
   * current image distribution mode set on template level
   * #ai-api:images-editing
   */
  imageDistributionMode(): "distributeOnUpload" | "distributeToAllFrames" | "distributeManually"

  /**
   * Tells UI to always show image background remove button.
   * @param propertyId The selected property-id
   */
  allowImageBackgroundRemove(propertyId: string): boolean

  /**
   * Tells UI to always show image background remove button.
   * @param propertyId The selected property-id
   */
  allowImageUpscale(propertyId: string): boolean

  /**
   * Removes Background of currently selected images
   * @param propertyId The selected property-id
   */
  removeImageBackground(propertyId: string): Promise<boolean>

  /**
   * Tells UI to show the button which cuts out the face (bg-face) without adding a contour.
   * @param propertyId The selected property-id
   */
  allowBackgroundFaceRemove(propertyId: string): boolean

  /**
   * Indicates if the frame of the given image property has an assign action (e.g. background removal or face swap),
   * which runs on every image assigned to that frame. The UI offers no AI image tools for such a frame.
   * @param propertyId The selected property-id
   */
  hasImageAssignAction(propertyId: string): boolean

  /**
   * Cut out face of currently selected images
   * @param propertyId The selected property-id
   */
  removeBackgroundFace(propertyId: string): Promise<boolean>

  /**
   * Asks the server whether the image behind that property can still be upscaled. Does not upscale
   * anything, use it to decide what to offer the buyer before calling upscaleImage().
   * @param propertyId The selected property-id
   */
  canUpscale(propertyId: string): Promise<boolean>

  /**
   * How much bigger the image behind that property can still get, as a linear factor: 1 when no
   * upscale is left, 2 for one step, 4 for two and so on. Multiply the current dpi by it to learn
   * the best resolution the frame can still reach.
   * @param propertyId The selected property-id
   */
  getMaxUpscaleFactor(propertyId: string): number

  /**
   * Whether the buyer may change the size of that frame, which is one way out of a poor print
   * resolution. False when the template locks the size or does not allow frame handling at all.
   * @param propertyId The selected property-id
   */
  canResizeFrame(propertyId: string): boolean

  /**
   * Upscales Image of currently selected images
   * @param propertyId The selected property-id
   */
  upscaleImage(propertyId: string): Promise<boolean>

  /**
   * Creates a cut contour around the image
   * @param propertyId The selected property-id
   */
  createCutContour(propertyId: string, outline?: number): Promise<boolean>

  /**
   * returns true if a single frame with buyer side image upload allow is selected
   * #ai-api:images-editing
   */
  currentSelectionAllowsImageUpload(): boolean

  /**
   * Tells UI to resize an image in the "My Photos" tab to fit within the bounds of its container with no cropping ("fit")
   * or to expand an image to fill the whole container potentially with cropping ("fill")
   * #ai-api:images-upload
   */
  getImageThumbFitProperty(): "fill" | "fit"

  /**
   * Tells UI to show the image preview when hovering image thumbnail.
   * #ai-api:images-upload
   */
  showImagePreviewOverlay(): boolean

  /**
   * Tells UI to show the image name under every image thumbnail.
   * #ai-api:images-upload
   */
  showImageCaptions(): boolean

  /**
   * Tells UI to display upload button for image upload from mobile phone.
   * #ai-api:images-upload
   */
  showMobileUploadButton(): boolean

  /**
   * Tells UI to display download button on image thumbnail.
   * #ai-api:images-upload
   */
  allowImageDownload(): boolean

  /**
   * Tells UI that the frame bar's photo button should open the file dialog right away, instead of
   * only opening the photos section of the properties panel. 
   * Set per template in Buyer-Side-Settings > Ui Hints.
   * #ai-api:images-upload
   */
  openImageUploadFromFrameBar(): boolean

  /**
   * get a QR Code for uploading images on mobile phone
   * Pass the returned channelId to startExternalImagePolling() to receive the uploaded images.
   * #ai-api:images-upload
   */
  createExternalImageUploadChannel(): Promise<{ qr: HTMLImageElement, channelId: string }>

  /**
   * check for images uploaded from phone
   * @param channeldId The channel id returned by createExternalImageUploadChannel()
   * #ai-api:images-upload
   */
  startExternalImagePolling(channeldId: string, isHandwriting?: boolean, cancellationToken?: StoppingToken): void

  /**
   * delete buyer uploaded images that are not in use
   * Returns the number of successfully deleted images.
   * @param images array of images to be deleted
   * #ai-api:images-upload
   */
  deleteImages(images: Array<iExternalImage>): number

  /**
   * If property is empty it returns the list of buyer uploaded images.
   * @param propertyId id of property which shows the image list
   * #ai-api:images-upload
   */
  getImages(propertyId?: string): Array<iExternalImage>

  /**
   * Returns all buyer uploaded images including information if the image is in use
   * #ai-api:images-upload
   */
  getAllImages(): Array<iExternalImage>

  /**
   * Returns all available image groups
   * @param propertyId id of property which shows the image list
   * #ai-api:images-upload
   */
  getImageGroups(propertyId?: string): Array<string>

  /**
   * Returns image-count in "Buyer Upload" folder.
   * #ai-api:images-upload
   */
  getUploadedImagesCount(): number

  /**
   * When using direct upload, this will return the count of outstanding image uploads.
   * #ai-api:images-upload
   */
  getPendingImageUploadsCount(): number

  /**
   * Returns if an externalProperty resolves to multiple mobile-ui-buttons
   * @param p
   */
  hasMetaProperties(p: iExternalProperty): boolean

  /**
   * Returns if a specific image is used in buyer editable frame.
   * @param imageId Id of image to test
   * #ai-api:images-upload
   */
  isImageInUse(imageId: string): boolean

  /**
   * Returns extended information about image and its frame
   * @param propertyId The property-id of the image frame
   * #ai-api:images-editing
   */
  getImageFrameInfos(propertyId: string): iExternalImageFrameInfos

  /**
   * Returns image name by js-name of frame.
   * #ai-api:images-upload
   */
  getImageName(jsName: string): string | null

  /**
   * Retrieves a list of available font-sizes in point
   * #ai-api:text-editing
   */
  getFontSizesInPt(): Array<number>

  /**
   * Retrieves a list of available font-sizes in point
   * #ai-api:text-editing
   */
  getFontSizesInPercent(): Array<number>

  /**
   * Sets global hyphenation language which overrides local language set on story/text-frame level.
   * @param lang language
   */
  setDefaultHyphenationLanguage(lang: iExternalHyphenationLanguage): Promise<boolean>

  /**
   * Returns a list of available fonts for a certain selected property (frame).
   * @param propertyId Id of property to filter available fonts per frame
   * #ai-api:text-editing
   */
  getFonts(propertyId: string): Array<iExternalFont>;

  /**
   * Returns the fonts a buyer may pick for a certain text frame, grouped by their font group, when the template has
   * a font set: "Buyer Fonts" first, then the frame's other groups, then the font lists of the set in its order.
   * Fonts keep the order of the template. Returns an empty array if the template has no font set or the frame does
   * not allow changing the font: use `getFonts()` then.
   * @param propertyId Id of property to filter available fonts per frame
   * #ai-api:text-editing
   */
  getFontGroups(propertyId: string): Array<iExternalFontGroup>;

  /**
   * Loads a font of the current template into the editor and caches it, so it can be rendered
   * and measured immediately. Fonts are normally loaded on demand, so call this before you set a
   * font on a text (e.g. via `setTextStyleProperty`) to avoid a short unstyled flash.
   * Returns instantly if the font is already cached.
   * @param fontName Name of the font as returned by `getFonts()` (the `name` property)
   * @returns true if the font is available (loaded now or already cached), false if no font with
   * that name exists in the template or the download failed.
   * #ai-api:text-editing
   */
  loadFont(fontName: string): Promise<boolean>;

  /**
   * Returns a list of available colors for a certain selected property (frame).
   * @param propertyId Id of property to filter available color per frame
   * @param bgColorIndex if passed a number here, it returns the background color properties without a selection.
   * #ai-api:text-editing
   */
  getColors(propertyId: string, bgColorIndex?: number): Array<{
    name: string;
    color: string;
  }>;

  /**
   * Return color schemes if available as external property
   * #ai-api:text-editing
   */
  getColorSchemes(): iExternalProperty | null

  /**
   * Return primary display color from a color scheme (if available) as hex color
   * #ai-api:text-editing
   */
  getColorByColorScheme(schemeName: string): string | null

  /**
   * Whether UI should show color schemes for layout snippets
   * #ai-api:layouts-snippets
   */
  showLayoutSnippetColorSchemes(): boolean

  /**
   * Wether UI should jump to FormFields Tab after Layout Selection
   */
  jumpToFormFieldsAfterLayoutApply(): boolean

  /**
   * Returns current pasteboard color
   */
  getPasteboardColor(): string

  /**
   * Shows internal color dialog to select cmyk color
   * @param p
   */
  showColorDialog(p: iExternalProperty, bcuiCssVariables?: any): Promise<iExternalColor | null>

  getColorInfo(p: iExternalProperty): iExternalColor | null

  /**
   * Returns a list of available paragraph-style for a certain selected property (frame).
   * @param propertyId Id of property to filter available styles per frame
   * #ai-api:text-editing
   */
  getParagraphStyles(propertyId: string): Array<{
    class: string,
    css: string
  }>;

  /**
   * Returns hex color from rgb value
   * @param color rgb color value
   * #ai-api:text-editing
   */
  getHexColor(color: string): string

  /**
   * Returns black or white hex depending on color value
   * #ai-api:text-editing
   */
  invertColor(hex: string, bw: boolean): string

  /**
   * Retrieves a SVG icon from printess
   * @param icon
   * #ai-api:icons
   */
  getIcon(icon: iconName, width?: number, height?: number, padding?: number): SVGElement

  /**
   * Retrieves a SVG icon as plain string from printess
   * #ai-api:icons
   */
  getIconAsString(icon: iconName): string

  /**
   * Retrieves all available icon-names
   * #ai-api:icons
   */
  getAllIconNames(): iconName[]

  /**
   * Sets attach-parameter icons later in the game
   */
  setCustomIcons(icons: Partial<Record<iconName, string>>, addToExisting: boolean): void

  /**
  * Sets attach-parameter scripts later in the game
  */
  setCustomScripts(scripts: Partial<Record<string, string>>, addToExisting: boolean): void

  /**
   * Returns true if printess has full Designer edit rights and is not running in Shop-Mode
   * #ai-api:core
   */
  isInDesignerMode(): boolean;

  /**
   * Focus single or multi line editor when active
   */
  focusActiveTextEditor(): boolean

  /**
   * Shifts the entire printess view up and down in pixels.
   * #ai-api:viewport-zoom
   */
  setExternalTopOffset(value: number): void

  /**
   * Trigger a resize and fit of the current page, can focus the selection alternatively.
   * @param immediate Optional: Determines if resize should wait for a second or happens immediately
   * @param focusSelection Optional: Will zoom to current selection
   * @param width Optional: Overrides the retrieved offsetWidth of the printess container - helpful when animations are longer running
   * @param height Optional: Overrides the retrieved offsetHeight of the printess container - helpful when animations are longer running
   * @param focusFormFieldId Optional: Form field id to zoom to
   * #ai-api:viewport-zoom
   */
  resizePrintess(immediate?: boolean, focusSelection?: boolean, width?: number, height?: number, focusFormFieldId?: string): void;


  /**
   * Trigger a resize and fit of the current page to an exact target rectangle instead of the measured container size.
   * `immediate` and `focusSelection` behave like in `resizePrintess()`.
   * @param alwaysCenterSpread The default value is false
   * #ai-api:viewport-zoom
   */
  resizePrintessExact(immediate: boolean, focusSelection: boolean, size: iRect, focusFormFieldId?: string, alwaysCenterSpread?: boolean): Promise<void>

  /**
   * Returns the title of the currently loaded template. May be an empty string if the template has no title set.
   * #ai-api:core
   */
  getTemplateTitle(): string;
  /**
   * Returns the name of the currently loaded template.
   * #ai-api:core
   */
  getTemplateName(): string;

  /**
   * Get the link required for displaying an info icon that opens a product info overlay / dialog
   * #ai-api:basket-pricing
   */
  getProductInfoUrl(): string;

  /**
   * Returns true if the snippet has been lastly applied on the current document
   * #ai-api:layouts-snippets
   */
  isLastAppliedLayout(snippetUrl: string): boolean


  /** Returns global debug flag */
  debug(): boolean


  /**
   * Returns all images placed on the current spread
   * #ai-api:images-editing
   */
  getImagesFromCurrentSpread(excludeSelectedFrames: boolean, skipDefaultImages: boolean, onlyFramesWithLayoutOrigin: boolean): iExternalImage[]


  /**
   * Selects the best layout snippet for the passed images, inserts it and assigns the images to its frames.
   * @param splitVariantId optional split-variant id of the collage layout to apply (see getMatchingCollageLayouts)
   * @param spreadId optional id of the target spread
   * #ai-api:layouts-snippets,images-editing
   */
  insertLayoutAndAssignImages(images: iExternalImage[], splitVariantId?: string | null, spreadId?: string): Promise<void>;

  /**
   * Selects the cover layout snippet for all cover images and inserts it to the cover.
   * #ai-api:photobook
   */
  insertCustomCoverImagesToCoverLayout(coverCluster?: { imageId: string; thumbUrl: string; }[]): Promise<void>;

  /**
   * Returns the maximum number of images in a single collage
   * #ai-api:layouts-snippets
   */
  getMaxCollageImages(): number

  /**
   * Returns a selection of all matching collage layouts
   * @param images images to distribute
   * #ai-api:layouts-snippets
   */
  getMatchingCollageLayouts(images: iExternalImage[]): Promise<iExternalCollageLayout[]>;

  /**
   * Checks whether the user has made any edits (only checks for added text frames for now) to the current spread that would be discarded by applying a new layout.
   * @param snippetKind What is about to be applied. `"layout"` (default) checks the frames a new layout replaces.
   * `"background"` checks only the frames a background snippet replaces: frames an earlier background brought in,
   * and frames on the BACKGROUND layer. The frames of the layout itself stay when a background changes.
   * @returns An array of all content types that would be discarded on layout application.
   * #ai-api:layouts-snippets
   */
  getDiscardedContentOnLayoutAppliation(snippetKind?: "layout" | "background"): Promise<Array<string>>

  /**
   * Returns the layout snippet template and doc name for the current spread
   * #ai-api:layouts-snippets
   */
  getLastAppliedLayoutInfo(): { snippetTemplateName: string, snippetDocName: string, snippetDocId: string, splitVariantId?: string | null } | null


  /**
   * Insert a Layout-Snippet on the current spread of the current document
   * @param snippetUrl The Url of the snippet
   * @param targetPage optional, forces layout-snippets to left or right side if aspect ratio of snippet matches dimensions a single page of a double page spread
   * @param hideRemoveBorderOption optional, Default value is false
   * #ai-api:layouts-snippets
   */
  insertLayoutSnippet(snippetUrl: string, targetPage?: "left" | "right" | "entire", spread?: any, colorScheme?: string, hideRemoveBorderOption?: boolean, splitVariant?: number, forceRepeat?: ForceSnippetPlacement, layoutImageSelection?: "apply" | "skip", removeBoxesOnBackgroundLayer?: boolean, addingBackgroundLayout?: boolean): Promise<void>;

  /**
   * returns if a selected sticker could replace the current selection
   * #ai-api:layouts-snippets
   */
  stickerCanReplaceFrame(): boolean

  /**
   * Insert a Sticker (Group-Snippet) on the current spread of the current document
   * @param snippetUrl The Url of the snippet
   * @param autoAssignToSelectionIfPossible The default value is false
   * #ai-api:layouts-snippets
   */
  insertGroupSnippet(snippetUrl: string, targetSplitterBoxId?: string, autoAssignToSelectionIfPossible?: boolean): Promise<void>;

  /**
   * Load a list of layout snippets which can be used during photo-book spread insertion
   * #ai-api:photobook
   */
  getInsertSpreadSnippets(): Promise<Array<iExternalSnippet>>


  /**
   * Get a list of all splitter-content-snippets
   * #ai-api:layouts-snippets
   */
  getSplitterSnippets(): Promise<Array<iExternalSnippet>>

  /**
   * If the current selection should show photo-frame-styles (PanelUI only)
   * #ai-api:layouts-snippets
   */
  hasPhotoFrameSnippets(): boolean

  /**
   * Get a list of all photo-frame-snippets
   * #ai-api:layouts-snippets
   */
  getPhotoFrameSnippets(): Promise<{ topics: Array<iSnippetMenuTopic>, snippets: Array<iExternalSnippet> }>

  /**
   * If the current selection should show text-frame-styles (PanelUI only)
   * #ai-api:layouts-snippets
   */
  hasTextFrameSnippets(): boolean

  /**
   * Get a list of all text-frame-snippets
   * #ai-api:layouts-snippets
   */
  getTextFrameSnippets(): Promise<{ topics: Array<iSnippetMenuTopic>, snippets: Array<iExternalSnippet> }>

  /**
   * Replaces current splitter-cell with splitter-snippet content
   * #ai-api:layouts-snippets
   */
  applySplitterCellSnippet(splitterSnippetUrl: string): Promise<void>

  /**
   * Applies the given photo-frame snippet to the currently selected frame
   * @param snippetUrl The Url of the snippet
   * #ai-api:layouts-snippets
   */
  applyPhotoFrameSnippet(snippetUrl: string): Promise<void>


  /**
   * Get a list of all image-filter-snippets having any of the provided tags
   */
  getImageFilterSnippets(tags: Array<string> | ReadonlyArray<string>): Promise<Array<iExternalSnippet>>

  /**
   * Applies image-filter-snippet to selected image
   */
  applyImageFilterSnippet(filterSnippetUrl: string): Promise<void>


  /**
   * Insert a document from any template like a layout-snippet or group-snippet (sticker) to the current document/spread
   * This method comes in handy if you have your own snippet-management in place.
   * Any template can be inserted (Does not have to be published as snippet),
   * but if the template/document is a snippet the placement-settings will be used
   * @param mode: Optional, default is "layout" setting to "group" will insert template/document as sticker (group-snippet)
   * #ai-api:layouts-snippets
   */
  insertTemplateAsLayoutSnippet(templateName: string, templateVersion: "draft" | "published", documentName: string, mode: "layout" | "group"): Promise<void>


  /**
   * Saves and publishes the template.
   * @param name The name you want to save the template under.
   * @deprecated No direct replacement â€” will not work from buyer side.
   * #ai-api:core,legacy
   */
  saveAndPublish(name: string): Promise<void>;

  /**
   * returns an array of uiHints to be displayed on buyer side.
   */
  uiHintsDisplay(): Array<"splitterGuide" | "layoutSnippets" | "groupSnippets" | "editableFrames" | "expertMode">;

  /**
   * Returns view dependend visibility of a certain panel-ui-hint
   */
  getPanelUiHintVisibility(pos: PanelUiHintPos, view: "mobile" | "desktop"): boolean

  /**
   * Retrieves a style value from a particular class
   */
  getStyleValue(className: string, propertyName: string): string

  /**
   * Returns if buyer ui should display the page navigation
   * @deprecated Use `pageNavigationDisplay()` instead, which returns the navigation style ("hide" | "numbers" | "icons" | "doc-tabs").
   * @see pageNavigationDisplay
   * #ai-api:pages-documents,legacy
   */
  showPageNavigation(): boolean;

  /**
   * Returns how the buyer ui should display the page navigation: hidden, as page numbers for the current doc, as icons (thumbnails) for all docs, or as doc-tabs.
   * #ai-api:pages-documents
   */
  pageNavigationDisplay(): "hide" | "numbers" | "icons" | "doc-tabs";

  /**
   * Ignore entire page click, and always zoom to single page
   * #ai-api:viewport-zoom
   */
  forceZoomToSinglePageOnMobile(): boolean
  /**
   * Returns if buyer ui should display the search bar for searching through images
   * #ai-api:images-upload
   */
  showSearchBar(): boolean

  /**
   * Returns if buyer ui should display option for custom colors in color dropdown
   */
  enableCustomColors(): boolean

  /**
   * Returns maximum two image IDs with biggest boxes on a spread (to define colors from it)
   */
  getImageBoxesForColorPalette(): string[]

  /**
   * Returns if buyer ui should display undo and redo buttons
   * #ai-api:viewport-zoom
   */
  showUndoRedo(): boolean

  /**
   * Executes an undo step if available.
   * #ai-api:viewport-zoom
   */
  undo(): void;

  /**
   * Executes a redo step if available.
   * #ai-api:viewport-zoom
   */
  redo(): void;

  /**
   * Returns number of available undo steps
   * #ai-api:viewport-zoom
   */
  undoCount(): number

  /**
   * Returns number of available redo steps
   * #ai-api:viewport-zoom
   */
  redoCount(): number

  /**
   * return if zoom options should be displayed
   * #ai-api:viewport-zoom
   */
  allowZoomOptions(): boolean

  /**
   * Zoom in on spread visible
   * #ai-api:viewport-zoom
   */
  zoomIn(): void

  /**
   * Zoom out of spread visible
   * #ai-api:viewport-zoom
   */
  zoomOut(): void

  /**
   * Returns all important informations to create a dynamic photobook
   * #ai-api:photobook
   */
  getDocInfoForPhotobook(): iExternalPhotobookDocInfo | null

  /**
   * Check for double page spreads to show/hide zoom to spread option
   * #ai-api:pages-documents
   */
  isDoublePageSpread(): boolean

  /**
   * Returns the last applied collage split-variant id for the current spread
   * #ai-api:layouts-snippets
   */
  currentSpreadSplitVariantId(): string | null

  /**
   * Returns if the number of spreads fits the requirements set in the template
   * @param spreadSize current number of spreads
   * #ai-api:photobook
   */
  isNoOfPagesValid(spreadSize: number): boolean

  /**
   * Return if buyer can change the spread order
   * #ai-api:photobook
   */
  canReArrangeSpreads(spread?: iExternalSpreadInfo): boolean

  /**
   * Book-Inside-Pages only feature:
   * re arranges all spreads by a given array of ids or "newSpread"
   *
   * `id`: either current spread id or "newSpread"
   *
   * `snippetUrl` (optional): Layout Snippet, which is inserted on the new spread
   *
   * example:
   *
   * ```
   * await api.reArrangeSpreads([
   *   {
   *     id: "PZE4tKlZmD9Mx9gZ0OIfx" // existing spread
   *   },
   *   {
   *     id: "newSpread",
   *     snippetUrl: "https://printess-prod.s3.eu-central-1.amazonaws.com/uploads/snippet/fc8b773be98ee6d58ffebd9d955a55252ddc9a0a/json/764f973bb7d9a0ae9691c3d62cf941baac6cd13e/91b02c876e345bdc8efe5d4582519a85dfc3726d.json?DOC=PCepmgRyO8E3vz0f7rXlh&ID=40be80b32d36fd85d3127f7258ead6b1dbcb8458"
   *   },
   *   {
   *     id: "PRE4tKlZmD4jj9gZ0OIfx" // existing spread
   *   }
   * ])
   * ```
   *
   * Handle with care, this can destroy your Book-Inside-Pages document
   * @param newSpreadIds Array of spread id or "newSpread" and optional snippetUrls for all "newSpreads" in correct order
   * #ai-api:photobook
   */
  reArrangeSpreads(newSpreadIds: Array<{ id: string | "newSpread", snippetUrl?: string }>, updateBackground?: boolean): Promise<boolean>

  /**
   * Returns how many spreads would be added before the back cover if `addSpreads()` is called.
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * @param spreadSize Optional: number of current spreads (used in arrange pages dialog where actual number of spreads is not yet applied)
   * #ai-api:photobook
   */
  canAddSpreads(spreadSize?: number): 0 | 1 | 2

  /**
   * Photo-Book only feature:
   * Add new spreads / pages to the current document before the back cover
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * #ai-api:photobook
   */
  addSpreads(): Promise<boolean>

  /**
   * Returns how many spreads would be removed before the back cover if `removeSpreads()` is called.
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * @param spraedSize Optional: number of current spreads (used in arrange pages dialog where actual number of spreads is not yet applied)
   * #ai-api:photobook
   */
  canRemoveSpreads(spraedSize?: number): 0 | 1 | 2

  /**
   * Photo-Book only feature:
   * Remove spreads / pages from the current document before the back cover
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * #ai-api:photobook
   */
  removeSpreads(): Promise<boolean>

  /**
   * Photo-Book only feature:
   * Remove just the single current selected spread from photo-book doc.
   * #ai-api:photobook
   */
  removeCurrentSpread(): Promise<void>


  /**
   * Tells if user is allowed to duplicate the current spread
   * #ai-api:pages-documents
   */
  canDuplicateSpread(): boolean

  /**
   * Duplicates the currently selected spread
   * @returns true if the spread was duplicated successfully
   * #ai-api:pages-documents
   */
  duplicateSpread(): Promise<boolean>

  /**
   * Gets the state of the "lockCoverInside" user setting in "book" mode
   * If set to true the first and last page is hidden from the buyer and no photo is distributed on that pages
   * Helpful for certain layflat photobooks
   * #ai-api:photobook
   */
  lockCoverInside(): boolean

  /**
   * Renders the first page of a document as an image.
   * @param fileName deprecated. Not used anymore.
   * @param documentName Optional: The name of the document you want to render the pages images for. If not provided the one marked as thumbnail will be taken, otherwise the preview document, or as last try the first/primary document.
   * @param maxWidth Optional: Maximum render width. Defaults to 400.
   * @param maxHeight Optional: Maximum render height. Defaults to 400.
   * @returns Url to the image. Can be png with transparency or jpg.
   * #ai-api:basket-pricing
   */
  renderFirstPageImage(fileName: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string>;


  /**
   * Renders all pages as images for the given document.
   * @param fileNameSuffix deprecated. Not used anymore.
   * @param documentName Optional: The name of the document you want to render the pages images for. If not provided the one marked as thumbnail will be taken, otherwise the preview document, or as last try the first/primary document.
   * @param maxWidth Optional: Maximum render width. Defaults to 400.
   * @param maxHeight Optional: Maximum render height. Defaults to 400.
   * @returns Array of urls to the images. They can be png with transparency or jpg.
   * #ai-api:basket-pricing
   */
  renderPageImages(fileNameSuffix: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string[]>;

  /**
   * Tells if printess detects the current device as a mobile device.
   * #ai-api:viewport-zoom
   */
  isMobile(): boolean;

  /**
   * True when the buyer ui shows its desktop panel layout on a device with a software keyboard
   * (tablet, big phone in landscape). Text properties are then edited in the full-screen overlay,
   * because panel inputs would be covered by the keyboard.
   */
  isTabletLayout(): boolean;

  // check if device is iPhone or iPod
  /**
   * Tells if the current device is an iPhone or iPod.
   * #ai-api:viewport-zoom
   */
  isIPhone(): boolean;

  /**
   * Tells if printess has currently selected frames
   * #ai-api:frames-selection
   */
  hasSelection(): boolean

  /**
   * Tells the ui if it can rely that only one of the returned frame-types is selected
   */
  selectedFrameBarFeature(): { images: number, texts: number, shapes: number, storys: number, total: number }

  /**
   * Hides Done Button in UI-Helper
   * @deprecated - Will always return false
   */
  hideDoneButtonInUiHelper(): boolean;

  /**
   * Returns the current buyer step, or null if there is no current step.
   * #ai-api:steps-workflow
   */
  getStep(): iBuyerStep | null;
  /**
   * Indicates if the current step has become inactive, because the user has selected other frames
   * TRUE if the current step is part of the selection.
   * #ai-api:steps-workflow
   */
  isCurrentStepActive(): boolean;

  /**
   * Returns step information
   * @param index Index of the step to retrieve
   * #ai-api:steps-workflow
   */
  getStepByIndex(index: number): iBuyerStep | null

  /**
   * Indicates if the current template has buyer-steps
   * #ai-api:steps-workflow
   */
  hasSteps(): boolean

  /**
   * Jumps directly to the step with the given index.
   * @param index Index of the step to go to
   * @param zoom overrides the frames zoom settings for all devices
   * #ai-api:steps-workflow
   */
  setStep(index: number, zoom?: "frame" | "spread"): Promise<void>

  /**
   * Retrieves last step
   * #ai-api:steps-workflow
   */
  lastStep(): iBuyerStep | null;

  /**
   * Returns true if a next step is available
   * #ai-api:steps-workflow
   */
  hasNextStep(): boolean;

  /**
   * Returns true if a previous step is available
   * #ai-api:steps-workflow
   */
  hasPreviousStep(): boolean;

  /**
   * Returns true if a previous step is availabel
   */
  showFormFieldTabsAsSteps(): boolean;

  /**
   * Indicates if the next step is the preview document.
   * #ai-api:steps-workflow
   */
  isNextStepPreview(): boolean;

  /**
   * Register Select Layout Dialog shown for specific Spread
   */
  selectLayoutDialogHasBeenShownForCurrentSpread(spreadId: string): void;

  /**
   * Lets printess know that the layout has been applied
   */
  resetUndoBufferAfterInitialLayoutSelection(spreadId: string): void;


  /**
   * Return true if buyer can deselect an item on the current spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers
   * Important to keep buyer in the step-logic
   * #ai-api:steps-workflow
   */
  buyerCanHaveEmptySelection(): boolean;

  /**
   * Returns true if buyer can select any frame on the current spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers
   * Important to keep buyer in the step-logic
   * #ai-api:steps-workflow
   */
  hasEditableFramesWithoutSteps(): boolean;

  /**
   * Returns true if buyer can select any frame on any document / spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers
   * #ai-api:steps-workflow
   */
  templateHasEditableFramesWithoutSteps(): boolean;

  /**
   * returns desired behaviour of basket button
   * In steps-mode basket button always points to the basket.
   * If no steps are present basket button should lead to the preview
   * #ai-api:basket-pricing
   */
  getBasketButtonBehaviour(): "add-to-basket" | "go-to-preview" | "go-to-book-mook"

  /**
   * Enters the read-only page-flip book preview ("book mook"); switches to the book-cover document first if one exists.
   * #ai-api:pages-documents
   */
  enterBookMookPreview(): Promise<void>
  /**
   * Leaves the read-only page-flip book preview ("book mook").
   * #ai-api:pages-documents
   */
  leaveBookMookPreview(): Promise<void>
  /**
   * Tells UI if currently in Page Flip Book Mook Preview
   * #ai-api:pages-documents
   */
  isInBookMookPreview(): boolean

  /**
   * Tells UI if currently in Read Only Mode
   * #ai-api:pages-documents
   */
  isInReadOnlyBuyerMode(): boolean


  /**
   * Tells the ui if it should show a `Back-Button` from preview to edit.
   * It's true if the currently displayed document is a `preview` document
   * #ai-api:steps-workflow
   */
  hasPreviewBackButton(): boolean

  /**
   * Jumps to the previous available preview document if there is one.
   * #ai-api:steps-workflow
   */
  gotoPreviousPreviewDocument(zoomDuration?: number): Promise<void>

  /**
   * Jumps to the next available preview document if there is one.
   * #ai-api:steps-workflow
   */
  gotoNextPreviewDocument(zoomDuration?: number): Promise<void>

  /**
   * Retrieves information if the device is mobile or the screen is so small that zoom to frames is needed
   * #ai-api:viewport-zoom
   */
  zoomToFrames(isMobile?: boolean): boolean

  /**
   * Tells which part of the current spread is in view: `entire`, `left-page`, `right-page` or `none`.
   * @param part Optional: the specific part to check for.
   * #ai-api:viewport-zoom
   */
  isSpreadInView(part?: "entire" | "left-page" | "right-page"): "entire" | "left-page" | "right-page" | "none"

  /** Tells printess that a user interaction has changed the zoom, no automatic spread zoom will be executed after this */
  setUserHasZoomedFlag(newValue: boolean): void;

  /**
   * Tells printess the zoom mode to use for the next resize operation
   * `spread` zooms to the entire page
   * `frame` zooms to the selected frame(s)
   * #ai-api:viewport-zoom
   */
  setZoomMode(m: "spread" | "frame"): void

  /**
   * Retrieves the current zoomMode (see `setZoomMode()`)
   * #ai-api:viewport-zoom
   */
  getZoomMode(): "spread" | "frame"


  /**
   * Tells if the current selection can be moved around by the user
   * #ai-api:frames-selection
   */
  canMoveSelectedFrames(): boolean

  /**
   * Tells if parts of the current selection can be deleted
   * #ai-api:frames-selection
   */
  canDeleteSelectedFrames(): boolean

  /**
   * Tells if the current selection is part of a collage and accordingly influences the size of other images and own size when changing
   * #ai-api:layouts-snippets
   */
  canSplitSelectedFrames(): boolean

  /**
   * Change an image frame to a text snippet frame in a photo collage
   * #ai-api:layouts-snippets
   */
  convertSplitterCellToText(): Promise<void>

  /**
   * Change a text snippet frame to an image frame in a photo collage
   * #ai-api:layouts-snippets
   */
  convertSplitterCellToImage(): Promise<void>

  /**
   * Aligns all splitter clusters on current spread to document margins
   * #ai-api:layouts-snippets
   */
  alignSplitterClustersToDocMargin(): Promise<void>

  /**
   * Set the gap size of the photo grid
   * @param n gap size of the photo grid
   * #ai-api:layouts-snippets
   */
  setSplitterGaps(n: number): Promise<void>

  /**
   * Returns the next possible gap actions for the splitter layout on the current spread:
   * whether a gap around the splitter frames can be added or removed (`gapAround`),
   * the current gap value (`gap`) and which gap sizes may be set via setSplitterGaps (`setGap`: "all" includes a zero gap, "only>0" only positive sizes)
   * #ai-api:layouts-snippets
   */
  nextGapAction(): { gapAround: null | "add" | "remove", gap: number, setGap: null | "all" | "only>0" }

  /**
   * Returns if current spread has splitter frames
   * #ai-api:layouts-snippets
   */
  hasSplitters(): boolean

  /**
   * If splitter frames are present on current spread this method adds
   * a gap between all splitter-frames and the page border
   * Returns `true` if successful
   * #ai-api:layouts-snippets
   */
  addGapAround(): Promise<boolean>

  /**
   * If splitter frames are present on current spread this method removes
   * the gap between all splitter-frames and the page border
   * Returns `true` if successful
   * #ai-api:layouts-snippets
   */
  removeGapAround(): Promise<boolean>

  /**
   * Returns `true` if either rich- or simple-text-editor is currently active
   */
  isTextEditorOpen(): boolean

  /**
   * Open rich- or simple-text-editor
   */
  showTextEditor(): void

  /**
   * Returns `true` if either rich- or simple-text-editing is allowed (text-content is turned on)
   */
  showEnterTextEditorButton(): boolean

  /**
   * Returns true if text styles should have a caption
   */
  showTextStyleCaptions(): boolean

  /**
   * Returns true if selection has sub-doc (group) to open.
   * #ai-api:frames-selection
   */
  canOpenSelectedGroup(): boolean

  /**
   * Returns true if a group of frames is selected instead of one plain frame - either a group
   * (sub-doc) frame like a sticker, or several frames at once.
   * #ai-api:frames-selection
   */
  isGroupSelected(): boolean

  /**
   * Opens the selected sub doc (group)
   * #ai-api:frames-selection
   */
  openSelectedGroup(): Promise<void>

  /**
   * Opens a single photo-print document for full editing from the single-photo pages overview.
   * Returns to the overview via `selectLastDocument()` (back button surfaces automatically).
   * #ai-api:single-photo-prints,pages-documents
   */
  openSinglePhotoDoc(docId: string): Promise<void>

  /**
   * Goes to the next available step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   * #ai-api:steps-workflow
   */
  nextStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns true if current doc is a 3D Preview
   * #ai-api:steps-workflow
   */
  is3dPreviewSelected(): boolean

  /**
   * Goes to the previous step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   * #ai-api:steps-workflow
   */
  previousStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns the total amount of available preview-steps. 0 indicates no preview
   * #ai-api:steps-workflow
   */
  previewStepsCount(): number;

  /**
   * Goes directly to the preview-step-index
   * @param previewIndex Zero based index of the preview steps. See also: previewStepsCount()
   * @param zoom overrides the frames zoom settings for all devices
   * #ai-api:steps-workflow
   */
  gotoPreviewStep(previewIndex?: number, zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the first step, helpful if you want to exit the preview step.
   * @param zoom overrides the frames zoom settings for all devices
   * #ai-api:steps-workflow
   */
  gotoFirstStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the last step, helpful if you want to skip steps.
   * @param zoom overrides the frames zoom settings for all devices
   * @param offset helps to get to the step before last step (offset = 1), default offset is 0
   * #ai-api:steps-workflow
   */
  gotoLastStep(zoom?: "frame" | "spread", offset?: number): Promise<void>

  /**
   * Turns the display of step numbers on or off
   * #ai-api:steps-workflow
   */
  displayStepNumbers(display: boolean): Promise<void>

  /**
   * Returns if step numbers are displayed
   * #ai-api:steps-workflow
   */
  stepNumbersDisplayed(): boolean

  /**
   * Returns the template settings for display of steps header on desktop and mobile
   * #ai-api:steps-workflow
   */
  stepHeaderDisplay(): "never" | "only title" | "only badge" | "title and badge" | "badge list" | "tabs list"

  /**
   * Displays a grey overlay on printess editor
   * @param message Message to show on overlay
   */
  showOverlay(message: string): void;

  /**
   * Hides printess editor overlay (see showOverlay())
   */
  hideOverlay(): void;


  /**
   * Returns status of config-flag `neverHideMobileToolbar`, default is false.
   */
  neverHideMobileToolbar(): boolean

  /**
   * Returns true if `autoScale` was set in `attachPrintess` call
   * @deprecated Use `autoScaleDetails()` instead, which also returns the calculated container dimensions.
   * @see autoScaleDetails
   * #ai-api:viewport-zoom,legacy
   */
  autoScaleEnabled(): boolean

  /**
   * Retrieves information if the `auto-scale` option was enabled on `attachPrintess()`
   * Also returns the calculated pixel-dimension of printess container on desktop
   * #ai-api:viewport-zoom
   */
  autoScaleDetails(): { enabled: boolean, width: number, height: number }

  /**
   * Auto Zooms to current selection or spread
   * @param focusFormFieldId FF id to zoom to
   * @param forceZoom overwrites natural behaviour
   * #ai-api:viewport-zoom
   */
  centerSelection(focusFormFieldId?: string, forceZoom?: "spread" | "frame"): Promise<number>

  /**
   * Tells if ui should display a zoom-to-selection button
   * Only returns true if a significant zoom would happen
   * @param focusFormFieldId FF id to zoom to
   * #ai-api:viewport-zoom
   */
  hasZoomToSelectionButton(focusFormFieldId?: string): boolean

  /**
   * Creates an upload provider which uploads buyer files directly to an AWS S3 bucket. Pass the result to setUploadProvider().
   * @param uploadEndpoint The target address to send the upload form data to. E.g. https://your-bucket.s3.eu-central-1.amazonaws.com/
   * @param serveEndpoint The url the files are served from. This can differ from the upload endpoint to make CDN distribution possible. E.g. https://mycloudfrontid.amazonaws.com/
   * @param keyGenerator The method to generate the S3 key. The built-in one just makes sure that the file name is unique per session.
   * #ai-api:images-upload
   */
  createAwsUploaderProvider(uploadEndpoint: string, serveEndpoint?: string, keyGenerator?: (fileName: string, fileHash: string) => string): AwsUploadProvider;

  /**
   * Sets the upload provider used for buyer file uploads (images and fonts).
   * @param provider The new upload provider to use.
   * #ai-api:images-upload
   */
  setUploadProvider(provider: UploadProvider): void;

  /**
   * Associates buyer uploads with your shop user and basket session, so previously uploaded images can be re-imported later via importUserUploadedImages().
   * @param shopUserId Your shop user id. You can provide this to assign uploaded images to this user and load it later on.
   * @param basketId The basket id for this session. You can load images later on with this id.
   * #ai-api:images-upload,basket-pricing
   */
  setShopInfo(shopUserId: string, basketId: string): void

  /**
   * @deprecated
   */
  getContentEditables(): TemplateEditables;

  /**
   * Retrieves all price relevant form-field names and values
   * @deprecated Use `getAllPriceRelevantFormFieldsExt()` instead, which additionally returns tag information and referenced price-categories.
   * @see getAllPriceRelevantFormFieldsExt
   * #ai-api:basket-pricing,legacy
   */
  getAllPriceRelevantFormFields(): { [key: string]: string }

  /**
   * Retrieves all price relevant form-fields plus tag information and referenced price-categories
   * #ai-api:basket-pricing
   */
  getAllPriceRelevantFormFieldsExt(): {
    priceCategories: Array<string>,
    perLetterPriceCategories: Array<{ ffName: string, price: number, amount: number }>,
    formFields: {
      [key: string]: { value: string, tag: string, label: string }
    }
  }

  /**
   * Returns all default english translations or if language property is set / browser language is detected (if set to auto) the respective translation if available
   */
  //  getTranslations(): Record<string, Record<string, string | number> | string | number>;



  /**
   * If text is set to mandatory, it only check for empty text input
   * instead of disallowing the default-value. Comes in handy if you write a name like "Axel" in
   * your text box and still want to to turn on mandatory.
   */
  acceptDefaultTextIfMandatory(): boolean


  /**
   * @deprecated please use async version instead, to ensure open text editors are saved
   * Returns an array of external property errors that can be used to display errors like missing text to the customer
   * @param mode Specifies when and up to which point the validation should be done.
   */
  validate(mode?: "all" | "until-current-step" | "selection"): Array<iExternalError>

  /**
   * Closes open editors and returns an array of external property errors
   * that can be used to display errors like missing text to the customer
   * @param mode Specifies when and up to which point the validation should be done.
   */
  validateAsync(mode?: "all" | "until-current-step" | "selection"): Promise<Array<iExternalError>>

  /**
   * Closes open editors and returns every validation error of the design.
   *
   * Errors the buyer dismissed with the "Ignore" button are still returned, flagged with
   * `isIgnored: true` - so a shop can tell that the buyer knowingly proceeded past a
   * low-resolution image or a blank book page. Filter them out with
   * `errors.filter(e => !e.isIgnored)` if you only want the blocking ones.
   * @param mode Specifies when and up to which point the validation should be done.
   */
  validateAsyncV2(mode?: "all" | "until-current-step" | "selection"): Promise<Array<iErrorType>>


  /**
   * Returns true if the associated mutli-line text-frame has text which does not fit into the frame
   * @param propertyId
   */
  hasTextOverflow(propertyId: string): boolean

  /**
   * Returns short language code in lower case, like "en" or "de"
   */
  languageShort(): string

  /**
   * Returns long language code if available. Otherwise returns short code like `languageShort()`.
   * Format: lower case main language + sub language in upper case, like "en-GB" or "de-DE"
   */
  languageLong(): string

  /**
   * Returns a translation as string to display the ui in different languages
   * @param translationKey String containing the keys for the translation table separated by period
   * @param params String or number parameters that substitute $1, ..., $9 properties in a translation
   * #ai-api:custom-ui
   */
  gl(translationKey: string, ...params: Array<string | number>): string

  /**
   * Returns current global scale factor, should be !== 1 only on iOS devices to avoid safari-crashes
   * #ai-api:viewport-zoom
   */
  globalScaleFactor(): number

  /**
   * Returns if LayoutSnippets are available
   * #ai-api:layouts-snippets
   */
  hasLayoutSnippets(): boolean


  /**
   * Returns selected Layout Category Name that will initially be selected in the Buyer Side for Layout Snippets
   * Can be empty string (and should be ignored) if not set via attach parameters
   * @param categories default value null
   * #ai-api:layouts-snippets
   */
  getInitialLayoutCategoryName(categories?: iSnippetMenuCategory[] | null): string

  /**
   * Returns selected Layout Topic Id that will initially be selected in the Buyer Side for Layout Snippets
   * @param category default value null
   * #ai-api:layouts-snippets
   */
  getSelectedLayoutTopicId(category?: iSnippetMenuCategory | null): string

  /**
   * Returns if the snippet menu of the given type ("layout" | "sticker" | "background") should be rendered
   * #ai-api:layouts-snippets
   */
  hasSnippetMenu(which: "layout" | "sticker" | "background"): boolean

  /**
   * Returns the aspect-ratio name of the current spread (one of "ultra-portrait", "super-portrait", "portrait", "square", "landscape", "super-landscape", "ultra-landscape"), as used to match layout snippets to the spread aspect.
   * Returns "not loaded" if the template is not fully loaded yet.
   * #ai-api:pages-documents
   */
  getDocumentAspectRatioName(): string

  /**
   * Returns the recommended upload size of the currently selected image
   * #ai-api:images-upload
   */
  getSelectedImageRecommendedSize(): null | { pxWidth: number, pxHeight: number }

  /**
   * Returns the filter menu for layout snippets.
   * @deprecated Use getSnippetFilterMenu("layout") instead.
   * @see getSnippetFilterMenu
   * #ai-api:layouts-snippets,legacy
   */
  getLayoutSnippetFilterMenu(): Promise<iSnippetMenuCategory[] | null>

  /**
   * Returns Filter Menu for Layout Snippets ("layout") or for a menu-id passed in "menuId"
   * #ai-api:layouts-snippets
   */
  getSnippetFilterMenu(menuId: "layout" | "background" | "photobook-themes" | string): Promise<iSnippetMenuCategory[] | null>

  /**
   * Returns if ui should show image count filter for layout snippets
   * Only active if filter menu is displayed
   * #ai-api:layouts-snippets
   */
  hasLayoutSnippetImageCountFilter(): boolean

  /**
   * Retrieves available keywords for layout snippet search
   * #ai-api:layouts-snippets
   */
  getLayoutSnippetKeywords(): Promise<Array<string>>

  /**
   * Retrieves available product types for layout snippet search
   * #ai-api:layouts-snippets
   */
  getLayoutSnippetProductTypes(): Promise<Array<string>>

  /**
   * Retrieves all layout snippets matching the given keywords, current language and current aspect ratio
   * #ai-api:layouts-snippets
   */
  loadLayoutSnippetsByKeywords(keywords: string[], topicId?: string): Promise<Array<iExternalSnippet>>

  /**
   * Retrieves all background-layout snippets matching the given keywords
   * #ai-api:layouts-snippets
   */
  loadBackgroundLayoutsByKeywords(keywords: string[], topicId?: string): Promise<Array<iExternalSnippet>>

  /**
   * Retrieves all sticker snippets matching the given tags & keywords and the current language
   * #ai-api:layouts-snippets
   */
  loadStickerSnippetsByKeywords(tags: string[] | ReadonlyArray<string>, keywords: string[]): Promise<Array<iExternalSnippet>>

  /** only for internal use, to transfer visual-viewport to iOs in iframe-mode */
  setIFrameViewPort(v: { offsetTop: number, height: number }): void

  /**
   * Enter the buyer Expert-Mode to allow position, remove and rotation for every frame which is not locked
   * #ai-api:frames-selection
   */
  enterExpertMode(): void

  /**
   * Leave the buyer Expert-Mode (see `enterExpertMode()`)
   * #ai-api:frames-selection
   */
  leaveExpertMode(): void

  /**
   * Returns if Expert-Mode is active
   * #ai-api:frames-selection
   */
  isInExpertMode(): boolean

  /**
   * Returns if Expert-Mode should be enabled on template load
   * #ai-api:frames-selection
   */
  showExpertModeOnLoad(): boolean

  /**
   * Returns if UI should show a button to enter Expert-Mode
   * #ai-api:frames-selection
   */
  hasExpertButton(): boolean

  /**
   * Returns if Current user has elevated buyer-rights
   * #ai-api:core
   */
  isBuyerDesigner(): boolean

  /**
   * Returns if currently loaded template is loaded from a save token.
   * #ai-api:core
   */
  loadedFromSaveToken(): boolean

  /**
   * Returns if the loaded design is a copy the buyer chose to restore after a reload or a crashed browser (see `rescueMode`).
   * Like a design from a save token, the buyer has worked on it already: a UI does not show what belongs to a first start, such as a wizard.
   * #ai-api:core
   */
  loadedFromRescueCopy(): boolean

  /**
   * Returns if still in Buyer Mode (Design Side Only)
   * #ai-api:core
   */
  isBuyer(): boolean

  /**
   * Returns if UI should display a button to save the current work in the buyer side
   * #ai-api:core
   */
  showSaveButton(): boolean

  /**
   * Returns if UI should display a button to render a proof pdf of the current work in the buyer side
   * @see renderProofPdfs
   * #ai-api:basket-pricing
   */
  showProofButton(): boolean

  /**
   * Returns if UI should display a button to show and hide the alignment grid
   * #ai-api:viewport-zoom
   */
  showGridButton(): "on" | "off" | "hide"

  /**
   * Toggles alignment grid
   * #ai-api:viewport-zoom
   */
  toggleGrid(): void

  /**
   * Returns if UI should display a button to save and close the current work in the buyer side
   * #ai-api:core
   */
  showSaveAndCloseButton(): boolean

  /**
   * Returns if UI should force the basket button to be in text form
   * #ai-api:basket-pricing
   */
  forceBasketButtonText(): boolean

  /**
   * Returns if UI should display a button to add current work into the basket
   * #ai-api:basket-pricing
   */
  showAddToBasketButton(): boolean

  /**
   * Indicates if UI should show an alert prompt when user attempts to leave the buyer-side
   * #ai-api:core
   */
  showAlertOnClose(): boolean

  /**
   * Retrieve panel-theme of current document
   */
  getThemeName(): string

  /**
   * Retrieve doc-id of current theme
   */
  getThemeDocId(): string

  /**
   * tells if the propertyId refers to
   * a table form-field which is set as data-source in the template
   */
  isDataSource(propertyId: string): boolean

  /**
   * Returns wether UI should show up/down buttons in table-control
   */
  enableA11yForTableControl(): boolean

  /**
   * Returns whether UI should show button to display Keyboard Shortcuts
   * #ai-api:viewport-zoom
   */
  showKeyboardShortcuts(): boolean

  /**
   * Returns whether UI should show buttons for cropping in the Crop+Rotate overlay
   * #ai-api:images-editing
   */
  showCropOverlayButtons(): boolean

  /**
   * Sets the selected index of the primary data-source if the propertyId refers to
   * a table form-field which is set as data-source in the template
   * @param propertyId id of a table property
   * @param index current row-index to select
   */
  setTableRowIndex(propertyId: string, index: number): void

  /**
   * Retrieves the current row index for a table-property
   * if table is set to be data-source of template the call returns current data-index
   * @param propertyId  id of a table property
   */
  getTableRowIndex(propertyId: string): number


  /**
   * @deprecated This call is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
   * This call will no longer return `iFrameCountAndClasses`, instead it returns `iFrameCountAndMarkers`.
   * @see getBuyerFrameCountAndMarkers
   * #ai-api:basket-pricing,legacy
   */
  getBuyerFrameCountAndClasses(): Array<iFrameCountAndMarkers>


  /**
   * Returns an array of buyer-editable documents and a list of frames for each spread including their frame markers.
   * You can easily use them for statistical purposes or to charge extra prices for certain used layouts.
   * Or just use the frame-count to determine if the user had made changes at all.
   * #ai-api:basket-pricing
   */
  getBuyerFrameCountAndMarkers(): Array<iFrameCountAndMarkers>


  /**
   * Forces calling the shops price change callback
   * Optionally can get a temporary page-count to send to the hosting page
   * #ai-api:basket-pricing
   */
  callPriceChangeCallback(overWritePageCount?: number): void

  /**
   * returns all price relevant data of the current template
   * #ai-api:basket-pricing
   */
  getPriceRelevantData(): iExternalProductPriceInfo

  /**
   * Get price labels for form-field badges from price-tags
   * @param tag price-tag to resolve the label for
   * @param propertyId optional to allow printess to check price-relevance of form field
   * @param newValue optional to calculate per letter price if applicable
   * #ai-api:basket-pricing
   */
  getFormFieldPriceLabelByTag(tag: string, propertyId?: string, newValue?: string): string

  /**
   * When using direct upload, this will return all the pending image upload promises.
   * You can use Promise.any() to show some nice progress.
   * @returns The currently pending upload promises for direct upload.
   * #ai-api:images-upload
   */
  getPendingImageUploads(): Set<Promise<any>>;

  /**
   * When using direct upload, this will return all the image meta data finalization promises.
   * @returns The currently pending metadata promises for direct upload.
   * #ai-api:images-upload
   */
  getDirectImageMetadataFinalizationPromises(): Set<Promise<any>>;

  /**
   * When using direct upload, this returns the count of upload processes.
   * @returns The number of upload processes.
   * #ai-api:images-upload
   */
  getUploadsInProgress(): number;


  populateDesign(autoSelectLayout: boolean, callback: (percent: number, textPreview: string) => void, errorCallback: (error: any) => void): Promise<void>;

  aiDesignMode(): "none" | "printess-make" | "claude-design"

  removeAiImageFramesFromPrimaryDocument(): Promise<void>

  aiDesignKeywords(): Array<string>

  /** returns make-data received on attach printess */
  getAiDesignMakeData(): iMakeData | null

  getAiDesignProperties(): { name: string, p: iExternalProperty }[]

  /**
   * Creates a new photobook from scratch from previously analysized photos (via {@link analyzePhotos}). An already existing photobook will be overwritten.
   *
   * @param callback Callback to report the current progress
   * @param options Options to determine the photobook properties
   * @param freeStyle If true, creates a freestyle photobook instead of a magic photobook
   * @param coverCluster Optional: pre-selected cover images (as customized in the simplified pages view)
   * @param customizedImageSpreads Optional: per-spread image clusters (as customized in the simplified pages view)
   * #ai-api:photobook
   */
  insertPhotobookPages(callback: (percent: number, step: iExternalPhotobookStep, msg: string) => void, options: iExternalPhotobookOptions, freeStyle: boolean, coverCluster?: { imageId: string; thumbUrl: string; }[], customizedImageSpreads?: { imageId: string; thumbUrl: string; }[][]): Promise<void>

  /**
   * Analyzes uploaded images to retrieve the information needed for photobook creation.
   *
   * @param callback Callback to report the current progress
   * @param options Options for the analysis process
   * #ai-api:photobook
   */
  analyzePhotos(callback: (percent: number, step: iExternalImageAnalysisStep, msg: string) => void, options: iExternalImageAnalysisOptions): Promise<void>

  /**
   * @returns The amount of duplicates among all uploaded images.
   * #ai-api:photobook
   */
  getPhotobookDuplicateCount(): number

  /**
   * @returns The amount of screenshots among all uploaded images.
   * #ai-api:photobook
   */
  getPhotobookScreenshotCount(): number

  /**
   * @returns The amount of "bad" images among all uploaded images that can be filtered out,
   * ie screenshots, duplicates, blurry images etc.
   * #ai-api:photobook
   */
  getPhotobookFilteredCount(): number

  /**
   * Gets a preview of how images would be distributed in a photobook when created with the provided options.
   *
   * @param options Options for the photobook creation
   * @returns Preview of the image distribution
   * #ai-api:photobook
   */
  getRenderClustersEstimation(options: iExternalPhotobookOptions): iPhotobookEstimation

  /**
   * Gets a collection of image clusters the way they would be distributed in a photobook when created with the provided options.
   *
   * @param options Options for the photobook creation
   * #ai-api:photobook
   */
  getRenderClustersImages(options: iExternalPhotobookOptions): Promise<{ imageId: string; thumbUrl: string; }[][]>

  /**
   * Gets the image cluster for the cover the way it would be distributed in a photobook when created with the provided options.
   *
   * @param amount number of images for the cover layout
   * #ai-api:photobook
   */
  getRenderClustersCoverImages(amount: number): Promise<{ imageId: string; thumbUrl: string; }[]>

  /**
   * @returns True if any analyzed images are available for photobook creation, false otherwise.
   * #ai-api:photobook
   */
  hasCurPhotobookData(): boolean

  streamPrompt(prompt: string, onMessage: (message: string) => void, onFinished: () => void): Promise<void>;

  /**
   * Stream a prompt to Anthropic (Claude). Forwards text deltas to `onMessage` as they arrive
   * and calls `onFinished` once the stream completes, passing any skill-generated files.
   *
   * @param request.purpose What the prompt is used for. Defaults to `"Claude Design"` server-side.
   *
   * NEVER add an ai-api area tag to this method â€” not even the literal tag token inside this
   * comment, which alone would emit it into core.d.ts. Document it here only.
   */
  streamAnthropicPrompt(
    request: {
      prompt: string,
      model?: "fable-5.1" | "fable-5.0" | "opus-5.5" | "opus-5.0" | "opus-4.8" | "opus-4.7" | "sonnet-5.5" | "sonnet-5.0" | "sonnet-4.6" | "haiku-4.5",
      skill?: string,
      maxTokens?: number,
      effort?: TextEffort_Anthropic,
      imageUrls?: string[],
      sessionId?: string,
      containerId?: string,
      purpose?: "Claude Design" | "Script Creation"
    },
    onMessage: (message: string) => void,
    onFinished: (skillResults?: Array<{ filename: string, mimeType: string, encoding: "utf8" | "base64", data: string }>) => void
  ): Promise<{ sessionId?: string, containerId?: string, aiCreditsUsed?: number }>;

  /**
   * Whether the AI design agent is offered on this template: the designer enabled it, and the
   * account has AI credits. Gate the button that calls `runDesignAgent` on this.
   *
   * #ai-api:generative-ai
   */
  canUseClaudeDesign(): boolean

  /**
   * Generates a design with the authoring agent and applies it to the loaded template.
   *
   * Replaces the former `runClaudeDesign`, which was one non-streaming call that had to produce a
   * correct layout first time. It could not: whether text fits a frame is only knowable by laying it
   * out with print metrics, so every version of it overflowed. The agent writes the design, checks
   * it with its `validate` query and corrects what that reports.
   *
   * Resolves when the run has finished and everything it produced has been applied. Progress arrives
   * through `onOutput` / `onStatus`; persist the inputs by passing `settings`.
   *
   * #ai-api:generative-ai
   */
  runDesignAgent(options: iExternalDesignAgentOptions): Promise<void>

  /**
   * Returns last persisted Claude design dialog inputs from template properties - what a customizer
   * reopens its own design form with.
   *
   * #ai-api:generative-ai
   */
  getClaudeDesignSettings(): iClaudeDesignSettings | undefined

  /**
   * Imports Printess intermediate document format
   *
   * Added to `template-crud` as well as `core`: a host page building its own customizer needs it
   * beside the targeted verbs, since a whole new document is the one thing they cannot express.
   * Read the guide before calling it from a buyer page - without `keepExistingDocuments` it empties
   * the image library and deletes every existing document.
   *
   * #ai-api:core,template-crud
   */
  importTemplate(task: TemplateImportTask, options: TemplateImportOptions): Promise<void>

  /*
    ***** DOCUMENTS AND SPREADS *****

    The verbs elsewhere change what exists; these make it exist. A frame lives on a spread and a
    spread lives in a document, so without these the only way to create either was importTemplate -
    which replaces the image library and every existing document unless told not to, and is therefore
    the wrong tool mid-session.

    The generated ids come back on the result. That is the point: an id cannot be guessed, so a
    caller that could not read it back would have created something it cannot then populate.
  */

  /**
   * Creates a document from one `ImportDocument` and reports the ids it made.
   *
   * The same vocabulary a whole-template import uses, so everything a document can carry is available
   * here - spreads, bleed, margins, layers, per-document form fields, background colour, facing pages,
   * book and cover geometry. It runs the importer rather than a second creation path, which is why:
   * anything the importer learns, this gets.
   *
   * Two things it does that `importTemplate` would not. Existing documents are always kept - the
   * import default replaces the image library and deletes every document, which is never what "add a
   * document" means. And `isEditable` defaults to **true**, because the spread listing reports only
   * editable documents, so a non-editable new document has no discoverable spread id and nothing can
   * be added to it.
   *
   * `pageWidth` / `pageHeight` are lengths in `unit`, which defaults to the open document's unit: a
   * bare number, or `{value, unit}` - never a unit-suffixed string, and never relative or an
   * equation, since a page has no parent to measure against. The frame verbs take lengths the same way. An `ImportSpread` carries no page count
   * (it is `{ id?, label?, frames? }`); how many pages a spread covers is derived from its position
   * and `hasFacingPages`, so one plain spread is `{}`. Progress is silent unless you pass
   * `progressCallback`; the editor's own overlay is the fallback otherwise, which is wrong over a
   * buyer mid-interaction.
   *
   * #ai-api:template-crud
   */
  createDocument(doc: ImportDocument, options?: { unit?: string, progressCallback?: (x: string) => void }): Promise<iExternalDocumentResult>

  /**
   * Patches a document - name, page size, facing pages, buyer-editability. Takes a document name or
   * id. Only the keys present in the patch change, all as one undo step.
   *
   * `facingPages` re-lays the pages the way the page panel's toggle does: the first and last spread
   * get one page and every spread between them two, or every spread one page when it is turned off.
   * A page that goes leaves its frames on the spread beyond the page edge; `message` counts them and
   * names the pages that result.
   *
   * #ai-api:template-crud
   */
  modifyDocument(nameOrId: string, patch: iExternalModifyDocumentPatch): Promise<iExternalDocumentResult>

  /**
   * Sets the boolean flags on a document - what the document *is*, rather than how it is laid out:
   * whether its size follows a form field, whether it prints, whether the buyer may open it, whether
   * it is a snippet. Takes a document name or id; only the keys present change, all as one undo step.
   *
   * **The whole patch is checked before any of it is written.** A patch naming a flag this template
   * type does not offer changes nothing and says which flag and which type - rather than applying the
   * part it liked and leaving the document in a state the caller did not ask for. A flag already at
   * the value you asked for is reported in `message` and not written again.
   *
   * The flags mirror the document context menu and carry the same restrictions it shows, so anything
   * set here is a state the designer UI can also explain and undo. `isEditable` is on
   * `modifyDocument` too and means exactly the same thing in both - use whichever verb your other
   * changes are already in.
   *
   * #ai-api:template-crud
   */
  setDocumentFlags(nameOrId: string, flags: iExternalDocumentFlags): Promise<iExternalDocumentResult>

  /**
   * Copies a document - its spreads, frames, stories and per-document form fields - and optionally
   * gives the copy a different page size. Takes a document name or id.
   *
   * The copy is inserted directly after its original and never selected, so the buyer stays on the
   * spread they are on.
   *
   * `newName` is what to call the copy. A name addresses a document, so no two can share one - and
   * rather than refuse, this numbers up from the name it was given: omit `newName` and `"Front"`
   * becomes `"Front 2"`, pass a `"Back"` that already exists and the copy is `"Back 2"`. So the call
   * never fails over a name, and the name you asked for is not guaranteed. `message` names the copy;
   * there is no structured field for the name, since `docId` and `spreadIds` are what a caller needs
   * in order to populate it. Pass `undefined` to skip it and give a `size`.
   *
   * `size` is `{ width, height, unit? }` - two numbers plus the unit they are written in, never a
   * unit-suffixed string. `unit` defaults to the source document's own unit and interprets the
   * numbers only; it does not become the copy's unit. `%`, `%%`, `<%` and equations are refused,
   * because a page has no parent axis to measure against. Resizing is a real relayout of the copy's
   * spreads, margins, bleed and pasteboard, and it never touches the original. A document that takes
   * its size from the DocumentSize form field cannot be given one here.
   *
   * #ai-api:template-crud
   */
  duplicateDocument(nameOrId: string, newName?: string, size?: iExternalDocumentSize): Promise<iExternalDocumentResult>

  /**
   * Removes a document and its frames. Refused when it is the only one.
   *
   * #ai-api:template-crud
   */
  removeDocument(nameOrId: string): Promise<iExternalDocumentResult>

  /**
   * Appends spreads to a document and reports their ids. Takes a document name or id.
   *
   * They are laid out as the page panel's "add after the last page" does it. In a single-page
   * document every new spread is one page. In a facing-pages document the old back page gains its
   * right-hand page and becomes an inside spread, and the last new spread is the new single back
   * page - so two added to a lone cover make a folded card, 1 Â· 2-3 Â· 4. `message` names the pages
   * that result.
   *
   * #ai-api:template-crud
   */
  addSpreadToDocument(nameOrId: string, count?: number): Promise<iExternalDocumentResult>

  /**
   * Removes one spread and its frames. Takes a spread id or a `"<document> / <page>"` address.
   * Refused when it is the last spread of its document - remove the document instead.
   *
   * #ai-api:template-crud
   */
  removeSpread(spreadRef: string): Promise<iExternalDocumentResult>

  /*
    ***** READING THE LOADED TEMPLATE *****

    Where an id comes from. The targeted verbs below all address entities by id, jsName or title, so
    without these a host page can only patch frames it created itself in the same session.

    Every reader answers { ok, message, task? } and never throws; an address that does not resolve
    comes back with the addresses that would have worked. An exported task is the inverse of
    importTemplate and self-contained at every level, so a spread read here is importable as it
    stands - which is what makes read-modify-write a real option rather than a rebuild.
  */

  /**
   * What exists and what it is called: documents with their page sizes, spreads with their live ids
   * and page-number addresses, and which of each is open. No frame detail - cheap, and the first
   * call for a host page that did not build the template itself.
   *
   * #ai-api:template-crud
   */
  templateOutline(): Promise<iExternalTemplateOutline>

  /**
   * One spread as a `TemplateImportTask`: every frame with its geometry, text, image, shape and
   * effects, plus the fonts, colours and images it references.
   *
   * Takes a spread id or a `"<document> / <page>"` address from `templateOutline`; defaults to the
   * spread on screen. This is the read half of read-modify-write, and the only way to discover the
   * frame ids the verbs below need.
   *
   * #ai-api:template-crud
   */
  exportSpread(spreadRef?: string): Promise<iExternalExportResult>

  /**
   * One frame as a `TemplateImportTask`, with every property it carries. Takes a frame id, jsName or
   * title. The cheapest read before `modifyFrame`, since a patch resolves against what is there.
   *
   * #ai-api:template-crud
   */
  exportFrame(frameId: string): Promise<iExternalExportResult>

  /**
   * One whole document as a `TemplateImportTask` - every spread, every frame, every resource. Takes a
   * document name or id; defaults to the open document. Large on a multi-spread document: prefer
   * `exportSpread` unless the task really spans the document.
   *
   * #ai-api:template-crud
   */
  exportDocument(nameOrId?: string): Promise<iExternalExportResult>

  /**
   * The entire template as a `TemplateImportTask`. The complete truth and by far the biggest answer -
   * `templateOutline` for structure, `exportDocument` or `exportSpread` for content.
   *
   * #ai-api:template-crud
   */
  exportTemplate(): Promise<iExternalExportResult>

  /*
    ***** TARGETED TEMPLATE CHANGES *****

    The counterpart to importTemplate: it creates entities, these change entities that already exist.
    Both run the same property mapping, so a value behaves identically however it arrived.

    `frameId` is the `id` an export reported for the frame (`ImportFrame.id`), or its `jsName` or
    `title`. Nothing throws: an unresolvable frame comes back as `{ ok: false, message }` naming the
    frames that do exist, so a caller that guessed can correct itself.

    Each call persists one row, which is one undo entry - or folds into an open batch operation.

    `modify*` is a PATCH: a field that is absent is left untouched. `set*` REPLACES, and exists where
    the underlying model object is rebuilt rather than mutated field by field, so a partial input
    would silently reset what it omitted. There is no per-property "clear back to default" yet.
  */

  /**
   * Adds a frame to a spread that already exists, from the same `ImportFrame` an import would use -
   * so whichever of `image`/`text`/`shape`/`pathText`/`document` the spec carries decides what kind of
   * frame it is. It lands on top of the frames already on the spread. Give it a `jsName` if a script
   * will address it later. `spreadId` is the `id` an export reported for the spread.
   *
   * #ai-api:template-crud
   */
  addFrame(spreadId: string, frame: ImportFrame): Promise<iExternalModifyResult>

  /**
   * Replaces everything on one spread with the frames of a whole `TemplateImportTask` - the way to put
   * a *design* onto a spread that already exists, rather than a frame at a time.
   *
   * What `importTemplate` cannot do: that only ever creates documents, so a task aimed at the open
   * document lands as a second document beside it. Here the task's resources (fonts, colours, images,
   * AI images, stories, form fields) are registered first and then its frames replace the spread's, so
   * a design brings its own fonts and palette with it - which a run of `addFrame` calls cannot.
   *
   * The task must hold exactly one document with one spread; more comes back as `{ ok: false }` rather
   * than being silently truncated. The document's page size, bleed, layers and flags are ignored - the
   * spread keeps the size it has and the frames are fitted to it, which is the point.
   *
   * Removal and creation are one batch operation, so undo takes the whole spread back in one step.
   *
   * #ai-api:template-crud
   */
  replaceSpread(spreadId: string, task: TemplateImportTask): Promise<iExternalModifyResult>

  /**
   * Changes the properties of a form field that already exists - how it looks and behaves, its list
   * entries, its table columns and its value. The counterpart to `createFormField`, which deliberately
   * never overwrites.
   *
   * `patch` is a `Partial<ImportFormField>` and is a **patch**: a key left out keeps its current value.
   * It takes readable names - `{ label: "Your name", mandatory: true }` - not the store's short keys.
   * `items` (list entries), `tableColumns` and `value` (a JSON array of rows on a table field) are
   * collections and are replaced wholesale, so read the field first and send the whole array.
   *
   * Refused rather than applied: `name` (renaming breaks every `form.<name>`, `${â€¦}` expression and On
   * Change Script that names the field), and anything that is not an `ImportFormField` property -
   * including the short keys of the internal store this used to take, and the internals no patch may
   * set at all (order, document-vs-global). An out-of-range `type` / `ui` / `visibility` / `tableUi` is refused
   * too, because a `FormField` rebuilt from a store falls back to a default for a value it does not
   * recognise - which would silently reset the control instead of failing. The field must be global or
   * on the open document; one on another document is reported.
   *
   * #ai-api:template-crud
   */
  modifyFormField(nameOrId: string, patch: Partial<ImportFormField>): Promise<iExternalModifyResult>

  /**
   * Position, size, anchoring and rotation, the names the frame is addressed by (`jsName`, `title`),
   * its style classes, layer, lock, visibility and buyer step - plus the content the frame carries:
   * `text`, `shape`, `pathText`, `effects`, `basics` (clipping) and `image`. Geometry resolves against
   * the frame's current size when the patch does not restate it, so moving a frame needs only
   * `left`/`top`.
   *
   * A patch throughout: what the patch does not name keeps its value, the content sub-objects
   * included - `{"shape":{"fillColor":"Navy"}}` recolours the shape and keeps its path, where
   * `setFrameShape` rebuilds the shape from the spec and resets what the spec omits. `image` is the
   * exception and is a replace either way, the same operation as `setFrameImage`.
   *
   * What it cannot do is give a frame a feature it does not have: a `text` patch needs a single-line
   * text frame, a `shape` patch a frame that has a shape (name a `shape` to build one). Those are the
   * `set*` verbs' job, and are reported rather than silently skipped. A colour the template cannot
   * resolve is reported too, instead of landing as black.
   *
   * #ai-api:template-crud
   */
  modifyFrame(frameId: string, patch: Partial<ImportFrame>): Promise<iExternalModifyResult>

  /**
   * Assigns an image, whether or not the frame already carries one - so this both changes the image of
   * an image frame and turns a frame without one into an image frame. Rebuilds the image reference, so
   * an existing crop or scale is reset to a fresh fit/fill. `image.id` is a template image id, name or
   * url, or `"placeholder"`.
   *
   * #ai-api:template-crud
   */
  setFrameImage(frameId: string, image: ImportImage): Promise<iExternalModifyResult>

  /**
   * Removes the image from a frame; the frame stays where it is, carrying no image.
   *
   * #ai-api:template-crud
   */
  removeFrameImage(frameId: string): Promise<iExternalModifyResult>

  /**
   * Replaces the single-line text of a text frame - the text and the font it is set in. Fails when the
   * frame is not a text frame. To change one property and keep the rest, patch it instead:
   * `modifyFrame(id, { text: { fillColor: "Navy" } })`.
   *
   * #ai-api:template-crud
   */
  setFrameSimpleText(frameId: string, text: ImportSimpleText): Promise<iExternalModifyResult>

  /**
   * Replaces the frame's shape, rebuilt from the given spec - so a property the spec omits goes back
   * to its default, the path included. To change part of the shape a frame already has, patch it:
   * `modifyFrame(id, { shape: { fillColor: "Navy" } })`.
   *
   * #ai-api:template-crud
   */
  setFrameShape(frameId: string, shape: ImportShape): Promise<iExternalModifyResult>

  /**
   * Replaces the frame's opacity, blend mode and drop shadow. Opacity and blend mode fall back to
   * their defaults when omitted, exactly as on import - `modifyFrame(id, { effects: â€¦ })` patches
   * them instead.
   *
   * #ai-api:template-crud
   */
  setFrameEffects(frameId: string, effects: ImportEffects): Promise<iExternalModifyResult>

  /**
   * Replaces how the frame's contents are bent out of their rectangle: a perspective taper, or a
   * mesh - which is what wraps a design around a mug, a can or a bottle.
   *
   * A replace: the transform the spec does not name is switched off, so `{}` flattens the frame
   * again. `modifyFrame(id, { transform: â€¦ })` patches it instead, keeping what it does not name.
   *
   * A mesh with a `cylinder` in it is the one to reach for on anything round - it spaces the
   * columns by `sin(angle)` and curves the two rims by different amounts, which a four-corner
   * `perspective` cannot do at all.
   *
   * #ai-api:template-crud
   */
  setFrameTransform(frameId: string, transform: ImportTransform): Promise<iExternalModifyResult>

  /**
   * Deletes a frame.
   *
   * #ai-api:template-crud
   */
  removeFrame(frameId: string): Promise<iExternalModifyResult>

  /**
   * Every script the template has - name, type, signature and length, with no bodies. Host-page
   * scripts (`config.scripts`) are included and marked `readOnly`, because they hold their name and
   * win every lookup even though they are not part of the template.
   */
  listScripts(): Promise<Array<iExternalScriptInfo>>

  /** One script's full source by name. Reports the names that do exist when there is no match. */
  readScript(name: string): Promise<iExternalScriptSource>

  /**
   * Creates a script, or replaces one when `replaceExisting` is set.
   *
   * There is no `name` parameter: the name is the `function <name>` in `js`. The Scripts dialog
   * re-derives the map key from the body, so a script saved under a name that disagrees with its own
   * function name is silently renamed the moment a designer edits it - which breaks every
   * `triggerScript`, click action and `${script.x()}` pointing at it.
   *
   * The body is validated the way Printess runs it (as an expression, not as a function body), so a
   * body that saves here is a body that runs. `type` is one of `"script"`, `"dialog"`, `"panel"`,
   * `"button-definition"`, `"event"`; for `"event"` the function name must be a template event name.
   */
  saveScript(js: string, type: string, replaceExisting?: boolean): Promise<iExternalScriptResult>

  /**
   * Deletes a script. Refuses while a form field, a frame click action or another script still names
   * it, since those references fail silently rather than reporting anything - pass `force` to delete
   * anyway and get the broken referrers listed back.
   */
  removeScript(name: string, force?: boolean): Promise<iExternalScriptResult>

  /**
   * Both stylesheets of the open template, as the blocks they are written as: `templateStyles` (the
   * global sheet, which works across documents) and `documentStyles` (the open document's own, `null`
   * on design and group templates). Each carries the raw `text` - the only lossless form - plus a
   * `blocks` projection with each block's selector, class names, `if` condition and properties as
   * source text.
   *
   * Read this before writing a style. A style **overrides** the frame's own setting for the same
   * property, which is the opposite of CSS; several blocks may share one class name; and the write
   * verbs refuse the cases where "the" block is ambiguous.
   */
  readStyles(): Promise<Record<string, unknown>>

  /**
   * Replaces a style class's whole block, creating the class when it does not exist yet.
   *
   * A `set*`, so a property left out is a property **removed** - "make `.headline` exactly this".
   * Refused when the class is written as more than one block, or shares a selector with another class,
   * because replacing "the" block has no single meaning there.
   *
   * A frame opts into a style by carrying the class name - set that with
   * `modifyFrame(id, { styleClassNames: [...] })`.
   *
   * A value is written exactly as it appears in the stylesheet, so it may be a literal (`"24pt"`,
   * `"[Black]"`, `"#aa22aa"`) or a template-literal expression (`"${form.color}"`). Literals are
   * validated the way the renderer parses them - including colours, which the stylesheet parser itself
   * would silently turn into black. `frame.â€¦` in a value is refused for `scope: "template"`, where it
   * throws at render time and discards the whole block.
   */
  setStyle(className: string, properties: Record<string, unknown>, scope?: "document" | "template"): Promise<iExternalStyleResult>

  /**
   * Appends another block for a class name, leaving existing ones alone - the way to build the
   * several-blocks-one-class pattern where each block carries its own `if` and Printess uses the one
   * that is active. `setStyle` cannot express it, because it replaces.
   *
   * The new block is last, so where it and an earlier block set the same property, this one wins.
   */
  addStyle(className: string, properties: Record<string, unknown>, scope?: "document" | "template"): Promise<iExternalStyleResult>

  /**
   * Patches the properties of a class written as a single block: a property given is set, a property
   * passed as `null` is **removed**, and everything else - the block's other properties, its `if` and
   * its comments - is left as it was.
   *
   * `null` deletes because a style property has no default: absence means "fall through to the frame".
   * Refused when the class does not exist, or is written as more than one block.
   */
  modifyStyle(className: string, patch: Record<string, unknown>, scope?: "document" | "template"): Promise<iExternalStyleResult>

  /**
   * Removes every block carrying a class name. Frames keep the class name - a class no style defines
   * simply falls through to the frame's own settings - and the number of frames still carrying it is
   * reported so the caller can decide what to do about them.
   */
  removeStyle(className: string, scope?: "document" | "template"): Promise<iExternalStyleResult>

  /**
   * Returns the JSON required to generate an AI Letter
   */
  getLetterGeneratorJson(): Promise<string | undefined>;

  /**
   * Get the menu title displayed when opening the AI Text Generator dropdown in the Buyer Side
   */
  getLetterGeneratorMenuTitle(): string;

  /**
   * Provides access to the sample price data of the template.
   * Only relevant for displaying test prices when `priceTestModeEnabled` is set.
   * #ai-api:basket-pricing
   */
  getSamplePriceData(): { priceTestModeEnabled: boolean, legalNotice: string, oldPrice: number, snippetPrices: Array<number>, priceCategories: { [key: string]: number }, basePrice: number, infoUrl: string, perPagePrice: number }

  /**
   * Renders proof Pdf(s) in the shop scenario.
   * You must allow this in the account portal first.
   * Normally shop access forbids any kind of production.
   * #ai-api:basket-pricing
   */
  renderProofPdfs(): Promise<JobStatus>


  WcBc: {
    masterStyles: () => string
    getStrokeUi: () => HTMLElement // TemplateResult
  }

  /**
   * Gets the currently configured maximum basket image width.
   * #ai-api:basket-pricing
   */
  getMaxmimumBasketWidth(): number;

  /**
   * Gets the currently configured maximum basket image height.
   * #ai-api:basket-pricing
   */
  getMaxmimumBasketHeight(): number;

  /**
   * Helper function for Panel-Ui
   * Shows a dialog with headline and ok / cancel buttons.
   * Returns a container to render your own content in.
   * @param options Text and callback informations
   * #ai-api:custom-ui
   */
  openDialog(options: IGenericDialogOptions): Promise<HTMLDivElement>

  /**
   * Closes the dialog
   * #ai-api:custom-ui
   */
  closeDialog(): void

  /**
   * Closes the currently open mobile overlay, in most cases the Form-Field overlay.
   * Does nothing on desktop or when no mobile overlay is open.
   * #ai-api:custom-ui
   */
  closeMobileOverlay(): void

  /**
   * Disables all buttons of the dialog opened with openDialog()
   * #ai-api:custom-ui
   */
  disableDialogButtons(): void

  /**
   * Enables all buttons of the dialog opened with openDialog()
   * #ai-api:custom-ui
   */
  enableDialogButtons(): void

  /**
   * Shows simple progress overlay. The fallback for a script that has to report progress with no
   * dialog or panel open - a surface locks itself instead.
   * #ai-api:custom-ui
   */
  showProgress(message: string): void

  /**
   * hides progress overlay
   * #ai-api:custom-ui
   */
  hideProgress(): void

  /**
   * Displays a dropdown Menu at the target position with the set menu items
   * @param e MouseEvent to get the target and mouse position
   * @param items Menu items that should be displayed
   */
  showContextMenu(e: MouseEvent, items: Array<iExternalContextMenuItem>): void

  /**
   * Creates a reader for a Google Spreadsheet. Nothing is loaded yet - call `loadData()` on the
   * returned object first, then read the rows with `getData()`.
   *
   * The spreadsheet must be shared so that anyone with the link can view it, and `apiKey` must be a
   * Google Cloud API key which has the Google Sheets API enabled. The key is sent to Google from the
   * browser, so only use a key which is restricted to reading sheets.
   *
   * @param apiKey Google Cloud API key with access to the Google Sheets API.
   * @param sheetId Id of the spreadsheet: the long id part of its url
   *                (`https://docs.google.com/spreadsheets/d/<sheetId>/edit`).
   * #ai-api:data-access
   */
  createGoogleSheet(apiKey: string, sheetId: string): iExternalGoogleSheet

  /**
   * Selects Tab in Panel-Ui
   */
  selectTab(tab: "#NONE" | "#LAYOUTS" | "#PHOTOS" | "#THEME" | "#PAGES" | "#ADD-TEXT" | "#ADD-IMAGE" |
    "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2" | string): Promise<void>

  /**
   * Tells if current template has an animation-timeline
   * #ai-api:viewport-zoom
   */
  hasAnimation(): boolean

  /**
   * Tells if animation-timeline is playing
   * #ai-api:viewport-zoom
   */
  isAnimationPlaying(): boolean

  /**
   * Plays animation
   * #ai-api:viewport-zoom
   */
  playAnimation(): Promise<void>

  /**
   * Stops animation
   * #ai-api:viewport-zoom
   */
  stopAnimation(): Promise<void>

  /**
   * Returns the specified animation as a single html-string including all resources base64 encoded
   * You just need to store the string in a .html file to use it.
   * @param docIdOrName The document to render identified by id or name
   * @param spreadIndex The zero based spread index you want to render, defaults to 0 (first spread)
   * @param pxWidth The output width in pixel, defaults to the setup html-width of the animation. Max is 2000px, min is 100px
   * @returns { pxWidth: number, pxHeight: number, data: string } "data" contains the HTML.
   * #ai-api:basket-pricing,viewport-zoom
   */
  getAnimationHtmlAsString(docIdOrName?: string, spreadIndex?: number, pxWidth?: number): Promise<{ pxWidth: number, pxHeight: number, data: string } | null>

  /**
   * Reassign/change callbacks originally set in `attachPrintess()`.
   * #ai-api:core
   */
  setCallbacks(p: printessCallbacks): void;

  /**
   * Reassign/change price category labels.
   * #ai-api:basket-pricing
   */
  setPriceCategoryLabels(priceCategoryLabels: Record<string, string> | null): void;

  /**
   * Creates a content hash of the current design state.
   * Can be used to track changes.
   * When supplying `formFieldsToIgnore` it will filter out those form fields. Those are excluded from the hash generation.
   * Please note that this hash can change when used on different Printess Editor versions.
   * @param options Supports setting form field names to ignore during hash creation.
   * #ai-api:core
   */
  generateContentHash(options?: { formFieldsToIgnore?: string[], ignoreAllFormFields?: boolean }): string;
}


/**
 * The answer of every reader (`exportSpread`, `exportFrame`, â€¦): the same never-throws contract as a
 * change, with the exported task attached when it succeeded.
 *
 * A `TemplateImportTask` at any level is self-contained and importable as it stands - resources are
 * collected while walking the requested subtree - so a spread read out here can be handed straight
 * back to `replaceSpread`.
 */
export interface iExternalExportResult {
  ok: boolean;
  /** One sentence, suitable both for showing a user and for handing back to an automated caller. */
  message: string;
  /** Present when `ok`. Absent when the address did not resolve - `message` names what would have. */
  task?: TemplateImportTask;
}

/** What `modifyDocument` takes. Only the keys given change. */
/**
 * The document flags `setDocumentFlags` accepts, as a patch - a key left out is not touched.
 *
 * Each one is a switch the designer also has in the document context menu, under the caption named
 * with it. Which of them a template offers depends on its template type; a flag the type does not
 * offer is refused by name rather than silently ignored.
 */
export interface iExternalDocumentFlags {
  /**
   * **"Get Size from Form Field".** The page size follows the `DOCUMENT_SIZE` form field, so the
   * buyer's choice resizes the document. Turning it on creates that form field; turning it off
   * clears the applied size.
   *
   * A document carrying this flag has no fixed page size, so its frames need geometry that survives a
   * resize - relative units, edge anchors or dock-to-bleed - or they hold still while the page moves.
   * `templateOutline` reports the flag as `sizeFromFormField`.
   *
   * Not available on a cover, whose size comes from its spine and border geometry.
   */
  sizeFromFormField?: boolean;
  /** **"Editable"** - the buyer can open and edit this document. */
  isEditable?: boolean;
  /** **"Production"** - the document is part of the print output. */
  isProduction?: boolean;
  /** **"Job Sheet"** - a production sheet. Turning it on turns `isProduction` on with it. */
  isJobSheet?: boolean;
  /** **"Template Thumbnail"** - the document the template's thumbnail is rendered from. */
  isThumbnail?: boolean;
  /** **"Basket Thumbnail"** - the document the basket thumbnail is rendered from. */
  isBasketThumbnail?: boolean;
  /** **"Is Merge Target"** - other documents merge into this one. */
  isMergeTarget?: boolean;
  /** **"Do Not Merge"** - keep this document out of a merge. */
  doNotMerge?: boolean;
  /** **"Layout-Snippet"**. Mutually exclusive with `isGroupSnippet`, which is turned off with it. */
  isLayoutSnippet?: boolean;
  /** **"Sticker / Filter-Snippet"**. Mutually exclusive with `isLayoutSnippet`, which is turned off with it. */
  isGroupSnippet?: boolean;
  /** **"Slim Ui Preview"** - the preview document the slim buyer UI shows. */
  isSlimUiPreview?: boolean;
}

export interface iExternalModifyDocumentPatch {
  name?: string;
  isEditable?: boolean;
  /**
   * Page size as **numbers in this document's own unit** - the plain-number form of
   * `ImportDocument.pageWidth`, and only that form: this patch goes to the resize, not to the
   * importer, so `{value, unit}` is not accepted here. Read the unit from
   * `templateOutline().documents[].unit` rather than assuming. Pass both or neither.
   *
   * A resize rebuilds the document's spreads and rescales its margins, bleed and pasteboard with them,
   * so it is a real relayout and not a property change.
   */
  pageWidth?: number;
  pageHeight?: number;
  facingPages?: boolean;
}

/**
 * A page size for `duplicateDocument`: two numbers plus the unit they are written in.
 *
 * `unit` interprets the numbers only - it does not change the document's own unit, exactly as
 * `ImportLength`'s `{value, unit}` does not. Absent means the source document's unit, which
 * `templateOutline().documents[].unit` reports. Only absolute units: a page has no parent axis, so
 * `%`, `%%`, `<%` and equations are refused.
 */
export interface iExternalDocumentSize {
  width: number;
  height: number;
  unit?: "px" | "cm" | "mm" | "inch" | "pt";
}

/**
 * The answer of the document and spread verbs: the change contract plus the generated ids, which a
 * caller has no other way of learning and needs in order to populate what it just created.
 */
export interface iExternalDocumentResult {
  ok: boolean;
  message: string;
  /** The document created or changed. */
  docId?: string;
  /** The spreads created - `addFrame` takes one of these. */
  spreadIds?: Array<string>;
}

/** One spread in `templateOutline`. */
export interface iExternalSpreadOutline {
  /** The live id. This is what `addFrame` and `replaceSpread` take. */
  id: string;
  /** `"<document> / <page>"`, e.g. `"Letterhead / 2-3"` - the readable handle the readers accept. */
  address: string;
  /** The page number the designer sees: `"1"`, or `"2-3"` for a double spread. */
  pages: string;
  /** Most spreads have none, and a label is not unique across documents - address by id or address. */
  label?: string;
  open?: boolean;
  /** Spread size in document pixels: the space the frame apis and `onAutoSizeChange` use. */
  widthPx: number;
  heightPx: number;
  /** A count. Call `exportSpread` to see the frames themselves. */
  frames: number;
}

/** One document in `templateOutline`. */
export interface iExternalDocumentOutline {
  id: string;
  name: string;
  open?: boolean;
  /** In this document's own `unit`, not pixels. */
  pageWidth: number;
  pageHeight: number;
  unit: string;
  facingPages?: boolean;
  isBookInsidePages?: boolean;
  /**
   * **"Get Size from Form Field" is on**: the page size follows the `DOCUMENT_SIZE` form field, so it
   * is not fixed. Absent when off. Set it with `setDocumentFlags`.
   *
   * Worth reading before laying anything out here - on a document that carries this flag, a frame
   * written in absolute units holds still while the page size moves under it.
   */
  sizeFromFormField?: boolean;
  /** A cover document - its size is computed from the book's inside pages, spine and borders. */
  isCover?: boolean;
  /**
   * **Present only on a document that is a snippet** - one entry of a layout or sticker library.
   *
   * Here rather than behind a per-document `exportDocument` because it is what lets a run find its
   * place in a library it did not build: a library of 25 layouts is 25 documents, and "which of
   * them exist already, and what is each one for" has to be answerable in one cheap call. The
   * keywords are what carry that for a photobook theme, where `single-page-design` and
   * `double-page-design` say what a layout covers.
   */
  snippet?: {
    type: "layout" | "group";
    tags?: Array<string>;
    keywords?: Array<string>;
  };
  condition?: string;
  spreads: Array<iExternalSpreadOutline>;
}

/**
 * The template's structure with no frame detail - the cheapest way to find out what exists and what
 * everything is called, and the first thing to call when a host page did not build the template
 * itself. Always answers: there is always a loaded document.
 */
export interface iExternalTemplateOutline {
  documents: Array<iExternalDocumentOutline>;
  currentDocument: string;
  currentSpreadId?: string;
  /**
   * What this template IS, rather than what is in it: `"standalone"` for a product that prints,
   * `"layoutLibrary"` for a library whose documents are offered to other templates as layouts,
   * `"stickerLibrary"` for stickers, and the design / base / merge types beside them.
   *
   * It decides whether a document's snippet settings ever reach anybody: in any other type a
   * document can carry every tag and keyword there is and will never be published as a snippet.
   */
  templateType: "standalone" | "manualMerge" | "design" | "designPlus" | "base" | "resourceLibrary"
  | "stickerLibrary" | "layoutLibrary";
}

/**
 * The answer of every targeted template change (`modifyFrame`, `setFrameImage`, â€¦). Never a throw:
 * a change that could not be applied comes back with `ok: false` and a `message` that says why, so an
 * automated caller can read the failure and correct itself.
 */
export interface iExternalModifyResult {
  ok: boolean;
  /** One sentence, suitable both for showing a user and for handing back to an automated caller. */
  message: string;
  /** The id of the frame the change was aimed at, echoed so a caller can chain onto it. */
  frameId?: string;
}

export interface iExternalScriptResult {
  ok: boolean;
  /** One sentence, suitable both for showing a user and for handing back to an automated caller. */
  message: string;
  /** The name of the script the call was aimed at, echoed so a caller can chain onto it. */
  scriptName?: string;
}

export interface iExternalStyleResult {
  ok: boolean;
  /** One sentence, suitable both for showing a user and for handing back to an automated caller. */
  message: string;
  /** The style class the call was aimed at, echoed so a caller can chain onto it. */
  className?: string;
}

/** One row of the script inventory: enough to choose what to read, carrying no body. */
export interface iExternalScriptInfo {
  name: string;
  type: string;
  /** Everything before the opening brace - the parameter list a caller has to match. */
  signature: string;
  lines: number;
  /** Parameter names off the signature. Developer test values only; no trigger reads them. */
  params?: Array<string>;
  /** Comes from the host page's `config.scripts`, so it cannot be changed through this api. */
  readOnly?: true;
  /**
   * A host script of the same name exists and wins every lookup, so this template script never runs -
   * and is dropped the next time the template is serialized.
   */
  shadowedByHostScript?: true;
}

export interface iExternalScriptSource extends iExternalScriptResult {
  type?: string;
  js?: string;
  params?: Array<{ key: string, value: string }>;
  readOnly?: true;
}

export interface IGenericDialogOptions {
  /** Fired when user press then ok button. Return "keep-open" to not close the dialog */
  callback: () => Promise<void | "keep-open"> | void | "keep-open"
  /** Fired when user press then cancel button. Return "keep-open" to not close the dialog */
  cancelCallback?: () => Promise<void | "keep-open"> | void | "keep-open"
  headline: string,
  okLabel?: string,
  cancelLabel?: string,
  message?: string,
  info?: string,
  relativePosition?: boolean,
  minHeight?: string
}

export type JobStatus = {
  jobId: string;
  isFinalStatus: boolean;
  isSuccess: boolean;
  enqueuedOn: string;
  processingOn: string | null;
  finishedOn: string | null;
  failedOn: string | null;
  errorDetails: string | null;
  result: {
    s: { t: number, p: number, c: number, d: number },
    r: Record<string, string>,
    p: { d: string, u: string, i: number }[]
  }
}

export interface iBuyerStep {
  index: number,
  boxId?: string,
  docId: string,
  title: string
}



/*
* UPLOAD
*/
export interface UploadProvider {
  /** The main method to upload data. */
  upload: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>;

  /** Specialized method for uploading images. You can simply forward it to upload in case you don't need special handling of those. */
  uploadImage: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>;

  /** Specialized method for uploading fonts. You can simply forward it to upload in case you don't need special handling of those. */
  uploadFont: (formData: FormData, progressCallback?: ProgressCallback) => Promise<UploadResult>;

  /** This method is called before Printess adds the form data containing the data needed for the upload. Use it in case you must prepend some fields to the form data before. */
  beforeAddingFormData?: (formData: FormData, blob: Blob, fileName: string) => void;

}

export interface AwsUploadProvider extends UploadProvider {
  /** The method which generates the final key to store within S3. */
  keyGenerator: (fileName: string, fileHash: string) => string;
}


export type ProgressCallback = (uploaded: number, total: number) => void;
export type UploadResult = {
  originalFormName?: string,
  id: string,
  url: string,
  userState?: string | number | Record<string, unknown>
}

export type iExternalFFUiType = "color" | "font" | "label" | "number" | "table" | "textbox" | "text-area" | "select-list" | "select-list+info" | "tab-list" | "image-list" | "image-list+caption" | "color-list" | "image-id" | "checkbox";

export declare type iExternalFormFieldInfos = Array<iExternalFormFieldInfo>;
export interface iExternalFormFieldInfo {
  name: string;
  values: Array<string>;
}

export interface iExternalPhotobookOptions {
  distributionMethod: "cc" | "fs" | "simple"
  spreadCount: number
  imageCount: number
  firstSpreadImageCount: number
  lastSpreadImageCount: number
  minImagesPerSpread: number
  maxImagesPerSpread: number
  maxCollectedPerSpread: number
  filterImages: boolean,
  initialCreation: boolean
  coverImageCount: number
  useExclusiveCoverImages: boolean
}
export type iExternalPhotobookStep = "mode" | "start" | "upload" | "adjust" | "analyze" | "customize" | "distribute" | "error" | "done";

export type iExternalImageAnalysisStep = "analyze" | "error" | "done";
export interface iExternalImageAnalysisOptions {
  dummyAttribute?: boolean
}

export interface iPhotobookEstimation {
  spreads: number,
  clusterCounts: Array<number[]>,
  imagesPerSpread: Array<number>
}
export interface iExternalSpreadInfo {
  /**
   * ID of the spreads document
   */
  docId: string;
  /**
   * ID of the spread
   */
  spreadId: string;
  /**
   * Zero based spread index (not page nr)
   */
  index: number;
  /**
  * Name of spread if set by the designer
  */
  name: string;
  /**
  * For multiple pages on a spread: name per page or empty string
  * Array always has `pages`amount of entries.
  * User can enter spread-name array members devided by pipe symbol:
  * `name="left|right"` will be exposed as `names=["left", "right"]`
  */
  names: Array<string>
  /**
  * Spread width in pixel
  */
  width: number;
  /**
  * Spread height in pixel
  */
  height: number;
  /*
  * Number of pages in this spread. Will be 1 or 2.
  */
  pages: number;
  /**
   * Array of page thumbnails. Url might be empty if not available
   */
  thumbnails: Array<{ url: string, bgColor: string, pageId: string }>

}


export interface iExternalDocAndSpreadInfo {
  /**
   * The ID of the document
   */
  docId: string,
  /**
   * The Title of the document
   */
  docTitle: string,
  /**
   * Information about all spreads of this document
   */
  spreads: Array<iExternalSpreadInfo>,
  /**
   * The amount of spreads (not pages!) in this document
   */
  spreadCount: number,
  /**
   * The amount of pages in this document
   */
  pageCount: number,
  /**
   * Information if the document has facing pages. If `true` first and last spread has 1 page all other spreads have 2 pages.
   */
  facingPages: boolean,
  /**
   * Information if the document is set to "book" mode and can therefore add/remove pages etc.
   */
  isBook: boolean,
  /**
   * Especially for layflat books where the first and last pages are not visible
   */
  lockCoverInside: boolean,
  /**
   * If a shadow between facing pages should be shown
   */
  showBookShadow: boolean
  /**
   * Indicates if the user is allowed to add spreads
   */
  userCanAddSpreads: boolean,
  /**
   * minimum number of spreads
   */
  minSpreads: number,
  /**
   * maximum number of spreads
   */
  maxSpreads: number
  /**
  * minimum number of pages
  */
  minPages: number,
  /**
   * maximum number of pages
   */
  maxPages: number
}

export interface iExternalTab {
  id: string,
  caption: string,
  head?: string,
  icon: iconName
}
export interface iExternalSnippetCluster {
  tabId: string,
  name: string,
  columns: number,
  stickerMenuId: string,
  stickerMenuTags: string[] | ReadonlyArray<string>,
  snippets: Array<iExternalSnippet>;
}
export interface iExternalSnippet {
  title: string;
  snippetUrl: string;
  thumbUrl: string;
  facingPagesUrl?: string; /* only for background-layouts */
  bgColor: string;
  priceLabel: string;
  imageCount: number;
  sortNumber: number;
  keywords?: string[];
  colorSchemes?: Array<{ name: string, default: boolean }>;
  colorSchemeThumbUrls?: Record<string, string>
}

export type ForceSnippetPlacement = "repeat-all" | "repeat-all-current" | "repeat-inside" | "repeat-inside-current";

export interface iExternalCollageSlot {
  aspect: number,
  sw: number, // size factor width
  sh: number, // size factor height
  st: number, // size factor top
  sl: number, // size factor left
  ang: number, // rotation-angle
  split: boolean
}
export interface iExternalCollageLayout {
  snippetId: string;
  snippetUrl: string;
  snippetThumb: string;
  snippetDocId: string;
  snippetTitle: string;
  snippetKeywords: string[];
  page: "left" | "right" | "entire";
  slots: iExternalCollageSlot[],
  match: number,
  preferred: number,
  simple: number,
  splitVariantId: string
}

export type iExternalBookSettings = {
  /**
   * optional: could be any Length value, like an equation or a fixed value with unit, e.g. `=spine.pages * 0.3mm` or `2cm`, or a number in pixel.
   * A negative or unreadable value is ignored with a console warning (so are the other lengths below). The call leaves nothing on the undo stack and keeps the redo stack.
   */
  spine?: number | string,
  /** optional: `hinge` could be a Length value, like `1cm` or `2inch` or a number in pixel */
  hinge?: number | string,
  /** optional: `edge-left-right` could be a Length value, like `1cm` or `2inch` or a number in pixel */
  edgeX?: number | string,
  /** optional: `edge-top-bottom` could be a Length value, like `1cm` or `2inch` or a number in pixel */
  edgeY?: number | string,

  /** optional: `bleed-left-right` could be a Length value, like `1cm` or `2inch` or a number in pixel */
  bleedX?: number | string,
  /** optional: `bleed-top-bottom` could be a Length value, like `1cm` or `2inch` or a number in pixel */
  bleedY?: number | string,

  /** optional: `Minimum Book Pages` set min pages value and auto adds additional pages */
  minPages?: number,
  /** optional: `Maximum Book Pages` set max pages and outo removes overidge pages */
  maxPages?: number,

  /** optional: `Initial Freestyle Photobook Pages` set initial amount of pages the freestyle photobook is created with */
  initialFreestylePhotobookPages?: number,

  /** optinal: enable / disable layflat mode */
  layflat?: boolean,

  /** optional: if true, first page and last page become invisible */
  lockCoverInside?: boolean

  /** optional: determines the min-spreads to add and also if the spread-count needs to be divisible by 2 to be printed  */
  addSpreads?: 1 | 2

  /** optional: set the book inside pages document imposition by name */
  bookImposition?: string,

  /** optional: set all cover documents imposition by name */
  coverImposition?: string

  previewCoverType?: "hard" | "soft";

  /** optional: enable the debossed (premade) cover - the cover gets a fixed number of images and no theme cover layout is applied */
  useDebossedCover?: boolean,
  /** optional: number of images (0-4) placed on the debossed cover */
  debossedCoverImageCount?: number,

}

export type iExternalMarginSettings = {
  /** optional: show or hide margin guide lines */
  show?: boolean,
  /** optional: left (or inside) margin â€” Length string like `"1cm"` or `"5mm"` */
  inside?: string,
  /** optional: right (or outside) margin â€” Length string like `"1cm"` or `"5mm"` */
  outside?: string,
  /** optional: top margin â€” Length string like `"1cm"` or `"5mm"` */
  top?: string,
  /** optional: bottom margin â€” Length string like `"1cm"` or `"5mm"` */
  bottom?: string,
  /** optional: number of text columns (0â€“4) */
  columns?: number,
  /** optional: gap between columns â€” Length string like `"5mm"` or `"1cm"` */
  columnGap?: string,
  /** optional: horizontal guide positions (y-axis lines) as length strings like `"1cm"` or `"5mm"` */
  horizontalGuides?: string[],
  /** optional: vertical guide positions (x-axis lines) as length strings like `"1cm"` or `"5mm"` */
  verticalGuides?: string[],
}

export interface iSnippetMenu {
  categories: Array<iSnippetMenuCategory>
  name: string
}

export interface iSnippetMenuCategory {
  topics: Array<iSnippetMenuTopic>
  name: string
}

export interface iSnippetMenuTopic {
  keywords: Array<string>;
  name: string;
  id: string;
}

export interface iExternalFrameBounds {
  zoom: number;
  pageOffsetY: number;
  pageOffsetX: number;
  left: number;
  top: number;
  width: number;
  height: number;
  boxId: string;
}

export type iExternalPropertyKind = "edit-text-button" | "edit-group-button" | "color" | "single-line-text" | "text-area" | "label" | "checkbox" | "background-button" | "splitter-layouts-button" | "grid-gap-button" | "convert-to-image" | "convert-to-text" | "record-left-button" | "record-right-button" | "horizontal-scissor" | "vertical-scissor" | "multi-line-text"
  | "selection-text-style" | "selection-letter-ai" | "selection-text-ai" | "selection-text-handwriting" | "number" | "pixelLength" | "percentLength" | "image" | "font" | "select-list" | "select-list+info" | "tab-list" | "image-list" | "image-list+caption" | "color-list" | "table" | "image-id" | "patternTileWidth" | "text-frame-style" | "custom-text-combo" | "panel-script";

export type iExternalMetaPropertyKind = null |
  "text-style-color" | "text-style-size" | "text-style-line-height" | "text-style-tracking" | "text-style-baseline-script" | "text-style-font" | "text-style-hAlign" | "text-style-vAlign" | "text-style-vAlign-hAlign" | "text-style-paragraph-style" | "handwriting-image" |
  "image-scale" | "image-placement" | "image-sepia" | "image-brightness" | "image-contrast" | "image-vivid" | "image-invert" | "image-hueRotate" | "image-rotation" | "image-crop" | "image-filter"
  | "letter-generator" | "remove-background" | "image-tools" | "crop+rotate" | "similar-images";

export type FFInfoStyle = string;
export type FFInfoDisplayStyle = "text" | "bullets" | "numbers" | "html" | "panel" | "card" | "button";

export interface iExternalProperty {
  id: string;
  value: string | number;
  kind: iExternalPropertyKind;
  label: string;
  info: string;
  ffName?: string;
  infoStyle: FFInfoStyle;
  controlGroup: number;
  controlGroupGap?: number;
  amountOfListedColors?: number;
  classNames?: string;
  isMobileHead?: boolean;
  controlGroupSize?: number;
  validation?: iExternalValidation;
  textStyle?: iExternalTextStyle;
  imageMeta?: iExternalImageMeta;
  listMeta?: iExternalListMeta;
  tableMeta?: iExternalTableMeta;
  tabId?: string;
  validationResult?: {
    remainingChars: string,
    error: string,
    remainingCharsNumber: number
  }
  bgColorIndex?: number;

  /** availaible for slim-ui only */
  formFieldMeta?: iExternalFormFieldMeta;
  /** availaible for slim-ui only */
  boxMetas?: Array<iExternalBoxMeta>;
  /** availaible for slim-ui only */
  origin?: "template" | "layout";
  /** availaible for slim-ui only */
  position?: number;
  /** availaible for slim-ui only */
  title?: string;
  /** Allowed font groups for a font property / font-list form field (slim-ui only) */
  fontGroups?: string[];
  /** Allowed color groups for a color property / color-list form field (slim-ui only) */
  colorGroups?: string[];

  /** Used only by Slim UI to store values */
  onHiddenLayer?: boolean
  linkedPropertyId?: string

  /** Name of the panel-script function, only set when kind === "panel-script" */
  panelScriptName?: string;

}

export interface iExternalBoxMeta {
  docId: string
  spreadId: string,
  spreadIndex: number

  boxId: string,
  feature: string, // Feature
  paragraphs?: Array<number>,
  property: string // anyProperty | "FormField"
  parentBoxId: string | null,
  paragraphIndex: number,
  layerName: string | null
}

export type ExtFF_WriteSecondWhat = "value" | "label" | "info" | "tag" | "meta1" | "meta2" | "meta3" | "meta4"
export type ExtFFType = "string" | "table" | "number" | "label" | "font" | "color" | "panel-script";


export interface iExternalFormFieldMeta {
  dataType: ExtFFType;
  id: string,
  origin: "scope" | "doc",
  numberType: string | null;
  textBefore: string,
  textAfter: string,
  priceRelevant: boolean,
  priceDisplay: number, // priceDisplay
  pricePrefix: string,   // pricePrefix
  pricePostfix: string, //  pricePostfix
  hasPerLetterPricing: boolean, //  hasPerLetterPricing;
  imageDetails: {  // image details
    width: number,
    height: number,
    groups: Array<string>,
    showCrop?: boolean,
    checkDpi?: boolean,
    dpi?: number,
    dpiWidth?: string,
    dpiHeight?: string
  },
  // list?: iFFMetaListEntry[];

  visibility: "admin" | "buyer" | "condition";
  condition: string;

  listConditionDescriptionFF: string;
  listConditionMeta1FF: string;
  listConditionMeta2FF: string;
  listConditionMeta3FF: string;
  listConditionTableColumn: string;

  writeSecondFF: string;  // writes current (writeSecondFFWhat) value to other FF
  writeSecondFFWhat: ExtFF_WriteSecondWhat

  writeSecondFF2: string;  // writes current (writeSecondFFWhat) value to other FF
  writeSecondFFWhat2: ExtFF_WriteSecondWhat

  writeSecondFF3: string;  // writes current (writeSecondFFWhat) value to other FF
  writeSecondFFWhat3: ExtFF_WriteSecondWhat

  writeSecondFF4: string;  // writes current (writeSecondFFWhat) value to other FF
  writeSecondFFWhat4: ExtFF_WriteSecondWhat

}

/*
export type iFFMetaListEntry = {
  key: string,
  label?: string, // multi-language??
  description?: string,
  imageId?: string,
  tag?: string,
  meta1?: string,
  meta2?: string,
  meta3?: string,
  meta4?: string,
  disabled?: boolean
}*/

export interface iExternalTextStyle {
  size: string;
  lineHeight: number;
  color: string;
  font: string;
  tracking: number
  hAlign: "bullet" | "left" | "center" | "right" | "justifyLeft" | "justifyCenter" | "justifyRight" | "justifyJustify";
  vAlign: "top" | "center" | "bottom";
  allows: Array<"insertFormFields" | "forceValidation" | "expressions" | "removeIfDefault" | "strokeWidth" | "clearOnFocus" | "offensive" | "content" | "mandatory" | "color" | "stroke" | "font" | "size" | "superscript" | "lineHeight" | "tracking" | "baselineShift" | "horizontalAlignment" | "verticalAlignment" | "padding" | "styles" | "bullet" | "indent" | "paragraphSpacing" | "baselineGrid" | "handWriting" | "letterGenerator">;
  baselineScript: "none" | "super" | "sub",
  pStyle: string;
  spaceAfterPx: number;
  spaceBeforePx: number;
}
export interface iExternalValidation {
  maxChars: number;
  regExp: string;
  regExpMessage: string;
  defaultValue: string; // for mandatory check
  textTransform: "mixed" | "upper" | "lower"
  isMandatory: boolean;
  clearOnFocus: boolean;
  /** Optional placeholder text shown while the field value is empty (textbox and text-area form fields only). */
  placeholder?: string;
  noOffensiveLanguage: boolean;
  visibility: "always" | "conditional-on" | "conditional-off";
  htmlInputType: "text" | "password" | "email" | "number" | "tel" | "url" | "search" | "date" | "datetime-local" | "month" | "week" | "time";
  maxNumber: number;
}
export interface iExternalListMeta {
  list?: Array<iExternalFieldListEntry>;
  thumbWidth: number;
  thumbHeight: number;
  imageCss: string;
  descriptionFilter?: string;
  colorsWithoutLabel?: boolean;
}
export type iExternalFieldListEntry = {
  key: string,
  label: string, // multi-language??
  description: string,
  imageUrl: string,
  tag: string,
  enabled: boolean,
  icon?: iconName,
  meta1?: string,
  meta2?: string,
  meta3?: string,
  meta4?: string,
  match: boolean,

  /** Info on for Slim UI Only */
  hiddenLayers?: string[]
}
export interface iExternalTableMeta {
  columns: Array<iExternalTableColumn>;
  month?: number;
  year?: number;
  tableType: "generic" | "calendar-events";
  minTableEntries: number;
  maxTableEntries: number;
  tableAddOptions: Array<iExternalTableAddOption>
}

export type iExternalTableAddOption = {
  label: string,
  type: string,
  libFF: string,
  multi: boolean,
  bg: string
}

export interface iExternalTableColumn {
  name: string,
  label?: string,
  readonly?: boolean,
  data?: "string" | "boolean" | "number" | "image" | "color" | "multi",
  list?: Array<string | number>,
  listMode?: "select" | "auto-complete" | "multi-from-form-field",
  width?: string,
  row?: string,
  hide?: boolean,
  /** Maximum allowed characters */
  max?: number,
  inline?: boolean,
  type?: string, /* compare to type */
  mandatory?: boolean
  /* ADD NEW TABLE-FF COLUMN - add here and search for this comment - do not remove comment */
}
export interface iExternalNumberUi {
  max: number;
  min: number;
  step: number;
  digits: number;
  postfix: string;
  restrictRange?: boolean;
  restrictStep?: boolean;
}
export interface iExternalNumberMeta {
  max: number;
  min: number;
  step: number;
  digits: number;
  postfix: string;
  restrictRange?: boolean;
  restrictStep?: boolean;
  uiOffset?: number;
  uiMultiplier?: number;
}
export interface iExternalImageMeta {
  scale: number;
  scaleHints: iExternalImageScaleHints;
  imageGroups: string[],
  sepia: number;
  brightness: number;
  contrast: number;
  vivid: number;
  hueRotate: number;
  invert: number;
  placement: "fit" | "fill",
  thumbUrl: string;
  thumbCssUrl: string;
  canUpload: boolean;
  hasFFCropEditor: boolean;
  isAiGenererated: boolean;
  isVector: boolean;
  prompt: string;
  /** Indicates if you can modify scaling on that image */
  canScale: boolean;
  canSetPlacement: boolean;
  canSetDefaultImage: boolean;
  allows: Array<"sepia" | "brightness" | "contrast" | "vivid" | "hueRotate" | "invert">;
  filterTags: ReadonlyArray<string> | Array<string>;
  isHandwriting: boolean;
  average: number;

  /** Only available for Slim UI */
  slimAI?: iExternalImageAiStore

  /** Used only by Slim UI to store values */
  imageFrameInfos?: iExternalImageFrameInfos
  /** Used only by Slim UI to store values */
  assignedImage?: iImage | null; // "fallback?"
  /** Used only by Slim UI to store values */
  allowOnlyVectorImageUpload?: boolean
  /** Used only by Slim UI to store values */
  allowSvgUpload?: boolean
  /** Used only by Slim UI to store values */
  allowPdfUpload?: boolean

}

export interface iExternalImageAiStore {
  /** text-2-image Model */
  tMod?: iExternalText2ImageModel;
  /** text-2-image prompt */
  tPmt?: string;
  /** text-2-image negatve prompt */
  tnPmt?: string;
  /** text-2-image prefix */
  tPre?: string;
  /** text-2-image postfix */
  tPos?: string;
  /** text-2-image style */
  tSty?: SdxlStyle,
  /** select style */
  tSel?: boolean; //  select style
  /** text-2-image background */
  tBcg?: iExternalText2ImageBackground;
  /** text-2-image resolution class ("auto" when absent) */
  tRes?: iExternalImageEditResolution;
  /** text-2-image quality, GPT and Ideogram models only */
  tQ?: iExternalImageEditQuality;
  /** text-2-image prompt expansion, Ideogram 4 only */
  tPx?: "None" | "Medium" | "Large";
  /** text-2-image acceleration, Ideogram 4 only */
  tAc?: "none" | "low" | "regular" | "high";
  /** segment anything task */
  sat?: iExternalSegmentAnythingTaskStore;
  /** segment face task */
  sft?: iExternalSegmentFaceTaskStore;
  /** Image Assign Action */
  iAA?: iExternalImageAssignAction;
  iEP?: string // image-edit prompt
  /** image-edit quality */
  iEQ?: iExternalImageEditQuality;
  /** image-edit model */
  iEM?: iExternalImageEditModel;
  /** image-edit resolution class ("auto" when absent) */
  iER?: iExternalImageEditResolution;
  /** image-edit background ("auto" when absent) */
  iEBg?: iExternalText2ImageBackground;
  /** image-edit prompt expansion, Ideogram 4 only */
  iEPx?: "None" | "Medium" | "Large";
  /** image-edit acceleration, Ideogram 4 only */
  iEAc?: "none" | "low" | "regular" | "high";
  /** image-edit enhance prompt, Flux Pro Kontext only */
  iEEp?: boolean;
  /** image-edit remove background */
  iERBg?: boolean;
  /** image-edit additional imageurl */
  iEAIU?: string[];
}

/**
 * `GPT Image 1`, `GPT ImageEdit` (its older name) and `GPT Image 1.5` are retired. A frame may still
 * hold one, and from 2026-10-22 it runs on `GPT Image 2.5 Flare`. Do not set them.
 */
export type iExternalText2ImageModel = "SDXL" | "Flux Ultra" | "Flux Pro" | "Flux Dev" | "Flux Schnell" | "GPT Image 1" | "GPT ImageEdit" | "GPT Image 1.5" | "GPT Image 2" | "GPT Image 2.5 Flare" | "GPT Image 2.5 Sunburst" | "Nano Banana" | "Nano Banana Pro" | "Nano Banana 2" | "Ideogram 4";
export type iExternalText2ImageBackground = "transparent" | "opaque" | "auto";
/** `GPT ImageEdit` (gpt-image-1) and `GPT Image 1.5` are retired, see `iExternalText2ImageModel`. */
export type iExternalImageEditModel = "GPT ImageEdit" | "GPT Image 1.5" | "GPT Image 2" | "GPT Image 2.5 Flare" | "GPT Image 2.5 Sunburst" | "Nano Banana" | "Nano Banana Pro" | "Nano Banana 2" | "Flux Pro Kontext" | "Flux 2 Klein 4B" | "Ideogram 4";
export type iExternalImageEditQuality = "low" | "medium" | "high" | "xhigh" | "max";
export type iExternalImageEditResolution = "auto" | "0.5K" | "1K" | "2K" | "4K"; // not every model has every class
export type iExternalImageAssignAction = undefined | "fc-swap" | "bg-rm" | "bg-face" | "face-sticker" | "bg-sticker" | "contour-only" | "image-edit" | "sgm-any" | "sgm-any-sticker";
export type iExternalImageSegmentModelModel = "Segment Anything" | "Segment Anything 3";

export interface iExternalSegmentAnythingTaskStore {
  md?: iExternalImageSegmentModelModel // model
  pt?: string // prompt
  cls: string; // classes
  out: string; // output
  cp: boolean; // crop
  dp: boolean; // doublePass
  es: number; // erosionStrength
  ss: number; // smoothingStrength
}

export type iExternalSegmentFaceProvider = "Printess" | "CutoutPro"
export interface iExternalSegmentFaceTaskStore {
  pv: iExternalSegmentFaceProvider; // provider
  cp: boolean; // crop
}

export type iExternalRemoveBackgroundProvider = "Printess" | "CutoutPro"
export interface iExternalRemoveBackgroundTaskStore {
  pv: iExternalSegmentFaceProvider; // provider
  cp: boolean; // crop
}

export type iExternalUpscaleProvider = "Printess" | "CutoutPro"
export interface iExternalUpscaleTaskStore {
  pv: iExternalSegmentFaceProvider; // provider
}

/**
 * The AI settings of an image frame, with readable names and defaults filled in.
 * Prompts are as stored, ${...} placeholders are not evaluated.
 */
export interface iExternalImageAi {
  text2ImagePrompt: string;
  text2ImageNegativePrompt: string;
  text2ImagePrefix: string;
  text2ImagePostfix: string;
  text2ImageStyle: SdxlStyle;
  text2ImageSelectStyle: boolean;
  text2ImageModel: iExternalText2ImageModel;
  text2ImageTransparency: iExternalText2ImageBackground;
  text2ImageResolution: iExternalImageEditResolution;
  /** GPT and Ideogram models only */
  text2ImageQuality: iExternalImageEditQuality;
  /** Ideogram 4 only */
  text2ImagePromptExpansion: "None" | "Medium" | "Large";
  /** Ideogram 4 only */
  text2ImageAcceleration: "none" | "low" | "regular" | "high";
  /** Only set if the designer configured a segment anything task */
  segmentAnythingTask?: {
    model: iExternalImageSegmentModelModel;
    prompt: string;
    classes: string;
    output: string;
    crop: boolean;
    doublePass: boolean;
    erosionStrength: number;
    smoothingStrength: number;
  };
  segmentFaceTask: { provider: iExternalSegmentFaceProvider; crop?: boolean };
  removeBackgroundTask: { provider: iExternalRemoveBackgroundProvider; crop?: boolean };
  upscaleTask: { provider: iExternalUpscaleProvider };
  /** What happens to an image the buyer assigns to the frame */
  assignAction: iExternalImageAssignAction;
  /** Undefined if the designer did not set one */
  imageEditPrompt?: string;
  imageEditQuality: iExternalImageEditQuality;
  imageEditResolution: iExternalImageEditResolution;
  imageEditBackground: iExternalText2ImageBackground;
  /** Ideogram 4 only */
  imageEditPromptExpansion: "None" | "Medium" | "Large";
  /** Ideogram 4 only */
  imageEditAcceleration: "none" | "low" | "regular" | "high";
  /** Flux Pro Kontext only */
  imageEditEnhancePrompt: boolean;
  imageEditModel: iExternalImageEditModel;
  imageEditRemoveBg: boolean;
  imageEditAdditionalImageUrls: string[];
}

export interface iExternalImageRotation {
  sourceImage: string, // ist das rotierte Bild als Data-Url, brauchen wir eigentlich nicht im SLIM-UI
  initialRotation: "0" | "90" | "180" | "270",
  degree: number, // -45 - 45
  frameAspect: number,
  scaleFactor: number,
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}

export interface iExternalImageScaleHints {
  min: number;
  max: number;
  dpiAtScale1: number;
}


export type iExternalErrors = Array<iExternalError>

export interface iExternalError {
  boxIds: Array<string>,
  pinnedDocId?: string,
  errorCode: iErrorCode,
  errorValue1: string | number,
  errorValue2?: string | number,
  errorValue3?: string | number,
  errorValue4?: string,
  errorIcon?: iconName,
  isIgnored?: boolean
}
// Derived from the interface union below for single source of truth
export type iErrorCode = iErrorType["errorCode"];

export type iErrorType = iErrorImageResolutionLow | iErrorImageMissing | iErrorImageStillUploading | iErrorImageCouldNotUpload | iErrorEmpty | iErrorPreflight |
  iErrorUserCanceled | iErrorCustomStepValidation | iErrorEmptyBookPage | iErrorInvalidPageCount | iErrorNeedMorePages | iErrorTooManyPages | iErrorCharacterMissing |
  iErrorMaxChars | iErrorRegExpNotMatching | iErrorOffensiveLanguage | iErrorTextMissing | iErrorTextOverflow | iErrorNotSelected | iErrorNotChecked | iErrorNoLayoutSnippetSelected |
  iErrorMinTableEntries | iErrorMaxTableEntries | iErrorMandatoryTableCell | iErrorMissingEventText | iErrorInvalidNumber | iErrorInvalidDayValue | iErrorRowIndexLessThanZero |
  iErrorNeedMorePhotos | iErrorTooManyPhotos
/* ADD NEW ERROR CODE - add here and search for this comment - do not remove comment */

export interface iExternalErrorDisplay {
  errorCode: iErrorCode,
  icon: iconName,
  label?: string
  boxIds: Array<string>,
  pinnedDocId?: string,
  isIgnored?: boolean
}

export interface iErrorImageResolutionLow extends iExternalErrorDisplay {
  errorCode: "imageResolutionLow",
  dpi: string,
  icon: "image",
  ffId?: string
}

export interface iErrorImageMissing extends iExternalErrorDisplay {
  errorCode: "imageMissing",
  ffId?: string,
  tabId?: string,
  icon: "image"
}

export interface iErrorImageStillUploading extends iExternalErrorDisplay {
  errorCode: "imageStillUploading",
  icon: "image"
}

export interface iErrorImageCouldNotUpload extends iExternalErrorDisplay {
  errorCode: "imageCouldNotUpload",
  icon: "image"
}

export interface iErrorPreflight extends iExternalErrorDisplay {
  errorCode: "preflight",
  icon: "edit"
}

export interface iErrorEmpty extends iExternalErrorDisplay {
  errorCode: "emptyError",
  result: string,
  label?: string,
  ffId?: string,
  icon: "circle-1"
}

export interface iErrorUserCanceled extends iExternalErrorDisplay {
  errorCode: "user-canceled",
  result: string
}

export interface iErrorCustomStepValidation extends iExternalErrorDisplay {
  errorCode: "customStepValidation",
  result: string,
  icon: "circle-1"
}

export interface iErrorEmptyBookPage extends iExternalErrorDisplay {
  errorCode: "emptyBookPage",
  icon: "facing-pages"
}

export interface iErrorInvalidPageCount extends iExternalErrorDisplay {
  errorCode: "invalidPageCount",
  icon: "book-thin"
}

export interface iErrorNeedMorePages extends iExternalErrorDisplay {
  errorCode: "needMorePages",
  icon: "book-thin",
  minSpreads: number
}

export interface iErrorTooManyPages extends iExternalErrorDisplay {
  errorCode: "tooManyPages",
  icon: "book-thin",
  maxSpreads: number
}

export interface iErrorNeedMorePhotos extends iExternalErrorDisplay {
  errorCode: "needMorePhotos",
  icon: "image",
  min: number,
  add: number
}

export interface iErrorTooManyPhotos extends iExternalErrorDisplay {
  errorCode: "tooManyPhotos",
  icon: "image",
  max: number,
  remove: number
}

export interface iErrorOffensiveLanguage extends iExternalErrorDisplay {
  errorCode: "offensiveLanguageDetected",
  icon: "text",
  ffId?: string
}

export interface iErrorTextMissing extends iExternalErrorDisplay {
  errorCode: "textMissing",
  icon: "text",
  ffId?: string,
  tabId?: string
}

export interface iErrorCharacterMissing extends iExternalErrorDisplay {
  errorCode: "characterMissing",
  icon: "text"
}

export interface iErrorTextOverflow extends iExternalErrorDisplay {
  errorCode: "textOverflow",
  icon: "text"
}

export interface iErrorMaxChars extends iExternalErrorDisplay {
  errorCode: "maxCharsExceeded",
  icon: "text",
  maxChars: number,
  ffId?: string
}

export interface iErrorRegExpNotMatching extends iExternalErrorDisplay {
  errorCode: "regExpNotMatching",
  icon: "text",
  regExp: string,
  ffId?: string
}

export interface iErrorNoLayoutSnippetSelected extends iExternalErrorDisplay {
  errorCode: "noLayoutSnippetSelected",
  icon: "layout-snippet"
}

export interface iErrorNotSelected extends iExternalErrorDisplay {
  errorCode: "notSelected",
  icon: "close-square",
  ffId?: string,
  tabId?: string
}

export interface iErrorNotChecked extends iExternalErrorDisplay {
  errorCode: "notChecked",
  icon: "close-square",
  ffId?: string,
  tabId?: string
}

export interface iErrorMinTableEntries extends iExternalErrorDisplay {
  errorCode: "minTableEntries",
  icon: "database",
  rowsMissing: number,
  ffId: string,
  tabId?: string
}

export interface iErrorMaxTableEntries extends iExternalErrorDisplay {
  errorCode: "maxTableEntries",
  icon: "database",
  rowsTooMany: number,
  ffId: string,
  tabId?: string
}

export interface iErrorMandatoryTableCell extends iExternalErrorDisplay {
  errorCode: "mandatoryTableCell",
  icon: "database",
  missingColumns: string,
  ffId?: string,
  tabId?: string
}

export interface iErrorMissingEventText extends iExternalErrorDisplay {
  errorCode: "missingEventText",
  icon: "text"
}

export interface iErrorInvalidNumber extends iExternalErrorDisplay {
  errorCode: "invalidNumber",
  icon: "database"
}

export interface iErrorInvalidDayValue extends iExternalErrorDisplay {
  errorCode: "invalidDayValue",
  maxValue: string,
  icon: "calendar-light"
}

export interface iErrorRowIndexLessThanZero extends iExternalErrorDisplay {
  errorCode: "rowIndexLessThanZero",
  icon: "database"
}

/* ADD NEW ERROR CODE - add here and search for this comment - do not remove comment */


export interface iExternalFrame {
  top: string,
  left: string
}



export interface iExternalFont {
  /** Unique name of the font, pass it to `setTextStyleProperty(id, "font", name)` or `loadFont()` */
  name: string;
  /** Url of an svg image showing the font's name set in the font itself */
  thumbUrl: string;
  displayName: string;
  familyName: string;
  weight: number;
  isItalic: boolean;
  /** Font group the font is in: "Buyer Fonts", another group of the template, or a font list of its font set */
  groupName: string;
}

/** The fonts of one font group a buyer may pick from, see `getFontGroups()`. */
export interface iExternalFontGroup {
  /** Name of the font group: "Buyer Fonts", another group of the template, or a font list of its font set */
  name: string;
  /** Fonts of the group in the order of the template */
  fonts: Array<iExternalFont>;
}

export interface iExternalColor {
  mode: "rgb" | "cmyk";
  label: string;
  allowCMYK: boolean;

  r: number;  // 0-255
  g: number;
  b: number;

  c: number;  // 0-100
  m: number;
  y: number;
  k: number;
}

export type MergeMode = "merge" | "layout-snippet-no-repeat" | "layout-snippet-repeat-all" | "layout-snippet-repeat-inside"
  | "layout-snippet-no-repeat-persist-stickers" | "layout-snippet-repeat-all-persist-stickers" | "layout-snippet-repeat-inside-persist-stickers";
export type MergeResource = "images" | "fonts" | "colors" | "snippet-lists" | "form-fields" | "new-form-fields" | "form-field-list-data" | "form-field-list-and-value" | "styles" | "layer-matrix";

/**
 * The settings `attachPrintess()` applies on top of its template, for `loadTemplateAndFormFields()`.
 * They are applied after the template loaded, in this order, before the form field properties and values of the same call.
 * None of them leaves an undo step.
 */
export interface iLoadTemplateSettings {
  /**
   * Book settings for the loaded book, applied as `adjustBook()` applies them. Ignored with a warning when the template is not a book.
   */
  bookSettings?: iExternalBookSettings;

  /**
   * The number of images a single prints template takes. Both must be set, with `maxImages` above `minImages`.
   */
  singlePrintsSettings?: { minImages: number, maxImages: number };

  /**
   * Overrides the template's photobook theme menu. Pass the menu id, not the name; you can copy it from the Account Portal.
   */
  photobookThemeMenuId?: string;

  /**
   * The page count of the book's inside pages document, 4 or more. Pages are added at the end or removed from the end.
   */
  bookInsidePages?: number;

  /**
   * URL of a json file with form field values: `{ "environment": { "<form field name>": "<value>", ... } }`.
   * A string value is set as it is, an object value as its json. Applied after `formFieldProperties` and before `formFields`.
   */
  formFieldsUrl?: string;
}

/**
 * All parameters of `loadTemplateAndFormFields()` as one object: the positional parameters by their name, plus the settings of `iLoadTemplateSettings`.
 */
export interface iLoadTemplateOptions extends iLoadTemplateSettings {
  /**
   * The name of a template (case sensitive) or the save token of a saved design.
   */
  templateName: string;
  mergeTemplates?: iMergeTemplate[] | null;
  formFields?: iFormFieldNameValue[] | null;
  snippetPriceCategoryLabels?: string[] | null;
  formFieldProperties?: iFormFieldProperty[] | null;
  /**
   * Clear the exchange cache and the last loaded scope, so no data is exchanged. Defaults to false.
   */
  clearExchangeCaches?: boolean;
  /**
   * The template version to load. Defaults to "draft" for backward compatibility; always pass "published" in a live shop.
   */
  templateVersion?: "draft" | "published";
}

export interface iMergeTemplate {
  /**
   * Name of the template or Snippet ID to load an merge into the currently loaded template.
   */
  templateName: string;

  /**
   * The version to load. Defaults to "published".
   */
  templateVersion?: "draft" | "published"
  /**
   * Name of the document you want to merge. If none is specified the primary document of the template will be taken.
   */
  documentName?: string;
  /**
   * At what spread index the incoming template will be merged
   */
  spreadIndex?: number;
  /**
   * Force Printess to merge in a particular layout-snippet mode.
   * Frames which are merged as "layout-snippets" or "repeat-snippets" will be removed once the user places a new layout-snippet of the same type.
   */
  mergeMode?: MergeMode;

  /**
   * Define which resources you want to merge from the template additionally.
   */
  mergeResources?: MergeResource[];

  /**
   * Use the template name of this merge template to overwrite the master template name.
   * When producing this template, you'll see this merge template name instead of the master template name.
   */
  useAsTemplateName?: boolean;

  /* Pass a pixel based position for placing the snippet */
  pos?: iExternalRect;

  /** Tells printess to not apply exchange-id data */
  ignoreExchangeIds?: boolean
}

export declare type externalFormFieldChangeCallback = (name: string, value: string, tag: string, label: string, ffLabel: string, disabled?: boolean, imageId?: string, meta1?: string, meta2?: string, meta3?: string, meta4?: string) => void;
export declare type externalSelectionChangeCallback = (properties: Array<iExternalProperty>, scope: "document" | "frames" | "text") => void;
export declare type externalSpreadChangeCallback = (groupSnippets: ReadonlyArray<iExternalSnippetCluster> | Array<iExternalSnippetCluster>, layoutSnippets: ReadonlyArray<iExternalSnippetCluster> | Array<iExternalSnippetCluster>, tabs: ReadonlyArray<iExternalTab> | Array<iExternalTab>, hasRootFormFieldsWithOutTab: boolean, showSelectLayoutDialog: boolean, optOutHash: string, spreadId: string) => void;
export declare type externalDocChangeCallback = (newDocId: string) => void;
export declare type externalTabChangeCallback = (tabId: "#NONE" | "#LAYOUTS" | "#PHOTOS" | "#THEME" | "#PAGES" | "#ADD-TEXT" | "#ADD-IMAGE" | "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2" | string) => void;
export declare type externalGetOverlayCallback = (properties: Array<{ kind: iExternalPropertyKind, isDefault: boolean, isMandatory: boolean }>, width: number, height: number) => HTMLDivElement;
export declare type refreshPaginationCallback = undefined | (() => void);
export declare type receiveMessageCallback = undefined | ((topic: MessageTopic, data: Record<string, any>) => void);
export declare type refreshUndoRedoCallback = undefined | (() => void);
export declare type updatePageThumbnailCallback = undefined | ((spreadId: string, pageId: string, url: string) => void);
export declare type textStyleModeEnum = "default" | "all-paragraphs" | "all-paragraphs-if-no-selection";

export type MessageTopic = "SplitterFrameToText" | "ShowAlert" | "OpenImageUpload" | "MobileImagesUpload" | "MobileImagesRejected" | "BuyerUploadedImages";


export type iExternalHyphenationLanguage = "off" | "en-us" | "de" | "fr" | "es" | "se";

/**
 * Reads a Google Spreadsheet, returned by `api.createGoogleSheet()`.
 *
 * A sheet is read in two steps: `loadData()` fetches one sheet into memory, then `getData()`
 * returns its rows - filtered and sorted by whatever `setFilterValue()` and `setSortOrder()`
 * were given. The first row of a sheet is its header row: `columns` holds those names, and
 * a column index in this interface always refers to that order.
 *
 * ```js
 * const sheet = api.createGoogleSheet("<api-key>", "<sheet-id>");
 * await sheet.loadData();
 * sheet.setFilterValue(sheet.columns.indexOf("Country"), "Germany");
 * for (const row of sheet.getData()) { ... }
 * ```
 */
export interface iExternalGoogleSheet {

  /** Id of the spreadsheet this instance reads from. */
  readonly id: string;

  /**
   * Column names of the loaded sheet, taken from its first row. Undefined before `loadData()` ran,
   * empty when that row is blank. Only the columns A-Z are read, so a sheet wider than 26 columns
   * has fewer names here than its rows have cells.
   */
  readonly columns?: string[];

  /**
   * All rows of the loaded sheet, unfiltered and unsorted, header row included. Undefined before
   * `loadData()` ran, empty when the sheet holds no data. Google drops trailing empty cells, so a
   * row can be shorter than `columns`.
   */
  readonly data?: any[][];

  /**
   * How several filter values are combined. `false` (default): every filter must match in its own
   * column. `true`: a row is kept when any of the filter values appears in any of its columns.
   */
  filterOnAllColumns: boolean;

  /**
   * Loads one sheet (one tab) of the spreadsheet into memory and fills `columns` and `data`.
   *
   * Prefer the tab title over the index: a spreadsheet often keeps an empty default tab in first
   * position, and reading it is not an error - Google answers with no rows, so `columns` and `data`
   * come back empty as if the tab had no header row. Throws when no tab matches, naming the tabs
   * this spreadsheet has.
   *
   * @param sheetIndexOrTitle Title of the tab, or its zero-based index. Defaults to the first tab.
   */
  loadData(sheetIndexOrTitle?: number | string): Promise<void>;

  /** Returns the loaded rows with the current filters and sort order applied. Empty before `loadData()` ran. */
  getData(): any[][];

  /**
   * Sets the filter for one column. Rows are kept when the cell contains `value`, case-insensitive.
   * Pass an empty string to switch the filter for that column off.
   * @param columnIndex Zero-based index of the column, matching the order in `columns`.
   */
  setFilterValue(columnIndex: number, value: string): void;

  /**
   * Sorts the rows returned by `getData()` by one column, comparing the cells as text.
   * @param columnIndex Zero-based index of the column, matching the order in `columns`.
   */
  setSortOrder(columnIndex: number, order: "none" | "ascending" | "descending"): void;

  /** Lists all sheets of the spreadsheet. Only needed to find a sheet by name before `loadData()`. */
  getSheets(): Promise<iExternalGoogleSheetList>;

  /** Reads the header row (columns A-Z) of one sheet without loading its data. Empty when that row is blank. */
  getSheetColumnNames(sheet: iExternalGoogleSheetInfo): Promise<string[]>;

  /**
   * Reads the rows of one sheet without keeping them in memory. `values` is empty when the sheet or
   * the requested window holds no data.
   * @param paging Optional row window, limited to the columns A-Z. `startRow` is one-based and included.
   */
  getSheetData(sheet: iExternalGoogleSheetInfo, paging?: { startRow: number, count: number }): Promise<iExternalGoogleSheetValues>;
}

/** All sheets of a spreadsheet, as returned by `iExternalGoogleSheet.getSheets()`. */
export interface iExternalGoogleSheetList {
  sheets: Array<iExternalGoogleSheetInfo>;
}

/** One sheet inside a spreadsheet. */
export interface iExternalGoogleSheetInfo {
  properties: {
    sheetId: number;
    title: string;
    /** Zero-based position of the sheet inside the spreadsheet, the index `loadData()` expects. */
    index: number;
    sheetType: "GRID" | "OBJECT" | "DATA_SOURCE";
    gridProperties?: {
      rowCount: number;
      columnCount: number;
      rowGroupControlAfter: boolean;
      columnGroupControlAfter: boolean;
    }
  };
}

/** Raw cell values of a sheet, as returned by `iExternalGoogleSheet.getSheetData()`. */
export interface iExternalGoogleSheetValues {
  range: string;
  majorDimension: "ROWS" | "COLUMNS";
  /** The rows, empty when the range holds no data. Google drops trailing empty cells, so rows can differ in length. */
  values: Array<any[]>;
}

export interface iExternalContextMenuItem {
  caption: string;
  sub?: Array<contextMenuItem>;
  callback?: () => void;
  bold?: boolean;
  disabled?: boolean;
  color?: string;
  icon?: iconName;
  font?: string;
  textOnly?: boolean;
  hidden?: boolean;
}

export interface iExternalImage {
  /** The Printess image-id, use for assigning the image to frames */
  id: string;

  /** The original-URL, be careful might be PDF or TIFF! */
  originalImageUrl: string;

  /** Returns always a PNG-URL, best for passing to AI models */
  pngImageUrl: string;

  /** A scaled down version of the images for ui display */
  thumbUrl: string;

  /** A scaled down version for direct use in css, contains url('') brackets */
  thumbCssUrl: string;

  width: number;
  height: number;
  fileHash: string;
  inUse: boolean;
  useCount: number;
  group: string;
  average: number;
  name: string;
  analysis?: iExternalImageAnalysis;
  groupAnalysis?: iExternalImageGroupAnalysis;
  lastModified: number,
  uploaded: number;
}

export interface iExternalFormFieldImageListItem {
  imageId: string,
  image: iExternalImage,
  isSelected: boolean,
  key: string,
  label: string,
  description?: string,
  meta1?: string,
  meta2?: string,
  meta3?: string,
  meta4?: string
}


/** A bounding box in XYXY fromat */
export type iExternalBoundingBox = { x1: number, y1: number, x2: number, y2: number }

export interface iExternalImageAnalysis {
  imageId: string;
  width: number
  height: number
  datetime: number
  focusScoreFft: number
  numFaces: number
  faceBboxes: iExternalBoundingBox[]
  faceAestheticScores?: number[]
  allFacesBbox?: iExternalBoundingBox
  faceAreasPct: number[]
  faceFocusScore: number
  imageFocusScore: number
  focalPointPct: { x: number, y: number }
  preferredOrientation: string
  preferredAspect: number
  isScreenshot: boolean
  isDocument: boolean
  isBlurry: boolean
  documentProbability: number
  colorPalette: string[]
}

export interface iExternalImageGroupAnalysis {
  timeCluster: number
  featureCluster: number
  featureClusterPriority: number
  duplicateCluster: number
  duplicateSimilarity: number
  similarityClusters: number[]
}

export interface iExternalPhotobookDocInfo {
  facing: boolean,
  minSpreads: number,
  maxSpreads: number,
  addSpreadCount: number,
  hasCoverDocument: boolean,
  aspect: number
}

export interface iDropdownItems {
  caption: string,
  disabled?: boolean,
  show: boolean,
  task: () => void
}

export interface iExternalRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface iMobileUIButton {
  icon?: iconName | "none",
  thumbCssUrl?: string,
  circleStyle?: string,
  ffCircleCaption?: string,
  caption: string,
  hasCollapsedMetaProperties: boolean,
  newState: iMobileUiState,
  hide?: boolean
}

export interface iMobileUiState {
  state: "ext-value" | "form-fields" | "selection" | "imageCrop" | "table-edit" | "off-canvas" | "text-frame-style"
  externalProperty?: iExternalProperty,
  metaProperty?: iExternalMetaPropertyKind,
  tableRowIndex?: number
}

export interface iExternalImageFrameDimensions {
  width: number,
  height: number,
  widthCaption: string,
  heightCaption: string
}

export type iConversionMode = "fc-swap" | "bg-rm" | "upscale" | "bg-face" | "image-edit" | "sgm-any";
export interface iImageConversionSettings {
  mode: iConversionMode,
  prompt?: string,
  quality?: string,
  resolution?: string,
  background?: string
}

export interface iExternalImageFrameInfos {
  frame: iExternalImageFrameDimensions
  //image: iExternalImage,
  image: {
    width: number,
    height: number,
    originalImageUrl: string,
    displayImageUrl: string,
    displayImageWidth: number,
    displayImageHeight: number
  },
  // imageSrcX: string,

  crop: {
    xPosition: number; // 0-1
    yPosition: number; // 0-1
    widthScale: number; // 0-1
    heightScale: number; // 0-1
  },
  conversion?: iImageConversionSettings,
  conversionBaseImage?: string,
  conversionAppliedImage?: string,
  rotation?: iExternalImageRotation,
  rotationSourceImage?: iImage,
  minDPI: number,
  imagePlacement: "fill" | "fit" | "crop" | "ai"
}

export type MobileUiState = "document" | "frames" | "details" | "text";

export interface MobileUiMenuItems {
  id: "back" | "save" | "proof" | "load" | "expert" | "undo" | "redo" | "addPages" | "arrangePages" | "previous" | "next" | "firstStep" | "lastStep",
  title: string,
  icon?: iconName,
  disabled: boolean,
  show: boolean,
  task: () => void
}

export interface iButtonCircle {
  hasSvgCircle: boolean,
  hasImage: boolean,
  hasCaption: boolean,
  hasColor: boolean,
  hasIcon: boolean,
  icon: iconName | "none",
  displayGauge: boolean,
  gaugeValue: number,
  isSelected: boolean,
  captionClass: string,
  captionInCircle: string,
  color: string
}

export interface iStoryContent {
  pts: Array<any> // Array<iParagraphTextAndStyles>
}

export interface FormFieldEntry {
  key: string;
  label: string;
  description: string;
}

export interface FormFieldItem {
  name: string;
  value: string;
  visibility: string;
  isPriceRelevant: boolean;
  entries: FormFieldEntry[];
}

export interface ContentEditableItem {
  id: string;
  name: string;
  isMandatory: boolean;
  value: string;
  maxCharacters: number;
}

export interface DocumentContentEditables {
  id: string;
  name: string;
  simpleTexts: ContentEditableItem[];
  multilineTexts: ContentEditableItem[];
  images: ContentEditableItem[];
  stories: Record<string, string[]>;
}

export interface TemplateEditables {
  primaryDocument: DocumentContentEditables;
  formFields: FormFieldItem[];
}


/**
 * @deprecated
 * This interface is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
 */
export interface iFrameCountAndClasses {
  documentName: string,
  frames: number,
  spreads: Array<iFrameCountAndClassesSpread>
}

/**
 * @deprecated
 * This interface is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
 */
export interface iFrameCountAndClassesSpread {
  spreadName: string,
  frames: number,
  classes: Record<string, number>
}

/** Provides information about number of frames edited by the buyer per document */
export interface iFrameCountAndMarkers {
  /** Name of document */
  documentName: string,
  /** Count of buyer manipulated frames */
  frames: number,
  /** Detailed information about all spreads */
  spreads: Array<iFrameCountAndMarkersSpread>
}

/** Provides information about number of frames edited by the buyer per spread */
export interface iFrameCountAndMarkersSpread {
  /** Name of spread  */
  spreadName: string,
  /** Count of buyer manipulated frames on spread */
  frames: number,
  /** List of markes used by buyer manipulted frames on spread*/
  markers: Record<string, number>
}

/**
 * passed whenever a price could have possible changed
 * contains all price-relevant informations from printess in one place
 */
export type iExternalProductPriceInfo = {
  /** key / value list of all price relevant form fields */
  priceRelevantFormFields: { [key: string]: { value: string, tag: string } },

  /** key / value list of all price-per-letter form fields with price and character count */
  pricePerLetterFormFields: { [key: string]: { price: number, amount: number } },

  /** Sum of all used priceCategoryGroups and there used amounts
   * All used layout-snippets and stickers with a price category
   * will be summed up here
   * Form Fields with per-letter price catogorie will show here as well */
  snippetPriceCategories: Array<iUsedPriceCategory>,

  /**
   * Page count of book inside pages document if available, otherwise current document page count.
   */
  pageCount: number,

  /**
   * If a local table-form-field is used as data-source it returns the total numbers of records
   * in the output PDF. If a column "circulation" is present, it outputs the row "circulation" times.
   * Result is propably higher than the amount of records in the table-form-field
   *
   * In Single Photo Mode, printedRecordsCount is the total amount of prints produced.
   */
  printedRecordsCount: number,

  /**
   * If a local tabel-form-field is used as data-source it returns the numbers of rows in the table Form Field.
   * This values does not include "circulation" set for individual rows.
   */
  pureRecordsCount: number,

  /**
   * Indicates if the tabel-form-field has circulation column.
   */
  hasCirculationColumn: boolean,

  /**
   * @deprecated
   * A list of all used document-price-categories. Only returns documents which have actually been edited by the buyer
   * Important: Its deprecated, You can not enable this feature anymore!
   */
  priceCategories: Array<string>,

  /** @internal */
  testModeEnabled: boolean
}

/** Information about all used price categories plus the number of usages.
 * 'priceCategory' starts with 1(!)
*/
export interface iUsedPriceCategory {
  priceCategory: number,
  amount: number
}

/** Callback executed whenever price relevant information has changed.
 * Once calculated the new price you can call `refreshPriceDisplay()`to update
 * the price and product informations for the user.
 * Example for iframe integration: (can be called on `uiHelper` as well)
 * ```
    iframe.contentWindow.postMessage({
      cmd: "refreshPriceDisplay", display: {
        price: string, // any string like "32.34â‚¬"
        oldPrice?: string // will be crossed out
        legalNotice?: string, // will be displayed under the price
        productName?: string // to change product name dynamically
      })}
    }, "*");
    ```
  */
export type externalPriceChangeCallback = (infos: iExternalProductPriceInfo) => void;
export type externalZoomChangeCallback = () => void;

/**
 * Structure expected when calling set price information
 */
export interface iExternalPriceDisplay {
  price: string,
  oldPrice?: string
  legalNotice?: string,
  /**
   *  can be dependend on form fields
   */
  productName?: string
  /**
   *  will be displayed via info icon in an iframe.
   */
  infoUrl?: string
  /**
   *. Dynamically update pice categorie labels.
   */
  priceCategoryLabels?: Record<string, string>

}

export interface iExternalDesignAgentOptions {
  /** what to design, in prose. The form a surface collects is composed into this. */
  prompt: string;
  /** reference images sent as vision input - a corporate-design sample, a layout to work from */
  imageUrls?: Array<string>;
  /**
   * What a design for a whole document does to the template that is already loaded.
   * `"add"` (default) keeps the existing documents; `"replace"` swaps the template for the
   * generated one and is meant for a buyer designing their own product, not for a designer with
   * unsaved work in front of them.
   */
  apply?: "add" | "replace";
  /** `apply: "replace"` only - the name the generated template takes. */
  newTemplateName?: string;
  /** persisted to template properties, so the next run starts from the last one's inputs */
  settings?: iClaudeDesignSettings;
  /** the answer so far, with command lines removed - throttled to a few updates a second */
  onOutput?: (text: string) => void;
  /** one line about what just happened: a command's outcome, "Done in 4.2s", an error */
  onStatus?: (status: string) => void;
}

export interface iClaudeDesignSettings {
  product: string;
  brandColors: string[];
  companyName: string;
  graphicStyle?: string;
  styleMode?: "upload" | "pick" | "description";
  logoUrl: string;
  uploadedLogoFileName: string;
  logoDarkUrl?: string;
  uploadedLogoDarkFileName?: string;
  prompt: string;
  productType?: string;
  ciImageUrl?: string;
  uploadedCiImageFileName?: string;
  lastResult?: TemplateImportTask;
  lastInvalidResult?: string;
}

// export type ImageAiFilterType = "image-edit";
// export type ImageAiFilterModel = "GPT Image Edit" | "Nano Banana";
export type ImageAiFilterType = "IMAGE-EDIT";
/**
 * Every model that can edit a picture. Spelled out rather than derived, because this file may not
 * import: `genImageCapabilitiesForModel(model, "edit")` in the editor is the source of truth, and a
 * test pins this union to it. `GPT Image 1` and `GPT ImageEdit` are one model - the latter is the
 * name it was stored under before it had a version number, kept because saved filters hold it.
 * Both, and `GPT Image 1.5`, are retired: no picker offers them, and from 2026-10-22 a saved filter
 * that holds one runs on `GPT Image 2.5 Flare`.
 */
export type ImageAiFilterModel = "GPT ImageEdit" | "GPT Image 1" | "GPT Image 1.5" | "GPT Image 2"
  | "GPT Image 2.5 Flare" | "GPT Image 2.5 Sunburst" | "Nano Banana" | "Nano Banana Pro"
  | "Nano Banana 2" | "Flux Pro Kontext" | "Flux 2 Klein 4B" | "Ideogram 4";
/**
 * The per-model settings an edit can be given. Each is dropped when the chosen model has no such
 * setting, so passing one a model does not support is harmless rather than an error.
 *
 * Quality is not here: it is already the third parameter of `createImageEdit`, and offering it in
 * two places would need a rule about which one wins.
 */
export interface ImageEditSettings {
  /** nothing means the target frame's own size decides the class */
  resolution?: "0.5K" | "1K" | "2K" | "4K",
  background?: "transparent" | "opaque" | "auto",
  promptExpansion?: "None" | "Medium" | "Large",
  acceleration?: "none" | "low" | "regular" | "high",
  enhancePrompt?: boolean,
}

export interface ImageAIFilter extends ImageEditSettings {
  id: string,
  label: string,
  type: ImageAiFilterType,
  model: ImageAiFilterModel,
  isUserPrompt: boolean,
  promptPrefix?: string,
  prompt: string,
  /** not gpt-only any more, but keeps its name so saved filters still read */
  gptQuality?: iExternalImageEditQuality,
  thumbnailUrl: string
}
export interface ImageAIFilterCategory {
  id: string,
  label: string,
  filters: ImageAIFilter[]
}


export type PhotobookDistribution = "MagicMode" | "OneImagePerPage" | "FixedThemeWithAdditionalPages"

export type PhotobookThemePageType = "cover" | "single" | "double"
export type PhotobookThemeFiltering = "show-all-themes" | "hide-theme-selection" | "use-theme-keywords"
export type PhotobookThemeWizard = "show-ai-and-freestyle" | "show-only-ai" | "show-only-freestyle"
export type PhotobookThemeSinglePhoto = "always" | "never" | "not-on-landscape"

export interface iPhotobookThemePageInfo {
  id: string,
  snippetUrl: string,
  global: boolean,
  docId: string,
  thumb: string,
  keywords: string[],
  type: PhotobookThemePageType,
  editables?: {
    texts: number;
    images: number;
    shapeColors: number;
  }
}

export interface iPhotobookTheme {
  name: string,
  thumb: string,
  themeTags: string[],
  searchTags: string[],
  backgroundTags: string[],
  stickerTags?: string[],
  stickerMenuId?: string,
  textStickerTags?: string[],
  textStickerMenuId?: string,
  photoStickerTags?: string[]
  photoStickerMenuId?: string,
  keywords: string[], // for keyword menu based filtering
  pageCount: number,
  pageSetup: Array<{ snippet: iPhotobookThemePageInfo | null, type: PhotobookThemePageType }>,
  backgroundSnippet: iPhotobookThemePageInfo | null,
  filtering: PhotobookThemeFiltering,
  wizard: PhotobookThemeWizard,
  hasThemeLayoutsCover?: boolean,
  hasThemeLayoutsSingle?: boolean,
  hasThemeLayoutsDouble?: boolean,
  hasThemeLayoutsBackground?: boolean
  assignSinglePhoto?: PhotobookThemeSinglePhoto
}

/**
 * keys: "photobookThemes" and "printess-photobookThemes" (If we like to support global themes)
 * Hier kann DTO und Object das gleiche sein wie beim Menu ...
 */
export interface iPhotobookThemeListEntryDto {
  /** name */
  n: string,
  /** thumbnail */
  t: string,
  /** keywords */
  kws: string[],
  /** theme-tags */
  tt: string[]
}




export type iconName =
  "image"
  | "images"
  | "image-solid"
  | "image-regular"
  | "image-square"
  | "image-slash"
  | "portrait"
  | "bezier"
  | "text"
  | "text-solid"
  | "pathText"
  | "magnet"
  | "pointer"
  | "close-square"
  | "close"
  | "close-small"
  | "docRef"
  | "collapseLeft"
  | "expandLeft"
  | "expand-arrows"
  | "edit"
  | "edit-inverse"
  | "pen"
  | "pen-solid"
  | "pencil-ruler"
  | "plus"
  | "plus-bold"
  | "plus-circle"
  | "plus-square"
  | "minus"
  | "minus-bold"
  | "minus-light"
  | "circle-1"
  | "circle-1-red"
  | "shapes"
  | "shapes-solid"
  | "square"
  | "settings"
  | "vector-shape"
  | "address-card"
  | "paperclip"
  | "facing-pages"
  | "page"
  | "page-solid"
  | "cog"
  | "perspective"
  | "style"
  | "story"
  | "text-flow"
  | "exchange"
  | "text-align-justify-justify"
  | "text-align-justify-left"
  | "text-align-justify-right"
  | "text-align-justify-center"
  | "text-align-left"
  | "text-align-right"
  | "text-align-center"
  | "check"
  | "check-solid"
  | "check-square"
  | "user-circle"
  | "user-solid"
  | "user-crown-solid"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "arrows"
  | "arrows-circle"
  | "arrows-h"
  | "arrows-v"
  | "carret-down-solid"
  | "carret-right-solid"
  | "carret-left-solid"
  | "text-size"
  | "text-tracking"
  | "text-width"
  | "line-height"
  | "line-width"
  | "palette"
  | "brush"
  | "undo"
  | "undo-solid"
  | "redo"
  | "redo-solid"
  | "copy"
  | "copy-solid"
  | "paste"
  | "cut"
  | "object-ungroup"
  | "trash"
  | "trash-solid"
  | "remove-format"
  | "clipboard"
  | "search-plus"
  | "search-minus"
  | "search-plus-light"
  | "search-minus-light"
  | "search-light"
  | "save"
  | "save-light"
  | "slash"
  | "empty"
  | "cloud-upload-alt"
  | "folder-open-solid"
  | "folder-open"
  | "open-new-tab"
  | "tint"
  | "warp-arc"
  | "warp-flag"
  | "warp-bulge"
  | "warp-arc-upper"
  | "warp-pit-upper"
  | "warp-arc-lower"
  | "warp-pit-lower"
  | "warp-fish"
  | "warp-squeeze"
  | "warp-mug"
  | "mesh"
  | "crop"
  | "crop+rotate"
  | "place-image"
  | "fill-image"
  | "fit-image"
  | "vertical-align-bottom-baseline"
  | "vertical-align-center-baseline"
  | "vertical-align-center"
  | "vertical-align-top"
  | "vertical-align-bottom"
  | "warning"
  | "effects"
  | "robot"
  | "microchip"
  | "record"
  | "play"
  | "running"
  | "rotator"
  | "lock-closed"
  | "lock-open"
  | "lock-closed-solid"
  | "frame-lock-closed"
  | "frame-lock-opened"
  | "user-lock-closed"
  | "user-lock-opened"
  | "link"
  | "stroke-cap-round"
  | "stroke-cap-projecting"
  | "stroke-cap-butt"
  | "stroke-align-center"
  | "stroke-align-inside"
  | "stroke-align-outside"
  | "stroke-join-miter"
  | "stroke-join-round"
  | "stroke-join-bevel"
  | "wrap-both-sides"
  | "no-wrap"
  | "printess-wand"
  | "print-solid"
  | "shopping-cart"
  | "shopping-cart-fast"
  | "shopping-cart-solid"
  | "shopping-cart-add"
  | "folder-plus"
  | "eye-solid"
  | "eye-solid-pink"
  | "eye-solid-slash"
  | "eye-solid-slash-pink"
  | "font"
  | "send-back"
  | "send-backward"
  | "bring-front"
  | "bring-forward"
  | "distort"
  | "list-ul"
  | "drag"
  | "ellipsis-v"
  | "ellipsis-h"
  | "sun-light"
  | "adjust"
  | "scroll-old"
  | "align-top"
  | "align-middle"
  | "align-bottom"
  | "align-left"
  | "align-center"
  | "align-right"
  | "space-vertical-around"
  | "space-vertical-between"
  | "space-horizontal-around"
  | "space-horizontal-between"
  | "layer-group"
  | "ruler"
  | "layout-snippet"
  | "layout-snippet-invers"
  | "group-snippet"
  | "group-snippet-invers"
  | "primary-doc"
  | "primary-doc-invers"
  | "preview-doc"
  | "preview-doc-invers"
  | "production-doc"
  | "production-doc-invers"
  | "facebook-round"
  | "clock-solid"
  | "page-plus-solid"
  | "user-friends-solid"
  | "opacity"
  | "file-invoice"
  | "help"
  | "triangle-solid"
  | "pin-solid"
  | "pin"
  | "angle-right"
  | "angle-down"
  | "sync"
  | "mirror-x"
  | "mirror-y"
  | "folder-tree-solid"
  | "filter-reset"
  | "compact-disc"
  | "chevron-double-down-duotone"
  | "chevron-left"
  | "chevron-right"
  | "angle-left"
  | "angle-right"
  | "database"
  | "coins"
  | "sync-alt"
  | "clock-light"
  | "calendar-alt"
  | "calendar-light"
  | "coin-light"
  | "coin"
  | "page-inverse"
  | "page-light"
  | "bars-light"
  | "credit-card"
  | "info-circle"
  | "carret-left-solid"
  | "check-circle-solid"
  | "ban"
  | "circle-dot"
  | "pause-solid"
  | "pause-light"
  | "angle-up-light"
  | "angle-down-light"
  | "chevron-up-light"
  | "chevron-down-light"
  | "sign-in-light"
  | "share-light"
  | "share-solid"
  | "reply-light"
  | "reply-solid"
  | "undo-arrow"
  | "redo-arrow"
  | "rotate"
  | "primary"
  | "back"
  | "angle-double-right"
  | "angle-double-left"
  | "arrow-to-right"
  | "arrow-to-left"
  | "distribute-image"
  | "minus-square"
  | "arrow-square-right"
  | "bullseye-pointer-solid"
  | "hand-pointer-light"
  | "project-diagram-solid"
  | "eye-dropper"
  | "eye-dropper-light"
  | "cloud-upload-light"
  | "cloud-upload-check"
  | "arrows-resize-h"
  | "arrows-resize-v"
  | "arrows-resize"
  | "arrows-minimize"
  | "arrows-maximize"
  | "shopping-basket"
  | "shopping-basket-light"
  | "home-solid"
  | "home-light"
  | "smile"
  | "code-curly"
  | "text-bottom"
  | "text-center"
  | "text-top"
  | "pen-swirl"
  | "handwriting"
  | "focus-face"
  | "focus-group"
  | "mug"
  | "shirt"
  | "flower"
  | "burger-menu"
  | "path-non-zero"
  | "path-even-odd"
  | "circle-dollar"
  | "grid-lines"
  | "table-thin"
  | "camera-slash"
  | "scissors"
  | "scissors-horizontal"
  | "scissors-vertical"
  | "record-up"
  | "record-down"
  | "arrow-left-circle"
  | "arrow-right-circle"
  | "grid-4"
  | "image-to-text"
  | "text-to-image"
  | "scroll-to-image"
  | "handwriting-to-text"
  | "text-to-handwriting"
  | "arrow-right-long"
  | "camera-solid"
  | "desktop-mobile-duotone"
  | "cloud-check-duotone"
  | "glass"
  | "pot-food"
  | "coke"
  | "cube-regular"
  | "cube-invers"
  | "deco-fading"
  | "deco-color-cut"
  | "deco-oblique-lines"
  | "deco-horizontal-lines"
  | "text-block-shadow"
  | "text-line-shadow"
  | "text-3d-shadow"
  | "text-no-shadow"
  | "add-gap-around"
  | "remove-gap-around"
  | "book-thin"
  | "book-solid"
  | "star-light"
  | "star-solid"
  | "tags-light"
  | "typewriter"
  | "repeat-light"
  | "remove-background"
  | "remove-background-simple"
  | "page-centered"
  | "expert"
  | "sticky-note"
  | "contrast"
  | "saturation"
  | "hammer+brush"
  | "qr-code"
  | "sort-solid"
  | "sort-solid-up"
  | "sort-solid-down"
  | "sparkling-star"
  | "download-solid"
  | "superscript"
  | "subscript"
  | "photo-grid"
  | "swap"
  | "page-margin"
  | "border"
  | "heart"
  | "paw"
  | "smart"
  | "similar-images"
  | "upscale-image"
  ;