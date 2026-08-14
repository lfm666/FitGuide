package com.fitguide.catalog.dto;

import java.util.List;

public record ExerciseResponse(
        String id,
        String name,
        String category,
        String equipment,
        String level,
        List<String> primaryMuscles,
        List<String> secondaryMuscles,
        String image,
        String gif,
        List<String> steps,
        List<String> cautions
) {
}
