import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      );

      setScanning(true);
      setError('');
    } catch (err: any) {
      setError('Failed to start camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error(err);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scan QR Code</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div id="qr-reader" className="w-full"></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!scanning ? (
          <Button onClick={startScanning} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="destructive" className="w-full">
            Stop Scanning
          </Button>
        )}
      </CardContent>
    </Card>
  );
}