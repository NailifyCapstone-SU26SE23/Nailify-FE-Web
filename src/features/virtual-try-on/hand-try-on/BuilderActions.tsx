import { useState } from 'react';
import type { HandLandmarkerTaskHandle } from '@/features/virtual-try-on/handLandmarkerTask';

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
        <div className="section-title">Adjust Selected Layer</div>
        <div className="transform-grid">
          <button id="ctrl-up" className="ctrl-btn" type="button">
            <span className="material-icons">expand_less</span>
          </button>
          <div className="middle-row">
            <button id="ctrl-left" className="ctrl-btn" type="button">
              <span className="material-icons">chevron_left</span>
            </button>
            <div className="zoom-controls">
              <button id="ctrl-zoom-in" className="ctrl-btn" type="button">
                <span className="material-icons">add</span>
              </button>
              <button id="ctrl-zoom-out" className="ctrl-btn" type="button">
                <span className="material-icons">remove</span>
              </button>
            </div>
            <button id="ctrl-right" className="ctrl-btn" type="button">
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
          <button id="ctrl-down" className="ctrl-btn" type="button">
            <span className="material-icons">expand_more</span>
          </button>
        </div>

        <div className="section-title">Layers</div>
        <div id="layers-list" className="layers-list">
          <div className="empty-layers">No decorations added</div>
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
