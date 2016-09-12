module streetViewSafari.diagnostics {

    /** Static class which contains methods for logging. */
    export class Logging {

        /** Logs a given error. */
        static logError(error: Error) {
            Logging.logMessage(error && error.message ? error.message : "Undetermined error", "ERROR");
        }

        /** Logs a given message. */
        static logMessage(message: string, level = "DEBUG") {
            var dateStamp = new Date();
            console.log(dateStamp.toString(), "[", level,"]: ", message);
        }
    }
}