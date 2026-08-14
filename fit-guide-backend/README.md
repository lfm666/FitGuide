# FitGuide 后端

Spring Boot 3 / JDK 21 / MySQL 5.7 的只读动作目录服务。

## 本地启动

1. 创建数据库并执行 `sql/init.sql`。
2. 设置数据库环境变量：

```powershell
$env:FIT_GUIDE_DB_URL='jdbc:mysql://localhost:3306/fit_guide?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai'
$env:FIT_GUIDE_DB_USERNAME='root'
$env:FIT_GUIDE_DB_PASSWORD='your-password'
```

3. 启动服务：

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

接口：

- `GET http://localhost:19000/api/v1/catalog?category=背部&equipment=高位下拉器`
- `GET http://localhost:19000/api/v1/catalog/categories`
- `GET http://localhost:19000/api/v1/catalog/equipments`
- `GET http://localhost:19000/api/v1/exercises/seated-lat-pulldown`
- `http://localhost:19000/swagger-ui.html`（`local` / `dev` 环境）

运行检查：

```powershell
mvn test
```
