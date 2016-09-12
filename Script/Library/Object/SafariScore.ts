module streetViewSafari.objects {
    export class SafariScore extends base.SaveBase {

        id: string;
        safariId: string;
        totalScore: number;

        constructor(parseObject?: Parse.Object) {
            super();

            if (parseObject) {
                this.loadFromParse(parseObject);
            } else {
                this.totalScore = 0;
            }
        }

        loadFromParse(safariScore: Parse.Object): void {
            this.id = safariScore.id;
            this.totalScore = safariScore.get("totalScore");

            var markerPointer = safariScore.get("safariMarker");
            if (markerPointer) {
                this.safariId = markerPointer.id;
            }
        }

        getSaveState(): any {
            return {
                "totalScore": this.totalScore,
                "safariMarker": utility.pointerUtility.createObjectPointer(this.safariId, ClassType.SafariMarker)
            }
        }

        getClassType(): ClassType {
            return ClassType.SafariVoteTotal;
        }
    }
}