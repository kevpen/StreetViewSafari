module streetViewSafari.data {

    /** Class which wraps the google.maps.StreetViewService .*/
    export class StreetViewService {

        private _service: google.maps.StreetViewService;

        constructor() {
            this._service = new google.maps.StreetViewService();
        }

        public getPanoramaByLocation(poistion: google.maps.LatLng, distance: number): Promise<google.maps.StreetViewPanoramaData> {
            return new Promise<google.maps.StreetViewPanoramaData>((resolve, reject) => {
                this._service.getPanoramaByLocation(poistion, distance, (data, status) => {
                    if (status === google.maps.StreetViewStatus.OK) {
                        resolve(data);
                    } else if (status == google.maps.StreetViewStatus.ZERO_RESULTS) {
                        reject(new Error("No pano found"));
                    }
                });
            });
        }

        public getPanoramaById(panoId: string): Promise<google.maps.StreetViewPanoramaData> {
            return new Promise<google.maps.StreetViewPanoramaData>((resolve, reject) => {
                this._service.getPanoramaById(panoId,(data, status) => {
                    if (status === google.maps.StreetViewStatus.OK) {
                        resolve(data);
                    } else if (status == google.maps.StreetViewStatus.ZERO_RESULTS) {
                        reject(new Error("No pano found"));
                    }
                });
            });
        }
    }
}