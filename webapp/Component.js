sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/LocalStorageModel",
	"./model/models",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"./model/repositoryData"
], (UIComponent, LocalStorageModel, models, Device, JSONModel, repositoryData) => {
	"use strict";

	return UIComponent.extend("sap.ui.demo.cart.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the device models are set and the router is initialized.
		 * @override
		 */
		init() {
			//create and set cart model
			const oCartModel = new LocalStorageModel("SHOPPING_CART", {
				cartEntries: {},
				savedForLaterEntries: {}
			});
			this.setModel(oCartModel, "cartProducts");

			//create and set comparison model
			const oComparisonModel = new LocalStorageModel("PRODUCT_COMPARISON", {
				category: "",
				item1: "",
				item2: ""
			});
			this.setModel(oComparisonModel, "comparison");

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);

			const oRepositoryModel = new JSONModel({
				ProductCategories: [],
				Products: []
			});
			this.setModel(oRepositoryModel);
			this._mCategoryPathsById = {};
			this._mProductPathsById = {};
			 	const sAppId = this.getManifestEntry("/sap.app/id");
			const sAppPath = sAppId.replaceAll(".", "/");
			const sAppModulePath = jQuery.sap.getModulePath(sAppPath);
			this._pRepositoryDataLoaded = repositoryData.load(sAppModulePath).then((oRepositoryData) => {
				oRepositoryModel.setData(oRepositoryData.data);
				this._mCategoryPathsById = oRepositoryData.categoryPathsById;
				this._mProductPathsById = oRepositoryData.productPathsById;
			}).catch((oError) => {
				oRepositoryModel.setData({
					ProductCategories: [],
					Products: [],
					error: oError.message
				});
			});

			// initialize the router
			this.getRouter().initialize();

			// update browser title
			this.getRouter().attachTitleChanged((oEvent) => {
				const sTitle = oEvent.getParameter("title");
				document.addEventListener('DOMContentLoaded', () => {
					document.title = sTitle;
				});
			});
		},

		dataLoaded() {
			return this._pRepositoryDataLoaded || Promise.resolve();
		},

		getCategoryPathById(sCategoryId) {
			return this._mCategoryPathsById?.[sCategoryId];
		},

		getProductPathById(sProductId) {
			return this._mProductPathsById?.[sProductId];
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @returns {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line sap-no-proprietary-browser-api
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}

			return this._sContentDensityClass;
		}
	});
});
