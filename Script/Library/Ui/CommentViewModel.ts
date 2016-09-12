module streetViewSafari.ui {

    export class CommentViewModel {

        commentText: string;
        userName: string;
        date: string;

        private comment: objects.UserComment;

        constructor(comment: objects.UserComment) {
            this.comment = comment;

            this.commentText = comment.comment;
            this.userName = comment.userName;
            this.date = comment.date;
        }
    }
} 