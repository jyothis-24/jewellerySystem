sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Login", {

        onInit: function () {
            var oLoginModel = new sap.ui.model.json.JSONModel({
                email: "",
                password: ""
            });
            this.getView().setModel(oLoginModel, "login");
        },

        onSignup: function () {
            var oRoute = this.getOwnerComponent().getRouter();
            oRoute.navTo("RouteSignup");
        },

        onLogin: function () {
            // Run validations first — stop if any fail
            if (!this._validateInputs()) {
                return;
            }

            var oModel  = this.getView().getModel("login");
            var sEmail  = oModel.getProperty("/email").trim();
            var sPassword = oModel.getProperty("/password").trim();

            var oODataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZB18_G4_JRS_SRV/");
            var sPath = "/UserSet(Email='" + sEmail + "',Password='" + sPassword + "')";

            // Disable button during call to prevent double-submit
            this._setLoginBusy(true);

            oODataModel.read(sPath, {
                success: function (oData) {
                    this._setLoginBusy(false);

                    if (oData && oData.Email) {
                        this._clear();
                        this._storeSessionData(oData);
                        this._navigateByRole(oData.Role);
                    } else {
                        // Backend returned 200 but no valid user
                        MessageBox.error("Invalid credentials. Please try again.");
                    }
                }.bind(this),

                error: function (oError) {
                    this._setLoginBusy(false);
                    this._clear();

                    // Try to extract backend error message if available
                    var sMessage = "Incorrect email or password.";
                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                            sMessage = oResponse.error.message.value;
                        }
                    } catch (e) {
                        // fallback to default message
                        sMessage = oError.message || sMessage;
                    }

                     MessageBox.error(sMessage);
                     
                }.bind(this)
            });
        },

      
        //  VALIDATION
     
        _validateInputs: function () {
            var oView     = this.getView();
            var oModel    = oView.getModel("login");
            var sEmail    = (oModel.getProperty("/email") || "").trim();
            var sPassword = (oModel.getProperty("/password") || "").trim();
            var bValid    = true;

            var oEmailInput    = oView.byId("loginEmail");
            var oPasswordInput = oView.byId("loginPassword");

            // Reset previous value states
            oEmailInput.setValueState("None");
            oPasswordInput.setValueState("None");

            //  Empty email check
            if (!sEmail) {
                oEmailInput.setValueState("Error");
                oEmailInput.setValueStateText("Email is required.");
                bValid = false;
            } else if (!this._isValidEmail(sEmail)) {
                //  Email format check
                oEmailInput.setValueState("Error");
                oEmailInput.setValueStateText("Please enter a valid email address (e.g. user@example.com).");
                bValid = false;
            }

            //  Empty password check
            if (!sPassword) {
                oPasswordInput.setValueState("Error");
                oPasswordInput.setValueStateText("Password is required.");
                bValid = false;
            } else if (sPassword.length < 6) {
                //  Minimum length check
                oPasswordInput.setValueState("Error");
                oPasswordInput.setValueStateText("Password must be at least 6 characters.");
                bValid = false;
            }

            // Show a single summary toast so the user understands what to fix
            if (!bValid) {
                MessageToast.show("Please fix the highlighted fields.");
            }

            return bValid;
        },

        // Simple RFC-5321 email regex
        _isValidEmail: function (sEmail) {
            var rEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return rEmail.test(sEmail);
        },

    
        //  NAVIGATION

        _navigateByRole: function (sRole) {
            var oRouter = this.getOwnerComponent().getRouter();

            switch (sRole) {
                case "A":
                    oRouter.navTo("RouteAdmin");
                    break;
                case "C":
                    oRouter.navTo("RouteUser");
                    break;
                default:
                    MessageBox.warning("Your account role is not recognised. Please contact the administrator.");
            }
        },


        //  SESSION STORAGE
       
        _storeSessionData: function (oData) {
            sessionStorage.setItem("currentUserCustomerId", oData.UserId  || "");
            sessionStorage.setItem("userName",              oData.Name    || "");
            sessionStorage.setItem("userRole",              oData.Role    || "");
            sessionStorage.setItem("userEmail",             oData.Email   || "");
        },

        //  HELPERS
       
        _setLoginBusy: function (bBusy) {
            // Greys out the whole page while the OData call is in flight
            this.getView().setBusy(bBusy);
        },

        _clear: function () {
            var oModel = this.getView().getModel("login");
            oModel.setProperty("/email",    "");
            oModel.setProperty("/password", "");

            // Also reset value states when clearing
            this.getView().byId("loginEmail").setValueState("None");
            this.getView().byId("loginPassword").setValueState("None");
        }
    });
});