# 长春麻将算分器

一个基于 `Vue 3 + Vite + TypeScript + Tailwind CSS` 开发的长春麻将单页面算分应用。  
用户选择牌型和胡法后，页面会自动展示对应计分结果。

## 项目特性

- 单页面应用（SPA），支持静态部署
- 响应式布局，适配 PC、平板、手机
- 牌型与胡法选择后自动显示结果（无需点击计算按钮）
- 点炮类胡法同时展示平炮与黑炮结果（示例：`2+2+1=5`）
- 计分规则集中管理，便于后续维护与扩展

## 技术栈

- Vue 3
- Vite
- TypeScript
- Tailwind CSS

## 目录结构

```text
src/
  assets/        静态资源
  components/    通用组件
  utils/         计分规则与计算逻辑
  views/         页面视图
docs/
  scoring-rules.md   计分规则文档
```

## 本地开发

```bash
npm install
npm run dev
```

启动后访问本地 Vite 开发地址（通常为 `http://localhost:5173`）。

## 构建与预览

```bash
npm run build
npm run preview
```

- 构建产物输出目录：`dist/`
- `dist/` 可直接部署到任意静态托管平台

## Cloudflare Pages 部署

推荐配置如下：

- Framework preset：`None`（或 `Vite`）
- Build command：`npm run build`
- Build output directory：`dist`
- Node.js 版本：`22`（建议 22.12+）

注意事项：

- 本项目已显式补齐 Pages 构建环境常见缺失的 Linux 原生可选依赖（rolldown、lightningcss、tailwindcss oxide）。
- 若修改依赖后仍出现构建缓存导致的缺包，请在 Pages 控制台执行 **Clear build cache** 后重新部署。
- 项目包含 `public/_redirects`：`/* /index.html 200`，用于 SPA 场景下的刷新与直达路由回退。

## 计分规则说明

- 当前项目采用固定映射计分方式（牌型 × 胡法）
- 规则明细请查看：
  - `docs/scoring-rules.md`
