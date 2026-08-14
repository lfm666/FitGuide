package com.fitguide.favorite.controller;

import com.fitguide.catalog.dto.Result;
import com.fitguide.favorite.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "动作收藏")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private static final String OPEN_ID_HEADER = "X-WX-OPENID";

    private final FavoriteService favoriteService;

    @Operation(summary = "获取当前用户收藏的动作 ID")
    @GetMapping
    public Result<List<String>> getFavoriteIds(
            @RequestHeader(value = OPEN_ID_HEADER, required = false) String openId) {
        return Result.success(favoriteService.getFavoriteIds(openId));
    }

    @Operation(summary = "收藏动作")
    @PutMapping("/{exerciseId}")
    public Result<Boolean> addFavorite(
            @RequestHeader(value = OPEN_ID_HEADER, required = false) String openId,
            @PathVariable("exerciseId") String exerciseId) {
        return Result.success(favoriteService.addFavorite(openId, exerciseId));
    }

    @Operation(summary = "取消收藏")
    @DeleteMapping("/{exerciseId}")
    public Result<Boolean> removeFavorite(
            @RequestHeader(value = OPEN_ID_HEADER, required = false) String openId,
            @PathVariable("exerciseId") String exerciseId) {
        return Result.success(favoriteService.removeFavorite(openId, exerciseId));
    }
}
