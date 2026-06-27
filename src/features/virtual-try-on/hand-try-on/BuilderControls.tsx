import { useEffect, useState } from 'react';
import {
  getComponents,
  getNailShapes,
  getNailSurfaces,
  type Component,
  type NailShape,
  type NailSurface,
} from '@/services/nailDesign.service';

export function BuilderControls() {
  const [nailShapes, setNailShapes] = useState<NailShape[]>([]);
  const [nailSurfaces, setNailSurfaces] = useState<NailSurface[]>([]);
  const [componentsByType, setComponentsByType] = useState<Record<number, Component[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
  });

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getNailShapes(),
      getNailSurfaces(),
      getComponents(0),
      getComponents(1),
      getComponents(2),
      getComponents(3),
    ])
      .then(([loadedShapes, loadedSurfaces, loadedGems, loadedStickers, loadedCharms, loadedArt]) => {
        if (ignore) return;
        setNailShapes(loadedShapes);
        setNailSurfaces(loadedSurfaces);
        setComponentsByType({
          0: loadedGems,
          1: loadedStickers,
          2: loadedCharms,
          3: loadedArt,
        });
      })
      .catch(() => {
        if (ignore) return;
        setNailShapes([]);
        setNailSurfaces([]);
        setComponentsByType({ 0: [], 1: [], 2: [], 3: [] });
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="builder-controls-grid">
      <section className="builder-panel builder-style-panel">
        <div className="section-title">Nail Shape</div>
        <div className="shape-selector">
          {nailShapes.length > 0 ? (
            nailShapes.map((shape, index) => (
              <button
                className={`shape-btn ${index === 0 ? 'active' : ''}`}
                data-shape={shape.name}
                data-shape-image-url={shape.imageUrl ?? ''}
                key={shape.id}
                type="button"
              >
                {shape.imageUrl ? (
                  <img alt="" className="shape-thumb" crossOrigin="anonymous" src={shape.imageUrl} />
                ) : null}
                {shape.name}
              </button>
            ))
          ) : (
            <div className="empty-layers">No nail shapes found</div>
          )}
        </div>

        <div className="section-title">Nail Color</div>
        <div className="color-palette">
          <div className="color-swatch" data-color="#FF0000" style={{ background: '#ff0000' }} />
          <div className="color-swatch" data-color="#0000FF" style={{ background: '#0000ff' }} />
          <div className="color-swatch" data-color="#F5CBA7" style={{ background: '#f5cba7' }} />
          <div className="color-swatch active" data-color="#FF4081" style={{ background: '#ff4081' }} />
          <input type="color" id="custom-color" defaultValue="#FF4081" title="Main Color" />
        </div>

        <div className="gradient-section">
          <label className="toggle-container">
            <input type="checkbox" id="enable-gradient" />
            <span className="toggle-label">Enable Gradient</span>
          </label>
          <div id="gradient-controls" className="gradient-controls" style={{ display: 'none' }}>
            <div className="gradient-stops">
              <input type="color" id="gradient-color-1" defaultValue="#FF4081" title="Start Color" />
              <input type="color" id="gradient-color-2" defaultValue="#FFFFFF" title="Middle Color" />
              <input type="color" id="gradient-color-3" defaultValue="#000000" title="End Color" />
            </div>
            <select id="gradient-type" className="gradient-type-select" defaultValue="linear">
              <option value="linear">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="radial">Radial</option>
            </select>
            <div className="stop-count-selector">
              <label>
                <input type="radio" name="stop-count" value="2" defaultChecked /> 2 Colors
              </label>
              <label>
                <input type="radio" name="stop-count" value="3" /> 3 Colors
              </label>
            </div>
          </div>
        </div>

        <div className="material-section">
          <div className="section-title">Nail Surface</div>
          <div className="material-grid">
            {nailSurfaces.length > 0 ? (
              nailSurfaces.map((surface, index) => (
                <button
                  className={`material-btn ${index === 0 ? 'active' : ''}`}
                  data-material={surface.shaderParam.toLowerCase()}
                  key={surface.id}
                  type="button"
                >
                  {surface.name}
                </button>
              ))
            ) : (
              <div className="empty-layers">No nail surfaces found</div>
            )}
          </div>
        </div>
      </section>

      <section className="builder-panel builder-component-panel">
        <button id="btn-upload-custom" className="action-btn orange" type="button">
          <span className="material-icons">upload_file</span>
          Upload Custom Nail Image
        </button>
        <ComponentPicker title="Gem" type="gem" components={componentsByType[0]} />
        <ComponentPicker title="Sticker" type="sticker" components={componentsByType[1]} />
        <ComponentPicker title="Charm" type="charm" components={componentsByType[2]} />
        <ComponentPicker title="Art" type="art" components={componentsByType[3]} />
      </section>
    </div>
  );
}

function ComponentPicker({
  components,
  title,
  type,
}: {
  components: Component[];
  title: string;
  type: 'gem' | 'sticker' | 'charm' | 'art';
}) {
  return (
    <>
      <div className="section-title">{title}</div>
      <div className="extras-grid">
        {components.length > 0 ? (
          components.map((component) => (
            <button
              className="extra-item component-decoration-btn"
              data-component-id={component.id}
              data-component-type={type}
              data-image-url={component.imageUrl ?? ''}
              disabled={!component.imageUrl}
              key={component.id}
              type="button"
            >
              {component.imageUrl ? (
                <img alt="" className="layer-thumb" crossOrigin="anonymous" src={component.imageUrl} />
              ) : null}
              <span>{component.name}</span>
            </button>
          ))
        ) : (
          <div className="empty-layers">No {title.toLowerCase()} components found</div>
        )}
      </div>
    </>
  );
}
