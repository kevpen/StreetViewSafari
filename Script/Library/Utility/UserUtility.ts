module streetViewSafari.utility.userUtility {

    export function getUserFromSession(): Parse.User {
        return Parse.User.current();
    }

    export function getUserNameOfCurrentUser(): string {
        var user = getUserFromSession();
        var userName = "";
        if (user) {
            userName = user.get("username");
        }

        return userName;
    }

    export function getIdOfCurrentUser(): string {

        var user = getUserFromSession();
        var id = "";
        if (user) {
            id = user.id;
        }

        return id;
    }

    export function signUp(userName: string, email: string, password: string): Promise<Parse.User> {
        return new Promise<Parse.User>((resolve, reject) => {
            var user = new Parse.User();
            userName = userName.toLowerCase();
            user.set("username", userName);
            user.set("password", password);
            user.set("email", email);

            user.signUp(null)
                .then((user: Parse.User) => resolve(user),
                error => reject(error));
        });
    }

    export function login(userName: string, password: string): Promise<Parse.User> {
        return new Promise<Parse.User>((resolve, reject) => {
            userName = userName.toLowerCase();
            Parse.User.logIn(userName, password)
                .then((user: Parse.User) => resolve(user),
                error => reject(error));
        });
    }

    export function logout() {
        Parse.User.logOut();
    }

    export function isUserAuthenticated(): boolean {
        var user = Parse.User.current();
        if (user && user.authenticated()) {
            return true;
        } else {
            return false;
        }
    }

    export function requestPasswordReset(email: string): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            Parse.User.requestPasswordReset(email)
                .then(result => resolve(result),
                error => reject(error));
        });
    }

    export function resetPassword(newPassword: string): Promise<Parse.User> {
        return new Promise<Parse.User>((resolve, reject) => {
            var user = getUserFromSession();
            user.set("password", newPassword);
            user.save(null)
                .then(user => resolve(<Parse.User>user),
                error => reject(error));
        });
    }

    export function userNameExist(userName: string): Promise<boolean> {
        var user = new objects.ParseClass(objects.ClassType.User);
        userName = userName.toLowerCase();

        user.getQuery().addEqualTo("username", userName);
        return new Promise<boolean>((resolve, reject) => {
            user.getQuery().executeForCount().then(
                (results) => {
                    var exists = false;
                    if (results > 0) {
                        exists = true;
                    }
                    resolve(exists);
                },
                error => reject(error));
        });
    }

    export function setUsernameAndPassword(userName: string, password: string): Promise<Parse.User> {
        return new Promise<Parse.User>((resolve, reject) => {
            var user = getUserFromSession();
            userName = userName.toLowerCase();
            user.set("username", userName);
            user.set("password", password);
            user.save()
                .then((user: Parse.User) => resolve(user),
                error => reject(error));
        });
    }

    export function isFacebookLinked(user: Parse.User): boolean {
        return Parse.FacebookUtils.isLinked(user);
    }

    export function linkFacebook(user: Parse.User): Promise<Parse.User> {
        return new Promise<Parse.User>((resolve, reject) => {
            Parse.FacebookUtils.link(user,
                null,
                {
                    success: resolve,
                    error: reject
                });
        });
    }

    export function unlinkFacebook(user: Parse.User): Promise<Parse.User> {
        return new Promise<Parse.User>((resolve, reject) => {
            Parse.FacebookUtils.unlink(user,
                {
                    success: resolve,
                    error: reject
                });
        });
    }

    export function facebookLogin(): Promise<FacebookLoginResult> {
        return new Promise<FacebookLoginResult>((resolve, reject) => {
            Parse.FacebookUtils.logIn(null, {
                success: (user: Parse.User) => {
                    var result: FacebookLoginResult = <any>{};
                    result.user = user;
                    if (!user.existed()) {
                        // get a friendly username for the user
                        result.existed = false;
                    } else {
                        // facebook user has already signed up and will now login
                        result.existed = true;
                    }

                    resolve(result);
                },
                error: (user, error) => reject(error)
            });
        });
    }
} 