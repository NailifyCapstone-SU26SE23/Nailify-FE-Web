import { useState } from 'react';
import type { HandLandmarkerTaskHandle } from '../handLandmarkerTask';

type BuilderActionsProps = {
  currentNailSetId: string | null;
  handLandmarkerTask: HandLandmarkerTaskHandle | null;
  onReturnToForm: () => void;
  onSaveDraft?: () => void;
};

export function BuilderActions({ handLandmarkerTask, onReturnToForm, onSaveDraft }: BuilderActionsProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    if (!handLandmarkerTask) return;

    setSaveStatus('saving');
    onSaveDraft?.();
    setSaveStatus('saved');
  };

  return (
    <div className="builder-actions">
      <section className="builder-panel builder-layer-panel">
        <div className="section-title">Layers</div>
        <div id="layers-list" className="layers-list">
          <div className="empty-layers">No decorations added</div>
        </div>

        <div className="decoration-instructions">
          <p>💡 <strong>Drag</strong> to move · <strong>Drag corner</strong> to resize</p>
        </div>
      </section>

      <section className="builder-bottom-actions">
        <button
          className="action-btn green"
          disabled={!handLandmarkerTask || saveStatus === 'saving'}
          onClick={() => void handleSave()}
          type="button"
        >
          <span className="material-icons">save</span>
          {saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
        <button id="btn-image-flow" className="action-btn blue" type="button">
          <span className="material-icons">image</span>
          Photo Try On
        </button>
        <button id="btn-ar-live" className="action-btn pink" type="button">
          <span className="material-icons">videocam</span>
          Live Try On
        </button>
        <button className="action-btn neutral" disabled={!handLandmarkerTask} onClick={onReturnToForm} type="button">
          <span className="material-icons">arrow_back</span>
          Back
        </button>
        {saveStatus === 'saved' ? <div className="status-text">Saved to draft</div> : null}
        {saveStatus === 'error' ? <div className="status-text">Save failed</div> : null}
      </section>
    </div>
  );
}
