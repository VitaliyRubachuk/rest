package org.course.exception;

public class UnauthorizedReviewUpdateException extends RuntimeException {
    public UnauthorizedReviewUpdateException(String message) {
        super(message);
    }
}
