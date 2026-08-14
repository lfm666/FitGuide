package com.fitguide.catalog.dto;

public record ExerciseDetailResponse(
        long version,
        String disclaimer,
        ExerciseResponse exercise
) {
}
