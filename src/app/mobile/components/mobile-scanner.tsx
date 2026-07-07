'use client';

import { useEffect, useRef, useState } from 'react';

type MobileScannerProps = {
  onDetected: (code: string) => void;
};

type BarcodeDetectorType = {
  detect(
    source: HTMLVideoElement,
  ): Promise<
    Array<{
      rawValue?: string;
    }>
  >;
};

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: {
        formats?: string[];
      }): BarcodeDetectorType;
    };
  }
}

export default function MobileScanner({
  onDetected,
}: MobileScannerProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const intervalRef =
    useRef<NodeJS.Timeout | null>(null);

  const lastCodeRef =
    useRef('');

  const [error, setError] =
    useState<string | null>(null);

  const [supported, setSupported] =
    useState(false);

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setError(null);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment',
            },
          },
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      if (
        typeof window !== 'undefined' &&
        'BarcodeDetector' in window
      ) {
        setSupported(true);
        startDetection();
      } else {
        setSupported(false);
      }
    } catch {
      setError(
        'No fue posible acceder a la cámara.',
      );
    }
  }

  function stopCamera() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());
  }

  function startDetection() {
    if (!window.BarcodeDetector) {
      return;
    }

    const detector =
      new window.BarcodeDetector({
        formats: [
          'qr_code',
          'code_128',
          'ean_13',
          'ean_8',
        ],
      });

    intervalRef.current =
      setInterval(async () => {
        try {
          if (!videoRef.current) {
            return;
          }

          const codes =
            await detector.detect(
              videoRef.current,
            );

          if (codes.length === 0) {
            return;
          }

          const value =
            codes[0]?.rawValue?.trim();

          if (!value) {
            return;
          }

          if (
            lastCodeRef.current === value
          ) {
            return;
          }

          lastCodeRef.current = value;

          onDetected(value);

          setTimeout(() => {
            lastCodeRef.current = '';
          }, 1500);
        } catch {
          // Ignorar errores de lectura
        }
      }, 500);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
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
          Tu navegador no soporta el escaneo automático.
          Puedes escribir el número de lote manualmente.
        </div>
      )}

      {supported && !error && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
          📷 Escáner listo. Apunta la cámara al código del lote.
        </div>
      )}
    </div>
  );
}
