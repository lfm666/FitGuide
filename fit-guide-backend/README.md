# FitGuide 后端

Spring Boot 3 / JDK 21 / MySQL 5.7 的动作目录与用户收藏服务。

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
- `http://localhost:19000/swagger-ui.html`

收藏接口必须由微信小程序通过 `wx.cloud.callContainer` 调用，并依赖云托管注入的 `X-WX-OPENID`。本地接口测试可直接设置该请求头。

`sql/init.sql` 面向空库。已有数据库升级时，执行 [`docs/favorites-api-design.md`](docs/favorites-api-design.md) 中的 `fit_user_favorite` 建表语句。

运行检查：

```powershell
mvn test
```
