package com.fitguide.catalog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "健身动作")
@TableName(value = "fit_exercise", autoResultMap = true)
public class ExerciseEntity {

    @Schema(description = "动作唯一标识，使用 kebab-case 英文名称")
    @TableId(value = "id", type = IdType.INPUT)
    private String id;

    @Schema(description = "动作中文名称")
    @TableField("name")
    private String name;

    @Schema(description = "训练部位分类")
    @TableField("category")
    private String category;

    @Schema(description = "动作所需器械名称")
    @TableField("equipment")
    private String equipment;

    @Schema(description = "动作难度")
    @TableField("level")
    private String level;

    @Schema(description = "主要刺激肌群")
    @TableField(value = "primary_muscles", typeHandler = JacksonTypeHandler.class)
    private List<String> primaryMuscles;

    @Schema(description = "辅助刺激肌群")
    @TableField(value = "secondary_muscles", typeHandler = JacksonTypeHandler.class)
    private List<String> secondaryMuscles;

    @Schema(description = "动作封面地址")
    @TableField("image_url")
    private String imageUrl;

    @Schema(description = "动作演示地址")
    @TableField("gif_url")
    private String gifUrl;

    @Schema(description = "按执行顺序排列的动作步骤")
    @TableField(value = "steps", typeHandler = JacksonTypeHandler.class)
    private List<String> steps;

    @Schema(description = "安全注意事项")
    @TableField(value = "cautions", typeHandler = JacksonTypeHandler.class)
    private List<String> cautions;

    @Schema(description = "展示顺序")
    @TableField("sort_order")
    private Integer sortOrder;

    @Schema(description = "是否启用")
    @TableField("enabled")
    private Boolean enabled;
}
