package com.fitguide.catalog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitguide.catalog.entity.ExerciseEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ExerciseMapper extends BaseMapper<ExerciseEntity> {

    @Select("""
            SELECT category
            FROM fit_exercise
            WHERE enabled = TRUE
            GROUP BY category
            ORDER BY MIN(sort_order)
            """)
    List<String> selectCategories();

    @Select("""
            SELECT equipment
            FROM fit_exercise
            WHERE enabled = TRUE
            GROUP BY equipment
            ORDER BY MIN(sort_order)
            """)
    List<String> selectEquipments();
}
