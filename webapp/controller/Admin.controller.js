sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Admin", {
      onInit: function () {
            // Sample data model for demo purposes
            var oData = {
                statusFilters: [
                    { key: "All", text: "All Status" },
                    { key: "Pending", text: "Pending" },
                    { key: "Approved", text: "Approved" },
                    { key: "Rejected", text: "Rejected" }
                ],
                bookings: [
                    {
                        bookingId: "BK-7883",
                        customerName: "Karthik Aryan",
                        items: [
                            { itemName: "Platinum Ring", quantity: 1 }
                        ],
                        startDate: "2026-03-26",
                        endDate: "2026-03-29",
                        status: "Approved",
                        rentAmount: 2400,
                        deposit: 4800,
                        totalPaid: 7200,
                        payDate:"",
                        paymentStatus: "Pending"
                    },
                    {
                        bookingId: "BK-9928",
                        customerName: "Karthik Aryan",
                        items: [
                            { itemName: "Platinum Ring", quantity: 1 },
                            { itemName: "Gold Chain", quantity: 1 }
                        ],
                        startDate: "2026-03-26",
                        endDate: "2026-03-29",
                        status: "Rejected",
                        rentAmount: 1800,
                        deposit: 3600,
                        totalPaid: 0,
                        payDate: "",
                        paymentStatus: "NA"
                    },
                    {
                        bookingId: "BK-9921",
                        customerName: "Amala Paul",
                        items: [
                            { itemName: "Gold Necklace", quantity: 1 }
                        ],
                        startDate: "2026-03-25",
                        endDate: "2026-03-28",
                        status: "Approved",
                        paymentStatus: "Confirmed",
                        condition:"Good"
                    },
                    {
                        bookingId: "BK-8842",
                        customerName: "Vijayalakshmi",
                        items: [
                            { itemName: "Antique Bangle Set", quantity: 1 },
                            { itemName: "Temple Earrings", quantity: 1 }
                        ],
                        startDate: "2026-04-01",
                        endDate: "2026-04-05",
                        rentAmount: 2400,
                        deposit: 4800,
                        totalPaid: 7200,
                        payDate: "2023-10-12",
                        status: "Approved",
                        paymentStatus: "Completed",
                        condition:"Good"
                    }
                ]
            };

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel,"oJson");
        },

        statusStateFormatter: function (sStatus) {
            switch (sStatus) {
                case "Approved":
                    return "Success";
                case "Rejected":
                    return "Error";
                case "Pending":
                    return "Warning";
                default:
                    return "None";
            }
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("bookingId", FilterOperator.Contains, sQuery),
                        new Filter("customerName", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            this._applyFilters(aFilters);
        },

        onStatusFilterChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var aFilters = [];

            if (sKey !== "All") {
                aFilters.push(new Filter("status", FilterOperator.EQ, sKey));
            }

            this._applyFilters(aFilters);
        },

        onLogoutPress:function(){
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteLogin")
        },

        _applyFilters: function (aFilters) {
            var oTable = this.byId("bookingTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        onApprove: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            oContext.getModel().setProperty("status", "Approved", oContext);
            MessageToast.show("Booking Approved");
        },

        onReject: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            oContext.getModel().setProperty("status", "Rejected", oContext);
            MessageToast.show("Booking Rejected");
        },

        onBookingIdPress: function (oEvent) {
            var sBookingId = oEvent.getSource().getText();
            MessageToast.show("Booking clicked: " + sBookingId);
            // Implement navigation or details popup here if needed
        
        
    },
    onSearchPay: function (oEvent) {
            var sValue = oEvent.getParameter("newValue");

            var oTable = this.byId();
            var oBinding = this.byId().getBinding("items");

            if (!oBinding) return;

            if (sValue) {
                var oFilter = new Filter(
                    "customerName",
                    FilterOperator.Contains,
                    sValue
                );
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },

        //  Filter by payment status
        onFilterPress: function () {
            var oTable = this.byId();
            var oBinding = this.byId().getBinding("items");

            var oFilter = new Filter(
                "paymentStatus",
                FilterOperator.EQ,
                "Pending"
            );

            oBinding.filter([oFilter]);
        }
      
    });
});