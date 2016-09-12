module streetViewSafari.objects {
    export class User {

        private _parseUser: Parse.User;

        constructor(user?: Parse.User) {
            if (user) {
                this._parseUser = user
            } else {
                this._parseUser = utility.userUtility.getUserFromSession();
            }
        }

        getUserName(): string {
            var userName = "";

            if (this._parseUser) {
                userName = this._parseUser.getUsername();
            }

            return userName;
        }

        getUserId(): string {
            var id = "";

            if (this._parseUser) {
                id = this._parseUser.id;
            }

            return id;
        }

        getParseUser(): Parse.User {
            return this._parseUser;
        }

        createAndGetUserScore(): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                var parseObject = new ParseClass(ClassType.UserVote);
                var query = parseObject.getQuery();
                query.addEqualTo("user", utility.pointerUtility.createPointerForCurrentUser());
                query.addSelect("score");
                query.first()
                    .then((userScore) => {
                        if (userScore) {
                            // return score
                                resolve(userScore);
                        } else {
                            // create score
                                this.createUserScore()
                                    .then(newscore => resolve(newscore))
                                    .caught(e => reject(e));
                            }
                    })
                    .caught(error => reject(error));
            });
        }

        private createUserScore(): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                var userScore = new UserScore(this._parseUser.id, 0);
                userScore.save()
                    .then(result => resolve(result))
                    .caught(error => reject(error));
            });
        }

        registerScore(voteValue: number): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                var userScore = new UserScore(this.getUserId(), null);
                userScore.incrementScore(voteValue)
                    .then(result => resolve(result))
                    .caught(error => reject(error));
            });
        }
    }
} 