import type { ScanResponse } from "@/types/scan";

/** Implement later: server route or `window.print()` + styled template. */
export type ResultPdfExportHandler = (result: ScanResponse) => void | Promise<void>;

/** Implement later: `mailto:` with summary, or transactional e-mail API. */
export type ResultEmailHandler = (result: ScanResponse) => void | Promise<void>;
