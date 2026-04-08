sap.ui.define([
	"./BaseController",
	"../model/formatter"
], (BaseController, formatter) => {
	"use strict";

	return BaseController.extend("sap.ui.demo.cart.controller.Product", {
		formatter,

		onInit() {
			const oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("product").attachPatternMatched(this._routePatternMatched, this);

			this._router.getTarget("product").attachDisplay((oEvent) => {
				// update the binding based on products cart selection
				this.fnUpdateProduct(oEvent.getParameter("data").productId);
			}, this);
		},

		_routePatternMatched(oEvent) {
			const sId = oEvent.getParameter("arguments").productId;
			const oView = this.getView();
			const oComponent = this.getOwnerComponent();

			oComponent.dataLoaded().then(() => {
				const sPath = oComponent.getProductPathById(sId);

				if (!sPath) {
					this._router.getTargets().display("notFound");
					return;
				}

				oView.bindElement({
					path: sPath
				});
				this._checkIfProductAvailable(sPath);
			});
		},

		fnUpdateProduct(productId) {
			const sPath = this.getOwnerComponent().getProductPathById(productId);
			const fnCheck = () => this._checkIfProductAvailable(sPath);

			if (!sPath) {
				this._router.getTargets().display("notFound");
				return;
			}

			this.getView().bindElement({
				path: sPath,
				events: {
					change: fnCheck
				}
			});
		},

		_checkIfProductAvailable(sPath) {
			const oModel = this.getModel();
			const oData = oModel.getProperty(sPath);

			// show not found page
			if (!oData) {
				this._router.getTargets().display("notFound");
			}
		},

		/**
		 * Navigate to the generic cart view
		 * @param {sap.ui.base.Event} oEvent the button press event
		 */
		async onToggleCart(oEvent) {
			const oEntry = this.getView().getBindingContext().getObject();
			const bPressed = oEvent.getParameter("pressed");

			this._setLayout(bPressed ? "Three" : "Two");
			this.getRouter().navTo(bPressed ? "productCart" : "product", {
				id: oEntry.Category,
				productId: oEntry.ProductId
			});
		}
	});
});
