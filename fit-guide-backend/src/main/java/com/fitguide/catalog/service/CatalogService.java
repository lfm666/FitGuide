package com.fitguide.catalog.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fitguide.catalog.dto.CatalogResponse;
import com.fitguide.catalog.dto.ExerciseDetailResponse;
import com.fitguide.catalog.dto.ExerciseResponse;
import com.fitguide.catalog.entity.CatalogEntity;
import com.fitguide.catalog.entity.ExerciseEntity;
import com.fitguide.catalog.exception.CatalogApiException;
import com.fitguide.catalog.mapper.CatalogMapper;
import com.fitguide.catalog.mapper.ExerciseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private static final Pattern EXERCISE_ID = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");

    private final CatalogMapper catalogMapper;
    private final ExerciseMapper exerciseMapper;

    public CatalogResponse getCatalog(String category, String equipment) {
        category = normalizeFilter(category, 32);
        equipment = normalizeFilter(equipment, 100);
        var catalog = getCatalogMetadata();
        var exercises = exerciseMapper.selectList(
                        Wrappers.<ExerciseEntity>lambdaQuery()
                                .eq(ExerciseEntity::getEnabled, true)
                                .eq(category != null, ExerciseEntity::getCategory, category)
                                .eq(equipment != null, ExerciseEntity::getEquipment, equipment)
                                .orderByAsc(ExerciseEntity::getSortOrder))
                .stream()
                .map(CatalogService::toResponse)
                .toList();
        return new CatalogResponse(catalog.getVersion(), catalog.getDisclaimer(), exercises);
    }

    public List<String> getCategories() {
        return exerciseMapper.selectCategories();
    }

    public List<String> getEquipments() {
        return exerciseMapper.selectEquipments();
    }

    public ExerciseDetailResponse getExercise(String id) {
        validateExerciseId(id);
        var exercise = exerciseMapper.selectById(id);
        if (exercise == null || !Boolean.TRUE.equals(exercise.getEnabled())) {
            throw CatalogApiException.exerciseNotFound();
        }
        var catalog = getCatalogMetadata();
        return new ExerciseDetailResponse(
                catalog.getVersion(), catalog.getDisclaimer(), toResponse(exercise));
    }

    private CatalogEntity getCatalogMetadata() {
        var catalog = catalogMapper.selectById((short) 1);
        if (catalog == null) {
            throw new IllegalStateException("目录元数据未初始化");
        }
        return catalog;
    }

    private static void validateExerciseId(String id) {
        if (id == null || id.length() > 64 || !EXERCISE_ID.matcher(id).matches()) {
            throw CatalogApiException.invalidExerciseId();
        }
    }

    private static String normalizeFilter(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        var normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw CatalogApiException.invalidCatalogFilter();
        }
        return normalized;
    }

    private static ExerciseResponse toResponse(ExerciseEntity exercise) {
        return new ExerciseResponse(
                exercise.getId(),
                exercise.getName(),
                exercise.getCategory(),
                exercise.getEquipment(),
                exercise.getLevel(),
                exercise.getPrimaryMuscles(),
                exercise.getSecondaryMuscles(),
                exercise.getImageUrl(),
                exercise.getGifUrl(),
                exercise.getSteps(),
                exercise.getCautions());
    }
}
