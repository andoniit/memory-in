// Minimal ambient types for the Web NFC API (Chrome on Android).
// Not yet in lib.dom, so we declare the bits we use.
interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: string | BufferSource;
  encoding?: string;
  lang?: string;
}

interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

interface NDEFWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}

declare class NDEFReader {
  constructor();
  write(
    message: string | NDEFMessageInit,
    options?: NDEFWriteOptions,
  ): Promise<void>;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
}
