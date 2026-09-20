# 家庭行程 Cloudflare Pages 部署

这个部署只输出家庭行程、地图和预约链接，不包含 Tea X 主页、行前清单、签证页面或 GitHub 入口。公开链接不需要登录，但页面带有 `noindex` 与 `X-Robots-Tag`，用于阻止常规搜索引擎收录。

## 首次连接

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 打开 **Workers & Pages**，选择 **Create application** → **Pages** → **Connect to Git**。
3. 授权 Cloudflare 访问 GitHub；授权范围只选择 `mrteax/mrteax.github.io` 仓库。
4. 选择该仓库并填写：

| 设置 | 值 |
| --- | --- |
| Project name | `france-family-2026`（如果已占用可换一个） |
| Production branch | `master` |
| Framework preset | `None` |
| Build command | `python3 scripts/check-family-share.py && python3 scripts/build-family-share.py` |
| Build output directory | `dist/family-trip` |
| Root directory | 留空 |

5. 不需要添加环境变量，点击 **Save and Deploy**。
6. 部署完成后，Cloudflare 会提供形如 `https://france-family-2026.pages.dev` 的公开地址。

以后每次行程改动合并到 `master`，Cloudflare 都会从同一个行程源自动生成并发布家庭版。

## 本地验证

```bash
python3 scripts/check-family-share.py
python3 scripts/build-family-share.py
python3 -m http.server 8080 --directory dist/family-trip
```

打开 `http://localhost:8080/`。家庭版应保留十天行程、地图、预约入口和明暗主题，但不应出现返回法国页、行前清单或签证页的导航。

## 旅行结束后

先从主行程移除住处坐标并完成一次部署；如果不再需要家庭站点，在 Cloudflare 的项目 **Settings** 中选择 **Delete project**。删除 Pages 项目不会影响 GitHub Pages 上的 Tea X 主页。
