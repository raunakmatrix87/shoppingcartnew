sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], (BaseController, JSONModel) => {
	"use strict";

	return BaseController.extend("sap.ui.demo.cart.controller.App", {
		onInit() {
			const oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				layout: "TwoColumnsMidExpanded",
				smallScreenMode: true
			});
			this.setModel(oViewModel, "appView");

			const iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			const fnSetAppNotBusy = () => {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().dataLoaded().finally(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}
	});
});
