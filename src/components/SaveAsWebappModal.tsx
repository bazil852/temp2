import React from 'react';
import { X } from 'lucide-react';

interface SaveAsWebappModalProps {
  onClose: () => void;
}

export default function SaveAsWebappModal({ onClose }: SaveAsWebappModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Save as Webapp</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-4">
            <img
              src="https://i.postimg.cc/sDSSPSxx/IMG-2196.jpg"
              alt="Step 1"
              className="w-full rounded-lg"
            />
            <img
              src="https://i.postimg.cc/v8Cf6XQC/IMG-2197.jpg"
              alt="Step 2"
              className="w-full rounded-lg"
            />
          </div>
          <button
            onClick={onClose}
            className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}