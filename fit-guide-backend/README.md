# FitGuide 后端

Spring Boot 3 / JDK 21 / MySQL 5.7 的动作目录、用户收藏与训练计划服务。

## 本地启动

1. 创建数据库并执行 `sql/init.sql`。
2. 设置数据库环境变量：

```powershell
$env:MYSQL_ADDRESS='localhost:3306'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='your-password'
```

3. 启动服务：

```powershell
mvn spring-boot:run
```

接口：

- `GET http://localhost:19000/api/v1/catalog?category=背部&equipment=高位下拉器`
- `GET http://localhost:19000/api/v1/catalog/categories`
- `GET http://localhost:19000/api/v1/catalog/equipments`
- `GET http://localhost:19000/api/v1/exercises/seated-lat-pulldown`
- `GET http://localhost:19000/api/v1/favorites`
- `PUT http://localhost:19000/api/v1/favorites/seated-lat-pulldown`
- `DELETE http://localhost:19000/api/v1/favorites/seated-lat-pulldown`
- `GET http://localhost:19000/api/v1/training-plans`
- `POST http://localhost:19000/api/v1/training-plans`
- `PUT http://localhost:19000/api/v1/training-plans/12`
- `DELETE http://localhost:19000/api/v1/training-plans/12`
- `http://localhost:19000/swagger-ui.html`

收藏和训练计划接口必须由微信小程序通过 `wx.cloud.callContainer` 调用，并依赖云托管注入的 `X-WX-OPENID`。本地接口测试可直接设置该请求头。

`sql/init.sql` 面向空库。已有数据库已创建收藏表时，执行 [`sql/migrate-favorites-without-exercise.sql`](sql/migrate-favorites-without-exercise.sql) 删除动作表外键；尚未创建收藏表时，执行 [`docs/favorites-api-design.md`](docs/favorites-api-design.md) 中的建表语句。

已有数据库新增训练计划功能时，执行 [`sql/add-training-plans.sql`](sql/add-training-plans.sql)。

运行检查：

```powershell
mvn test
```
