sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/core/mvc/View",
    "sap/ui/core/library",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/layout/HorizontalLayout",
    "sap/ui/layout/VerticalLayout",
    "sap/m/library",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter"
    //"cockpit/xsuaa/uaa/UaaUrlUtil"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, FlattenedDataset, XMLView, View, CoreLibrary, BusyIndicator, MessageBox, HorizontalLayout, VerticalLayout, mobileLibrary, FilterOperator, Filter, Fragment, Sorter) {
        "use strict";


        return Controller.extend("uk.co.brakes.rf.manageuserpasswordui.controller.MANAGE.manageUsers", {
            onInit: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);

                this.getOwnerComponent().getRouter().getRoute("RouteView1").attachPatternMatched(this._onManageRouteMatched, this);

                //Create JSON Model for IDP users
                var oIdpUsersModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oIdpUsersModel, "oIdpUsersModel");

                var oIdpUsersCount = new sap.ui.model.json.JSONModel();
                oIdpUsersCount.setData({
                    count: ""
                });
                this.getView().setModel(oIdpUsersCount, "oIdpUsersCount");

                // create json model to get the logged in user
                //var oUserModel = new JSONModel("/services/userapi/currentUser");
                var oUserModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oUserModel, "oUserModel");

                var oUsrMdl = this.getOwnerComponent().getModel("userModel");
                var oUsrMdlData = oUsrMdl.getData();

                if (oUsrMdlData.decodedJWTToken) {
                    this.oLocation = oUsrMdlData.decodedJWTToken.origin;
                } else {
                    this.oLocation = "";
                }
            },

            onAfterRendering: function () {
            },

            _onManageRouteMatched: function (oEvent) {
                //this.fetchLoggedInUserDetails();
                this.getLoggedInUserDetails();
                this.oPasswdResetDialog = null;
                this.fetchAllIdpUsers();
                this.resetControls();
            },

            onAddNewUser: function () {
                //this.getOwnerComponent().getRouter().navTo("MANAGECREATE");
                if (!this.oCreateUserDialog) {
                    Fragment.load({
                        name: "bsxccx.cloudsuiteui.fragments.createNewUser",
                        controller: this
                    }).then(function (oDialog) {
                        this.oCreateUserDialog = oDialog;
                        this.getView().addDependent(this.oCreateUserDialog);
                        this.oCreateUserDialog.open();
                    }.bind(this));
                } else {
                    this.oCreateUserDialog.open();
                }
            },

            navBack: function () {
                history.go(-1);
            },

            loadBusyDialog: function () {
                if (!this._oBusyDialog) {
                    this._oBusyDialog = Fragment.load({
                        name: "uk.co.brakes.rf.manageuserpasswordui.fragments.BusyDialog",
                        controller: this
                    }).then(function (_oBusyDialog) {
                        this.getView().addDependent(_oBusyDialog);
                        //syncStyleClass("sapUiSizeCompact", this.getView(), _oBusyDialog);
                        return _oBusyDialog;
                    }.bind(this));
                }

                this._oBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.open();
                }.bind(this));
            },

            hideBusyIndicator: function () {
                this._oBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.close();
                });
            },

            fetchAllIdpUsers: function () {
                //BusyIndicator.show(500);
                var sIdpLocation = "/cis_brakesdev";
                /*switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        sIdpLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        sIdpLocation = "/cis_brakesdev";
                        break;
                    default:
                        sIdpLocation = "/cis_bsxtdd";
                } */
                var url = this.appModulePath + sIdpLocation + "/scim/Users";
                var that = this;
                var limit = 25;
                //BusyIndicator.show(500);
                this.startIndex = "1";
                this.sLastPUserId = "";
                this.aResources = [];
                this.recursiveAjaxToFetchAllIdpUsers(url);

                /* $.ajax({
                    url: url,
                    type: "GET",
                    data: {
                        startIndex: '100'
                        //page : '2',
                        //page : 2
                        //'count': limit
                    },
                    //contentType: "application/json",
                    //dataType: "json",
                    //data: JSON.stringify(oPayload),
                    //beforeSend: function (xhr) {
                    //    xhr.setRequestHeader("Accept", "application/json");
                    //},
                    success: function (oData, oResponse) {
                        BusyIndicator.hide();
                        that.getView().getModel("oIdpUsersModel").setData(oData.Resources);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Could not fetch the IDP users " + errorThrown);
                    }
                }, this); */
            },

            recursiveAjaxToFetchAllIdpUsers: function (sUrl) {
                var startIndex = this.startIndex, totalResults, itemsPerPage;
                var that = this;
                var url = sUrl;
                //BusyIndicator.show();
                this.loadBusyDialog();
                $.ajax({
                    url: url,
                    type: "GET",
                    data: {
                        startIndex: startIndex
                    },
                    success: function (oData, oResponse) {

                        totalResults = oData.totalResults;
                        itemsPerPage = oData.itemsPerPage;
                        if (that.aResources.length <= 0) {
                            that.aResources = oData.Resources;
                        } else {
                            that.aResources = that.aResources.concat(oData.Resources);
                        }

                        /* logic to fetch all the users from the API
                        the API returns a maximum of 100 users per page i.e, per AJAX call
                        hence added the recursive calling of the AJAX call to fetch all the users*/
                        if (that.aResources.length < totalResults) {
                            that.startIndex = that.aResources.length;
                            that.recursiveAjaxToFetchAllIdpUsers(url);
                        } else {
                            var aFinalResources = that.aResources;
                            for (var i = 0; i < aFinalResources.length; i++) {

                                var sUserSchema = "urn:ietf:params:scim:schemas:extension:sap:2.0:User";
                                var sValidTo = "", sValidToIso = "";
                                if (aFinalResources[i][sUserSchema].validTo !== undefined) {
                                    sValidTo = aFinalResources[i][sUserSchema].validTo;
                                    sValidToIso = new Date(sValidTo).toISOString();
                                }
                                aFinalResources[i].userFullName = aFinalResources[i].name.givenName + " " + aFinalResources[i].name.familyName;
                                aFinalResources[i].validTo = sValidTo;
                                aFinalResources[i].validToIso = sValidToIso;

                                if (aFinalResources[i].userType !== undefined) {
                                    var sUserType = aFinalResources[i].userType.toUpperCase();
                                    var sUserCategory = "";

                                    switch (sUserType) {
                                        case "CUSTOMER":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "EMPLOYEE":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "PARTNER":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "PUBLIC":
                                            sUserCategory = "Permanent";
                                            break;
                                        case "EXTERNAL":
                                            sUserCategory = "Temporary";
                                            break;
                                        case "ONBOARDEE":
                                            sUserCategory = "Permanent";
                                            break;
                                        default:
                                            sUserCategory = "";
                                    }

                                    aFinalResources[i].userCategory = sUserCategory;

                                } else {

                                    aFinalResources[i].userCategory = "";
                                }
                            }

                            aFinalResources.sort(function (a, b) {
                                return a.userFullName.localeCompare(b.userFullName);
                            });

                            that.getView().getModel("oIdpUsersModel").setData(aFinalResources);
                            that.sLastPUserId = aFinalResources[aFinalResources.length - 1][sUserSchema].userId;

                            that.setFiltersOnUsers();
                            /* var sRowCount = aFinalResources.length;
                            that.getView().getModel("oIdpUsersCount").setProperty("/count", sRowCount);
                            that.getView().getModel("oIdpUsersCount").refresh(true); */
                            //    BusyIndicator.hide();
                            that.hideBusyIndicator();
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        //BusyIndicator.hide();
                        this.hideBusyIndicator();
                        MessageBox.error("Could not fetch the IDP users " + errorThrown);
                    }
                }, this);
            },

            resetUserPwd: function (oEvent) {
                var sUserMailId = oEvent.getSource().getParent().getCells()[0].getText();
                var sUserName = oEvent.getSource().getParent().getCells()[0].getTitle();
                if (sUserMailId) {
                    sUserMailId = sUserMailId.toLowerCase();
                    this.resetUserPassword(sUserMailId, sUserName);
                    /*TESTING : RESET PASSWORD only for JOHN EXAMPLE user */
                    /*if (sUserMailId == "john.example@sap.com") {
                        this.resetUserPassword(sUserMailId);
                    } else {
                        MessageBox.alert("For TESTING, password reset is only allowed for user - john.example@sap.com");
                    } */
                } else {
                    console.log("User mail Id is empty!!! Please check");
                }
            },

            resetUserPassword: function (sUserMailId, sUserName) {
                //var url = this.appModulePath + "/sap/opu/odata/sap/ZRF_REPLENISHMENT_SRV/TOListSet";
                var oLocation = "/cis_brakesdev";
                /*switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        oLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        oLocation = "/cis_brakesdev";
                        break;
                    default:
                        oLocation = "/cis_bsxtdd";
                }*/
                var url = this.appModulePath + oLocation + "/service/users/statusPassword/new";
                var that = this;
                /* NEW CODE BEGIN*/
                this.oPasswdResetDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Reset password",
                    escapeHandler: function () {

                    },
                    content: [
                        new VerticalLayout({
                            content: [
                                new VerticalLayout({
                                    width: "300px",
                                    content: [
                                        new sap.m.Label({ text: "Password: ", required: true }),
                                        new sap.m.Input("sPwdFld", {
                                            liveChange: function(oEvent){
                                                this.validatePassword(oEvent)
                                            }.bind(this)
                                        }),
                                        new sap.m.Label({ text: "Re-enter Password: ", required: true }),
                                        new sap.m.Input("sReenterPwdFld", {
                                            change: function (oEvent) {
                                                var sConfirmPwd = oEvent.getSource().getValue();
                                                var sPwd = sap.ui.getCore().byId("sPwdFld").getValue();

                                                if (sConfirmPwd !== sPwd) {
                                                    oEvent.getSource().setValueState("Error");
                                                    oEvent.getSource().setValueStateText("Passwords do not match");
                                                    sap.ui.getCore().byId("resetPwdBtn").setEnabled(false);
                                                } else {
                                                    if(this.bValidPassword){
                                                        this.sResetPwd = sConfirmPwd;
                                                        oEvent.getSource().setValueState("None");
                                                        sap.ui.getCore().byId("resetPwdBtn").setEnabled(true);
                                                    }
                                                }

                                            }.bind(this)
                                        })
                                    ]
                                })
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button("resetPwdBtn", {
                        type: sap.m.ButtonType.Emphasized,
                        text: "Reset",
                        enabled: false,
                        press: function () {
                            // this.sResetPwd = sap.ui.getCore().byId("sPwdFld").getValue();
                            if (this.sResetPwd == "") {
                                //    this.sResetPwd = "Initial1!"
                                sap.ui.getCore().byId("sPwdFld").setValueState("Error");
                                sap.ui.getCore().byId("sPwdFld").setValueStateText("Password cannot be empty");
                            } else {
                                var oPayload =
                                {
                                    "identifier": "mail",
                                    "mail": sUserMailId,
                                    "password": this.sResetPwd
                                };
                                var that = this;
                                $.ajax({
                                    url: url,
                                    type: "PUT",
                                    contentType: "application/json",
                                    //dataType: "json",
                                    data: JSON.stringify(oPayload),
                                    success: function (oData, response) {

                                        BusyIndicator.hide();
                                        that.oPasswdResetDialog.close();
                                        sap.ui.getCore().byId("sPwdFld").destroy();
                                        sap.ui.getCore().byId("sReenterPwdFld").destroy();
                                        that.oPasswdResetDialog.destroy();
                                        that.oPasswdResetDialog = null;

                                        var sNewPassword = "The user password has been reset successfully and the new password is " + "<strong>" + that.sResetPwd + "</strong>" + "<br>" +
                                            "Please make a note of the newly set password";
                                        var formattedText = new sap.m.FormattedText("formattedTxtMsg", {
                                            htmlText: sNewPassword
                                        });
                                        MessageBox.success(formattedText, {
                                            onClose: function (sAction) {
                                                if (sAction === "OK") {
                                                    that.triggerEmailNotification(sUserName, sUserMailId);
                                                    that.fetchAllIdpUsers();
                                                }
                                            }
                                        });
                                    },
                                    error: function (jqXHR, textStatus, errorThrown) {

                                        BusyIndicator.hide();
                                        that.oPasswdResetDialog.close();
                                        sap.ui.getCore().byId("sPwdFld").destroy();
                                        sap.ui.getCore().byId("sReenterPwdFld").destroy();
                                        that.oPasswdResetDialog.destroy();
                                        that.oPasswdResetDialog = null;

                                        if (jqXHR.getAllResponseHeaders().includes("x-message-code: PASSWORD_IN_HISTORY")) {
                                            MessageBox.error("Password could not be reset as the new password is already in history, please choose a different password and try again!");
                                        } else if (jqXHR.getAllResponseHeaders().includes("x-message-code: INSUFFICIENT_PASSWORD_COMPLEXITY")) {
                                            MessageBox.error("Password could not be reset as the new password's complexity is not sufficient, please choose a different password and try again!");
                                        }
                                        else {
                                            MessageBox.error("Password could not be reset, please retry with another password" + errorThrown);
                                        }
                                    }
                                }, that);
                            }

                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this.oPasswdResetDialog.close();
                            sap.ui.getCore().byId("sPwdFld").destroy();
                            sap.ui.getCore().byId("sReenterPwdFld").destroy();
                            this.oPasswdResetDialog.destroy();
                            this.oPasswdResetDialog = null;

                            //    this.triggerEmailNotification(sUserName, sUserMailId);

                        }.bind(this)
                    })
                });
                this.oPasswdResetDialog.open();

                /* NEW CODE ENDS */

            },

            validatePassword: function (oEvent) {
                var oPasswdFld = oEvent.getSource(),
                    oView = this.getView(),
                    that = this;
                var sPassword = oEvent.getSource().getValue();
                this.bValidPassword = false;

                if (sPassword !== "") {

                    // create popover
                    if (!this.oPasswordPopover) {
                        this.oPasswordPopover = Fragment.load({
                            id: oView.getId(),
                            name: "uk.co.brakes.rf.manageuserpasswordui.fragments.PasswordHelpPopover",
                            controller: this
                        }).then(function (oPopover) {
                            oView.addDependent(oPopover);
                            return oPopover;
                        });
                    }
                    this.oPasswordPopover.then(function (oPopover) {
                        oPopover.openBy(oPasswdFld);
                        oPopover.setInitialFocus(oPasswdFld);
                        /*check for following password criteria for creation */
                        /*1. must contain  at least 8 characters long
                          2. must include Uppercase letters
                          3. must inclue Lowercase Letters
                          4. must include Numbers
                          5. must include Symbols*/
    
                        //Char Length >= 8
                        if (sPassword.length >= 8) {
                            oView.byId("pswdCharLen_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdCharLen_cBox").setSelected(false);
                        }
    
                        //uppercase letters
                        if (Boolean(sPassword.match(/[A-Z]/))) {
                            oView.byId("pswdUpperCase_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdUpperCase_cBox").setSelected(false);
                        }
    
                        //lowercase letters
                        if (Boolean(sPassword.match(/[a-z]/))) {
                            oView.byId("pswdLowerCase_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdLowerCase_cBox").setSelected(false);
                        }
    
                        //numbers
                        if (Boolean(sPassword.match(/\d/))) {
                            oView.byId("pswdNumber_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdNumber_cBox").setSelected(false);
                        }
    
                        //symbols
                        if (Boolean(sPassword.match(/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/))) {
                            oView.byId("pswdSymbol_cBox").setSelected(true);
                        } else {
                            oView.byId("pswdSymbol_cBox").setSelected(false);
                        }

                        if( oView.byId("pswdCharLen_cBox").getSelected() &&
                            oView.byId("pswdUpperCase_cBox").getSelected() &&
                            oView.byId("pswdLowerCase_cBox").getSelected() &&
                            oView.byId("pswdNumber_cBox").getSelected() &&
                            oView.byId("pswdSymbol_cBox").getSelected()){
                                that.bValidPassword = true;
                        }else{
                            that.bValidPassword = false;
                        }
                    });

                }
            },

            clearPopoverFlds: function(oEvent){
                oEvent.getSource().destroy();
                this.oPasswordPopover = null;
            },

            getLoggedInUserDetails: function () {
                var sDest = "/user-api";
                var sUrl = this.appModulePath + sDest + "/currentUser";
                this.loggedinUserEmail = "";
                this.firstname = "";
                this.lastname = "";
                this.name = "";
                this.displayName = "";
                var that = this;

                $.ajax({
                    url: sUrl,
                    type: "GET",
                    contentType: "application/json",
                    //dataType: "json",
                    //data: JSON.stringify(oPayload),
                    /* beforeSend: function (xhr) {
                        var param = sUrl;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/json");
 
                    }, */
                    success: function (oData, response) {
                        var oCurrentUser = JSON.parse(oData);
                        that.loggedinUserEmail = oCurrentUser.email;
                        that.firstname = oCurrentUser.firstname;
                        that.lastname = oCurrentUser.lastname;
                        that.name = oCurrentUser.name;
                        that.displayName = oCurrentUser.displayName;
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Password reset email could not be sent");
                    }
                }, that);
            },

            /*trigger an email to the requestor with the user name and newly set password */
            triggerEmailNotification: function (sUserName, sUserEmailId) {
                //var sDest = "/user-api";
                //var sUrl = this.appModulePath + sDest + "/currentUser";
                var sPassword = this.sResetPwd;
                var sRequestorEmailId = this.loggedinUserEmail;
                var sUserId = sUserName;
                var sDest = "/bsxcpeaexperience";
                var sUrl = this.appModulePath + sDest + "/cpea-experience/NotifyUser(RequesterEmail=\'" + sRequestorEmailId + "\',userID=\'" + sUserId + "\'" + ",Password=\'" + sPassword + "\')";

                var that = this;
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    contentType: "application/json",
                    //dataType: "json",
                    //data: JSON.stringify(oPayload),
                    /* beforeSend: function (xhr) {
                        var param = sUrl;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/json");
 
                    }, */
                    success: function (oData, response) {

                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Password reset email could not be sent");
                    }
                }, that);

            },

            onTableUpdateStarted: function (oEvent) {
                var sReason = oEvent.getParameters().reason;
                if (sReason === "Growing") {

                }
            },

            onUserSearch: function (oEvent) {
                /* */

                var oLocation = "/bsxorgappsservices";
                /*switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        oLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        oLocation = "/cis_brakesdev";
                        break;
                    default:
                        oLocation = "/cis_bsxtdd";
                }*/
                var url = this.appModulePath + oLocation + "/services/services.xsodata";
                var that = this;
                /*$.ajax({
                    url: url,
                    type: "GET",
                    //contentType: "application/json",
                    data: {
                        $format: 'json'
                    },
                    success: function (oData, response) {
 
                        BusyIndicator.hide();
                        MessageBox.success("success");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
 
                        BusyIndicator.hide();
                        MessageBox.error("error");
                    }
                }, that); */

                /* */

                /* */
                var url = this.appModulePath + "/bsxcpeaexperience" + "/cpea-experience/Approvers?PLANT=GT10";
                var that = this;
                /* $.ajax({
                    url: url,
                    type: "GET",
                    //contentType: "application/json",
                    data: {
                        $format: 'json'
                    },
                    success: function (oData, response) {
 
                        BusyIndicator.hide();
                        MessageBox.success("HDB success");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
 
                        BusyIndicator.hide();
                        MessageBox.error("error");
                    }
                }, that); */
                /* */
                this.fetchAllIdpUsers();
                //this.setFiltersOnUsers();
            },

            setFiltersOnUsers: function (oEvent) {
                //var oUserNameFld = this.getView().byId("userNameInput");
                //    var oLastNameFld = this.getView().byId("lastNameInput");

                /* if (oUserNameFld.getTokens().length > 0) {
                    for (var i = 0; i < oUserNameFld.getTokens().length; i++) {
                        var sUserName = oUserNameFld.getTokens()[i].getText();
                        userNameFilter.push(new Filter("userFullName", FilterOperator.EQ, sUserName));
                    }
                } */

                var userFilter = [], userNameFilter = [], userTypeFilter = [], expDateFilter = [], allFilter = [], sExpDate = "";

                /* */
                var sUserName = this.getView().byId("userNameInput").getValue();
                if (sUserName !== "") {
                    userFilter.push(new Filter("name/givenName", FilterOperator.Contains, sUserName));
                    userFilter.push(new Filter("name/familyName", FilterOperator.Contains, sUserName));
                }

                var sUserType = this.getView().byId("userTypeInput").getSelectedKey();
                //var oExpDateValue = this.getView().byId("expDatePicker").getDateValue();
                var sExpDateFrom = this.getView().byId("expDatePicker").getFrom();
                var sExpDateTo = this.getView().byId("expDatePicker").getTo();
                var sExpDateFromISO = "", sExpDateToISO = "";

                if (sExpDateFrom !== "" && sExpDateFrom !== null && sExpDateTo !== "" && sExpDateTo !== null) {
                    sExpDateFromISO = new Date(sExpDateFrom).toISOString();
                    sExpDateToISO = new Date(sExpDateTo).toISOString();

                    //expDateFilter.push(new Filter("validToIso", FilterOperator.GE, sExpDateFromISO));
                    //expDateFilter.push(new Filter("validToIso", FilterOperator.LE, sExpDateToISO));

                    expDateFilter = new Filter({
                        filters: [
                            new Filter("validToIso", FilterOperator.GE, sExpDateFromISO),
                            new Filter("validToIso", FilterOperator.LE, sExpDateToISO)
                        ],
                        and: true
                    });

                    /* expDateFilter = new Filter({
                        path: "validToIso",
                        operator: FilterOperator.BT,
                        value1: sExpDateFromISO,
                        value2: sExpDateToISO
                      });  */
                }

                if (sUserType !== "") {
                    userTypeFilter.push(new Filter("userCategory", FilterOperator.EQ, sUserType));
                }

                /* 
                if (userNameFilter.length > 0) {
                    allFilter.push(new Filter(userNameFilter, false));
                } */

                if (userFilter.length > 0) {
                    allFilter.push(new Filter(userFilter, false));
                }

                if (userTypeFilter.length > 0) {
                    allFilter.push(new Filter(userTypeFilter, false));
                }

                if (expDateFilter.aFilters !== undefined && expDateFilter.aFilters.length > 0) {
                    allFilter.push(new Filter(expDateFilter, false));
                }

                if (allFilter.length > 0) {
                    this.getView().byId("usersTable").getBinding("items").filter(allFilter);
                } else {
                    this.getView().byId("usersTable").getBinding("items").filter();
                }

                var sRowCount = this.getView().byId("usersTable").getBinding("items").getLength();
                this.getView().getModel("oIdpUsersCount").setProperty("/count", sRowCount);
                this.getView().getModel("oIdpUsersCount").refresh(true);

            },

            onSearchUser: function (oEvent) {
                var sValue = oEvent.getSource().getValue();
                if (sValue !== "") {
                    var userFilter = [], userTypeFilter = [], expDateFilter = [], allFilter = [];
                    userFilter.push(new Filter("name/givenName", FilterOperator.EQ, sValue));
                    userFilter.push(new Filter("name/familyName", FilterOperator.EQ, sValue));

                    if (userFilter.length > 0) {
                        allFilter.push(new Filter(userFilter, false));
                        this.getView().byId("usersTable").getBinding("items").filter(allFilter);
                    } else {
                        this.getView().byId("usersTable").getBinding("items").filter();
                    }
                } else {
                    this.getView().byId("usersTable").getBinding("items").filter();
                }
            },

            resetControls: function () {
                this.getView().byId("userNameInput").setValue("");
                this.getView().byId("usersTable").getBinding("items").filter();
            },

            /* functions for create user - BEGIN*/
            onCreateUser: function (oEvent) {
                var sFirstName = sap.ui.getCore().byId("sFirstName").getValue();
                var sLastName = sap.ui.getCore().byId("sLastName").getValue();
                var sUserName = sap.ui.getCore().byId("sUserName").getValue();
                var sEmailId = sap.ui.getCore().byId("sEmail").getValue();
                var sInitialPassword = "initial1!";
                /*Temporary = External | Permanent = Employee */
                var sUserType = "External";
                var bActive = false;
                var sValidTo = "2023-02-23T14:37:04.991Z";

                if (sFirstName == "" || sLastName == "" || sUserName == "" || sEmailId == "") {
                    MessageBox.error("Cannot proceed with the creation of user until all the mandatory fields are filled");
                } else {
                    this.createUserInIdp(sFirstName, sLastName, sUserName, sEmailId, sInitialPassword, sUserType, bActive, sValidTo);
                }
            },

            createUserInIdp: function (sFirstName, sLastName, sUserName, sEmailId, sInitialPassword, sUserType, bActive, sValidTo) {
                var that = this;

                /* var oPayload = {
                    "emails": [
                        {
                            "primary": true,
                            "value": sEmailId
                        }
                    ],
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName
                    },
                    "schemas": [
                        "urn:ietf:params:scim:schemas:core:2.0:User"
                    ],
                    "userName": sUserName
                }; */

                var oPayload = {
                    "userName": sUserName,
                    "password": "initial1!",
                    "active": false,
                    "mailVerified": "TRUE",
                    "userType": "External",
                    "emails": [
                        {
                            "primary": true,
                            "value": sEmailId
                        }
                    ],
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName
                    },
                    "schemas": [
                        "urn:ietf:params:scim:schemas:core:2.0:User"
                    ]
                };

                var oNewPayload =
                {
                    "schemas": [
                        "urn:ietf:params:scim:schemas:core:2.0:User",
                        "urn:ietf:params:scim:schemas:extension:sap:2.0:User"
                    ],
                    "userName": sUserName,
                    "password": sInitialPassword,
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName
                    },
                    "userType": sUserType,
                    "active": bActive,
                    "emails": [
                        {
                            "value": sEmailId,
                            "primary": true
                        }
                    ],
                    "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                        "mailVerified": true,
                        // "validFrom": "2023-02-23T14:37:04.991Z",
                        "validTo": sValidTo
                    }
                };

                /* var oNewPayload=     {
                    "schemas": [
                       "urn:ietf:params:scim:schemas:core:2.0:User",
                       "urn:ietf:params:scim:schemas:extension:sap:2.0:User"
                    ],
                    "userName": "user17",
                    "password": "initial1!",
                    "name": {
                       "familyName": "example17",
                       "givenName": "user17"
                    },
                    "userType": "External",
                    "active": false,
                    "emails": [
                       {
                          "value": "user17.example1@example.com",
                          "primary": true
                       }
                    ],
                    "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                         "mailVerified": true,
                         "validFrom": "2023-02-23T14:37:04.991Z",
                         "validTo": "2024-02-23T14:37:04.991Z"
                     }
                 }; */
                var oLocation = "";
                switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        oLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        oLocation = "/cis_brakesdev";
                        break;
                    default:
                        oLocation = "/cis_bsxtdd";
                }
                var url = this.appModulePath + oLocation + "/scim/Users";

                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "POST",
                    contentType: "application/scim+json",
                    dataType: "json",
                    data: JSON.stringify(oNewPayload),
                    beforeSend: function (xhr) {
                        var param = url;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/scim+json");

                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        MessageBox.success("User has been created successfully in the IDP, proceeding with user creation in subaccount", {
                            onClose: function (sAction) {
                                if (sAction === "OK") {
                                    that.createUserInSubaccount(sFirstName, sLastName, sUserName, sEmailId);
                                }
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("User could not be created in IDP, please re-try", errorThrown);
                    }
                }, this);

            },

            getCSRFToken: function (url) {
                var token = null;
                $.ajax({
                    url: url,
                    type: "GET",
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("X-CSRF-Token", "Fetch");
                    },
                    complete: function (xhr) {
                        token = xhr.getResponseHeader("X-CSRF-Token");
                    }
                });
                return token;
            },

            createUserInSubaccount: function (sFirstName, sLastName, sUserName, sEmailId) {
                var that = this;

                var path = "https://cockpit.eu10.hana.ondemand.com/" + "ajax/";
                var globalAccountGuid = "8dbdeef9-0011-4c0d-86f6-1263455768f9" + "/";
                var sRegion = "cf-eu10" + "/";
                var subAccountId = this.subAccId;
                //    var subAccountId = "7bc2e4a2-b1fb-420e-8ff3-0c1938d419ab";
                var sEntity = "/" + "createShadowUser" + "/";
                //var oLocation = "/btp_cockpit";

                //var url = this.appModulePath + oLocation + "/ajax/" + globalAccountGuid + sRegion + subAccountId + sEntity + subAccountId;

                //var url1 = "https://api.authentication.eu10.hana.ondemand.com" + "/Users";

                var sDest = "/scim_shadow_users";
                var url = this.appModulePath + sDest + "/Users";
                //var url = this.appModulePath + sDest;
                //var url = "https://api.authentication.eu10.hana.ondemand.com/Users";
                var oPayload = {
                    "origin": this.oLocation,
                    "username": sUserName,
                    "email": sEmailId
                };

                var oPayload1 = {
                    "id": "ef4772b9-3295-4d12-af66-ef07fce21227",
                    "externalId": "",
                    "meta": {
                        "attributes": [
                            "string"
                        ],
                        "version": 1,
                        "created": "2023-02-15T12:56:14.642Z",
                        "lastModified": "2023-02-15T12:56:14.642Z"
                    },
                    "userName": sUserName,
                    "name": {
                        "familyName": sLastName,
                        "givenName": sFirstName,
                        "honorificPrefix": "string",
                        "honorificSuffix": "string",
                        "formatted": "string",
                        "middleName": "string"
                    },
                    "emails": [
                        {
                            "type": "string",
                            "value": sEmailId,
                            "primary": true
                        }
                    ],
                    "approvals": [
                        {
                            "clientId": "cloud_controller",
                            "expiresAt": "2023-02-15T12:56:14.642Z",
                            "lastUpdatedAt": "2023-02-15T12:56:14.642Z",
                            "scope": "cloud_controller.write",
                            "status": "APPROVED",
                            "userId": ""
                        }
                    ],
                    "active": true,
                    "verified": true,
                    "origin": "sap.default",
                    "zoneId": subAccountId,
                    "displayName": "string",
                    "locale": "string",
                    "nickName": "string",
                    "passwordLastModified": "2023-02-15T12:56:14.642Z",
                    "previousLogonTime": 1588056537011,
                    "lastLogonTime": 1589284136890,
                    "schemas": [
                        "urn:scim:schemas:core:1.0"
                    ],
                    "phoneNumbers": [
                        {
                            "value": "123456789"
                        }
                    ],
                    "preferredLanguage": "string",
                    "profileUrl": "string",
                    "salt": "string",
                    "timezone": "string",
                    "title": "string",
                    "userType": "string"
                };

                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oPayload1),
                    beforeSend: function (xhr) {
                        var param = url;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/json");
                        xhr.setRequestHeader("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vYnN4LXRkZC1xcThha3pqbi5hdXRoZW50aWNhdGlvbi5ldTEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktLTEyMTM1MTE0MDQiLCJ0eXAiOiJKV1QiLCJqaWQiOiAicnhZTkNZRm1hQWF4QlM0WjZKUDRabGhnc2xHUjRRUXdGT2EwLzZwVXMrOD0ifQ.eyJqdGkiOiJhODhlYjI2ZTliZDE0MDdhYTc4MTUyYWY2ZTI5NjhhZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJ6ZG4iOiJic3gtdGRkLXFxOGFrempuIn0sInN1YiI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiYXV0aG9yaXRpZXMiOlsieHNfdXNlci53cml0ZSIsInVhYS5yZXNvdXJjZSIsInhzX2F1dGhvcml6YXRpb24ucmVhZCIsInhzX2lkcC53cml0ZSIsInhzX3VzZXIucmVhZCIsInhzX2lkcC5yZWFkIiwieHNfYXV0aG9yaXphdGlvbi53cml0ZSJdLCJzY29wZSI6WyJ4c191c2VyLndyaXRlIiwidWFhLnJlc291cmNlIiwieHNfYXV0aG9yaXphdGlvbi5yZWFkIiwieHNfaWRwLndyaXRlIiwieHNfdXNlci5yZWFkIiwieHNfaWRwLnJlYWQiLCJ4c19hdXRob3JpemF0aW9uLndyaXRlIl0sImNsaWVudF9pZCI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiY2lkIjoic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJhenAiOiJzYi1uYS1mZDY5ZDczOS1kZDdjLTQ5OTYtOTczOS0xYWY1OTRlMDhkMGIhYTEyNDk2OSIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiOTM5YTExMWEiLCJpYXQiOjE2NzY0OTg4MzUsImV4cCI6MTY3NjU0MjAzNSwiaXNzIjoiaHR0cHM6Ly9ic3gtdGRkLXFxOGFrempuLmF1dGhlbnRpY2F0aW9uLmV1MTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJhdWQiOlsic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJ1YWEiLCJ4c191c2VyIiwieHNfaWRwIiwieHNfYXV0aG9yaXphdGlvbiJdfQ.WnnxstYfIPsQLDhJN-_yCgqwyzVppcwiXjLGifeRPfVyHq0GTPhj2PjOaS45fq3uj2gOC5UAfGxwr9xpyUiSk9iVJ8KdDy7yX5kwSAB_sqh2aDDyJb8qccQwiZHAuVZrDBmnGJXGSfNu5IAvwqr3SiXI2MfBI4Ti7SfeDFkxIbtk0N8twySjUWOlDA0_1nNR-IfGqqdxMNVCEeV8ANunQO8W_-2OmajeBqp4KMBdKu18H_4nXM7lQR-SaNgF0GT7rQA7Vfzbo5Yq_x4EIAKgOfosaAiF4uzLx4vMxetU38IMQiGkRHRYceBo01R2BwSyvHWIMgeEFo2NqWLJvSTZ_w");

                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        MessageBox.success("User has been created successfully in the subaccount");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("User could not be created in subaccount, please re-try", errorThrown);
                    }
                }, this);

            },

            /* functions for create user - END */

            /*on cancel create user */
            onCancelCreateUser: function (oEvent) {
                this.oCreateUserDialog.close();
                this.oCreateUserDialog.destroy();
                this.oCreateUserDialog = null;
            },

            /*ui actions */
            onChangeBtpAccess: function (oEvent) {
                var oSwitch = this.getView().byId("btpAccessSwitch");
                var bAccess = oEvent.getSource().getState();
                var sUserId = "";
                var bStatusText = "";
                var sUserName = "";
                var sUserEmail = "";

                var sRowPath = oEvent.getSource().getParent().oBindingContexts.oIdpUsersModel.getPath();
                sUserId = this.getView().getModel("oIdpUsersModel").getProperty(sRowPath).id;
                sUserId = sUserId.toUpperCase();
                sUserName = this.getView().getModel("oIdpUsersModel").getProperty(sRowPath).userName;
                sUserEmail = this.getView().getModel("oIdpUsersModel").getProperty(sRowPath).emails[0].value;

                if (bAccess === true) {
                    bStatusText = "Active";
                } else if (bAccess === false) {
                    bStatusText = "Inactive";
                }

                var oLocation = "/cis_brakesdev";
                /*switch (this.oLocation) {
                    case "httpsaqcgazolg.accounts.ondemand.com":
                        oLocation = "/cis_bsxtdd";
                        break;
                    case "httpsaqrl92om1.accounts.ondemand.com":
                        oLocation = "/cis_brakesdev";
                        break;
                    default:
                        oLocation = "/cis_bsxtdd";
                } */
                var that = this;
                var url = this.appModulePath + oLocation + "/scim/Users/" + sUserId;

                BusyIndicator.show(500);

                var oPayload = {
                    "schemas": [
                        "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                    ],
                    "Operations": [
                        {
                            "op": "replace",
                            "value": {
                                "active": bAccess
                            }
                        }
                    ]
                };

                $.ajax({
                    url: url,
                    type: "PATCH",
                    contentType: "application/scim+json",
                    dataType: "json",
                    data: JSON.stringify(oPayload),
                    beforeSend: function (xhr) {
                        var param = url;
                        var token = that.getCSRFToken(param);
                        xhr.setRequestHeader("X-CSRF-Token", token);
                        xhr.setRequestHeader("Accept", "application/scim+json");
                        xhr.setRequestHeader("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vYnN4LXRkZC1xcThha3pqbi5hdXRoZW50aWNhdGlvbi5ldTEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktLTEyMTM1MTE0MDQiLCJ0eXAiOiJKV1QiLCJqaWQiOiAicnhZTkNZRm1hQWF4QlM0WjZKUDRabGhnc2xHUjRRUXdGT2EwLzZwVXMrOD0ifQ.eyJqdGkiOiJhODhlYjI2ZTliZDE0MDdhYTc4MTUyYWY2ZTI5NjhhZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJ6ZG4iOiJic3gtdGRkLXFxOGFrempuIn0sInN1YiI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiYXV0aG9yaXRpZXMiOlsieHNfdXNlci53cml0ZSIsInVhYS5yZXNvdXJjZSIsInhzX2F1dGhvcml6YXRpb24ucmVhZCIsInhzX2lkcC53cml0ZSIsInhzX3VzZXIucmVhZCIsInhzX2lkcC5yZWFkIiwieHNfYXV0aG9yaXphdGlvbi53cml0ZSJdLCJzY29wZSI6WyJ4c191c2VyLndyaXRlIiwidWFhLnJlc291cmNlIiwieHNfYXV0aG9yaXphdGlvbi5yZWFkIiwieHNfaWRwLndyaXRlIiwieHNfdXNlci5yZWFkIiwieHNfaWRwLnJlYWQiLCJ4c19hdXRob3JpemF0aW9uLndyaXRlIl0sImNsaWVudF9pZCI6InNiLW5hLWZkNjlkNzM5LWRkN2MtNDk5Ni05NzM5LTFhZjU5NGUwOGQwYiFhMTI0OTY5IiwiY2lkIjoic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJhenAiOiJzYi1uYS1mZDY5ZDczOS1kZDdjLTQ5OTYtOTczOS0xYWY1OTRlMDhkMGIhYTEyNDk2OSIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiOTM5YTExMWEiLCJpYXQiOjE2NzY0OTg4MzUsImV4cCI6MTY3NjU0MjAzNSwiaXNzIjoiaHR0cHM6Ly9ic3gtdGRkLXFxOGFrempuLmF1dGhlbnRpY2F0aW9uLmV1MTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiI3YmMyZTRhMi1iMWZiLTQyMGUtOGZmMy0wYzE5MzhkNDE5YWIiLCJhdWQiOlsic2ItbmEtZmQ2OWQ3MzktZGQ3Yy00OTk2LTk3MzktMWFmNTk0ZTA4ZDBiIWExMjQ5NjkiLCJ1YWEiLCJ4c191c2VyIiwieHNfaWRwIiwieHNfYXV0aG9yaXphdGlvbiJdfQ.WnnxstYfIPsQLDhJN-_yCgqwyzVppcwiXjLGifeRPfVyHq0GTPhj2PjOaS45fq3uj2gOC5UAfGxwr9xpyUiSk9iVJ8KdDy7yX5kwSAB_sqh2aDDyJb8qccQwiZHAuVZrDBmnGJXGSfNu5IAvwqr3SiXI2MfBI4Ti7SfeDFkxIbtk0N8twySjUWOlDA0_1nNR-IfGqqdxMNVCEeV8ANunQO8W_-2OmajeBqp4KMBdKu18H_4nXM7lQR-SaNgF0GT7rQA7Vfzbo5Yq_x4EIAKgOfosaAiF4uzLx4vMxetU38IMQiGkRHRYceBo01R2BwSyvHWIMgeEFo2NqWLJvSTZ_w");

                    },
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        var sText = "The BTP Status of the user has been successfully set to " + "<strong>" + bStatusText + "</strong>";
                        var formattedText = new sap.m.FormattedText("formattedMsg", {
                            htmlText: sText
                        });
                        MessageBox.success(formattedText, {
                            onClose: function (sAction) {
                                if (sAction === "OK") {
                                    //    that.fetchAllIdpUsers();
                                }
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("The BTP Status of the user could not be changed, please re-try", errorThrown);
                    }
                }, this);

            },

            onSelectUserType: function (oEvent) {
                var sTempEmail = "", sTempUserName = "";
                var sTempEmailDomain = "@noemail.co.uk";
                var sKey = oEvent.getSource().getSelectedKey();
                if (sKey == "Temporary") {
                    sTempEmail = this.sLastPUserId + sTempEmailDomain;
                    sap.ui.getCore().byId("sEmail").setValue(sTempEmail);
                } else {
                    sap.ui.getCore().byId("sEmail").setValue("");
                }
            },

            onChangeValidDays: function (oEvent) {
                if (oEvent.getSource().getValue() > 0) {
                    var sFromDate = new Date();
                    var sToDate = new Date();
                    var sValidityDays = parseInt(sap.ui.getCore().byId("sValidDays").getValue());

                    sToDate.setDate(sFromDate.getDate() + sValidityDays);
                    sToDate = sToDate.toDateString();
                    sap.ui.getCore().byId("sValidTo").setValue(sToDate);
                } else {
                    sap.ui.getCore().byId("sValidTo").setValue("");
                }
            },

            onExpDateChange: function (oEvent) {
                var oDatePicker = oEvent.getSource();
                var bValid = oEvent.getParameter("valid");

                if (bValid) {
                    oDatePicker.setValueState("None");
                } else {
                    oDatePicker.setValueState("Error");
                }
            },

            handleSortButtonPressed: function () {
                if (!this.oSortDialog) {
                    Fragment.load({
                        name: "uk.co.brakes.rf.manageuserpasswordui.fragments.SortDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this.oSortDialog = oDialog;
                        //    this.oPutawayDialog.setModel(this.getView().getModel("transferOrderModel"), "transferOrderModel");
                        this.getView().addDependent(this.oSortDialog);
                        this.oSortDialog.open();
                    }.bind(this));
                } else {
                    this.oSortDialog.open();
                }
            },

            handleSortDialogConfirm: function (oEvent) {
                var oTable = this.byId("usersTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    sPath,
                    bDescending,
                    aSorters = [];

                // apply the selected sort and group settings
                oBinding.sort();

                sPath = mParams.sortItem.getKey();
                bDescending = mParams.sortDescending;
                aSorters.push(new Sorter(sPath, bDescending));

                // apply the selected sort and group settings
                oBinding.sort(aSorters);
            },

            /*formatters */
            identifyMailId: function (aMailIds) {
                for (var i = 0; i < aMailIds.length; i++) {
                    if (aMailIds[i].primary === true) {
                        return aMailIds[i].value;
                    }
                }
            },

            formatValidTo: function (sDate) {
                if (sDate !== undefined && sDate !== "") {
                    var sDate = new Date(sDate);
                    var sNewDate = sDate.toDateString();
                    return sNewDate;
                } else {
                    return "";
                }

            },

            formatTableCount: function () {
                var sRowCount = this.getView().byId("usersTable").getBinding("items").length;
                return sRowCount;
            }
        });
    });