// src/types/barcode.d.ts
interface BarcodeDetectorType {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}

interface Window {
  BarcodeDetector?: {
    new (options?: { formats?: string[] }): BarcodeDetectorType;
  };
}