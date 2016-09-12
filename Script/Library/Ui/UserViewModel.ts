module streetViewSafari.ui {
    export class UserViewModel {

        private _userDataModel: objects.User;
        app: streetViewSafari.app.StreetViewSafariApp;
        userName: KnockoutObservable<string>;
        score: KnockoutObservable<number>;
        isFacebookUser: KnockoutObservable<boolean>;

        constructor(app: streetViewSafari.app.StreetViewSafariApp) {
            this.app = app;
            this.isFacebookUser = ko.observable(false);
            this.userName = ko.observable("");
            this.score = ko.observable(0);
        }

        setUser(user: objects.User) {
            this._userDataModel = user;
            this.refresh();
        }

        private _getUserScore(): void {
            this._userDataModel.createAndGetUserScore()
                .then(score => this.score(score.get("score")))
                .caught(error => diagnostics.Logging.logError(error));
        }

        refresh(): void {
            this._getUserScore();
            this.userName(this._userDataModel.getUserName());
            this.isFacebookUser(utility.userUtility.isFacebookLinked(this._userDataModel.getParseUser()));
        }
    }
}