package com.fitguide.favorite;

import com.fitguide.catalog.controller.CatalogExceptionHandler;
import com.fitguide.catalog.exception.CatalogApiException;
import com.fitguide.catalog.service.CatalogService;
import com.fitguide.favorite.controller.FavoriteController;
import com.fitguide.favorite.mapper.FavoriteMapper;
import com.fitguide.favorite.service.FavoriteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FavoriteApiTest {

    private static final String OPEN_ID = "openid_test-123";
    private static final String EXERCISE_ID = "seated-lat-pulldown";

    private FavoriteMapper favoriteMapper;
    private CatalogService catalogService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        favoriteMapper = mock(FavoriteMapper.class);
        catalogService = mock(CatalogService.class);
        var service = new FavoriteService(favoriteMapper, catalogService);
        mockMvc = MockMvcBuilders.standaloneSetup(new FavoriteController(service))
                .setControllerAdvice(new CatalogExceptionHandler())
                .build();
    }

    @Test
    void rejectsMissingOpenId() throws Exception {
        mockMvc.perform(get("/api/v1/favorites"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void returnsCurrentUsersFavoriteIds() throws Exception {
        when(favoriteMapper.selectExerciseIds(OPEN_ID)).thenReturn(List.of(EXERCISE_ID));
        when(favoriteMapper.selectExerciseIds("other_openid"))
                .thenReturn(List.of("machine-chest-press"));

        mockMvc.perform(get("/api/v1/favorites").header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("00000"))
                .andExpect(jsonPath("$.data[0]").value(EXERCISE_ID));

        verify(favoriteMapper).selectExerciseIds(OPEN_ID);

        mockMvc.perform(get("/api/v1/favorites").header("X-WX-OPENID", "other_openid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0]").value("machine-chest-press"));

        verify(favoriteMapper).selectExerciseIds("other_openid");
    }

    @Test
    void returnsEmptyFavoriteIds() throws Exception {
        when(favoriteMapper.selectExerciseIds(OPEN_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/favorites").header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void addingFavoriteIsIdempotent() throws Exception {
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(put("/api/v1/favorites/{id}", EXERCISE_ID)
                            .header("X-WX-OPENID", OPEN_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").value(true));
        }

        verify(catalogService, times(2)).requireAvailableExercise(EXERCISE_ID);
        verify(favoriteMapper, times(2)).insert(OPEN_ID, EXERCISE_ID);
    }

    @Test
    void removingMissingFavoriteStillSucceeds() throws Exception {
        mockMvc.perform(delete("/api/v1/favorites/{id}", EXERCISE_ID)
                        .header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(false));

        verify(catalogService).validateExerciseId(EXERCISE_ID);
        verify(favoriteMapper).delete(OPEN_ID, EXERCISE_ID);
    }

    @Test
    void rejectsInvalidExerciseId() throws Exception {
        doThrow(CatalogApiException.invalidExerciseId())
                .when(catalogService).requireAvailableExercise("INVALID_ID");

        mockMvc.perform(put("/api/v1/favorites/INVALID_ID")
                        .header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_EXERCISE_ID"));
    }

    @Test
    void rejectsMissingExercise() throws Exception {
        doThrow(CatalogApiException.exerciseNotFound())
                .when(catalogService).requireAvailableExercise("missing-exercise");

        mockMvc.perform(put("/api/v1/favorites/missing-exercise")
                        .header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EXERCISE_NOT_FOUND"));
    }

    @Test
    void rejectsDisabledExercise() throws Exception {
        doThrow(CatalogApiException.exerciseNotFound())
                .when(catalogService).requireAvailableExercise("disabled-exercise");

        mockMvc.perform(put("/api/v1/favorites/disabled-exercise")
                        .header("X-WX-OPENID", OPEN_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EXERCISE_NOT_FOUND"));
    }
}
