
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Status", {
        onInit: function () {
            var oODataModel = this.getOwnerComponent().getModel(); // OData model
            var that = this;

            oODataModel.read("/ZIB18_G4_USER_STATUS", {
                success: function (oData) {

                    var aData = oData.results || [];

                    var oGrouped = [];
                    var oMap = {};

                    aData.forEach(function(item) {
                        if (!oMap[item.booking_id]) {
                            oMap[item.booking_id] = {
                                booking_id: item.booking_id,
                                items: [],
                                total_payable: item.total_payable,
                                booking_status: item.booking_status
                            };
                            oGrouped.push(oMap[item.booking_id]);
                        }
                        oMap[item.booking_id].items.push(item.item_name);
                    });

                    //  Create JSON model for grouped data
                    var oJsonModel = new sap.ui.model.json.JSONModel({
                        GroupedBookings: oGrouped
                    });

                    that.getView().setModel(oJsonModel, "grouped");
                },

                error: function () {
                    sap.m.MessageToast.show("Failed to load data");
                }
        });
    },

            // Formatter to map booking_status to UI ObjectStatus states
            formatStatusState: function (sStatus) {
                switch (sStatus) {
                    case "P":
                        return "Warning";
                    case "A":
                        return "Success";
                    case "R":
                        return "Error";
                    case "PARTIAL":
                        return "Information";
                    default:
                        return "None";
                }
            },
            // Live search handler
            onSearch: function (oEvent) {
                        var sValue = oEvent.getParameter("newValue");
                        var oTable = this.byId("tableId");
                        var oBinding = oTable.getBinding("items");

                        if (!oBinding) {
                            return; // safety check
                        }

                        var aFilters = [];

                        if (sValue && sValue.length > 0) {
                            // Create filters for multiple fields
                            var oFilter1 = new Filter("item_name", FilterOperator.Contains, sValue);
                            var oFilter2 = new Filter("booking_id", FilterOperator.Contains, sValue);

                            // Combine them with OR logic
                            var oMaster = new Filter({
                                filters: [oFilter1, oFilter2],
                                and: false // false means OR
                            });

                            // Add to the array of filters for binding
                            aFilters.push(oMaster);
                        }
                        oBinding.filter(aFilters);
                    },
            // Filter Based on the status
            onFilter: function (oEvent) {
            
                    const sKey = oEvent.getParameter("selectedItem").getKey();
                    const oTable = this.byId("tableId");
                    const oBinding = oTable.getBinding("items");

                    if (!oBinding) return;

                    if (sKey === "ALL") {
                        oBinding.filter([]);
                        return;
                    }

                    // Map select key to DB value
                    const statusMap = {
                        "PENDING": "P",
                        "APPROVED": "A",
                        "REJECTED": "R",
                        "PARTIAL": "PA"
                    };

                    const dbValue = statusMap[sKey];

                    const oStatusFilter = new Filter("booking_status", FilterOperator.EQ, dbValue);
                    oBinding.filter([oStatusFilter]);
            },
        // Back navigation
        onNavBack: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteUser");  // Adjust target route name as per your routing config
        },

        // Pay Now button press handler
        onPayNow: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();

            if (!oContext) {
                MessageToast.show("No booking selected");
                return;
            }

            // Implement  pay logic here
            MessageToast.show("Pay Now clicked for booking: " + oContext.getProperty("booking_id"));
        },

        // View Fine button press handler
        onViewFine: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();

            if (!oContext) {
                MessageToast.show("No booking selected");
                return;
            }

            // Implement your fine view logic here
            MessageToast.show("View Fine clicked for booking: " + oContext.getProperty("booking_id"));
        }

    });
});