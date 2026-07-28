import { BuilderActions } from './BuilderActions';
import { BuilderControls } from './BuilderControls';
import type { HandLandmarkerTaskHandle } from '@/features/virtual-try-on/handLandmarkerTask';
import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

type BuilderViewProps = {
  currentNailSetId: string | null;
  handLandmarkerTask: HandLandmarkerTaskHandle | null;
  onReturnToForm: () => void;
  onSaveDraft?: () => void;
};

export function BuilderView({ currentNailSetId, handLandmarkerTask, onReturnToForm, onSaveDraft }: BuilderViewProps) {
  const previewLabels = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div id="builder-view" className="view-step active">
      <div className="builder-layout">
        <section className={`builder-preview-row ${isZoomed ? 'zoomed' : ''}`} aria-label="Nail previews">
          <button 
            type="button" 
            className="zoom-toggle-btn" 
            onClick={() => setIsZoomed(!isZoomed)}
            title="Toggle zoom"
          >
            {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          {previewLabels.map((label, index) => (
            <button className="nail-preview-card" data-index={index} key={label} type="button">
              <span>{label}</span>
              <canvas id={`nail-preview-canvas-${index}`} width="320" height="420" />
            </button>
          ))}
        </section>

        <BuilderControls />

        <BuilderActions
          currentNailSetId={currentNailSetId}
          handLandmarkerTask={handLandmarkerTask}
          onReturnToForm={onReturnToForm}
          onSaveDraft={onSaveDraft}
        />
      </div>
    </div>
  );
}
