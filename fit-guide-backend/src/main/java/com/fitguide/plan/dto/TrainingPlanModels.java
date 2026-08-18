package com.fitguide.plan.dto;

import java.util.List;

public final class TrainingPlanModels {

    private TrainingPlanModels() {
    }

    public record Exercise(String exerciseId, int setCount) {
    }

    public record SaveRequest(String name, List<Exercise> exercises) {
    }

    public record Response(String id, String name, List<Exercise> exercises) {
    }
}
