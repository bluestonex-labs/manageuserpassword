sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("uk.co.brakes.rf.manageuserpasswordui.controller.App", {
        onInit: function () {

          // var id = this.getOwnerComponent().getMetadata().getManifest()["sap.app"].id;
          // var callUrl = jQuery.sap.getModulePath(id + '/user-api/currentUser');
  
          // var that = this;
  
          // $.ajax({
  
          //     url: callUrl,
  
          //     type: "GET",
  
          //     contentType: "application/json",
  
          //     dataType: "json",
  
          //     async: true,
  
          //     success: function (oData, response) {
  
          //         console.log(oData);
  
  
          //     },
  
          //     error: function (jqXHR, textStatus, errorThrown) {
          //         console.log(jqXHR.responseText);
  
          //     }
  
          // }, this);
          this._userModel = this.getOwnerComponent().getModel("userModel");
          let me = this;
          fetch("/getUserInformation")
            .then(res => res.json())
            .then(data => {
              me._userModel.setProperty("/", data);
              /* if the logged in user does not belong to BSX TDD idp then display only Manage Users */
              /*if (data.decodedJWTToken.origin !== "httpsaqcgazolg.accounts.ondemand.com") {
                var sbEle = this.getView().byId("sidebar");
                var sNavEle = this.getView().byId("tntSideNav");
                sbEle.setVisible(false);
                sNavEle.setVisible(false);
                this.getOwnerComponent().getRouter().navTo("MANAGE");
              } else {
                var sbEle = this.getView().byId("sidebar");
                var sNavEle = this.getView().byId("tntSideNav");
                sbEle.attachBrowserEvent("mouseenter", function (oEvent) {
                  sNavEle.setExpanded(true);
                });
                sbEle.attachBrowserEvent("mouseleave", function (oEvent) {
                  sNavEle.setExpanded(false);
                });
                this.getOwnerComponent().getRouter().navTo("CPEA");
                sNavEle.setSelectedKey("CPEA");
              }*/
            })
            .catch(err => console.log(err));
  
          /* for the app load in local BAS */
          /*if (this._userModel.getData().length == undefined) {
            var sbEle = this.getView().byId("sidebar");
            var sNavEle = this.getView().byId("tntSideNav");
            sbEle.attachBrowserEvent("mouseenter", function (oEvent) {
              sNavEle.setExpanded(true);
            });
            sbEle.attachBrowserEvent("mouseleave", function (oEvent) {
              sNavEle.setExpanded(false);
            });
            this.getOwnerComponent().getRouter().navTo("CPEA");
            sNavEle.setSelectedKey("CPEA");
          } */
        },
        onAfterRendering: function () {
        },
        onMenuPress: function (oEvent) {
          var sbEle = this.getView().byId("sidebar");
          var logoEle = this.getView().byId("logo");
          var classes = sbEle.aCustomStyleClasses;
          if (classes.indexOf("sidebar") >= 0) {
  
            sbEle.addStyleClass("minisidebar");
            sbEle.removeStyleClass("sidebar");
            logoEle.setSrc("images/new-icon.png");
            logoEle.setWidth("100%");
  
          } else {
  
            sbEle.addStyleClass("sidebar");
            sbEle.removeStyleClass("minisidebar");
            //logoEle.setWidth("90%");
            //logoEle.setSrc("images/new-icon-white.png");
          }
  
        },
  
        onItemSelect: function (oEvent) {
          var oItem = oEvent.getParameter('item');
          var sKey = oItem.getKey();
          var sVal = oItem.getText();
          //var shellBar = this.byId("shellBar");
          //shellBar.setTitle(oItem.getText());
          // if you click on home, settings or statistics button, call the navTo function
          //        if ((sKey === "home" || sKey === "Settings" || sKey === "ManageOrg")) {
          // if the device is phone, collaps the navigation side of the app to give more space
          //MessageToast.show(sKey);
          //if (Device.system.phone) {
          //        this.onSideNavButtonPress();
          //}
          // this.getView().byId("appHeader").setText(sVal.toUpperCase());
          var userModel = this.getOwnerComponent().getModel("userModel");
          var oUsrMdlData = userModel.getData();
          var oLocation = "";
          if (oUsrMdlData.decodedJWTToken) {
            oLocation = oUsrMdlData.decodedJWTToken.origin;
          } else {
            oLocation = "";
          }
  
          if (oLocation !== "httpsaqcgazolg.accounts.ondemand.com") {
            this.getOwnerComponent().getRouter().navTo(sKey);
            //this.getOwnerComponent().getRouter().navTo("NOTSUBSCRIBED");
          } else {
            this.getOwnerComponent().getRouter().navTo(sKey);
          }
  
        }
      });
    }
  );
  