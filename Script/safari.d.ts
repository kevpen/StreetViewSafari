/// <reference path="../Libs/Def/google.maps.d.ts" />
/// <reference path="../Libs/Def/knockout.d.ts" />
/// <reference path="../Libs/Def/jquery.d.ts" />
/// <reference path="../Libs/Def/jqueryui.d.ts" />
/// <reference path="../Libs/Def/parse.d.ts" />
/// <reference path="../Libs/Def/bluebird.d.ts" />
/// <reference path="../Libs/Def/ga.d.ts" />
declare module streetViewSafari.app {
    class StreetViewSafariApp {
        /** The application's view model. */
        appViewModel: ui.AppViewModel;
        private params;
        constructor();
        initialize(): void;
        isMobile(): boolean;
        handleFacebookLogin(): void;
        linkFacebook(): void;
        unlinkFacebook(): void;
        setFacebookUserNamePassword(): void;
        private _parseQuery();
        private _handleStartup();
        private _loadStartupPosition();
        private _handleGeolocationError(error);
        private _handleGeolocateSuccess(position);
        private _handleUserLogin(user);
        signup(): void;
        login(): void;
        logout(): void;
        resetPassword(): void;
        forgotPassword(): void;
        flashStatusText(status: string, duration?: number): void;
    }
}
declare module streetViewSafari.base {
    /** Base class which can be extended when interfacing with Parse objects. */
    class SaveBase {
        constructor();
        /** Override this to return the object's attribute values. */
        getSaveState(): any;
        /** Returns the type of the object. */
        getClassType(): objects.ClassType;
        /**
         * Saves the object to Parse with public read and private write access.
         * Returns a Promise which will be resolved with the underlying Parse object when the save is successful.
         */
        saveWithUserACL(): Promise<Parse.Object>;
        /**
         * Saves the object to Parse with public read and public write access.
         * Returns a Promise which will be resolved with the underlying Parse object when the save is successful.
         */
        save(): Promise<Parse.Object>;
        /** Returns the Query which can be used to fetch the object from Parse. */
        getQuery(): data.Query;
        /** Returns the a new Parse class defintion which can be used to create a new Parse object. */
        getParseClass(): objects.ParseClass;
    }
}
declare module streetViewSafari.data {
    /** Class which wraps the google.maps.Geocoder. */
    class Geocoder {
        /** The intialized geocoder. */
        private _geocoder;
        /** Constructs a new instance of the Geocoder. */
        constructor();
        /**
         * Geocodes an search value.
         * Returns a Promise which will be resolved with the Geocode operation is complete.
         */
        geocode(searchTerm: string): Promise<google.maps.LatLng>;
    }
}
declare module streetViewSafari.data {
    /** Class whch wraps a Parse query any exposes useful methods. */
    class Query {
        /** The initialized Parse.Query. */
        private _query;
        /** Constructs a new instance of the Query class by passing in a Parse object. */
        constructor(parseObject: Parse.Object);
        /** Adds a 'key = value' constraint to the query. */
        addEqualTo(key: string, value: any): void;
        /** Adds a select field to the query. */
        addSelect(key: string): void;
        /** Adds an 'ObjectId = id' constraint. */
        addGetById(id: string): void;
        /**
         * Executes the Query.
         * Returns a Promise which will contain an array of found objects when resolved.
         */
        execute(): Promise<Parse.Object[]>;
        /**
         * Executes the Query for count.
         * Returns a Promise which will contain the number of matching objects when resolved.
         */
        executeForCount(): Promise<number>;
        /**
         * Executes the Query for the first found item.
         * Returns a Promise which will contain the first found object when resolved.
         */
        first(): Promise<Parse.Object>;
        /** Includes a field in the results. */
        include(key: string): void;
        /** Adds a sort field and sort order to a Query. */
        sort(key: string, sortOrder: SortOrder): void;
        /** Limits the maximum number of results. */
        limit(num: number): void;
        /** Adds a spatial filter to the Query. */
        withinGeoBox(key: string, southWest: Parse.GeoPoint, northEast: Parse.GeoPoint): void;
        /** Limits results to be within a specified Kilometer range from a given point. */
        withinKilometers(key: string, geoPoint: Parse.GeoPoint, kms: number): void;
    }
    /** Sort order used in Queries. */
    enum SortOrder {
        ASCENDING = 0,
        DESCENDING = 1,
    }
}
declare module streetViewSafari.data {
    /** Class which wraps the google.maps.StreetViewService .*/
    class StreetViewService {
        private _service;
        constructor();
        getPanoramaByLocation(poistion: google.maps.LatLng, distance: number): Promise<google.maps.StreetViewPanoramaData>;
        getPanoramaById(panoId: string): Promise<google.maps.StreetViewPanoramaData>;
    }
}
declare module streetViewSafari.diagnostics {
    /** Static class which contains methods for logging. */
    class Logging {
        /** Logs a given error. */
        static logError(error: Error): void;
        /** Logs a given message. */
        static logMessage(message: string, level?: string): void;
    }
}
declare module streetViewSafari.objects {
    class ClassNames {
        static MARKER: string;
        static COMMENT: string;
        static VOTE: string;
        static VOTE_TOTAL: string;
        static USER_VOTE_TOTAL: string;
        static USER: string;
    }
}
declare module streetViewSafari.objects {
    enum ClassType {
        SafariMarker = 0,
        SafariVotes = 1,
        SafariComment = 2,
        UserVote = 3,
        User = 4,
        SafariVoteTotal = 5,
    }
}
declare module streetViewSafari.objects {
    class ParseClass {
        private parseObject;
        private queryHelper;
        saveClass: Parse.Object;
        constructor(classType: ClassType);
        createNewObject(classType: ClassType): Parse.Object;
        private _createSaveClass();
        private _createQueryClass();
        setRelation(key: string, parseObject: any): void;
        getParseClass(): Parse.Object;
        getQuery(): data.Query;
    }
}
declare module streetViewSafari.objects {
    class Safari extends base.SaveBase {
        initialized: boolean;
        lat: number;
        lng: number;
        heading: number;
        zoomLevel: number;
        pitch: number;
        imageDate: number;
        userId: string;
        userName: string;
        id: string;
        score: number;
        panoId: string;
        private _parseObject;
        private _votePointer;
        constructor(parseObject?: Parse.Object);
        loadPovPosition(position: google.maps.LatLng, pov: google.maps.StreetViewPov): void;
        loadFromParse(parseSafari: Parse.Object): void;
        getStreetViewPov(): google.maps.StreetViewPov;
        getLatLng(): google.maps.LatLng;
        getSaveState(): any;
        getClassType(): ClassType;
        getComments(): Promise<UserComment[]>;
        registerVote(voteValue: number): Promise<any>;
        remove(): Promise<any>;
    }
}
declare module streetViewSafari.objects {
    class SafariScore extends base.SaveBase {
        id: string;
        safariId: string;
        totalScore: number;
        constructor(parseObject?: Parse.Object);
        loadFromParse(safariScore: Parse.Object): void;
        getSaveState(): any;
        getClassType(): ClassType;
    }
}
declare module streetViewSafari.objects {
    class User {
        private _parseUser;
        constructor(user?: Parse.User);
        getUserName(): string;
        getUserId(): string;
        getParseUser(): Parse.User;
        createAndGetUserScore(): Promise<Parse.Object>;
        private createUserScore();
        registerScore(voteValue: number): Promise<Parse.Object>;
    }
}
declare module streetViewSafari.objects {
    class UserComment extends base.SaveBase {
        comment: string;
        safariId: string;
        userName: string;
        date: string;
        constructor(parseObject?: Parse.Object);
        loadFromParse(parseComment: Parse.Object): void;
        getSaveState(): any;
        getClassType(): ClassType;
    }
}
declare module streetViewSafari.objects {
    class UserScore extends base.SaveBase {
        score: number;
        userId: string;
        constructor(userId: string, score?: number);
        getSaveState(): any;
        getClassType(): ClassType;
        incrementScore(value: number): Promise<Parse.Object>;
        private getParseObject();
    }
}
declare module streetViewSafari.objects {
    class Vote extends base.SaveBase {
        safariId: string;
        vote: VoteType;
        constructor(parseObject?: Parse.Object);
        getSaveState(): any;
        getVoteValue(): number;
        getClassType(): ClassType;
        getExistingVote(): Promise<Parse.Object>;
        saveVote(): Promise<any>;
        loadFromParse(parseObject: Parse.Object): void;
        private voteValueToVoteType(value);
    }
}
declare module streetViewSafari.objects {
    enum VoteType {
        UP = 0,
        DOWN = 1,
        NOTVOTED = 2,
    }
}
declare module streetViewSafari.ui {
    class AppViewModel {
        app: app.StreetViewSafariApp;
        geocoder: data.Geocoder;
        streetviewService: data.StreetViewService;
        map: google.maps.Map;
        panorama: google.maps.StreetViewPanorama;
        currentLocationMarker: google.maps.Marker;
        nearbyLocationMarkers: Array<google.maps.Marker>;
        safariViewModel: SafariViewModel;
        userViewModel: UserViewModel;
        userDetailsViewModel: UserDetailsViewModel;
        mapInitialized: boolean;
        mapVisible: boolean;
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
        userScore: KnockoutObservable<number>;
        positionLeaveSavedSafari: google.maps.MapsEventListener;
        again: boolean;
        evtCount: number;
        timer: any;
        numResults: number;
        safariCache: {};
        safarisToView: Parse.Object[];
        currentIndex: number;
        searchPlaceholder: string;
        poly: google.maps.Polyline;
        constructor(app: app.StreetViewSafariApp);
        private _handleModalOverlay(visible);
        private _initialize();
        private _ensureHeight();
        geocode(): void;
        private subscribeToEvents();
        private _process();
        private _queue();
        private _handleDragEnd();
        private _clearSafariMarkers();
        toggleExpanded(expand?: boolean): void;
        private _setPanoByLocation(location, pov?);
        private _setPanoramaById(panoId, pov?);
        private _resizeMap();
        private _resizePanorama();
        private _createMarker(geoPoint, loadId);
        private _mapClicked(args);
        setStartupPosition(latLng: google.maps.LatLng): void;
        private fireDragEndEvent();
        refreshMap(): void;
        logSafari(): void;
        loadSafariById(id: string): void;
        loadRandom(): void;
        private _refreshHack(pov);
        setSafari(safariDataModel?: Parse.Object): void;
        private _removePositionLeaveSavedSafari();
        validateLogin(username: string, password: string): string;
        validateSignup(username: string, password: string, email: string): string;
        showNext(): void;
        showPrevious(): void;
        setLoggedIn(loggedIn: boolean): void;
        closeOpenModal(): void;
        setShowingLoginPanel(show: boolean): void;
        setShowingUserPanel(show: boolean): void;
        setShowingFacebookSignup(show: boolean): void;
        setShowingSignupPanel(show: boolean): void;
        setShowingForgotPassword(show: boolean): void;
        clearLoginFields(): void;
    }
}
declare module streetViewSafari.ui {
    class CommentViewModel {
        commentText: string;
        userName: string;
        date: string;
        private comment;
        constructor(comment: objects.UserComment);
    }
}
declare module streetViewSafari.ui {
    class SafariViewModel {
        userName: KnockoutObservable<string>;
        score: KnockoutObservable<number>;
        comments: KnockoutObservableArray<CommentViewModel>;
        link: KnockoutObservable<string>;
        commentText: KnockoutObservable<string>;
        upVote: KnockoutObservable<boolean>;
        downVote: KnockoutObservable<boolean>;
        userOwned: KnockoutObservable<boolean>;
        private _vote;
        private _safariDataModel;
        private _app;
        constructor(app: app.StreetViewSafariApp);
        getSafari(): objects.Safari;
        setSafari(safari: objects.Safari): void;
        private populateCommentViewModels();
        refresh(): void;
        setVoteInterface(vote: objects.Vote): void;
        private setUpVote(show);
        private setDownVote(show);
        private saveVote(voteType);
        private updateUserScore(voteValue);
        private updateSafariScore(voteValue);
        handleUpVote(): void;
        handleDownVote(): void;
        handleDelete(): void;
        saveComment(): void;
    }
}
declare module streetViewSafari.ui {
    class UserDetailsViewModel {
        constructor();
        _initialize(): void;
    }
}
declare module streetViewSafari.ui {
    class UserViewModel {
        private _userDataModel;
        app: streetViewSafari.app.StreetViewSafariApp;
        userName: KnockoutObservable<string>;
        score: KnockoutObservable<number>;
        isFacebookUser: KnockoutObservable<boolean>;
        constructor(app: streetViewSafari.app.StreetViewSafariApp);
        setUser(user: objects.User): void;
        private _getUserScore();
        refresh(): void;
    }
}
declare module streetViewSafari.utility.extensions {
    function shuffleArray(array: Array<any>): Array<any>;
}
declare module streetViewSafari.utility.userUtility {
    interface FacebookLoginResult {
        user: Parse.User;
        existed: boolean;
    }
}
declare module streetViewSafari.utility.pointerUtility {
    function createPointerForCurrentUser(): Parse.User;
    function createObjectPointer(id: string, classType: objects.ClassType): Parse.Object;
}
declare module streetViewSafari.utility.safariUtility {
    function getRandomInt(max: number): number;
    function getQueryParams(qs: any): any;
    function geoPointToGoogleLatLng(geoPoint: Parse.GeoPoint): google.maps.LatLng;
    function googleLatLngToGeoPoint(latLng: google.maps.LatLng): Parse.GeoPoint;
    function findSafariWithinKilometers(geoPoint: Parse.GeoPoint, distance: number): Promise<Parse.Object>;
    function getSafariById(id: string): Promise<Parse.Object>;
    function createTotalScoreObject(safariId: string): Promise<Parse.Object>;
    function linkTotalScoreOnSafari(safari: Parse.Object, totalScoreId: string): Promise<Parse.Object>;
    function getSafariIds(): Promise<Parse.Object[]>;
}
declare module streetViewSafari.utility.userUtility {
    function getUserFromSession(): Parse.User;
    function getUserNameOfCurrentUser(): string;
    function getIdOfCurrentUser(): string;
    function signUp(userName: string, email: string, password: string): Promise<Parse.User>;
    function login(userName: string, password: string): Promise<Parse.User>;
    function logout(): void;
    function isUserAuthenticated(): boolean;
    function requestPasswordReset(email: string): Promise<{}>;
    function resetPassword(newPassword: string): Promise<Parse.User>;
    function userNameExist(userName: string): Promise<boolean>;
    function setUsernameAndPassword(userName: string, password: string): Promise<Parse.User>;
    function isFacebookLinked(user: Parse.User): boolean;
    function linkFacebook(user: Parse.User): Promise<Parse.User>;
    function unlinkFacebook(user: Parse.User): Promise<Parse.User>;
    function facebookLogin(): Promise<FacebookLoginResult>;
}
declare var safariApp: streetViewSafari.app.StreetViewSafariApp;
