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

    //    onQuantChange: function (oEvent) {
    //         const oInput = oEvent.getSource();
    //         const sValue = oInput.getValue();

    //         const oContext = oInput.getBindingContext("booking");
    //         const oItem = oContext.getObject();

    //         const enteredQty = Number(sValue) || 0;
    //         const availableQty = Number(oItem.availableQty) || 0;

    //         //  Invalid (greater than available)
    //         if (enteredQty > availableQty) {

    //             oInput.setValueState("Error");
    //             oInput.setValueStateText("Max available: " + availableQty);

    //             sap.m.MessageToast.show("Quantity exceeds available stock");

    //             flag = 1;
    //             return;
    //         }

    //         //  Invalid (0 or negative)
    //         if (enteredQty <= 0) {

    //             oInput.setValueState("Error");
    //             oInput.setValueStateText("Enter valid quantity");

    //             sap.m.MessageToast.show("Invalid quantity");

    //             flag = 1;
    //             return;
    //         }

    //         //  Valid
    //         oInput.setValueState("None");
    //         oInput.setValueStateText("");

    //         flag = 0;

    //         this._calculateTotal();

    //     },


    onQuantLiveChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oEvent.getParameter("value");

            //  Block characters — only allow digits
            var sClean = sValue.replace(/[^0-9]/g, "");
            if (sClean !== sValue) {
                oInput.setValue(sClean);
                oInput.setValueState("Error");
                oInput.setValueStateText("Only numbers are allowed");
                return;
            }

            //  Block if length exceeds 5 digits
            if (sClean.length > 5) {
                sClean = sClean.substring(0, 5);
                oInput.setValue(sClean);
            }

            var iEntered   = parseInt(sClean, 10);
            var oContext   = oInput.getBindingContext("booking");
            var oItem      = oContext.getObject();
            var iAvailable = Number(oItem.availableQty) || 0;

            // Reset first
            oInput.setValueState("None");
            oInput.setValueStateText("");

            //  Empty input
            if (!sClean || isNaN(iEntered)) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Quantity cannot be empty");
                return;
            }

            //  Zero entered
            if (iEntered === 0) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Quantity must be greater than 0");
                return;
            }

            //  Exceeds available
            if (iEntered > iAvailable) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Available stock is only " + iAvailable);
                return;
            }

            //  All good
            oInput.setValueState("Success");
            oInput.setValueStateText("Quantity is valid");
            this._calculateTotal();
    },

    onQuantChange: function (oEvent) {
            var oInput     = oEvent.getSource();
            var sValue     = oInput.getValue();
            var oContext   = oInput.getBindingContext("booking");
            var oItem      = oContext.getObject();
            var iEntered   = parseInt(sValue, 10);
            var iAvailable = Number(oItem.availableQty) || 0;

            // Reset
            oInput.setValueState("None");
            oInput.setValueStateText("");

            //  Empty
            if (!sValue || isNaN(iEntered)) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Quantity cannot be empty");
                return;
            }

            //  Negative or zero
            if (iEntered <= 0) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Quantity must be greater than 0");
                return;
            }

            //  Exceeds available
            if (iEntered > iAvailable) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Available stock is only " + iAvailable);
                return;
            }

            //  Too large (extra safety)
            if (iEntered > 99999) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Quantity is too large");
                return;
            }

            //  Valid
            oInput.setValueState("Success");
            oInput.setValueStateText("");
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
            // onBookNow: function () { 
                           

            //     const oModel = this.getView().getModel("booking");
            //     const total = Number(oModel.getProperty("/total")) || 0;
            //     // var sUser = sessionStorage.getItem("currentUser");
            //     // var oUserModel = sap.ui.getCore().getModel("user");
            //     // var customerId = oUserModel.getProperty("/CustomerId");
            //     // var customerId = '0000001019';
            //     // var oUser = JSON.parse(sessionStorage.getItem("currentUser"));
            //     // var customerId = oUser.CustomerId;
            //     var customerId = sessionStorage.getItem("currentUserCustomerId");
                
            //     if (total === 0) {
            //         sap.m.MessageToast.show("Total amount cannot be 0");
            //         return;
            //     }

            //     if (flag !== 0) {
            //         sap.m.MessageToast.show("Entered quantity exceeds available quantity");
            //         return;
            //     }

            //     //  Build Deep Entity Payload
            //     const aItems = oModel.getProperty("/items") || [];

            //     const aItemPayload = aItems.map(function(item) {
            //         return {
            //             ItemId: item.id,
            //             Quantity: String(item.qty),
            //             Unit: item.unit,
            //             TotalRentPerDay: item.price,
            //             Currency: "INR",

            //             RentStartDate: "/Date(" + new Date(item.startDate).getTime() + ")/",
            //             RentEndDate: "/Date(" + new Date(item.endDate).getTime() + ")/"
            //         };
            //     });

            //     const oPayload = {

            //     CustomerId: customerId,

            //     BookingDate: "/Date(" + new Date().getTime() + ")/",

            //     TotalRent: oModel.getProperty("/totalRent").toFixed(3),
            //     TotalDeposit: oModel.getProperty("/totalDeposit").toFixed(3),
            //     Currency: "INR",
            //     BookingStatus: "P",
            //     PaymentStatus: "P",

            //     PaymentDate: "/Date(" + new Date().getTime() + ")/",

            //         // Navigation Property
            //         Bk_Header_Item_Nav: aItemPayload
            //     };
                


            //     // OData Call
            //             var oDataModel = new sap.ui.model.odata.v2.ODataModel(
            //             "/sap/opu/odata/sap/ZB18_G4_JRS_SRV"); // main OData model

            //     oDataModel.create("/BK_HeaderSet", oPayload, {
            //         success: function (oData) {
            //             debugger
            //             sap.m.MessageToast.show("Booking Created Successfully");
            //             this.getOwnerComponent().setModel(null, "booking");
            //             var bookingId = oData.BookingId; 
            //             var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            //                 // Pass bookingId as parameter
            //             oRouter.navTo("RouteSuccess", {
            //                 bookingId: bookingId
            //             });
            //             console.log("Before navigation Booking ID:", bookingId);
            //         }.bind(this),

            //         error: function (oError) {
            //             console.log(oError);
            //             sap.m.MessageToast.show("Error while creating booking");
            //         }
            //     });
            // }

    // onBookNow: function () { 

    //         const oModel = this.getView().getModel("booking");
    //         const total = Number(oModel.getProperty("/total")) || 0;
    //         var customerId = sessionStorage.getItem("currentUserCustomerId");

    //         //  CHECK UI INPUT ERRORS  gpt code working is this 
    //         var bHasError = false;

    //         this.getView().findAggregatedObjects(true, function (oControl) {
    //             return oControl.isA("sap.m.Input");
    //         }).forEach(function (oInput) {

    //             if (oInput.getValueState && oInput.getValueState() === "Error") {
    //                 bHasError = true;
    //             }

    //         });

    //         if (bHasError) {
    //             sap.m.MessageToast.show("Please fix quantity errors before proceeding");
    //             return;
    //         }

    //         // . CHECK TOTAL
    //         if (total === 0) {
    //             sap.m.MessageToast.show("Total amount cannot be 0");
    //             return;
    //         }

    //         // STRICT VALIDATION FOR EACH ITEM
    //         const aItems = oModel.getProperty("/items") || [];

    //         for (let i = 0; i < aItems.length; i++) {

    //             let qty = Number(aItems[i].qty);
    //             let available = Number(aItems[i].availableQty);

    //             //  NOT A NUMBER OR EMPTY
    //             if (!Number.isFinite(qty)) {
    //                 sap.m.MessageToast.show("Invalid quantity entered");
    //                 return;
    //             }

    //             //  NEGATIVE OR ZERO
    //             if (qty <= 0) {
    //                 sap.m.MessageToast.show("Quantity must be greater than 0");
    //                 return;
    //             }

    //             //  EXCEEDS AVAILABLE
    //             if (qty > available) {
    //                 sap.m.MessageToast.show("Quantity exceeds available stock");
    //                 return;
    //             }

    //             //  INFINITY OR VERY LARGE NUMBER
    //             if (!isFinite(qty) || qty > 99999) {
    //                 sap.m.MessageToast.show("Quantity value is too large");
    //                 return;
    //             }
    //         }

    //         //  BUILD PAYLOAD
    //         const aItemPayload = aItems.map(function(item) {
    //             return {
    //                 ItemId: item.id,
    //                 Quantity: String(item.qty),
    //                 Unit: item.unit,
    //                 TotalRentPerDay: item.price,
    //                 Currency: "INR",

    //                 RentStartDate: "/Date(" + new Date(item.startDate).getTime() + ")/",
    //                 RentEndDate: "/Date(" + new Date(item.endDate).getTime() + ")/"
    //             };
    //         });

    //         const oPayload = {

    //             CustomerId: customerId,

    //             BookingDate: "/Date(" + new Date().getTime() + ")/",

    //             TotalRent: oModel.getProperty("/totalRent").toFixed(3),
    //             TotalDeposit: oModel.getProperty("/totalDeposit").toFixed(3),
    //             Currency: "INR",
    //             BookingStatus: "P",
    //             PaymentStatus: "P",

    //             PaymentDate: "/Date(" + new Date().getTime() + ")/",

    //             Bk_Header_Item_Nav: aItemPayload
    //         };

    //         // ODATA CALL
    //         var oDataModel = new sap.ui.model.odata.v2.ODataModel(
    //             "/sap/opu/odata/sap/ZB18_G4_JRS_SRV"
    //         );

    //         oDataModel.create("/BK_HeaderSet", oPayload, {
    //             success: function (oData) {

    //                 sap.m.MessageToast.show("Booking Created Successfully");

    //                 this.getOwnerComponent().setModel(null, "booking");

    //                 var bookingId = oData.BookingId;

    //                 var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

    //                 oRouter.navTo("RouteSuccess", {
    //                     bookingId: bookingId
    //                 });

    //             }.bind(this),

    //             error: function () {
    //                 sap.m.MessageToast.show("Error while creating booking");
    //             }
    //         });
    //     }


        onBookNow: function () {
                var oModel     = this.getView().getModel("booking");
                var total      = Number(oModel.getProperty("/total")) || 0;
                var customerId = sessionStorage.getItem("currentUserCustomerId");
                var aItems     = oModel.getProperty("/items") || [];

                //  Check all qty inputs — find every Input in the view
                var bHasError  = false;
                var bHasEmpty  = false;

                this.getView().findAggregatedObjects(true, function (oControl) {
                    return oControl.isA("sap.m.Input") && oControl.getType() === "Number";
                }).forEach(function (oInput) {
                    var sVal = oInput.getValue();

                    // Empty field
                    if (!sVal || sVal.trim() === "") {
                        oInput.setValueState("Error");
                        oInput.setValueStateText("Quantity cannot be empty");
                        bHasEmpty = true;
                        return;
                    }

                    // Already in error state
                    if (oInput.getValueState() === "Error") {
                        bHasError = true;
                    }
                });

                if (bHasEmpty) {
                    sap.m.MessageToast.show("Please enter quantity for all items");
                    return;
                }

                if (bHasError) {
                    sap.m.MessageToast.show("Please fix quantity errors before proceeding");
                    return;
                }

                // Total cannot be 0
                if (total === 0) {
                    sap.m.MessageToast.show("Total amount cannot be 0");
                    return;
                }

                //  Validate every item in model
                for (var i = 0; i < aItems.length; i++) {
                    var oItem      = aItems[i];
                    var qty        = parseInt(oItem.qty, 10);
                    var iAvailable = Number(oItem.availableQty) || 0;

                    // Not a number
                    if (isNaN(qty)) {
                        sap.m.MessageToast.show("Invalid quantity for item: " + oItem.name);
                        return;
                    }

                    // Zero or negative
                    if (qty <= 0) {
                        sap.m.MessageToast.show("Quantity must be greater than 0 for: " + oItem.name);
                        return;
                    }

                    // Exceeds available
                    if (qty > iAvailable) {
                        sap.m.MessageToast.show(
                            "Quantity for " + oItem.name + " exceeds available stock of " + iAvailable
                        );
                        return;
                    }

                    // Too large
                    if (qty > 99999) {
                        sap.m.MessageToast.show("Quantity is too large for: " + oItem.name);
                        return;
                    }

                    //  Date validations
                    if (!oItem.startDate) {
                        sap.m.MessageToast.show("Please select Start Date for: " + oItem.name);
                        return;
                    }

                    if (!oItem.endDate) {
                        sap.m.MessageToast.show("Please select End Date for: " + oItem.name);
                        return;
                    }

                    var oStart = new Date(oItem.startDate);
                    var oEnd   = new Date(oItem.endDate);

                    if (oEnd <= oStart) {
                        sap.m.MessageToast.show("End Date must be after Start Date for: " + oItem.name);
                        return;
                    }
                }

                //  Customer ID must exist
                if (!customerId) {
                    sap.m.MessageToast.show("Session expired. Please login again.");
                    return;
                }

                // ── All validated — Build Payload ─────────────────────────

                var aItemPayload = aItems.map(function (item) {
                    return {
                        ItemId:         item.id,
                        Quantity:       String(item.qty),
                        Unit:           item.unit,
                        TotalRentPerDay: item.price,
                        Currency:       "INR",
                        RentStartDate:  "/Date(" + new Date(item.startDate).getTime() + ")/",
                        RentEndDate:    "/Date(" + new Date(item.endDate).getTime() + ")/"
                    };
                });

                var oPayload = {
                    CustomerId:    customerId,
                    BookingDate:   "/Date(" + new Date().getTime() + ")/",
                    TotalRent:     oModel.getProperty("/totalRent").toFixed(3),
                    TotalDeposit:  oModel.getProperty("/totalDeposit").toFixed(3),
                    Currency:      "INR",
                    BookingStatus: "P",
                    PaymentStatus: "P",
                    PaymentDate:   "/Date(" + new Date().getTime() + ")/",
                    Bk_Header_Item_Nav: aItemPayload
                };

                // ── OData Call ────────────────────────────────────────────
                var oDataModel = new sap.ui.model.odata.v2.ODataModel(
                    "/sap/opu/odata/sap/ZB18_G4_JRS_SRV"
                );

                oDataModel.create("/BK_HeaderSet", oPayload, {
                    success: function (oData) {
                        sap.m.MessageToast.show("Booking Created Successfully");
                        this.getOwnerComponent().setModel(null, "booking");

                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("RouteSuccess", {
                            bookingId: oData.BookingId
                        });
                    }.bind(this),

                    error: function () {
                        sap.m.MessageToast.show("Error while creating booking");
                    }
                });
            }

        });
    }
);