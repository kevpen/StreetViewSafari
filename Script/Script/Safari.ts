///<reference path="../../Libs/Def/google.maps.d.ts"/>
///<reference path="../../Libs/Def/knockout.d.ts"/>
///<reference path="../../Libs/Def/jquery.d.ts"/>
///<reference path="../../Libs/Def/jqueryui.d.ts"/>
///<reference path="../../Libs/Def/parse.d.ts"/>
///<reference path="../../Libs/Def/bluebird.d.ts"/>
///<reference path="../../Libs/Def/ga.d.ts"/>

var safariApp: streetViewSafari.app.StreetViewSafariApp = null;

window.onload = function () {
    // Initialize Parse
    //dev
    //Parse.initialize(/** Keys */);

    // prod
    //Parse.initialize( /** Keys */);

    //init facebook utils
    Parse.FacebookUtils.init({ // this line replaces FB.init({
        appId: ""/** Keys */, // Facebook App ID
        status: true,  // check Facebook Login status
        cookie: true,  // enable cookies to allow Parse to access the session
        xfbml: true,  // initialize Facebook social plugins on the page
        version: 'v2.2' // point to the latest Facebook Graph API version
    });

    safariApp = new streetViewSafari.app.StreetViewSafariApp();
    safariApp.initialize();
}


