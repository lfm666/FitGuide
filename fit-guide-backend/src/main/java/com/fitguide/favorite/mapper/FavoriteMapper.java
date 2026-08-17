package com.fitguide.favorite.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FavoriteMapper {

    @Select("""
            SELECT exercise_id
            FROM fit_user_favorite
            WHERE user_openid = #{openId}
            ORDER BY created_at DESC, exercise_id
            """)
    List<String> selectExerciseIds(@Param("openId") String openId);

    @Insert("""
            INSERT IGNORE INTO fit_user_favorite (user_openid, exercise_id)
            VALUES (#{openId}, #{exerciseId})
            """)
    int insert(@Param("openId") String openId, @Param("exerciseId") String exerciseId);

    @Delete("""
            DELETE FROM fit_user_favorite
            WHERE user_openid = #{openId}
              AND exercise_id = #{exerciseId}
            """)
    int delete(@Param("openId") String openId, @Param("exerciseId") String exerciseId);
}
