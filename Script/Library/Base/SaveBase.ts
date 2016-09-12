module streetViewSafari.base {

    /** Base class which can be extended when interfacing with Parse objects. */
    export class SaveBase {

        constructor() {
        }

        /** Override this to return the object's attribute values. */
        getSaveState(): any { }

        /** Returns the type of the object. */
        getClassType(): objects.ClassType {
            return null;
        }

        /** 
         * Saves the object to Parse with public read and private write access. 
         * Returns a Promise which will be resolved with the underlying Parse object when the save is successful.
         */
        saveWithUserACL(): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                var parseClass = this.getParseClass();
                var acl = new Parse.ACL(utility.userUtility.getUserFromSession());
                acl.setPublicReadAccess(true);
                parseClass.saveClass.setACL(acl);

                parseClass.saveClass.save(this.getSaveState())
                    .then((result: Parse.Object) => resolve(result),
                    error => reject(error));
            });
        }

        /** 
         * Saves the object to Parse with public read and public write access. 
         * Returns a Promise which will be resolved with the underlying Parse object when the save is successful.
         */
        save(): Promise<Parse.Object> {
            return new Promise<Parse.Object>((resolve, reject) => {
                var parseClass = this.getParseClass();
                var acl = new Parse.ACL();
                acl.setPublicReadAccess(true);

                parseClass.saveClass.save(this.getSaveState())
                    .then((result: Parse.Object) => resolve(result),
                    error => reject(error));
            });
        }

        /** Returns the Query which can be used to fetch the object from Parse. */
        getQuery(): data.Query {
            return new objects.ParseClass(this.getClassType()).getQuery();
        }

        /** Returns the a new Parse class defintion which can be used to create a new Parse object. */
        getParseClass(): objects.ParseClass {
            return new objects.ParseClass(this.getClassType());
        }
    }
} 