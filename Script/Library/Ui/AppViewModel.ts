module streetViewSafari.ui {
    export class AppViewModel {

        //app
        app: app.StreetViewSafariApp;

        // services
        geocoder: data.Geocoder;
        streetviewService: data.StreetViewService;

        // mapping objects
        map: google.maps.Map;
        panorama: google.maps.StreetViewPanorama;
        currentLocationMarker: google.maps.Marker;
        nearbyLocationMarkers: Array<google.maps.Marker>;

        //view models
        safariViewModel: SafariViewModel;
        userViewModel: UserViewModel;
        userDetailsViewModel: UserDetailsViewModel;

        //bool
        mapInitialized: boolean;
        mapVisible: boolean;

        //observables

        //bool
        loggedIn: KnockoutObservable<boolean>;
        showingUserPanel: KnockoutObservable<boolean>;
        showingSignupPanel: KnockoutObservable<boolean>;
        disableSite: KnockoutObservable<boolean>;
        showingForgotPassword: KnockoutObservable<boolean>;
        showingExisting: KnockoutObservable<boolean>;
        showingFacebookSignup: KnockoutObservable<boolean>;
        showingLoginPanel: KnockoutObservable<boolean>;
        isMobile: KnockoutObservable<boolean>;
        expired: KnockoutObservable<boolean>;

        //string
        userName: KnockoutObservable<string>;
        enteredUserName: KnockoutObservable<string>;
        enteredEmail: KnockoutObservable<string>;
        enteredPassword: KnockoutObservable<string>;
        enteredNewPassword: KnockoutObservable<string>;
        enteredForgotEmail: KnockoutObservable<string>;
        searchQuery: KnockoutObservable<string>;

        statusText: KnockoutObservable<string>;
        expanderText: KnockoutObservable<string>;
        subFormNotificationText: KnockoutObservable<string>;

        //number
        userScore: KnockoutObservable<number>;

        //other
        positionLeaveSavedSafari: google.maps.MapsEventListener;
        again: boolean;
        evtCount: number = 0;
        timer = null;
        numResults = 30;
        safariCache = {};
        safarisToView: Parse.Object[] = [];
        currentIndex = 0;
        searchPlaceholder = "Find a place...";
        poly: google.maps.Polyline = null;

        constructor(app: app.StreetViewSafariApp) {
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

            this.isMobile.subscribe(value => {
                this.toggleExpanded(true);

                window.addEventListener("orientationchange",() => {
                    this._ensureHeight();
                }, false);
            });

            // modal forms
            this.showingUserPanel = ko.observable(false);

            this.showingUserPanel.subscribe(visibility => {
                this._handleModalOverlay(visibility);
            });

            this.showingSignupPanel = ko.observable(false);

            this.showingSignupPanel.subscribe(visibility => {
                this._handleModalOverlay(visibility);
            });

            this.showingFacebookSignup = ko.observable(false);

            this.showingFacebookSignup.subscribe(visibility => {
                this._handleModalOverlay(visibility);
            });

            this.showingLoginPanel = ko.observable(false);

            this.showingLoginPanel.subscribe(visibility => {
                this._handleModalOverlay(visibility);
            });

            this.showingForgotPassword = ko.observable(false);

            this.showingForgotPassword.subscribe(visibility => {
                this._handleModalOverlay(visibility);
            });

            this.userScore = ko.observable(0);
            this.safariViewModel = new SafariViewModel(this.app);
            this.userViewModel = new UserViewModel(this.app);
            this.userDetailsViewModel = new UserDetailsViewModel();
            this.mapVisible = false;
            this.nearbyLocationMarkers = [];

            this._initialize();
        }

        private _handleModalOverlay(visible: boolean) {
            this.disableSite(visible);
        }

        private _initialize() {

            this.isMobile(this.app.isMobile());

            this.mapVisible = true;
            var mapOptions: google.maps.MapOptions = {
                zoom: 15,
                streetViewControl: false,
                enableCloseButton: false
            };

            this.geocoder = new data.Geocoder();
            this.streetviewService = new data.StreetViewService();

            this.map = new google.maps.Map(document.getElementById("map-canvas"),
                mapOptions);

            var streetViewLayer = new (<any>google).maps.StreetViewCoverageLayer();
            streetViewLayer.setMap(this.map);

            this.currentLocationMarker = new google.maps.Marker({
                map: this.map,
                title: "Safari Location",
                icon: "../Images/fourbyfour.png",
                zIndex: 101
            });

            var options: google.maps.StreetViewPanoramaOptions = {
                imageDateControl: true,
                enableCloseButton: false
            };

            this.panorama = new google.maps.StreetViewPanorama(document.getElementById("panorama"), options);

            this.subscribeToEvents();

            ko.applyBindings(this);

            this.searchQuery(this.searchPlaceholder);

            this._ensureHeight();

            var searchInput = $("#search-input");
            searchInput.click(() => {
                if (this.searchQuery() === this.searchPlaceholder) {
                    this.searchQuery("");
                }
            });

            searchInput.focusout(() => {
                if (this.searchQuery().trim() === "") {
                    this.searchQuery(this.searchPlaceholder);
                }
            });

            searchInput.keypress((e) => {
                if (e.keyCode == 13) {
                    this.geocode();
                }         
            });

            $(window).resize(() => {
                this._ensureHeight();
                this._resizeMap();
                this._resizePanorama();
            });

            utility.safariUtility.getSafariIds()
                .then(safaris => {
                    this.safarisToView = safaris;
                    utility.extensions.shuffleArray(safaris);
                    this.currentIndex = 0;
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        private _ensureHeight() {
            var bannerHeight = 0;
            if (!this.app.isMobile()) {
                bannerHeight = $("#banner").height();
            }

            var winHeight = $(window).height();
            $("#main-area").height(winHeight - bannerHeight);
        }

        geocode() {
            var term = this.searchQuery();

            if (term && term !== this.searchPlaceholder) {
                this.geocoder.geocode(term)
                    .then(position => {
                        return this.streetviewService.getPanoramaByLocation(position, 200);
                    })
                    .then(data => this._setPanoByLocation(data.location.latLng, null))
                    .caught(error => {
                        this.app.flashStatusText("Failed to find a streetview for the location");
                        diagnostics.Logging.logError(error);
                });
            } else {
                this.app.flashStatusText("Enter a place to find");
            }
        }

        private subscribeToEvents(): void {
            google.maps.event.addListener(this.map, "tilesloaded", (args) => {
                if (!this.mapInitialized) {
                    this.mapInitialized = true;
                    this.fireDragEndEvent();
                }
            });

            //map events
            google.maps.event.addListener(this.map, "click", (args) => {
                this._mapClicked(args);
            });

            google.maps.event.addListener(this.map, "bounds_changed", (args) => {
                this.fireDragEndEvent();
            });

            google.maps.event.addListener(this.map, "dragend", () => {
                this._queue();
            });

            //streetview panorama events
            google.maps.event.addListener(this.panorama, "position_changed",() => {
                var position = this.panorama.getPosition();
                this.currentLocationMarker.setPosition(position);
                this.map.panTo(position);
                this.fireDragEndEvent();

                if (!this.isMobile()) {                
                    if (!this.poly) {
                        var polyOptions = {
                            strokeColor: "#FF9933",
                            strokeOpacity: 1.0,
                            strokeWeight: 3
                        };

                        this.poly = new google.maps.Polyline(polyOptions);
                        this.poly.setMap(this.map);
                    }
                    var path = this.poly.getPath();
                    var pathLength = path.getLength();
                    if (pathLength > 0) {

                        var lastPoint = path.getAt(pathLength - 1);
                        var distance = google.maps.geometry.spherical.computeDistanceBetween(lastPoint, position);
                        if (distance >= 1000) {
                            path.clear();
                        }
                    }

                    this.poly.getPath().push(position);
                }
            });

            google.maps.event.addListener(this.panorama, "visible_changed", () => {
                if (!this.panorama.getVisible()) {
                    this.panorama.setVisible(true);
                }
            });
        }

        // simple throttling for a heavy request
        private _process() {
            // process
            this._handleDragEnd();
            if (!this.again) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }

        private _queue() {
            if (this.timer === null) {
                this.timer = setInterval(() => this._process()
                    , 1500);
                this.again = false;
            }
        }

        private _handleDragEnd() {
            if (this.mapVisible) {
                var parseClass = new objects.ParseClass(objects.ClassType.SafariMarker);
                var query = parseClass.getQuery();

                var mapBounds = this.map.getBounds();

                var southWest = utility.safariUtility.googleLatLngToGeoPoint(mapBounds.getSouthWest());
                var northEast = utility.safariUtility.googleLatLngToGeoPoint(mapBounds.getNorthEast());

                query.withinGeoBox("geoPoint", southWest, northEast);
                query.limit(this.numResults);
                query.include("user");
                query.include("score");
                query.execute()
                    .then(results => {
                        if (results && results.length > 0) {
                            this._clearSafariMarkers();
                            this.nearbyLocationMarkers = [];

                            // for each geopoint, create a marker
                            for (var i = 0; i < results.length; i++) {
                                var geoPoint = results[i].get("geoPoint");
                                var index = results[i].id;
                                if (geoPoint && index) {
                                    var marker = this._createMarker(geoPoint, index);
                                    this.nearbyLocationMarkers.push(marker);
                                }

                                //cache
                                if (!this.safariCache[results[i].id]) {
                                    this.safariCache[results[i].id] = results[i];
                                }
                            }
                        } else {
                            this._clearSafariMarkers();
                        }
                    })
                    .caught(error => diagnostics.Logging.logError(error));
            }
        }

        private _clearSafariMarkers(): void {
            //clear markers
            for (var i = 0; i < this.nearbyLocationMarkers.length; i++) {
                this.nearbyLocationMarkers[i].setMap(null);
            }
        }

        toggleExpanded(expand?: boolean): void {
            this._ensureHeight();

            var windowHeight = $("#main-area").height();
            var maximizedPixels = Math.floor((windowHeight / 100) * 100);
            var minimizedMapPixels = Math.floor((windowHeight / 100) * 50);
            var minimizedPanPixels = Math.floor((windowHeight / 100) * 50);

            var panorama = $(".panorama-container");
            var map = $(".map-container");

            if ((panorama.height() < maximizedPixels) || expand === true) {
                // maximize it
                $(panorama).animate({ height: maximizedPixels }, null, () => this._resizePanorama());
                $(map).animate({ height: 0 }, null, () => {
                    this._resizeMap();
                    this.expanderText("Show Map");
                });

                this.mapVisible = false;

            } else {
                // minimize it
                $(panorama).animate({ height: minimizedPanPixels }, null, () => this._resizePanorama());
                $(map).animate({ height: minimizedMapPixels }, null, () => {
                    this._resizeMap();
                    this.expanderText("Fullscreen");
                });

                this.mapVisible = true;
                this.fireDragEndEvent();
            }
        }

        private _setPanoByLocation(location: google.maps.LatLng, pov?: google.maps.StreetViewPov): void {
            var options: google.maps.StreetViewPanoramaOptions = {
                position: location
            }

            if (pov) {
                options.pov = pov;
            }

            this.panorama.setOptions(options);
        }

        /* https://stackoverflow.com/questions/28265890/proper-way-to-set-the-streetview-panoramaid-and-pov-at-the-same-time */
        private _setPanoramaById(panoId: string, pov?: google.maps.StreetViewPov): void {
            if (panoId && pov) {
                var options: google.maps.StreetViewPanoramaOptions = {
                    pov: pov,
                    pano: panoId
                }

                this.panorama.setOptions(options);
            } else if (panoId) {
                this.panorama.setPano(panoId);
            }
        }

        private _resizeMap(): void {
            google.maps.event.trigger(this.map, "resize");
            this.map.setCenter(this.panorama.getPosition());
        }

        private _resizePanorama(): void {
            google.maps.event.trigger(this.panorama, "resize");
        }

        private _createMarker(geoPoint: Parse.GeoPoint, loadId: number): google.maps.Marker {
            var marker = new google.maps.Marker({
                position: utility.safariUtility.geoPointToGoogleLatLng(geoPoint),
                map: this.map,
                title: "Nearby Safari",
                icon: "../Images/360degrees.png",
                zIndex: 100
            });

            //create closure
            var closeEvent = (id) => {
                google.maps.event.addListener(marker, "click",() => {

                    // load by id
                    if (!this.safariCache[id]) {
                        this.loadSafariById(id);
                    } else {
                        this.setSafari(this.safariCache[id]);
                    }
                });
            }

            closeEvent(loadId);

            return marker;
        }

        private _mapClicked(args): void {
            var latLng: google.maps.LatLng = args.latLng;
            this.showingExisting(false);
            var tolerance = 1000 / (this.map.getZoom() + 1);
            tolerance = Math.floor(tolerance);

            this.streetviewService.getPanoramaByLocation(latLng, tolerance)
                .then(data => {
                    this.panorama.setZoom(0);
                    this._setPanoByLocation(data.location.latLng, { zoom: 0, pitch: 0, heading: 0 });
                    this.setSafari(null);
                })
                .caught(error => {
                    this.app.flashStatusText("No street view for clicked location...");
                    diagnostics.Logging.logError(error);
            });
        }

        setStartupPosition(latLng: google.maps.LatLng): void {

            var geoPoint = utility.safariUtility.googleLatLngToGeoPoint(latLng);

            utility.safariUtility.findSafariWithinKilometers(geoPoint, 2)
                .then(safari => {
                    if (safari) {
                        this.setSafari(safari);
                    } else {

                        this.streetviewService.getPanoramaByLocation(latLng, 10000)
                            .then(data => {
                                this.panorama.setPano(data.location.pano);
                                this.panorama.setZoom(0);
                                this.setSafari(null);
                            })
                            .caught(error => {
                                diagnostics.Logging.logError(error);
                                this.app.flashStatusText("No street view for startup location...");
                                this.loadRandom();
                        });
                    }
                })
                .caught(error => {
                    diagnostics.Logging.logError(error);
                    this.loadRandom();
            });
        }

        //refresh the map
        private fireDragEndEvent(): void {
            google.maps.event.trigger(this.map, "dragend");
        }

        refreshMap(): void {
            this.fireDragEndEvent();
        }

        logSafari(): void {
            if (!utility.userUtility.isUserAuthenticated()) {
                this.app.flashStatusText("Must be logged in to save locations.");
                return;
            }

            var position = this.panorama.getPosition();
            var pov = this.panorama.getPov();

            var scene = new streetViewSafari.objects.Safari(null);
            scene.loadPovPosition(position, pov);
            scene.panoId = this.panorama.getPano();

            var geoPoint = utility.safariUtility.googleLatLngToGeoPoint(position);
            this.streetviewService.getPanoramaById(scene.panoId)
                .then(data => {
                    scene.imageDate = Date.parse(data.imageDate);
                    return utility.safariUtility.findSafariWithinKilometers(geoPoint, 0.030);
                })
                .then(safari => {
                    if (!safari) {
                        return scene.saveWithUserACL();

                    } else {
                        this.app.flashStatusText("Location must be somewhat unique.");
                        return Promise.reject("Location must be somewhat unique.");
                    }
                })
                .then((savedSafari) => {
                    if (savedSafari) {
                        this.setSafari(savedSafari);
                    } else {
                        return Promise.reject("Failed to save safari");
                    }
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        loadSafariById(id: string): void {

            utility.safariUtility.getSafariById(id)
                .then(safari => {
                    if (safari) {
                        this.setSafari(safari);
                    } else {
                        this.app.flashStatusText("Could not find the requested Safari.");
                        this.loadRandom();
                    }
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        loadRandom(): void {
            var parseClass = new objects.ParseClass(objects.ClassType.SafariMarker);
            var query = parseClass.getQuery();

            query.first()
                .then(safari => {
                    if (safari) {
                        this.loadSafariById(safari.id);
                    }
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        //* https://code.google.com/p/gmaps-api-issues/issues/detail?id=7617 */
        private _refreshHack(pov: google.maps.StreetViewPov) {
            setTimeout(() => {
                //modify pov
                if (pov.heading || pov.heading === 0) {
                    pov.heading += .0000001;
                }

                this.panorama.setPov(pov);
            }, 500);
        }

        setSafari(safariDataModel?: Parse.Object): void {
            this._removePositionLeaveSavedSafari();

            if (safariDataModel) {

                var safariViewModel = new objects.Safari(safariDataModel);
                var pov = safariViewModel.getStreetViewPov();
                this.streetviewService.getPanoramaById(safariViewModel.panoId)
                    .then(data => {
                        this.expired(false);
                        this._setPanoramaById(safariViewModel.panoId, pov);
                        this._refreshHack(pov);     
                    })
                    .caught(e => {
                        this.expired(true);
                        this._setPanoByLocation(safariViewModel.getLatLng(), pov);
                        this._refreshHack(pov);
                    });

                
                this.showingExisting(true);
                this.positionLeaveSavedSafari = google.maps.event.addListener(this.panorama, "position_changed",() => {
                    this.evtCount++;

                    if (this.evtCount > 2) {
                        this._removePositionLeaveSavedSafari();
                        this.showingExisting(false);
                    }
                });

            } else {
                var safariViewModel = new objects.Safari(null);
                this.showingExisting(false);
                this.expired(false);
            }

            this.safariViewModel.setSafari(safariViewModel);
        }

        private _removePositionLeaveSavedSafari() {
            this.evtCount = 0;
            if (this.positionLeaveSavedSafari) {
                google.maps.event.removeListener(this.positionLeaveSavedSafari);
            }
        }

        validateLogin(username: string, password: string): string {

            if (username && password) {
                return "";
            } else {
                return "Please enter a username and password.";
            }
        }

        validateSignup(username: string, password: string, email: string): string {

            if (username && password && email) {
                return "";
            } else {
                return "Please enter a username, password and email.";
            }
        }

        showNext(): void {
            this.currentIndex++;
            if (this.currentIndex < this.safarisToView.length -1) {
                ga("send", "event", "showNext", "click");
            } else {
                this.currentIndex = 0;
            }

            this.setSafari(this.safarisToView[this.currentIndex]);
        }

        showPrevious(): void {
            this.currentIndex--;
            if (this.currentIndex < this.safarisToView.length) {
                if (this.currentIndex < 0) {
                    this.currentIndex = this.safarisToView.length - Math.abs(this.currentIndex);
                }
                ga("send", "event", "showPrevious", "click");
            } else {
                this.currentIndex = 0;
            }

            this.setSafari(this.safarisToView[this.currentIndex]);
        }

        setLoggedIn(loggedIn: boolean): void {
            this.loggedIn(loggedIn);
        }

        closeOpenModal() {

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
        }

        setShowingLoginPanel(show: boolean): void {
            this.subFormNotificationText("");
            this.enteredPassword("");
            this.enteredUserName("");
            this.showingLoginPanel(show);
        }

        setShowingUserPanel(show: boolean): void {
            this.subFormNotificationText("");
            this.enteredNewPassword("");
            this.showingUserPanel(show);
        }

        setShowingFacebookSignup(show: boolean): void {
            this.subFormNotificationText("");
            this.enteredUserName("");
            this.enteredPassword("");
            this.showingFacebookSignup(show);
        }

        setShowingSignupPanel(show: boolean): void {
            this.subFormNotificationText("");
            this.enteredNewPassword("");
            this.enteredPassword("");
            this.enteredUserName("");
            this.enteredEmail("");
            this.showingSignupPanel(show);
        }

        setShowingForgotPassword(show: boolean): void {
            this.subFormNotificationText("");
            this.showingForgotPassword(show);
        }

        clearLoginFields(): void {
            this.enteredEmail("");
            this.enteredPassword("");
            this.enteredUserName("");
        }
    }
}