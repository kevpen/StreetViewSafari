module streetViewSafari.utility.pointerUtility {

    export function createPointerForCurrentUser(): Parse.User {
        return userUtility.getUserFromSession();
    }

    export function createObjectPointer(id: string, classType: objects.ClassType): Parse.Object {
        var parseClass = new objects.ParseClass(classType);

        var saveClass = parseClass.saveClass;
        saveClass.id = id;

        return saveClass;    
    }
} 