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
  <rect width="1200" height="630" fill="#064e3b"/>
  <rect x="0" y="626" width="1200" height="4" fill="#f8e7c9"/>
  <g transform="translate(90,90) scale(1.6)">
    <rect width="64" height="64" rx="14" fill="#0a5a45" stroke="#1c6b55"/>
    <path d="M46 18 H28 Q20 18 20 25 Q20 32 28 32 H36 Q44 32 44 39 Q44 46 36 46 H18" fill="none" stroke="#f8e7c9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="90" y="330" font-family="Georgia, serif" font-weight="600" font-size="76" fill="#f8e7c9">steadel<tspan fill="#f8e7c9">.</tspan></text>
  <text x="90" y="420" font-family="Georgia, serif" font-size="44" fill="#f8e7c9">Steady operations for your store.</text>
  <text x="90" y="500" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#c3d6cd">Stock-aware ads guard · Low-stock alerts · Scheduled reports</text>
  <text x="90" y="560" font-family="Menlo, monospace" font-size="20" letter-spacing="4" fill="#f8e7c9">EU-HOSTED · GDPR-FIRST · SHOPIFY &amp; WOOCOMMERCE</text>
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
