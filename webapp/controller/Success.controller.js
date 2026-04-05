sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

       return Controller.extend("com.applexus.finalproject.controller.Success", {
onInit: function () {
    var oRouter = this.getOwnerComponent().getRouter();

    oRouter.getRoute("RouteSuccess").attachPatternMatched(function (oEvent) {
        debugger
        var bookingId = oEvent.getParameter("arguments").bookingId;

        console.log("Received Booking ID:", bookingId);

    
        this.bookingId = bookingId;
                var oModel = new sap.ui.model.json.JSONModel({ bookingId: bookingId });
        this.getView().setModel(oModel, "viewModel");


    }, this);
},

        onBackToInventory: function () {

            var oRouter = this.getOwnerComponent().getRouter();

            // Navigate to homepage / inventory page
            oRouter.navTo("RouteUser"); 
        }

    });
});