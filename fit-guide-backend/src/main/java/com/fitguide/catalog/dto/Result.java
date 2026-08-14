package com.fitguide.catalog.dto;

public record Result<T>(String code, String message, T data) {

    public static <T> Result<T> success(T data) {
        return new Result<>("00000", "操作成功", data);
    }

    public static <T> Result<T> fail(String code, String message) {
        return new Result<>(code, message, null);
    }
}
