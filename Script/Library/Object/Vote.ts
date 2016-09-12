module streetViewSafari.objects {
    export class Vote extends base.SaveBase {

        safariId: string;
        vote: VoteType;

        constructor(parseObject?: Parse.Object) {
            super();

            if (parseObject) {
                this.loadFromParse(parseObject);
            } else {
                this.vote = VoteType.NOTVOTED;
            }
        }

        getSaveState(): any {
            return {
                "vote": this.getVoteValue(),
                "user": utility.pointerUtility.createPointerForCurrentUser(),
                "safariMarker": utility.pointerUtility.createObjectPointer(this.safariId, ClassType.SafariMarker)
            };
        }

        getVoteValue(): number {
            var value: number;

            if (this.vote == VoteType.UP) {
                value = 1;
            } else if (this.vote == VoteType.DOWN) {
                value = -1;
            } else {
                value = 0;
            }

            return value;
        }

        getClassType(): ClassType {
            return ClassType.SafariVotes;
        }

        getExistingVote(): Promise<Parse.Object> {
            var query = this.getQuery();
            var userPointer = utility.pointerUtility.createPointerForCurrentUser();
            var safariPointer = utility.pointerUtility.createObjectPointer(this.safariId, ClassType.SafariMarker);
            query.addEqualTo("user", userPointer);
            query.addEqualTo("safariMarker", safariPointer);

            return query.first();
        }

        saveVote(): Promise<any> {
            return new Promise<any>((resolve, reject) => {
                this.getExistingVote().then(
                    (existingVote: Parse.Object) => {
                        if (existingVote) {
                            // the user has already voted on this
                            // compare previous vote results to new vote
                            if (existingVote.get("vote") != this.getVoteValue()) {

                                existingVote.set("vote", this.getVoteValue());
                                existingVote.save()
                                    .then(result => {
                                        var returnObj = {
                                            vote: result,
                                            value: this.getVoteValue()
                                        };
                                        resolve(returnObj);
                                    },
                                    (error) => reject(error));
                            }
                        } else {
                            // a new vote can be saved
                            this.saveWithUserACL()
                                .then((newVote) => {
                                    //once saved update safari and user score
                                    var returnObj = {
                                        vote: newVote,
                                        value: this.getVoteValue()
                                    };

                                    resolve(returnObj);
                                },
                                (error) => reject(error));
                        }
                    });
            });
        }

        loadFromParse(parseObject: Parse.Object): void {
            this.vote = this.voteValueToVoteType(parseObject.get("vote"));
            var safariPointer: Parse.Object = parseObject.get("safariMarker");
            if (safariPointer) {
                this.safariId = safariPointer.id;
            }
        }

        private voteValueToVoteType(value: number): VoteType {
            if (value == 1) {
                return VoteType.UP;
            } else if (value == -1) {
                return VoteType.DOWN;
            } else {
                return VoteType.NOTVOTED;
            }
        }
    }
}