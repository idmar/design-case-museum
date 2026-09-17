# 设计案例博物馆 / Design Case Museum

277 个设计案例，包含完整预览图片、分类、搜索、分页、策展笔记与案例深链接。响应式静态网站，无需安装前端依赖。

## 本地预览

在项目根目录运行：

```sh
python3 -m http.server 8000 --directory dist
```

打开 http://localhost:8000 。静态托管目录为 `dist/`。

## 项目结构

- `dist/`：可部署网站，包括 HTML、CSS、JavaScript 与 277 张图片。
- `dist/cases.json`：完整案例数据。
- `scripts/curator-notes.tsv`：策展笔记。
- `scripts/recovered-previews.json`：12 个补图案例的来源和笔记。
- `scripts/build_catalog.py`：生成浏览器使用的 data.js。
- `scripts/import_archive.py`：从原始 HTML/PDF 重新导入；原始附件未随包附带，需自行提供。
- `tests/catalog-smoke.cjs`：功能冒烟测试，需要 Node.js，并在初始化 Git 提交后运行。

## 更新与检查

```sh
python3 scripts/build_catalog.py
node tests/catalog-smoke.cjs
```

重新导入附件需要 Python 包 Pillow、PyMuPDF。直接运行网站和更新笔记不需要原始附件。

## 来源与版权

案例来源于 bestweb.html / bestweb.pdf 收藏。265 张图片来自 PDF，12 张根据原收藏图片链接补回；各案例保存原站链接及图片来源。作品和图像权利归原作者所有。本仓库不授予第三方案例图片的再许可。
