module streetViewSafari.data {

    /** Class whch wraps a Parse query any exposes useful methods. */
    export class Query {

        /** The initialized Parse.Query. */
        private _query: Parse.Query;

        /** Constructs a new instance of the Query class by passing in a Parse object. */
        constructor(parseObject: Parse.Object) {
            this._query = new Parse.Query(parseObject);
        }

        /** Adds a 'key = value' constraint to the query. */
        public addEqualTo(key: string, value: any): void {
            this._query.equalTo(key, value);
        }

        /** Adds a select field to the query. */
        public addSelect(key: string): void {
            this._query.select(key);
        }

        /** Adds an 'ObjectId = id' constraint. */
        public addGetById(id: string): void {
            this._query.get(id);
        }

        /** 
         * Executes the Query.
         * Returns a Promise which will contain an array of found objects when resolved.
         */
        public execute(): Promise<Parse.Object[]> {
            return new Promise<Parse.Object[]>((resolve, reject) => {
                this._query.find()
                    .then((result: Parse.Object[]) => resolve(result),
                    error => reject(error));
            });
        }

        /** 
         * Executes the Query for count.
         * Returns a Promise which will contain the number of matching objects when resolved.
         */
        public executeForCount(): Promise<number> {
            return new Promise<number>((resolve, reject) => {
                this._query.count()
                    .then((result: number) => resolve(result),
                    error => reject(error));
            });
        }

        /** 
         * Executes the Query for the first found item.
         * Returns a Promise which will contain the first found object when resolved.
         */
        public first(): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                this._query.first()
                    .then((result: Parse.Object) => resolve(result),
                    error => reject(error));
            });
        }

        /** Includes a field in the results. */
        public include(key: string): void {
            this._query.include(key);
        }

        /** Adds a sort field and sort order to a Query. */
        public sort(key: string, sortOrder: SortOrder): void {
            if (sortOrder === SortOrder.ASCENDING) {
                this._query.ascending(key);
            } else {
                this._query.descending(key);
            }
        }

        /** Limits the maximum number of results. */
        public limit(num: number): void {
            this._query.limit(num);
        }

        /** Adds a spatial filter to the Query. */
        public withinGeoBox(key: string, southWest: Parse.GeoPoint, northEast: Parse.GeoPoint): void {
            this._query.withinGeoBox(key, southWest, northEast);
        }

        /** Limits results to be within a specified Kilometer range from a given point. */
        public withinKilometers(key: string, geoPoint: Parse.GeoPoint, kms: number): void {
            this._query.withinKilometers(key, geoPoint, kms);
        }
    }

    /** Sort order used in Queries. */
    export enum SortOrder {
        ASCENDING,
        DESCENDING
    }
}
