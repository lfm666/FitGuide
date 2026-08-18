package com.fitguide.plan.exception;

import org.springframework.http.HttpStatus;

public final class TrainingPlanApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private TrainingPlanApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static TrainingPlanApiException invalidRequest() {
        return new TrainingPlanApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "请求体格式不合法");
    }

    public static TrainingPlanApiException invalidPlanId() {
        return new TrainingPlanApiException(HttpStatus.BAD_REQUEST, "INVALID_PLAN_ID", "计划 ID 格式不合法");
    }

    public static TrainingPlanApiException invalidPlan(String message) {
        return new TrainingPlanApiException(HttpStatus.BAD_REQUEST, "INVALID_TRAINING_PLAN", message);
    }

    public static TrainingPlanApiException notFound() {
        return new TrainingPlanApiException(HttpStatus.NOT_FOUND, "TRAINING_PLAN_NOT_FOUND", "训练计划不存在或已删除");
    }

    public static TrainingPlanApiException limitReached() {
        return new TrainingPlanApiException(HttpStatus.CONFLICT, "TRAINING_PLAN_LIMIT_REACHED", "最多只能创建 50 个训练计划");
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
