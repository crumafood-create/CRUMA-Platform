'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type MobileScannerProps = {
  onDetected: (code: string) => void;
};

export function MobileScanner({ onDetected }: MobileScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCodeRef = useRef('');

  // 1. Guardar siempre la versión más reciente del callback sin reiniciar la cámara
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startDetection = useCallback(() => {
    if (!window.BarcodeDetector) return;

    const detector = new window.BarcodeDetector({
      formats: ['qr_code', 'code_128', 'ean_13', 'ean_8'],
    });

    intervalRef.current = setInterval(async () => {
      try {
        if (!videoRef.current) return;
        const results = await detector.detect(videoRef.current);
        const value = results[0]?.rawValue?.trim();

        if (!value || lastCodeRef.current === value) return;

        lastCodeRef.current = value;
        
        // Ejecutamos la referencia actual
        onDetectedRef.current(value);

        // Desbloquear re-escaneo del mismo código tras 1.5s
        setTimeout(() => {
          lastCodeRef.current = '';
        }, 1500);
      } catch {
        // Tolerancia a fallos entre frames de video
      }
    }, 500);
  }, []); // Cero dependencias volátiles

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ('BarcodeDetector' in window) {
        setSupported(true);
        startDetection();
      } else {
        setSupported(false);
      }
    } catch {
      setError('No fue posible acceder a la cámara.');
    }
  }, [startDetection]);

  useEffect(() => {
    void startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

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
          Tu navegador no soporta el escaneo automático. Puedes escribir el número de lote manualmente.
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