sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.applexus.finalproject.controller.Login", {
        onInit: function () 
        {
             var oLoginModel = new sap.ui.model.json.JSONModel({
                email: "",
                password: ""
            });

            // set model to view with name "login"
            this.getView().setModel(oLoginModel, "login");

        },
        onSignup:function(){
           
            var oRoute = this.getOwnerComponent().getRouter();
            oRoute.navTo("RouteSignup");
        },
       onLogin: function () {
        debugger
            var oModel = this.getView().getModel("login");

            var sEmail = oModel.getProperty("/email");
            var sPassword = oModel.getProperty("/password");

            if (!sEmail || !sPassword) {
                sap.m.MessageToast.show("Enter email and password");
                return;
            }

            var oRouter = this.getOwnerComponent().getRouter();

            var oODataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZB18_G4_JRS_SRV/");

            var sPath = "/UserSet(Email='" + sEmail + "',Password='" + sPassword + "')";
            
            oODataModel.read(sPath, {
                success: function (oData) {
            
                if (oData && oData.Email){
                    debugger
                    this._clear();
                    //Create a User Model to know the userid
                            var oUserModel = new sap.ui.model.json.JSONModel({
                            Email: oData.Email,
                            Role: oData.Role,
                            CustomerId: oData.UserId
                                 });

                        // Set it globally (Component level)
                        // sap.ui.getCore().setModel(oUserModel, "user");
                        // getOwnerComponent().setModel(oUserModel, "user");
                    //     sessionStorage.setItem("currentUser", JSON.stringify(oUserModel));
 
                    // self.getOwnerComponent().setModel(
                    //     new JSONModel(oUserModel), "currentUser"
                    // );
                                //  sessionStorage.setItem("currentUser", JSON.stringify(oUserModel));
                                // Instead of storing the entire model, just store the CustomerId
            var customerId = oUserModel.getProperty("/CustomerId");
            sessionStorage.setItem("currentUserCustomerId", customerId);
            
                        if (oData.Role === "A") {
                            oRouter.navTo("RouteAdmin");   // Page for Role A
                        
                        } 
                        else if (oData.Role === "C") {
                            oRouter.navTo("RouteUser"); // Page for Role C
                            
                        } 
               

                } else {
                sap.m.MessageToast.show("Invalid credentials");
            }
        }.bind(this),  // This binds the 'this' to the controller's context
        error: function () {
            sap.m.MessageToast.show("Login failed");
        }
        });
    },
    _clear:function(){
        var oModel = this.getView().getModel("login");
                    oModel.setProperty("/email", "");
            oModel.setProperty("/password", "");
    }

    });
});
