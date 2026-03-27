import { iFormFieldProperty, iMergeTemplate } from "./printess-editor.d";
import { INameValuePair, IPluginContext } from "./printess-shop-integration.d";
import { IShopifySettings } from "./printess-shopify.d";

declare global {
  const printessSettings: IShopifySettings;
}

//Instead of calling 20 times registerPrintessPlugin you could also wrap all methods into one registerPrintessPlugin call.
//The registerPrintessPlugin call needs to be either put into the product page or somewhere inside the theme header somewhere below the render printess init call.
//Most methods are only available on the editor integration, and not for slimui

//Allow / disallow opening the editor after the design now button is clicked
registerPrintessPlugin({
  doAllowOpenAsync(context: IPluginContext, params: {//context contains current product information and currently selected variant
    templateName: string,//The printess template name or save token that is used for opening the editor
    formFields: INameValuePair[],//The printess form field names / values that are pushed to the editor
    mergeTemplates: iMergeTemplate[],//The merge template configuration
    formFieldProperties: iFormFieldProperty[]//The form field properties that will be set (only in case you are modifying form field configurations on startup [rare cases like adding / removing form field list entries from list form fields dynamically])
  }): Promise<boolean> {
    if (!printessSettings.customerIsLoggedIn) {
      //Do something here like redirect to login
    }

    return Promise.resolve(printessSettings.customerIsLoggedIn === true);//The editor will only open
  }
});

//Customer clicked on add to basket
registerPrintessPlugin({
  doAllowAddToBasketAsync(context: IPluginContext, params: {//Allows you to block adding the basket item
    saveToken: string,//The save token that will be added to the basket item
    thumbnailUrl: string,//The url to the thumbnail of the personalized document, used inside the shopping basket and in saved designs for example
    propertyValuesToWrite: Record<string, string>,//Additional basket items properties that will be added to the basket item (this parameter can be modifed from within the call in case you want to add / remove / modify some values)
    previousSaveToken: string,//The last save token from the last save call within the current editing session
    originalSaveToken: string//The original template name / save token that was used to open the current edit session
  }): Promise<boolean> {
    return Promise.resolve(true);//Return false to stop the editor from submitting the pdp resulting in basket item creation and redirect to basket
  },
  onAddToBasketAsync(context: IPluginContext, params: {//Other than doAllowAddToBasketAsync this is only a notification that a new item is added to the basket, can not block adding the item. Property values can be changed as well
    saveToken: string,
    thumbnailUrl: string,
    propertyValuesToWrite: Record<string, string>,
    previousSaveToken: string,
    originalSaveToken: string
  }): Promise<void> {
    return Promise.resolve();
  }
});

//Handling customer save button click
registerPrintessPlugin({
  onSaveAsync(context: IPluginContext, params: {
    saveToken: string,
    thumbnailUrl: string,
    previousSaveToken: string,
    originalSaveToken: string
  }): Promise<void> {
    //Do something like storing the save token and the thumbnail url somewhere

    return Promise.resolve();
  }
});