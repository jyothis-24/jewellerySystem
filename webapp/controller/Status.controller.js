
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Status", {
        onInit: function () {
                
                // var oUserModel = sap.ui.getCore().getModel("user");
                // var oUserModel = this.getOwnerComponent().getModel("user");
                // var customerId = oUserModel.getProperty("/customerId");
                // this.sCustomerId = customerId ;
                // var customerId = '0000001019'
                debugger;
                var customerId = sessionStorage.getItem("currentUserCustomerId");
                console.log("Customer ID:", customerId);
                this._loadStatus(customerId);
        },
    //     _loadStatus(customerId){
    //             var oODataModel = this.getOwnerComponent().getModel(); // OData model
    //             var that = this;
    //             var sPath = "/ZIB18_G4_USER_STATUS(p_user_id='${customerId}')/Set' "
    //         oODataModel.read(sPath, {
    //             success: function (oData) {
                    
    //                 var aData = oData.results || [];

    //                 var oGrouped = [];
    //                 var oMap = {};

    //                 aData.forEach(function(item) {
    //                     if (!oMap[item.booking_id]) {
    //                         oMap[item.booking_id] = {
    //                             booking_id: item.booking_id,
    //                             items: [],
    //                             total_payable: item.total_payable,
    //                             booking_status: item.booking_status
    //                         };
    //                         oGrouped.push(oMap[item.booking_id]);
    //                     }
    //                     oMap[item.booking_id].items.push(item.item_name);
    //                 });

    //                 //  Create JSON model for grouped data
    //                 var oJsonModel = new sap.ui.model.json.JSONModel({
    //                     GroupedBookings: oGrouped
    //                 });

    //                 that.getView().setModel(oJsonModel, "grouped");
    //             },

    //             error: function () {
    //                 sap.m.MessageToast.show("Failed to load data");
    //             }
    //     });
    // },
//     _loadStatus: function(customerId) {
        
//     var oODataModel = this.getOwnerComponent().getModel();
//     var that = this;

//     // Corrected path with template literal
//     var sPath = `/ZIB18_G4_USER_STATUS(p_user_id='${customerId}')/Set`;

//     oODataModel.read(sPath, {
//         success: function(oData) {
//             var aData = oData.results || []; // Some parameterized CDS returns a single object, not results array

//             // Handle both array or single object
//             if (!Array.isArray(aData) && oData) {
//                 aData = [oData];
//             }

//             var oGrouped = [];
//             var oMap = {};
//             debugger
//             aData.forEach(function(item) {
//                 if (!oMap[item.booking_id]) {
//                     oMap[item.booking_id] = {
//                         booking_id: item.booking_id,
//                         items: [],
//                         total_payable: item.total_payable,
//                         booking_status: item.booking_status,
//                         payment_status: item.payment_status || "P"
//                     };
//                     oGrouped.push(oMap[item.booking_id]);
//                 }
//                 // oMap[item.booking_id].items.push(item.item_name);
//                 oMap[item.booking_id].items.push({
//                     item_name: item.item_name
//                 });

//             });

//             var oJsonModel = new sap.ui.model.json.JSONModel({
//                 GroupedBookings: oGrouped
//             });

//             that.getView().setModel(oJsonModel, "grouped");
//         },
//         error: function() {
//             sap.m.MessageToast.show("Failed to load data");
//         }
//     });
// },
_loadStatus: function(customerId) {
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;

    var sPath = `/ZIB18_G4_USER_STATUS(p_user_id='${customerId}')/Set`;

    oODataModel.read(sPath, {
        success: function(oData) {
            var aData = oData.results || [];
            if (!Array.isArray(aData) && oData) {
                aData = [oData];
            }

            var oGrouped = [];
            var oMap = {};

            aData.forEach(function(item) {
                if (!oMap[item.booking_id]) {
                    oMap[item.booking_id] = {
                        booking_id: item.booking_id,
                        items: [],
                        total_payable: item.total_payable,
                        booking_status: item.booking_status,
                        payment_status: item.payment_status,  // if you want to use it in binding
                        rent_end_date: item.rent_end_date,
                        total_rent_per_day: item.total_rent_per_day 
                    };
                    oGrouped.push(oMap[item.booking_id]);
                }

                oMap[item.booking_id].items.push({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    quantity: item.quantity,
                    returned_qty: item.returned_qty,
                    left_qty: item.left_qty,
                    rent_end_date: item.rent_end_date ,
                    total_rent_per_day: item.total_rent_per_day 
                });
            });
            debugger
            var oJsonModel = new sap.ui.model.json.JSONModel({
                GroupedBookings: oGrouped
            });

            that.getView().setModel(oJsonModel, "grouped");
        },
        error: function() {
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
        // onPayNow: function (oEvent) {
        //     debugger
        //     const oButton = oEvent.getSource();
        //     const oContext = oButton.getBindingContext();

        //     if (!oContext) {
        //         MessageToast.show("No Payment");
        //         return;
        //     }

        //     // Implement  pay logic here
        //     MessageToast.show("Pay Now clicked for booking: " + oContext.getProperty("booking_id"));
        // },
        onPayNow: function (oEvent) {

    var oButton = oEvent.getSource();
    var oContext = oButton.getBindingContext("grouped"); // default model

    if (!oContext) {
        sap.m.MessageToast.show("No booking found");
        return;
    }

    var sBookingId = oContext.getProperty("booking_id"); //  must match CDS

    var oModel = this.getView().getModel();

    sap.m.MessageBox.confirm(
        "Are you sure you want to confirm payment?",
        {
            title: "Confirm Payment",

            actions: [
                sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO
            ],

            onClose: function (sAction) {

                if (sAction === sap.m.MessageBox.Action.YES) {
                    debugger;
                    //  Correct OData key format
                    var sPath = "/ZIB18_G4_Payment(BookingID='" + sBookingId + "')";
                    var oPayload = {
                        "PaymentCurrentStatus": "C"   //  backend expects code
                    };

                    oModel.update(sPath, oPayload, {
                        success: function (oData) {
                            sap.m.MessageToast.show("Payment Confirmed!");

                            //  refresh
                            oModel.refresh();
                        },

                        error: function (oError) {
                            console.error("Update failed:", oError);
                            sap.m.MessageToast.show("Payment Failed!");
                        }
                    });
                }

            }.bind(this)
        }
    );
},
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
        // // View Fine button press handler
        // onViewFine: function (oEvent) {
        //     const oButton = oEvent.getSource();
        //     const oContext = oButton.getBindingContext();

        //     if (!oContext) {
        //         MessageToast.show("No booking selected");
        //         return;
        //     }

        //     // Implement your fine view logic here
        //     MessageToast.show("View Fine clicked for booking: " + oContext.getProperty("booking_id"));
        // },
//     onViewFine: function (oEvent) {
//     // Get the clicked button
//     const oButton = oEvent.getSource();

//     // Get the binding context from the grouped JSON model
//     const oContext = oButton.getBindingContext("grouped");

//     if (!oContext) {
//         sap.m.MessageToast.show("No booking selected");
//         return;
//     }

//     // Get the booking object, including items array
//     const oBooking = oContext.getObject();
//     const aItems = oBooking.items || [];

//     if (aItems.length === 0) {
//         sap.m.MessageToast.show("No items for this booking");
//         return;
//     }

//     // Prepare fine data per item
//     const aFineData = aItems.map(function (item) {
//         const bookedQty = Number(item.qty) || 0;
//         const returnedQty = Number(item.returnedQty) || 0;
//         const leftQty = bookedQty - returnedQty;

//         // Example fine calculation logic
//         const fine = leftQty > 0 ? leftQty * 100 : 0;

//         return {
//             itemId: item.itemId,
//             itemName: item.itemName,
//             bookedQty: bookedQty,
//             returnedQty: returnedQty,
//             leftQty: leftQty,
//             fine: fine
//         };
//     });

//     // JSON model for fine popup
//     const oFineModel = new sap.ui.model.json.JSONModel({
//         items: aFineData
//     });

//     // Load fragment for popup table
//     this.loadFragment({
//         name: "com.applexus.finalproject.fragments.Popup",
//         controller: this
//     }).then(function (oDialog) {

//         if (!oDialog) {
//             sap.m.MessageToast.show("Popup not loaded");
//             return;
//         }

//         oDialog.setTitle("Fine Details");

//         // Clear previous content
//         oDialog.removeAllContent();

//         // Create table dynamically
//         const oTable = new sap.m.Table({
//             columns: [
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Item" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Booked Qty" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Returned Qty" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Left Qty" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Fine" }) })
//             ]
//         });

//         // Bind items to table
//         oTable.setModel(oFineModel);
//         oTable.bindItems({
//             path: "/items",
//             template: new sap.m.ColumnListItem({
//                 cells: [
//                     new sap.m.Text({ text: "{itemName}" }),
//                     new sap.m.Text({ text: "{bookedQty}" }),
//                     new sap.m.Text({ text: "{returnedQty}" }),
//                     new sap.m.Text({ text: "{leftQty}" }),
//                     new sap.m.Text({ text: "{fine}" })
//                 ]
//             })
//         });

//         // Add table to dialog
//         oDialog.addContent(oTable);

//         // Add Close button
//         oDialog.setEndButton(new sap.m.Button({
//             text: "Close",
//             press: function () {
//                 oDialog.close();
//             }
//         }));

//         oDialog.open();

//     }.bind(this));
// }
// onViewFine: function (oEvent) {
//     debugger
//     const oButton = oEvent.getSource();
//     const oContext = oButton.getBindingContext("grouped");

//     if (!oContext) {
//         sap.m.MessageToast.show("No booking selected");
//         return;
//     }

//     const oBooking = oContext.getObject();
//     const aItems = oBooking.items || [];

//     if (aItems.length === 0) {
//         sap.m.MessageToast.show("No items for this booking");
//         return;
//     }

//     // Map item fields correctly
//     const aFineData = aItems.map(function (item) {
//         const bookedQty = Number(item.quantity) || 0;
//         const returnedQty = Number(item.returned_qty) || 0;
//         const leftQty = Number(item.left_qty) || 0;
//         const rentPerDay = Number(item.total_rent_per_day) || 0; 
    

//         return {
//             itemId: item.item_id,
//             itemName: item.item_name,
//             bookedQty: bookedQty,
//             returnedQty: returnedQty,
//             leftQty: leftQty,
//             fine: fine
//         };
//     });

//     const oFineModel = new sap.ui.model.json.JSONModel({ items: aFineData });

//     this.loadFragment({
//         name: "com.applexus.finalproject.fragments.Popup",
//         controller: this
//     }).then(function (oDialog) {
//         oDialog.setTitle("Fine Details");
//         oDialog.removeAllContent();

//         const oTable = new sap.m.Table({
//             columns: [
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Item" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Booked Qty" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Returned Qty" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Left Qty" }) }),
//                 new sap.m.Column({ header: new sap.m.Text({ text: "Fine" }) })
//             ]
//         });

//         oTable.setModel(oFineModel);
//         oTable.bindItems({
//             path: "/items",
//             template: new sap.m.ColumnListItem({
//                 cells: [
//                     new sap.m.Text({ text: "{itemName}" }),
//                     new sap.m.Text({ text: "{bookedQty}" }),
//                     new sap.m.Text({ text: "{returnedQty}" }),
//                     new sap.m.Text({ text: "{leftQty}" }),
//                     new sap.m.Text({ text: "{fine}" })
//                 ]
//             })
//         });

//         oDialog.addContent(oTable);

//         oDialog.setEndButton(new sap.m.Button({
//             text: "Close",
//             press: function () { oDialog.close(); }
//         }));

//         oDialog.open();
//     }.bind(this));
// },
onViewFine: function (oEvent) {
    debugger
    const oButton = oEvent.getSource();
    const oContext = oButton.getBindingContext("grouped");

    if (!oContext) {
        sap.m.MessageToast.show("No booking selected");
        return;
    }

    const oBooking = oContext.getObject();
    const aItems = oBooking.items || [];

    if (aItems.length === 0) {
        sap.m.MessageToast.show("No items for this booking");
        return;
    }

    // Define the fine rate (this could be fetched from TVARVC or set statically)
    const fineRate = 1.5; // Example: 1.5% fine rate

    // Map item fields correctly and calculate fine
    const aFineData = aItems.map(function (item) {
        const bookedQty = Number(item.quantity) || 0;
        const returnedQty = Number(item.returned_qty) || 0;
        const leftQty = Number(item.left_qty) || 0;
        const rentPerDay = Number(item.total_rent_per_day) || 0;  // Daily rent
        
        // Calculate the delay (based on rent_end_date)
        const delayDays = this.calculateDelayDays(item.rent_end_date);  // Passing the rent_end_date

        // Calculate the fine if there is a delay
        const fine = this.calculateFine(rentPerDay, delayDays, fineRate,leftQty);

        return {
            itemId: item.item_id,
            itemName: item.item_name,
            bookedQty: bookedQty,
            returnedQty: returnedQty,
            leftQty: leftQty,
            fine: fine
        };
    }, this); // Use 'this' for correct context in the map function

    const oFineModel = new sap.ui.model.json.JSONModel({ items: aFineData });

    this.loadFragment({
        name: "com.applexus.finalproject.fragments.Popup",
        controller: this
    }).then(function (oDialog) {
        oDialog.setTitle("Fine Details");
        oDialog.removeAllContent();

        const oTable = new sap.m.Table({
            columns: [
                new sap.m.Column({ header: new sap.m.Text({ text: "Item" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Booked Qty" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Returned Qty" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Left Qty" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Fine" }) })
            ]
        });

        oTable.setModel(oFineModel);
        oTable.bindItems({
            path: "/items",
            template: new sap.m.ColumnListItem({
                cells: [
                    new sap.m.Text({ text: "{itemName}" }),
                    new sap.m.Text({ text: "{bookedQty}" }),
                    new sap.m.Text({ text: "{returnedQty}" }),
                    new sap.m.Text({ text: "{leftQty}" }),
                    new sap.m.Text({ text: "{fine}" })
                ]
            })
        });

        oDialog.addContent(oTable);

        oDialog.setEndButton(new sap.m.Button({
            text: "Close",
            press: function () { oDialog.close(); }
        }));

        oDialog.open();
    }.bind(this)); // Use 'bind' to maintain the controller context
},

calculateDelayDays: function (rentEndDate) {
    debugger
    const today = new Date();
    const rentEnd = new Date(rentEndDate);

    // Check if rentEndDate is valid
    if (isNaN(rentEnd.getTime())) {
        return 0; // No delay if rent_end_date is not valid
    }

    // Check if the item is delayed
    if (today > rentEnd) {
        // Calculate the number of delay days
        const timeDiff = today - rentEnd;
        const delayDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days
        return delayDays;
    }

    return 0; // No delay
},

calculateFine: function (rentPerDay, delayDays, fineRate, leftQty) {
    // Calculate the fine if there are delay days
    if (delayDays > 0 && leftQty > 0) {
        const newRent = rentPerDay + (rentPerDay * fineRate / 100); // Rent with fine applied
        return delayDays * newRent * leftQty; // Multiply by leftQty for each item
    }
    return 0; // No fine if there's no delay or no left quantity
}
    });
});