import probe from "probe-image-size";

/**
 * Probe a remote image URL for its actual width and height without
 * downloading the full file. Reads just enough bytes to parse the
 * header.
 *
 * Returns sensible defaults (800×800) when probing fails — failure
 * is silent because the moderation flow shouldn't bail on a single
 * unreachable image, but the resulting card will look distorted, so
 * admins should know to re-submit.
 */
export async function probeImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  try {
    // 10s timeout — Cloudflare R2 / picsum is fast enough.
    const result = await probe(url, { timeout: 10_000 });
    return { width: result.width, height: result.height };
  } catch (err) {
    console.warn(
      `[image-dimensions] failed to probe ${url}; falling back to 800×800`,
      err,
    );
    return { width: 800, height: 800 };
  }
}
