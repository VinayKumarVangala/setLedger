import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    qrScanner.render(
      (decodedText) => {
        onScan(decodedText);
        qrScanner.clear();
      },
      (error) => {
        console.warn('QR scan error:', error);
      }
    );

    setScanner(qrScanner);
    setIsScanning(true);

    return () => {
      if (qrScanner) {
        qrScanner.clear().catch(console.error);
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
    }
    onClose();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && scanner) {
      scanner.scanFile(file, true)
        .then((decodedText) => {
          onScan(decodedText);
          handleClose();
        })
        .catch((error) => {
          console.error('File scan error:', error);
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Scan QR Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div id="qr-reader" className="w-full"></div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Position the QR code within the frame to scan
            </p>
            
            <div className="flex items-center justify-center">
              <label className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload QR Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;