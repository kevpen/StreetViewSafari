module streetViewSafari.app {
    export class StreetViewSafariApp {

        /** The application's view model. */
        appViewModel: ui.AppViewModel;

        private params: any = null;

        constructor() { }

        public initialize(): void {
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
        }

        public isMobile(): boolean {
            if (!!navigator.userAgent.match(/iphone|android|blackberry/ig) || (this.params.mode === "m" || this.params.mode === "M")) {
                return true;
            }

            return false;
        }

        public handleFacebookLogin() {
            ga('send', 'event', 'facebookLoginSignup', 'click');

            utility.userUtility.facebookLogin()
                .then(result => {
                    if (result.existed) {

                        // facebook user has already signed up and will now login
                        var newUser = new objects.User(result.user);
                        this._handleUserLogin(newUser);
                        this.appViewModel.setShowingSignupPanel(false);
                    } else {

                        // get a friendly username for the user
                        if (this.appViewModel.showingLoginPanel()) {
                            this.appViewModel.setShowingLoginPanel(false);
                        } else if (this.appViewModel.showingSignupPanel()) {
                            this.appViewModel.setShowingSignupPanel(false);
                        }
                    }
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        linkFacebook() {
            ga('send', 'event', 'linkFacebook', 'click');
            var parseUser = utility.userUtility.getUserFromSession();

            utility.userUtility.linkFacebook(parseUser)
                .then(user => this._handleUserLogin(new objects.User(user)))
                .caught(error => diagnostics.Logging.logError(error));
        }

        unlinkFacebook() {
            ga('send', 'event', 'unlinkFacebook', 'click');
            var parseUser = utility.userUtility.getUserFromSession();

            utility.userUtility.unlinkFacebook(parseUser)
                .then(user => this._handleUserLogin(new objects.User(user)))
                .caught((error) => diagnostics.Logging.logError(error));
        }

        setFacebookUserNamePassword() {
            ga('send', 'event', 'setFacebookUserPass', 'click');
            var userName = this.appViewModel.enteredUserName();
            var password = this.appViewModel.enteredPassword();

            if (!userName || !password) {
                this.appViewModel.subFormNotificationText("Please enter a username and password.");
                return;
            }

            utility.userUtility.userNameExist(userName)
                .then(exists => {
                    if (!exists) {
                        // username available
                        return utility.userUtility.setUsernameAndPassword(userName, password);
                    } else {
                        this.appViewModel.subFormNotificationText("That username is already taken. Try another one.");
                        return Promise.reject("That username is already taken. Try another one.");
                    }
                })
                .then((user: Parse.User) => {
                    if (user) {
                        var newUser = new objects.User(user);
                        this._handleUserLogin(newUser);
                        this.appViewModel.setShowingFacebookSignup(false);
                    }
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        private _parseQuery() {
            var params = utility.safariUtility.getQueryParams(window.location.search);

            if (!params) {
                params = {};
            }

            this.params = params;
        }

        private _handleStartup(): void {
            if (this.params.s) {
                var sarafiId: string = this.params.s;
                this.appViewModel.loadSafariById(sarafiId);
                this.appViewModel.toggleExpanded(true);
            } else {
                this._loadStartupPosition();
            }
        }

        private _loadStartupPosition(): void {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => this._handleGeolocateSuccess(position),
                    (error) => this._handleGeolocationError(error));
            } else {
                this.appViewModel.loadRandom();
            }
        }

        private _handleGeolocationError(error): void {
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
                    diagnostics.Logging.logError(error);
                    break;
            }

            this.appViewModel.loadRandom();
        }

        private _handleGeolocateSuccess(position): void {
            if (position) {
                var lat: number = position.coords.latitude;
                var lng: number = position.coords.longitude;
                var latlng = new google.maps.LatLng(lat, lng);
                this.appViewModel.setStartupPosition(latlng);
            }
        }

        private _handleUserLogin(user: objects.User): void {
            if (this.appViewModel.showingLoginPanel()) {
                this.appViewModel.setShowingLoginPanel(false);
            }

            this.appViewModel.userViewModel.setUser(user);
            this.appViewModel.setLoggedIn(true);
            if (this.appViewModel.showingExisting() && this.appViewModel.safariViewModel) {
                this.appViewModel.loadSafariById(this.appViewModel.safariViewModel.getSafari().id);
            }
        }

        signup(): void {
            ga('send', 'event', 'signup', 'click');
            var username = this.appViewModel.enteredUserName();
            var password = this.appViewModel.enteredPassword();
            var email = this.appViewModel.enteredEmail();

            var validationError = this.appViewModel.validateSignup(username, password, email);

            if (validationError) {
                this.appViewModel.subFormNotificationText(validationError);
            } else {
                utility.userUtility.signUp(username, email, password)
                    .then(user => {
                        if (user) {
                            this.appViewModel.subFormNotificationText("");
                            var newUser = new objects.User(user);
                            this._handleUserLogin(newUser);
                            this.appViewModel.setShowingSignupPanel(false);
                        }
                    })
                    .caught(error => {
                        if (error && error.message) {
                            this.appViewModel.subFormNotificationText("Error: " + error.message);
                        }

                        diagnostics.Logging.logError(error);
                });
            }
        }

        login(): void {
            ga('send', 'event', 'login', 'click');
            var username = this.appViewModel.enteredUserName();
            var password = this.appViewModel.enteredPassword();

            var validationError = this.appViewModel.validateLogin(username, password);

            if (validationError) {
                this.appViewModel.subFormNotificationText(validationError);
            } else {
                utility.userUtility.login(username, password)
                    .then(user => {
                        this.appViewModel.subFormNotificationText("");
                        this.appViewModel.enteredUserName("");
                        this.appViewModel.enteredPassword("");

                        this._handleUserLogin(new objects.User(user));
                    })
                    .caught(error => {
                        if (error && error.message) {
                            this.appViewModel.subFormNotificationText("Error: " + error.message);
                        }

                        diagnostics.Logging.logError(error);
                });

                this.flashStatusText("Logging you in...");
            }
        }

        logout(): void {
            ga('send', 'event', 'logout', 'click');
            this.flashStatusText("Logging you out...");
            utility.userUtility.logout();
            this.appViewModel.setLoggedIn(false);
            if (this.appViewModel.showingExisting() && this.appViewModel.safariViewModel) {
                this.appViewModel.loadSafariById(this.appViewModel.safariViewModel.getSafari().id);
            }
        }

        resetPassword(): void {
            ga('send', 'event', 'resetPassword', 'click');
            if (utility.userUtility.isUserAuthenticated()) {

                var password = this.appViewModel.enteredNewPassword();

                utility.userUtility.resetPassword(password)
                    .then(user => this.appViewModel.subFormNotificationText("Password has been set."))
                    .caught(error => {
                        if (error && error.message) {
                            this.appViewModel.subFormNotificationText(error.message);
                            diagnostics.Logging.logError(error);
                        }
                    });
            }
        }

        forgotPassword(): void {
            ga('send', 'event', 'forgotPassword', 'click');
            var email = this.appViewModel.enteredForgotEmail();

            utility.userUtility.requestPasswordReset(email)
                .then(() => this.appViewModel.subFormNotificationText("Password reset email sent!"))
                .caught(error => {
                    if (error && error.message) {
                        this.appViewModel.subFormNotificationText(error.message);
                        diagnostics.Logging.logError(error);
                    }
            });
        }

        flashStatusText(status: string, duration?: number): void {
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
        }
    }
}