package com.fitguide.plan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.fitguide.plan.dto.TrainingPlanModels;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName(value = "fit_training_plan", autoResultMap = true)
public class TrainingPlanEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String userOpenid;
    private String name;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<TrainingPlanModels.Exercise> exercises;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
