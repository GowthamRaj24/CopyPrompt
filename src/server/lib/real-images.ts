import { notLike } from "drizzle-orm";
import { images } from "@/server/models/image.model";

/**
 * Hosts that served random stock placeholders for the seed catalog.
 *
 * Those photos are NOT outputs of the prompts they were attached to, so
 * showing them next to an image prompt misrepresents the prompt (and is an
 * AdSense "misrepresentative content" problem). Every image query filters
 * them out; prompts without a real image render the "no sample yet" state.
 */
const PLACEHOLDER_IMAGE_PATTERN = "%picsum.photos%";

/** SQL condition: keep only real (non-placeholder) image rows. */
export function realImagesOnly() {
  return notLike(images.cdnUrl, PLACEHOLDER_IMAGE_PATTERN);
}
