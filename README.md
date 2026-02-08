# 实时涨跌幅排行榜

一个纯前端的**代币行情看板**，用于添加多个合约地址，实时查看价格、市值、24h 成交量、流动性以及多周期涨跌幅，并按涨跌幅排序。数据来自 [DexScreener](https://dexscreener.com/) API，无需后端，刷新与列表均保存在浏览器本地。

---

## 功能简介

- **多代币监控**：添加任意链上的代币合约地址（如 Base、BSC、Ethereum 等），一屏查看多个标的。
- **实时数据**：每 3 秒自动刷新价格、市值、24h 成交量、流动性；仅在有代币时请求，列表为空不请求。
- **多周期涨跌幅**：支持 5m / 1H / 6H / 24H 切换，表格按当前选中周期涨跌幅排序。
- **本地持久化**：监控列表保存在浏览器 LocalStorage，刷新或关闭后再打开不会丢失。
- **无效地址自动清理**：若某地址无法从 API 获取数据，会自动从列表中移除。
- **简洁 UI**：深色主题、玻璃拟态面板、涨跌颜色区分、行悬停高亮，适合长时间盯盘。

---

## 技术说明

- 纯静态：仅 `index.html` + `style.css` + `script.js`，无构建步骤。
- 数据源：`https://api.dexscreener.com/latest/dex/tokens/{address}`。
- 兼容现代浏览器（Chrome、Edge、Firefox、Safari 等）。

---

## 本地使用

1. 用浏览器直接打开项目里的 `index.html`，或使用本地静态服务器（如 `npx serve .`）。
2. 在输入框粘贴代币合约地址，点击「添加」即可加入监控列表。

---

## 发布为网站（GitHub Pages）

本项目可直接用 **GitHub Pages** 免费托管，让任何人通过一个网址访问。详细步骤见仓库内的 [发布指南 (GitHub Pages)](DEPLOY.md)。

简要步骤：

1. 在 GitHub 新建一个仓库（如 `crypto-watchlist`）。
2. 把本地的 `index.html`、`style.css`、`script.js` 等文件推送到该仓库。
3. 在仓库 **Settings → Pages** 里，将 Source 选为 **main** 分支的根目录，保存。
4. 几分钟后访问 `https://你的用户名.github.io/crypto-watchlist/` 即可看到你的网站。

---

## 许可证

MIT，可自由使用与修改。
