module streetViewSafari.objects {

    export class ParseClass {

        private parseObject: Parse.Object;
        private queryHelper: data.Query;
        public saveClass: Parse.Object;

        constructor(classType: ClassType) {
            this.parseObject = this.createNewObject(classType);
            this._createSaveClass();
            this._createQueryClass();
        }

        createNewObject(classType: ClassType): Parse.Object {
            var parseClass: string;

            switch (classType) {
                case ClassType.SafariMarker:
                    parseClass = ClassNames.MARKER;
                    break;
                case ClassType.SafariComment:
                    parseClass = ClassNames.COMMENT;
                    break;
                case ClassType.SafariVotes:
                    parseClass = ClassNames.VOTE;
                    break;
                case ClassType.SafariVoteTotal:
                    parseClass = ClassNames.VOTE_TOTAL;
                    break;
                case ClassType.UserVote:
                    parseClass = ClassNames.USER_VOTE_TOTAL;
                    break;
                case ClassType.User:
                    parseClass = ClassNames.USER;
                    break;
                default:
                    throw new Error("Cannot determine class type.")
                    break;
            }

            return Parse.Object.extend(parseClass);
        }

        private _createSaveClass(): void {
            this.saveClass = new (<any>this).parseObject();
        }

        private _createQueryClass(): void {
            this.queryHelper = new data.Query(this.parseObject);
        }

        setRelation(key: string, parseObject: any): void {
            this.saveClass.set(key, parseObject);
        }

        getParseClass(): Parse.Object {
            return this.parseObject;
        }

        getQuery(): data.Query {
            return this.queryHelper;
        }
    }
}
