package com.fitguide.catalog.exception;

import org.springframework.http.HttpStatus;

public final class CatalogApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private CatalogApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static CatalogApiException invalidExerciseId() {
        return new CatalogApiException(HttpStatus.BAD_REQUEST, "INVALID_EXERCISE_ID", "动作 ID 格式不合法");
    }

    public static CatalogApiException exerciseNotFound() {
        return new CatalogApiException(HttpStatus.NOT_FOUND, "EXERCISE_NOT_FOUND", "动作不存在或已下架");
    }

    public static CatalogApiException invalidCatalogFilter() {
        return new CatalogApiException(HttpStatus.BAD_REQUEST, "INVALID_CATALOG_FILTER", "部位或器械参数格式不合法");
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
