// MissAV 站源模块
// 站点：missav.live（镜像 missav.ws），语言：简体中文 /cn/
// 运行环境是 goja：没有 fetch、URL、Buffer，网络与解析全部经由全局 host。
const SITES = ["https://missav.live", "https://missav.ws"];
const HOME_REFERER = SITES[0] + "/";
const MAX_PAGE = 2000;
const SITE_NAME = "MissAV";
const GENRE_PREFIX = "genre:";
const CARD_MARKER = 'class="thumbnail group"';

const GENRES = [
  { slug: "%E9%AB%98%E6%B8%85", name: "高清" },
  { slug: "%E7%8B%AC%E5%AE%B6", name: "独家" },
  { slug: "%E4%B8%AD%E5%87%BA", name: "中出" },
  { slug: "%E5%8D%95%E4%BD%93%E4%BD%9C%E5%93%81", name: "单体作品" },
  { slug: "%E5%B7%A8%E4%B9%B3", name: "巨乳" },
  { slug: "%E4%BA%BA%E5%A6%BB", name: "人妻" },
  { slug: "%E7%86%9F%E5%A5%B3", name: "熟女" },
  { slug: "%E7%B4%A0%E4%BA%BA", name: "素人" },
  { slug: "%E7%BE%8E%E5%B0%91%E5%A5%B3", name: "美少女" },
  { slug: "%E5%8F%A3%E4%BA%A4", name: "口交" },
  { slug: "%E5%A4%9A%E4%BA%BA%E8%BF%90%E5%8A%A8", name: "多人运动" },
  { slug: "%E9%AA%91%E4%B9%98", name: "骑乘" },
  { slug: "%E8%96%84%E6%A0%BC", name: "薄格" },
  { slug: "%E7%97%B4%E5%A5%B3", name: "痴女" },
  { slug: "4%E5%B0%8F%E6%97%B6%E4%BB%A5%E4%B8%8A", name: "4小时以上" },
  { slug: "%E5%A5%B3%E9%AB%98%E4%B8%AD%E7%94%9F", name: "女高中生" },
  { slug: "%E6%BD%AE%E5%90%B9", name: "潮吹" },
  { slug: "%E8%8B%97%E6%9D%A1", name: "苗条" },
  { slug: "%E8%87%AA%E6%8B%8D", name: "自拍" },
  { slug: "%E4%B9%B3%E4%BA%A4", name: "乳交" },
  { slug: "%E5%90%88%E9%9B%86", name: "合集" },
  { slug: "%E7%BE%8E%E4%B9%B3", name: "美乳" },
  { slug: "NTR", name: "NTR" },
  { slug: "%E6%81%8B%E7%89%A9%E7%99%96", name: "恋物癖" },
  { slug: "%E4%BC%81%E5%88%92", name: "企划" },
  { slug: "%E4%B9%B1%E4%BC%A6", name: "乱伦" },
  { slug: "%E9%A2%9C%E5%B0%84", name: "颜射" },
  { slug: "%E6%B7%AB%E4%B9%B1", name: "淫乱" },
  { slug: "%E6%90%AD%E8%AE%AA", name: "搭讪" },
  { slug: "%E5%81%B7%E6%8B%8D", name: "偷拍" },
  { slug: "%E5%89%A7%E6%83%85", name: "剧情" },
  { slug: "%E8%87%AA%E6%85%B0", name: "自慰" },
  { slug: "%E6%89%8B%E6%B7%AB", name: "手淫" },
  { slug: "%E5%A7%90%E5%A7%90", name: "姐姐" },
  { slug: "%E7%BA%AA%E5%BD%95%E7%89%87", name: "纪录片" }
];

const FIXED_CATEGORIES = [
  { id: "new", name: "最近更新", path: "/cn/new" },
  { id: "release", name: "新作上市", path: "/cn/release" },
  { id: "today-hot", name: "今日热门", path: "/cn/today-hot" },
  { id: "weekly-hot", name: "本周热门", path: "/cn/weekly-hot" },
  { id: "monthly-hot", name: "本月热门", path: "/cn/monthly-hot" },
  { id: "chinese-subtitle", name: "中文字幕", path: "/cn/chinese-subtitle" },
  { id: "uncensored-leak", name: "无码流出", path: "/cn/uncensored-leak" },
  { id: "vr", name: "VR", path: "/cn/genres/VR" },
  { id: "4k", name: "4K", path: "/cn/genres/4K" }
];

const BOARDS = {
  "missav-today": { path: "/cn/today-hot" },
  "missav-weekly": { path: "/cn/weekly-hot" },
  "missav-monthly": { path: "/cn/monthly-hot" },
  "missav-uncensored": { path: "/cn/uncensored-leak" }
};

const CATALOG = buildCatalog();

function buildCatalog() {
  const list = FIXED_CATEGORIES.slice();
  for (let index = 0; index < GENRES.length; index++) {
    const genre = GENRES[index];
    if (genre.slug === "4K") {
      continue;
    }
    list.push({ id: GENRE_PREFIX + genre.slug, name: genre.name, path: "/cn/genres/" + genre.slug });
  }
  return list;
}

function catalogEntry(category) {
  const id = String(category === undefined || category === null ? "" : category).trim();
  if (id === "") {
    return CATALOG[0];
  }
  for (let index = 0; index < CATALOG.length; index++) {
    if (CATALOG[index].id === id) {
      return CATALOG[index];
    }
  }
  return null;
}

function clampPage(page) {
  const value = Number(page);
  if (!isFinite(value) || value < 1) {
    return 1;
  }
  return Math.min(Math.floor(value), MAX_PAGE);
}

function pageSuffix(page) {
  return page > 1 ? "?page=" + page : "";
}

// ---------- 网络 ----------

function fetchPage(path, fresh) {
  let response;
  try {
    response = host.fetchText({
      url: SITES[0] + path,
      referer: HOME_REFERER,
      mirrors: [SITES[1] + path],
      noCache: fresh === true
    });
  } catch (error) {
    throw new Error(describeError(error));
  }
  return response && response.body ? String(response.body) : "";
}

function describeError(error) {
  const text = String((error && error.message) || error || "");
  if (text.indexOf("404") >= 0) {
    return "页面不存在，可能已下架";
  }
  if (/HTTP 403|HTTP 429/.test(text)) {
    return "站点限制了当前请求，请稍后重试";
  }
  if (/Cloudflare|验证|blocked/i.test(text)) {
    return "站点要求人机验证，请稍后重试";
  }
  if (/timeout|超时|Deadline|连接失败|网络/i.test(text)) {
    return "连接站点失败，请检查网络后重试";
  }
  return text || "请求站点失败";
}

function hasNextPage(body, page) {
  if (!body || page >= MAX_PAGE) {
    return false;
  }
  // 站点在最后一页仍会给出下一页链接，页面总数上限按 2000 兜住。
  return new RegExp('href="[^"]*[?&]page=' + (page + 1) + '"').test(body);
}

// ---------- 文本工具 ----------

function fromCode(code) {
  const value = Number(code);
  if (!isFinite(value) || value <= 0 || value > 1114111) {
    return "";
  }
  if (value < 128) {
    return String.fromCharCode(value);
  }
  if (value < 2048) {
    return String.fromCharCode(192 | (value >> 6), 128 | (value & 63));
  }
  if (value < 65536) {
    return String.fromCharCode(224 | (value >> 12), 128 | ((value >> 6) & 63), 128 | (value & 63));
  }
  return String.fromCharCode(240 | (value >> 18), 128 | ((value >> 12) & 63), 128 | ((value >> 6) & 63), 128 | (value & 63));
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-fA-F]+);/g, function (match, hex) {
      return fromCode(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (match, dec) {
      return fromCode(parseInt(dec, 10));
    })
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return decodeEntities(String(value).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (total <= 0) {
    return "";
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const rest = total % 60;
  return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (rest < 10 ? "0" : "") + rest;
}

// ---------- 列表解析 ----------

function cardPath(card) {
  const match = card.match(/href="https?:\/\/[^"\/]+\/(?:dm\d+\/)?[a-z]{2}\/([^"#?]+)"/);
  if (!match) {
    return "";
  }
  const path = match[1].replace(/\/+$/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(path) || !/\d/.test(path)) {
    return "";
  }
  return path;
}

function cardCover(card) {
  const match = card.match(/(?:data-src|src)="(https?:\/\/[^"]*\/cover[^"]*\.(?:jpg|jpeg|webp|png))"/i);
  return match ? match[1] : "";
}

function cardTitle(card) {
  const match = card.match(/<a\s+class="text-secondary group-hover:text-primary"[\s\S]*?>([\s\S]*?)<\/a>/);
  return match ? cleanText(match[1]) : "";
}

function cardDuration(card) {
  const match = card.match(/<span class="absolute bottom-1 right-1[^"]*">\s*([0-9:]+)\s*<\/span>/);
  return match ? match[1] : "";
}

function imageTitle(card) {
  const match = card.match(/<img[\s\S]*?alt="([^"]*)"/);
  return match ? cleanText(match[1]) : "";
}

function makeDrama(path, title, cover, duration) {
  const label = title || path;
  return {
    id: host.dramaId(path),
    source: host.source,
    sourceId: path,
    title: label,
    name: label,
    cover: cover,
    badge: duration,
    channelName: SITE_NAME,
    totalEpisode: 1
  };
}

function parseCards(body) {
  if (!body) {
    return [];
  }
  const parts = String(body).split(CARD_MARKER);
  const items = [];
  const seen = {};
  for (let index = 1; index < parts.length; index++) {
    const card = parts[index];
    const path = cardPath(card);
    if (!path || seen[path]) {
      continue;
    }
    seen[path] = true;
    const title = cardTitle(card) || imageTitle(card);
    items.push(makeDrama(path, title, cardCover(card), cardDuration(card)));
  }
  return items;
}

// ---------- 详情解析 ----------

function normalizeLabel(value) {
  return cleanText(value)
    .replace(/[：:]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseInfoRows(body) {
  const rows = {};
  const pattern = /<div class="text-secondary">\s*<span>([^<]{1,24})<\/span>([\s\S]*?)<\/div>/g;
  let match = pattern.exec(body);
  while (match !== null) {
    const key = normalizeLabel(match[1]);
    if (key && rows[key] === undefined) {
      rows[key] = match[2];
    }
    match = pattern.exec(body);
  }
  return rows;
}

function rowValue(rows, keys) {
  for (let index = 0; index < keys.length; index++) {
    const value = rows[keys[index]];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
}

function rowLinks(raw) {
  const found = [];
  const pattern = /<a\s[^>]*>([\s\S]*?)<\/a>/g;
  let match = pattern.exec(raw);
  while (match !== null) {
    const text = cleanText(match[1]);
    if (text && found.indexOf(text) < 0) {
      found.push(text);
    }
    match = pattern.exec(raw);
  }
  if (found.length > 0) {
    return found;
  }
  const plain = cleanText(raw);
  if (!plain) {
    return found;
  }
  const parts = plain.split(/[,，、]/);
  for (let index = 0; index < parts.length; index++) {
    const text = parts[index].trim();
    if (text) {
      found.push(text);
    }
  }
  return found;
}

function parseDetail(body) {
  const rows = parseInfoRows(body);
  const heading = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const image = body.match(/<meta property="og:image" content="([^"]+)"/);
  const seconds = body.match(/<meta property="og:video:duration" content="(\d+)"/);
  const dateRaw = rowValue(rows, ["发行日期", "release date", "released date"]);
  const dateMatch = dateRaw ? dateRaw.match(/datetime="([^"]+)"/) : null;
  const date = dateMatch ? dateMatch[1].slice(0, 10) : cleanText(dateRaw).slice(0, 10);
  return {
    title: heading ? cleanText(heading[1]) : "",
    cover: image ? image[1] : "",
    code: cleanText(rowValue(rows, ["番号", "code"])),
    date: date,
    duration: seconds ? formatDuration(Number(seconds[1])) : "",
    actresses: rowLinks(rowValue(rows, ["女优", "actress", "actresses"])),
    genres: rowLinks(rowValue(rows, ["类型", "genre", "genres"])),
    maker: cleanText(rowValue(rows, ["发行商", "maker"])),
    director: cleanText(rowValue(rows, ["导演", "director"])),
    label: cleanText(rowValue(rows, ["标籤", "标签", "label"]))
  };
}

function detailIntro(info) {
  const lines = [];
  if (info.code) {
    lines.push("番号：" + info.code);
  }
  if (info.date) {
    lines.push("发行日期：" + info.date);
  }
  if (info.duration) {
    lines.push("时长：" + info.duration);
  }
  if (info.actresses.length > 0) {
    lines.push("女优：" + info.actresses.join("、"));
  }
  if (info.maker) {
    lines.push("发行商：" + info.maker);
  }
  if (info.label && info.label !== info.maker) {
    lines.push("厂牌：" + info.label);
  }
  if (info.director) {
    lines.push("导演：" + info.director);
  }
  if (info.genres.length > 0) {
    lines.push("类型：" + info.genres.join("、"));
  }
  return lines.join("\n");
}

// ---------- 播放解析 ----------

function dramaPath(dramaId) {
  const text = String(dramaId || "");
  const cut = text.indexOf(":");
  if (cut < 0) {
    return "";
  }
  return text.slice(cut + 1).trim();
}

const STREAM_PATTERN = /(?:https?:)?\/\/((?:[a-z0-9-]+\.)*surrit\.com)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//;
const PACKED_CALL = /\}\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+|[0-9a-z]+)\s*,\s*(\d+|[0-9a-z]+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\.\s*split\(\s*'\|'\s*\)/g;

function unpackNumber(token) {
  return /^[0-9]+$/.test(token) ? Number(token) : parseInt(token, 36);
}

// 站点把播放地址放进 packer 压缩的脚本里，这里按同样的规则展开。
function unpackPacked(text) {
  const blocks = [];
  PACKED_CALL.lastIndex = 0;
  let call = PACKED_CALL.exec(text);
  while (call !== null) {
    const base = unpackNumber(call[2]);
    const count = unpackNumber(call[3]);
    if (base >= 2 && base <= 36 && count > 0 && count <= 4096) {
      const words = call[4].split("|");
      let output = call[1];
      for (let index = count - 1; index >= 0; index--) {
        const word = words[index];
        if (word) {
          output = output.split(new RegExp("\\b" + index.toString(base) + "\\b", "g")).join(word);
        }
      }
      blocks.push(output.replace(/\\/g, ""));
    }
    call = PACKED_CALL.exec(text);
  }
  return blocks.join("\n");
}

function streamOrigin(body) {
  const raw = String(body || "");
  const plain = raw.replace(/\\\//g, "/").match(STREAM_PATTERN);
  if (plain) {
    return "https://" + plain[1] + "/" + plain[2];
  }
  const unpacked = unpackPacked(raw).match(STREAM_PATTERN);
  if (!unpacked) {
    return "";
  }
  return "https://" + unpacked[1] + "/" + unpacked[2];
}

function playlistLevels(master, referer) {
  let playlist = "";
  let base = master;
  try {
    const result = host.fetchPlaylist({ url: master, referer: referer });
    if (result) {
      playlist = result.playlist ? String(result.playlist) : "";
      if (result.url) {
        base = String(result.url);
      }
    }
  } catch (error) {
    playlist = "";
  }
  if (playlist.indexOf("#EXTM3U") < 0) {
    return [];
  }
  const lines = playlist.replace(/\r/g, "").split("\n");
  const levels = [];
  let quality = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (line.indexOf("#EXT-X-STREAM-INF:") === 0) {
      const resolution = line.match(/RESOLUTION=\d+x(\d+)/);
      quality = resolution ? Number(resolution[1]) : 0;
      continue;
    }
    if (line === "" || line.charAt(0) === "#") {
      continue;
    }
    let address = "";
    try {
      address = host.resolveUrl(base, line);
    } catch (error) {
      address = "";
    }
    if (address) {
      levels.push({ url: address, quality: quality });
    }
    quality = 0;
  }
  levels.sort(function (left, right) {
    return right.quality - left.quality;
  });
  return levels;
}

function pageDurationMs(body) {
  const seconds = String(body || "").match(/<meta property="og:video:duration" content="(\d+)"/);
  return seconds ? Number(seconds[1]) * 1000 : 0;
}

function pathFromPageUrl(pageUrl) {
  const match = String(pageUrl || "").match(/\/(?:cn|en|ja|ko|zh)\/([a-z0-9][a-z0-9-]*)\s*$/i);
  return match ? match[1] : "";
}

function resolveMedia(task) {
  const chapter = (task && task.chapter) || {};
  let path = dramaPath(task && task.dramaId) || pathFromPageUrl(chapter.pageUrl);
  if (!path) {
    throw new Error("播放信息无效，请返回详情页重试");
  }
  const pageUrl = chapter.pageUrl ? String(chapter.pageUrl) : SITES[0] + "/cn/" + path;
  const body = fetchPage("/cn/" + path, true);
  const origin = streamOrigin(body);
  if (!origin) {
    throw new Error("该影片没有可用的播放地址，可能已下架");
  }
  const master = origin + "/playlist.m3u8";
  const durationMs = pageDurationMs(body);
  const levels = playlistLevels(master, pageUrl);
  const routes = levels.length > 0 ? levels : [{ url: master, quality: 0 }];
  const variants = [];
  for (let index = 0; index < routes.length; index++) {
    variants.push({
      url: routes[index].url,
      referer: pageUrl,
      quality: routes[index].quality,
      durationMs: durationMs
    });
  }
  const media = {
    url: variants[0].url,
    referer: pageUrl,
    quality: variants[0].quality,
    durationMs: durationMs,
    variants: variants
  };
  return media;
}

// ---------- 导出 ----------

function categories() {
  const list = [];
  for (let index = 0; index < CATALOG.length; index++) {
    list.push({ id: CATALOG[index].id, name: CATALOG[index].name });
  }
  return list;
}

function validCategory(category) {
  return catalogEntry(category) !== null;
}

function catalogPage(page, category) {
  const entry = catalogEntry(category);
  if (!entry) {
    throw new Error("MissAV 没有分类 " + category);
  }
  const index = clampPage(page);
  const body = fetchPage(entry.path + pageSuffix(index));
  const items = parseCards(body);
  return { items: items, hasMore: items.length > 0 && hasNextPage(body, index) };
}

function search(page, query) {
  const text = String(query === undefined || query === null ? "" : query).trim();
  if (text === "") {
    return { items: [], hasMore: false };
  }
  const index = clampPage(page);
  const body = fetchPage("/cn/search/" + encodeURIComponent(text) + pageSuffix(index));
  const items = parseCards(body);
  return { items: items, hasMore: items.length > 0 && hasNextPage(body, index) };
}

function detail(sourceId) {
  const path = String(sourceId === undefined || sourceId === null ? "" : sourceId).trim();
  if (path === "") {
    throw new Error("影片编号为空，请刷新列表后重试");
  }
  const body = fetchPage("/cn/" + path, true);
  const info = parseDetail(body);
  if (!info.title && !info.code) {
    throw new Error("没有找到该影片，可能已下架");
  }
  const pageUrl = SITES[0] + "/cn/" + path;
  const intro = detailIntro(info);
  const label = info.title || info.code || path;
  const drama = {
    id: host.dramaId(path),
    source: host.source,
    sourceId: path,
    title: label,
    name: label,
    cover: info.cover,
    intro: intro,
    desc: intro,
    tags: info.genres,
    onlineDate: info.date,
    badge: info.duration,
    channelName: SITE_NAME,
    totalEpisode: 1
  };
  const chapter = {
    id: host.chapterId(path, "1"),
    source: host.source,
    title: info.code || "正片",
    currentEpisode: 1,
    pageUrl: pageUrl,
    referer: pageUrl
  };
  return { drama: drama, chapters: [chapter] };
}

function rankingPage(boardId, page) {
  const id = String(boardId === undefined || boardId === null ? "" : boardId);
  const board = BOARDS[id];
  if (!board) {
    throw new Error("未知榜单 " + id);
  }
  const index = clampPage(page);
  const body = fetchPage(board.path + pageSuffix(index));
  const items = parseCards(body);
  const ranked = [];
  for (let cursor = 0; cursor < items.length; cursor++) {
    ranked.push({ rank: cursor + 1, drama: items[cursor] });
  }
  return {
    boardId: id,
    page: index,
    items: ranked,
    hasMore: items.length > 0 && hasNextPage(body, index)
  };
}

module.exports = {
  categories: categories,
  validCategory: validCategory,
  catalogPage: catalogPage,
  search: search,
  detail: detail,
  resolveMedia: resolveMedia,
  rankingPage: rankingPage
};
