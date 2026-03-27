/**
 * Main call to attach the Printess to div-element of your choice.
 * In ```printessAttachParameters``` you can pass authorization, template-name and other parameters.
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


export type AiTextEditOptionAllow = "allowAiTextRewrite" | "allowAiTextFixSpelling" | "allowAiTextAddMoreText" | "allowAiTextShortenText" | "allowAiTextChangeWritingStyle" | "allowAiTextGenerateQuiz";


export type ErrorName = "templateNotFound" | "addToBasketFailed"

export type externalMessageTopic = "SplitterFrameToText" | "ShowAlert" | "OpenImageUpload" | "MobileImagesUpload" | "BuyerUploadedImages";

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
  photoAiDesignBookUrl: string,
  photoFreestyleBookUrl: string,
  photoBookCreationUrl: string
}

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
  location: "button-bar" | "image-upload" | "only-image-upload",
  label: string,
  icon?: iconName,
  color: "primary" | "secondary",
  outline: "solid" | "outline",
  clickCallback: () => any
}

export type iPanelSettingsKey =
  "close-button" | "undo-button" | "zoom-button" | "save-button" | "load-button" | "grid-button" | "proof-button" | "color-schemes" | "pages-preview" | "changeDockForLandscape" /* on/off */
  | "close-button-style" | "headline-text" | "logo-text" | "headline-align" | "label-style" | "ok-button" | "layout" | "pricing" /* string */
  | "logo-mr" | "logo-ml" | "logo-mt" | "logo-mb" | "headline-mr" | "headline-ml" | "headline-mt" | "headline-mb" | "logoMaxHeight" /* Pixel */
  | "maxThumbWidth" | "maxThumbHeight" | "dockBottomSize" | "dynamicThumbSize"; /* number */

export interface iPrintessComponent {
  showProgressOverlay(msg: string): void
  hideProgressOverlay(): void
  hasProgressOverlay(): boolean
  showPhotobookProgress(msg: string, percent: number): void
  hidePhotobookProgress(): void
  hasPhotobookProgress(): boolean
  isModalDialogOpen(): boolean
  notifyUpcomingPriceChange(): void
  propertyChangedBySystem(propertyId: string, newValue: any)
  reloadFormFieldTab()
  selectionChangeCallback: externalSelectionChangeCallback
  spreadChangeCallback: externalSpreadChangeCallback
  docChangeCallback: externalDocChangeCallback
  reset(options: { keepOverlay?: boolean, keepSelection?: boolean, keepTab?: boolean }): Promise<void>
  resetWizzards(): void
  receiveMessage(topic: externalMessageTopic, data: Record<string, any>): void
  refreshPagination(): void
  refreshUndoRedoState(): void
  refreshPriceDisplay(info: iExternalPriceDisplay): void
  updatePageThumbnail(spreadId: string, pageId: string, url: string): void,
  imageListChangeCallback(): void,
  hide(): void,
  show(): void,
  writeSetting(key: iPanelSettingsKey, value: string),
  openGenericDialog(options: IGenericDialogOptions): Promise<HTMLDivElement>,
  selectMenuKeyword(keyword: string): void
  clearLayoutSnippetCache(): void
  showTextEditOverlay(): void
  hasMiniPageNav(): boolean
  getLastDragContent(): "sticker" | "image-id" | null
  loadTheme(themeName: string)
  currentTheme(): string
  isFullyLoaded(): boolean
}


export type PanelUiHintPos = "zoom-in";
export type PanelUiHintView = "mobile" | "desktop" | "all" | "none";
export interface PanelUiHint {
  view: PanelUiHintView,
  pos: PanelUiHintPos
}
export type iInitialPropertiesClusterType = "group" | "boxes" | "background" | "ffs";

export interface iInitialPropertiesCluster {
  slimIdPrefix: string,
  context: iInitialPropertiesClusterType,
  top: number,
  propertyIds: string[]
}
export interface iInitialProperties {
  ffProps: Array<iExternalProperty>
  frameProps: Array<iExternalProperty>
  previews: Array<{ docName: string, pageCount: number, facingPages: boolean }>
  clusters: Array<{ slimIdPrefix: string, context: "group" | "boxes" | "ffs" | "background", propertyIds: string[] }>;
  aspect: number
  acceptDefaultTextIfMandatory: boolean
  priceCategoryLabels: { [key: string]: string },
  colors: Array<{ name: string, color: string }>,
  fonts: Array<{ name: string, thumbUrl: string, displayName: string, familyName: string, weight: number, isItalic: boolean }>,
  fontSizesInPt: Array<number>,
  fontSizesInPercent: Array<number>,
  paragraphStyles: Array<{ class: string, css: string }>,
  enableCustomColors: boolean,
  scaledImageMinimumDpi: number,
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
   * If the user is not logged in yet the shopLoginCall is required to return if the user click login/register button
   * Besides saveToken, thumbnailUrl and custom project name (displayName) are returned for saving the template
   */
  shopLoginCallback?: ((type: "register" | "login", saveToken: string, thumbnailUrl: string, displayName: string) => void),

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
   * "upscale", "nsfw", "remove background", "segment face", "segment anything", "countour", "face swap", "text generation",
   * "OpenAi Image Edit - low", "OpenAi Image Edit - medium", "OpenAi Image Edit - high",
   * "Nano Banana", "Nano Banana Prop",
   * "SDXL", "Flux Ultra", "Flux Pro", "Flux Dev", "Flux Schnell", "GPT Image 1", "GPT ImageEdit"
   */
  onAiUsageCallback?: (ai: string, credits: number) => void
}


export interface iMakeData {
  //shopUserId
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
  addressLine3: string,
  addressLine4: string,
}

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

  /** optional name of sort index  */
  sortIndex?: string;
  /** optional tells if printess iframe should show the gallery first  */
  showGallery?: boolean;
  /** optional name of inital category (name from keyword menu)  */
  initialCategory?: string;
  /** optional name of inital topic (name from keyword menu)  */
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
   * e.g. ["1,50€","2,50€","3,50€","4,50€","5,50€"]
   */
  snippetPriceCategoryLabels?: Array<string>


  /**
   * Labels displayed at form-fields which have a price tag set
   * e.g. \{
          "mug-front": "+ 2.10 €",
          "mug-back": "+ 2.10 €",
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

  /** retrieves root path for images */
  getResourcePath(): string;

  shopToken(): string;

  /**
   * Returns if Printess is currently attached to the DOM.
   */
  isAttached(): boolean;

  /**
   * Tells Printess to remove all global event-listeners
   * Logs error if handlers are not currently attached or if scope is not initialized
   */
  detachAllHandlers();

  /**
  * Tells Printess to re-attach all global event-listeners;
  * This MUST NOT be called initially. Only after you have called detachAllHandlers();
  * Logs error if handlers are not currently detached.
  */
  attachAllHandlers();

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


  setBcuiMobile(v: boolean)

  /**
   * Load a template to the Printess editor.
   * Supports 'exchangeId' on document level. Docs with matching exchange-id's will transfer all user changes.
   * @param templateNameOrToken can be either the name of a template (case sensitive) or the save-token received as a result of a user design save.
   * @param mergeTemplates optional parameter to pass other templates to merge
   * @param takeOverFormFieldValues optional parameter to transfer global form field values from previous to next document
   */
  loadTemplate(templateNameOrToken: string, mergeTemplates?: iMergeTemplate[], takeOverFormFieldValues?: boolean): Promise<void>

  /**
   * Loads template first and then exchange state from save-token.
   * @param templateName name of template to load
   * @param saveToken save-token to extract exchange state from
   * @param publishedVersion optional, default is true.
   */
  loadTemplateWithExchangeToken(templateName: string, saveToken: string, publishedVersion?: boolean): Promise<void>

  /**
   * Logs a message to the save token. Useful for setting user confirmation messages like "accepted low resolution" or "accepted image compliance warning".
   * @param message The message you want to log to the save token. It's automatically prefixed with the current date and time.
   */
  addBuyerLogEntry(message: string): void;

  /**
   * Returns information about the applied layout snippets per document per spread.
   * The first level contains a mapping of document name to spread info.
   * The second level (spreads) contains the mapping of spread name or id (in case the spread does not have a name set) to the layout info.
   */
  getAppliedLayouts(): Record<string, Record<string, appliedLayoutInfo>>;

  /**
   * Load a template to the Printess editor and sets form fields.
   * Supports 'exchangeId' on document level. Docs with matching exchange-id's will transfer all user changes.
   * @param templateNameOrToken can be either the name of a template (case sensitive) or the save-token received as a result of a user design save.
   * @param mergeTemplates optional parameter to pass other templates to merge
   * @param formFields optional parameter to pass global form field values
   * @param snippetPriceCategoryLabelssnippetPriceCategoryLabels optional parameter to pass snippetPriceCategoryLabels
   * @param iFormFieldProperty optional form field properties to adjust after load
   * @param clearExchangeCaches optional clear exchange cache and last loaded scope, so no data is exchanged when a new template is loaded. Defaults to false.
   */
  loadTemplateAndFormFields(
    templateName: string,
    mergeTemplates?: iMergeTemplate[] | null,
    formFields?: iFormFieldNameValue[] | null,
    snippetPriceCategoryLabels?: string[] | null,
    formFieldProperties?: iFormFieldProperty[] | null,
    clearExchangeCaches?: boolean): Promise<void>


  /**
   * Centers the current spread in the printess view container
   */
  centerSpreadInView(part?: "entire" | "left-page" | "right-page"): void

  /**
   * @deprecated
   */
  saveJson(): Promise<string>;
  /**
   * @deprecated
   */
  loadJson(saveToken: string): Promise<void>;


  /**
   * Returns "true" if template has unsaved changes
   */
  hasUnsavedChanges(): boolean


  /**
   * Saves current artwork
   * @returns `saveToken` which you can pass on `attachPrintess()` or `load()`
   */
  save(): Promise<string>;

  /**
   * Saves current artwork and returns the saveToken and a basket thumbnail url.
   * The thumbnail url creation could involve cost, as it is rendered server side.
   * Makes the checkout process faster.
   * @returns `saveToken` which you can pass on `attachPrintess()` or `load()`
   */
  saveAndGenerateBasketThumbnailUrl(maxWidth?: number, maxHeight?: number): Promise<{ saveToken: string, basketUrl?: string }>;

  /**
   * Saves current artwork to the shop
   * @param savedShopData relevant shop data for saving artwork
   */
  saveTemplateToShop(savedShopData: ISavedShopData): Promise<void>;

  /**
   * Loads template or previously saved buyer artwork (`saveToken`)
   * @param templateNameOrSaveToken a templateName or a `saveToken` you have received from basket- or back-callback or from `save()` call
   */
  load(templateNameOrSaveToken: string, mode?: "auto" | "loadAlwaysFromServer"): Promise<void>;


  /**
   * Expects a apreviously saved buyer artwork identified by a saveToken and ensures that this work will never be deleted from DB
   * @param saveToken
   */
  unexpireJson(saveToken: string): Promise<void>;


  /**
   * Should be called before redirecting to a new template.
   * Will save the current state to the browser storage and apply it automatically to the next loaded template
   * Applies Frame and Document`exchange-ids` as well as template-wide form fields
   * @param frames (default true) add frame exchange-ids (image, text, story)
   * @param documents (default true) add documents with exchange-ids
   * @param formFields  (default true) add all user-defined from fields on template level
   */
  persistExchangeState(frames?: boolean, documents?: boolean, formFields?: boolean): Promise<void>


  /**
   * Method to merge the current document content on another document of the current template
   * @param targetDocId The id of the document to merge on
   * @param frames Which frames should be merged, default to "snippets" which means all frames placed as layout- or sticker-snippet. "all" will delete all frames in the target document before copying over the new frames.
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
   * Returns the shop login callback you have set in `attachPrintess()`
   */
  getShopLoginCallback(): null | ((type: "register" | "login", saveToken: string, thumbnailUrl: string, displayName: string) => void);

  /**
    * Returns the `loadTemplateButtonCallback` you have set in `attachPrintess()`
    */
  getLoadTemplateButtonCallback(): null | (() => void);

  /**
   * Returns the Designer Side Aspect Control
   */
  getAspectControl(): HTMLElement | ""

  /**
   * For a11y, select next possible frame (on tab key)
   */
  selectNextFrame(): boolean

  /**
   * For a11y, select prev possible frame (on shift+tab key)
   */
  selectPrevFrame(): boolean

  /**
   * For a11y, select any possible frame when printess-component receives focus()
   */
  selectFirstBuyerBoxOnFocus(): boolean

  /**
   * For a11y, rotate selected frame clockwise or counter clockwise
   */
  rotateSelection(counterClockwise: boolean): boolean

  /**
   * For a11y, rotate selected frame clockwise or counter clockwise
   */
  resizeSelection(dimension: "height" | "width", mode: "grow" | "shrink"): boolean

  /**
   * For a11y, mirror selected frame vertically or horizontally
   */
  mirrorSelection(axis: "x" | "y"): boolean

  /**
   * For a11y, edit selected frame inline, if possible
   */
  editSelection(): boolean

  /**
   * For a11y, move selected frame within layers, if possible. Moves all the way if "toEnd" is true; toEnd default: boolean
   */
  moveSelectionLayer(direction: "front" | "back", toEnd?: boolean): boolean

  /**
   * Returns true if the ui should show a "load" button.
   */
  showLoadButton(): boolean

  /**
   * Clears current printess frames selection and shows document-wide properties like form fields.
   */
  clearSelection(): Promise<void>;

  /**
   * Clears current printess frames selection only if active and does not re-center the spread
   */
  clearSelectionKeepZoom(): Promise<void>;

  /**
   * Forces selection change callback against buyer side ui
   */
  fireSelectionChangeCallback(forceInLegacyUi?: boolean): Promise<void>;

  /**
   * Deletes all selected frames which are allowed to be removed by the buyer
   */
  deleteSelectedFrames(): Promise<boolean>;

  /**
   * Select frame by propertyId. Fires a subsequent selection changed callback.
   */
  selectFrames(propertyId: string): Promise<void>;

  /**
   * Select frames by class name. Fires a subsequent selection changed callback.
   */
  selectFramesByClass(className: string): Promise<void>;

  /**
   * Assign a specified image to frames. The image is selected by id. You can specify the search scope where to look for frames.
  * @param imageId The id of the image you want to assign.
  * @param className The class name to search for in frames.
  * @param searchScope The scope to search frames in.
  * "spread" only looks for matching frames on the currently visible spread.
  * "document" only looks for matching frames on the currently visible document.
  * "template" looks for matching frames in the whole template.
   */
  assingImageByIdToFramesWithClass(imageId: string, className: string, searchScope: "spread" | "document" | "template"): Promise<void>;

  /**
   * Returns first iExternalImage found for class name
   * @param className
   */
  getImageNameByClassName(className: string): iExternalImage & { placement: "fit" | "fill" } | null

  /**
   * Looks up image by name - case insensitive
   */
  getImageByName(name: string): iExternalImage | null

  /**
   * Gets the geometry of the current selected frame or frame-group
   * Return null of no frame is selected
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
   * Sample code moves the frame 50px to the right:
   * ```
  const pos = api.getSelectionPosition();
  pos.left += 50;
  await api.transformSelection(pos);
   * ```
   */
  transformSelection(position: {
    left?: number,
    top?: number,
    width?: number,
    height?: number,
    anchorX?: "left" | "center" | "right",
    anchorY?: "top" | "middle" | "bottom",
    rotation?: number,
    rotationPositionX?: number,
    rotationPositionY?: number,
  }): Promise<void>

  /**
   * A single frame with "name" will be positioned depending
   * on the px position values you provide. (Just specify only the values you want to modify)
   */
  transformFrame(o: {
    name: string,
    left?: number,
    top?: number,
    width?: number,
    height?: number,
    anchorX?: "left" | "center" | "right",
    anchorY?: "top" | "middle" | "bottom",
    rotation?: number,
    rotationPositionX?: number,
    rotationPositionY?: number,
  }): Promise<void>

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

  /**
   * For off-canvas displays of to many frame properties. Determines if the property is suitable to be displayed off canvas.
   * @param p the property to look for
   */
  isOffCanvasProperty(p: iExternalProperty): boolean

  /**
   * Indicates if curent selected image can swap
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
   * Indicates if a selected image frame can be splitted in certain directions
   */
  hasScissorMenu(): "never" | "horizontical" | "vertical" | "both"

  /**
   * Indicates if a splitter cell is selected
   */
  hasSplitterMenu(): boolean

  /**
   * Indicates if a splitter cell is selected
   */
  hasSplitterTextSnippets(): boolean

  /**
   * number of active splitter edges
   */
  splitterEdgesCount(): number

  /**
   * Indicate if the template has static image filters to diplay, like AI-enhancement for example
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
   */
  splitFrame(direction: "horizontal" | "vertical"): Promise<void>

  /**
   * Selects all frames which are marked as **background**
   */
  selectBackground(): Promise<void>;

  /**
   * Indicates if the current spread has editable background frames -> OLD version returns false for backgroundTab feature
   */
  hasBackground(): boolean

  /**
   * Indicates if the current spread background layouts
   */
  hasBackgroundLayoutsTab(): boolean

  /**
   * Indicates if the current spread background layouts
   */
  loadBackgroundLayouts(): Promise<iExternalSnippet[]>

  /**
   * Returns all background Frame Color Properties
   */
  getBackgroundColorProperties(): iExternalProperty[]

  /**
   * Indicates if background frames are selected
   */
  isBackgroundSelected(): boolean

  /**
   * Selects a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part`parameter.
   * @param spreadIndex zero-based
   * @param part  "entire" | "left-page" | "right-page"
   */
  selectSpread(spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * Selects a document and a spread and brings it into view. spread-index is zero based and even a facing page counts as a single spread. You can pass the focus area in the `part`parameter.
   * @param docId ID of document to select
   * @param spreadIndex zero-based
   * @param part  "entire" | "left-page" | "right-page"
   */
  selectDocumentAndSpread(docId: string, spreadIndex: number, part?: "entire" | "left-page" | "right-page"): Promise<void>;

  /**
   * Retrieves current documen id, returns empty string if doc is not yet loaded.
   */
  getCurrentDocumentId(): string

  /**
   * Moves Printess focus to next page if available. Focus on single pages not spreads.
   */
  nextPage(): Promise<void>;

  /**
   * Moves Printess focus to previous page if available. Focus on single pages not spreads.
   */
  previousPage(): Promise<void>;

  /**
   * Retrieves information about the currently selected page.
   * Returns natural page-number (current) staring from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents.
   * Async version waits for Printess to be fully loaded.
   */
  pageInfo(): Promise<{ current: number, max: number, isFirst: boolean, isLast: boolean, spreadId: string }>


  /**
   * Retrieves information about the currently selected page.
   * Returns natural page-number (current) staring from 1 (not spread-index), page-count (max) and flags if the current page isFirst or isLast page of the current document
   * First and last pages are identical to the spread in facing page documents.
   * Sync version returns dummy data if Printess is not fully loaded.
   */
  pageInfoSync(includeDocs?: boolean): { current: number, multiDoc: boolean, max: number, isFirst: boolean, isLast: boolean, spreadId: string, part: "left-page" | "right-page" | "entire", docId: string }

  /**
   * Returns information about all spreads of the displayed document
   */
  getAllSpreads(): Array<iExternalSpreadInfo>;

  /**
   * Returns the current documents aspect
   */
  getDocumentAspect(): "landscape" | "portrait"

  /**
   * Returns the current document size in pixel
   */
  getDocumentSize(): { width: number, height: number } | null

  /**
   * Returns the current spread size including placement rect in pixel
   */
  getCurrentSpreadSize(): { width: number, height: number } | null

  /**
   * Returns information about all spreads of ALL buyer-editable documents
   */
  getAllDocsAndSpreads(): Array<iExternalDocAndSpreadInfo>;

  /**
   * Returns total number of spreads (not pages)
   */
  spreadCount(): number

  /**
   * On IOS returns if iphone has its keyboard expanded.
   * This can never be 100% accurate.
   */
  isSoftwareKeyBoardExpanded(): boolean

  /**
   * Returns true is the user has made edits on a spread.
   * @param spreadIdOrIndex: ID or Index of Spread to check for - if empty it checks for current spread
   */
  hasBuyerContentEdits(spreadIdOrIndex?: string | number, documentName?: string): boolean

  /**
   * Returns on what side of the spread the user has content edits
   * @param spreadId: ID of Spread to check for edits
   * @param documentName The default value is ""
   */
  hasBuyerContentEditsLeftRight(spreadIdOrIndex?: string | number, documentName?: string): { onLeftPage: boolean, onRightPage: boolean, onEntirePage: boolean }


  /**
   * Returns only false if property refers to a formfield which is not visible, because it doesn' match a specific condition.
   * @param propertyId ID of property to check
   */
  isPropertyVisible(propertyId: string, wasVisibleBefore?: boolean): boolean

  /**
   * Returns all available properties in teh current document
   */
  getAllProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
   * Returns the name of a form field if property-id points to an existing form field
   * @param properyId External Property ID
   */
  getFormFieldNameByExternalPropertyId(properyId: string): string | null

  /**
   * Runs a form field script, property-id must point to form field.
   */
  executeFormFieldScript(propertyId: string): Promise<void>

  /**
   * Returns a list of all available properties on a specific spread
   * @param spreadId
   */
  getAllPropertiesBySpreadId(spreadId: string): Promise<Array<Array<iExternalProperty>>>;


  /**
  * Returns a list of all required properties (async)
  * @param spreadId
  */
  getAllRequiredProperties(): Promise<Array<Array<iExternalProperty>>>;

  /**
    * Returns a list of all required properties (sync)
    * @param spreadId
    */
  getAllRequiredPropertiesSync(): Array<Array<iExternalProperty>>;

  /* returns if buyer ui shows sub document */
  showDocumentBackButton(): boolean

  /** jumps back to last editable doc if in permanent group editing  */
  selectLastDocument(): Promise<void>

  /** get if mobile image crop mode is enabled and should show the circular image pan-icon */
  getMobileImageCropModeEnabled(): boolean

  /** toggle mobile image crop mode */
  toggleMobileImageCropModeEnabled(): boolean

  /**
  * Returns a list of all required properties on a specific spread (async)
  * @param spreadId
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
   */
  cropImage(propertyId: string, box: { left: number, top: number, width: number, height: number }): Promise<iExternalImage | null>

  /**
   * Returns if a iMobileUIButton should display text instead of an icon
   */
  isTextButton(m: iMobileUIButton): boolean


  /**
   * Returns if property is a form field of type font
   * @param propertyId
   */
  isFontFormField(propertyId: string): Promise<boolean>;


  /**
   * Sets the value of any top-level property passed to the external UI
   * @param propertyId
   * @param propertyValue Must be string and will be converted if neccessary
   */
  setProperty(propertyId: string, propertyValue: string | number | iStoryContent): Promise<void | (iExternalImageScaleHints & { scale: number })>; // | Array<iExternalColorUpdate>>;

  /**
   * Sets a background color property by index
   */
  setBackgroundColor(colorIndex: number, propertyValue: string, mode: "page" | "all"): Promise<void>

  /**
   * Sets a list of paragraph texts at once.
   * @param propertyId
   * @param paragraphs list of paragraph values
   */
  setStoryParagraphs(propertyId: string, paragraphs: Array<{ index: number, newValue: string }>): Promise<void>

  /**
   * Sets the value of a form field
   * @param fieldName Name of the Form-Field or Form-Field Property-ID. If `name` is not found, Printess will try to find the Form-Field by its `label`. This fallback scenario is helpfull for shop integrations where the shop has no way to map labels to name.
   * @param newValue Must be string and will be converted if neccessary
   */
  setFormFieldValue(fieldName: string, newValue: string): Promise<void>;


  /**
   * Forces re-rendering of current document
   */
  reRender(): Promise<void>

  /**
   * Same like in the attach parameter, allows e.g. to modify list values in response to a user interaction.
   * @param formFieldProperties List of FormField-Names (key) and their respective properties to change
   */
  setFormFieldProperties(formFieldProperties?: iFormFieldProperty[]): Promise<void>

  /**
   * Allows to set the disabled flag for certain items in a form field list.
   * @param ffName FF-Name to address
   * @param states List of value/disabled pairs
   */
  setFormFieldListDisabledStates(ffName: string, states: Array<{ value: string, disabled: boolean }>): Promise<void>

  /**
   * Sets the number of inside pages of a book
   * @param bookInsidePages the number of pages the book should have. Must be >= 4.
   */
  setBookInsidePages(bookInsidePages: number): Promise<void>

  /**
   * Sets the spine width, could be any Length value, like an equation or a fixed value with unit.
   * @param formular like `=spine.pages * 0.3mm` or just `2cm`
   */
  setSpineFormular(formular: string): Promise<void>

  /**
   * Sets the all spine related values.
   */
  adjustBook(spine: iExternalBookSettings): Promise<void>

  /**
   * updates a specific cell of a form field of type "table"
   * Any then all other updates,
   * this will NOT trigger a selection change event on buyer side
   */
  setTableCell(fieldNameOrId: string, rowIndex: number, col: iExternalTableColumn, value: string | number | boolean): Promise<iExternalError | null>

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
  addTableRowExt(fieldNameOrId: string, type: string): { index: number | null; row: Record<string, any> | null }

  /**
   * Tells if user is allowed to paste JSON data to a table form field.
   */
  canPasteTableRowsJSON(propertyId: string): boolean

  /**
   * Tells if user is allowed to ignore low image resoution warnings
   */
  canIgnoreLowImageResolution(): boolean

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
  addTableRowsExt(fieldNameOrId: string, type: string, ffLibName: string, libIndizies: Array<number>): { index: number | null, table: Array<Record<string, any>> | null }

  /**
   * Sets the size of a specific document
   * @param documentName Name of the document to change
   * @param widthInDocUnit 12 equals e.g. "12cm"
   * @param heightInDocUnit 12 equals e.g. "12cm"
   */
  setDocumentSize(documentName: string, widthInDocUnit: number, heightInDocUnit: number): Promise<void>

  /**
   * removes image for rich-text-frames which have a handwriting image set
   * Sets back to text
   */
  removeHandwritingImage(): Promise<boolean>;

  /**
   * Indicates if form fields are available
   */
  hasFormFields(): boolean

  /**
   * Retrieves all Form Fields for UI rendering
   * @param tabId optional to get FFs for certain tab only
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
  * Indicates if cur spread has editable text or images with properties suitable for the frame bar
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

  /**
   * Returns group type as string for table form fields
   */
  getTableGroupType(): string

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
  setTextStyleProperty(propertyId: string, name: "font" | "lineHeight" | "color" | "size" | "hAlign" | "vAlign" | "pStyle" | "baselineScript", value: string, textStyleMode?: textStyleModeEnum): Promise<string>;

  /**
   * Method to set an image meta-property
   * Set the image itself via `setProperty()`
   * @param propertyId
   * @param name
   * @param value
   */
  setImageMetaProperty(propertyId: string, name: "scale" | "sepia" | "brightness" | "saturate" | "invert" | "contrast" | "grayscale" | "vivid" | "hueRotate", value: string | number): Promise<void>;

  /**
   * Resets all image filters (meta-values) of an image-property to default
   * @param propertyId
   * @param imageMeta optional parameter, can be used to set all image-filters to specific values.
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


  /** indicates single photo print order mode */
  isSinglePhotoMode(): boolean

  /** Set per-doc single photo counter */
  setSinglePhotoCount(docId: string, count: number): Promise<void>

  /** Get per-doc single photo counter */
  getSinglePhotoCount(docId: string): number

  /**
   * Uploads one or many images to Printess and auto assigns the first image if an image frame is selected
   * If no frame is selected it distributes to the next possible frame or
   * automatically distributes all images depending on the template settings
   * @param files
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id.
   * @param progressCallback
   * @param isHandwritingImage Toggle the current textframe to handwriting mode und assigns image
   */
  uploadAndDistributeImages(files: FileList | null, propertyId: string, progressCallback?: (percent: number, state: "upload" | "optimization") => void, isHandwritingImage?: boolean): Promise<iExternalImage[]>;

  /**
   * Uploads one or many images to Printess and can auto assign the first image
   * @deprecated Its deprecated, because buyer side never create frames on image upload. Just via stickers, use uploadAndDistributeImages() instead
   * @param files
   * @param progressCallback
   * @param assignToFrameOrNewFrame Auto assigns the first image to the current slection or a specific frame
   * @param propertyId Auto assigns the first image to a specific frame identified via property Id.
   */
  uploadImages(files: FileList | null, progressCallback?: (percent: number, state?: "upload" | "optimization") => void, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage[]>;


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
   */
  assignImageToNextPossibleFrame(imgId: string, origin?: "upload" | "thumb-click"): Promise<boolean>

  /**
   * Assigns image found by name to single selected frame only.
   */
  assingImageByNameToSelection(imageName: string, options: null | { placement?: "fit" | "fill", horizontalFocalPoint?: number, verticalFocalPoint?: number, onlyAssignToAllowedImages?: boolean }): Promise<boolean>

  /**
   * Will use current selection or insert a new frame on the spread.
   * @param imageId Existing image-id to assign
   */
  assignImageToSelectionOrInsertAsNewFrame(imgId: string): Promise<void>

  /**
   * Will insert a new image frame on the current spread as a sticker;
   * Returns false if image was not found.
   * @param imageId Existing image-id to assign
   */
  insertImageFrame(imageId: string): Promise<boolean>

  /**
   * transfers to uploaded images from one image frame to another.
   * Also applies assign-actions if applicable
   * @param fromBoxName Name of from frame
   * @param toBoxName Name of to frame
   */
  transferImageByFrameName(fromBoxName: string, toBoxName: string, options?: { placement: "fit" | "fill", horizontalFocalPoint: number, verticalFocalPoint: number }): Promise<boolean>

  /**
   * Returns if the magic photobook wizzard flag is enabled
   */
  isMagicPhotobook(): boolean

  /**
   * Returns headline to display in wizard.
   */
  getMagicPhotobookWizardHeadline(): string;

  /**
   * Returns tab displayed in magic photobook settings
   */
  getMagicPhotobookSettingsTab(): "NONE" | "#FORMFIELDS" | "#FORMFIELDS1" | "#FORMFIELDS2"

  /**
   * Select new photobook theme
   * @param name Name of photobook theme
   */
  selectPhotobookTheme(name: string): Promise<iPhotobookTheme>

  /**
   * Retrieves id of current photobook theme keyword menu
   */
  getPhotobookThemeMenuId(): string  /**

  /**
   * Retrieves name of current photobook theme
   */
  getSelectedPhotobookThemeName(): string  /**

  /**
   * Retrieves current photobook theme object
   */
  getSelectedPhotobookTheme(): Promise<iPhotobookTheme>

  /**
   * Load all available photobook themes
   */
  loadPhotobookThemeList(): Promise<iPhotobookThemeListEntryDto[]>

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
   */
  canScale(propertyId: string): boolean;

  /**
   * Rotates an image by 90deg and saves the result as new image and assigns rotated image to frame automatically.
   * @param propertyId
   * @param angle
   */
  rotateImage(propertyId: string, angle: "0" | "90" | "180" | "270", crop?: { ws: number, hs: number, px: number, py: number }): Promise<iExternalImage | null>;

  /**
   * Rotates image with any given angle.
   * @param propertyId
   * @param rotation
   */
  rotateAndCropImage(propertyId: string, rotation: iExternalImageRotation): Promise<iExternalImage | null>

  /**
  * Imports a single image to Printess and can auto assign this image
  * @param url The url to the image you want to import to Printess.
  * @param assignToFrameOrNewFrame Assign this image to the current frame, or create a new frame in case none is selected.
  * @param propertyId (optional) if a propertyId is submitted, printess will assign the image to that particular frame
  */
  importImageFromUrl(url: string, assignToFrameOrNewFrame?: boolean, propertyId?: string): Promise<iExternalImage | null>;

  getSerializedImage(imageId: string): string | null;
  addSerializedImage(imageJson: string, assignToFrameOrNewFrame?: boolean): Promise<iExternalImage>;

  /**
   * Imports up to 50 previously uploaded user images. You can either provide the shopUserId and basketId to load images uploaded in this basket session,
   * or only provide the shopUserId to load the images from the user.
   * Please make sure you are using non guessable shop user and basket ids.
   */
  importUserUploadedImages(shopUserId?: string, basketId?: string): Promise<iExternalImage[]>;

  /**
   * @param assignToFrameOrNewFrame The default value is false
   */
  importImagesFromExternal(images: iImage[], assignToFrameOrNewFrame?: boolean): Promise<iExternalImage[]>;

  /**
   * Tells to render a new image after cropping even with no rotation
   */
  alwaysRenderCroppedImage(): boolean


  /**
   * Returns not null if buyer should be able to use generative ai image creation
   */
  showText2Image(): null | { selectStyle: boolean, prompt: string, defaultPrompt: string, style: SdxlStyle | null, negativePrompt: string, model: string, allowUpload: boolean }

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
  createImageEdit(propertyId: string, prompt: string, quality?: "low" | "medium" | "high", images?: string[], imageInfo?: { boxId: string | undefined, aspect: number, parentBoxId?: string }, model?: string,): Promise<boolean>

  /**
   * Sets image placement based on selection, can only handle a single selected image for now.
   * TODO: Support for propertyId will follow
   */
  setImagePlacement(which: "fit" | "fill" | "face" | "group", propertyId?: string): Promise<void | (iExternalImageScaleHints & { scale: number })>


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
   * Returns if buyer is allowed to upload pdf files
   */
  allowPdfUpload(): boolean;

  /**
   * Returns if buyer is allowed to upload svg files
   */
  allowSvgUpload(): boolean;

  /**
   * Returns if buyer is only allowed to upload vector (svg) files
   */
  allowOnlyVectorImageUpload(): boolean;

  /**
   * automatically distribute all non used uploaded images to frames which have not been assigned yet.
   * Returns a list of all applied image-ids.
   * Force needs to be true if "manual" distribution is active
   */
  distributeImages(force?: boolean): Promise<Array<string>>

  /**
   * check number of distributable image boxes
   * if greater than 1 return true
   */
  allowImageDistribution(): boolean

  /**
   * Tells UI to always show image distribution button.
   */
  showImageDistributionButton(): boolean

  /**
   * current image distribution mode set on template level
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
   * Cut out face of currently selected images
   * @param propertyId The selected property-id
   */
  removeBackgroundFace(propertyId: string): Promise<boolean>

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
   */
  currentSelectionAllowsImageUpload(): boolean

  /**
   * Tells UI to resize an image in the "My Photos" tab to fit within the bounds of its container with no cropping ("fit")
   * or to expand an image to fill the whole container potentially with cropping ("fill")
   */
  getImageThumbFitProperty(): "fill" | "fit"

  /**
   * Tells UI to show the image preview when hovering image thumbnail.
   */
  showImagePreviewOverlay(): boolean

  /**
   * Tells UI to show the image name under every image thumbnail.
   */
  showImageCaptions(): boolean

  /**
   * Tells UI to display upload button for image upload from mobile phone.
   */
  showMobileUploadButton(): boolean

  /**
   * Tells UI to display download button on image thumbnail.
   */
  allowImageDownload(): boolean

  /**
   * get a QR Code for uploading images on mobile phone
   */
  createExternalImageUploadChannel(): Promise<{ qr: HTMLImageElement, channelId: string }>

  /**
   * check for images uploaded from phone
   * @param channeldId
   */
  startExternalImagePolling(channeldId: string, isHandwriting?: boolean, cancellationToken?: StoppingToken): void

  /**
   * delete buyer uploaded images that are not in use
   * Returns the number of successfully deleted images.
   * @param images array of images to be deleted
   */
  deleteImages(images: Array<iExternalImage>): number

  /**
   * If property is empty it returns the list of buyer uploaded images.
   * @param propertyId id of property which shows the image list
   */
  getImages(propertyId?: string): Array<iExternalImage>

  /**
   * Returns all buyer uploaded images including information if the image is in use
   */
  getAllImages(): Array<iExternalImage>

  /**
   * Returns all available image groups
   * @param propertyId id of property which shows the image list
   */
  getImageGroups(propertyId?: string): Array<string>

  /**
   * Returns image-count in "Buyer Upload" folder.
   */
  getUploadedImagesCount(): number

  /**
   * When using direct upload, this will return the count of outstanding image uploads.
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
   */
  isImageInUse(imageId: string): boolean

  /**
   * Returns extended information about image and its frame
   */
  getImageFrameInfos(propertyId: string): iExternalImageFrameInfos

  /**
   * Returns image name by js-name of frame.
   */
  getImageName(jsName: string): string | null

  /**
   * Retrieves a list of available font-sizes in point
   */
  getFontSizesInPt(): Array<number>

  /**
   * Retrieves a list of available font-sizes in point
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
   */
  getFonts(propertyId: string): Array<{
    name: string;
    thumbUrl: string;
    displayName: string;
    familyName: string;
    weight: number;
    isItalic: boolean;
  }>;

  /**
   * Returns a list of available colors for a certain selected property (frame).
   * @param propertyId Id of property to filter available color per frame
   * @param bgColorIndex if passed a number here, it returns the background color properties without a selection.
   */
  getColors(propertyId: string, bgColorIndex?: number): Array<{
    name: string;
    color: string;
  }>;

  /**
   * Return color schemes if available as external property
   */
  getColorSchemes(): iExternalProperty | null

  /**
   * Return primary display color from a color scheme (if available) as hex color
   */
  getColorByColorScheme(schemeName: string): string | null

  /**
   * Wether UI should show color schemes for layout snippets
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
  showColorDialog(p: iExternalProperty): Promise<iExternalColor | null>

  getColorInfo(p: iExternalProperty): iExternalColor | null

  /**
   * Returns a list of available paragraph-style for a certain selected property (frame).
   * @param propertyId Id of property to filter available styles per frame
   */
  getParagraphStyles(propertyId: string): Array<{
    class: string,
    css: string
  }>;

  /**
   * Returns hex color from rgb value
   * @param color rgb color value
   */
  getHexColor(color: string): string

  /**
   * Returns black or white hex depending on color value
   */
  invertColor(hex: string, bw: boolean): string

  /**
   * Retrieves a SVG icon from printess
   * @param icon
   */
  getIcon(icon: iconName, width?: number, height?: number): SVGElement

  /**
   * Retrieves a SVG icon as plain string from printess
   */
  getIconAsString(icon: iconName): string

  /**
   * Retrieves all available icon-names
   */
  getAllIconNames(): iconName[]

  /**
   * Sets attach-parameter icons later in the game
   */
  setCustomIcons(icons: Partial<Record<iconName, string>>, addToExisting: boolean)

  /**
  * Sets attach-parameter scripts later in the game
  */
  setCustomScripts(scripts: Partial<Record<string, string>>, addToExisting: boolean)

  /**
   * Returns true if printess has full Designer edit rights and is not running in Shop-Mode
   */
  isInDesignerMode(): boolean;

  /**
   * Focus single or multi line editor when active
   */
  focusActiveTextEditor(): boolean

  /**
   * Shifts the entire printess view up and down in pixels.
   */
  setExternalTopOffset(value: number)

  /**
   * Trigger a resize and fit of the current page, can focus the selection alternatively.
   * @param immediate Optional: Determines if resize should wait for a second or happens immediatly
   * @param focusSelection Optional: Will zoom to current selection
   * @param width Optional: Overrides the retrieved offsetWidth of the printess container - helpfull when animation are longer running
   * @param height Optional: Overrides the retrieved offsetHeight of the printess container - helpfull when animation are longer running
   */
  resizePrintess(immediate?: boolean, focusSelection?: boolean, width?: number, height?: number, focusFormFieldId?: string): void;


  /**
   * @param alwaysCenterSpread The default value is false
   */
  resizePrintessExact(immediate: boolean, focusSelection: boolean, size: iRect, focusFormFieldId?: string, alwaysCenterSpread?: boolean): Promise<void>

  getTemplateTitle(): string;
  getTemplateName(): string;

  /**
   * Get the link required for displaying an info icon that opens a product info overlay / dialog
   */
  getProductInfoUrl(): string;

  /**
   * Returns true if the snippet has been lastly applied on the current document
   */
  isLastAppliedLayout(snippetUrl: string): boolean


  /** Returns global debug flag */
  debug(): boolean


  /**
   * Returns all images placed on the current spread
   */
  getImagesFromCurrentSpread(excludeSelectedFrames: boolean, skipDefaultImages: boolean, onlyFramesWithLayoutOrigin: boolean): iExternalImage[]


  /**
   * Selects the best layout snippet for all currently loaded images.
   */
  insertLayoutAndAssignImages(images: iExternalImage[], splitVariantId?: string | null);

  /**
   * Returns the maximum number of images in a single collage
   */
  getMaxCollageImages(): number

  /**
   * Returns a selection of all mathing collage layouts
   * @param images images to distribute
   */
  getMatchingCollageLayouts(images: iExternalImage[]): Promise<iExternalCollageLayout[]>;

  /**
   * Checks whether the user has made any edits (only checks for added text frames for now) to the current spread that would be discarded by applying a new layout.
   * @returns An array of all content types that would be discarded on layout application.
   */
  getDiscardedContentOnLayoutAppliation(): Promise<Array<string>>

  /**
   * Returns the layout snippet template and doc name for the current spread
   */
  getLastAppliedLayoutInfo(): { snippetTemplateName: string, snippetDocName: string, snippetDocId: string, splitVariantId?: string | null } | null


  /**
   * Insert a Layout-Snippet on the current spread of the current document
   * @param snippetUrl The Url of the snippet
   * @param targetPage optional, forces layout-snippets to left or right side if aspect ratio of snippet matches dimensions a single page of a double page spread
   * @param hideRemoveBorderOption optional, Default value is false
   */
  insertLayoutSnippet(snippetUrl: string, targetPage?: "left" | "right" | "entire", spread?: any, colorScheme?: string, hideRemoveBorderOption?: boolean, splitVariant?: number, forceRepeat?: ForceSnippetPlacement, layoutImageSelection?: "apply" | "skip"): Promise<void>;

  /**
   * returns if a selected sticker could replace the current selection
   */
  stickerCanReplaceFrame(): boolean

  /**
   * Insert a Sticker (Group-Snippet) on the current spread of the current document
   * @param snippetUrl The Url of the snippet
   * @param autoAssignToSelectionIfPossible The default value is false
   */
  insertGroupSnippet(snippetUrl: string, targetSplitterBoxId?: string, autoAssignToSelectionIfPossible?: boolean): Promise<void>;

  /**
   * Load a list of layout snippets which can be used during photo-book spread insertion
   */
  getInsertSpreadSnippets(): Promise<Array<iExternalSnippet>>


  /**
   * Get a list of all splitter-content-snippets
   */
  getSplitterSnippets(): Promise<Array<iExternalSnippet>>

  /**
   * If the current selection should show photo-frame-styles (PanelUI only)
   */
  hasPhotoFrameSnippets(): boolean

  /**
   * Get a list of all photo-frame-snippets
   */
  getPhotoFrameSnippets(): Promise<{ topics: Array<iSnippetMenuTopic>, snippets: Array<iExternalSnippet> }>

  /**
   * If the current selection should show text-frame-styles (PanelUI only)
   */
  hasTextFrameSnippets(): boolean

  /**
   * Get a list of all text-frame-snippets
   */
  getTextFrameSnippets(): Promise<{ topics: Array<iSnippetMenuTopic>, snippets: Array<iExternalSnippet> }>

  /**
   * Replaces current splitter-cell with splitter-snippet content
   */
  applySplitterCellSnippet(splitterSnippetUrl: string): Promise<void>

  /**
   * Replaces current splitter-cell with splitter-snippet content
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
   */
  insertTemplateAsLayoutSnippet(templateName: string, templateVersion: "draft" | "published", documentName: string, mode: "layout" | "group"): Promise<void>


  /**
   * Saves and publishes the template.
   * @param name The name you want to save the template under.
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
   * @deprecated
   * Returns if buyer ui should display the page navigation
   */
  showPageNavigation(): boolean;

  /**
   * Returns if buyer ui should display the page navigation as icons for all docs or just numbers for current doc
   */
  pageNavigationDisplay(): "hide" | "numbers" | "icons" | "doc-tabs";

  /**
   * Ignore enitere page click, and alway zoom to single page
   */
  forceZoomToSinglePageOnMobile(): boolean
  /**
   * Returns if buyer ui should display the search bar for searching through images
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
   */
  showUndoRedo(): boolean

  /**
   * Executes an undo step if available.
   */
  undo(): void;

  /**
   * Executes an redo step if available.
   */
  redo(): void;

  /**
   * Returns number of available undo steps
   */
  undoCount(): number

  /**
   * Returns number of available redo steps
   */
  redoCount(): number

  /**
   * return if zoom options should be displayed
   */
  allowZoomOptions(): boolean

  /**
   * Zoom in on spread visible
   */
  zoomIn(): void

  /**
   * Zoom out of spread visible
   */
  zoomOut(): void

  /**
   * Returns all important informations to create a dynamic photobook
   */
  getDocInfoForPhotobook(): iExternalPhotobookDocInfo | null

  /**
   * Check for double page spreads to show/hide zoom to spread option
   */
  isDoublePageSpread(): boolean

  /**
   * returns last applied collage varient index for current spread
   */
  currentSpreadSplitVariantId(): string | null

  /**
   * Returns if the number of spreads fits the requirements set in the template
   * @param spreadSize current number of spreads
   */
  isNoOfPagesValid(spreadSize: number): boolean

  /**
   * Return if buyer can change the spread order
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
   *  {
   *    id: "PZE4tKlZmD9Mx9gZ0OIfx" // existing spread
   *  },
   *  {
   *    id: "newSpread",
   *    snippetUrl: "
  https://printess-prod.s3.eu-central-1.amazonaws.com/uploads/snippet/fc8b773be98ee6d58ffebd9d955a55252ddc9a0a/json/764f973bb7d9a0ae9691c3d62cf941baac6cd13e/91b02c876e345bdc8efe5d4582519a85dfc3726d.json?DOC=PCepmgRyO8E3vz0f7rXlh&ID=40be80b32d36fd85d3127f7258ead6b1dbcb8458"
      },
      {
        id: "PRE4tKlZmD4jj9gZ0OIfx" // existing spread
      }
   * ])
   * ```
   *
   * Handle with care, this can destroy your Book-Inside-Pages document
   * @param newSpreadIds Array of spread id or "newSpread" and optional snippetUrls for all "newSpreads" in correct order
   */
  reArrangeSpreads(newSpreadIds: Array<{ id: string | "newSpread", snippetUrl?: string }>, updateBackground?: boolean): Promise<boolean>

  /**
   * Returns how many spreads would be added before the back cover if `addSpreads()`is called.
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * @param spreadSize Optional: number of current spreads (used in arrange pages dialog where actual number of spreads is not yet applied)
   */
  canAddSpreads(spreadSize?: number): 0 | 1 | 2

  /**
   * Photo-Book only feature:
   * Add new spreads / pages to the current document before the back cover
   * The amount depends on the settings in the template. Template needs to be marked as `book`
  */
  addSpreads(): Promise<boolean>

  /**
   * Returns how many spreads would be removed before cover  `removeSpreads()`is called.
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   * @param spreadSize Optional: number of current spreads (used in arrange pages dialog where actual number of spreads is not yet applied)
   */
  canRemoveSpreads(spraedSize?: number): 0 | 1 | 2

  /**
   * Photo-Book only feature:
   * Remove spreads / pages from the current document before the back cover
   * The amount depends on the settings in the template. Template needs to be marked as `book`
   */
  removeSpreads(): Promise<boolean>

  /**
  * Photo-Book only feature:
  * Remove just the single current selected spread from photo-book doc.
  */
  removeCurrentSpread(): Promise<void>


  /**
   * Tells if user is allowed to duplicate the current spread
   */
  canDuplicateSpread(): boolean

  /**
   * Duplicates the currently selected spread
   */
  duplicateSpread(): Promise<boolean>

  /**
   * Gets the state of the "lockCoverInside" user setting in "book" mode
   * If set to true the the first and last page is hidden from the buyer and no photo is distributed on that pages
   * Helpful for certain layflat photobooks
   */
  lockCoverInside(): boolean

  /**
   *
   * @param fileName deprecated. Not used anymore.
   * @param documentName Optional: The name of the document you want to render the pages images for. If not provided the one marked as thumbnail will be taken, otherwise the preview document, or as last try the first/primary document.
   * @param maxWidth Optional: Maximum render width. Defaults to 400.
   * @param maxHeight Optional: Maximum render height. Defaults to 400.
   */
  renderFirstPageImage(fileName: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string>;


  /**
   * Renders all pages as images for the given document.
   *
   *
   * @param fileNameSuffix deprecated. Not used anymore.
   * @param documentName Optional: The name of the document you want to render the pages images for. If not provided the one marked as thumbnail will be taken, otherwise the preview document, or as last try the first/primary document.
   * @param maxWidth Optional: Maximum render width. Defaults to 400.
   * @param maxHeight Optional: Maximum render height. Defaults to 400.
   * @returns Array of urls to the images. They can be png with tranparency or jpg.
   */
  renderPageImages(fileNameSuffix: string, documentName?: string, maxWidth?: number, maxHeight?: number): Promise<string[]>;

  isMobile(): boolean;

  // check if device is iPhone or iPod
  isIPhone(): boolean;

  /**
   * Tells if printess has currently selected frames
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

  getStep(): iBuyerStep | null;
  /**
   * Indicates if the current step has become inactive, because the user has selected other frames
   * TRUE if the current step is part of the selection.
   */
  isCurrentStepActive(): boolean;

  /**
   * Returns step information
   * @param index
   */
  getStepByIndex(index: number): iBuyerStep | null

  /**
   * Indicates if the current template has buyer-steps
   */
  hasSteps(): boolean

  /**
   *
   * @param index Sets step by index
   * @param zoom
   */
  setStep(index: number, zoom?: "frame" | "spread"): Promise<void>

  /**
   * Retrieves last step
   */
  lastStep(): iBuyerStep | null;

  /**
   * Returns true if a next step is available
   */
  hasNextStep(): boolean;

  /**
   * Returns true if a previous step is availabel
   */
  hasPreviousStep(): boolean;

  /**
   * Returns true if a previous step is availabel
   */
  showFormFieldTabsAsSteps(): boolean;

  /**
   * Indicates if the next step is the preview document.
   */
  isNextStepPreview(): boolean;

  /**
   * Register Select Layout Dialog shown for current Spread
   */
  selectLayoutDialogHasBeenShownForCurrentSpread();

  /**
   * Return true if buyer can deselect an item on the current spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers
   * Important to keep buyer in the step-logic
   */
  buyerCanHaveEmptySelection(): boolean;

  /**
   * Returns true if buyer can select any frame  on the current spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers
   * Important to keep buyer in the step-logic
   */
  hasEditableFramesWithoutSteps(): boolean;

  /**
   * Returns true if buyer can select any frame on any document / spread.
   * Which means that either there are non-step frames to select or the spread can add new group-snippets/stickers
   */
  templateHasEditableFramesWithoutSteps(): boolean;

  /**
   * returns desired behaviour of basket button
   * In steps-mode basket button always points to the basket.
   * If no steps are present basket button should lead to the preview
   */
  getBasketButtonBehaviour(): "add-to-basket" | "go-to-preview"

  /**
   * Tells the ui if it should a `Back-Button`from preview to edit.
   * Its true if the current displayed document is a `preview` document
   */
  hasPreviewBackButton(): boolean


  /**
   * Jumps to the previous available preview document if there is one.
   */
  gotoPreviousPreviewDocument(zoomDuration?: number): Promise<void>

  /**
   * Jumps to the next available preview document if there is one.
   */
  gotoNextPreviewDocument(zoomDuration?: number): Promise<void>

  /**
   * Retrieves information if the device is mobile or the screen is so small that zoom to frames is needed
   */
  zoomToFrames(isMobile?: boolean): boolean

  /**
   * Tells if the entire spread is in view
   */
  isSpreadInView(part?: "entire" | "left-page" | "right-page"): "entire" | "left-page" | "right-page" | "none"

  /** Tells printess that a user interaction has changed the zoom, no automatic spread zoom will be executed after this */
  setUserHasZoomedFlag(newValue: boolean);

  /**
   * Tells printess the zoom mode to use for the next resize operation
   * `spread` zooms to the entire page
   * `frame`zooms to the selected frame(s)
   */
  setZoomMode(m: "spread" | "frame"): void

  /**
   * Retrieves the current zoomMode (see `setZoomMode()`)
   */
  getZoomMode(): "spread" | "frame"


  /**
   * Tells if the current selection can be moved around by the user
   */
  canMoveSelectedFrames(): boolean

  /**
   * Tells if parts of the current selection can be deleted
   */
  canDeleteSelectedFrames(): boolean

  /**
   * Tells if the current selection is part of a collage and accordingly influences the size of other images and own size when changing
   */
  canSplitSelectedFrames(): boolean

  /**
   * Change an image frame to a text snippet frame in a photo collage
   */
  convertSplitterCellToText(): Promise<void>

  /**
   * Change a text snippet frame to an image frame in a photo collage
   */
  convertSplitterCellToImage(): Promise<void>

  /**
   * Set the gap size of the photo grid
   * @param n gap size of the photo grid
   */
  setSplitterGaps(n: number): Promise<void>

  /**
   * Returns if splitter layout can add or remove gap
   */
  nextGapAction(): { gapAround: null | "add" | "remove", gap: number, setGap: null | "all" | "only>0" }

  /**
   * Returns if current spread has splitter frames
   */
  hasSplitters(): boolean

  /**
   * If splitter frames are present on current spread this method adds
   * a gap between all splitter-frames and the page border
   * Returns `true` if succesfull
   */
  addGapAround(): Promise<boolean>

  /**
   * If splitter frames are present on current spread this method removes
   * the gap between all splitter-frames and the page border
   *  * Returns `true` if succesfull
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
   */
  canOpenSelectedGroup(): boolean

  /**
   * Opens the selected sub doc (group)
   */
  openSelectedGroup(): Promise<void>

  /**
   * Goes to the next available step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   */
  nextStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns true if current doc is a 3D Preview
   */
  is3dPreviewSelected(): boolean

  /**
   * Goes to the previous step (if any)
   * @param zoom overrides the frames zoom settings for all devices
   */
  previousStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns the total amount of available preview-steps. 0 indicates no preview
   */
  previewStepsCount(): number;

  /**
   * Goes directly to the preview-step-index
   * @param previewIndex Zero based index of the preview steps. See also: previewStepsCount()
   * @param zoom overrides the frames zoom settings for all devices
   */
  gotoPreviewStep(previewIndex?: number, zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the first step, helpful if you want to exit the preview step.
   * @param zoom overrides the frames zoom settings for all devices
   */
  gotoFirstStep(zoom?: "frame" | "spread"): Promise<void>;

  /**
   * Returns to the last step, helpful if you want to skip steps.
   * @param zoom overrides the frames zoom settings for all devices
   * @param offset helps to get to the step before last step (offset = 1), default offset is 0
   */
  gotoLastStep(zoom?: "frame" | "spread", offset?: number): Promise<void>

  /**
   * Turns the display of step numbers on or off
   */
  displayStepNumbers(display: boolean): Promise<void>

  /**
   * Returns if step numbers are displayed
   */
  stepNumbersDisplayed(): boolean

  /**
   * Returns the template settings for display of steps header on desktop and mobile
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
   * @deprecated
   * Returns true if `autoScale` was set in `attachPrintess` call
   */
  autoScaleEnabled(): boolean

  /**
   * Retrieves information if the `auto-scale` option was enabled on `attachPrintess()`
   * Also returns the calculated pixel-dimension of printess container on desktop
   */
  autoScaleDetails(): { enabled: boolean, width: number, height: number }

  /**
   * Auto Zooms to current selection or spread
   * @param focusFormFieldId FF id to zoom to
   * @param forceZoom overwrites natural behaviour
   */
  centerSelection(focusFormFieldId?: string, forceZoom?: "spread" | "frame"): Promise<number>

  /**
   * Tells if ui should display a zoom-to-selection button
   * Only returns true if a significant zoom would happen
   * @param focusFormFieldId FF id to zoom to
   */
  hasZoomToSelectionButton(focusFormFieldId?: string): boolean

  /**
   *
   * @param uploadEndpoint The target address to send the upload form data to. E.g. https://your-bucket.s3.eu-central-1.amazonaws.com/
   * @param serveEndpoint The url the files are served from. This can differ from the upload endpoint to make CDN distribution possible. E.g. https://mycloudfrontid.amazonaws.com/
   * @param keyGenerator The method to generate the S3 key. The built-in one just makes sure that the file name is unique per session.
   */
  createAwsUploaderProvider(uploadEndpoint: string, serveEndpoint?: string, keyGenerator?: (fileName: string, fileHash: string) => string): AwsUploadProvider;

  /**
   * @param provider The new upload provider to use.
   */
  setUploadProvider(provider: UploadProvider): void;

  /**
   *
   * @param shopUserId Your shop user id. You can provide this to assign uploaded images to this user and load it later on.
   * @param basketId The basket id for this session. You can load images later on with this id.
   */
  setShopInfo(shopUserId: string, basketId: string): void

  /**
   * @deprecated
   */
  getContentEditables(): TemplateEditables;

  /**
   * Retrieves all price relevant form-field names and values
   */
  getAllPriceRelevantFormFields(): { [key: string]: string }

  /**
   * Retrieves all price relevant form-fields plus tag information and referenced price-categories
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
   */
  gl(translationKey: string, ...params: Array<string | number>): string

  /**
   * Returns current global scale factor, should be !== 1 only on iOS devices to avoid safari-crashes
   */
  globalScaleFactor(): number

  /**
   * Returns if LayoutSnippets are available
   */
  hasLayoutSnippets(): boolean

  /**
   * Returns selected Layout Topic Id that will initially be selected in the Buyer Side for Layout Snippets
   */
  getSelectedLayoutTopicId(): string

  /**
    * Returns if sticker or layout snippet menus should be rendered
    */
  hasSnippetMenu(which: "layout" | "sticker" | "background"): boolean

  /**
    * Returns if LayoutSnippets are available
    */
  getDocumentAspectRatioName(): string

  /**
   * Returns the recommended upload size of the currently selected image
   */
  getSelectedImageRecommendedSize(): null | { pxWidth: number, pxHeight: number }

  /** @deprecated */
  getLayoutSnippetFilterMenu(): Promise<iSnippetMenuCategory[] | null>

  /**
   * Returns Filter Menu for Layout Snippets ("layout") or for a menu-id passed in "menuId"
   */
  getSnippetFilterMenu(menuId: "layout" | "background" | "photobook-themes" | string): Promise<iSnippetMenuCategory[] | null>

  /**
   * Returns if ui should show image count filter for layou snippets
   * Only active if filter menu is displayed
   */
  hasLayoutSnippetImageCountFilter(): boolean

  /**
   * Retrieved availbale keywords for layout search
   */
  getLayoutSnippetKeywords(): Promise<Array<string>>

  /**
   * Retrieved availbale product types for layout search
   */
  getLayoutSnippetProductTypes(): Promise<Array<string>>

  /**
   * Retrieved all layout snippets matching certain keyword, current language and current aspect ratio
   */
  loadLayoutSnippetsByKeywords(keywords: string[], topicId?: string): Promise<Array<iExternalSnippet>>

  /**
   * Retrieved all background-layout snippets matching certain keyword
   */
  loadBackgroundLayoutsByKeywords(keywords: string[], topicId?: string): Promise<Array<iExternalSnippet>>

  /**
   * Retrieved all stickersnippets mathcing certain tags & keywords and current language
   */
  loadStickerSnippetsByKeywords(tags: string[] | ReadonlyArray<string>, keywords: string[]): Promise<Array<iExternalSnippet>>

  /** only for internal use, to transfer visual-viewport to iOs in iframe-mode */
  setIFrameViewPort(v: { offsetTop: number, height: number }): void

  /**
   * Enter the buyer Expert-Mode to allow position, remove and rotation for every frame which is not locked
   */
  enterExpertMode(): void

  /**
   * Leave the buyer Expert-Mode to allow position, remove and rotation for every frame which is not locked
   */
  leaveExpertMode(): void

  /**
   * Returns if Expert-Mode is active
   */
  isInExpertMode(): boolean
  /**
   * Returns if UI should show a button to enter Expert-Mode
   */
  hasExpertButton(): boolean

  /**
   * Returns if Current user has elevated buyer-rights
   */
  isBuyerDesigner(): boolean

  /**
   * Returns if currently loaded template is loaded from a save token.
   */
  loadedFromSaveToken(): boolean

  /**
   * Returns if still in Buyer Mode (Design Side Only)
   */
  isBuyer(): boolean

  /**
   * Returns if UI should display a button to save the current work in the buyer side
   */
  showSaveButton(): boolean

  /**
   * Returns if UI should display a button to save the current work in the buyer side
   */
  showProofButton(): boolean

  /**
   * Returns if UI should display a button to show and hide the alignment grid
   */
  showGridButton(): "on" | "off" | "hide"

  /**
   * Toggles alignment grid
   */
  toggleGrid()

  /**
   * Returns if UI should display a button to save and close the current work in the buyer side
   */
  showSaveAndCloseButton(): boolean

  /**
   * Returns if UI should force the basket button to be in text form
   */
  forceBasketButtonText(): boolean

  /**
   * Returns if UI should display a button to add current work into the basket
   */
  showAddToBasketButton(): boolean

  /**
   * Indicates if UI should show an alert prompt when user attempts to leave the buyer-side
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
   * Returns wether UI should show button to display Keyboard Shortcuts
   */
  showKeyboardShortcuts(): boolean

  /**
   * Returns wether UI should show buttons for cropping in the Crop+Rotate overlay
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
   * @deprecated
   * This call is no longer supported, use `getBuyerFrameCountAndMarkers()` instead.
   * This call will no longer return `iFrameCountAndClasses` intead it returns `iFrameCountAndMarkers`
   */
  getBuyerFrameCountAndClasses(): Array<iFrameCountAndMarkers>


  /**
   * Returns an array of buyer-editable documents and a list of frames for each spread including their frame markers.
   * You can easily use them for statistically purposes or to charge extra prices for certain used layouts.
   * Or just use the frame-count to determine if the user had made changes at all.
   */
  getBuyerFrameCountAndMarkers(): Array<iFrameCountAndMarkers>


  /**
   * Forces calling the shops price change callback
   * Optionally can get a temporary page-count to send to the hosting page
   */
  callPriceChangeCallback(overWritePageCount?: number): void

  /**
   * returns all price relevant data of the current template
   * */
  getPriceRelevantData(): iExternalProductPriceInfo

  /**
   * Get price labels for form-field badges from price-tags
   * @param tag
   * @param propertyId optional to allow printess to check price-relevance of form field
   * @param characters optional to calculate per letter price if applicable
   */
  getFormFieldPriceLabelByTag(tag: string, propertyId?: string, newValue?: string): string

  /**
   * When using direct upload, this will return all the pending image upload promises.
   * You can use Promise.any() to show some nice progress.
   *
   * @returns The currently pending upload promises for direct upload.
   */
  getPendingImageUploads(): Set<Promise<any>>;

  /**
   * When using direct upload, this will return all the image meta data finalization promises.
   *
   * @returns The currently pending metadata promises for direct upload.
   */
  getDirectImageMetadataFinalizationPromises(): Set<Promise<any>>;

  /**
   * When using direct upload, this returns the count of upload processes.
   *
   * @returns The number of upload processes.
   */
  getUploadsInProgress(): number;


  populateDesign(autoSelectLayout: boolean, callback: (percent: number, textPreview: string) => void, errorCallback: (error: any) => void): Promise<void>;

  aiDesignMode(): "none" | "wizzard"

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
   */
  insertPhotobookPages(callback: (percent: number, step: iExternalPhotobookStep, msg: string) => void, options: iExternalPhotobookOptions, freeStyle: boolean): Promise<void>

  /**
   * Analyzes uploaded images to retrieve the information needed for photobook creation.
   *
   * @param callback Callback to report the current progress
   * @param options Options for the analysis process
   */
  analyzePhotos(callback: (percent: number, step: iExternalImageAnalysisStep, msg: string) => void, options: iExternalImageAnalysisOptions): Promise<void>

  /**
   * @returns The amount of duplicates among all uploaded images.
   */
  getPhotobookDuplicateCount(): number

  /**
   * @returns The amount of screenshots among all uploaded images.
   */
  getPhotobookScreenshotCount(): number

  /**
   * @returns The amount of "bad" images among all uploaded images that can be filtered out,
   * ie screenshots, duplicates, blurry images etc.
   */
  getPhotobookFilteredCount(): number

  /**
   * Gets a preview of how images would be distributed in a photobook when created with the provided options.
   *
   * @param options Options for the photobook creation
   * @returns Preview of the image distribution
   */
  getRenderClustersEstimation(options: iExternalPhotobookOptions): iPhotobookEstimation

  /**
  * @returns True if any analyzed images are available for photobook creation, false otherwise.
  */
  hasCurPhotobookData(): boolean

  streamPrompt(prompt: string, onMessage: (message: string) => void, onFinished: () => void): Promise<void>;

  /**
   * Returns the JSON required to generate an AI Letter
   */
  getLetterGeneratorJson(): Promise<string | undefined>;

  /**
   * Get the menu title displayed when opening the AI Text Generator dropdown in the Buyer Side
   */
  getLetterGeneratorMenuTitle(): string;

  /** Provides access to the sample date of the template */
  getSamplePriceData(): { priceTestModeEnabled: boolean, legalNotice: string, oldPrice: number, snippetPrices: Array<number>, priceCategories: { [key: string]: number }, basePrice: number, infoUrl: string, perPagePrice: number }

  /**
   * Renders proof Pdf(s) in the shop scenario.
   * You must allow this in the account portal first.
   * Normally shop access forbids any kind of production.
   */
  renderProofPdfs(): Promise<JobStatus>


  WcBc: {
    masterStyles: () => string
    getStrokeUi: () => HTMLElement // TemplateResult
  }

  /**
   * Gets the currently configured maximum basket image width.
   */
  getMaxmimumBasketWidth(): number;

  /**
   * Gets the currently configured maximum basket image height.
   */
  getMaxmimumBasketHeight(): number;

  /**
   * Helper function for Panel-Ui
   * Shows a dialog with headline and ok / cancel buttons.
   * Returns a container to render your own content in.
   * @param options Text and callback informations
   */
  openDialog(options: IGenericDialogOptions): Promise<HTMLDivElement>

  /**
   * Shows simple progress overlay
   */
  showProgress(message: string)

  /**
   * hides progress overlay
   */
  hideProgress()


  /**
   * Tells if current template has an animation-timeline
   */
  hasAnimation(): boolean

  /**
   * Tells if animation-timeline is playing
   */
  isAnimationPlaying(): boolean

  /**
   * Plays animation
   */
  playAnimation(): Promise<void>

  /**
   * Stops animation
   */
  stopAnimation(): Promise<void>

  /**
   * Reassign/change callbacks.
   */
  setCallbacks(p: printessCallbacks): void;

  /**
  * Reassign/change price category labels.
  */
  setPriceCategoryLabels(priceCategoryLabels: Record<string, string> | null): void;

  /**
   * Creates a content hash of the current design state.
   * Can be used to track changes.
   * When supplying `formFieldsToIgnore` it will filter out those form fields. Those are excluded from the hash generation.
   * Please note that this hash can change when used on different Printess Editor versions.
   *
   * @param options Supports setting form field names to ignore during hash creation.
   */
  generateContentHash(options?: { formFieldsToIgnore?: string[], ignoreAllFormFields?: boolean }): string;
}


export interface IGenericDialogOptions {
  callback: () => void,
  headline: string,
  okLabel?: string,
  cancelLabel?: string,
  message?: string
  cancelCallback?: () => void
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
  distributionMethod: "cc" | "fs"
  spreadCount: number
  imageCount: number
  firstSpreadImageCount: number
  lastSpreadImageCount: number
  minImagesPerSpread: number
  maxImagesPerSpread: number
  maxCollectedPerSpread: number
  filterImages: boolean,
  initialCreation: boolean
}
export type iExternalPhotobookStep = "mode" | "start" | "upload" | "adjust" | "analyze" | "distribute" | "error" | "done";

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
  /** optional: could be any Length value, like an equation or a fixed value with unit, e.g. `=spine.pages * 0.3mm` or `2cm` */
  spine?: string,
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

  /** enable / disable layflat mode */
  layflat?: boolean,

  /** if true, first page and last page become invisible */
  lockCoverInside?: boolean

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
  | "selection-text-style" | "selection-letter-ai" | "selection-text-ai" | "selection-text-handwriting" | "number" | "pixelLength" | "percentLength" | "image" | "font" | "select-list" | "select-list+info" | "tab-list" | "image-list" | "image-list+caption" | "color-list" | "table" | "image-id" | "patternTileWidth" | "text-frame-style" | "custom-text-combo";

export type iExternalMetaPropertyKind = null |
  "text-style-color" | "text-style-size" | "text-style-line-height" | "text-style-baseline-script" | "text-style-font" | "text-style-hAlign" | "text-style-vAlign" | "text-style-vAlign-hAlign" | "text-style-paragraph-style" | "handwriting-image" |
  "image-scale" | "image-placement" | "image-sepia" | "image-brightness" | "image-contrast" | "image-vivid" | "image-invert" | "image-hueRotate" | "image-rotation" | "image-crop" | "image-filter"
  | "letter-generator" | "remove-background" | "image-tools" | "crop+rotate";

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
  /** availaible for slim-ui only */
  formFieldMeta?: iExternalFormFieldMeta;
  boxMetas?: Array<iExternalBoxMeta>;
  origin?: "template" | "layout";
  bgColorIndex?: number;
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
  paragraphIndex: number
}

export type ExtFF_WriteSecondWhat = "value" | "label" | "info" | "tag" | "meta1" | "meta2" | "meta3" | "meta4"
export type ExtFFType = "string" | "table" | "number" | "label" | "font" | "color";


export interface iExternalFormFieldMeta {
  dataType: ExtFFType;
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
  match: boolean
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
  placement: "fit" | "fill" | "face" | "group",
  thumbUrl: string;
  thumbCssUrl: string;
  canUpload: boolean;
  hasFFCropEditor: boolean;
  isAiGenererated: boolean;
  isVector: boolean;
  prompt: string;
  /**
  * Indicates if you can modify scaling on that image
  */
  canScale: boolean;
  canSetPlacement: boolean;
  canSetDefaultImage: boolean;
  allows: Array<"sepia" | "brightness" | "contrast" | "vivid" | "hueRotate" | "invert">;
  filterTags: ReadonlyArray<string> | Array<string>;
  isHandwriting: boolean;
  average: number;

  // Slim Ui
  imageFrameInfos?: iExternalImageFrameInfos
  assignedImage?: iImage | null; // "fallback?"
  allowOnlyVectorImageUpload?: boolean
  allowSvgUpload?: boolean
  allowPdfUpload?: boolean
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
  errorCode: "emptyError" | "user-canceled" | "customStepValidation" | "preflight" | "rowIndexLessThanZero" | "invalidDayValue" | "imageResolutionLow" | "imageMissing" | "imageStillUploading" | "imageCouldNotUpload" | "textMissing" | "minTableEntries" | "maxTableEntries" | "mandatoryTableCell" | "notChecked" | "characterMissing" | "maxCharsExceeded" | "offensiveLanguageDetected" | "regExpNotMatching" | "textOverflow" | "noLayoutSnippetSelected" | "invalidNumber" | "missingEventText" | "emptyBookPage" | "invalidPageCount" | "needMorePages" | "toManyPages",
  errorValue1: string | number,
  errorValue2?: string | number,
  errorValue3?: string | number,
  errorValue4?: string,
  errorType?: "text" | "image" | "table" | "book" | "step" | "snippet" | "ff-selection",
  errorIcon?: iconName
}

export interface iExternalFrame {
  top: string,
  left: string
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

export interface iMergeTemplate {
  /**
   * Name of the template or Snippet ID to load an merge into the currently loaded template.
   */
  templateName: string;
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

export declare type externalFormFieldChangeCallback = (name: string, value: string, tag: string, label: string, ffLabel: string) => void;
export declare type externalSelectionChangeCallback = (properties: Array<iExternalProperty>, scope: "document" | "frames" | "text") => void;
export declare type externalSpreadChangeCallback = (groupSnippets: ReadonlyArray<iExternalSnippetCluster> | Array<iExternalSnippetCluster>, layoutSnippets: ReadonlyArray<iExternalSnippetCluster> | Array<iExternalSnippetCluster>, tabs: ReadonlyArray<iExternalTab> | Array<iExternalTab>, hasRootFormFieldsWithOutTab: boolean, showSelectLayoutDialog: boolean, optOutHash: string, spreadId: string) => void;
export declare type externalDocChangeCallback = (newDocId: string) => void;
export declare type externalGetOverlayCallback = (properties: Array<{ kind: iExternalPropertyKind, isDefault: boolean, isMandatory: boolean }>, width: number, height: number) => HTMLDivElement;
export declare type refreshPaginationCallback = undefined | (() => void);
export declare type receiveMessageCallback = undefined | ((topic: MessageTopic, data: Record<string, any>) => void);
export declare type refreshUndoRedoCallback = undefined | (() => void);
export declare type updatePageThumbnailCallback = undefined | ((spreadId: string, pageId: string, url: string) => void);
export declare type textStyleModeEnum = "default" | "all-paragraphs" | "all-paragraphs-if-no-selection";

export type MessageTopic = "SplitterFrameToText" | "ShowAlert" | "OpenImageUpload" | "MobileImagesUpload" | "BuyerUploadedImages";


export type iExternalHyphenationLanguage = "off" | "en-us" | "de" | "fr" | "es" | "se";

export interface iExternalImage {
  id: string;
  originalImageUrl: string;
  thumbUrl: string;
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
  quality?: string
}

export interface iExternalImageFrameInfos {
  frame: iExternalImageFrameDimensions
  //image: iExternalImage,
  image: {
    width: number,
    height: number,
    originalImageUrl: string,
    displayImageUrl: string
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
   * Important: Its depricated, You can not enable this feature anymore!
   */
  priceCategories: Array<string>
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
        price: string, // any string like "32.34€"
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
}

// export type ImageAiFilterType = "image-edit";
// export type ImageAiFilterModel = "GPT Image Edit" | "Nano Banana";
export type ImageAiFilterType = "IMAGE-EDIT";
export type ImageAiFilterModel = "GPT ImageEdit" | "Nano Banana" | "Nano Banana Pro";
export interface ImageAIFilter {
  id: string,
  label: string,
  type: ImageAiFilterType,
  model: ImageAiFilterModel,
  isUserPrompt: boolean,
  promptPrefix?: string,
  prompt: string,
  gptQuality?: "low" | "medium" | "high",
  thumbnailUrl: string
}
export interface ImageAIFilterCategory {
  id: string,
  label: string,
  filters: ImageAIFilter[]
}


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
  | "eye-solid-slash"
  | "font"
  | "send-back"
  | "send-backward"
  | "bring-front"
  | "bring-forward"
  | "distort"
  | "list-ul"
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
  ;