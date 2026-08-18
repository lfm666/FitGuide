package com.fitguide.catalog.controller;

import com.fitguide.catalog.dto.Result;
import com.fitguide.catalog.exception.CatalogApiException;
import com.fitguide.favorite.exception.FavoriteApiException;
import com.fitguide.plan.exception.TrainingPlanApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.http.converter.HttpMessageNotReadableException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "com.fitguide")
public class CatalogExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(CatalogExceptionHandler.class);

    @ExceptionHandler(CatalogApiException.class)
    ResponseEntity<Result<Void>> handleCatalogException(CatalogApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(Result.fail(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(FavoriteApiException.class)
    ResponseEntity<Result<Void>> handleFavoriteException(FavoriteApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(Result.fail(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(TrainingPlanApiException.class)
    ResponseEntity<Result<Void>> handleTrainingPlanException(TrainingPlanApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(Result.fail(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Result<Void>> handleUnreadableMessage() {
        return ResponseEntity.badRequest()
                .body(Result.fail("INVALID_REQUEST", "请求体格式不合法"));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<Result<Void>> handleUnsupportedMediaType() {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(Result.fail("INVALID_REQUEST", "仅支持 JSON 请求体"));
    }

    @ExceptionHandler(Throwable.class)
    ResponseEntity<Result<Void>> handleUnexpectedException(Throwable exception) {
        LOGGER.error("Unhandled catalog API error", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Result.fail("INTERNAL_ERROR", "服务内部错误"));
    }
}
