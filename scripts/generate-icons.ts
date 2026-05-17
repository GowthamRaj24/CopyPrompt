/**
 * Generate favicon + PWA icons from public/logo_transparent.png
 * Run: npx tsx scripts/generate-icons.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const sharp = (await import("sharp")).default;
  const root = path.join(process.cwd(), "public");
  const src = path.join(root, "logo_transparent.png");

  const sizes = [
    { name: "icon-32.png", size: 32 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-icon.png", size: 180 },
  ] as const;

  for (const { name, size } of sizes) {
    const buf = await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await writeFile(path.join(root, name), buf);
    console.log(`✓ public/${name}`);
  }

  const appDir = path.join(process.cwd(), "src", "app");
  await mkdir(appDir, { recursive: true });
  const icon32 = await sharp(src)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writeFile(path.join(appDir, "icon.png"), icon32);
  await writeFile(path.join(appDir, "apple-icon.png"), await sharp(src)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer());
  console.log("✓ src/app/icon.png");
  console.log("✓ src/app/apple-icon.png");

  const favicon = await sharp(src)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writeFile(path.join(root, "favicon.ico"), favicon);
  console.log("✓ public/favicon.ico (PNG-in-ICO fallback; browsers accept)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
