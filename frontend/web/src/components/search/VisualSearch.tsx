import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisualSearch({ isOpen, onClose }: Props) {
  const [scanning, setScanning] = useState(false);

  if (!isOpen) return null;

  const handleUpload = () => {
    setScanning(true);
    setTimeout(() => {
        setScanning(false);
        // Mock result
        alert('Found 3 matching items! (Mock)');
        onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden relative">
            <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 rounded-full text-white hover:bg-black/40">✕</button>
            
            <div className="h-96 bg-gray-900 relative flex flex-col items-center justify-center overflow-hidden">
                {scanning && (
                     <div className="absolute inset-0 z-0">
                         <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)] animate-scan"></div>
                     </div>
                )}
                
                {!scanning ? (
                    <>
                        <div className="w-64 h-64 border-2 border-white/30 rounded-xl relative mb-6">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                            <div className="w-full h-full flex items-center justify-center text-white/50 text-6xl">📷</div>
                        </div>
                        <p className="text-white font-medium mb-8">Point at an object or upload photo</p>
                        
                        <label className="cursor-pointer bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform">
                            Upload Photo
                            <input type="file" className="hidden" onChange={handleUpload} />
                        </label>
                    </>
                ) : (
                    <div className="text-center text-white">
                        <div className="w-16 h-16 border-4 border-white/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="font-bold text-lg animate-pulse">Analyzing Image...</p>
                        <p className="text-xs text-white/60">Searching global inventory</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
