sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

       return Controller.extend("com.applexus.finalproject.controller.Success", {
      onInit: function () {
        
      },

        onBackToInventory: function () {

            var oRouter = this.getOwnerComponent().getRouter();

            // Navigate to homepage / inventory page
            oRouter.navTo("RouteUser"); 
        }

    });
});