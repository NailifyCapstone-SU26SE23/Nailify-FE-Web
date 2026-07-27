import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState, useCallback } from "react";
import { PropTypes } from "../../../../shared/utils/propTypes";

function applyCoffinShape(geometry) {
  const positions = geometry.attributes.position;
  
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
  geometry.computeVertexNormals();
}

function PainterMesh({ brushType, brushSize, onCanvasChange, initialMaskDataUrl }) {
  const geoRef = useRef();
  const materialRef = useRef();
  
  const canvasRef = useRef(document.createElement('canvas'));
  const textureRef = useRef(null);
  
  const [isPainting, setIsPainting] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (initialMaskDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 512, 512);
        if (textureRef.current) textureRef.current.needsUpdate = true;
      };
      img.src = initialMaskDataUrl;
    } else {
      ctx.fillStyle = "white"; // default matte
      ctx.fillRect(0, 0, 512, 512);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    textureRef.current = texture;
    
    if (materialRef.current) {
      materialRef.current.roughnessMap = texture;
      materialRef.current.needsUpdate = true;
    }
  }, [initialMaskDataUrl]);

  useEffect(() => {
    if (geoRef.current) {
      applyCoffinShape(geoRef.current);
    }
  }, []);

  const paint = useCallback((uv) => {
    if (!uv || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const x = uv.x * 512;
    const y = (1 - uv.y) * 512;
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    // Matte = white (roughness 1), Glossy = black (roughness 0)
    ctx.fillStyle = brushType === 'matte' ? 'white' : 'black';
    ctx.fill();
    
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [brushType, brushSize]);

  return (
    <mesh 
      castShadow 
      receiveShadow
      scale={[1.1, 1.4, 0.25]}
      onPointerDown={(e) => { e.stopPropagation(); setIsPainting(true); paint(e.uv); }}
      onPointerUp={(e) => { 
        e.stopPropagation(); 
        setIsPainting(false); 
        if (onCanvasChange) {
          onCanvasChange(canvasRef.current.toDataURL());
        }
      }}
      onPointerOut={(e) => {
        if (isPainting) {
          setIsPainting(false);
          if (onCanvasChange) {
            onCanvasChange(canvasRef.current.toDataURL());
          }
        }
      }}
      onPointerMove={(e) => { 
        if (isPainting) {
          e.stopPropagation(); 
          paint(e.uv); 
        }
      }}
    >
      <capsuleGeometry ref={geoRef} args={[0.35, 1.4, 64, 64]} />
      <meshPhysicalMaterial 
        ref={materialRef}
        color={new THREE.Color("#ffb1c8")}
        roughness={1} 
        metalness={0.2}
      />
    </mesh>
  );
}

PainterMesh.propTypes = {
  brushSize: PropTypes.number.isRequired,
  brushType: PropTypes.oneOf(['matte', 'glossy']).isRequired,
  initialMaskDataUrl: PropTypes.string,
  onCanvasChange: PropTypes.func.isRequired,
};

export function NailSurfacePainter({ brushType = 'glossy', brushSize = 20, onSave, initialMaskDataUrl }) {
  return (
    <div className="relative rounded-[20px] bg-[radial-gradient(circle_at_top,#fff6fb_0%,#fff0f7_55%,#fff8fb_100%)] p-0 w-full h-[300px] overflow-hidden cursor-crosshair">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 35 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        <Environment preset="city" />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={5} blur={2.4} />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          mouseButtons={{
            LEFT: null,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
          }}
        />
        
        <PainterMesh 
          brushType={brushType} 
          brushSize={brushSize} 
          onCanvasChange={onSave}
          initialMaskDataUrl={initialMaskDataUrl}
        />
      </Canvas>
      <div className="absolute top-3 left-0 w-full flex flex-col items-center pointer-events-none gap-1">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[12px] font-black text-[#ea4f93] shadow-[0_4px_15px_rgba(234,79,147,0.2)]">
          ✨ DRAW DIRECTLY ON THE NAIL ✨
        </div>
        <div className="bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white">
          Right-click and drag to rotate
        </div>
      </div>
    </div>
  );
}

NailSurfacePainter.propTypes = {
  brushSize: PropTypes.number,
  brushType: PropTypes.oneOf(['matte', 'glossy']),
  initialMaskDataUrl: PropTypes.string,
  onSave: PropTypes.func.isRequired,
};
