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
    
    this._refreshBookings();
    const oModel = this.getOwnerComponent().getModel();

    oModel.read("/ZIB18_G4_Admin_Book", {
        success: function (oData) {

            const aGrouped = this._groupBookings(oData.results);

            const oJsonModel = new sap.ui.model.json.JSONModel(aGrouped);
            this.getView().setModel(oJsonModel, "grouped");

        }.bind(this)
    });

    // Create a JSON model to store today's date
    const oJson = new sap.ui.model.json.JSONModel();
    var oView = this.getView();
    
    // Get today's date in "yyyy-MM-dd" format
    var today = new Date();
    var todayString = today.toISOString().split('T')[0]; // Get date in "yyyy-MM-dd" format

    // Set today's date in the model
    oJson.setProperty("/minReturnDate", today);
    
    // Set the model to the view
    oView.setModel(oJson, "todayModel");

    
},

_groupBookings: function (aData) {

    const oBookings = {};

    aData.forEach(item => {

        const bookingId = item.BookingID;

        if (!oBookings[bookingId]) {
            oBookings[bookingId] = {
                BookingID: bookingId,
                CustomerFullName: item.CustomerFullName,
                BookingStatusDescription: item.BookingStatusDescription,
                BookingCurrentStatus: item.BookingCurrentStatus,
                PaymentStatusDescription: item.PaymentStatusDescription,
                PaymentCurrentStatus: item.PaymentCurrentStatus,
                RentalStartDate: item.RentalStartDate,
                RentalEndDate: item.RentalEndDate,
                Items: []
            };
        }

        const existingItem = oBookings[bookingId].Items.find(i => i.ItemDescription === item.ItemDescription);

        if (existingItem) {
            existingItem.Quantity += item.Quantity ? Number(item.Quantity) : 1;
        } else {
            oBookings[bookingId].Items.push({
                ItemDescription: item.ItemDescription,
                Quantity: item.Quantity ? Number(item.Quantity) : 1,
                ItemIDs: [item.ItemID]
            });
        }

    });

    return Object.values(oBookings);
},
onRejectPress: function (oEvent) {
    const oContext = oEvent.getSource().getBindingContext("grouped");

    if (!oContext) {
        sap.m.MessageToast.show("No booking selected");
        return;
    }

    this._oRejectContext = oContext;
    const sBookingId = oContext.getProperty("BookingID");

    if (!sBookingId) {
        sap.m.MessageToast.show("Booking ID not found");
        return;
    }

    // Open confirmation dialog
    this._openRejectConfirmationDialog(sBookingId);
},
_openRejectConfirmationDialog: function (sBookingId) {
    // Use existing dialog fragment 'Popup' to confirm rejection
    if (!this._confirmationDialog) {
        this._confirmationDialog = new sap.m.Dialog({
            title: "Confirm Rejection",
            content: new sap.m.Text({ text: "Are you sure you want to reject this booking?" }),
            beginButton: new sap.m.Button({
                text: "Yes",
                press: function() {
                    this._rejectBooking(sBookingId);  // Call the rejection update method
                    this._confirmationDialog.close();
                }.bind(this)
            }),
            endButton: new sap.m.Button({
                text: "No",
                press: function() {
                    this._confirmationDialog.close();  // Close dialog without rejecting
                }.bind(this)
            })
        });
        this.getView().addDependent(this._confirmationDialog);
    }

    this._confirmationDialog.open();
},
_rejectBooking: function (sBookingId) {
    debugger
    const oModel = this.getView().getModel();
    const sPath = `/BK_HeaderSet(BookingId='${sBookingId}')`;  // Adjust the OData path as necessary

    // Send the status update to OData backend
    const oPayload = {
        BookingStatus : "R"  
    };

    oModel.update(sPath, oPayload, {
        success: function () {
            this._refreshBookings();  // Refresh data to reflect changes
            sap.m.MessageToast.show("Booking successfully rejected");
            
        },
        error: function (oError) {
            console.error("Error rejecting booking:", oError);
            sap.m.MessageToast.show("Rejection failed");
        }
    });
},

onRejectCancel: function () {
    if (this._confirmationDialog) {
        this._confirmationDialog.close();
    }
},
_refreshBookings: function () {
    debugger
    const oModel = this.getOwnerComponent().getModel();

    oModel.read("/ZIB18_G4_Admin_Book", {
        success: function (oData) {

            const aGrouped = this._groupBookings(oData.results);

            const oJsonModel = new sap.ui.model.json.JSONModel(aGrouped);
            this.getView().setModel(oJsonModel, "grouped");

        }.bind(this)
    });
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
    
    formatTotalQty: function (aItems) {
            if (!aItems || !Array.isArray(aItems)) return 0;
            var total = 0;
            aItems.forEach(function (item) {
                total += Number(item.Quantity) || 0;
            });
            return total;
    },

    onSortBooking: function () {

    var oTable = this.byId("bookingTable");
    var oBinding = oTable.getBinding("items");

    var oSorter = new sap.ui.model.Sorter(
        "BookingID",   // field name
         true       // true = DESCENDING (Newest first)
    );

    oBinding.sort(oSorter);
},
     
        onSearch: function (oEvent) {
                var sQuery = oEvent.getParameter("newValue");
                var oTable = this.byId("bookingTable");
                var oBinding = oTable.getBinding("items");
                var aFilters = [];
                    if (sQuery) {
                        var oFilter1 = new sap.ui.model.Filter(
                            "CustomerFullName",
                            sap.ui.model.FilterOperator.Contains,
                            sQuery
                        );
                        var oFilter2 = new sap.ui.model.Filter(
                            "BookingID",
                            sap.ui.model.FilterOperator.Contains,
                            sQuery
                        );
                        // OR condition
                        var oSearchFilter = new sap.ui.model.Filter({
                            filters: [oFilter1, oFilter2],
                            and: false
                        });
                        aFilters.push(oSearchFilter);
                    }
                // Combine with existing status filter if any
                if (this._statusFilter) {
                    aFilters.push(this._statusFilter);
                }
                oBinding.filter(aFilters);
        },
    onFilterChange: function(oEvent) {
        debugger
            // Get selected key from the dropdown
            var sKey = oEvent.getSource().getSelectedKey();
            // Get the table and its binding
            var oTable = this.byId("bookingTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];
            // Map dropdown keys to your backend status codes
            if (sKey === "pending") {
                aFilters.push(new sap.ui.model.Filter("BookingCurrentStatus", "EQ", "P"));
            } else if (sKey === "approved") {
                aFilters.push(new sap.ui.model.Filter("BookingCurrentStatus", "EQ", "A"));
            } else if (sKey === "rejected") {
                aFilters.push(new sap.ui.model.Filter("BookingCurrentStatus", "EQ", "R"));
            }
            // "all" or no selection → no filter needed
            // Apply filter to the table
            oBinding.filter(aFilters);
    },
       
    onLogoutPress: function () {
                var oRouter = this.getOwnerComponent().getRouter();

                // Navigate to login
                oRouter.navTo("RouteLogin");
                // Clear the session variable (currentUserCustomerId) on logout
                sessionStorage.removeItem("currentUserCustomerId");

                // Clear browser history so back button cannot return to this page
                window.history.pushState(null, "", window.location.href);
                window.onpopstate = function () {
                window.history.pushState(null, "", window.location.href);
                };
    },

        _applyFilters: function (aFilters) {
            var oTable = this.byId("bookingTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },


 
    onApprovePress: function (oEvent) {

        const oContext = oEvent.getSource().getBindingContext("grouped");
        const sBookingId = oContext.getProperty("BookingID");
        this._oApproveContext = oContext;
        const oModel = this.getView().getModel();

    oModel.read("/ZIB18_G4_Admin_Book", {
        filters: [
            new sap.ui.model.Filter("BookingID", "EQ", sBookingId)
        ],
        success: function (oData) {

            const aItems = oData.results || [];

            const oGrouped = {};

            aItems.forEach(item => {

                const key = item.ItemDescription;

                if (!oGrouped[key]) {
                    oGrouped[key] = {
                        ItemDescription: item.ItemDescription,
                        Quantity: 0,
                        ItemIDs: []
                    };
                }

                oGrouped[key].Quantity += item.Quantity ? Number(item.Quantity) : 1;
                oGrouped[key].ItemIDs.push(item.ItemID);

            });

            this._openApproveDialog({
                BookingID: sBookingId,
                items: Object.values(oGrouped)
            });

        }.bind(this)
    });
},

        //// Partial Updation Code

        _openApproveDialog: function (oBooking) {
            if (!this._approveDialog) {
                this.loadFragment({
                    name: "com.applexus.finalproject.fragments.Approvepopup",
                    controller: this
                }).then(function (oDialog) {
                    this._approveDialog = oDialog;
                    this.getView().addDependent(this._approveDialog);

                    this._populateApproveDialog(oBooking);
                    this._approveDialog.open();
                }.bind(this));
            } else {
                this._populateApproveDialog(oBooking);
                this._approveDialog.open();
            }
        },

//         _populateApproveDialog: function (oBooking) {

//     const oVBox = this._approveDialog.getContent()[0];
//     oVBox.removeAllItems();

//     oBooking.items.forEach(item => {

//         const oCheckBox = new sap.m.CheckBox({
//             text: `${item.ItemDescription} (Qty: ${item.Quantity})`,
//             selected: true,
//             select: this._onItemSelect.bind(this)
//         });

//         oCheckBox.data("itemIds", item.ItemIDs);

//         const oHBox = new sap.m.HBox({
//             items: [oCheckBox]
//         });

//         oVBox.addItem(oHBox);

//     });
// },

// _onItemSelect: function (oEvent) {

//     const oCheckBox = oEvent.getSource();
//     const oHBox = oCheckBox.getParent();
  
//     if (!oCheckBox.getSelected()) {
//         oHBox.addStyleClass("strikethrough");
//     } else {
//         oHBox.removeStyleClass("strikethrough");
//     }
// },
      
// onApproveConfirm: function () {

//     const oVBox = this._approveDialog.getContent()[0];
//     const aItems = oVBox.getItems();

//     const aApprovedItems = [];

//     aItems.forEach(oHBox => {
//         const oCheckBox = oHBox.getItems()[0];

//         if (oCheckBox.getSelected()) {
//             aApprovedItems.push(...oCheckBox.data("itemIds"));
//         }
//     });

//     const sBookingId = this._oApproveContext.getProperty("BookingID");
     

//     const sApproverId = sessionStorage.getItem("currentUserCustomerId");

//     const sNewStatus =
//         (aApprovedItems.length === aItems.length) ? "A" : "B";

//     const oModel = this.getView().getModel();

//     const sPath = `/BK_HeaderSet(BookingId='${sBookingId}')`;

//     oModel.update(sPath, {
//         BookingStatus: sNewStatus,
//         ApproverId: sApproverId
//     }, {
//         success: function () {
//             sap.m.MessageToast.show("Updated successfully");
//             this._approveDialog.close();
//             oModel.refresh(true);
//         }.bind(this)
//     });
// },

_populateApproveDialog: function (oBooking) {
    const oVBox = this._approveDialog.getContent()[0];
    oVBox.removeAllItems();

    oBooking.items.forEach(item => {
        // Just display text, no checkbox
        const oText = new sap.m.Text({
            text: `${item.ItemDescription} (Qty: ${item.Quantity})`
        });

        const oHBox = new sap.m.HBox({
            items: [oText]
        });

        oVBox.addItem(oHBox);
    });
},
onApproveConfirm: function () {
    const sBookingId = this._oApproveContext.getProperty("BookingID");
    const sApproverId = sessionStorage.getItem("currentUserCustomerId");
    
    const oModel = this.getView().getModel();
    const sPath = `/BK_HeaderSet(BookingId='${sBookingId}')`;

    oModel.update(sPath, {
        BookingStatus: "A", // all approved
        ApproverId: sApproverId
    }, {
        success: function () {
            sap.m.MessageToast.show("Updated successfully");
            this._approveDialog.close();
            this._refreshBookings();
        }.bind(this)
    });
},

        onApproveCancel: function () {
            if (this._approveDialog) {
                this._approveDialog.close();
            }
        },




    //Return Management


    onMasterSearch: function (oEvent) {

            var sQuery = oEvent.getParameter("newValue");

            var oList = this.byId("bookingList");
            var oBinding = oList.getBinding("items");

            var aFilters = [];

            if (sQuery && sQuery.length > 0) {

                var oFilter1 = new sap.ui.model.Filter(
                    "BookingID",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );

                var oFilter2 = new sap.ui.model.Filter(
                    "CustomerName",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );

                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: [oFilter1, oFilter2],
                    and: false
                });

                aFilters.push(oCombinedFilter);
            }

            oBinding.filter(aFilters);
   },
        onSelectBooking: function (oEvent) {
            debugger
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext();
            const oBooking = oContext.getObject();

            this.byId("detailPage").setBindingContext(oContext);

            const oModel = this.getView().getModel();
            const sBookingId = oBooking.BookingID;

            oModel.read("/ZIB18_G4_Return_Items(p_booking_id='" + sBookingId + "')/Set", {
                success: (oData) => {

                    const aItems = oData.results.map(item => ({
                        ...item,
                        ReturnedQty: item.ReturnedQty || 0,
                        Status: item.Status || "R",
                        Condition: item.Conditions ? (item.Conditions === "true" ? "G" : "B") : "G",
                        ReturnDate: item.ReturnDate || null,
                        CalculatedFine: item.CalculatedFine || 0,
                        LeftQty: item.left_qty || 0
                    }));

                    const oJson = new sap.ui.model.json.JSONModel(aItems);
                    this.getView().setModel(oJson, "itemsModel");
                },
                error: () => {
                    sap.m.MessageToast.show("Failed to load items");
                }
            });

            this.byId("splitApp").toDetail(this.byId("detailPage"));
        },

        _formatDate: function (sDate) {

            if (!sDate) return null;

            let oDate;

            // Case 1: already JS Date
            if (sDate instanceof Date) {
                oDate = new Date(sDate);
            }

            // Case 2: string like yyyy-mm-dd
            else if (typeof sDate === "string" && sDate.includes("-")) {
                const aParts = sDate.split("-");

                oDate = new Date(
                    parseInt(aParts[0], 10),
                    parseInt(aParts[1], 10) - 1,
                    parseInt(aParts[2], 10),
                    12, 0, 0, 0 //  avoid timezone issue
                );
            }

            // Case 3: fallback
            else {
                oDate = new Date(sDate);
                oDate.setHours(12, 0, 0, 0);
            }

            return "/Date(" + oDate.getTime() + ")/";
        }, 

        onRowSave: function (oEvent) {
            debugger;

            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext("itemsModel");
            const item = oContext.getObject();

            const oView = this.getView();
            const oModel = oView.getModel();

            const oHeader = this.byId("detailPage").getBindingContext().getObject();

            // ================= VALIDATIONS =================

            // Date
            const formattedDate = this._formatDate(item.ReturnDate);
            if (!formattedDate && item.Status !== 'L') {
                sap.m.MessageToast.show("Select return date");
                return;
            }
                //  LOST (L)
                if (item.Status === "L") {
                    item.Condition = "";
                }

                //  RETURNED (R)
                if (item.Status === "R") {

                    if (!item.ReturnedQty || item.ReturnedQty <= 0) {
                        sap.m.MessageToast.show("Enter the correct returned quantity");
                        return;
                    }

                    if ( item.ReturnedQty >= item.left_qty) {
                        sap.m.MessageToast.show("Returned qty cannot exceed  left qty ");
                        return;
                    }
                    if (!item.Conditions || item.Conditions === "") {
                            sap.m.MessageToast.show("Select Item condition (Good/Bad)");
                            return;
                    }
                

                }
                if (!item.ReturnedQty )
                {
                    sap.m.MessageToast.show("Please Enter the Return Quantity");
                    return;
                }
                if (parseInt(oData.ReturnedQty) > parseInt(oData.LeftQty)) {
                        sap.m.MessageToast.show("Returned qty cannot exceed left quantity");
                        return;
                }
                

            // ================= PAYLOAD =================

            const oPayload = {
                BookingId: oHeader.BookingID,
                ItemId: item.ItemID,
                ReturnedQuantity: item.ReturnedQty||0,
                Status: item.Status,                      
                ItemCondn: item.Conditions,
                ActualReturnDate: formattedDate ||  "/Date(000000000)/",
                CurrKey: oHeader.Currency,
                Unit: item.Unit
            };

            // ================= CALL ODATA =================

            // oButton.setBusy(true);

            oModel.create("/ReturnSet", oPayload, {
                success: (oData) => {

                    //  Lock row after save
                    // item.Status = item.Status === "L" ? "L" : "R";
                    item.Status = "R";  
                    //  Update fine
                    item.CalculatedFine = oData.CalculatedFine;

                    oView.getModel("itemsModel").refresh();

                    sap.m.MessageToast.show("Saved item " + item.ItemID);

                

                    const aItems = oView.getModel("itemsModel").getData();

                    const allDone = aItems.every(i => i.Status === "R" || i.Status === "L");

                    if (allDone) {

                        let totalFine = aItems.reduce((sum, i) => {
                            return sum + (parseFloat(i.CalculatedFine) || 0);
                        }, 0);

                        let deposit = oHeader.Deposit || 0;
                        let refund = deposit - totalFine;

                        oView.getModel("itemsModel").setProperty("/allReturned", true);
                        oView.getModel("itemsModel").setProperty("/totalFine", totalFine);
                        oView.getModel("itemsModel").setProperty("/refund", refund);

                        sap.m.MessageBox.information(
                            "All items processed!\n\n" +
                            "Total Fine: ₹ " + totalFine + "\n" +
                            "Deposit: ₹ " + deposit + "\n" +
                            "Refund: ₹ " + refund
                        );
                    }
                },

                error: () => {
                    sap.m.MessageToast.show("Error saving item");
                }

            });
        },


    // Payment Monitoring 

            onFilterSelect: function (oEvent) {
                var sKey = oEvent.getParameter("item").getKey();

                var oTable = this.byId("idPaymentTable");
                var oBinding = oTable.getBinding("items");

                var aFilters = [];

                if (sKey !== "ALL") {
                    aFilters.push(new sap.ui.model.Filter(
                        "PaymentCurrentStatus",
                        sap.ui.model.FilterOperator.EQ,
                        sKey
                    ));
                }

                oBinding.filter(aFilters);
        },
            onSearchPay: function (oEvent) {
                var sQuery = oEvent.getParameter("newValue");

                var oTable = this.byId("idPaymentTable");
                var oBinding = oTable.getBinding("items");

                var aFilters = [];

                if (sQuery) {
                    var oFilter1 = new sap.ui.model.Filter("CustomerName", sap.ui.model.FilterOperator.Contains, sQuery);
                    var oFilter2 = new sap.ui.model.Filter("BookingID", sap.ui.model.FilterOperator.Contains, sQuery);

                    // OR condition
                    var oCombinedFilter = new sap.ui.model.Filter({
                        filters: [oFilter1, oFilter2],
                        and: false
                    });

                    aFilters.push(oCombinedFilter);
                }

                oBinding.filter(aFilters);
        },



        //Item Inventory fragments

        // onEditRow: function(oEvent) {
        //         debugger
        //         // Get the button that was clicked
        //         var oButton = oEvent.getSource();

        //         // Find the parent ColumnListItem (row)  (orignal)
        //         var oRow = oButton.getParent(); // HBox
        //         while (oRow && !oRow.isA("sap.m.ColumnListItem")) {
        //             oRow = oRow.getParent();
        //         }

        //         if (!oRow) return; // safety check

        //         var aCells = oRow.getCells();

        //         // Make editable only columns after first two (index > 1) and before last (Actions)
        //         aCells.forEach(function(cell, index) {
        //             if ((cell.isA("sap.m.Input") || cell.isA("sap.m.Select")) && index > 1 && index < aCells.length - 1) {
        //                 cell.setEditable(true);
        //             }
        //         });

        //         // Enable Save, disable Edit in this row
        //         var oActions = aCells[aCells.length - 1]; // last cell (HBox)
        //         oActions.getItems().forEach(function(btn) {
        //             if (btn.getText && btn.getText() === "Edit") btn.setEnabled(false);
        //             if (btn.getText && btn.getText() === "Save") btn.setEnabled(true);
        //         });
        //     },
        //     onSaveRow: function(oEvent) {
        //         debugger
        //     var oButton = oEvent.getSource();

        //     // Traverse up to find the row
        //     var oRow = oButton.getParent();
        //     while (oRow && !oRow.isA("sap.m.ColumnListItem")) {
        //         oRow = oRow.getParent();
        //     }
        //     if (!oRow) return;

        //     var aCells = oRow.getCells();

        //     // Assume first cells are editable inputs: total_qty and available_qty
        //     var sTotalQty = aCells[4].getValue();      // adjust index based on your table
        //     var sAvailableQty = aCells[5].getValue();  // adjust index based on your table
        //     var sItemId = oRow.getBindingContext().getProperty("item_id"); // key

        //     // Make editable fields non-editable again
        //     aCells.forEach(function(cell) {
        //         if (cell.isA("sap.m.Input") || cell.isA("sap.m.Select")) {
        //             cell.setEditable(false);
        //         }
        //     });

        //     // Reset buttons in this row
        //     var oActions = aCells[aCells.length - 1]; // HBox with buttons
        //     if (oActions.isA("sap.m.HBox")) {
        //         oActions.getItems().forEach(function(btn) {
        //             if (btn.getText && btn.getText() === "Edit") btn.setEnabled(true);
        //             if (btn.getText && btn.getText() === "Save") btn.setEnabled(false);
        //         });
        //     }

        //     // PATCH OData call
        //     var oModel = this.getView().getModel(); // default OData model
        //     var sPath = "/ZIB18_G4_ITEM('" + sItemId + "')"; // EntitySet + Key

        //     var oPayload = {
        //         total_qty: sTotalQty,
        //         available_qty: sAvailableQty
        //     };

        //     oModel.update(sPath, oPayload, {
        //         success: function() {
        //             sap.m.MessageToast.show("Row saved and backend updated successfully!");
        //         },
        //         error: function(oError) {
        //             console.error("OData update failed:", oError);
        //             sap.m.MessageToast.show("Backend update failed!");

        //             // Optional: revert inputs to previous values if needed  (orginal)
        //         }
        //     });
        // },
         
    onEditRow: function(oEvent) {
            var oButton = oEvent.getSource();

            var oRow = oButton.getParent();
            while (oRow && !oRow.isA("sap.m.ColumnListItem")) {
                oRow = oRow.getParent();
            }
            if (!oRow) return;

            var aCells = oRow.getCells();

            // Make fields editable
            aCells.forEach(function(cell, index) {
                if ((cell.isA("sap.m.Input") || cell.isA("sap.m.Select")) && index > 1 && index < aCells.length - 1) {
                    cell.setEditable(true);
                }
            });

            var oTotalInput     = aCells[4];
            var oAvailableInput = aCells[5];

            // Live validation as user types
            var fnValidate = function() {
                var iTotal     = parseInt(oTotalInput.getValue(), 10);
                var iAvailable = parseInt(oAvailableInput.getValue(), 10);

                // Reset first
                oTotalInput.setValueState("None");
                oTotalInput.setValueStateText("");
                oAvailableInput.setValueState("None");
                oAvailableInput.setValueStateText("");

                //  BOTH 0 = allowed (item discontinued) — skip all checks
                if (!isNaN(iTotal) && !isNaN(iAvailable) && iTotal === 0 && iAvailable === 0) {
                    oTotalInput.setValueState("Warning");
                    oTotalInput.setValueStateText("Item will be marked as discontinued (0 stock)");
                    oAvailableInput.setValueState("Warning");
                    oAvailableInput.setValueStateText("Item will be marked as discontinued (0 stock)");
                    return;
                }

                // Only Total = 0 (but Available is not)
                if (!isNaN(iTotal) && iTotal === 0 && !isNaN(iAvailable) && iAvailable !== 0) {
                    oTotalInput.setValueState("Error");
                    oTotalInput.setValueStateText("Total Qty cannot be 0 when Available Qty is " + iAvailable);
                    return;
                }

                // Only Available = 0 (but Total is not)
                if (!isNaN(iAvailable) && iAvailable === 0 && !isNaN(iTotal) && iTotal !== 0) {
                    oAvailableInput.setValueState("Error");
                    oAvailableInput.setValueStateText("Available Qty cannot be 0 when Total Qty is " + iTotal);
                    return;
                }

                // Available > Total
                if (!isNaN(iTotal) && !isNaN(iAvailable) && iAvailable > iTotal) {
                    oTotalInput.setValueState("Warning");
                    oTotalInput.setValueStateText("Total Qty is less than Available Qty");
                    oAvailableInput.setValueState("Error");
                    oAvailableInput.setValueStateText(
                        "Available (" + iAvailable + ") cannot exceed Total (" + iTotal + ")"
                    );
                }
            };

            oTotalInput.attachLiveChange(fnValidate);
            oAvailableInput.attachLiveChange(fnValidate);

            // Enable Save, disable Edit
            var oActions = aCells[aCells.length - 1];
            oActions.getItems().forEach(function(btn) {
                if (btn.getText && btn.getText() === "Edit") btn.setEnabled(false);
                if (btn.getText && btn.getText() === "Save") btn.setEnabled(true);
            });
    },

    onSaveRow: function(oEvent) {
            var oButton = oEvent.getSource();

            var oRow = oButton.getParent();
            while (oRow && !oRow.isA("sap.m.ColumnListItem")) {
                oRow = oRow.getParent();
            }
            if (!oRow) return;

            var aCells          = oRow.getCells();
            var oTotalInput     = aCells[4];
            var oAvailableInput = aCells[5];

            var iTotalQty     = parseInt(oTotalInput.getValue(), 10);
            var iAvailableQty = parseInt(oAvailableInput.getValue(), 10);

            // Reset states
            oTotalInput.setValueState("None");
            oTotalInput.setValueStateText("");
            oAvailableInput.setValueState("None");
            oAvailableInput.setValueStateText("");

            // ── Validations ───────────────────────────────────────────

            // 1. Total Qty empty or invalid
            if (isNaN(iTotalQty)) {
                oTotalInput.setValueState("Error");
                oTotalInput.setValueStateText("Please enter a valid Total Qty");
                sap.m.MessageToast.show("Please fix the errors before saving.");
                return;
            }

            // 2. Available Qty empty or invalid
            if (isNaN(iAvailableQty)) {
                oAvailableInput.setValueState("Error");
                oAvailableInput.setValueStateText("Please enter a valid Available Qty");
                sap.m.MessageToast.show("Please fix the errors before saving.");
                return;
            }

            //  3. BOTH = 0 → allowed, show confirmation and save
            if (iTotalQty === 0 && iAvailableQty === 0) {
                sap.m.MessageBox.confirm(
                    "Both Total and Available Qty are 0. This item will be marked as discontinued. Do you want to continue?",
                    {
                        title: "Confirm Discontinue",
                        onClose: function(oAction) {
                            if (oAction === sap.m.MessageBox.Action.OK) {
                                // User confirmed — proceed to save
                                this._doSave(oRow, aCells, iTotalQty, iAvailableQty);
                            }
                            // If Cancel — do nothing, stay in edit mode
                        }.bind(this)
                    }
                );
                return; // wait for confirmation
            }

            // 4. Only Total = 0 (Available is not 0)
            if (iTotalQty === 0 && iAvailableQty !== 0) {
                oTotalInput.setValueState("Error");
                oTotalInput.setValueStateText("Total Qty cannot be 0 when Available Qty is " + iAvailableQty);
                sap.m.MessageToast.show("Please fix the errors before saving.");
                return;
            }

            // 5. Only Available = 0 (Total is not 0)
            if (iAvailableQty === 0 && iTotalQty !== 0) {
                oAvailableInput.setValueState("Error");
                oAvailableInput.setValueStateText("Available Qty cannot be 0 when Total Qty is " + iTotalQty);
                sap.m.MessageToast.show("Please fix the errors before saving.");
                return;
            }

            // 6. Available > Total
            if (iAvailableQty > iTotalQty) {
                oTotalInput.setValueState("Warning");
                oTotalInput.setValueStateText("Total Qty is less than Available Qty");
                oAvailableInput.setValueState("Error");
                oAvailableInput.setValueStateText(
                    "Available (" + iAvailableQty + ") cannot exceed Total (" + iTotalQty + ")"
                );
                sap.m.MessageToast.show("Please fix the errors before saving.");
                return;
            }

            // ── All valid — proceed to save ───────────────────────────
            this._doSave(oRow, aCells, iTotalQty, iAvailableQty);
    },

// ── Separate save function (reused for both normal and both-0 case) ──
    _doSave: function(oRow, aCells, iTotalQty, iAvailableQty) {

            // Make fields non-editable and clear states
            aCells.forEach(function(cell) {
                if (cell.isA("sap.m.Input") || cell.isA("sap.m.Select")) {
                    cell.setEditable(false);
                    if (cell.isA("sap.m.Input")) {
                        cell.setValueState("None");
                    }
                }
            });

            // Reset Edit / Save buttons
            var oActions = aCells[aCells.length - 1];
            if (oActions.isA("sap.m.HBox")) {
                oActions.getItems().forEach(function(btn) {
                    if (btn.getText && btn.getText() === "Edit") btn.setEnabled(true);
                    if (btn.getText && btn.getText() === "Save") btn.setEnabled(false);
                });
            }

            // OData update
            var sItemId = oRow.getBindingContext().getProperty("item_id");
            var sPath   = "/ZIB18_G4_ITEM('" + sItemId + "')";
            var oModel  = this.getView().getModel();

            oModel.update(sPath, {
                total_qty:     String(iTotalQty),
                available_qty: String(iAvailableQty)
            }, {
                success: function() {
                    if (iTotalQty === 0 && iAvailableQty === 0) {
                        sap.m.MessageToast.show("Item marked as discontinued successfully!");
                    } else {
                        sap.m.MessageToast.show("Saved successfully!");
                    }
                },
                error: function(oError) {
                    console.error("OData update failed:", oError);
                    sap.m.MessageToast.show("Backend update failed!");
                }
            });
    },
       
        onFilterPress: function() {
            var oTable = this.byId("idInventoryTable");
            var oBinding = oTable.getBinding("items");

            sap.m.MessageBox.prompt("Enter Product Name to filter:", {
                title: "Filter by Product Name",
                onClose: function(oAction, sValue) {
                    if (oAction === sap.m.MessageBox.Action.OK && sValue) {
                        var oFilter = new sap.ui.model.Filter(
                            "item_name",
                            sap.ui.model.FilterOperator.Contains,
                            sValue
                        );
                        oBinding.filter([oFilter]);
                    } else if (oAction === sap.m.MessageBox.Action.OK && !sValue) {
                        // Reset filter if input empty
                        oBinding.filter([]);
                    }
                }
            });
        },

        // Live search field
        onFilterItem: function () {
            // Get table
            var oTable = this.byId("idInventoryTable");

            // Get binding (OData already bound)
            var oBinding = oTable.getBinding("items");

            // Create input dialog (simple prompt)
            if (!this._oFilterDialog) {
                this._oFilterDialog = new sap.m.Dialog({
                    title: "Filter by Product Name",
                    content: [
                        new sap.m.Input("filterInput", {
                            placeholder: "Enter Product Name"
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Apply",
                        press: function () {
                            var sValue = sap.ui.getCore().byId("filterInput").getValue();
                            var aFilters = [];
                            if (sValue) {
                                aFilters.push(
                                    new sap.ui.model.Filter(
                                        "item_name", // CDS field
                                        sap.ui.model.FilterOperator.Contains,
                                        sValue
                                    )
                                );
                            }
                            oBinding.filter(aFilters);
                            this._oFilterDialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Clear",
                        press: function () {
                            oBinding.filter([]); // remove filter
                            sap.ui.getCore().byId("filterInput").setValue("");
                            this._oFilterDialog.close();
                        }.bind(this)
                    })
                });
            }

            this._oFilterDialog.open();
        },
            // inventory add new item 
        // onAddNewItem: function () {
        //         debugger
        //         var customerId = sessionStorage.getItem("currentUserCustomerId");
        //          // Get today's date and set time to 12:00:00 (noon)
        //         var currentDate = new Date();
        //         currentDate.setHours(12, 0, 0, 0);  // Setting time to 12:00:00.000
        //         // Format the time as HH:mm:ss
        //         var hours = currentDate.getHours().toString().padStart(2, '0');
        //         var minutes = currentDate.getMinutes().toString().padStart(2, '0');
        //         var seconds = currentDate.getSeconds().toString().padStart(2, '0');

        //         // Combine into time string: 12:00:00
        //         var timeString = `${hours}:${minutes}:${seconds}`;

        //         var oNewItemModel = new sap.ui.model.json.JSONModel({
        //             item_id: "",
        //             item_name: "",
        //             type: "Oxidized Silver",
        //             category: "Traditional",
        //             quant_unit: "PC",        
        //             total_qty: "",
        //             available_qty: "",
        //             rent_per_day: "",
        //             deposit: "",          
        //             curr_key: "INR",        
        //             image_url: "",    
        //             created_on: currentDate.toISOString().split("T")[0],      
        //             created_at: timeString,    
        //             created_by: customerId,  // Setting 'created_by' to the customer ID from session storage
                    
        //         });

        //         this.getView().setModel(oNewItemModel, "newItem");
                
        //         if (!this._oDialog) {
        //             this.loadFragment({
        //                 name: "com.applexus.finalproject.fragments.Itempop",
        //                 controller: this
        //             }).then(function (oDialog) {
        //                 this._oDialog = oDialog;
        //                 this.getView().addDependent(oDialog);
        //                 oDialog.open();
        //             }.bind(this));
        //         } else {
        //             this._oDialog.open();
        //         }
        // },
onAddNewItem: function () {
    debugger;
    var customerId = sessionStorage.getItem("currentUserCustomerId");

    // Get today's date and set time to 12:00:00 (noon)
    var currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);  // Set time to 12:00:00.000 (local time)

    // Format the time as HH:mm:ss
    var hours = currentDate.getHours().toString().padStart(2, '0');
    var minutes = currentDate.getMinutes().toString().padStart(2, '0');
    var seconds = currentDate.getSeconds().toString().padStart(2, '0');

    // Combine into time string: "12:00:00"
    var timeString = `${hours}:${minutes}:${seconds}`;

    // Convert time to SAP OData duration format: PT12H00M00S
    var durationString = `PT${hours}H${minutes}M${seconds}S`;

    // Convert currentDate to Unix timestamp (milliseconds since Jan 1, 1970)
    var createdOnTimestamp = currentDate.getTime();  // This gives milliseconds since 1970
    var createdOnDate = "/Date(" + createdOnTimestamp + ")/";  // SAP format: /Date(XXXXXXXXXXXX)/

    var oNewItemModel = new sap.ui.model.json.JSONModel({
        item_id: "",
        item_name: "",
        type: "Oxidized Silver",
        category: "Traditional",
        quant_unit: "PC",        
        total_qty: "",
        available_qty: "",
        rent_per_day: "",
        deposit: "",          
        curr_key: "INR",        
        image_url: "",    
        created_on: createdOnDate,  // SAP format: /Date(XXXXXXXXXXXX)/
        created_at: durationString, // SAP duration format: PT12H00M00S
        created_by: customerId,     // Setting 'created_by' to the customer ID from session storage
    });

    this.getView().setModel(oNewItemModel, "newItem");

    // Open the dialog box for item creation
    if (!this._oDialog) {
        this.loadFragment({
            name: "com.applexus.finalproject.fragments.Itempop",
            controller: this
        }).then(function (oDialog) {
            this._oDialog = oDialog;
            this.getView().addDependent(oDialog);
            oDialog.open();
        }.bind(this));
    } else {
        this._oDialog.open();
    }
},

        // onSaveNewItem: function () {
                
        //         var oModel = this.getView().getModel();
        //         var oData = this.getView().getModel("newItem").getData();

        //         if (!oData.item_name) {
        //             sap.m.MessageToast.show("Product Name is required");
        //             return;
        //         }
        //             var iTotalQty = parseInt(oData.total_qty, 10);
        //             var iAvailableQty = parseInt(oData.available_qty, 10);

        //             //  Check valid numbers
        //             if (isNaN(iTotalQty) || isNaN(iAvailableQty)) {
        //                 sap.m.MessageToast.show("Enter valid quantities");
        //                 return;
        //             }

        //             //  Your main condition
        //             if (iAvailableQty > iTotalQty) {
        //                 sap.m.MessageToast.show("Available Qty cannot be greater than Total Qty");
        //                 return;
        //             }
        //         debugger
        //         oModel.create("/ZIB18_G4_ITEM", oData, {
        //             success: function () {
        //                 sap.m.MessageToast.show("Item Added Successfully");
        //                 this._oDialog.close();
        //             }.bind(this),
        //             error: function () {
        //                 sap.m.MessageToast.show("Error while saving");
        //             }
        //         });
        // },
        //     onCloseDialog: function () {
        //         this._oDialog.close();
        //     }


        // ── Live change — runs on every keystroke ─────────────────────
onNewItemLiveChange: function (oEvent) {
    var oInput = oEvent.getSource();
    var sValue = oEvent.getParameter("value");

    // Only apply number restrictions to Number type inputs
    if (oInput.getType && oInput.getType() === "Number") {

        // ✅ Strip anything that is not a digit or decimal point
        var sClean = sValue.replace(/[^0-9.]/g, "");

        // ✅ Only one decimal point allowed
        var aParts = sClean.split(".");
        if (aParts.length > 2) {
            sClean = aParts[0] + "." + aParts.slice(1).join("");
        }

        // ✅ Max 5 digits before decimal
        if (aParts[0] && aParts[0].length > 5) {
            aParts[0] = aParts[0].substring(0, 5);
            sClean = aParts.join(".");
        }

        if (sClean !== sValue) {
            oInput.setValue(sClean);
        }

        var fValue = parseFloat(sClean);

        // Reset
        oInput.setValueState("None");
        oInput.setValueStateText("");

        // ✅ Empty
        if (!sClean || isNaN(fValue)) {
            oInput.setValueState("Error");
            oInput.setValueStateText("This field is required");
            return;
        }

        // ✅ Negative or zero
        if (fValue <= 0) {
            oInput.setValueState("Error");
            oInput.setValueStateText("Value must be greater than 0");
            return;
        }

        // ✅ Cross-validate Available vs Total live
        var oTotalInput     = sap.ui.core.Fragment.byId("addItemDialog", "inputTotalQty")
                           || this.byId("inputTotalQty");
        var oAvailableInput = sap.ui.core.Fragment.byId("addItemDialog", "inputAvailableQty")
                           || this.byId("inputAvailableQty");

        if (oTotalInput && oAvailableInput) {
            var iTotal     = parseFloat(oTotalInput.getValue());
            var iAvailable = parseFloat(oAvailableInput.getValue());

            if (!isNaN(iTotal) && !isNaN(iAvailable)) {

                // Both zero — show warning but allow
                if (iTotal === 0 && iAvailable === 0) {
                    oTotalInput.setValueState("Warning");
                    oTotalInput.setValueStateText("Item will be marked as discontinued");
                    oAvailableInput.setValueState("Warning");
                    oAvailableInput.setValueStateText("Item will be marked as discontinued");
                    return;
                }

                // Available > Total
                if (iAvailable > iTotal) {
                    oAvailableInput.setValueState("Error");
                    oAvailableInput.setValueStateText(
                        "Available (" + iAvailable + ") cannot exceed Total (" + iTotal + ")"
                    );
                    oTotalInput.setValueState("Warning");
                    oTotalInput.setValueStateText("Total is less than Available Qty");
                } else {
                    // Clear cross-validation states if now valid
                    if (oAvailableInput.getValueState() === "Error") {
                        oAvailableInput.setValueState("None");
                    }
                    if (oTotalInput.getValueState() === "Warning") {
                        oTotalInput.setValueState("None");
                    }
                }
            }
        }

        oInput.setValueState("Success");
        oInput.setValueStateText("");
    }
},

// ── Save — full validation before OData call ──────────────────
onSaveNewItem: function () {
    var oNewItemModel = this.getView().getModel("newItem");
    var oData         = oNewItemModel.getData();
    var bValid        = true;

    // Helper to get fragment controls
    var byFragId = function (sId) {
        return sap.ui.core.Fragment.byId("addItemDialog", sId) 
            || this.byId(sId);
    }.bind(this);

    var oNameInput      = byFragId("inputItemName");
    var oTotalInput     = byFragId("inputTotalQty");
    var oAvailableInput = byFragId("inputAvailableQty");
    var oRentInput      = byFragId("inputRentPerDay");
    var oDepositInput   = byFragId("inputDeposit");
    var oTypeSelect     = byFragId("selectType");
    var oCategorySelect = byFragId("selectCategory");
    var oUnitSelect     = byFragId("selectUnit");

    // Reset all states
    [oNameInput, oTotalInput, oAvailableInput, oRentInput, oDepositInput].forEach(function(ctrl) {
        if (ctrl) { ctrl.setValueState("None"); ctrl.setValueStateText(""); }
    });

    // ✅ 1. Product Name
    if (!oData.item_name || oData.item_name.trim() === "") {
        oNameInput.setValueState("Error");
        oNameInput.setValueStateText("Product name is required");
        bValid = false;
    }

    // ✅ 2. Product Type
    if (!oData.type || oData.type === "") {
        sap.m.MessageToast.show("Please select a Product Type");
        bValid = false;
    }

    // ✅ 3. Category
    if (!oData.category || oData.category === "") {
        sap.m.MessageToast.show("Please select a Category");
        bValid = false;
    }

    // ✅ 4. Quantity Unit
    if (!oData.quant_unit || oData.quant_unit === "") {
        sap.m.MessageToast.show("Please select a Quantity Unit");
        bValid = false;
    }

    var iTotalQty     = parseFloat(oData.total_qty);
    var iAvailableQty = parseFloat(oData.available_qty);
    var iRentPerDay   = parseFloat(oData.rent_per_day);
    var iDeposit      = parseFloat(oData.deposit);

    // ✅ 5. Total Qty
    if (!oData.total_qty || isNaN(iTotalQty)) {
        oTotalInput.setValueState("Error");
        oTotalInput.setValueStateText("Total Quantity is required");
        bValid = false;
    } else if (iTotalQty < 0) {
        oTotalInput.setValueState("Error");
        oTotalInput.setValueStateText("Total Quantity cannot be negative");
        bValid = false;
    } else if (iTotalQty > 99999) {
        oTotalInput.setValueState("Error");
        oTotalInput.setValueStateText("Total Quantity is too large");
        bValid = false;
    }

    // ✅ 6. Available Qty
    if (!oData.available_qty || isNaN(iAvailableQty)) {
        oAvailableInput.setValueState("Error");
        oAvailableInput.setValueStateText("Available Quantity is required");
        bValid = false;
    } else if (iAvailableQty < 0) {
        oAvailableInput.setValueState("Error");
        oAvailableInput.setValueStateText("Available Quantity cannot be negative");
        bValid = false;
    } else if (iAvailableQty > 99999) {
        oAvailableInput.setValueState("Error");
        oAvailableInput.setValueStateText("Available Quantity is too large");
        bValid = false;
    }

    // ✅ 7. Available vs Total cross check
    if (!isNaN(iTotalQty) && !isNaN(iAvailableQty)) {

        // Both zero — confirm before saving
        if (iTotalQty === 0 && iAvailableQty === 0) {
            sap.m.MessageBox.confirm(
                "Both Total and Available Qty are 0. This item will be added as discontinued. Continue?",
                {
                    title: "Confirm",
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            this._doCreateItem(oData);
                        }
                    }.bind(this)
                }
            );
            return;
        }

        // Only one is zero
        if (iTotalQty === 0 && iAvailableQty !== 0) {
            oTotalInput.setValueState("Error");
            oTotalInput.setValueStateText("Total cannot be 0 when Available is " + iAvailableQty);
            bValid = false;
        }
        if (iAvailableQty === 0 && iTotalQty !== 0) {
            oAvailableInput.setValueState("Error");
            oAvailableInput.setValueStateText("Available cannot be 0 when Total is " + iTotalQty);
            bValid = false;
        }

        // Available exceeds Total
        if (iAvailableQty > iTotalQty && iTotalQty > 0) {
            oAvailableInput.setValueState("Error");
            oAvailableInput.setValueStateText(
                "Available (" + iAvailableQty + ") cannot exceed Total (" + iTotalQty + ")"
            );
            oTotalInput.setValueState("Warning");
            oTotalInput.setValueStateText("Total is less than Available Qty");
            bValid = false;
        }
    }

    // ✅ 8. Rent Per Day
    if (!oData.rent_per_day || isNaN(iRentPerDay)) {
        oRentInput.setValueState("Error");
        oRentInput.setValueStateText("Rent Per Day is required");
        bValid = false;
    } else if (iRentPerDay <= 0) {
        oRentInput.setValueState("Error");
        oRentInput.setValueStateText("Rent Per Day must be greater than 0");
        bValid = false;
    }

    // ✅ 9. Deposit Amount
    if (!oData.deposit || isNaN(iDeposit)) {
        oDepositInput.setValueState("Error");
        oDepositInput.setValueStateText("Deposit Amount is required");
        bValid = false;
    } else if (iDeposit <= 0) {
        oDepositInput.setValueState("Error");
        oDepositInput.setValueStateText("Deposit Amount must be greater than 0");
        bValid = false;
    }

    // ✅ Stop if any validation failed
    if (!bValid) {
        sap.m.MessageToast.show("Please fix all errors before saving");
        return;
    }

    // All valid — proceed
    this._doCreateItem(oData);
},

// ── Actual OData create (separated so both-zero confirm can reuse) ──
_doCreateItem: function (oData) {
    var oModel = this.getView().getModel();

    oModel.create("/ZIB18_G4_ITEM", oData, {
        success: function () {
            sap.m.MessageToast.show("Item Added Successfully");
            this._oDialog.close();
        }.bind(this),
        error: function () {
            sap.m.MessageToast.show("Error while saving. Please try again.");
        }
    });
},

onCloseDialog: function () {
    // Reset all value states on close
    var byFragId = function (sId) {
        return sap.ui.core.Fragment.byId("addItemDialog", sId) 
            || this.byId(sId);
    }.bind(this);

    ["inputItemName","inputTotalQty","inputAvailableQty",
     "inputRentPerDay","inputDeposit"].forEach(function(sId) {
        var oCtrl = byFragId(sId);
        if (oCtrl) { oCtrl.setValueState("None"); }
    });

    this._oDialog.close();
},

                
                });
            });