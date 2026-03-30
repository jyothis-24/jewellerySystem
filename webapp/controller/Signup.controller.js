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
                    var oRoute = this.getOwnerComponent().getRouter();
                    oRoute.navTo("RouteLogin")
                },
        validateFields: function (sPhone,sEmail) {
            
            var oEmail = sEmail;
            var oPhone = sPhone;

            // --- Email validation --- Must contain '@' and end with .com or .in
            var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/i;
            if (!emailPattern.test(sEmail)) {
                        sap.m.MessageToast.show("Please enter a valid email (example@domain.com or example@domain.in)");
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

        onSignup: function () {
debugger
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
            debugger
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
                        sap.m.MessageToast.show("Signup successful");
                    },
                    error: function (oerror) {
                        sap.m.MessageToast.show("Already Entered Email");
                    }

            });
        }
    });
});
