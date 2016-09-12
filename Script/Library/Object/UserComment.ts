module streetViewSafari.objects {
    export class UserComment extends base.SaveBase {

        comment: string;
        safariId: string;
        userName: string;
        date: string;

        constructor(parseObject?: Parse.Object) {
            super();

            if (parseObject) {
                this.loadFromParse(parseObject);
            }
        }

        loadFromParse(parseComment: Parse.Object): void {
            this.comment = parseComment.get("comment");
            this.date = (<any>parseComment).createdAt;

            var markerPointer = parseComment.get("safariMarker");
            if (markerPointer) {
                this.safariId = markerPointer.id;
            }

            var userPointer = parseComment.get("user");
            if (userPointer) {
                this.userName = userPointer.get("username");
            }
        }

        getSaveState(): any {
            return {
                "comment": this.comment,
                "user": utility.pointerUtility.createPointerForCurrentUser(),
                "safariMarker": utility.pointerUtility.createObjectPointer(this.safariId, ClassType.SafariMarker)
            };
        }

        getClassType(): ClassType {
            return ClassType.SafariComment;
        }
    }
}