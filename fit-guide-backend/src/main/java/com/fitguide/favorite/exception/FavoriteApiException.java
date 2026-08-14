package com.fitguide.favorite.exception;

import org.springframework.http.HttpStatus;

public final class FavoriteApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private FavoriteApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static FavoriteApiException unauthorized() {
        return new FavoriteApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "用户身份无效");
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
