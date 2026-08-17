-- 动作数据改为小程序本地维护后，收藏关系不再依赖 fit_exercise。
ALTER TABLE fit_user_favorite
    DROP FOREIGN KEY fk_fit_user_favorite_exercise;
