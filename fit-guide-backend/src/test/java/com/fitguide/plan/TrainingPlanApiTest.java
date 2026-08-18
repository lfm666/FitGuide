package com.fitguide.plan;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fitguide.catalog.controller.CatalogExceptionHandler;
import com.fitguide.plan.controller.TrainingPlanController;
import com.fitguide.plan.dto.TrainingPlanModels.Exercise;
import com.fitguide.plan.entity.TrainingPlanEntity;
import com.fitguide.plan.mapper.TrainingPlanMapper;
import com.fitguide.plan.service.TrainingPlanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TrainingPlanApiTest {

    private static final String OPEN_ID = "openid_test-123";
    private static final String VALID_BODY = """
            {"name":" 推日 ","exercises":[{"exerciseId":"0001","setCount":3}]}
            """;

    private TrainingPlanMapper mapper;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        if (TableInfoHelper.getTableInfo(TrainingPlanEntity.class) == null) {
            TableInfoHelper.initTableInfo(
                    new MapperBuilderAssistant(new MybatisConfiguration(), "training-plan-test"),
                    TrainingPlanEntity.class);
        }
        mapper = mock(TrainingPlanMapper.class);
        doAnswer(invocation -> {
            invocation.<TrainingPlanEntity>getArgument(0).setId(12L);
            return 1;
        }).when(mapper).insert(any(TrainingPlanEntity.class));
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new TrainingPlanController(new TrainingPlanService(mapper)))
                .setControllerAdvice(new CatalogExceptionHandler())
                .build();
    }

    @Test
    void rejectsMissingOpenId() throws Exception {
        mockMvc.perform(get("/api/v1/training-plans"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void listsOnlyTheRequestedOwner() throws Exception {
        var entity = plan(7L, "openid_test-123", "推日");
        when(mapper.selectList(any())).thenReturn(List.of(entity));

        mockMvc.perform(get("/api/v1/training-plans").header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value("7"))
                .andExpect(jsonPath("$.data[0].exercises[0].exerciseId").value("0001"));

        var wrapper = wrapperCaptor();
        verify(mapper).selectList(wrapper.capture());
        assertTrue(paramValues(wrapper.getValue()).containsValue(OPEN_ID));
    }

    @Test
    void createsPlanWithoutLosingLeadingZero() throws Exception {
        when(mapper.selectCount(any())).thenReturn(0L);

        mockMvc.perform(post("/api/v1/training-plans")
                        .header("X-WX-OPENID", OPEN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("12"))
                .andExpect(jsonPath("$.data.name").value("推日"))
                .andExpect(jsonPath("$.data.exercises[0].exerciseId").value("0001"));
    }

    @Test
    void rejectsInvalidPlanValues() throws Exception {
        assertPlanError("{\"name\":\" \",\"exercises\":[{\"exerciseId\":\"0001\",\"setCount\":3}]}", "INVALID_TRAINING_PLAN");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[]}", "INVALID_TRAINING_PLAN");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[{\"exerciseId\":\"0001\",\"setCount\":3},{\"exerciseId\":\"0001\",\"setCount\":4}]}", "INVALID_TRAINING_PLAN");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[{\"exerciseId\":\"INVALID_ID\",\"setCount\":3}]}", "INVALID_EXERCISE_ID");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[{\"exerciseId\":\"0001\",\"setCount\":100}]}", "INVALID_TRAINING_PLAN");
    }

    @Test
    void rejectsCoercedAndNullJsonValues() throws Exception {
        assertPlanError("{\"name\":\"计划\",\"exercises\":[{\"exerciseId\":1,\"setCount\":3}]}", "INVALID_REQUEST");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[{\"exerciseId\":\"0001\",\"setCount\":3.5}]}", "INVALID_REQUEST");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[{\"exerciseId\":\"0001\",\"setCount\":\"3\"}]}", "INVALID_REQUEST");
        assertPlanError("{\"name\":\"计划\",\"exercises\":null}", "INVALID_REQUEST");
        assertPlanError("{\"name\":\"计划\",\"exercises\":[null]}", "INVALID_REQUEST");
        assertPlanError("null", "INVALID_REQUEST");
    }

    @Test
    void rejectsBadJsonAndWrongContentType() throws Exception {
        mockMvc.perform(post("/api/v1/training-plans")
                        .header("X-WX-OPENID", OPEN_ID)
                        .contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        mockMvc.perform(post("/api/v1/training-plans")
                        .header("X-WX-OPENID", OPEN_ID)
                        .contentType(MediaType.TEXT_PLAIN).content(VALID_BODY))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void enforcesSoftQuota() throws Exception {
        when(mapper.selectCount(any())).thenReturn(50L);
        mockMvc.perform(post("/api/v1/training-plans")
                        .header("X-WX-OPENID", OPEN_ID)
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRAINING_PLAN_LIMIT_REACHED"));
    }

    @Test
    void updateIsOwnerScopedAndIdempotent() throws Exception {
        when(mapper.selectOne(any())).thenReturn(plan(12L, OPEN_ID, "推日"));
        when(mapper.update(any(), any())).thenReturn(0);

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(put("/api/v1/training-plans/12")
                            .header("X-WX-OPENID", OPEN_ID)
                            .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value("12"));
        }

        var wrapper = wrapperCaptor();
        verify(mapper, org.mockito.Mockito.atLeastOnce()).update(any(), wrapper.capture());
        assertTrue(paramValues(wrapper.getValue()).containsValue(12L));
        assertTrue(paramValues(wrapper.getValue()).containsValue(OPEN_ID));
    }

    @Test
    void hidesMissingOrOtherUsersPlans() throws Exception {
        when(mapper.selectOne(any())).thenReturn(null);
        mockMvc.perform(put("/api/v1/training-plans/12")
                        .header("X-WX-OPENID", OPEN_ID)
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TRAINING_PLAN_NOT_FOUND"));
        mockMvc.perform(delete("/api/v1/training-plans/12").header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TRAINING_PLAN_NOT_FOUND"));
    }

    @Test
    void deletesByPlanAndOwner() throws Exception {
        when(mapper.delete(any(Wrapper.class))).thenReturn(1);
        mockMvc.perform(delete("/api/v1/training-plans/12").header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(true));

        var wrapper = wrapperCaptor();
        verify(mapper).delete(wrapper.capture());
        assertTrue(paramValues(wrapper.getValue()).containsValue(12L));
        assertTrue(paramValues(wrapper.getValue()).containsValue(OPEN_ID));
    }

    @Test
    void rejectsInvalidPlanId() throws Exception {
        mockMvc.perform(delete("/api/v1/training-plans/not-a-number").header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PLAN_ID"));
    }

    private void assertPlanError(String body, String code) throws Exception {
        mockMvc.perform(post("/api/v1/training-plans")
                        .header("X-WX-OPENID", OPEN_ID)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(code));
    }

    private static TrainingPlanEntity plan(long id, String openId, String name) {
        var entity = new TrainingPlanEntity();
        entity.setId(id);
        entity.setUserOpenid(openId);
        entity.setName(name);
        entity.setExercises(List.of(new Exercise("0001", 3)));
        return entity;
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static ArgumentCaptor<Wrapper<TrainingPlanEntity>> wrapperCaptor() {
        return (ArgumentCaptor) ArgumentCaptor.forClass(Wrapper.class);
    }

    private static java.util.Map<String, Object> paramValues(Wrapper<TrainingPlanEntity> wrapper) {
        wrapper.getSqlSegment();
        return ((AbstractWrapper<?, ?, ?>) wrapper).getParamNameValuePairs();
    }
}
