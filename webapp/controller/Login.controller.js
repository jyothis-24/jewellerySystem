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
                

                        //  Role-based navigation
                        if (oData.Role === "A") {
                            oRouter.navTo("RouteAdmin");   // Page for Role A
                        
                        } 
                        else if (oData.Role === "C") {
                            oRouter.navTo("RouteUser"); // Page for Role C
                            
                        } 
               

                } else {
                sap.m.MessageToast.show("Invalid credentials");
            }
        },
        error: function () {
            sap.m.MessageToast.show("Login failed");
        }
        });
    }

    });
});
