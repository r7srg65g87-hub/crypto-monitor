# 用 GitHub Pages 发布「实时涨跌幅排行榜」

按下面步骤操作，即可把你的看板发布成一个公网可访问的网址，完全免费。

---

## 第一步：在 GitHub 上创建仓库

1. 打开 [GitHub](https://github.com)，登录你的账号。
2. 点击右上角 **「+」→「New repository」**。
3. 填写：
   - **Repository name**：例如 `crypto-watchlist`（会变成你网址的一部分）。
   - **Description**（可选）：例如「实时涨跌幅排行榜 - 代币监控看板」。
   - 选择 **Public**。
   - **不要**勾选 "Add a README file"（你本地已有文件，避免冲突）。
4. 点击 **「Create repository」**。

创建完成后，你会看到一个空仓库页面，记下仓库名（例如 `crypto-watchlist`）和你的 GitHub 用户名。

---

## 第二步：在本地用 Git 上传代码

在**本机**打开命令行（PowerShell 或 CMD），进入你的项目文件夹，例如：

```bash
cd C:\Users\Administrator\crypto-monitor
```

### 2.1 如果本机还没装 Git

- 去 [https://git-scm.com/download/win](https://git-scm.com/download/win) 下载并安装 Git。
- 安装后重新打开命令行，再执行下面的命令。

### 2.2 初始化仓库并提交

依次执行（把下面的 `你的用户名` 和 `crypto-watchlist` 换成你自己的仓库信息）：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件（index.html, style.css, script.js, README.md 等）
git add .

# 第一次提交
git commit -m "Initial commit: 实时涨跌幅排行榜"
```

### 2.3 关联 GitHub 并推送

在 GitHub 仓库页面点击绿色的 **「Code」**，复制仓库地址（HTTPS），例如：

`https://github.com/你的用户名/crypto-watchlist.git`

然后执行（**替换成你的仓库地址**）：

```bash
# 添加远程仓库（请把下面的 URL 换成你自己的）
git remote add origin https://github.com/你的用户名/crypto-watchlist.git

# 把 main 分支推上去（首次推送）
git branch -M main
git push -u origin main
```

如果提示输入账号密码，请使用 GitHub 的 **Personal Access Token** 作为密码（GitHub 已不再支持用账号密码推送）。生成 Token：GitHub → Settings → Developer settings → Personal access tokens → Generate new token，勾选 `repo` 权限即可。

---

## 第三步：开启 GitHub Pages 并拿到网址

1. 在 GitHub 上打开你的仓库（例如 `crypto-watchlist`）。
2. 点击顶部 **「Settings」**。
3. 左侧菜单找到 **「Pages」**（在 "Code and automation" 下）。
4. 在 **「Build and deployment」** 里：
   - **Source** 选 **「Deploy from a branch」**。
   - **Branch** 选 **「main」**，右边文件夹选 **「/ (root)」**。
5. 点击 **「Save」**。

等待 1～2 分钟，页面上方会出现一条提示，例如：

> Your site is live at **https://你的用户名.github.io/crypto-watchlist/**

这就是你的网站地址，发给别人即可访问。

---

## 以后更新网站怎么操作？

修改了本地的 `index.html`、`style.css` 或 `script.js` 后，在项目目录执行：

```bash
git add .
git commit -m "更新说明，例如：修复样式"
git push
```

推送成功后，GitHub Pages 会自动重新部署，一般 1～2 分钟后刷新你的网址就能看到更新。

---

## 常见问题

**Q：打开网址显示 404？**  
先确认 Settings → Pages 里 Branch 选的是 **main**，文件夹是 **/ (root)**。刚开启 Pages 可能要等几分钟。

**Q：页面打开了但样式/脚本没加载？**  
确保仓库根目录下有 `index.html`、`style.css`、`script.js`，且 `index.html` 里引用的是相对路径（如 `href="style.css"`），不要用本地绝对路径。

**Q：想用独立域名？**  
在仓库 Settings → Pages 最下面 "Custom domain" 填你的域名，并按提示在域名服务商那里添加 CNAME 解析即可。

---

完成以上步骤后，你就有一个可分享的在线看板了。
