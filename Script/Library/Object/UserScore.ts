module streetViewSafari.objects {
    export class UserScore extends base.SaveBase {

        score: number;
        userId: string;

        constructor(userId: string, score?: number) {
            super();
            this.userId = userId;

            if (score) {
                this.score = score;
            } else {
                this.score = 0;
            }
        }

        getSaveState(): any {
            return {
                "user": utility.pointerUtility.createObjectPointer(this.userId, ClassType.User),
                "score": this.score
            };
        }

        getClassType(): ClassType {
            return streetViewSafari.objects.ClassType.UserVote;
        }

        incrementScore(value: number): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                this.getParseObject()
                    .then(result => {
                        if (result) {
                            result.increment("score", value);
                            return result.save();
                        }
                    })
                    .then(updatedScore => resolve(<any>updatedScore))
                    .caught(error => diagnostics.Logging.logError(error));
            });
        }

        private getParseObject(): Promise<Parse.Object> {
            var query = this.getQuery();

            query.addEqualTo("user", utility.pointerUtility.createObjectPointer(this.userId, ClassType.User));

            return query.first();
        }
    }
}