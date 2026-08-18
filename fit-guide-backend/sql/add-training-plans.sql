CREATE TABLE fit_training_plan (
    id           BIGINT NOT NULL AUTO_INCREMENT COMMENT '训练计划主键',
    user_openid  VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '微信小程序用户OpenID',
    name         VARCHAR(50) NOT NULL COMMENT '计划名称',
    exercises    JSON NOT NULL COMMENT '按训练顺序保存动作ID和组数的JSON数组',
    created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                 ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_fit_training_plan_user (user_openid, updated_at, id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci
  COMMENT = '用户训练计划表';
