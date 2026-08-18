package com.fitguide.favorite.service;

import com.fitguide.catalog.service.CatalogService;
import com.fitguide.favorite.exception.FavoriteApiException;
import com.fitguide.favorite.mapper.FavoriteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private static final Pattern OPEN_ID = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

    private final FavoriteMapper favoriteMapper;

    public List<String> getFavoriteIds(String openId) {
        return favoriteMapper.selectExerciseIds(requireOpenId(openId));
    }

    public boolean addFavorite(String openId, String exerciseId) {
        openId = requireOpenId(openId);
        CatalogService.validateExerciseId(exerciseId);
        favoriteMapper.insert(openId, exerciseId);
        return true;
    }

    public boolean removeFavorite(String openId, String exerciseId) {
        openId = requireOpenId(openId);
        CatalogService.validateExerciseId(exerciseId);
        favoriteMapper.delete(openId, exerciseId);
        return false;
    }

    public static String requireOpenId(String openId) {
        if (openId == null || !OPEN_ID.matcher(openId).matches()) {
            throw FavoriteApiException.unauthorized();
        }
        return openId;
    }
}
