module streetViewSafari.ui {
    export class SafariViewModel {

        userName = ko.observable("");
        score: KnockoutObservable<number>;
        comments: KnockoutObservableArray<CommentViewModel>;
        link: KnockoutObservable<string>;
        commentText: KnockoutObservable<string>;
        upVote: KnockoutObservable<boolean>;
        downVote = ko.observable(false);
        userOwned = ko.observable(false);

        private _vote: objects.Vote;
        private _safariDataModel: objects.Safari;
        private _app: app.StreetViewSafariApp;

        constructor(app: app.StreetViewSafariApp) {

            this._app = app;

            this.link = ko.observable("");
            this.score = ko.observable(0);
            this.comments = ko.observableArray([]);
            this.upVote = ko.observable(false);
            this.commentText = ko.observable("");
        }

        getSafari(): objects.Safari {
            return this._safariDataModel;
        }

        setSafari(safari: objects.Safari) {
            this._safariDataModel = safari;
            this.userOwned(false);

            if (safari.initialized) {
                this.userName(this._safariDataModel.userName);
                this.link("http://streetviewsafari.com?s=" + this._safariDataModel.id);
                this.score(this._safariDataModel.score);
                this.populateCommentViewModels();

                if (safari.userId === utility.userUtility.getIdOfCurrentUser()) {
                    this.userOwned(true);
                }

                // get any vote info
                var getVote = new objects.Vote(null);
                getVote.safariId = this._safariDataModel.id;

                getVote.getExistingVote()
                    .then((existingVote) => {
                        if (existingVote) {

                            this.setVoteInterface(new objects.Vote(existingVote));
                        } else {
                            var newVote = new objects.Vote(null);
                            newVote.safariId = this._safariDataModel.id;
                            this.setVoteInterface(newVote);
                        }
                    })
                    .caught(error => diagnostics.Logging.logError(error));;
            }
        }

        private populateCommentViewModels(): void {

            this._safariDataModel.getComments()
                .then(comments => {
                    var viewModels = [];
                    for (var i = 0; i < comments.length; i++) {
                        var viewModel = new CommentViewModel(comments[i]);
                        viewModels.push(viewModel);
                    }

                    this.comments(viewModels);
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        refresh(): void {
            utility.safariUtility.getSafariById(this._safariDataModel.id)
                .then(result => {
                    var safariObject = new objects.Safari(result);
                    this.setSafari(safariObject);
                })
                .caught(error => diagnostics.Logging.logError(error));

            this.populateCommentViewModels();
        }

        setVoteInterface(vote: objects.Vote): void {
            this._vote = vote;
            if (this._vote.vote == objects.VoteType.UP) {
                this.setUpVote(true);
                this.setDownVote(false);
            } else if (this._vote.vote == objects.VoteType.DOWN) {
                this.setUpVote(false);
                this.setDownVote(true);
            } else {
                this.setUpVote(false);
                this.setDownVote(false);
            }
        }

        private setUpVote(show: boolean): void {
            this.upVote(show);
        }

        private setDownVote(show: boolean): void {
            this.downVote(show);
        }

        private saveVote(voteType: streetViewSafari.objects.VoteType): void {

            if (!utility.userUtility.isUserAuthenticated()) {
                this._app.flashStatusText("Must be logged in to vote on Safaris.");
                return;
            }

            this._vote.vote = voteType;
            this._vote.saveVote()
                .then(returnObj => {
                    var voteValue = returnObj.value;
                    var vote = returnObj.vote;
                    if (vote && voteValue) {
                        this.setVoteInterface(new objects.Vote(vote));
                        this.updateUserScore(voteValue);
                        this.updateSafariScore(voteValue);
                    }
                })
                .caught(error => diagnostics.Logging.logError(error));
        }

        private updateUserScore(voteValue: number): void {
            var parseUser = (<Parse.User>utility.pointerUtility.createObjectPointer(this._safariDataModel.userId, objects.ClassType.User));

            var user = new objects.User(parseUser);
            user.registerScore(voteValue);
        }

        private updateSafariScore(voteValue: number): void {
            this._safariDataModel.registerVote(voteValue)
                .then(updatedSafari => this.refresh())
                .caught(error => diagnostics.Logging.logError(error));
        }

        handleUpVote(): void {
            this.saveVote(objects.VoteType.UP);
        }

        handleDownVote(): void {
            this.saveVote(objects.VoteType.DOWN);
        }

        handleDelete(): void {
            var confirm = window.confirm("Really delete the Safari?");

            if (confirm === true) {
                this._safariDataModel.remove()
                    .then(result => {
                        this._app.appViewModel.refreshMap();
                        this._app.appViewModel.setSafari(null);
                    })
                    .caught(error => diagnostics.Logging.logError(error));
            }
        }

        saveComment(): void {

            var text = this.commentText();
            if (!utility.userUtility.isUserAuthenticated()) {
                this._app.flashStatusText("Must be logged in to comment on Safaris.");
                return;
            }

            if (!text) {
                return;
            }

            this._app.flashStatusText("Saving Comment...");

            var comment = new objects.UserComment();

            comment.comment = text;
            comment.safariId = this._safariDataModel.id;

            comment.saveWithUserACL()
                .then(comment => {
                    this.commentText("");
                    this.refresh();
                })
                .caught(error => diagnostics.Logging.logError(error));
        }
    }
}
