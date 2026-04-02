import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ images, initialIndex, isOpen, onClose, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, onClose]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen || !images.length) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300 select-none"
      onClick={onClose}
    >
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 hover:scale-110 active:scale-95 group"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Navigation - Left */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:text-white transition-all z-20 hidden md:block"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main Image Container */}
      <div 
        className="w-full h-full flex items-center justify-center p-4 md:p-12"
        onClick={onClose}
      >
        <div 
          className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={images[currentIndex]}
            src={images[currentIndex]}
            alt={alt || "Phóng to ảnh"}
            className="w-full h-full max-w-full max-h-[85vh] md:max-h-[90vh] object-contain rounded-xl shadow-[0_0_80px_rgba(34,197,94,0.1)] animate-in zoom-in-95 duration-500"
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">
            <Maximize2 className="w-4 h-4" /> GreenMarket High Fidelity
          </div>
        </div>
      </div>

      {/* Navigation - Right */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:text-white transition-all z-20 hidden md:block"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Mobile Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 md:hidden z-20">
          <button onClick={handlePrev} className="p-5 rounded-2xl bg-white/10 border border-white/10 text-white active:bg-emerald-500"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={handleNext} className="p-5 rounded-2xl bg-white/10 border border-white/10 text-white active:bg-emerald-500"><ChevronRight className="w-6 h-6" /></button>
        </div>
      )}
    </div>
  );
};

export default ImageModal;
