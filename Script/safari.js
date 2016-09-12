var streetViewSafari;
(function (streetViewSafari) {
    var app;
    (function (app) {
        var StreetViewSafariApp = (function () {
            function StreetViewSafariApp() {
                this.params = null;
            }
            StreetViewSafariApp.prototype.initialize = function () {
                this._parseQuery();
                this.appViewModel = new streetViewSafari.ui.AppViewModel(this);
                var user = new streetViewSafari.objects.User(null);
                if (user.getParseUser()) {
                    //user is logged in
                    this._handleUserLogin(user);
                }
                this._handleStartup();
                $("#status-wrapper").hide();
                $("#wrapper").show();
            };
            StreetViewSafariApp.prototype.isMobile = function () {
                if (!!navigator.userAgent.match(/iphone|android|blackberry/ig) || (this.params.mode === "m" || this.params.mode === "M")) {
                    return true;
                }
                return false;
            };
            StreetViewSafariApp.prototype.handleFacebookLogin = function () {
                var _this = this;
                ga('send', 'event', 'facebookLoginSignup', 'click');
                streetViewSafari.utility.userUtility.facebookLogin()
                    .then(function (result) {
                    if (result.existed) {
                        // facebook user has already signed up and will now login
                        var newUser = new streetViewSafari.objects.User(result.user);
                        _this._handleUserLogin(newUser);
                        _this.appViewModel.setShowingSignupPanel(false);
                    }
                    else {
                        // get a friendly username for the user
                        if (_this.appViewModel.showingLoginPanel()) {
                            _this.appViewModel.setShowingLoginPanel(false);
                        }
                        else if (_this.appViewModel.showingSignupPanel()) {
                            _this.appViewModel.setShowingSignupPanel(false);
                        }
                    }
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            StreetViewSafariApp.prototype.linkFacebook = function () {
                var _this = this;
                ga('send', 'event', 'linkFacebook', 'click');
                var parseUser = streetViewSafari.utility.userUtility.getUserFromSession();
                streetViewSafari.utility.userUtility.linkFacebook(parseUser)
                    .then(function (user) { return _this._handleUserLogin(new streetViewSafari.objects.User(user)); })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            StreetViewSafariApp.prototype.unlinkFacebook = function () {
                var _this = this;
                ga('send', 'event', 'unlinkFacebook', 'click');
                var parseUser = streetViewSafari.utility.userUtility.getUserFromSession();
                streetViewSafari.utility.userUtility.unlinkFacebook(parseUser)
                    .then(function (user) { return _this._handleUserLogin(new streetViewSafari.objects.User(user)); })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            StreetViewSafariApp.prototype.setFacebookUserNamePassword = function () {
                var _this = this;
                ga('send', 'event', 'setFacebookUserPass', 'click');
                var userName = this.appViewModel.enteredUserName();
                var password = this.appViewModel.enteredPassword();
                if (!userName || !password) {
                    this.appViewModel.subFormNotificationText("Please enter a username and password.");
                    return;
                }
                streetViewSafari.utility.userUtility.userNameExist(userName)
                    .then(function (exists) {
                    if (!exists) {
                        // username available
                        return streetViewSafari.utility.userUtility.setUsernameAndPassword(userName, password);
                    }
                    else {
                        _this.appViewModel.subFormNotificationText("That username is already taken. Try another one.");
                        return Promise.reject("That username is already taken. Try another one.");
                    }
                })
                    .then(function (user) {
                    if (user) {
                        var newUser = new streetViewSafari.objects.User(user);
                        _this._handleUserLogin(newUser);
                        _this.appViewModel.setShowingFacebookSignup(false);
                    }
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            StreetViewSafariApp.prototype._parseQuery = function () {
                var params = streetViewSafari.utility.safariUtility.getQueryParams(window.location.search);
                if (!params) {
                    params = {};
                }
                this.params = params;
            };
            StreetViewSafariApp.prototype._handleStartup = function () {
                if (this.params.s) {
                    var sarafiId = this.params.s;
                    this.appViewModel.loadSafariById(sarafiId);
                    this.appViewModel.toggleExpanded(true);
                }
                else {
                    this._loadStartupPosition();
                }
            };
            StreetViewSafariApp.prototype._loadStartupPosition = function () {
                var _this = this;
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) { return _this._handleGeolocateSuccess(position); }, function (error) { return _this._handleGeolocationError(error); });
                }
                else {
                    this.appViewModel.loadRandom();
                }
            };
            StreetViewSafariApp.prototype._handleGeolocationError = function (error) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.log("Geolocate: Permission Denied");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log("Geolocate: Position Unavailable");
                        break;
                    case error.TIMEOUT:
                        console.log("Geolocate: Timeout");
                        break;
                    case error.UNKNOWN_ERROR:
                        console.log("Geolocate: Unknown Error");
                        break;
                    default:
                        streetViewSafari.diagnostics.Logging.logError(error);
                        break;
                }
                this.appViewModel.loadRandom();
            };
            StreetViewSafariApp.prototype._handleGeolocateSuccess = function (position) {
                if (position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    var latlng = new google.maps.LatLng(lat, lng);
                    this.appViewModel.setStartupPosition(latlng);
                }
            };
            StreetViewSafariApp.prototype._handleUserLogin = function (user) {
                if (this.appViewModel.showingLoginPanel()) {
                    this.appViewModel.setShowingLoginPanel(false);
                }
                this.appViewModel.userViewModel.setUser(user);
                this.appViewModel.setLoggedIn(true);
                if (this.appViewModel.showingExisting() && this.appViewModel.safariViewModel) {
                    this.appViewModel.loadSafariById(this.appViewModel.safariViewModel.getSafari().id);
                }
            };
            StreetViewSafariApp.prototype.signup = function () {
                var _this = this;
                ga('send', 'event', 'signup', 'click');
                var username = this.appViewModel.enteredUserName();
                var password = this.appViewModel.enteredPassword();
                var email = this.appViewModel.enteredEmail();
                var validationError = this.appViewModel.validateSignup(username, password, email);
                if (validationError) {
                    this.appViewModel.subFormNotificationText(validationError);
                }
                else {
                    streetViewSafari.utility.userUtility.signUp(username, email, password)
                        .then(function (user) {
                        if (user) {
                            _this.appViewModel.subFormNotificationText("");
                            var newUser = new streetViewSafari.objects.User(user);
                            _this._handleUserLogin(newUser);
                            _this.appViewModel.setShowingSignupPanel(false);
                        }
                    })
                        .caught(function (error) {
                        if (error && error.message) {
                            _this.appViewModel.subFormNotificationText("Error: " + error.message);
                        }
                        streetViewSafari.diagnostics.Logging.logError(error);
                    });
                }
            };
            StreetViewSafariApp.prototype.login = function () {
                var _this = this;
                ga('send', 'event', 'login', 'click');
                var username = this.appViewModel.enteredUserName();
                var password = this.appViewModel.enteredPassword();
                var validationError = this.appViewModel.validateLogin(username, password);
                if (validationError) {
                    this.appViewModel.subFormNotificationText(validationError);
                }
                else {
                    streetViewSafari.utility.userUtility.login(username, password)
                        .then(function (user) {
                        _this.appViewModel.subFormNotificationText("");
                        _this.appViewModel.enteredUserName("");
                        _this.appViewModel.enteredPassword("");
                        _this._handleUserLogin(new streetViewSafari.objects.User(user));
                    })
                        .caught(function (error) {
                        if (error && error.message) {
                            _this.appViewModel.subFormNotificationText("Error: " + error.message);
                        }
                        streetViewSafari.diagnostics.Logging.logError(error);
                    });
                    this.flashStatusText("Logging you in...");
                }
            };
            StreetViewSafariApp.prototype.logout = function () {
                ga('send', 'event', 'logout', 'click');
                this.flashStatusText("Logging you out...");
                streetViewSafari.utility.userUtility.logout();
                this.appViewModel.setLoggedIn(false);
                if (this.appViewModel.showingExisting() && this.appViewModel.safariViewModel) {
                    this.appViewModel.loadSafariById(this.appViewModel.safariViewModel.getSafari().id);
                }
            };
            StreetViewSafariApp.prototype.resetPassword = function () {
                var _this = this;
                ga('send', 'event', 'resetPassword', 'click');
                if (streetViewSafari.utility.userUtility.isUserAuthenticated()) {
                    var password = this.appViewModel.enteredNewPassword();
                    streetViewSafari.utility.userUtility.resetPassword(password)
                        .then(function (user) { return _this.appViewModel.subFormNotificationText("Password has been set."); })
                        .caught(function (error) {
                        if (error && error.message) {
                            _this.appViewModel.subFormNotificationText(error.message);
                            streetViewSafari.diagnostics.Logging.logError(error);
                        }
                    });
                }
            };
            StreetViewSafariApp.prototype.forgotPassword = function () {
                var _this = this;
                ga('send', 'event', 'forgotPassword', 'click');
                var email = this.appViewModel.enteredForgotEmail();
                streetViewSafari.utility.userUtility.requestPasswordReset(email)
                    .then(function () { return _this.appViewModel.subFormNotificationText("Password reset email sent!"); })
                    .caught(function (error) {
                    if (error && error.message) {
                        _this.appViewModel.subFormNotificationText(error.message);
                        streetViewSafari.diagnostics.Logging.logError(error);
                    }
                });
            };
            StreetViewSafariApp.prototype.flashStatusText = function (status, duration) {
                var flashWrapper = $("#status-wrapper");
                flashWrapper.stop(true, true);
                this.appViewModel.statusText(status);
                flashWrapper.show();
                var dur = 5000;
                if (duration) {
                    dur = duration;
                }
                flashWrapper.fadeOut(dur, function () {
                    // Animation complete.
                });
            };
            return StreetViewSafariApp;
        }());
        app.StreetViewSafariApp = StreetViewSafariApp;
    })(app = streetViewSafari.app || (streetViewSafari.app = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var base;
    (function (base) {
        /** Base class which can be extended when interfacing with Parse objects. */
        var SaveBase = (function () {
            function SaveBase() {
            }
            /** Override this to return the object's attribute values. */
            SaveBase.prototype.getSaveState = function () { };
            /** Returns the type of the object. */
            SaveBase.prototype.getClassType = function () {
                return null;
            };
            /**
             * Saves the object to Parse with public read and private write access.
             * Returns a Promise which will be resolved with the underlying Parse object when the save is successful.
             */
            SaveBase.prototype.saveWithUserACL = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var parseClass = _this.getParseClass();
                    var acl = new Parse.ACL(streetViewSafari.utility.userUtility.getUserFromSession());
                    acl.setPublicReadAccess(true);
                    parseClass.saveClass.setACL(acl);
                    parseClass.saveClass.save(_this.getSaveState())
                        .then(function (result) { return resolve(result); }, function (error) { return reject(error); });
                });
            };
            /**
             * Saves the object to Parse with public read and public write access.
             * Returns a Promise which will be resolved with the underlying Parse object when the save is successful.
             */
            SaveBase.prototype.save = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var parseClass = _this.getParseClass();
                    var acl = new Parse.ACL();
                    acl.setPublicReadAccess(true);
                    parseClass.saveClass.save(_this.getSaveState())
                        .then(function (result) { return resolve(result); }, function (error) { return reject(error); });
                });
            };
            /** Returns the Query which can be used to fetch the object from Parse. */
            SaveBase.prototype.getQuery = function () {
                return new streetViewSafari.objects.ParseClass(this.getClassType()).getQuery();
            };
            /** Returns the a new Parse class defintion which can be used to create a new Parse object. */
            SaveBase.prototype.getParseClass = function () {
                return new streetViewSafari.objects.ParseClass(this.getClassType());
            };
            return SaveBase;
        }());
        base.SaveBase = SaveBase;
    })(base = streetViewSafari.base || (streetViewSafari.base = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var data;
    (function (data) {
        /** Class which wraps the google.maps.Geocoder. */
        var Geocoder = (function () {
            /** Constructs a new instance of the Geocoder. */
            function Geocoder() {
                this._geocoder = new google.maps.Geocoder();
            }
            /**
             * Geocodes an search value.
             * Returns a Promise which will be resolved with the Geocode operation is complete.
             */
            Geocoder.prototype.geocode = function (searchTerm) {
                var _this = this;
                ga('send', 'event', 'geocode', 'perform');
                return new Promise(function (resolve, reject) {
                    var geocoderRequest = {
                        address: searchTerm
                    };
                    _this._geocoder.geocode(geocoderRequest, function (results, status) {
                        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                            resolve(results[0].geometry.location);
                        }
                        else {
                            reject(new Error("No results found"));
                        }
                    });
                });
            };
            return Geocoder;
        }());
        data.Geocoder = Geocoder;
    })(data = streetViewSafari.data || (streetViewSafari.data = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var data;
    (function (data) {
        /** Class whch wraps a Parse query any exposes useful methods. */
        var Query = (function () {
            /** Constructs a new instance of the Query class by passing in a Parse object. */
            function Query(parseObject) {
                this._query = new Parse.Query(parseObject);
            }
            /** Adds a 'key = value' constraint to the query. */
            Query.prototype.addEqualTo = function (key, value) {
                this._query.equalTo(key, value);
            };
            /** Adds a select field to the query. */
            Query.prototype.addSelect = function (key) {
                this._query.select(key);
            };
            /** Adds an 'ObjectId = id' constraint. */
            Query.prototype.addGetById = function (id) {
                this._query.get(id);
            };
            /**
             * Executes the Query.
             * Returns a Promise which will contain an array of found objects when resolved.
             */
            Query.prototype.execute = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._query.find()
                        .then(function (result) { return resolve(result); }, function (error) { return reject(error); });
                });
            };
            /**
             * Executes the Query for count.
             * Returns a Promise which will contain the number of matching objects when resolved.
             */
            Query.prototype.executeForCount = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._query.count()
                        .then(function (result) { return resolve(result); }, function (error) { return reject(error); });
                });
            };
            /**
             * Executes the Query for the first found item.
             * Returns a Promise which will contain the first found object when resolved.
             */
            Query.prototype.first = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._query.first()
                        .then(function (result) { return resolve(result); }, function (error) { return reject(error); });
                });
            };
            /** Includes a field in the results. */
            Query.prototype.include = function (key) {
                this._query.include(key);
            };
            /** Adds a sort field and sort order to a Query. */
            Query.prototype.sort = function (key, sortOrder) {
                if (sortOrder === SortOrder.ASCENDING) {
                    this._query.ascending(key);
                }
                else {
                    this._query.descending(key);
                }
            };
            /** Limits the maximum number of results. */
            Query.prototype.limit = function (num) {
                this._query.limit(num);
            };
            /** Adds a spatial filter to the Query. */
            Query.prototype.withinGeoBox = function (key, southWest, northEast) {
                this._query.withinGeoBox(key, southWest, northEast);
            };
            /** Limits results to be within a specified Kilometer range from a given point. */
            Query.prototype.withinKilometers = function (key, geoPoint, kms) {
                this._query.withinKilometers(key, geoPoint, kms);
            };
            return Query;
        }());
        data.Query = Query;
        /** Sort order used in Queries. */
        (function (SortOrder) {
            SortOrder[SortOrder["ASCENDING"] = 0] = "ASCENDING";
            SortOrder[SortOrder["DESCENDING"] = 1] = "DESCENDING";
        })(data.SortOrder || (data.SortOrder = {}));
        var SortOrder = data.SortOrder;
    })(data = streetViewSafari.data || (streetViewSafari.data = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var data;
    (function (data_1) {
        /** Class which wraps the google.maps.StreetViewService .*/
        var StreetViewService = (function () {
            function StreetViewService() {
                this._service = new google.maps.StreetViewService();
            }
            StreetViewService.prototype.getPanoramaByLocation = function (poistion, distance) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._service.getPanoramaByLocation(poistion, distance, function (data, status) {
                        if (status === google.maps.StreetViewStatus.OK) {
                            resolve(data);
                        }
                        else if (status == google.maps.StreetViewStatus.ZERO_RESULTS) {
                            reject(new Error("No pano found"));
                        }
                    });
                });
            };
            StreetViewService.prototype.getPanoramaById = function (panoId) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._service.getPanoramaById(panoId, function (data, status) {
                        if (status === google.maps.StreetViewStatus.OK) {
                            resolve(data);
                        }
                        else if (status == google.maps.StreetViewStatus.ZERO_RESULTS) {
                            reject(new Error("No pano found"));
                        }
                    });
                });
            };
            return StreetViewService;
        }());
        data_1.StreetViewService = StreetViewService;
    })(data = streetViewSafari.data || (streetViewSafari.data = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var diagnostics;
    (function (diagnostics) {
        /** Static class which contains methods for logging. */
        var Logging = (function () {
            function Logging() {
            }
            /** Logs a given error. */
            Logging.logError = function (error) {
                Logging.logMessage(error && error.message ? error.message : "Undetermined error", "ERROR");
            };
            /** Logs a given message. */
            Logging.logMessage = function (message, level) {
                if (level === void 0) { level = "DEBUG"; }
                var dateStamp = new Date();
                console.log(dateStamp.toString(), "[", level, "]: ", message);
            };
            return Logging;
        }());
        diagnostics.Logging = Logging;
    })(diagnostics = streetViewSafari.diagnostics || (streetViewSafari.diagnostics = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var ClassNames = (function () {
            function ClassNames() {
            }
            ClassNames.MARKER = "SafariMarker";
            ClassNames.COMMENT = "SafariComments";
            ClassNames.VOTE = "SafariVotes";
            ClassNames.VOTE_TOTAL = "SafariVoteTotal";
            ClassNames.USER_VOTE_TOTAL = "UserVotes";
            ClassNames.USER = "_User";
            return ClassNames;
        }());
        objects.ClassNames = ClassNames;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        (function (ClassType) {
            ClassType[ClassType["SafariMarker"] = 0] = "SafariMarker";
            ClassType[ClassType["SafariVotes"] = 1] = "SafariVotes";
            ClassType[ClassType["SafariComment"] = 2] = "SafariComment";
            ClassType[ClassType["UserVote"] = 3] = "UserVote";
            ClassType[ClassType["User"] = 4] = "User";
            ClassType[ClassType["SafariVoteTotal"] = 5] = "SafariVoteTotal";
        })(objects.ClassType || (objects.ClassType = {}));
        var ClassType = objects.ClassType;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var ParseClass = (function () {
            function ParseClass(classType) {
                this.parseObject = this.createNewObject(classType);
                this._createSaveClass();
                this._createQueryClass();
            }
            ParseClass.prototype.createNewObject = function (classType) {
                var parseClass;
                switch (classType) {
                    case objects.ClassType.SafariMarker:
                        parseClass = objects.ClassNames.MARKER;
                        break;
                    case objects.ClassType.SafariComment:
                        parseClass = objects.ClassNames.COMMENT;
                        break;
                    case objects.ClassType.SafariVotes:
                        parseClass = objects.ClassNames.VOTE;
                        break;
                    case objects.ClassType.SafariVoteTotal:
                        parseClass = objects.ClassNames.VOTE_TOTAL;
                        break;
                    case objects.ClassType.UserVote:
                        parseClass = objects.ClassNames.USER_VOTE_TOTAL;
                        break;
                    case objects.ClassType.User:
                        parseClass = objects.ClassNames.USER;
                        break;
                    default:
                        throw new Error("Cannot determine class type.");
                        break;
                }
                return Parse.Object.extend(parseClass);
            };
            ParseClass.prototype._createSaveClass = function () {
                this.saveClass = new this.parseObject();
            };
            ParseClass.prototype._createQueryClass = function () {
                this.queryHelper = new streetViewSafari.data.Query(this.parseObject);
            };
            ParseClass.prototype.setRelation = function (key, parseObject) {
                this.saveClass.set(key, parseObject);
            };
            ParseClass.prototype.getParseClass = function () {
                return this.parseObject;
            };
            ParseClass.prototype.getQuery = function () {
                return this.queryHelper;
            };
            return ParseClass;
        }());
        objects.ParseClass = ParseClass;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var Safari = (function (_super) {
            __extends(Safari, _super);
            function Safari(parseObject) {
                _super.call(this);
                this.initialized = false;
                if (!parseObject) {
                    // get index
                    // initialize score
                    this.score = 0;
                    this._parseObject = null;
                }
                else {
                    this.loadFromParse(parseObject);
                    this._parseObject = parseObject;
                    this.initialized = true;
                }
            }
            Safari.prototype.loadPovPosition = function (position, pov) {
                if (position && pov) {
                    this.lat = position.lat();
                    this.lng = position.lng();
                    this.heading = pov.heading;
                    this.zoomLevel = pov.zoom;
                    this.pitch = pov.pitch;
                }
            };
            Safari.prototype.loadFromParse = function (parseSafari) {
                var _this = this;
                this.lat = parseSafari.get("lat");
                this.lng = parseSafari.get("lng");
                this.heading = parseSafari.get("heading");
                this.pitch = parseSafari.get("pitch");
                this.zoomLevel = parseSafari.get("zoomLevel");
                this.userId = parseSafari.get("userId");
                this.score = parseSafari.get("score");
                this.id = parseSafari.id;
                this.panoId = parseSafari.get("panoId");
                this.imageDate = parseSafari.get("imageDate");
                var userPointer = parseSafari.get("user");
                if (userPointer) {
                    this.userName = userPointer.get("username");
                    this.userId = userPointer.id;
                }
                var votePointer = parseSafari.get("score");
                if (votePointer) {
                    this._votePointer = votePointer;
                    this.score = votePointer.get("totalScore");
                }
                else {
                    if (this.userId === streetViewSafari.utility.userUtility.getIdOfCurrentUser()) {
                        this.score = 0;
                        streetViewSafari.utility.safariUtility.createTotalScoreObject(this.id)
                            .then(function (totalVotes) {
                            _this._votePointer = totalVotes;
                            return streetViewSafari.utility.safariUtility.linkTotalScoreOnSafari(_this._parseObject, totalVotes.id);
                        })
                            .then(function (savedSafariWithVote) {
                            // save success
                        })
                            .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
                    }
                }
            };
            Safari.prototype.getStreetViewPov = function () {
                var pov = {};
                pov.heading = this.heading;
                pov.pitch = this.pitch;
                pov.zoom = this.zoomLevel;
                return pov;
            };
            Safari.prototype.getLatLng = function () {
                return new google.maps.LatLng(this.lat, this.lng);
            };
            Safari.prototype.getSaveState = function () {
                return {
                    "lat": this.lat,
                    "lng": this.lng,
                    "heading": this.heading,
                    "pitch": this.pitch,
                    "zoomLevel": this.zoomLevel,
                    "user": streetViewSafari.utility.pointerUtility.createPointerForCurrentUser(),
                    "geoPoint": new Parse.GeoPoint(this.lat, this.lng),
                    "panoId": this.panoId,
                    "imageDate": this.imageDate
                };
            };
            Safari.prototype.getClassType = function () {
                return objects.ClassType.SafariMarker;
            };
            Safari.prototype.getComments = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var commentClass = new objects.ParseClass(objects.ClassType.SafariComment);
                    var query = commentClass.getQuery();
                    query.addEqualTo("safariMarker", streetViewSafari.utility.pointerUtility.createObjectPointer(_this.id, objects.ClassType.SafariMarker));
                    query.sort("createdAt", streetViewSafari.data.SortOrder.ASCENDING);
                    query.include("user");
                    query.limit(5);
                    query.execute()
                        .then(function (results) {
                        var items = [];
                        if (results) {
                            for (var i = 0; i < results.length; i++) {
                                var comment = new objects.UserComment(results[i]);
                                items.push(comment);
                            }
                        }
                        resolve(items);
                    })
                        .caught(function (error) { return reject(error); });
                });
            };
            Safari.prototype.registerVote = function (voteValue) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._votePointer.increment("totalScore", voteValue);
                    _this._votePointer.save()
                        .then(function (result) { return resolve(result); });
                });
            };
            Safari.prototype.remove = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._parseObject.destroy()
                        .then(function (value) { return resolve(value); });
                });
            };
            return Safari;
        }(streetViewSafari.base.SaveBase));
        objects.Safari = Safari;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var SafariScore = (function (_super) {
            __extends(SafariScore, _super);
            function SafariScore(parseObject) {
                _super.call(this);
                if (parseObject) {
                    this.loadFromParse(parseObject);
                }
                else {
                    this.totalScore = 0;
                }
            }
            SafariScore.prototype.loadFromParse = function (safariScore) {
                this.id = safariScore.id;
                this.totalScore = safariScore.get("totalScore");
                var markerPointer = safariScore.get("safariMarker");
                if (markerPointer) {
                    this.safariId = markerPointer.id;
                }
            };
            SafariScore.prototype.getSaveState = function () {
                return {
                    "totalScore": this.totalScore,
                    "safariMarker": streetViewSafari.utility.pointerUtility.createObjectPointer(this.safariId, objects.ClassType.SafariMarker)
                };
            };
            SafariScore.prototype.getClassType = function () {
                return objects.ClassType.SafariVoteTotal;
            };
            return SafariScore;
        }(streetViewSafari.base.SaveBase));
        objects.SafariScore = SafariScore;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var User = (function () {
            function User(user) {
                if (user) {
                    this._parseUser = user;
                }
                else {
                    this._parseUser = streetViewSafari.utility.userUtility.getUserFromSession();
                }
            }
            User.prototype.getUserName = function () {
                var userName = "";
                if (this._parseUser) {
                    userName = this._parseUser.getUsername();
                }
                return userName;
            };
            User.prototype.getUserId = function () {
                var id = "";
                if (this._parseUser) {
                    id = this._parseUser.id;
                }
                return id;
            };
            User.prototype.getParseUser = function () {
                return this._parseUser;
            };
            User.prototype.createAndGetUserScore = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var parseObject = new objects.ParseClass(objects.ClassType.UserVote);
                    var query = parseObject.getQuery();
                    query.addEqualTo("user", streetViewSafari.utility.pointerUtility.createPointerForCurrentUser());
                    query.addSelect("score");
                    query.first()
                        .then(function (userScore) {
                        if (userScore) {
                            // return score
                            resolve(userScore);
                        }
                        else {
                            // create score
                            _this.createUserScore()
                                .then(function (newscore) { return resolve(newscore); })
                                .caught(function (e) { return reject(e); });
                        }
                    })
                        .caught(function (error) { return reject(error); });
                });
            };
            User.prototype.createUserScore = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var userScore = new objects.UserScore(_this._parseUser.id, 0);
                    userScore.save()
                        .then(function (result) { return resolve(result); })
                        .caught(function (error) { return reject(error); });
                });
            };
            User.prototype.registerScore = function (voteValue) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var userScore = new objects.UserScore(_this.getUserId(), null);
                    userScore.incrementScore(voteValue)
                        .then(function (result) { return resolve(result); })
                        .caught(function (error) { return reject(error); });
                });
            };
            return User;
        }());
        objects.User = User;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var UserComment = (function (_super) {
            __extends(UserComment, _super);
            function UserComment(parseObject) {
                _super.call(this);
                if (parseObject) {
                    this.loadFromParse(parseObject);
                }
            }
            UserComment.prototype.loadFromParse = function (parseComment) {
                this.comment = parseComment.get("comment");
                this.date = parseComment.createdAt;
                var markerPointer = parseComment.get("safariMarker");
                if (markerPointer) {
                    this.safariId = markerPointer.id;
                }
                var userPointer = parseComment.get("user");
                if (userPointer) {
                    this.userName = userPointer.get("username");
                }
            };
            UserComment.prototype.getSaveState = function () {
                return {
                    "comment": this.comment,
                    "user": streetViewSafari.utility.pointerUtility.createPointerForCurrentUser(),
                    "safariMarker": streetViewSafari.utility.pointerUtility.createObjectPointer(this.safariId, objects.ClassType.SafariMarker)
                };
            };
            UserComment.prototype.getClassType = function () {
                return objects.ClassType.SafariComment;
            };
            return UserComment;
        }(streetViewSafari.base.SaveBase));
        objects.UserComment = UserComment;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var UserScore = (function (_super) {
            __extends(UserScore, _super);
            function UserScore(userId, score) {
                _super.call(this);
                this.userId = userId;
                if (score) {
                    this.score = score;
                }
                else {
                    this.score = 0;
                }
            }
            UserScore.prototype.getSaveState = function () {
                return {
                    "user": streetViewSafari.utility.pointerUtility.createObjectPointer(this.userId, objects.ClassType.User),
                    "score": this.score
                };
            };
            UserScore.prototype.getClassType = function () {
                return streetViewSafari.objects.ClassType.UserVote;
            };
            UserScore.prototype.incrementScore = function (value) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this.getParseObject()
                        .then(function (result) {
                        if (result) {
                            result.increment("score", value);
                            return result.save();
                        }
                    })
                        .then(function (updatedScore) { return resolve(updatedScore); })
                        .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
                });
            };
            UserScore.prototype.getParseObject = function () {
                var query = this.getQuery();
                query.addEqualTo("user", streetViewSafari.utility.pointerUtility.createObjectPointer(this.userId, objects.ClassType.User));
                return query.first();
            };
            return UserScore;
        }(streetViewSafari.base.SaveBase));
        objects.UserScore = UserScore;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        var Vote = (function (_super) {
            __extends(Vote, _super);
            function Vote(parseObject) {
                _super.call(this);
                if (parseObject) {
                    this.loadFromParse(parseObject);
                }
                else {
                    this.vote = objects.VoteType.NOTVOTED;
                }
            }
            Vote.prototype.getSaveState = function () {
                return {
                    "vote": this.getVoteValue(),
                    "user": streetViewSafari.utility.pointerUtility.createPointerForCurrentUser(),
                    "safariMarker": streetViewSafari.utility.pointerUtility.createObjectPointer(this.safariId, objects.ClassType.SafariMarker)
                };
            };
            Vote.prototype.getVoteValue = function () {
                var value;
                if (this.vote == objects.VoteType.UP) {
                    value = 1;
                }
                else if (this.vote == objects.VoteType.DOWN) {
                    value = -1;
                }
                else {
                    value = 0;
                }
                return value;
            };
            Vote.prototype.getClassType = function () {
                return objects.ClassType.SafariVotes;
            };
            Vote.prototype.getExistingVote = function () {
                var query = this.getQuery();
                var userPointer = streetViewSafari.utility.pointerUtility.createPointerForCurrentUser();
                var safariPointer = streetViewSafari.utility.pointerUtility.createObjectPointer(this.safariId, objects.ClassType.SafariMarker);
                query.addEqualTo("user", userPointer);
                query.addEqualTo("safariMarker", safariPointer);
                return query.first();
            };
            Vote.prototype.saveVote = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this.getExistingVote().then(function (existingVote) {
                        if (existingVote) {
                            // the user has already voted on this
                            // compare previous vote results to new vote
                            if (existingVote.get("vote") != _this.getVoteValue()) {
                                existingVote.set("vote", _this.getVoteValue());
                                existingVote.save()
                                    .then(function (result) {
                                    var returnObj = {
                                        vote: result,
                                        value: _this.getVoteValue()
                                    };
                                    resolve(returnObj);
                                }, function (error) { return reject(error); });
                            }
                        }
                        else {
                            // a new vote can be saved
                            _this.saveWithUserACL()
                                .then(function (newVote) {
                                //once saved update safari and user score
                                var returnObj = {
                                    vote: newVote,
                                    value: _this.getVoteValue()
                                };
                                resolve(returnObj);
                            }, function (error) { return reject(error); });
                        }
                    });
                });
            };
            Vote.prototype.loadFromParse = function (parseObject) {
                this.vote = this.voteValueToVoteType(parseObject.get("vote"));
                var safariPointer = parseObject.get("safariMarker");
                if (safariPointer) {
                    this.safariId = safariPointer.id;
                }
            };
            Vote.prototype.voteValueToVoteType = function (value) {
                if (value == 1) {
                    return objects.VoteType.UP;
                }
                else if (value == -1) {
                    return objects.VoteType.DOWN;
                }
                else {
                    return objects.VoteType.NOTVOTED;
                }
            };
            return Vote;
        }(streetViewSafari.base.SaveBase));
        objects.Vote = Vote;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var objects;
    (function (objects) {
        (function (VoteType) {
            VoteType[VoteType["UP"] = 0] = "UP";
            VoteType[VoteType["DOWN"] = 1] = "DOWN";
            VoteType[VoteType["NOTVOTED"] = 2] = "NOTVOTED";
        })(objects.VoteType || (objects.VoteType = {}));
        var VoteType = objects.VoteType;
    })(objects = streetViewSafari.objects || (streetViewSafari.objects = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var ui;
    (function (ui) {
        var AppViewModel = (function () {
            function AppViewModel(app) {
                var _this = this;
                this.evtCount = 0;
                this.timer = null;
                this.numResults = 30;
                this.safariCache = {};
                this.safarisToView = [];
                this.currentIndex = 0;
                this.searchPlaceholder = "Find a place...";
                this.poly = null;
                this.app = app;
                this.mapInitialized = false;
                this.userName = ko.observable("");
                this.enteredEmail = ko.observable("");
                this.enteredPassword = ko.observable("");
                this.enteredNewPassword = ko.observable("");
                this.enteredUserName = ko.observable("");
                this.statusText = ko.observable("");
                this.enteredForgotEmail = ko.observable("");
                this.expanderText = ko.observable("Fullscreen");
                this.subFormNotificationText = ko.observable("");
                this.searchQuery = ko.observable("");
                this.loggedIn = ko.observable(false);
                this.disableSite = ko.observable(false);
                this.showingExisting = ko.observable(false);
                this.expired = ko.observable(false);
                this.isMobile = ko.observable(false);
                this.isMobile.subscribe(function (value) {
                    _this.toggleExpanded(true);
                    window.addEventListener("orientationchange", function () {
                        _this._ensureHeight();
                    }, false);
                });
                // modal forms
                this.showingUserPanel = ko.observable(false);
                this.showingUserPanel.subscribe(function (visibility) {
                    _this._handleModalOverlay(visibility);
                });
                this.showingSignupPanel = ko.observable(false);
                this.showingSignupPanel.subscribe(function (visibility) {
                    _this._handleModalOverlay(visibility);
                });
                this.showingFacebookSignup = ko.observable(false);
                this.showingFacebookSignup.subscribe(function (visibility) {
                    _this._handleModalOverlay(visibility);
                });
                this.showingLoginPanel = ko.observable(false);
                this.showingLoginPanel.subscribe(function (visibility) {
                    _this._handleModalOverlay(visibility);
                });
                this.showingForgotPassword = ko.observable(false);
                this.showingForgotPassword.subscribe(function (visibility) {
                    _this._handleModalOverlay(visibility);
                });
                this.userScore = ko.observable(0);
                this.safariViewModel = new ui.SafariViewModel(this.app);
                this.userViewModel = new ui.UserViewModel(this.app);
                this.userDetailsViewModel = new ui.UserDetailsViewModel();
                this.mapVisible = false;
                this.nearbyLocationMarkers = [];
                this._initialize();
            }
            AppViewModel.prototype._handleModalOverlay = function (visible) {
                this.disableSite(visible);
            };
            AppViewModel.prototype._initialize = function () {
                var _this = this;
                this.isMobile(this.app.isMobile());
                this.mapVisible = true;
                var mapOptions = {
                    zoom: 15,
                    streetViewControl: false,
                    enableCloseButton: false
                };
                this.geocoder = new streetViewSafari.data.Geocoder();
                this.streetviewService = new streetViewSafari.data.StreetViewService();
                this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
                var streetViewLayer = new google.maps.StreetViewCoverageLayer();
                streetViewLayer.setMap(this.map);
                this.currentLocationMarker = new google.maps.Marker({
                    map: this.map,
                    title: "Safari Location",
                    icon: "../Images/fourbyfour.png",
                    zIndex: 101
                });
                var options = {
                    imageDateControl: true,
                    enableCloseButton: false
                };
                this.panorama = new google.maps.StreetViewPanorama(document.getElementById("panorama"), options);
                this.subscribeToEvents();
                ko.applyBindings(this);
                this.searchQuery(this.searchPlaceholder);
                this._ensureHeight();
                var searchInput = $("#search-input");
                searchInput.click(function () {
                    if (_this.searchQuery() === _this.searchPlaceholder) {
                        _this.searchQuery("");
                    }
                });
                searchInput.focusout(function () {
                    if (_this.searchQuery().trim() === "") {
                        _this.searchQuery(_this.searchPlaceholder);
                    }
                });
                searchInput.keypress(function (e) {
                    if (e.keyCode == 13) {
                        _this.geocode();
                    }
                });
                $(window).resize(function () {
                    _this._ensureHeight();
                    _this._resizeMap();
                    _this._resizePanorama();
                });
                streetViewSafari.utility.safariUtility.getSafariIds()
                    .then(function (safaris) {
                    _this.safarisToView = safaris;
                    streetViewSafari.utility.extensions.shuffleArray(safaris);
                    _this.currentIndex = 0;
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            AppViewModel.prototype._ensureHeight = function () {
                var bannerHeight = 0;
                if (!this.app.isMobile()) {
                    bannerHeight = $("#banner").height();
                }
                var winHeight = $(window).height();
                $("#main-area").height(winHeight - bannerHeight);
            };
            AppViewModel.prototype.geocode = function () {
                var _this = this;
                var term = this.searchQuery();
                if (term && term !== this.searchPlaceholder) {
                    this.geocoder.geocode(term)
                        .then(function (position) {
                        return _this.streetviewService.getPanoramaByLocation(position, 200);
                    })
                        .then(function (data) { return _this._setPanoByLocation(data.location.latLng, null); })
                        .caught(function (error) {
                        _this.app.flashStatusText("Failed to find a streetview for the location");
                        streetViewSafari.diagnostics.Logging.logError(error);
                    });
                }
                else {
                    this.app.flashStatusText("Enter a place to find");
                }
            };
            AppViewModel.prototype.subscribeToEvents = function () {
                var _this = this;
                google.maps.event.addListener(this.map, "tilesloaded", function (args) {
                    if (!_this.mapInitialized) {
                        _this.mapInitialized = true;
                        _this.fireDragEndEvent();
                    }
                });
                //map events
                google.maps.event.addListener(this.map, "click", function (args) {
                    _this._mapClicked(args);
                });
                google.maps.event.addListener(this.map, "bounds_changed", function (args) {
                    _this.fireDragEndEvent();
                });
                google.maps.event.addListener(this.map, "dragend", function () {
                    _this._queue();
                });
                //streetview panorama events
                google.maps.event.addListener(this.panorama, "position_changed", function () {
                    var position = _this.panorama.getPosition();
                    _this.currentLocationMarker.setPosition(position);
                    _this.map.panTo(position);
                    _this.fireDragEndEvent();
                    if (!_this.isMobile()) {
                        if (!_this.poly) {
                            var polyOptions = {
                                strokeColor: "#FF9933",
                                strokeOpacity: 1.0,
                                strokeWeight: 3
                            };
                            _this.poly = new google.maps.Polyline(polyOptions);
                            _this.poly.setMap(_this.map);
                        }
                        var path = _this.poly.getPath();
                        var pathLength = path.getLength();
                        if (pathLength > 0) {
                            var lastPoint = path.getAt(pathLength - 1);
                            var distance = google.maps.geometry.spherical.computeDistanceBetween(lastPoint, position);
                            if (distance >= 1000) {
                                path.clear();
                            }
                        }
                        _this.poly.getPath().push(position);
                    }
                });
                google.maps.event.addListener(this.panorama, "visible_changed", function () {
                    if (!_this.panorama.getVisible()) {
                        _this.panorama.setVisible(true);
                    }
                });
            };
            // simple throttling for a heavy request
            AppViewModel.prototype._process = function () {
                // process
                this._handleDragEnd();
                if (!this.again) {
                    clearInterval(this.timer);
                    this.timer = null;
                }
            };
            AppViewModel.prototype._queue = function () {
                var _this = this;
                if (this.timer === null) {
                    this.timer = setInterval(function () { return _this._process(); }, 1500);
                    this.again = false;
                }
            };
            AppViewModel.prototype._handleDragEnd = function () {
                var _this = this;
                if (this.mapVisible) {
                    var parseClass = new streetViewSafari.objects.ParseClass(streetViewSafari.objects.ClassType.SafariMarker);
                    var query = parseClass.getQuery();
                    var mapBounds = this.map.getBounds();
                    var southWest = streetViewSafari.utility.safariUtility.googleLatLngToGeoPoint(mapBounds.getSouthWest());
                    var northEast = streetViewSafari.utility.safariUtility.googleLatLngToGeoPoint(mapBounds.getNorthEast());
                    query.withinGeoBox("geoPoint", southWest, northEast);
                    query.limit(this.numResults);
                    query.include("user");
                    query.include("score");
                    query.execute()
                        .then(function (results) {
                        if (results && results.length > 0) {
                            _this._clearSafariMarkers();
                            _this.nearbyLocationMarkers = [];
                            // for each geopoint, create a marker
                            for (var i = 0; i < results.length; i++) {
                                var geoPoint = results[i].get("geoPoint");
                                var index = results[i].id;
                                if (geoPoint && index) {
                                    var marker = _this._createMarker(geoPoint, index);
                                    _this.nearbyLocationMarkers.push(marker);
                                }
                                //cache
                                if (!_this.safariCache[results[i].id]) {
                                    _this.safariCache[results[i].id] = results[i];
                                }
                            }
                        }
                        else {
                            _this._clearSafariMarkers();
                        }
                    })
                        .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
                }
            };
            AppViewModel.prototype._clearSafariMarkers = function () {
                //clear markers
                for (var i = 0; i < this.nearbyLocationMarkers.length; i++) {
                    this.nearbyLocationMarkers[i].setMap(null);
                }
            };
            AppViewModel.prototype.toggleExpanded = function (expand) {
                var _this = this;
                this._ensureHeight();
                var windowHeight = $("#main-area").height();
                var maximizedPixels = Math.floor((windowHeight / 100) * 100);
                var minimizedMapPixels = Math.floor((windowHeight / 100) * 50);
                var minimizedPanPixels = Math.floor((windowHeight / 100) * 50);
                var panorama = $(".panorama-container");
                var map = $(".map-container");
                if ((panorama.height() < maximizedPixels) || expand === true) {
                    // maximize it
                    $(panorama).animate({ height: maximizedPixels }, null, function () { return _this._resizePanorama(); });
                    $(map).animate({ height: 0 }, null, function () {
                        _this._resizeMap();
                        _this.expanderText("Show Map");
                    });
                    this.mapVisible = false;
                }
                else {
                    // minimize it
                    $(panorama).animate({ height: minimizedPanPixels }, null, function () { return _this._resizePanorama(); });
                    $(map).animate({ height: minimizedMapPixels }, null, function () {
                        _this._resizeMap();
                        _this.expanderText("Fullscreen");
                    });
                    this.mapVisible = true;
                    this.fireDragEndEvent();
                }
            };
            AppViewModel.prototype._setPanoByLocation = function (location, pov) {
                var options = {
                    position: location
                };
                if (pov) {
                    options.pov = pov;
                }
                this.panorama.setOptions(options);
            };
            /* https://stackoverflow.com/questions/28265890/proper-way-to-set-the-streetview-panoramaid-and-pov-at-the-same-time */
            AppViewModel.prototype._setPanoramaById = function (panoId, pov) {
                if (panoId && pov) {
                    var options = {
                        pov: pov,
                        pano: panoId
                    };
                    this.panorama.setOptions(options);
                }
                else if (panoId) {
                    this.panorama.setPano(panoId);
                }
            };
            AppViewModel.prototype._resizeMap = function () {
                google.maps.event.trigger(this.map, "resize");
                this.map.setCenter(this.panorama.getPosition());
            };
            AppViewModel.prototype._resizePanorama = function () {
                google.maps.event.trigger(this.panorama, "resize");
            };
            AppViewModel.prototype._createMarker = function (geoPoint, loadId) {
                var _this = this;
                var marker = new google.maps.Marker({
                    position: streetViewSafari.utility.safariUtility.geoPointToGoogleLatLng(geoPoint),
                    map: this.map,
                    title: "Nearby Safari",
                    icon: "../Images/360degrees.png",
                    zIndex: 100
                });
                //create closure
                var closeEvent = function (id) {
                    google.maps.event.addListener(marker, "click", function () {
                        // load by id
                        if (!_this.safariCache[id]) {
                            _this.loadSafariById(id);
                        }
                        else {
                            _this.setSafari(_this.safariCache[id]);
                        }
                    });
                };
                closeEvent(loadId);
                return marker;
            };
            AppViewModel.prototype._mapClicked = function (args) {
                var _this = this;
                var latLng = args.latLng;
                this.showingExisting(false);
                var tolerance = 1000 / (this.map.getZoom() + 1);
                tolerance = Math.floor(tolerance);
                this.streetviewService.getPanoramaByLocation(latLng, tolerance)
                    .then(function (data) {
                    _this.panorama.setZoom(0);
                    _this._setPanoByLocation(data.location.latLng, { zoom: 0, pitch: 0, heading: 0 });
                    _this.setSafari(null);
                })
                    .caught(function (error) {
                    _this.app.flashStatusText("No street view for clicked location...");
                    streetViewSafari.diagnostics.Logging.logError(error);
                });
            };
            AppViewModel.prototype.setStartupPosition = function (latLng) {
                var _this = this;
                var geoPoint = streetViewSafari.utility.safariUtility.googleLatLngToGeoPoint(latLng);
                streetViewSafari.utility.safariUtility.findSafariWithinKilometers(geoPoint, 2)
                    .then(function (safari) {
                    if (safari) {
                        _this.setSafari(safari);
                    }
                    else {
                        _this.streetviewService.getPanoramaByLocation(latLng, 10000)
                            .then(function (data) {
                            _this.panorama.setPano(data.location.pano);
                            _this.panorama.setZoom(0);
                            _this.setSafari(null);
                        })
                            .caught(function (error) {
                            streetViewSafari.diagnostics.Logging.logError(error);
                            _this.app.flashStatusText("No street view for startup location...");
                            _this.loadRandom();
                        });
                    }
                })
                    .caught(function (error) {
                    streetViewSafari.diagnostics.Logging.logError(error);
                    _this.loadRandom();
                });
            };
            //refresh the map
            AppViewModel.prototype.fireDragEndEvent = function () {
                google.maps.event.trigger(this.map, "dragend");
            };
            AppViewModel.prototype.refreshMap = function () {
                this.fireDragEndEvent();
            };
            AppViewModel.prototype.logSafari = function () {
                var _this = this;
                if (!streetViewSafari.utility.userUtility.isUserAuthenticated()) {
                    this.app.flashStatusText("Must be logged in to save locations.");
                    return;
                }
                var position = this.panorama.getPosition();
                var pov = this.panorama.getPov();
                var scene = new streetViewSafari.objects.Safari(null);
                scene.loadPovPosition(position, pov);
                scene.panoId = this.panorama.getPano();
                var geoPoint = streetViewSafari.utility.safariUtility.googleLatLngToGeoPoint(position);
                this.streetviewService.getPanoramaById(scene.panoId)
                    .then(function (data) {
                    scene.imageDate = Date.parse(data.imageDate);
                    return streetViewSafari.utility.safariUtility.findSafariWithinKilometers(geoPoint, 0.030);
                })
                    .then(function (safari) {
                    if (!safari) {
                        return scene.saveWithUserACL();
                    }
                    else {
                        _this.app.flashStatusText("Location must be somewhat unique.");
                        return Promise.reject("Location must be somewhat unique.");
                    }
                })
                    .then(function (savedSafari) {
                    if (savedSafari) {
                        _this.setSafari(savedSafari);
                    }
                    else {
                        return Promise.reject("Failed to save safari");
                    }
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            AppViewModel.prototype.loadSafariById = function (id) {
                var _this = this;
                streetViewSafari.utility.safariUtility.getSafariById(id)
                    .then(function (safari) {
                    if (safari) {
                        _this.setSafari(safari);
                    }
                    else {
                        _this.app.flashStatusText("Could not find the requested Safari.");
                        _this.loadRandom();
                    }
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            AppViewModel.prototype.loadRandom = function () {
                var _this = this;
                var parseClass = new streetViewSafari.objects.ParseClass(streetViewSafari.objects.ClassType.SafariMarker);
                var query = parseClass.getQuery();
                query.first()
                    .then(function (safari) {
                    if (safari) {
                        _this.loadSafariById(safari.id);
                    }
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            //* https://code.google.com/p/gmaps-api-issues/issues/detail?id=7617 */
            AppViewModel.prototype._refreshHack = function (pov) {
                var _this = this;
                setTimeout(function () {
                    //modify pov
                    if (pov.heading || pov.heading === 0) {
                        pov.heading += .0000001;
                    }
                    _this.panorama.setPov(pov);
                }, 500);
            };
            AppViewModel.prototype.setSafari = function (safariDataModel) {
                var _this = this;
                this._removePositionLeaveSavedSafari();
                if (safariDataModel) {
                    var safariViewModel = new streetViewSafari.objects.Safari(safariDataModel);
                    var pov = safariViewModel.getStreetViewPov();
                    this.streetviewService.getPanoramaById(safariViewModel.panoId)
                        .then(function (data) {
                        _this.expired(false);
                        _this._setPanoramaById(safariViewModel.panoId, pov);
                        _this._refreshHack(pov);
                    })
                        .caught(function (e) {
                        _this.expired(true);
                        _this._setPanoByLocation(safariViewModel.getLatLng(), pov);
                        _this._refreshHack(pov);
                    });
                    this.showingExisting(true);
                    this.positionLeaveSavedSafari = google.maps.event.addListener(this.panorama, "position_changed", function () {
                        _this.evtCount++;
                        if (_this.evtCount > 2) {
                            _this._removePositionLeaveSavedSafari();
                            _this.showingExisting(false);
                        }
                    });
                }
                else {
                    var safariViewModel = new streetViewSafari.objects.Safari(null);
                    this.showingExisting(false);
                    this.expired(false);
                }
                this.safariViewModel.setSafari(safariViewModel);
            };
            AppViewModel.prototype._removePositionLeaveSavedSafari = function () {
                this.evtCount = 0;
                if (this.positionLeaveSavedSafari) {
                    google.maps.event.removeListener(this.positionLeaveSavedSafari);
                }
            };
            AppViewModel.prototype.validateLogin = function (username, password) {
                if (username && password) {
                    return "";
                }
                else {
                    return "Please enter a username and password.";
                }
            };
            AppViewModel.prototype.validateSignup = function (username, password, email) {
                if (username && password && email) {
                    return "";
                }
                else {
                    return "Please enter a username, password and email.";
                }
            };
            AppViewModel.prototype.showNext = function () {
                this.currentIndex++;
                if (this.currentIndex < this.safarisToView.length - 1) {
                    ga("send", "event", "showNext", "click");
                }
                else {
                    this.currentIndex = 0;
                }
                this.setSafari(this.safarisToView[this.currentIndex]);
            };
            AppViewModel.prototype.showPrevious = function () {
                this.currentIndex--;
                if (this.currentIndex < this.safarisToView.length) {
                    if (this.currentIndex < 0) {
                        this.currentIndex = this.safarisToView.length - Math.abs(this.currentIndex);
                    }
                    ga("send", "event", "showPrevious", "click");
                }
                else {
                    this.currentIndex = 0;
                }
                this.setSafari(this.safarisToView[this.currentIndex]);
            };
            AppViewModel.prototype.setLoggedIn = function (loggedIn) {
                this.loggedIn(loggedIn);
            };
            AppViewModel.prototype.closeOpenModal = function () {
                // close login panel
                if (this.showingLoginPanel()) {
                    this.setShowingLoginPanel(false);
                }
                if (this.showingUserPanel()) {
                    this.setShowingUserPanel(false);
                }
                if (this.showingForgotPassword()) {
                    this.setShowingForgotPassword(false);
                }
                if (this.showingSignupPanel()) {
                    this.setShowingSignupPanel(false);
                }
                if (this.showingFacebookSignup()) {
                    this.setShowingFacebookSignup(false);
                }
            };
            AppViewModel.prototype.setShowingLoginPanel = function (show) {
                this.subFormNotificationText("");
                this.enteredPassword("");
                this.enteredUserName("");
                this.showingLoginPanel(show);
            };
            AppViewModel.prototype.setShowingUserPanel = function (show) {
                this.subFormNotificationText("");
                this.enteredNewPassword("");
                this.showingUserPanel(show);
            };
            AppViewModel.prototype.setShowingFacebookSignup = function (show) {
                this.subFormNotificationText("");
                this.enteredUserName("");
                this.enteredPassword("");
                this.showingFacebookSignup(show);
            };
            AppViewModel.prototype.setShowingSignupPanel = function (show) {
                this.subFormNotificationText("");
                this.enteredNewPassword("");
                this.enteredPassword("");
                this.enteredUserName("");
                this.enteredEmail("");
                this.showingSignupPanel(show);
            };
            AppViewModel.prototype.setShowingForgotPassword = function (show) {
                this.subFormNotificationText("");
                this.showingForgotPassword(show);
            };
            AppViewModel.prototype.clearLoginFields = function () {
                this.enteredEmail("");
                this.enteredPassword("");
                this.enteredUserName("");
            };
            return AppViewModel;
        }());
        ui.AppViewModel = AppViewModel;
    })(ui = streetViewSafari.ui || (streetViewSafari.ui = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var ui;
    (function (ui) {
        var CommentViewModel = (function () {
            function CommentViewModel(comment) {
                this.comment = comment;
                this.commentText = comment.comment;
                this.userName = comment.userName;
                this.date = comment.date;
            }
            return CommentViewModel;
        }());
        ui.CommentViewModel = CommentViewModel;
    })(ui = streetViewSafari.ui || (streetViewSafari.ui = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var ui;
    (function (ui) {
        var SafariViewModel = (function () {
            function SafariViewModel(app) {
                this.userName = ko.observable("");
                this.downVote = ko.observable(false);
                this.userOwned = ko.observable(false);
                this._app = app;
                this.link = ko.observable("");
                this.score = ko.observable(0);
                this.comments = ko.observableArray([]);
                this.upVote = ko.observable(false);
                this.commentText = ko.observable("");
            }
            SafariViewModel.prototype.getSafari = function () {
                return this._safariDataModel;
            };
            SafariViewModel.prototype.setSafari = function (safari) {
                var _this = this;
                this._safariDataModel = safari;
                this.userOwned(false);
                if (safari.initialized) {
                    this.userName(this._safariDataModel.userName);
                    this.link("http://streetviewsafari.com?s=" + this._safariDataModel.id);
                    this.score(this._safariDataModel.score);
                    this.populateCommentViewModels();
                    if (safari.userId === streetViewSafari.utility.userUtility.getIdOfCurrentUser()) {
                        this.userOwned(true);
                    }
                    // get any vote info
                    var getVote = new streetViewSafari.objects.Vote(null);
                    getVote.safariId = this._safariDataModel.id;
                    getVote.getExistingVote()
                        .then(function (existingVote) {
                        if (existingVote) {
                            _this.setVoteInterface(new streetViewSafari.objects.Vote(existingVote));
                        }
                        else {
                            var newVote = new streetViewSafari.objects.Vote(null);
                            newVote.safariId = _this._safariDataModel.id;
                            _this.setVoteInterface(newVote);
                        }
                    })
                        .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
                    ;
                }
            };
            SafariViewModel.prototype.populateCommentViewModels = function () {
                var _this = this;
                this._safariDataModel.getComments()
                    .then(function (comments) {
                    var viewModels = [];
                    for (var i = 0; i < comments.length; i++) {
                        var viewModel = new ui.CommentViewModel(comments[i]);
                        viewModels.push(viewModel);
                    }
                    _this.comments(viewModels);
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            SafariViewModel.prototype.refresh = function () {
                var _this = this;
                streetViewSafari.utility.safariUtility.getSafariById(this._safariDataModel.id)
                    .then(function (result) {
                    var safariObject = new streetViewSafari.objects.Safari(result);
                    _this.setSafari(safariObject);
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
                this.populateCommentViewModels();
            };
            SafariViewModel.prototype.setVoteInterface = function (vote) {
                this._vote = vote;
                if (this._vote.vote == streetViewSafari.objects.VoteType.UP) {
                    this.setUpVote(true);
                    this.setDownVote(false);
                }
                else if (this._vote.vote == streetViewSafari.objects.VoteType.DOWN) {
                    this.setUpVote(false);
                    this.setDownVote(true);
                }
                else {
                    this.setUpVote(false);
                    this.setDownVote(false);
                }
            };
            SafariViewModel.prototype.setUpVote = function (show) {
                this.upVote(show);
            };
            SafariViewModel.prototype.setDownVote = function (show) {
                this.downVote(show);
            };
            SafariViewModel.prototype.saveVote = function (voteType) {
                var _this = this;
                if (!streetViewSafari.utility.userUtility.isUserAuthenticated()) {
                    this._app.flashStatusText("Must be logged in to vote on Safaris.");
                    return;
                }
                this._vote.vote = voteType;
                this._vote.saveVote()
                    .then(function (returnObj) {
                    var voteValue = returnObj.value;
                    var vote = returnObj.vote;
                    if (vote && voteValue) {
                        _this.setVoteInterface(new streetViewSafari.objects.Vote(vote));
                        _this.updateUserScore(voteValue);
                        _this.updateSafariScore(voteValue);
                    }
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            SafariViewModel.prototype.updateUserScore = function (voteValue) {
                var parseUser = streetViewSafari.utility.pointerUtility.createObjectPointer(this._safariDataModel.userId, streetViewSafari.objects.ClassType.User);
                var user = new streetViewSafari.objects.User(parseUser);
                user.registerScore(voteValue);
            };
            SafariViewModel.prototype.updateSafariScore = function (voteValue) {
                var _this = this;
                this._safariDataModel.registerVote(voteValue)
                    .then(function (updatedSafari) { return _this.refresh(); })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            SafariViewModel.prototype.handleUpVote = function () {
                this.saveVote(streetViewSafari.objects.VoteType.UP);
            };
            SafariViewModel.prototype.handleDownVote = function () {
                this.saveVote(streetViewSafari.objects.VoteType.DOWN);
            };
            SafariViewModel.prototype.handleDelete = function () {
                var _this = this;
                var confirm = window.confirm("Really delete the Safari?");
                if (confirm === true) {
                    this._safariDataModel.remove()
                        .then(function (result) {
                        _this._app.appViewModel.refreshMap();
                        _this._app.appViewModel.setSafari(null);
                    })
                        .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
                }
            };
            SafariViewModel.prototype.saveComment = function () {
                var _this = this;
                var text = this.commentText();
                if (!streetViewSafari.utility.userUtility.isUserAuthenticated()) {
                    this._app.flashStatusText("Must be logged in to comment on Safaris.");
                    return;
                }
                if (!text) {
                    return;
                }
                this._app.flashStatusText("Saving Comment...");
                var comment = new streetViewSafari.objects.UserComment();
                comment.comment = text;
                comment.safariId = this._safariDataModel.id;
                comment.saveWithUserACL()
                    .then(function (comment) {
                    _this.commentText("");
                    _this.refresh();
                })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            return SafariViewModel;
        }());
        ui.SafariViewModel = SafariViewModel;
    })(ui = streetViewSafari.ui || (streetViewSafari.ui = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var ui;
    (function (ui) {
        var UserDetailsViewModel = (function () {
            function UserDetailsViewModel() {
                this._initialize();
            }
            UserDetailsViewModel.prototype._initialize = function () {
            };
            return UserDetailsViewModel;
        }());
        ui.UserDetailsViewModel = UserDetailsViewModel;
    })(ui = streetViewSafari.ui || (streetViewSafari.ui = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var ui;
    (function (ui) {
        var UserViewModel = (function () {
            function UserViewModel(app) {
                this.app = app;
                this.isFacebookUser = ko.observable(false);
                this.userName = ko.observable("");
                this.score = ko.observable(0);
            }
            UserViewModel.prototype.setUser = function (user) {
                this._userDataModel = user;
                this.refresh();
            };
            UserViewModel.prototype._getUserScore = function () {
                var _this = this;
                this._userDataModel.createAndGetUserScore()
                    .then(function (score) { return _this.score(score.get("score")); })
                    .caught(function (error) { return streetViewSafari.diagnostics.Logging.logError(error); });
            };
            UserViewModel.prototype.refresh = function () {
                this._getUserScore();
                this.userName(this._userDataModel.getUserName());
                this.isFacebookUser(streetViewSafari.utility.userUtility.isFacebookLinked(this._userDataModel.getParseUser()));
            };
            return UserViewModel;
        }());
        ui.UserViewModel = UserViewModel;
    })(ui = streetViewSafari.ui || (streetViewSafari.ui = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var utility;
    (function (utility) {
        var extensions;
        (function (extensions) {
            /* http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
            function shuffleArray(array) {
                var currentIndex = array.length, temporaryValue, randomIndex;
                // While there remain elements to shuffle...
                while (0 !== currentIndex) {
                    // Pick a remaining element...
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }
                return array;
            }
            extensions.shuffleArray = shuffleArray;
        })(extensions = utility.extensions || (utility.extensions = {}));
    })(utility = streetViewSafari.utility || (streetViewSafari.utility = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var utility;
    (function (utility) {
        var pointerUtility;
        (function (pointerUtility) {
            function createPointerForCurrentUser() {
                return utility.userUtility.getUserFromSession();
            }
            pointerUtility.createPointerForCurrentUser = createPointerForCurrentUser;
            function createObjectPointer(id, classType) {
                var parseClass = new streetViewSafari.objects.ParseClass(classType);
                var saveClass = parseClass.saveClass;
                saveClass.id = id;
                return saveClass;
            }
            pointerUtility.createObjectPointer = createObjectPointer;
        })(pointerUtility = utility.pointerUtility || (utility.pointerUtility = {}));
    })(utility = streetViewSafari.utility || (streetViewSafari.utility = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var utility;
    (function (utility) {
        var safariUtility;
        (function (safariUtility) {
            function getRandomInt(max) {
                return Math.floor(Math.random() * max) + 1;
            }
            safariUtility.getRandomInt = getRandomInt;
            function getQueryParams(qs) {
                var qs = qs.split("+").join(" ");
                var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
                while (tokens = re.exec(qs)) {
                    params[decodeURIComponent(tokens[1])]
                        = decodeURIComponent(tokens[2]);
                }
                return params;
            }
            safariUtility.getQueryParams = getQueryParams;
            function geoPointToGoogleLatLng(geoPoint) {
                var lat = geoPoint.latitude;
                var lng = geoPoint.longitude;
                return new google.maps.LatLng(lat, lng);
            }
            safariUtility.geoPointToGoogleLatLng = geoPointToGoogleLatLng;
            function googleLatLngToGeoPoint(latLng) {
                return new Parse.GeoPoint(latLng.lat(), latLng.lng());
            }
            safariUtility.googleLatLngToGeoPoint = googleLatLngToGeoPoint;
            function findSafariWithinKilometers(geoPoint, distance) {
                return new Promise(function (resolve, reject) {
                    var parseClass = new streetViewSafari.objects.ParseClass(streetViewSafari.objects.ClassType.SafariMarker);
                    var query = parseClass.getQuery();
                    query.include("user");
                    query.include("score");
                    query.withinKilometers("geoPoint", geoPoint, distance);
                    query.first()
                        .then(function (result) {
                        resolve(result);
                    })
                        .caught(function (error) { return reject(error); });
                });
            }
            safariUtility.findSafariWithinKilometers = findSafariWithinKilometers;
            function getSafariById(id) {
                return new Promise(function (resolve, reject) {
                    var parseClass = new streetViewSafari.objects.ParseClass(streetViewSafari.objects.ClassType.SafariMarker);
                    var query = parseClass.getQuery();
                    query.addEqualTo("objectId", id);
                    query.include("user");
                    query.include("score");
                    query.first()
                        .then(function (result) {
                        resolve(result);
                    })
                        .caught(function (error) {
                        reject(error);
                    });
                });
            }
            safariUtility.getSafariById = getSafariById;
            function createTotalScoreObject(safariId) {
                var totalScore = new streetViewSafari.objects.SafariScore();
                totalScore.safariId = safariId;
                return totalScore.save();
            }
            safariUtility.createTotalScoreObject = createTotalScoreObject;
            function linkTotalScoreOnSafari(safari, totalScoreId) {
                return new Promise(function (resolve, reject) {
                    safari.set("score", utility.pointerUtility.createObjectPointer(totalScoreId, streetViewSafari.objects.ClassType.SafariVoteTotal));
                    safari.save()
                        .then(function (result) {
                        resolve(result);
                    }, function (error) { return reject(error); });
                });
            }
            safariUtility.linkTotalScoreOnSafari = linkTotalScoreOnSafari;
            function getSafariIds() {
                return new Promise(function (resolve, reject) {
                    var parseClass = new streetViewSafari.objects.ParseClass(streetViewSafari.objects.ClassType.SafariMarker);
                    var query = parseClass.getQuery();
                    query.include("score");
                    query.include("user");
                    query.execute()
                        .then(function (result) {
                        resolve(result);
                    })
                        .caught(function (error) { return reject(error); });
                });
            }
            safariUtility.getSafariIds = getSafariIds;
        })(safariUtility = utility.safariUtility || (utility.safariUtility = {}));
    })(utility = streetViewSafari.utility || (streetViewSafari.utility = {}));
})(streetViewSafari || (streetViewSafari = {}));
var streetViewSafari;
(function (streetViewSafari) {
    var utility;
    (function (utility) {
        var userUtility;
        (function (userUtility) {
            function getUserFromSession() {
                return Parse.User.current();
            }
            userUtility.getUserFromSession = getUserFromSession;
            function getUserNameOfCurrentUser() {
                var user = getUserFromSession();
                var userName = "";
                if (user) {
                    userName = user.get("username");
                }
                return userName;
            }
            userUtility.getUserNameOfCurrentUser = getUserNameOfCurrentUser;
            function getIdOfCurrentUser() {
                var user = getUserFromSession();
                var id = "";
                if (user) {
                    id = user.id;
                }
                return id;
            }
            userUtility.getIdOfCurrentUser = getIdOfCurrentUser;
            function signUp(userName, email, password) {
                return new Promise(function (resolve, reject) {
                    var user = new Parse.User();
                    userName = userName.toLowerCase();
                    user.set("username", userName);
                    user.set("password", password);
                    user.set("email", email);
                    user.signUp(null)
                        .then(function (user) { return resolve(user); }, function (error) { return reject(error); });
                });
            }
            userUtility.signUp = signUp;
            function login(userName, password) {
                return new Promise(function (resolve, reject) {
                    userName = userName.toLowerCase();
                    Parse.User.logIn(userName, password)
                        .then(function (user) { return resolve(user); }, function (error) { return reject(error); });
                });
            }
            userUtility.login = login;
            function logout() {
                Parse.User.logOut();
            }
            userUtility.logout = logout;
            function isUserAuthenticated() {
                var user = Parse.User.current();
                if (user && user.authenticated()) {
                    return true;
                }
                else {
                    return false;
                }
            }
            userUtility.isUserAuthenticated = isUserAuthenticated;
            function requestPasswordReset(email) {
                return new Promise(function (resolve, reject) {
                    Parse.User.requestPasswordReset(email)
                        .then(function (result) { return resolve(result); }, function (error) { return reject(error); });
                });
            }
            userUtility.requestPasswordReset = requestPasswordReset;
            function resetPassword(newPassword) {
                return new Promise(function (resolve, reject) {
                    var user = getUserFromSession();
                    user.set("password", newPassword);
                    user.save(null)
                        .then(function (user) { return resolve(user); }, function (error) { return reject(error); });
                });
            }
            userUtility.resetPassword = resetPassword;
            function userNameExist(userName) {
                var user = new streetViewSafari.objects.ParseClass(streetViewSafari.objects.ClassType.User);
                userName = userName.toLowerCase();
                user.getQuery().addEqualTo("username", userName);
                return new Promise(function (resolve, reject) {
                    user.getQuery().executeForCount().then(function (results) {
                        var exists = false;
                        if (results > 0) {
                            exists = true;
                        }
                        resolve(exists);
                    }, function (error) { return reject(error); });
                });
            }
            userUtility.userNameExist = userNameExist;
            function setUsernameAndPassword(userName, password) {
                return new Promise(function (resolve, reject) {
                    var user = getUserFromSession();
                    userName = userName.toLowerCase();
                    user.set("username", userName);
                    user.set("password", password);
                    user.save()
                        .then(function (user) { return resolve(user); }, function (error) { return reject(error); });
                });
            }
            userUtility.setUsernameAndPassword = setUsernameAndPassword;
            function isFacebookLinked(user) {
                return Parse.FacebookUtils.isLinked(user);
            }
            userUtility.isFacebookLinked = isFacebookLinked;
            function linkFacebook(user) {
                return new Promise(function (resolve, reject) {
                    Parse.FacebookUtils.link(user, null, {
                        success: resolve,
                        error: reject
                    });
                });
            }
            userUtility.linkFacebook = linkFacebook;
            function unlinkFacebook(user) {
                return new Promise(function (resolve, reject) {
                    Parse.FacebookUtils.unlink(user, {
                        success: resolve,
                        error: reject
                    });
                });
            }
            userUtility.unlinkFacebook = unlinkFacebook;
            function facebookLogin() {
                return new Promise(function (resolve, reject) {
                    Parse.FacebookUtils.logIn(null, {
                        success: function (user) {
                            var result = {};
                            result.user = user;
                            if (!user.existed()) {
                                // get a friendly username for the user
                                result.existed = false;
                            }
                            else {
                                // facebook user has already signed up and will now login
                                result.existed = true;
                            }
                            resolve(result);
                        },
                        error: function (user, error) { return reject(error); }
                    });
                });
            }
            userUtility.facebookLogin = facebookLogin;
        })(userUtility = utility.userUtility || (utility.userUtility = {}));
    })(utility = streetViewSafari.utility || (streetViewSafari.utility = {}));
})(streetViewSafari || (streetViewSafari = {}));
///<reference path="../../Libs/Def/google.maps.d.ts"/>
///<reference path="../../Libs/Def/knockout.d.ts"/>
///<reference path="../../Libs/Def/jquery.d.ts"/>
///<reference path="../../Libs/Def/jqueryui.d.ts"/>
///<reference path="../../Libs/Def/parse.d.ts"/>
///<reference path="../../Libs/Def/bluebird.d.ts"/>
///<reference path="../../Libs/Def/ga.d.ts"/>
var safariApp = null;
window.onload = function () {
    // Initialize Parse
    //dev
    //Parse.initialize(/** Keys */);
    // prod
    //Parse.initialize( /** Keys */);
    //init facebook utils
    Parse.FacebookUtils.init({
        appId: "" /** Keys */,
        status: true,
        cookie: true,
        xfbml: true,
        version: 'v2.2' // point to the latest Facebook Graph API version
    });
    safariApp = new streetViewSafari.app.StreetViewSafariApp();
    safariApp.initialize();
};
