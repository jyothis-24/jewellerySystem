sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel"
    ],
    function (Controller, JSONModel) {
        "use strict";

        var flag = 0;

        return Controller.extend("com.applexus.finalproject.controller.Userbook", {

            onInit: function () {


                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteUserbook").attachPatternMatched(this._onRouteMatched, this);

                const oModel = this.getOwnerComponent().getModel("booking");
                this.getView().setModel(oModel, "booking");
                //Setting the Mindate in DatePicker
                   const oJson = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(oJson, "local"); // use separate model

                    const oToday1 = new Date();
                    oToday1.setHours(12, 0, 0, 0);

                    oJson.setProperty("/today", oToday1);
                    const oTomorrow = new Date();
                    oTomorrow.setDate(oTomorrow.getDate() + 1); //  add 1 day
                    oTomorrow.setHours(12, 0, 0, 0); //  avoid timezone issue

                    oJson.setProperty("/tomorrow", oTomorrow);

                
            },
            _onRouteMatched: function () {

    const oModel = this.getOwnerComponent().getModel("booking");
    this.getView().setModel(oModel, "booking");

    //  Recalculate totals every time page opens
    this._calculateTotal();

    //  Reset terms checkbox + button
    this.byId("cb1").setSelected(false);
    this.byId("cb2").setSelected(false);
    this.byId("cb3").setSelected(false);
    this.byId("book").setEnabled(false);
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
                const oModel = this.getView().getModel("booking");
                if (enteredQty > availableQty) {
                    sap.m.MessageToast.show("Entered quantity exceeds available quantity");
                    oModel.refresh(true);
                    flag = 1;
                    return;
                }
                else{
                    flag = 0;
                }

                this._calculateTotal();
            },
            onStartDateChange: function (oEvent) {

                var oStartDate = oEvent.getSource().getDateValue();
                if (!oStartDate) return;

                var oMinEndDate = new Date(oStartDate);
                oMinEndDate.setDate(oMinEndDate.getDate() + 1);

                this.byId("endDatePicker").setMinDate(oMinEndDate);

                var oEndPicker = this.byId("endDatePicker");
                var oEndDate = oEndPicker.getDateValue();

                if (oEndDate && oEndDate <= oStartDate) {
                    oEndPicker.setDateValue(null);
                }

                this._calculateTotal();
            },

            onEndDateChange: function (oEvent) {

                var oEndDate = oEvent.getSource().getDateValue();
                if (!oEndDate) return;

                var oMaxStartDate = new Date(oEndDate);
                oMaxStartDate.setDate(oMaxStartDate.getDate() - 1);

                this.byId("startDatePicker").setMaxDate(oMaxStartDate);

                var oStartPicker = this.byId("startDatePicker");
                var oStartDate = oStartPicker.getDateValue();

                if (oStartDate && oStartDate >= oEndDate) {
                    oStartPicker.setDateValue(null);
                }

                this._calculateTotal();
            },   

            onTermsChange: function () {
                // Get the state of all three checkboxes
                var cb1Selected = this.byId("cb1").getSelected();
                var cb2Selected = this.byId("cb2").getSelected();
                var cb3Selected = this.byId("cb3").getSelected();

                // Button should be enabled only if all checkboxes are selected
                var allSelected = cb1Selected && cb2Selected && cb3Selected;

                // Enable or disable the button accordingly
                this.byId("book").setEnabled(allSelected);
            },

            _calculateTotal: function () {
                

                const oModel = this.getView().getModel("booking");
                const aItems = oModel.getProperty("/items") || [];

                let totalRent = 0;
                let totalDeposit = 0;

                aItems.forEach(function (item) {
                    const price = Number(item.price) || 0;
                    const qty = Number(item.qty) || 0;
                    const deposit = Number(item.deposit) || 0;

                    const start = new Date(item.startDate);
                    const end = new Date(item.endDate);

                    if (end <= start) {
                        sap.m.MessageToast.show("End date cannot be same or before Start date");
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

   

            onBack: function () {
               
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteUser");
            },
            onBookNow: function () { 
                           

                const oModel = this.getView().getModel("booking");
                const total = Number(oModel.getProperty("/total")) || 0;
                // var sUser = sessionStorage.getItem("currentUser");
                // var oUserModel = sap.ui.getCore().getModel("user");
                // var customerId = oUserModel.getProperty("/CustomerId");
                // var customerId = '0000001019';
                // var oUser = JSON.parse(sessionStorage.getItem("currentUser"));
                // var customerId = oUser.CustomerId;
                var customerId = sessionStorage.getItem("currentUserCustomerId");
                
                if (total === 0) {
                    sap.m.MessageToast.show("Total amount cannot be 0");
                    return;
                }

                if (flag !== 0) {
                    sap.m.MessageToast.show("Entered quantity exceeds available quantity");
                    return;
                }

                //  Build Deep Entity Payload
                const aItems = oModel.getProperty("/items") || [];

                const aItemPayload = aItems.map(function(item) {
                    return {
                        ItemId: item.id,
                        Quantity: String(item.qty),
                        Unit: item.unit,
                        TotalRentPerDay: item.price,
                        Currency: "INR",

                        RentStartDate: "/Date(" + new Date(item.startDate).getTime() + ")/",
                        RentEndDate: "/Date(" + new Date(item.endDate).getTime() + ")/"
                    };
                });

                const oPayload = {

                CustomerId: customerId,

                BookingDate: "/Date(" + new Date().getTime() + ")/",

                TotalRent: oModel.getProperty("/totalRent").toFixed(3),
                TotalDeposit: oModel.getProperty("/totalDeposit").toFixed(3),
                Currency: "INR",
                BookingStatus: "P",
                PaymentStatus: "P",

                PaymentDate: "/Date(" + new Date().getTime() + ")/",

                    // Navigation Property
                    Bk_Header_Item_Nav: aItemPayload
                };
                


                // OData Call
                        var oDataModel = new sap.ui.model.odata.v2.ODataModel(
                        "/sap/opu/odata/sap/ZB18_G4_JRS_SRV"); // main OData model

                oDataModel.create("/BK_HeaderSet", oPayload, {
                    success: function (oData) {
                        debugger
                        sap.m.MessageToast.show("Booking Created Successfully");
                        this.getOwnerComponent().setModel(null, "booking");
                        var bookingId = oData.BookingId; 
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                            // Pass bookingId as parameter
                        oRouter.navTo("RouteSuccess", {
                            bookingId: bookingId
                        });
                        console.log("Before navigation Booking ID:", bookingId);
                    }.bind(this),

                    error: function (oError) {
                        console.log(oError);
                        sap.m.MessageToast.show("Error while creating booking");
                    }
                });
            }

        });
    }
);