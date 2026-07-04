'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

type MobileScannerProps = {
  onDetected: (
    code: string,
  ) => void;
};

export default function MobileScanner({
  onDetected,
}: MobileScannerProps) {
  const videoRef =
    useRef<HTMLVideoElement>(
      null,
    );

  const streamRef =
    useRef<MediaStream | null>(
      null,
    );

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null,
    );

  const detectedRef =
    useRef(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [supported, setSupported] =
    useState(false);

  useEffect(() => {
    void startCamera();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    try {
      setError(null);

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: 'environment',
            },
          },
        );

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const hasBarcodeDetector =
        typeof window !== 'undefined' &&
        'BarcodeDetector' in window;

      setSupported(hasBarcodeDetector);

      if (hasBarcodeDetector) {
        void startDetection();
      }
    } catch {
      setError('No fue posible acceder a la cámara.');
    }
  }

  function cleanup() {
    detectedRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startDetection() {
    const BarcodeDetectorClass =
      (
        window as Window & {
          BarcodeDetector?: new (
            options?: { formats?: string[] },
          ) => {
            detect(
              source:
                | HTMLVideoElement
                | HTMLImageElement
                | HTMLCanvasElement,
            ): Promise<
              {
                rawValue?: string;
              }[]
            >;
          };
        }
      ).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      return;
    }

    const detector = new BarcodeDetectorClass({
      formats: [
        'qr_code',
        'code_128',
        'ean_13',
        'ean_8',
      ],
    });

    intervalRef.current = setInterval(async () => {
      try {
        if (detectedRef.current || !videoRef.current) {
          return;
        }

        const codes = await detector.detect(videoRef.current);

        if (codes.length > 0) {
          const value = codes[0]?.rawValue?.trim();

          if (value) {
            detectedRef.current = true;
            onDetected(value);
            cleanup();
          }
        }
      } catch {
        //
      }
    }, 800);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="h-72 w-full object-cover"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!supported && !error && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
          Tu navegador no soporta escaneo automático. Puedes escribir el código
          manualmente.
        </div>
      )}
    </div>
  );
}
