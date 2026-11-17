# 云朵小镇

治愈系的过家家网页游戏，纯 HTML、CSS 和 JavaScript，没有第三方依赖。

## 文件结构

- `index.html`：页面骨架
- `css/style.css`：界面样式，主题色在 `--rose` 等变量里
- `js/`：游戏代码。`game.js` 是游戏主体，`ui.js` 是菜单和弹窗，`art-*.js` 负责画角色、家具和地图
- `tools/build.py`：把所有文件打包成 `dist/cloud-town.html`

## 怎么预览

在这个文件夹运行 `python -m http.server 8300 --bind 127.0.0.1`，然后打开 http://localhost:8300 。

## 怎么发布

- GitHub Pages：合并到 main 后，GitHub Actions 会自动发布到 https://linding5750.github.io/cloud-town/
- Claude 上的网页版：先运行 `python tools/build.py`，再用 Artifact 发布 `dist/cloud-town.html`

## 规矩

- 不要直接改 main，先开分支，改好后通过 Pull Request 合并
- 游戏里的文字要温柔可爱，符合治愈系风格
- 存档说明用中文，写清楚做了什么
- `dist/` 是构建出来的文件，不要手动改，也不要提交
- 已经推送到 GitHub 的存档，不要改写历史
- 仓库是公开的，不要写入密码、密钥或个人信息
