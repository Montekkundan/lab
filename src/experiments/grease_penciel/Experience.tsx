import { OrbitControls, Svg } from "@react-three/drei";
import { useControls } from "leva";
const Experience = () => {
  const svgUrl = "/g.svg";
  const svgControls = useControls({
    // skipFill: false,
    // skipStrokes: false,
    scale: { value: 0.01, min: 0.001, max: 0.1, step: 0.001 },
    positionX: { value: -1, min: -5, max: 5, step: 0.1 },
    positionY: { value: 1, min: -5, max: 5, step: 0.1 },
    positionZ: { value: 0, min: -5, max: 5, step: 0.1 },
    // fillOpacity: { value: 0, min: 0, max: 1, step: 0.01 },
    // strokeOpacity: { value: 0, min: 0, max: 1, step: 0.01 },
    // fillColor: "#ffffff",
    // strokeColor: "#ffffff"
  });


  return (
    <>
      <OrbitControls 
        minDistance={2} 
        maxDistance={10} 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />
      <ambientLight intensity={1} />
      <Svg 
        src={svgUrl}
        scale={[svgControls.scale, svgControls.scale, svgControls.scale]} 
        position={[svgControls.positionX, svgControls.positionY, svgControls.positionZ]}
        // skipFill={svgControls.skipFill}
        // skipStrokes={svgControls.skipStrokes}
        // fillMaterial={{ 
        //   transparent: true, 
        //   opacity: svgControls.fillOpacity,
        //   color: svgControls.fillColor
        // }} 
        // strokeMaterial={{ 
        //   transparent: true, 
        //   opacity: svgControls.strokeOpacity,
        //   color: svgControls.strokeColor
        // }}
      />
    </>
  );
};

export default Experience;
