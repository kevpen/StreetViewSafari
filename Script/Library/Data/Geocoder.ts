module streetViewSafari.data {

    /** Class which wraps the google.maps.Geocoder. */
    export class Geocoder {

        /** The intialized geocoder. */
        private _geocoder: google.maps.Geocoder;

        /** Constructs a new instance of the Geocoder. */
        constructor() {
            this._geocoder = new google.maps.Geocoder();
        }

        /** 
         * Geocodes an search value.
         * Returns a Promise which will be resolved with the Geocode operation is complete.
         */
        public geocode(searchTerm: string): Promise<google.maps.LatLng> {
            ga('send', 'event', 'geocode', 'perform');
            return new Promise<google.maps.LatLng>((resolve, reject) => {
                var geocoderRequest: google.maps.GeocoderRequest = {
                    address: searchTerm
                };

                this._geocoder.geocode(geocoderRequest, (results, status) => {
                    if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                        resolve(results[0].geometry.location);
                    } else {
                        reject(new Error("No results found"));
                    }
                });
            });
        }
    }
}