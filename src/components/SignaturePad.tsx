import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  label?: string;
  required?: boolean;
}

export function SignaturePad({ onSave, label = 'Signature', required = true }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onSave(dataURL);
      setIsEmpty(false);
    }
  };

  // Check if canvas is empty on stroke end
  const handleEnd = () => {
    if (sigCanvas.current) {
      setIsEmpty(sigCanvas.current.isEmpty());
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-heading font-semibold text-ink-primary mb-2">
        {label} {required && <span className="text-sunset-red">*</span>}
      </label>

      <div className="border-4 border-ink-primary rounded-sm bg-parchment-base p-2">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-40 md:h-48 bg-white rounded-sm cursor-crosshair touch-none',
            style: { touchAction: 'none' }
          }}
          backgroundColor="white"
          penColor="#1a1512"
          minWidth={2}
          maxWidth={4}
          onEnd={handleEnd}
        />
      </div>

      <div className="flex gap-3 mt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={clear}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </Button>

        {!isEmpty && (
          <div className="flex items-center gap-2 text-sm text-forest-green font-heading">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Signature captured
          </div>
        )}
      </div>

      {required && isEmpty && (
        <p className="text-xs text-ink-faded mt-2">
          Sign above using your finger or stylus
        </p>
      )}
    </div>
  );
}
