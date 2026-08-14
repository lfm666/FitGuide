package com.fitguide.catalog.controller;

import com.fitguide.catalog.dto.Result;
import com.fitguide.catalog.exception.CatalogApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackageClasses = CatalogController.class)
public class CatalogExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(CatalogExceptionHandler.class);

    @ExceptionHandler(CatalogApiException.class)
    ResponseEntity<Result<Void>> handleCatalogException(CatalogApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(Result.fail(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(Throwable.class)
    ResponseEntity<Result<Void>> handleUnexpectedException(Throwable exception) {
        LOGGER.error("Unhandled catalog API error", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Result.fail("INTERNAL_ERROR", "服务内部错误"));
    }
}
