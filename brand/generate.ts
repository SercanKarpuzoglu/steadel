/**
 * Renders PNG brand assets into brand/dist/:
 *   - shopify-app-icon.png (1200×1200) from logo-mark.svg
 *   - og-image.png (1200×630) for social sharing
 * Run: pnpm tsx brand/generate.ts
 * Note: libvips renders SVG <text> with system fonts, so the OG artwork
 * sticks to generic serif — visually close to Fraunces at this size.
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const dir = __dirname;
const dist = join(dir, "dist");
mkdirSync(dist, { recursive: true });

const OG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0f1b2d"/>
  <rect x="0" y="626" width="1200" height="4" fill="#f0a830"/>
  <g transform="translate(90,90) scale(1.6)">
    <rect width="64" height="64" rx="14" fill="#16263d" stroke="#2a3b55"/>
    <path d="M42.5 22.5c-1.8-3.4-5.6-5.5-10.2-5.5-6.2 0-10.8 3.6-10.8 8.7 0 4.4 3 6.9 8.6 8.2l4.4 1c3.4.8 4.9 2 4.9 4.3 0 2.8-2.8 4.8-6.8 4.8-4 0-6.9-1.8-7.7-4.8" fill="none" stroke="#f0a830" stroke-width="5" stroke-linecap="round"/>
  </g>
  <text x="90" y="330" font-family="Georgia, serif" font-weight="600" font-size="76" fill="#f5f1e8">steadel<tspan fill="#f0a830">.</tspan></text>
  <text x="90" y="420" font-family="Georgia, serif" font-size="44" fill="#f5f1e8">Steady operations for your store.</text>
  <text x="90" y="500" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#b9c2cf">Stock-aware ads guard · Low-stock alerts · Scheduled reports</text>
  <text x="90" y="560" font-family="Menlo, monospace" font-size="20" letter-spacing="4" fill="#f0a830">EU-HOSTED · GDPR-FIRST · SHOPIFY &amp; WOOCOMMERCE</text>
</svg>`;

async function main() {
  const mark = readFileSync(join(dir, "logo-mark.svg"));
  await sharp(mark, { density: 1200 })
    .resize(1200, 1200)
    .png()
    .toFile(join(dist, "shopify-app-icon.png"));

  await sharp(Buffer.from(OG_SVG), { density: 96 })
    .png()
    .toFile(join(dist, "og-image.png"));

  writeFileSync(join(dist, ".gitkeep"), "");
  console.log("brand/dist/ assets generated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
