package com.fitguide.catalog.controller;

import com.fitguide.catalog.dto.CatalogResponse;
import com.fitguide.catalog.dto.ExerciseDetailResponse;
import com.fitguide.catalog.dto.Result;
import com.fitguide.catalog.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "动作目录")
@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @Operation(summary = "获取动作目录，可按部位和器械筛选")
    @GetMapping("/catalog")
    public Result<CatalogResponse> getCatalog(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "equipment", required = false) String equipment) {
        return Result.success(catalogService.getCatalog(category, equipment));
    }

    @Operation(summary = "获取可用动作部位")
    @GetMapping("/catalog/categories")
    public Result<List<String>> getCategories() {
        return Result.success(catalogService.getCategories());
    }

    @Operation(summary = "获取可用器械")
    @GetMapping("/catalog/equipments")
    public Result<List<String>> getEquipments() {
        return Result.success(catalogService.getEquipments());
    }

    @Operation(summary = "按 ID 获取动作详情")
    @GetMapping("/exercises/{id}")
    public Result<ExerciseDetailResponse> getExercise(@PathVariable("id") String id) {
        return Result.success(catalogService.getExercise(id));
    }
}
