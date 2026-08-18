package com.fitguide.plan.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fitguide.catalog.dto.Result;
import com.fitguide.plan.dto.TrainingPlanModels.Response;
import com.fitguide.plan.service.TrainingPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "训练计划")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/training-plans")
public class TrainingPlanController {

    private static final String OPEN_ID_HEADER = "X-WX-OPENID";
    private final TrainingPlanService service;

    @Operation(summary = "获取当前用户的训练计划")
    @GetMapping
    public Result<List<Response>> getPlans(@RequestHeader(value = OPEN_ID_HEADER, required = false) String openId) {
        return Result.success(service.getPlans(openId));
    }

    @Operation(summary = "新建训练计划")
    @PostMapping
    public Result<Response> createPlan(@RequestHeader(value = OPEN_ID_HEADER, required = false) String openId,
                                       @RequestBody JsonNode body) {
        return Result.success(service.createPlan(openId, body));
    }

    @Operation(summary = "更新训练计划")
    @PutMapping("/{planId}")
    public Result<Response> updatePlan(@RequestHeader(value = OPEN_ID_HEADER, required = false) String openId,
                                       @PathVariable String planId, @RequestBody JsonNode body) {
        return Result.success(service.updatePlan(openId, planId, body));
    }

    @Operation(summary = "删除训练计划")
    @DeleteMapping("/{planId}")
    public Result<Boolean> deletePlan(@RequestHeader(value = OPEN_ID_HEADER, required = false) String openId,
                                      @PathVariable String planId) {
        return Result.success(service.deletePlan(openId, planId));
    }
}
