sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Signup", {
        onInit: function () {
              var oData = {
                        user: {
                            Name: "",
                            Phone: "",
                            Email: "",
                            Address: "",
                            Password: "",
                            ConfirmPassword: "",
                            Role: "USER"    
                        }
                    };

                var oModel = new sap.ui.model.json.JSONModel(oData);
                this.getView().setModel(oModel, "userModel");
            },
        onLogin : function(){
                    debugger;
                    const oLoginData = this.getOwnerComponent().getModel("loginData");
                    if (oLoginData) {
                        this.getView().setModel(oLoginData, "login");
                    }
                    var oRoute = this.getOwnerComponent().getRouter();
                    oRoute.navTo("RouteLogin")
                },

        validateFields: function (sPhone,sEmail) {

            // --- Email validation --- Must contain '@' and end with .com or .in
            // var emailPattern = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?@[a-zA-Z0-9.-]+\.(com|in)$/i;
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(sEmail)) {
                        sap.m.MessageToast.show("Please enter a valid email (example@domain.com or example@domain.in or example.eg@domain.com)");
                        return false;
            }

            // --- Phone validation ---
            // Must be exactly 10 digits
            var phonePattern = /^[0-9]{10}$/;
            if (!phonePattern.test(sPhone)) {
                    sap.m.MessageToast.show("Please enter a valid 10-digit phone number");
                    return false;
            }

                return true; // All validations passed
        },
//         validateFields: function (sPhone, sEmail) {
    

//     var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailPattern.test(sEmail)) {
//         sap.m.MessageToast.show("Invalid email format");
//         return false;
//     }

//     var phonePattern = /^[0-9]{10}$/;

//     if (!phonePattern.test(sPhone)) {
//         sap.m.MessageToast.show("Enter 10-digit phone number");
//         return false;
//     }

//     return true;
// },

        onSignup: function () {

            var oView = this.getView();

            // Get data from JSON model instead of byId
            var oData = oView.getModel("userModel").getProperty("/user");

            var sName  = oData.Name;
            var sPhone = oData.Phone;
            var sEmail = oData.Email;
            var sAddr  = oData.Address;
            var sPass1 = oData.Password;
            var sPass2 = oData.ConfirmPassword;

            // Basic validation
            
            if (!sName || !sPhone || !sEmail || !sPass1 || !sPass2) {
                sap.m.MessageToast.show("Please fill all required fields");
                return;
            }

            if (sPass1 !== sPass2) {
                sap.m.MessageToast.show("Passwords do not match");
                return;
            }
           
            if (!this.validateFields(sPhone,sEmail)) {
                  return // Stop signup if validation fails
                }
            // OData Model
            var oModel = new sap.ui.model.odata.v2.ODataModel(
                        "/sap/opu/odata/sap/ZB18_G4_JRS_SRV"
                );

            // Payload 
            var oPayload = {
                Name: sName,
                Phone: sPhone,
                Email: sEmail,
                Address: sAddr,
                Password: sPass1,
                Role: "C"   // default role C -> Customer
            };

            // Create call
            oModel.create("/UserSet", oPayload, {
                    success: function (data) {
                        const oComponent = this.getOwnerComponent();

                        //Clear signup form
                        this.getView().getModel("userModel").setProperty("/user", {
                        Name: "",
                        Phone: "",
                        Email: "",
                        Address: "",
                        Password: "",
                        ConfirmPassword: "",
                        Role: "USER"
                        });

                        //Navigate to login
                        oComponent.getRouter().navTo("RouteLogin");
                        
                    }.bind(this),

                    error: function (oError) {
                        // sap.m.MessageToast.show("Already Entered Email");
                        var sMessage = "An error occurred.";
 
                    try {
                        // Parse backend error message
                        var oResponse = JSON.parse(oError.responseText);
                        // This is our ABAP ev_msg value
                        sMessage = oResponse.error.message.value;
                    } catch (e) {
                        sMessage = oError.message || sMessage;
                    }
 
                    // Show error in  popup
                    sap.m.MessageBox.error(sMessage);
                    }

            });
        }
    });
});
