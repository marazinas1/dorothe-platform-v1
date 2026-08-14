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
  major: "mt-28 lg:mt-36",
  normal: "mt-20 lg:mt-24",
  tight: "mt-12 lg:mt-14",
} as const;

export type SectionGap = keyof typeof SECTION_GAP;

/** Inner padding for a block that must breathe (text-led argument blocks). */
export const BLOCK_PADDING_ROOMY = "py-14 lg:py-20";
