import React, { useEffect, useRef } from 'react';
import { buildFanAvatarMesh } from '../three/avatarBuilder';
import type {
  CapStyle,
  HairStyle,
  HandItemType,
  OutfitStyle,
} from '../types/plaza';

export function FlowerBloomIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <path d="M12 3.5c1.8 0 3 1.7 2.4 3.4-.3.9-1.2 1.8-2.4 2.5-1.2-.7-2.1-1.6-2.4-2.5C9 5.2 10.2 3.5 12 3.5Z" />
      <path d="M12 20.5c1.8 0 3-1.7 2.4-3.4-.3-.9-1.2-1.8-2.4-2.5-1.2.7-2.1 1.6-2.4 2.5-.6 1.7.6 3.4 2.4 3.4Z" />
      <path d="M3.5 12c0-1.8 1.7-3 3.4-2.4.9.3 1.8 1.2 2.5 2.4-.7 1.2-1.6 2.1-2.5 2.4-1.7.6-3.4-.6-3.4-2.4Z" />
      <path d="M20.5 12c0-1.8-1.7-3-3.4-2.4-.9.3-1.8 1.2-2.5 2.4.7 1.2 1.6 2.1 2.5 2.4 1.7.6 3.4-.6 3.4-2.4Z" />
    </svg>
  );
}

export function AvatarPreview3D({
  threeReady,
  profile,
}: {
  threeReady: boolean;
  profile: {
    name: string;
    hoodieColor: string;
    lightstickColor: string;
    hairStyle: HairStyle;
    outfitStyle: OutfitStyle;
    capStyle: CapStyle;
    hasSloganTowel: boolean;
    hasWristband: boolean;
    leftHandItem: HandItemType;
    rightHandItem: HandItemType;
  };
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threeReady || !previewRef.current || !window.THREE) return;
    const THREE = window.THREE;
    const container = previewRef.current;
    let animId = 0;
    let disposed = false;

    try {
      const width = container.clientWidth || 240;
      const height = container.clientHeight || 260;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
      camera.position.set(0, 1.55, 4.1);
      camera.lookAt(0, 1.15, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
      keyLight.position.set(3, 6, 5);
      scene.add(keyLight);

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.05, 0.14, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 })
      );
      pedestal.position.y = -0.07;
      scene.add(pedestal);

      const avatar = buildFanAvatarMesh(THREE, {
        name: profile.name,
        hoodieColor: profile.hoodieColor,
        lightstickColor: profile.lightstickColor,
        hairStyle: profile.hairStyle,
        outfitStyle: profile.outfitStyle,
        capStyle: profile.capStyle,
        hasSloganTowel: profile.hasSloganTowel,
        hasWristband: profile.hasWristband,
        leftHandItem: profile.leftHandItem,
        rightHandItem: profile.rightHandItem,
        isMe: true,
      });
      if (avatar.userData?.nameSprite) {
        avatar.userData.nameSprite.visible = false;
      }
      scene.add(avatar);

      let yaw = 0.2;
      let dragging = false;
      let lastX = 0;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        yaw += (e.clientX - lastX) * 0.015;
        lastX = e.clientX;
      };
      const onUp = () => {
        dragging = false;
      };

      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);

      const clock = new THREE.Clock();
      const loop = () => {
        if (disposed) return;
        animId = requestAnimationFrame(loop);
        const t = clock.getElapsedTime();
        if (!dragging) yaw += 0.008;
        avatar.rotation.y = yaw;
        if (avatar.userData?.bodyGroup) {
          avatar.userData.bodyGroup.position.y = 0.88 + Math.sin(t * 2.5) * 0.025;
        }
        renderer.render(scene, camera);
      };
      loop();

      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        dom.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: any) => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          }
        });
        renderer.dispose();
      };
    } catch {
      return undefined;
    }
  }, [threeReady, profile]);

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-sky-400/25 bg-slate-950">
      <div ref={previewRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[10px] text-sky-200 pointer-events-none">
        드래그해서 360° 회전
      </span>
    </div>
  );
}
