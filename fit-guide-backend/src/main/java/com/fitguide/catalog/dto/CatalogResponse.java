package com.fitguide.catalog.dto;

import java.util.List;

public record CatalogResponse(
        long version,
        String disclaimer,
        List<ExerciseResponse> exercises
) {
}
