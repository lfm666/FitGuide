package com.fitguide.catalog;

import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fitguide.catalog.controller.CatalogController;
import com.fitguide.catalog.controller.CatalogExceptionHandler;
import com.fitguide.catalog.entity.CatalogEntity;
import com.fitguide.catalog.entity.ExerciseEntity;
import com.fitguide.catalog.mapper.CatalogMapper;
import com.fitguide.catalog.mapper.ExerciseMapper;
import com.fitguide.catalog.service.CatalogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CatalogApiTest {

    private CatalogMapper catalogMapper;
    private ExerciseMapper exerciseMapper;
    private MockMvc mockMvc;

    @BeforeAll
    static void initializeMybatisMetadata() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), "CatalogApiTest"),
                ExerciseEntity.class);
    }

    @BeforeEach
    void setUp() {
        catalogMapper = mock(CatalogMapper.class);
        exerciseMapper = mock(ExerciseMapper.class);
        var service = new CatalogService(catalogMapper, exerciseMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(new CatalogController(service))
                .setControllerAdvice(new CatalogExceptionHandler())
                .build();
    }

    @Test
    void returnsCatalogInUnifiedResult() throws Exception {
        when(catalogMapper.selectById((short) 1)).thenReturn(catalog());
        when(exerciseMapper.selectList(any())).thenReturn(List.of(exercise()));

        mockMvc.perform(get("/api/v1/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("00000"))
                .andExpect(jsonPath("$.data.version").value(1))
                .andExpect(jsonPath("$.data.exercises", hasSize(1)))
                .andExpect(jsonPath("$.data.exercises[0].id").value("seated-lat-pulldown"))
                .andExpect(jsonPath("$.data.exercises[0].image").value("cloud://exercise.jpg"));
    }

    @Test
    void filtersCatalogByCategoryAndEquipment() throws Exception {
        when(catalogMapper.selectById((short) 1)).thenReturn(catalog());
        when(exerciseMapper.selectList(any())).thenReturn(List.of(exercise()));

        mockMvc.perform(get("/api/v1/catalog")
                        .param("category", " 背部 ")
                        .param("equipment", "高位下拉器"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.exercises", hasSize(1)));

        verify(exerciseMapper).selectList(argThat(query ->
                query instanceof AbstractWrapper<?, ?, ?> wrapper
                        && !wrapper.getSqlSegment().isBlank()
                        && wrapper.getParamNameValuePairs().containsValue("背部")
                        && wrapper.getParamNameValuePairs().containsValue("高位下拉器")));
    }

    @Test
    void returnsCategoriesAndEquipments() throws Exception {
        when(exerciseMapper.selectCategories()).thenReturn(List.of("背部", "胸部"));
        when(exerciseMapper.selectEquipments()).thenReturn(List.of("高位下拉器", "坐姿推胸机"));

        mockMvc.perform(get("/api/v1/catalog/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0]").value("背部"))
                .andExpect(jsonPath("$.data[1]").value("胸部"));

        mockMvc.perform(get("/api/v1/catalog/equipments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0]").value("高位下拉器"))
                .andExpect(jsonPath("$.data[1]").value("坐姿推胸机"));
    }

    @Test
    void rejectsOverlongCatalogFilter() throws Exception {
        mockMvc.perform(get("/api/v1/catalog").param("category", "胸".repeat(33)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATALOG_FILTER"));
    }

    @Test
    void rejectsInvalidExerciseId() throws Exception {
        mockMvc.perform(get("/api/v1/exercises/INVALID_ID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_EXERCISE_ID"));
    }

    @Test
    void returnsNotFoundForMissingExercise() throws Exception {
        mockMvc.perform(get("/api/v1/exercises/missing-exercise"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EXERCISE_NOT_FOUND"));
    }

    private static CatalogEntity catalog() {
        var catalog = new CatalogEntity();
        catalog.setId((short) 1);
        catalog.setVersion(1L);
        catalog.setDisclaimer("测试免责声明");
        return catalog;
    }

    private static ExerciseEntity exercise() {
        var exercise = new ExerciseEntity();
        exercise.setId("seated-lat-pulldown");
        exercise.setName("坐姿高位下拉");
        exercise.setCategory("背部");
        exercise.setEquipment("高位下拉器");
        exercise.setLevel("初级");
        exercise.setPrimaryMuscles(List.of("背阔肌"));
        exercise.setSecondaryMuscles(List.of("肱二头肌"));
        exercise.setImageUrl("cloud://exercise.jpg");
        exercise.setGifUrl("cloud://exercise.gif");
        exercise.setSteps(List.of("下拉"));
        exercise.setCautions(List.of("不要借力"));
        exercise.setSortOrder(1);
        exercise.setEnabled(true);
        return exercise;
    }
}
