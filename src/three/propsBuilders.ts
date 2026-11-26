import { createNameTagTexture, drawRoundedRectPath } from './textures';
import type { PlazaMemo } from '../types/plaza';

export function buildEbddFanMesh(THREE: any) {
  const fanGroup = new THREE.Group();

  // 직사각 응원 부채 손잡이
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.24, 0.026),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 })
  );
  handle.position.set(0, 0.09, 0);
  fanGroup.add(handle);

  const gripCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 })
  );
  gripCap.rotation.x = Math.PI / 2;
  gripCap.position.set(0, -0.02, 0);
  fanGroup.add(gripCap);

  // 직사각형 에.바.뛰. 응원 부채 텍스처
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 320, 240);

    ctx.fillStyle = '#2563eb';
    ctx.font = '800 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CNBLUE LIVE 2027', 160, 54);

    ctx.fillStyle = '#0c2366';
    ctx.font = '900 68px system-ui, -apple-system, sans-serif';
    ctx.fillText('에.바.뛰.', 160, 124);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(44, 174, 232, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px system-ui, -apple-system, sans-serif';
    ctx.fillText("KEEP DREAMIN' KEEP RUNNIN'", 160, 188);
  }

  const fanTex = new THREE.CanvasTexture(canvas);
  const faceMat = new THREE.MeshStandardMaterial({
    map: fanTex,
    roughness: 0.35,
  });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });

  const rectBoard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.022), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    faceMat,
    faceMat,
  ]);
  rectBoard.position.set(-0.18, 0.38, 0);
  fanGroup.add(rectBoard);

  return fanGroup;
}

// 선명한 로열 블루(#0018e8) + 가로형 화이트 라운드 테두리 CNBLUE 슬로건 3D 메쉬
export function buildCnblueSloganMesh(THREE: any) {
  const sloganGroup = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0018e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 22;
    drawRoundedRectPath(ctx, 22, 24, 596, 208, 104);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 17;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // C
    ctx.beginPath();
    ctx.moveTo(146, 82);
    ctx.lineTo(112, 82);
    ctx.quadraticCurveTo(88, 82, 88, 106);
    ctx.lineTo(88, 150);
    ctx.quadraticCurveTo(88, 174, 112, 174);
    ctx.lineTo(146, 174);
    ctx.stroke();

    // N
    ctx.beginPath();
    ctx.moveTo(170, 174);
    ctx.lineTo(170, 84);
    ctx.lineTo(226, 172);
    ctx.lineTo(226, 82);
    ctx.stroke();

    // B
    ctx.beginPath();
    ctx.moveTo(252, 174);
    ctx.lineTo(252, 82);
    ctx.lineTo(286, 82);
    ctx.quadraticCurveTo(308, 82, 308, 104);
    ctx.quadraticCurveTo(308, 126, 286, 126);
    ctx.lineTo(252, 126);
    ctx.moveTo(286, 126);
    ctx.lineTo(290, 126);
    ctx.quadraticCurveTo(312, 126, 312, 150);
    ctx.quadraticCurveTo(312, 174, 290, 174);
    ctx.lineTo(252, 174);
    ctx.stroke();

    // L
    ctx.beginPath();
    ctx.moveTo(334, 82);
    ctx.lineTo(334, 150);
    ctx.quadraticCurveTo(334, 174, 356, 174);
    ctx.lineTo(388, 174);
    ctx.stroke();

    // U
    ctx.beginPath();
    ctx.moveTo(410, 82);
    ctx.lineTo(410, 146);
    ctx.quadraticCurveTo(410, 174, 439, 174);
    ctx.quadraticCurveTo(468, 174, 468, 146);
    ctx.lineTo(468, 82);
    ctx.stroke();

    // E
    ctx.beginPath();
    ctx.moveTo(550, 82);
    ctx.lineTo(516, 82);
    ctx.quadraticCurveTo(492, 82, 492, 106);
    ctx.lineTo(492, 150);
    ctx.quadraticCurveTo(492, 174, 516, 174);
    ctx.lineTo(550, 174);
    ctx.moveTo(494, 128);
    ctx.lineTo(546, 128);
    ctx.stroke();
  }

  const sloganTex = new THREE.CanvasTexture(canvas);
  const faceMat = new THREE.MeshStandardMaterial({
    map: sloganTex,
    roughness: 0.62,
  });
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0x0015d1,
    roughness: 0.65,
  });

  const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.48, 0.03), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    faceMat,
    faceMat,
  ]);
  sloganGroup.add(bannerMesh);

  return sloganGroup;
}

// 3D 「그러나, 꽃이었다 (Still, a Flower)」 땅에 피어나는 꽃 오브젝트 생성
export function buildBloomFlowerMesh(THREE: any, memo: PlazaMemo) {
  const fGroup = new THREE.Group();
  fGroup.position.set(memo.x, 0, memo.z);

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.65, 24),
    new THREE.MeshBasicMaterial({
      color: memo.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.03;
  fGroup.add(aura);

  const swayGroup = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.055, 1.15, 8), stemMat);
  stem.position.y = 0.57;
  swayGroup.add(stem);

  const leafGeo = new THREE.SphereGeometry(0.22, 10, 8);
  const leafL = new THREE.Mesh(leafGeo, stemMat);
  leafL.scale.set(1.4, 0.25, 0.65);
  leafL.position.set(-0.22, 0.45, 0);
  leafL.rotation.z = 0.45;
  const leafR = new THREE.Mesh(leafGeo, stemMat);
  leafR.scale.set(1.4, 0.25, 0.65);
  leafR.position.set(0.22, 0.62, 0);
  leafR.rotation.z = -0.45;
  swayGroup.add(leafL, leafR);

  const blossomHead = new THREE.Group();
  blossomHead.position.set(0, 1.18, 0);
  blossomHead.rotation.x = 0.35;

  const petalMat = new THREE.MeshStandardMaterial({
    color: memo.color,
    emissive: memo.color,
    emissiveIntensity: 0.55,
    roughness: 0.28,
  });

  for (let p = 0; p < 6; p++) {
    const pAngle = (p / 6) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), petalMat);
    petal.scale.set(0.78, 0.24, 1.38);
    petal.position.set(Math.cos(pAngle) * 0.27, 0, Math.sin(pAngle) * 0.27);
    petal.rotation.y = -pAngle + Math.PI / 2;
    petal.rotation.x = -0.22;
    blossomHead.add(petal);
  }

  const pistil = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
    })
  );
  pistil.scale.set(1, 0.65, 1);
  pistil.position.y = 0.05;
  blossomHead.add(pistil);

  swayGroup.add(blossomHead);
  fGroup.add(swayGroup);

  const tagTex = createNameTagTexture(THREE, `🌸 ${memo.author}`, memo.text, false);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tagTex,
      transparent: true,
      opacity: 0,
      depthTest: false,
    })
  );
  sprite.visible = false;
  sprite.position.set(0, 2.25, 0);
  sprite.scale.set(2.85, 1.06, 1);
  fGroup.add(sprite);

  fGroup.traverse((child: any) => {
    child.userData = { ...child.userData, memoId: memo.id };
  });

  fGroup.userData = { swayGroup, aura, labelSprite: sprite };
  return fGroup;
}
