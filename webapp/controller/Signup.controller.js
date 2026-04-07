// sap.ui.define([
//     "sap/ui/core/mvc/Controller"
// ],
// function (Controller) {
//     "use strict";

//     return Controller.extend("com.applexus.finalproject.controller.Signup", {
//         onInit: function () {
//               var oData = {
//                         user: {
//                             Name: "",
//                             Phone: "",
//                             Email: "",
//                             Address: "",
//                             Password: "",
//                             ConfirmPassword: "",
//                             Role: "USER"    
//                         }
//                     };

//                 var oModel = new sap.ui.model.json.JSONModel(oData);
//                 this.getView().setModel(oModel, "userModel");
//             },
//         onLogin : function(){
//                     debugger;
//                     const oLoginData = this.getOwnerComponent().getModel("loginData");
//                     if (oLoginData) {
//                         this.getView().setModel(oLoginData, "login");
//                     }
//                     var oRoute = this.getOwnerComponent().getRouter();
//                     oRoute.navTo("RouteLogin")
//                 },

//         validateFields: function (sPhone,sEmail) {

//             // --- Email validation --- Must contain '@' and end with .com or .in
//             // var emailPattern = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?@[a-zA-Z0-9.-]+\.(com|in)$/i;
//             var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             if (!emailPattern.test(sEmail)) {
//                         sap.m.MessageToast.show("Please enter a valid email (example@domain.com or example@domain.in or example.eg@domain.com)");
//                         return false;
//             }

//             // --- Phone validation ---
//             // Must be exactly 10 digits
//             var phonePattern = /^[0-9]{10}$/;
//             if (!phonePattern.test(sPhone)) {
//                     sap.m.MessageToast.show("Please enter a valid 10-digit phone number");
//                     return false;
//             }

//                 return true; // All validations passed
//         },
// //         validateFields: function (sPhone, sEmail) {
    

// //     var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// //     if (!emailPattern.test(sEmail)) {
// //         sap.m.MessageToast.show("Invalid email format");
// //         return false;
// //     }

// //     var phonePattern = /^[0-9]{10}$/;

// //     if (!phonePattern.test(sPhone)) {
// //         sap.m.MessageToast.show("Enter 10-digit phone number");
// //         return false;
// //     }

// //     return true;
// // },

//         onSignup: function () {

//             var oView = this.getView();

//             // Get data from JSON model instead of byId
//             var oData = oView.getModel("userModel").getProperty("/user");

//             var sName  = oData.Name;
//             var sPhone = oData.Phone;
//             var sEmail = oData.Email;
//             var sAddr  = oData.Address;
//             var sPass1 = oData.Password;
//             var sPass2 = oData.ConfirmPassword;

//             // Basic validation
            
//             if (!sName || !sPhone || !sEmail || !sPass1 || !sPass2) {
//                 sap.m.MessageToast.show("Please fill all required fields");
//                 return;
//             }

//             if (sPass1 !== sPass2) {
//                 sap.m.MessageToast.show("Passwords do not match");
//                 return;
//             }
           
//             if (!this.validateFields(sPhone,sEmail)) {
//                   return // Stop signup if validation fails
//                 }
//             // OData Model
//             var oModel = new sap.ui.model.odata.v2.ODataModel(
//                         "/sap/opu/odata/sap/ZB18_G4_JRS_SRV"
//                 );

//             // Payload 
//             var oPayload = {
//                 Name: sName,
//                 Phone: sPhone,
//                 Email: sEmail,
//                 Address: sAddr,
//                 Password: sPass1,
//                 Role: "C"   // default role C -> Customer
//             };

//             // Create call
//             oModel.create("/UserSet", oPayload, {
//                     success: function (data) {
//                         const oComponent = this.getOwnerComponent();

//                         //Clear signup form
//                         this.getView().getModel("userModel").setProperty("/user", {
//                         Name: "",
//                         Phone: "",
//                         Email: "",
//                         Address: "",
//                         Password: "",
//                         ConfirmPassword: "",
//                         Role: "USER"
//                         });

//                         //Navigate to login
//                         oComponent.getRouter().navTo("RouteLogin");
                        
//                     }.bind(this),

//                     error: function (oError) {
//                         // sap.m.MessageToast.show("Already Entered Email");
//                         var sMessage = "An error occurred.";
 
//                     try {
//                         // Parse backend error message
//                         var oResponse = JSON.parse(oError.responseText);
//                         // This is  ABAP ev_msg value
//                         sMessage = oResponse.error.message.value;
//                     } catch (e) {
//                         sMessage = oError.message || sMessage;
//                     }
 
//                     // Show error in  popup
//                     sap.m.MessageBox.error(sMessage);
//                     }

//             });
//         }
//     });
// });





sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Signup", {

        
        //  INIT
     
        onInit: function () {
            this.getView().setModel(new JSONModel({
                user: {
                    Name:            "",
                    Phone:           "",
                    Email:           "",
                    Address:         "",
                    Password:        "",
                    ConfirmPassword: "",
                    Role:            "C"
                }
            }), "userModel");
        },

        
        //  LIVE CHANGE HANDLERS  (real-time feedback)
     

        onNameChange: function (oEvent) {
            var sVal   = oEvent.getParameter("value").trim();
            var oInput = this.byId("nameId");

            if (!sVal) {
                this._setError(oInput, "Full name is required.");
            } else if (sVal.length < 3) {
                this._setError(oInput, "Name must be at least 3 characters.");
            } else if (!/^[a-zA-Z\s]+$/.test(sVal)) {
                this._setError(oInput, "Name must contain letters only.");
            } else {
                this._setSuccess(oInput);
            }
        },

        onPhoneChange: function (oEvent) {
            var sVal   = oEvent.getParameter("value").trim();
            var oInput = this.byId("phid");

            if (!sVal) {
                this._setError(oInput, "Phone number is required.");
            } else if (!/^[0-9]{10}$/.test(sVal)) {
                this._setError(oInput, "Enter a valid 10-digit phone number.");
            } else {
                this._setSuccess(oInput);
            }
        },

        onEmailChange: function (oEvent) {
            var sVal   = oEvent.getParameter("value").trim();
            var oInput = this.byId("emailId");

            if (!sVal) {
                this._setError(oInput, "Email address is required.");
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sVal)) {
                this._setError(oInput, "Enter a valid email (e.g. name@example.com).");
            } else {
                this._setSuccess(oInput);
            }
        },

        onAddressChange: function (oEvent) {
            var sVal   = oEvent.getParameter("value").trim();
            var oInput = this.byId("addrId");

            if (!sVal) {
                this._setError(oInput, "Address is required.");
            } else if (sVal.length < 10) {
                this._setError(oInput, "Please enter a complete address (min 10 characters).");
            } else {
                this._setSuccess(oInput);
            }
        },

        onPasswordChange: function (oEvent) {
            var sVal   = oEvent.getParameter("value");
            var oInput = this.byId("pid1");

            var oResult = this._checkPasswordStrength(sVal);
            if (!sVal) {
                this._setError(oInput, "Password is required.");
            } else if (oResult.state === "Error") {
                this._setError(oInput, oResult.message);
            } else if (oResult.state === "Warning") {
                this._setWarning(oInput, oResult.message);
            } else {
                this._setSuccess(oInput);
            }

            // Re-validate confirm password live if already filled
            var sConfirm = this.byId("pid2").getValue();
            if (sConfirm) {
                this._validateConfirmPassword(sVal, sConfirm);
            }
        },

        onConfirmPasswordChange: function (oEvent) {
            var sConfirm = oEvent.getParameter("value");
            var sPass    = this.byId("pid1").getValue();
            this._validateConfirmPassword(sPass, sConfirm);
        },

        //  SUBMIT
        
        onSignup: function () {
            // Run full validation before submitting
            debugger
            if (!this._validateAll()) {
                MessageToast.show("Please fix the highlighted fields before continuing.");
                return;
            }

            var oData = this.getView().getModel("userModel").getProperty("/user");

            var oPayload = {
                Name:     oData.Name.trim(),
                Phone:    oData.Phone.trim(),
                Email:    oData.Email.trim(),
                Address:  oData.Address.trim(),
                Password: oData.Password,
                Role:     "C"
            };

            this.getView().setBusy(true);

            var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZB18_G4_JRS_SRV");

            oModel.create("/UserSet", oPayload, {
                
                success: function () {
                    debugger;
                    this.getView().setBusy(false);
                    this._clearForm();
                    MessageBox.success("Account created successfully! Please sign in.", {
                        onClose: function () {
                            this.getOwnerComponent().getRouter().navTo("RouteLogin");
                        }.bind(this)
                    });
                }.bind(this),

                error: function (oError) {
                    debugger;
                    this.getView().setBusy(false);
                    var sMessage = "Registration failed. Please try again.";
                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        sMessage = oResponse.error.message.value || sMessage;
                    } catch (e) {
                        sMessage = oError.message || sMessage;
                    }
                    MessageBox.error(sMessage);
                }.bind(this)
            });
        },

        onLogin: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLogin");
        },

      
        //  FULL VALIDATION (called on submit)
        
        _validateAll: function () {
            var oData  = this.getView().getModel("userModel").getProperty("/user");
            var bValid = true;

            var oName    = this.byId("nameId");
            var oPhone   = this.byId("phid");
            var oEmail   = this.byId("emailId");
            var oAddr    = this.byId("addrId");
            var oPass1   = this.byId("pid1");
            var oPass2   = this.byId("pid2");

            var sName    = (oData.Name            || "").trim();
            var sPhone   = (oData.Phone           || "").trim();
            var sEmail   = (oData.Email           || "").trim();
            var sAddr    = (oData.Address         || "").trim();
            var sPass1   = (oData.Password        || "");
            var sPass2   = (oData.ConfirmPassword || "");

            // Name
            if (!sName) {
                this._setError(oName, "Full name is required."); bValid = false;
            } else if (sName.length < 3) {
                this._setError(oName, "Name must be at least 3 characters."); bValid = false;
            } else if (!/^[a-zA-Z\s]+$/.test(sName)) {
                this._setError(oName, "Name must contain letters only."); bValid = false;
            } else {
                this._setSuccess(oName);
            }

            // Phone
            if (!sPhone) {
                this._setError(oPhone, "Phone number is required."); bValid = false;
            } else if (!/^[0-9]{10}$/.test(sPhone)) {
                this._setError(oPhone, "Enter a valid 10-digit phone number."); bValid = false;
            } else {
                this._setSuccess(oPhone);
            }

            // Email
            if (!sEmail) {
                this._setError(oEmail, "Email address is required."); bValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
                this._setError(oEmail, "Enter a valid email (e.g. name@example.com)."); bValid = false;
            } else {
                this._setSuccess(oEmail);
            }

            // Address
            if (!sAddr) {
                this._setError(oAddr, "Address is required."); bValid = false;
            } else if (sAddr.length < 10) {
                this._setError(oAddr, "Please enter a complete address (min 10 characters)."); bValid = false;
            } else {
                this._setSuccess(oAddr);
            }

            // Password
            var oStrength = this._checkPasswordStrength(sPass1);
            if (!sPass1) {
                this._setError(oPass1, "Password is required."); bValid = false;
            } else if (oStrength.state === "Error") {
                this._setError(oPass1, oStrength.message); bValid = false;
            } else if (oStrength.state === "Warning") {
                this._setWarning(oPass1, oStrength.message);
                // Warning is allowed to proceed — not blocking
            } else {
                this._setSuccess(oPass1);
            }

            // Confirm Password
            if (!sPass2) {
                this._setError(oPass2, "Please confirm your password."); bValid = false;
            } else if (sPass1 !== sPass2) {
                this._setError(oPass2, "Passwords do not match."); bValid = false;
            } else {
                this._setSuccess(oPass2);
            }

            return bValid;
        },

      
        //  PASSWORD STRENGTH CHECKER
      
        _checkPasswordStrength: function (sPass) {
            if (!sPass || sPass.length < 6) {
                return { state: "Error", message: "Password must be at least 6 characters." };
            }
            if (sPass.length < 8) {
                return { state: "Warning", message: "Weak password — consider using 8+ characters." };
            }
            if (!/[A-Z]/.test(sPass)) {
                return { state: "Warning", message: "Add at least one uppercase letter for a stronger password." };
            }
            if (!/[0-9]/.test(sPass)) {
                return { state: "Warning", message: "Add at least one number for a stronger password." };
            }
            if (!/[^a-zA-Z0-9]/.test(sPass)) {
                return { state: "Warning", message: "Add a special character (e.g. @, #, !) for a stronger password." };
            }
            return { state: "Success", message: "Strong password ✓" };
        },

     
        //  CONFIRM PASSWORD HELPER
      
        _validateConfirmPassword: function (sPass, sConfirm) {
            var oInput = this.byId("pid2");
            if (!sConfirm) {
                this._setError(oInput, "Please confirm your password.");
            } else if (sPass !== sConfirm) {
                this._setError(oInput, "Passwords do not match.");
            } else {
                this._setSuccess(oInput);
            }
        },

    
        //  VALUE STATE HELPERS
       
        _setError: function (oControl, sText) {
            oControl.setValueState("Error");
            oControl.setValueStateText(sText);
        },

        _setWarning: function (oControl, sText) {
            oControl.setValueState("Warning");
            oControl.setValueStateText(sText);
        },

        _setSuccess: function (oControl) {
            oControl.setValueState("Success");
            oControl.setValueStateText("");
        },

       
        //  CLEAR FORM
       
        _clearForm: function () {
            this.getView().getModel("userModel").setProperty("/user", {
                Name: "", Phone: "", Email: "",
                Address: "", Password: "", ConfirmPassword: "", Role: "C"
            });

            // Reset all value states
            ["nameId", "phid", "emailId", "addrId", "pid1", "pid2"].forEach(function (sId) {
                this.byId(sId).setValueState("None");
            }.bind(this));
        }

    });
});