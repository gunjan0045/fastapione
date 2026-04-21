import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeHeroOrb = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.3, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const sphereGeometry = new THREE.IcosahedronGeometry(1.35, 2);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x70a3ff,
      metalness: 0.08,
      roughness: 0.18,
      transmission: 0.85,
      thickness: 1.2,
      transparent: true,
      opacity: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(sphereGeometry),
      new THREE.LineBasicMaterial({ color: 0x57dbff, transparent: true, opacity: 0.45 })
    );
    wireframe.scale.setScalar(1.02);
    group.add(wireframe);

    const ringGeometry = new THREE.TorusGeometry(2.4, 0.03, 32, 220);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x7f71ff, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2.7;
    ring.rotation.y = Math.PI / 5;
    group.add(ring);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 220;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x7ec4ff,
      size: 0.03,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const pointLight = new THREE.PointLight(0x47b9ff, 1.6, 30);
    pointLight.position.set(4, 3, 6);
    const fillLight = new THREE.PointLight(0x8b5cff, 0.9, 20);
    fillLight.position.set(-4, -2, 4);

    scene.add(ambientLight, pointLight, fillLight);

    let frame = 0;
    const animate = () => {
      frame += 0.01;
      sphere.rotation.y += 0.004;
      sphere.rotation.x = Math.sin(frame * 0.8) * 0.2;
      wireframe.rotation.y -= 0.003;
      ring.rotation.z += 0.004;
      particles.rotation.y += 0.0009;
      particles.rotation.x = Math.sin(frame * 0.3) * 0.2;
      group.position.y = Math.sin(frame) * 0.12;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    let animationId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      container.removeChild(renderer.domElement);
      sphereGeometry.dispose();
      ringGeometry.dispose();
      particlesGeometry.dispose();
      sphereMaterial.dispose();
      ringMaterial.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
};

export default ThreeHeroOrb;
