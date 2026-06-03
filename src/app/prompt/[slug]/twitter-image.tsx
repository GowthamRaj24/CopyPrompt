/**
 * Twitter / X Large Card variant.
 *
 * Twitter renders the share card at a slightly taller aspect ratio than
 * the OG standard. Reusing the same OG generator and just overriding
 * the canvas size keeps the visual identical while letting Twitter
 * render it without cropping the top of the title.
 */
export { default, alt, contentType } from "./opengraph-image";
export { TWITTER_SIZE as size } from "@/lib/og/tokens";
