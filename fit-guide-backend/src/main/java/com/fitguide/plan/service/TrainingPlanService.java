package com.fitguide.plan.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fitguide.catalog.service.CatalogService;
import com.fitguide.favorite.service.FavoriteService;
import com.fitguide.plan.dto.TrainingPlanModels.Exercise;
import com.fitguide.plan.dto.TrainingPlanModels.Response;
import com.fitguide.plan.dto.TrainingPlanModels.SaveRequest;
import com.fitguide.plan.entity.TrainingPlanEntity;
import com.fitguide.plan.exception.TrainingPlanApiException;
import com.fitguide.plan.mapper.TrainingPlanMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingPlanService {

    private static final int MAX_PLANS = 50;
    private static final int MAX_EXERCISES = 50;

    private final TrainingPlanMapper mapper;

    public List<Response> getPlans(String openId) {
        openId = FavoriteService.requireOpenId(openId);
        return mapper.selectList(Wrappers.<TrainingPlanEntity>lambdaQuery()
                        .eq(TrainingPlanEntity::getUserOpenid, openId)
                        .orderByDesc(TrainingPlanEntity::getUpdatedAt)
                        .orderByDesc(TrainingPlanEntity::getId))
                .stream().map(TrainingPlanService::toResponse).toList();
    }

    public Response createPlan(String openId, JsonNode body) {
        openId = FavoriteService.requireOpenId(openId);
        var request = requireValid(parseRequest(body));
        // ponytail: soft quota; add a DB-backed quota only if concurrent abuse appears.
        if (mapper.selectCount(Wrappers.<TrainingPlanEntity>lambdaQuery()
                .eq(TrainingPlanEntity::getUserOpenid, openId)) >= MAX_PLANS) {
            throw TrainingPlanApiException.limitReached();
        }
        var entity = new TrainingPlanEntity();
        entity.setUserOpenid(openId);
        entity.setName(request.name());
        entity.setExercises(request.exercises());
        mapper.insert(entity);
        return toResponse(entity);
    }

    public Response updatePlan(String openId, String planId, JsonNode body) {
        openId = FavoriteService.requireOpenId(openId);
        var id = parsePlanId(planId);
        var request = requireValid(parseRequest(body));
        var owner = Wrappers.<TrainingPlanEntity>lambdaQuery()
                .eq(TrainingPlanEntity::getId, id)
                .eq(TrainingPlanEntity::getUserOpenid, openId);
        if (mapper.selectOne(owner) == null) throw TrainingPlanApiException.notFound();

        var patch = new TrainingPlanEntity();
        patch.setName(request.name());
        patch.setExercises(request.exercises());
        var updated = mapper.update(patch, Wrappers.<TrainingPlanEntity>lambdaUpdate()
                .eq(TrainingPlanEntity::getId, id)
                .eq(TrainingPlanEntity::getUserOpenid, openId));
        if (updated == 0 && mapper.selectOne(Wrappers.<TrainingPlanEntity>lambdaQuery()
                .eq(TrainingPlanEntity::getId, id)
                .eq(TrainingPlanEntity::getUserOpenid, openId)) == null) {
            throw TrainingPlanApiException.notFound();
        }
        return new Response(id.toString(), request.name(), request.exercises());
    }

    public boolean deletePlan(String openId, String planId) {
        openId = FavoriteService.requireOpenId(openId);
        var id = parsePlanId(planId);
        if (mapper.delete(Wrappers.<TrainingPlanEntity>lambdaQuery()
                .eq(TrainingPlanEntity::getId, id)
                .eq(TrainingPlanEntity::getUserOpenid, openId)) == 0) {
            throw TrainingPlanApiException.notFound();
        }
        return true;
    }

    private static SaveRequest parseRequest(JsonNode body) {
        if (body == null || !body.isObject()) throw TrainingPlanApiException.invalidRequest();
        var name = body.get("name");
        var exercises = body.get("exercises");
        if (name == null || !name.isTextual() || exercises == null || !exercises.isArray()) {
            throw TrainingPlanApiException.invalidRequest();
        }
        var parsed = new ArrayList<Exercise>();
        for (var item : exercises) {
            if (item == null || !item.isObject()) throw TrainingPlanApiException.invalidRequest();
            var exerciseId = item.get("exerciseId");
            var setCount = item.get("setCount");
            if (exerciseId == null || !exerciseId.isTextual()
                    || setCount == null || !setCount.isIntegralNumber() || !setCount.canConvertToInt()) {
                throw TrainingPlanApiException.invalidRequest();
            }
            parsed.add(new Exercise(exerciseId.textValue(), setCount.intValue()));
        }
        return new SaveRequest(name.textValue(), List.copyOf(parsed));
    }

    private static SaveRequest requireValid(SaveRequest request) {
        var name = request.name().trim();
        if (name.isEmpty() || name.length() > 50) {
            throw TrainingPlanApiException.invalidPlan("计划名称需要包含 1 到 50 个字符");
        }
        if (request.exercises().isEmpty() || request.exercises().size() > MAX_EXERCISES) {
            throw TrainingPlanApiException.invalidPlan("每个计划需要包含 1 到 50 个动作");
        }
        var ids = new HashSet<String>();
        for (var exercise : request.exercises()) {
            CatalogService.validateExerciseId(exercise.exerciseId());
            if (!ids.add(exercise.exerciseId())) {
                throw TrainingPlanApiException.invalidPlan("同一计划不能重复添加动作");
            }
            if (exercise.setCount() < 1 || exercise.setCount() > 99) {
                throw TrainingPlanApiException.invalidPlan("每个动作的组数需要在 1 到 99 之间");
            }
        }
        return new SaveRequest(name, request.exercises());
    }

    private static Long parsePlanId(String planId) {
        try {
            var id = Long.parseLong(planId);
            if (id <= 0) throw new NumberFormatException();
            return id;
        } catch (NumberFormatException exception) {
            throw TrainingPlanApiException.invalidPlanId();
        }
    }

    private static Response toResponse(TrainingPlanEntity entity) {
        return new Response(entity.getId().toString(), entity.getName(), List.copyOf(entity.getExercises()));
    }
}
