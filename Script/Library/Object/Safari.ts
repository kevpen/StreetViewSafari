module streetViewSafari.objects {
    export class Safari extends base.SaveBase {

        initialized: boolean = false;
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

        private _parseObject: Parse.Object;
        private _votePointer: Parse.Object;

        constructor(parseObject?: Parse.Object) {
            super();

            if (!parseObject) {
                // get index
                // initialize score
                this.score = 0;
                this._parseObject = null;
            } else {
                this.loadFromParse(parseObject);
                this._parseObject = parseObject;
                this.initialized = true;
            }
        }

        loadPovPosition(position: google.maps.LatLng, pov: google.maps.StreetViewPov): void {
            if (position && pov) {
                this.lat = position.lat();
                this.lng = position.lng();
                this.heading = pov.heading;
                this.zoomLevel = pov.zoom;
                this.pitch = pov.pitch;
            }
        }

        loadFromParse(parseSafari: Parse.Object): void {
            this.lat = parseSafari.get("lat");
            this.lng = parseSafari.get("lng");
            this.heading = parseSafari.get("heading");
            this.pitch = parseSafari.get("pitch");
            this.zoomLevel = parseSafari.get("zoomLevel");
            this.userId = parseSafari.get("userId");
            this.score = parseSafari.get("score");
            this.id = parseSafari.id;
            this.panoId = parseSafari.get("panoId");
            this.imageDate = parseSafari.get("imageDate");

            var userPointer: Parse.User = parseSafari.get("user");
            if (userPointer) {
                this.userName = userPointer.get("username");
                this.userId = userPointer.id;
            }

            var votePointer: Parse.Object = parseSafari.get("score");
            if (votePointer) {
                this._votePointer = votePointer;
                this.score = votePointer.get("totalScore");
            } else {

                if (this.userId === utility.userUtility.getIdOfCurrentUser()) {
                    this.score = 0;
                    utility.safariUtility.createTotalScoreObject(this.id)
                        .then(totalVotes => {
                            this._votePointer = totalVotes;
                            return utility.safariUtility.linkTotalScoreOnSafari(this._parseObject, totalVotes.id);
                        })
                        .then((savedSafariWithVote) => {
                            // save success
                        })
                        .caught(error => diagnostics.Logging.logError(error));
                }
            }
        }

        getStreetViewPov(): google.maps.StreetViewPov {
            var pov: google.maps.StreetViewPov = {};

            pov.heading = this.heading;
            pov.pitch = this.pitch;
            pov.zoom = this.zoomLevel;

            return pov;
        }

        getLatLng(): google.maps.LatLng {
            return new google.maps.LatLng(this.lat, this.lng);
        }

        getSaveState(): any {
            return {
                "lat": this.lat,
                "lng": this.lng,
                "heading": this.heading,
                "pitch": this.pitch,
                "zoomLevel": this.zoomLevel,
                "user": utility.pointerUtility.createPointerForCurrentUser(),
                "geoPoint": new Parse.GeoPoint(this.lat, this.lng),
                "panoId": this.panoId,
                "imageDate": this.imageDate
            };
        }

        getClassType(): ClassType {
            return ClassType.SafariMarker;
        }

        getComments(): Promise<UserComment[]> {
            return new Promise<UserComment[]>((resolve, reject) => {
                var commentClass = new objects.ParseClass(ClassType.SafariComment);

                var query = commentClass.getQuery();

                query.addEqualTo("safariMarker", utility.pointerUtility.createObjectPointer(this.id, ClassType.SafariMarker));
                query.sort("createdAt", data.SortOrder.ASCENDING);
                query.include("user");
                query.limit(5);

                query.execute()
                    .then(results => {
                        var items: Array<UserComment> = [];
                        if (results) {
                            for (var i = 0; i < results.length; i++) {
                                var comment = new UserComment(results[i]);
                                items.push(comment);
                            }
                        }

                        resolve(items);
                    })
                    .caught(error => reject(error));
            });
        }

        registerVote(voteValue: number): Promise<any> {
            return new Promise<any>((resolve, reject) => {
                this._votePointer.increment("totalScore", voteValue);
                this._votePointer.save()
                    .then(result => resolve(result));
            });
        }

        remove(): Promise<any> {
            return new Promise<any>((resolve, reject) => {
                this._parseObject.destroy()
                    .then(value => resolve(value));
            });
        }
    }
}