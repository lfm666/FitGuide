package com.fitguide.catalog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "动作目录元数据")
@TableName("fit_catalog")
public class CatalogEntity {

    @Schema(description = "目录主键，固定为 1")
    @TableId(value = "id", type = IdType.INPUT)
    private Short id;

    @Schema(description = "动作目录数据版本")
    @TableField("version")
    private Long version;

    @Schema(description = "健身安全免责声明")
    @TableField("disclaimer")
    private String disclaimer;
}
