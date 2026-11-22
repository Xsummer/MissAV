const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");

// 合成页面：结构照搬站点，正文全部是占位文本，不含站点真实内容。
const LISTING = "<div class=\"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5\">\n  <div>\n    <div class=\"thumbnail group\">\n      <div class=\"relative aspect-w-16 aspect-h-9 rounded overflow-hidden shadow-lg\">\n        <a href=\"https://missav.live/cn/aaa-001\" alt=\"aaa-001\">\n          <video data-src=\"https://fourhoi.com/aaa-001/preview.mp4\"></video>\n          <img data-src=\"https://fourhoi.com/aaa-001/cover-t.jpg\" alt=\"占位标题一\">\n        </a>\n        <a href=\"https://missav.live/cn/aaa-001\" alt=\"aaa-001\">\n          <span class=\"absolute bottom-1 right-1 rounded-lg px-2 py-1 text-xs text-nord5 bg-gray-800 bg-opacity-75\">1:02:03</span>\n        </a>\n      </div>\n      <div class=\"my-2 text-sm text-nord4 truncate\">\n        <a class=\"text-secondary group-hover:text-primary\" href=\"https://missav.live/cn/aaa-001\" alt=\"aaa-001\">\n          AAA-001 占位标题一 &amp; 特殊字符\n        </a>\n      </div>\n    </div>\n  </div>\n  <div>\n    <div class=\"thumbnail group\">\n      <div class=\"relative aspect-w-16 h-9 rounded overflow-hidden shadow-lg\">\n        <a href=\"https://missav.live/dm64/cn/bbb-002\" alt=\"bbb-002\">\n          <img data-src=\"https://fourhoi.com/bbb-002/cover-t.jpg\" alt=\"占位标题二\">\n        </a>\n      </div>\n      <div class=\"my-2 text-sm text-nord4 truncate\">\n        <a class=\"text-secondary group-hover:text-primary\" href=\"https://missav.live/dm64/cn/bbb-002\" alt=\"bbb-002\">BBB-002 占位标题二</a>\n      </div>\n    </div>\n  </div>\n</div>\n<nav><a href=\"https://missav.live/cn/new?page=2\" class=\"relative inline-flex\">下一页</a></nav>";
const DETAIL = "<html lang=\"zh-Hans\">\n<head>\n  <meta property=\"og:image\" content=\"https://fourhoi.com/aaa-001/cover-n.jpg\" />\n  <meta property=\"og:video:duration\" content=\"3723\" />\n</head>\n<body>\n  <h1 class=\"text-base lg:text-lg text-nord6\">AAA-001 占位标题一 &amp; 特殊字符 - 占位女优</h1>\n  <div class=\"space-y-2\">\n    <div class=\"text-secondary\"><span>发行日期:</span><time datetime=\"2026-01-02T00:00:00+08:00\" class=\"font-medium\">2026-01-02</time></div>\n    <div class=\"text-secondary\"><span>番号:</span><span class=\"font-medium\">AAA-001</span></div>\n    <div class=\"text-secondary\"><span>标题:</span><span class=\"font-medium\">占位标题一</span></div>\n    <div class=\"text-secondary\"><span>女优:</span><a href=\"https://missav.live/cn/actresses/x\" class=\"text-nord13 font-medium\">占位女优甲</a>, <a href=\"https://missav.live/cn/actresses/y\" class=\"text-nord13 font-medium\">占位女优乙</a></div>\n    <div class=\"text-secondary\"><span>类型:</span><a href=\"https://missav.live/cn/genres/x\" class=\"text-nord13 font-medium\">占位类型甲</a>, <a href=\"https://missav.live/cn/genres/y\" class=\"text-nord13 font-medium\">占位类型乙</a></div>\n    <div class=\"text-secondary\"><span>发行商:</span><a href=\"https://missav.live/cn/makers/x\" class=\"text-nord13 font-medium\">占位发行商</a></div>\n    <div class=\"text-secondary\"><span>导演:</span><a href=\"https://missav.live/cn/directors/x\" class=\"text-nord13 font-medium\">占位导演</a></div>\n    <div class=\"text-secondary\"><span>标籤:</span><a href=\"https://missav.live/cn/labels/x\" class=\"text-nord13 font-medium\">占位厂牌</a></div>\n  </div>\n  <script>eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('g=\\'8://c.7.6/1/f.0\\';',17,17,'m3u8|00000000-1111-2222-3333-444444444444|92a0|4984|65cb|88f5fa50|com|surrit|https|video|1080p|source1280||720p|source842|playlist|source'.split('|'),0,{}))</script>\n</body>\n</html>";
const MASTER = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TOKEN=placeholder\n\n#EXT-X-STREAM-INF:BANDWIDTH=1065889,RESOLUTION=640x360\n360p/video.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2835932,RESOLUTION=1280x720\n720p/video.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=5577630,RESOLUTION=1920x1080\n1080p/video.m3u8";

function load(options) {
  const settings = options || {};
  const requests = [];
  const pages = settings.pages || {};
  const playlists = settings.playlists || {};
  const host = {
    source: "missav",
    dramaId: (sourceId) => "missav:" + sourceId,
    chapterId: (sourceId, key) => "missav:" + sourceId + ":" + key,
    fetchText: (request) => {
      requests.push(request);
      const answer = typeof pages === "function" ? pages(request.url) : pages[request.url];
      if (answer instanceof Error) {
        throw answer;
      }
      if (answer === undefined) {
        throw new Error("missav.live HTTP 404");
      }
      return { body: answer, url: request.url };
    },
    fetchPlaylist: (request) => {
      const answer = playlists[request.url];
      if (!answer) {
        throw new Error("playlist missing");
      }
      return { playlist: answer, url: request.url };
    },
    resolveUrl: (base, reference) => new URL(reference, base).toString()
  };
  const context = vm.createContext({ host, module: { exports: {} }, console });
  vm.runInContext(source, context);
  return { api: context.module.exports, requests };
}

test("categories expose fixed sections plus genres and reject unknown ids", () => {
  const { api } = load();
  const items = api.categories();
  assert(items.length > 10);
  assert.equal(JSON.stringify(items[0]), JSON.stringify({ id: "new", name: "最近更新" }));
  assert(items.some((entry) => entry.id === "genre:NTR" && entry.name === "NTR"));
  assert.equal(api.validCategory(""), true);
  assert.equal(api.validCategory("new"), true);
  assert.equal(api.validCategory("genre:NTR"), true);
  assert.equal(api.validCategory("nope"), false);
});

test("catalogPage parses cards, decodes entities and reports more pages", () => {
  const { api, requests } = load({ pages: { "https://missav.live/cn/new": LISTING } });
  const page = api.catalogPage(1, "");
  assert.equal(page.items.length, 2);
  assert.equal(page.hasMore, true);
  const first = page.items[0];
  assert.equal(first.id, "missav:aaa-001");
  assert.equal(first.source, "missav");
  assert.equal(first.sourceId, "aaa-001");
  assert.equal(first.title, "AAA-001 占位标题一 & 特殊字符");
  assert.equal(first.cover, "https://fourhoi.com/aaa-001/cover-t.jpg");
  assert.equal(first.badge, "1:02:03");
  assert.equal(page.items[1].sourceId, "bbb-002");
  assert.equal(requests[0].url, "https://missav.live/cn/new");
  assert.equal(requests[0].mirrors[0], "https://missav.ws/cn/new");
});

test("catalogPage requests the page number and genre path", () => {
  const { api, requests } = load({ pages: () => LISTING });
  api.catalogPage(3, "genre:NTR");
  assert.equal(requests[0].url, "https://missav.live/cn/genres/NTR?page=3");
});

test("catalogPage stops at the last page and refuses unknown categories", () => {
  const last = LISTING.split("?page=2").join("?page=99");
  const { api } = load({ pages: { "https://missav.live/cn/new?page=2": last } });
  assert.equal(api.catalogPage(2, "").hasMore, false);
  assert.throws(() => api.catalogPage(1, "unknown"), /没有分类/);
});

test("catalogPage stops at the 2000 page ceiling", () => {
  const { api } = load({ pages: () => LISTING });
  assert.equal(api.catalogPage(2000, "").hasMore, false);
  assert.equal(api.catalogPage(9999, "").hasMore, false);
});

test("search encodes the query and returns an empty page for blank input", () => {
  const { api, requests } = load({ pages: () => LISTING });
  assert.equal(JSON.stringify(api.search(1, "   ")), JSON.stringify({ items: [], hasMore: false }));
  assert.equal(requests.length, 0);
  const page = api.search(2, "巨乳 人妻");
  assert.equal(requests[0].url, "https://missav.live/cn/search/" + encodeURIComponent("巨乳 人妻") + "?page=2");
  assert.equal(page.items.length, 2);
});

test("detail splits the heading, reads info rows and builds one chapter", () => {
  const { api } = load({ pages: { "https://missav.live/cn/aaa-001": DETAIL } });
  const result = api.detail("aaa-001");
  const drama = result.drama;
  assert.equal(drama.id, "missav:aaa-001");
  assert.equal(drama.title, "AAA-001 占位标题一 & 特殊字符 - 占位女优");
  assert.equal(drama.cover, "https://fourhoi.com/aaa-001/cover-n.jpg");
  assert.equal(drama.onlineDate, "2026-01-02");
  assert.equal(drama.badge, "1:02:03");
  assert.equal(JSON.stringify(drama.tags), JSON.stringify(["占位类型甲", "占位类型乙"]));
  assert.match(drama.intro, /番号：AAA-001/);
  assert.match(drama.intro, /女优：占位女优甲、占位女优乙/);
  assert.match(drama.intro, /发行商：占位发行商/);
  assert.match(drama.intro, /厂牌：占位厂牌/);
  assert.equal(result.chapters.length, 1);
  assert.equal(result.chapters[0].id, "missav:aaa-001:1");
  assert.equal(result.chapters[0].pageUrl, "https://missav.live/cn/aaa-001");
});

test("detail rejects a blank id and a missing page", () => {
  const blank = load();
  assert.throws(() => blank.api.detail("  "), /影片编号为空/);
  const missing = load({ pages: { "https://missav.live/cn/zzz-999": "<html><body>404</body></html>" } });
  assert.throws(() => missing.api.detail("zzz-999"), /没有找到该影片/);
});

test("resolveMedia unpacks the packed script and returns ordered variants", () => {
  const origin = "https://c.surrit.com/00000000-1111-2222-3333-444444444444";
  const { api, requests } = load({
    pages: { "https://missav.live/cn/aaa-001": DETAIL },
    playlists: { [origin + "/playlist.m3u8"]: MASTER }
  });
  const media = api.resolveMedia({
    dramaId: "missav:aaa-001",
    chapter: { id: "missav:aaa-001:1", source: "missav", pageUrl: "https://missav.live/cn/aaa-001" }
  });
  assert.equal(media.url, origin + "/1080p/video.m3u8");
  assert.equal(media.quality, 1080);
  assert.equal(media.durationMs, 3723000);
  assert.equal(media.referer, "https://missav.live/cn/aaa-001");
  assert.equal(media.variants.map((entry) => entry.quality).join(","), "1080,720,360");
  assert.equal(media.variants[0].url, origin + "/1080p/video.m3u8");
  assert(requests.some((request) => request.noCache === true));
});

test("resolveMedia falls back to the master playlist when levels fail", () => {
  const origin = "https://c.surrit.com/00000000-1111-2222-3333-444444444444";
  const { api } = load({ pages: { "https://missav.live/cn/aaa-001": DETAIL } });
  const media = api.resolveMedia({ dramaId: "missav:aaa-001", chapter: { pageUrl: "https://missav.live/cn/aaa-001" } });
  assert.equal(media.url, origin + "/playlist.m3u8");
  assert.equal(media.quality, 0);
  assert.equal(media.variants.length, 1);
});

test("resolveMedia falls back to the chapter page url when the id is unparsable", () => {
  const origin = "https://c.surrit.com/00000000-1111-2222-3333-444444444444";
  const { api } = load({
    pages: { "https://missav.live/cn/aaa-001": DETAIL },
    playlists: { [origin + "/playlist.m3u8"]: MASTER }
  });
  const media = api.resolveMedia({ dramaId: "", chapter: { pageUrl: "https://missav.live/cn/aaa-001" } });
  assert.equal(media.url, origin + "/1080p/video.m3u8");
});

test("resolveMedia reports a missing stream and a missing id", () => {
  const { api } = load({ pages: { "https://missav.live/cn/aaa-001": "<html><body>no stream</body></html>" } });
  assert.throws(
    () => api.resolveMedia({ dramaId: "missav:aaa-001", chapter: { pageUrl: "https://missav.live/cn/aaa-001" } }),
    /没有可用的播放地址/
  );
  assert.throws(() => api.resolveMedia({ dramaId: "", chapter: {} }), /播放信息无效/);
});

test("network failures are translated into readable messages", () => {
  const offline = load({ pages: { "https://missav.live/cn/new": new Error("connect timeout") } });
  assert.throws(() => offline.api.catalogPage(1, ""), /连接站点失败/);
  const forbidden = load({ pages: { "https://missav.live/cn/new": new Error("missav.live HTTP 403") } });
  assert.throws(() => forbidden.api.catalogPage(1, ""), /站点限制了当前请求/);
});

test("rankingPage numbers items and maps boards to sections", () => {
  const { api, requests } = load({ pages: () => LISTING });
  const page = api.rankingPage("missav-weekly", 2);
  assert.equal(requests[0].url, "https://missav.live/cn/weekly-hot?page=2");
  assert.equal(page.boardId, "missav-weekly");
  assert.equal(page.items.map((entry) => entry.rank).join(","), "1,2");
  assert.equal(page.items[0].drama.id, "missav:aaa-001");
  assert.throws(() => api.rankingPage("nope", 1), /未知榜单/);
});
