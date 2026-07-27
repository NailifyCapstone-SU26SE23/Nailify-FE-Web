import { PropTypes } from "../../../../shared/utils/propTypes";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseShaderParam(shaderParam) {
  const rawValue = String(shaderParam || "").trim();
  if (!rawValue) return {};
  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function getMaterialProps(surface) {
  const config = parseShaderParam(surface?.shaderParam);

  const textureType = String(config?.texture?.type || "").toLowerCase();
  const isMatte = textureType.includes("matte") || config?.shine?.enabled === false;
  const isChrome = Boolean(config?.metalness?.enabled || config?.mirrorEffect?.enabled);
  const hasRainbow = Boolean(config?.rainbow?.enabled || config?.prism?.enabled || config?.iridescence?.enabled);

  // Use a fixed soft pink base color for all previews so surfaces are easily comparable
  const color = new THREE.Color("#ffb1c8");

  const roughness = clamp(Number(config?.texture?.roughness ?? (isMatte ? 0.8 : 0.2)), 0, 1);
  const metalness = isChrome ? clamp(Number(config?.metalness?.intensity || 0.8), 0, 1) : 0;
  const clearcoat = isMatte ? 0 : clamp(Number(config?.shine?.opacity || 1), 0, 1);
  const iridescence = hasRainbow ? clamp(Number(config?.iridescence?.intensity || 0.8), 0, 1) : 0;

  return {
    color,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness: 0.1,
    iridescence,
    iridescenceIOR: 1.5,
    maskDataUrl: surface?.maskDataUrl,
  };
}

function NailMesh({ position, rotation, materialProps }) {
  const geoRef = useRef();

  useEffect(() => {
    if (geoRef.current) {
      const positions = geoRef.current.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);

        // Taper towards the tip (coffin shape)
        if (y > 0) {
          const taper = 1.0 - y * 0.15;
          x *= taper;
          if (y > 0.4) {
            y = 0.4 + (y - 0.4) * 0.4;
          }
        }

        // C-curve (arch) - bend edges backwards
        // Stronger arch near the tip
        const archStrength = 2.0 + (y > 0 ? y * 1.5 : 0);
        z -= Math.pow(x, 2) * archStrength;

        positions.setX(i, x);
        positions.setY(i, y);
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;
      geoRef.current.computeVertexNormals();
    }
  }, []);

  const materialRef = useRef();

  useEffect(() => {
    if (materialProps.maskDataUrl && materialRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        materialRef.current.roughnessMap = texture;
        materialRef.current.roughness = 1; // map multiplies base value
        materialRef.current.needsUpdate = true;
      };
      img.src = materialProps.maskDataUrl;
    } else if (materialRef.current) {
      materialRef.current.roughnessMap = null;
      materialRef.current.needsUpdate = true;
    }
  }, [materialProps.maskDataUrl]);

  // Extract maskDataUrl so it doesn't get passed to meshPhysicalMaterial as an invalid prop
  const { maskDataUrl, ...validMaterialProps } = materialProps;

  return (
    <mesh position={position} rotation={rotation} scale={[1.1, 1.0, 0.22]} castShadow receiveShadow>
      {/* Long and elegant capsule for Coffin nail */}
      <capsuleGeometry ref={geoRef} args={[0.35, 1.4, 64, 64]} />
      <meshPhysicalMaterial ref={materialRef} {...validMaterialProps} />
    </mesh>
  );
}

NailMesh.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  rotation: PropTypes.arrayOf(PropTypes.number).isRequired,
  materialProps: PropTypes.object.isRequired,
};

export function NailSurfacePreview({ surface, compact = false }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const materialProps = useMemo(() => getMaterialProps(surface), [surface]);
  const numNails = compact ? 1 : 5;

  return (
    <>
      <div className={compact ? "inline-flex items-center gap-3" : "rounded-[24px] border border-[#f7d7e5] bg-white p-4"}>
        <div
          className={`group relative overflow-hidden ${
            compact
              ? "rounded-[18px] bg-[radial-gradient(circle_at_top,#fff6fb_0%,#fff2f8_100%)] p-0 w-[60px] h-[80px]"
              : "rounded-[20px] bg-[radial-gradient(circle_at_top,#fff6fb_0%,#fff0f7_55%,#fff8fb_100%)] p-0 w-full h-[240px]"
          }`}
        >
          <button
            onClick={() => setIsZoomed(true)}
            title="Zoom"
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#432744] opacity-0 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-105 group-hover:opacity-100"
          >
            <span className="material-icons text-[18px]">zoom_out_map</span>
          </button>
          
          <Canvas camera={{ position: [0, 0, compact ? 3.5 : 5], fov: 45 }}>
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

            {Array.from({ length: numNails }).map((_, index) => {
              const xOffset = compact ? 0 : (index - 2) * 0.9;
              return (
                <NailMesh
                  key={index}
                  position={[xOffset, 0, 0]}
                  rotation={[0, 0, 0]}
                  materialProps={materialProps}
                />
              );
            })}

            <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
            <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
          </Canvas>
        </div>

        {!compact && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#432744]">{surface?.name || "Surface Preview"}</p>
              <p className="mt-1 text-xs text-[#9a7388]">3D physically based rendering preview.</p>
            </div>
          </div>
        )}
      </div>

      {isZoomed &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#432744]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative h-[90vh] w-[90vw] max-w-6xl overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,#fff6fb_0%,#fff0f7_55%,#fff8fb_100%)] shadow-2xl animate-in zoom-in-95 duration-300">
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/60 text-[#432744] shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white"
              >
                <span className="material-icons">close</span>
              </button>

              <div className="absolute left-6 top-6 z-10 rounded-2xl bg-white/60 px-6 py-3 shadow-sm backdrop-blur-md">
                <p className="text-lg font-bold text-[#432744]">{surface?.name || "Detailed Preview"}</p>
                <p className="text-sm text-[#9a7388]">Drag to rotate, scroll to zoom in/out.</p>
              </div>

              <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                <Environment preset="studio" />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

                {Array.from({ length: 5 }).map((_, index) => {
                  return (
                    <NailMesh
                      key={index}
                      position={[(index - 2) * 0.95, 0, 0]}
                      rotation={[0, 0, 0]}
                      materialProps={materialProps}
                    />
                  );
                })}

                <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={15} blur={2.5} far={4} />
                <OrbitControls enableZoom={true} enablePan={true} maxDistance={8} minDistance={2} />
              </Canvas>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

NailSurfacePreview.propTypes = {
  compact: PropTypes.bool,
  surface: PropTypes.shape({
    hueOffset: PropTypes.number,
    lightnessOffset: PropTypes.number,
    name: PropTypes.string,
    saturationOffset: PropTypes.number,
    shaderParam: PropTypes.string,
    maskDataUrl: PropTypes.string,
  }),
};


