sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";
     var flag = 0;
    return Controller.extend("com.applexus.finalproject.controller.Userbook", {
      onInit: function () {
           
                const oModel = this.getOwnerComponent().getModel("booking");
                this.getView().setModel(oModel,"booking");

      },
        onDateChange: function (oEvent) {
                this._calculateTotal();
        },
        onQuantChange: function (oEvent) {

                const oInput = oEvent.getSource();
                const sValue = oInput.getValue();

                const oContext = oInput.getBindingContext("booking");
                const oItem = oContext.getObject();

                const enteredQty = Number(sValue) || 0;
                const availableQty = Number(oItem.availableQty) || 0;

                if (enteredQty > availableQty) {
                    sap.m.MessageToast.show("Entered quantity exceeds available quantity");
                    flag = 1;
                    return;
            }

            this._calculateTotal();
        },
    onTermsChange: function () {
        
        var cb1 = this.byId("cb1").getSelected();
        var cb2 = this.byId("cb2").getSelected();
        var cb3 = this.byId("cb3").getSelected();

        var allSelected = cb1 && cb2 && cb3;

        if(allSelected === true)
            {
                this.getView().byId('book').setProperty("enabled", true);
            }
    },

        _calculateTotal: function () {
            debugger
            const oModel = this.getView().getModel("booking");
            const aItems = oModel.getProperty("/items") || [];

            let totalRent = 0;
            let totalDeposit = 0;

            aItems.forEach(function (item) {

                const price = Number(item.price) || 0;
                const qty = Number(item.qty) || 1;
                const deposit = Number(item.deposit) || 0;

                const start = new Date(item.startDate);
                const end = new Date(item.endDate);

                if (end <= start) {
                    sap.m.MessageToast.show("End date cannot be same or  before Start date");
                    item.endDate = item.startDate;
                    oModel.refresh(true); // force UI update
                    return;
                }

                let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                if (!days || days < 1) {
                    days = 1;
                }

                totalRent += price * qty * days;
                totalDeposit += deposit * qty; 
            });

            const totalVal = totalRent + totalDeposit;

            oModel.setProperty("/totalRent", totalRent);
            oModel.setProperty("/totalDeposit", totalDeposit);
            oModel.setProperty("/total", totalVal);
        
        },       
            onBookNow:function(){ 
                
                const oModel = this.getView().getModel("booking");
                const total = Number(oModel.getProperty("/total")) || 0;

                if (total === 0) {
                    sap.m.MessageToast.show("Total amount cannot be 0");
                    return;
                }
                else if (flag === 0)
                {
                    var oRouter = this.getOwnerComponent().getRouter();
                                oRouter.navTo("RouteSuccess")
                }
                else{
                    sap.m.MessageToast.show("Entered quantity exceeds available quantity");
                }
            
            },
        onBack:function(){

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteUser")
        }

    });
});