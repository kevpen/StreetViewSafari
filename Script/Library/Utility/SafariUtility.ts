module streetViewSafari.utility.safariUtility {

    export function getRandomInt(max: number): number {
        return Math.floor(Math.random() * max) + 1;
    }

    export function getQueryParams(qs): any {
        var qs = qs.split("+").join(" ");

        var params = {}, tokens,
            re = /[?&]?([^=]+)=([^&]*)/g;

        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
        }

        return params;
    }

    export function geoPointToGoogleLatLng(geoPoint: Parse.GeoPoint): google.maps.LatLng {
        var lat: number = geoPoint.latitude;
        var lng: number = geoPoint.longitude;

        return new google.maps.LatLng(lat, lng);
    }

    export function googleLatLngToGeoPoint(latLng: google.maps.LatLng): Parse.GeoPoint {
        return new Parse.GeoPoint(latLng.lat(), latLng.lng());
    }

    export function findSafariWithinKilometers(geoPoint: Parse.GeoPoint, distance: number): Promise<Parse.Object> {
        return new Promise<Parse.Object>((resolve, reject) => {
            var parseClass = new objects.ParseClass(objects.ClassType.SafariMarker);
            var query = parseClass.getQuery();
            query.include("user");
            query.include("score");
            query.withinKilometers("geoPoint", geoPoint, distance);
            query.first()
                .then(result => {
                    resolve(result);
                })
                .caught(error => reject(error));
        });
    }

    export function getSafariById(id: string): Promise<Parse.Object> {

        return new Promise<Parse.Object>((resolve, reject) => {
            var parseClass = new objects.ParseClass(objects.ClassType.SafariMarker);
            var query = parseClass.getQuery();
            query.addEqualTo("objectId", id);
            query.include("user");
            query.include("score");
            query.first()
                .then(result => {
                    resolve(result);
                })
                .caught(error => {
                    reject(error);
            });
        });
    }

    export function createTotalScoreObject(safariId: string): Promise<Parse.Object> {

        var totalScore = new objects.SafariScore();
        totalScore.safariId = safariId;

        return totalScore.save();
    }

    export function linkTotalScoreOnSafari(safari: Parse.Object, totalScoreId: string): Promise<Parse.Object> {

        return new Promise<Parse.Object>((resolve, reject) => {
            safari.set("score", pointerUtility.createObjectPointer(totalScoreId, objects.ClassType.SafariVoteTotal));
            safari.save()
                .then((result: Parse.Object) => {
                    resolve(result);
                },
                error => reject(error));
        });
    }

    export function getSafariIds(): Promise<Parse.Object[]> {
        return new Promise<Parse.Object[]>((resolve, reject) => {
            var parseClass = new objects.ParseClass(objects.ClassType.SafariMarker);
            var query = parseClass.getQuery();
            query.include("score");
            query.include("user");
            query.execute()
                .then(result => {
                    resolve(result);
                })
                .caught(error => reject(error));
        });
    }
} 