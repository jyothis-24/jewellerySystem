sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Status", {
      onInit: function () {

            var oData = {
                bookings: [
                    { bookingId: "BK-9021", summary: "Gold Chain x1", amount: 700, status: "PENDING" },
                    { bookingId: "BK-8842", summary: "Necklace x1, Rings x2 + 2 more...", amount: 2400, status: "PARTIALLY APPROVED" },
                    { bookingId: "BK-7710", summary: "Bangles Set x1", amount: 2600, status: "REJECTED" },
                    { bookingId: "BK-4420", summary: "Silver Earrings x4", amount: 1200, status: "APPROVED" },
                    { bookingId: "BK-1055", summary: "Classic Watch x1", amount: 5000, status: "PENDING" }
                ]
            };

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
        },

        onSearch: function (oEvent) {
            var sValue = oEvent.getParameter("newValue");

            var aFilters = [
                new Filter("bookingId", FilterOperator.Contains, sValue),
                new Filter("summary", FilterOperator.Contains, sValue)
            ];

            var oFilter = new Filter({
                filters: aFilters,
                and: false
            });

            var oList = this.byId().getContent()[1];
            oList.getBinding("items").filter(oFilter);
        },

        onFilter: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();

            var oTable = this.byId().getContent()[1];
            var oBinding = oTable.getBinding("items");

            if (sKey === "ALL") {
                oBinding.filter([]);
            } else {
                oBinding.filter([new Filter("status", FilterOperator.Contains, sKey)]);
            }
        },
        formatStatusState: function(status) {
                switch (status) {
                    case "APPROVED":
                        return sap.ui.core.ValueState.Success;
                    case "REJECTED":
                        return sap.ui.core.ValueState.Error;
                    case "PARTIALLY APPROVED":
                        return sap.ui.core.ValueState.Information;
                    default:
                        return sap.ui.core.ValueState.Warning;
                    }
        },

        onPayNow: function () {
            MessageToast.show("Pay Now clicked");
        },

        onViewFine: function () {
            MessageToast.show("View Fine clicked");
        },
        onNavBack: function() {
            debugger;
            var oRoute = this.getOwnerComponent().getRouter();
            oRoute.navTo("RouteUser")
        }

    });
});