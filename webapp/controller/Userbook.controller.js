sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Userbook", {
      onInit: function () {
           
                const oModel = this.getOwnerComponent().getModel("booking");
                this.getView().setModel(oModel);

      },
        onDateChange: function () {
            this._calculateTotal();
        },
    onTermsChange: function () {
        
        var cb1 = this.byId("cb1").getSelected();
        var cb2 = this.byId("cb2").getSelected();
        var cb3 = this.byId("cb3").getSelected();

        var allSelected = cb1 && cb2 && cb3;
        if(allSelected === true && total > 0 )
            {
                this.getView().byId('book').setProperty("enabled", true);
            }
    },

        _calculateTotal: function () {

            var oModel = this.getView().getModel("booking");
            var aItems = oModel.getProperty("/items");

            var totalRent = 0;

            aItems.forEach(function (item) {

                var start = new Date(item.startDate);
                var end = new Date(item.endDate);
                if (end < start) {
                        sap.m.MessageToast.show("End date cannot be before Start date");

                        // optional: reset end date
                        item.endDate = item.startDate;

                        return; // skip this item
                    }

                var days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                if (days < 1 || isNaN(days)) {
                    days = 1;
                }

                totalRent += item.price * item.qty * days;
            });

            var deposit = oModel.getProperty("/deposit");

            oModel.setProperty("/totalRent", totalRent);

            var total = oModel.setProperty("/total", totalRent + deposit);
             this._updateButtonState();

        },
        onBookNow:function(){ 
            
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteSuccess")
        },
        onBack:function(){
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteUser")
        }

    });
});