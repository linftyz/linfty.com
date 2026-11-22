/**
 * src/assets/brand/ → public/ 图标与 OG 图。
 * 跑 `pnpm assets` 重新生成；产物别手改，下次会覆盖。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";
import { themeConfig } from "../src/config.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

// 必须铺底板：Chrome 不支持 SVG favicon 的 prefers-color-scheme，
// 透明底在深色标签栏里会整个隐形
const PLATE = "#fbfaf6";
const INK = "#1b1b19";
const RADIUS = 0.2; // 圆角占边长的比例

// OG 图固定深色版，字标在深底上更立得住
const OG = {
  bg: "#1c1b19",
  glow: "#2a2724",
  heading: "#e4e4e7",
  slogan: "#8b7355",
  muted: "#5c5852",
  mark: "#e8e6e1",
};

// 字体靠系统提供（loadSystemFonts），这里只给跨平台的兜底列表：
// 找不到宋体就退到思源宋体，再退到任意衬线，Linux/CI 上也不会崩
const SERIF_STACK =
  "Songti SC, STSong, Noto Serif CJK SC, Source Han Serif SC, serif";
const MONO_STACK = "Menlo, SF Mono, DejaVu Sans Mono, Consolas, monospace";

const read = (file) => readFile(path.join(root, file), "utf8");

/** 取出 <svg> 内部内容 */
const inner = (svg) =>
  svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .trim();

const viewBox = (svg) =>
  /viewBox="([\d.\s-]+)"/.exec(svg)[1].trim().split(/\s+/).map(Number);

function render(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
}

/** 图标：mark 铺圆角底板 */
function iconSvg(mark, size) {
  // viewBox 是 "minX minY width height"，前两个是原点，第三个才是边长
  const [, , w] = viewBox(mark);
  const r = (w * RADIUS).toFixed(0);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${size}" height="${size}">
  <rect width="${w}" height="${w}" rx="${r}" fill="${PLATE}"/>
  <g color="${INK}">${inner(mark)}</g>
</svg>`;
}

/** OG 图 1200×630：字标居中偏上，标题与 slogan 依次排下 */
function ogSvg(logo) {
  const [, , lw, lh] = viewBox(logo);
  const markW = 236;
  const markH = (lh / lw) * markW;
  const cx = 600;
  const markTop = 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${OG.bg}"/>
  <radialGradient id="glow" cx="50%" cy="30%" r="58%">
    <stop offset="0" stop-color="${OG.glow}"/>
    <stop offset="0.72" stop-color="${OG.bg}"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(${cx - markW / 2} ${markTop}) scale(${markW / lw})" color="${OG.mark}">${inner(logo)}</g>
  <text x="${cx}" y="${markTop + markH + 58}" text-anchor="middle" font-family="${SERIF_STACK}" font-size="44" font-weight="600" letter-spacing="16" fill="${OG.heading}">${themeConfig.site.title}</text>
  <text x="${cx}" y="${markTop + markH + 102}" text-anchor="middle" font-family="${SERIF_STACK}" font-size="20" letter-spacing="8" fill="${OG.slogan}">${themeConfig.site.description}</text>
  <text x="${cx}" y="${markTop + markH + 160}" text-anchor="middle" font-family="${MONO_STACK}" font-size="15" letter-spacing="6" fill="${OG.muted}">${new URL(themeConfig.site.url).hostname}</text>
</svg>`;
}

async function main() {
  const mark = await read("src/assets/brand/mark.svg");
  const logo = await read("src/assets/brand/logo.svg");

  // ico 要先有各尺寸的 PNG，再交给 png-to-ico
  const frames = await Promise.all(
    [16, 32, 48].map((s) => render(iconSvg(mark, s), s)),
  );
  await writeFile(path.join(publicDir, "favicon.ico"), await pngToIco(frames));

  // 192 的 PNG 兼作 PWA 图标
  await writeFile(
    path.join(publicDir, "favicon.png"),
    render(iconSvg(mark, 192), 192),
  );

  // iOS 自己加圆角，底板要铺满，透明角会被填黑
  await writeFile(
    path.join(publicDir, "apple-touch-icon.png"),
    render(iconSvg(mark, 180), 180),
  );

  await writeFile(path.join(publicDir, "favicon.svg"), iconSvg(mark, 512));

  await writeFile(path.join(publicDir, "og.png"), render(ogSvg(logo), 1200));

  for (const f of [
    "favicon.ico",
    "favicon.png",
    "apple-touch-icon.png",
    "favicon.svg",
    "og.png",
  ]) {
    console.log(`  public/${f}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
