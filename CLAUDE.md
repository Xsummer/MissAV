# CLAUDE.md

本仓库是 guoapp 的一个 JS 站源模块：`manifest.json` 与 `main.js`。清单字段、导出函数和宿主接口见 guoapp 仓库 `DEVELOPMENT.md` 的「站源模块」。

- 运行环境是 goja，不是浏览器也不是 Node：没有 `fetch`、`URL`、`Buffer`、`atob`、`TextEncoder`，函数必须同步返回。网络、加密、解析都走全局对象 `host`。
- 不写压缩或混淆过的代码，单行不超过 1000 个字符，CI 会拒绝。
- 剧和分集的 ID 会写进用户的追剧、记录和下载，发布后不能改格式。
- 发版：改 `manifest.json` 的 `version`，打 `v<版本号>` 标签推送，CI 发布 Release。
- 本机校验：`python3 <guoapp-modules/.github 仓库>/scripts/check_module.py . --repo <仓库名>`。

## 本模块要点

- 标识是 `missav`，清单里 `browserFingerprint: true`。站点和播放 CDN（`*.surrit.com`）都按 TLS 指纹拦请求，普通 `http.Client` 只能拿到 403，改清单时不要删这一项。
- 播放地址不在 HTML 属性里，在详情页内联脚本的 packer 压缩块里，由 `unpackPacked` 展开。改解析时先确认详情页还带着 `eval(function(p,a,c,k,e,d)` 这一段。
- 播放请求必须带详情页作 `Referer`，`resolveMedia` 返回的 `referer` 不能为空，且必须与取到页面的那条线路同域（`detail` 的 `pageUrl` 同理）。
- 线路回退由模块自己做（`fetchPage` 顺序试 `SITES`，`preferred-site` 缓存优先），不要改用 `mirrors`：清单里 `noHostRotation: true` 时宿主的 `providerURLCandidates` 会忽略 mirrors。
- 新增线路时只改 `SITES` 常量；404 不换线路，403/429/验证/超时才换。
- 站点是单集片，`detail` 只出一个分集；分集 `id` 的 key 固定为 `1`，写进用户记录，不能改。
- 列表每页 12 条、最多 2000 页；`hasMore` 按页面里 `page=<下一页>` 的链接判断。
- 离线测试：`node --test test/main.test.cjs`，页面是合成 HTML，不联网。

## 站点访问规定

- 不得在会话里以任何形式直接访问站点，包括 `moduletool`、curl 和会联网的测试。
- 需要站点的真实数据时，把探测脚本写在临时目录，回复里只给一行执行命令，由用户在会话外运行、审查后把结果贴回对话。探测脚本的输出只打印到控制台，不写入文件，并对内容打码。
- 不得编写或运行会输出站点内容的测试。
