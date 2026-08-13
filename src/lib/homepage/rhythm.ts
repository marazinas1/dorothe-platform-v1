/**
 * Vertical rhythm for homepage blocks. One constant gap everywhere is what
 * makes a page read as a template: with every section the same distance apart,
 * a visitor gets no signal about which blocks belong together and which one is
 * an argument in its own right.
 *
 * Three steps, used deliberately:
 *  - `major`  an argument block opens after a clear break (who she is,
 *             credentials, the valuation offer)
 *  - `normal` the default distance between two independent blocks
 *  - `tight`  two blocks that belong together (property grid → sold work,
 *             credentials → seals) so they read as one object
 */
export const SECTION_GAP = {
  major: "mt-40 lg:mt-56",
  normal: "mt-24 lg:mt-32",
  tight: "mt-14 lg:mt-16",
} as const;

export type SectionGap = keyof typeof SECTION_GAP;

/** Inner padding for a block that must breathe (text-led argument blocks). */
export const BLOCK_PADDING_ROOMY = "py-16 lg:py-24";
