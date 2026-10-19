import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { X, Layers, RotateCw, Sun, Eye, ChevronDown, ChevronUp } from "lucide-react";

interface Botanical3DStudioProps {
  onClose: () => void;
}

// Procedural organic noise bump map generated via CanvasTexture (Zero 404 dependencies)
function createOrganicBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const radius = Math.random() * 2.5 + 0.5;
    const gray = Math.floor(Math.random() * 90 + 70);
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Procedural soft radial contact shadow texture
function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
  gradient.addColorStop(0, "rgba(0,0,0,0.7)");
  gradient.addColorStop(0.5, "rgba(0,0,0,0.3)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function Botanical3DStudio({ onClose }: Botanical3DStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<"fern" | "moss">("fern");
  const [layerSeparation, setLayerSeparation] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1.2);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Mutable refs for animation loop
  const animStateRef = useRef({
    separationTarget: 0,
    currentSeparation: 0,
    wireframe: false,
    autoRotate: true,
    lightIntensity: 1.2,
    selectedModel: "fern" as "fern" | "moss",
  });

  useEffect(() => {
    animStateRef.current.separationTarget = layerSeparation;
    animStateRef.current.wireframe = wireframe;
    animStateRef.current.autoRotate = autoRotate;
    animStateRef.current.lightIntensity = lightIntensity;
    animStateRef.current.selectedModel = selectedModel;
  }, [layerSeparation, wireframe, autoRotate, lightIntensity, selectedModel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Setup Scene, Camera & Modern PBR Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f0d);
    scene.fog = new THREE.FogExp2(0x0a0f0d, 0.12);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 2.5, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection via RoomEnvironment & PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio 3-point lighting rig with warm/cool contrast
    const keyLight = new THREE.DirectionalLight(0xfff6e5, 1.8);
    keyLight.position.set(3, 5, 2.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.camera.left = -2;
    keyLight.shadow.camera.right = 2;
    keyLight.shadow.camera.top = 2;
    keyLight.shadow.camera.bottom = -2;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x739c82, 0x1b2820, 0.85);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa5d6a7, 1.0);
    rimLight.position.set(-3, 3, -2);
    scene.add(rimLight);

    // 4. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createRadialShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.001;
    scene.add(shadowMesh);

    // Ground circle
    const groundGeo = new THREE.CircleGeometry(2.2, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111915,
      roughness: 0.85,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 5. Build Composite 3–12 Part Procedural Models
    const bumpMap = createOrganicBumpTexture();

    // Group containers for the two specimens
    const fernGroup = new THREE.Group();
    const mossGroup = new THREE.Group();
    scene.add(fernGroup);
    scene.add(mossGroup);

    // ── Model A: Composite Procedural Fern (8 parts) ───────────
    // Part 1: Main Arched Stem (TubeGeometry)
    const curvePoints = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      curvePoints.push(
        new THREE.Vector3(
          Math.sin(t * Math.PI * 0.4) * 0.4,
          t * 2.2,
          -Math.pow(t, 1.8) * 0.7
        )
      );
    }
    const stemCurve = new THREE.CatmullRomCurve3(curvePoints);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 32, 0.045, 8, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2e4f32,
      roughness: 0.45,
      metalness: 0.15,
      bumpMap,
      bumpScale: 0.02,
    });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    fernGroup.add(stemMesh);

    // Part 2: Base Collar Rhizome (LatheGeometry)
    const lathePoints = [];
    for (let i = 0; i < 8; i++) {
      lathePoints.push(new THREE.Vector2(Math.sin(i * 0.4) * 0.15 + 0.08, i * 0.04));
    }
    const collarGeo = new THREE.LatheGeometry(lathePoints, 16);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x241e17,
      roughness: 0.85,
      metalness: 0.05,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.castShadow = true;
    fernGroup.add(collarMesh);

    // Parts 3-7: Multiple tiers of Pinnules & Sori clusters
    const pinnuleGroups: THREE.Group[] = [];
    for (let tier = 1; tier <= 6; tier++) {
      const tierGroup = new THREE.Group();
      const frac = tier / 7;
      const point = stemCurve.getPoint(frac);
      tierGroup.position.copy(point);

      const leafLen = (1 - frac * 0.7) * 0.65;
      const leafGeo = new THREE.ConeGeometry(0.12, leafLen, 5);
      leafGeo.translate(0, leafLen / 2, 0);

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x3d7044,
        roughness: 0.35,
        metalness: 0.1,
        bumpMap,
        bumpScale: 0.03,
      });

      // Left pinnule
      const leftMesh = new THREE.Mesh(leafGeo, leafMat);
      leftMesh.rotation.z = Math.PI / 2.3;
      leftMesh.rotation.x = 0.2;
      leftMesh.castShadow = true;
      tierGroup.add(leftMesh);

      // Right pinnule
      const rightMesh = new THREE.Mesh(leafGeo, leafMat);
      rightMesh.rotation.z = -Math.PI / 2.3;
      rightMesh.rotation.x = 0.2;
      rightMesh.castShadow = true;
      tierGroup.add(rightMesh);

      // Part 8: Spore Sori along margins
      const soriGeo = new THREE.SphereGeometry(0.02, 6, 6);
      const soriMat = new THREE.MeshStandardMaterial({
        color: 0xc89b3c,
        roughness: 0.6,
        metalness: 0.3,
      });
      for (let s = -2; s <= 2; s++) {
        if (s === 0) continue;
        const soriLeft = new THREE.Mesh(soriGeo, soriMat);
        soriLeft.position.set(s * 0.08, 0.02, -0.01);
        tierGroup.add(soriLeft);
      }

      fernGroup.add(tierGroup);
      pinnuleGroups.push(tierGroup);
    }

    // Part 8: Apex Fiddlehead Crozier Spiral
    const crozierPoints = [];
    for (let i = 0; i <= 16; i++) {
      const theta = (i / 16) * Math.PI * 2.8;
      const r = 0.08 * (1 - i / 20);
      crozierPoints.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, (i / 16) * 0.04));
    }
    const crozierCurve = new THREE.CatmullRomCurve3(crozierPoints);
    const crozierGeo = new THREE.TubeGeometry(crozierCurve, 20, 0.025, 6, false);
    const crozierMesh = new THREE.Mesh(crozierGeo, stemMat);
    crozierMesh.position.copy(stemCurve.getPoint(1));
    fernGroup.add(crozierMesh);

    // ── Model B: Composite Velvet Cushion Moss & Stone (7 parts) ─
    // Part 1: Weathered Lichen Stone Base
    const stoneGeo = new THREE.DodecahedronGeometry(0.85, 2);
    const pos = stoneGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      v.multiplyScalar(1 + (Math.sin(v.x * 4) + Math.cos(v.y * 5)) * 0.08);
      pos.setXYZ(i, v.x, Math.max(0.05, v.y * 0.65), v.z);
    }
    stoneGeo.computeVertexNormals();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x4a473f,
      roughness: 0.9,
      metalness: 0.08,
      bumpMap,
      bumpScale: 0.04,
    });
    const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
    stoneMesh.position.y = 0.15;
    stoneMesh.castShadow = true;
    mossGroup.add(stoneMesh);

    // Part 2: Primary Moss Carpet Layer
    const mossCapGeo = new THREE.SphereGeometry(0.78, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const mossCapMat = new THREE.MeshStandardMaterial({
      color: 0x3d6b38,
      roughness: 0.95,
      metalness: 0.02,
      bumpMap,
      bumpScale: 0.08,
    });
    const mossCapMesh = new THREE.Mesh(mossCapGeo, mossCapMat);
    mossCapMesh.position.y = 0.35;
    mossCapMesh.scale.set(1.05, 0.5, 1.05);
    mossCapMesh.castShadow = true;
    mossGroup.add(mossCapMesh);

    // Part 3-5: Sporophyte Stalks & Capsules
    const sporophyteGroup = new THREE.Group();
    const setaGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6);
    setaGeo.translate(0, 0.225, 0);
    const setaMat = new THREE.MeshStandardMaterial({
      color: 0xa4b872,
      roughness: 0.4,
      metalness: 0.15,
    });
    const capsuleGeo = new THREE.ConeGeometry(0.025, 0.07, 6);
    capsuleGeo.translate(0, 0.48, 0);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0xbf782c,
      roughness: 0.5,
      metalness: 0.2,
    });

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 0.25 + (i % 3) * 0.12;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const setaMesh = new THREE.Mesh(setaGeo, setaMat);
      setaMesh.position.set(x, 0.5, z);
      setaMesh.rotation.z = (Math.random() - 0.5) * 0.25;
      setaMesh.rotation.x = (Math.random() - 0.5) * 0.25;

      const capMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
      capMesh.position.copy(setaMesh.position);
      capMesh.rotation.copy(setaMesh.rotation);

      sporophyteGroup.add(setaMesh);
      sporophyteGroup.add(capMesh);
    }
    mossGroup.add(sporophyteGroup);

    // Part 6: Transmissive Dew Droplets (Physical Glass Material)
    const dewGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const dewMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.33,
      thickness: 0.5,
    });
    const dewMesh1 = new THREE.Mesh(dewGeo, dewMat);
    dewMesh1.position.set(0.2, 0.65, 0.15);
    mossGroup.add(dewMesh1);

    const dewMesh2 = new THREE.Mesh(dewGeo, dewMat);
    dewMesh2.position.set(-0.25, 0.6, -0.1);
    dewMesh2.scale.setScalar(0.7);
    mossGroup.add(dewMesh2);

    // 6. Camera OrbitControls with exponential damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep camera above ground
    controls.target.set(0, 0.9, 0);

    // 7. Lossless 60fps Render Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Exponential damping on exploded layer separation
      const state = animStateRef.current;
      state.currentSeparation = THREE.MathUtils.damp(
        state.currentSeparation,
        state.separationTarget,
        6,
        delta
      );

      // Model visibility
      fernGroup.visible = state.selectedModel === "fern";
      mossGroup.visible = state.selectedModel === "moss";

      // Apply exploded view layer separation
      const sep = state.currentSeparation;
      pinnuleGroups.forEach((g, idx) => {
        g.position.y = stemCurve.getPoint((idx + 1) / 7).y + (idx + 1) * sep * 0.12;
      });
      sporophyteGroup.position.y = sep * 0.4;
      mossCapMesh.position.y = 0.35 + sep * 0.25;

      // Auto rotation
      if (state.autoRotate) {
        fernGroup.rotation.y += delta * 0.3;
        mossGroup.rotation.y += delta * 0.3;
      }

      // Wireframe toggle
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material && obj !== shadowMesh) {
          obj.material.wireframe = state.wireframe;
        }
      });

      // Lighting intensity
      keyLight.intensity = 1.8 * state.lightIntensity;
      fillLight.intensity = 0.85 * state.lightIntensity;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      bumpMap.dispose();
      shadowMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#080d0a] flex flex-col pointer-events-auto">
      {/* Top Header / Viewport HUD */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs uppercase tracking-widest text-white/90 font-light">
              Sylva 3D Procedural Studio
            </span>
          </div>
          <span className="text-xs text-white/50 hidden sm:inline font-light">
            ACESFilmic PBR • Multi-Part Geometry • Dynamic Damping
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/60 border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
          aria-label="Close 3D Studio"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* 3D WebGL Canvas Mount Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing" />

      {/* Collapsible Viewport-First Bottom Control Dock (<= 15% Viewport Footprint) */}
      <div className="absolute bottom-4 inset-x-0 mx-auto w-fit max-w-[94vw] z-30 pointer-events-auto flex flex-col items-center">
        {/* Collapse / Expand Toggle */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1 px-3 py-1 rounded-full bg-black/80 border border-white/15 text-white/60 hover:text-white text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? "Show Controls" : "Collapse Dock"}</span>
        </button>

        {!isDockCollapsed && (
          <div className="bg-[#121915]/90 border border-white/15 rounded-2xl p-3 sm:p-4 text-white shadow-2xl flex flex-wrap items-center justify-center gap-4 text-xs font-light backdrop-blur-md">
            {/* Specimen Switcher */}
            <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setSelectedModel("fern")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedModel === "fern" ? "bg-emerald-500/30 text-white font-medium" : "text-white/60 hover:text-white"
                }`}
              >
                Spore Fern
              </button>
              <button
                onClick={() => setSelectedModel("moss")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedModel === "moss" ? "bg-emerald-500/30 text-white font-medium" : "text-white/60 hover:text-white"
                }`}
              >
                Cushion Moss
              </button>
            </div>

            {/* Exploded View Separation Slider */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white/70">Explode:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={layerSeparation}
                onChange={(e) => setLayerSeparation(parseFloat(e.target.value))}
                className="w-24 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Auto-Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                autoRotate
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/[0.04] border-white/10 text-white/50 hover:text-white"
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "text-emerald-400" : ""}`} />
              <span>Rotate</span>
            </button>

            {/* Wireframe Toggle */}
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                wireframe
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/[0.04] border-white/10 text-white/50 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Wireframe</span>
            </button>

            {/* Lighting Intensity Slider */}
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                className="w-20 accent-amber-300 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
