sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.User", {

      onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteUser").attachPatternMatched(this._onRouteMatched, this);

                this.getView().setModel(new sap.ui.model.json.JSONModel({ 
                    userName: "" }), "userSession"); 
        },
        _onRouteMatched: function () {
            var sUserName = sessionStorage.getItem("userName");     
            this.getView().getModel("userSession").setProperty("/userName", sUserName || "");    
            //  Refresh OData
            var oModel = this.getView().getModel();
            if (oModel) {
                oModel.refresh(true);
            }
            //  Refresh list binding
            var oList = this.byId("itemList");
            if (oList) {
                oList.getBinding("items").refresh();
            }

            //  Reset checkboxes (IMPORTANT)
            oList.getItems().forEach(function (oItem) {
                var oCheckBox = oItem.getContent()[0]
                    .getItems()[0]
                    .getItems()[0]
                    .getItems()[0];

                oCheckBox.setSelected(false);
            });
        },

        onSearch: function (oEvent) {
           
            var sValue = oEvent.getParameter("newValue");

            var oFilter1 = new sap.ui.model.Filter("item_name", sap.ui.model.FilterOperator.Contains, sValue);
            var oFilter2 = new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.Contains, sValue);
            var oFilter3 = new sap.ui.model.Filter("category", sap.ui.model.FilterOperator.Contains, sValue);


            // Combine filters in an OR condition
            var oMaster = new Filter({
                filters: [oFilter1, oFilter2, oFilter3],
                and: false // false = OR condition
            });

                var oList = this.byId("itemList");
                var oBinding = oList.getBinding("items");

                oBinding.filter([oMaster]);
        },

        onPreview: function (oEvent) {
                    
                    var oContext = oEvent.getSource().getBindingContext();
                    this.loadFragment({
                            name: "com.applexus.finalproject.fragments.Popup",
                            controller: this
                        }).then(function (oPopup) { //Need to Create Controls Inside the popup ( if we use dialogue control in popup view the comment make sense)
                            if (!oPopup) {
                                    sap.m.MessageToast("Image Can't Load")
                                    return;
                            }      
                     
                    oPopup.setTitle("Image Preview");

        
                    oPopup.setBindingContext(oContext);
                    var sUrl = oContext.getProperty("image_url");  // get the image URL
                    // Clear old content
                    oPopup.removeAllContent();

                    // Add image
                    oPopup.addContent(new sap.m.Image({
                        src: sUrl,
                        width: "100%"
                    }));

                    // Close button
                    oPopup.setEndButton(new sap.m.Button({
                        text: "Close",
                        press: function () {
                            oPopup.close();
                        }
                    }));

                    oPopup.open();
                });
        },
        onStatus: function(){
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteStatus");
        },
        onNext: function () {
            const oList = this.byId("itemList");
            const aItems = oList.getItems();
            const aSelected = [];

            aItems.forEach(function (oItem) {

                // Safely get CheckBox
                const oHBox = oItem.getContent()[0];
                const oVBox = oHBox.getItems()[0];
                const oInnerHBox = oVBox.getItems()[0];
                 const oCheckBox = oInnerHBox.getItems()[0];


                if (oCheckBox.getSelected()) {
        
                    const oCtx = oItem.getBindingContext();
                    const oData = oCtx.getObject();

                    const startDate = new Date();
                    const endDate = new Date(startDate); // Copy start date to modify it
                    endDate.setDate(startDate.getDate() + 1); // Add 1 day to the current date

                    aSelected.push({
                        id: oData.item_id,
                        name: oData.item_name,
                        type: oData.type,
                        price: oData.rent_per_day,
                        deposit: oData.deposit,
                        curr_key: oData.curr_key,
                        qty: 1,
                        availableQty: oData.available_qty - oData.item_lost,
                        startDate: startDate.toISOString().split("T")[0], // Format as yyyy-mm-dd
                        endDate: endDate.toISOString().split("T")[0] // Format as yyyy-mm-dd
                    });
                }
            });                                                                                                                                                                                                                                                                                                                        
            if (aSelected.length === 0) {
                sap.m.MessageToast.show("Select at least one item");
                return;
            }

            // JSON model
            const oModel = new sap.ui.model.json.JSONModel({
                items: aSelected,
                totalRent: 0,
                totalDeposit: 0,
                total: 0,
                curr_key: aSelected[0].curr_key // take from first item key
                
            });

            this.getOwnerComponent().setModel(oModel, "booking");
            this.getOwnerComponent().getRouter().navTo("RouteUserbook");
        },
        onLogoutPress: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                    // Clear the session variable currentUserCustomerId and UserName on logout
                sessionStorage.removeItem("currentUserCustomerId");
                sessionStorage.removeItem("userName");
                // Navigate to login
                oRouter.navTo("RouteLogin");

                //  Clear browser history so back button cannot return to this page
                window.history.pushState(null, "", window.location.href);
                window.onpopstate = function () {
                    window.history.pushState(null, "", window.location.href);
                };
       }

    });
});