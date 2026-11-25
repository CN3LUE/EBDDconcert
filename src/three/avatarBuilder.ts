import { OUTFIT_OPTIONS } from '../constants/plazaData';
import { buildCnblueSloganMesh, buildEbddFanMesh } from './propsBuilders';
import { createNameTagTexture } from './textures';
import type { CapStyle, HairStyle, HandItemType, OutfitStyle } from '../types/plaza';

export interface FanAvatarMeshOptions {
  name: string;
  hoodieColor: string;
  lightstickColor: string;
  hairStyle?: HairStyle;
  outfitStyle?: OutfitStyle;
  capStyle?: CapStyle;
  hasSloganTowel?: boolean;
  hasWristband?: boolean;
  leftHandItem?: HandItemType;
  rightHandItem?: HandItemType;
  speech?: string;
  isMe?: boolean;
}

function createTtuibongMesh(THREE: any, lightstickMat: any) {
  const stickPivot = new THREE.Group();

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.42,
    metalness: 0.18,
  });
  const blueAccentMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.45,
    roughness: 0.25,
  });

  // 매트 블랙 테이퍼 손잡이 + 하단 블루 띠 + 정면 다이아 버튼
  const stickHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.04, 0.36, 16),
    blackMat
  );
  stickHandle.position.y = -0.02;
  stickPivot.add(stickHandle);

  const lowerBlueStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.045, 0.022, 16),
    blueAccentMat
  );
  lowerBlueStripe.position.y = -0.11;
  stickPivot.add(lowerBlueStripe);

  const handleBtn = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), blackMat);
  handleBtn.scale.set(0.85, 1.15, 0.38);
  handleBtn.position.set(0, 0.06, 0.052);
  stickPivot.add(handleBtn);

  // 상단 플레어드 블랙 칼라 + 시그니처 블루 링 + 정면 블루 다이아 심볼
  const collarNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.112, 0.06, 0.09, 22),
    blackMat
  );
  collarNeck.position.y = 0.2;
  stickPivot.add(collarNeck);

  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.015, 8, 24),
    blueAccentMat
  );
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.y = 0.205;
  stickPivot.add(collarRing);

  const collarDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), blueAccentMat);
  collarDiamond.scale.set(0.8, 1.0, 0.4);
  collarDiamond.position.set(0, 0.228, 0.106);
  stickPivot.add(collarDiamond);

  // 투명 유리 구체 돔
  const globeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.215, 22, 22),
    new THREE.MeshStandardMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.26,
      roughness: 0.05,
      metalness: 0.22,
    })
  );
  globeMesh.position.y = 0.43;
  stickPivot.add(globeMesh);

  // 내부 평면형 입체 마름모 결정체 (정면은 넓은 마름모, 측면은 슬림한 이중 플레이트)
  const stickHead = new THREE.Group();
  stickHead.position.y = 0.43;

  const diamondCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.155, 0), lightstickMat);
  diamondCore.scale.set(0.96, 1.16, 0.42);
  stickHead.add(diamondCore);

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2,
    metalness: 0.4,
  });
  const diamondRim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 4), rimMat);
  diamondRim.scale.set(0.98, 1.18, 0.45);
  stickHead.add(diamondRim);

  const sideSeamBar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.34, 0.11), rimMat);
  stickHead.add(sideSeamBar);

  stickPivot.add(stickHead);
  return { stickPivot, stickHead };
}

export function buildFanAvatarMesh(THREE: any, options: FanAvatarMeshOptions) {
  const group = new THREE.Group();
  const hairStyle: HairStyle = options.hairStyle || 'long';
  const outfitStyle = options.outfitStyle || 'track_jacket';
  const capStyle = options.capStyle || 'official_cap';
  const hasWristband = true;
  const leftHandItem: HandItemType = options.leftHandItem ?? 'fan';
  const rightHandItem: HandItemType = options.rightHandItem ?? 'lightstick';
  const isHoldingSlogan = leftHandItem === 'slogan' || rightHandItem === 'slogan';

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 20),
    new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.24,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  // 다리 + 공식 투라인 블루 스트라이프 크루 삭스 + 화이트 러닝화
  const buildLeg = (sideX: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(sideX, 0.52, 0);

    const pant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.13, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 })
    );
    pant.position.y = -0.14;
    legPivot.add(pant);

    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.11, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    sock.position.y = -0.35;
    legPivot.add(sock);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
    const s1 = new THREE.Mesh(new THREE.TorusGeometry(0.116, 0.014, 6, 16), stripeMat);
    s1.rotation.x = Math.PI / 2;
    s1.position.y = -0.3;
    const s2 = s1.clone();
    s2.position.y = -0.34;
    legPivot.add(s1, s2);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.13, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 })
    );
    shoe.position.set(0, -0.46, 0.06);
    legPivot.add(shoe);

    const shoeSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.04, 0.37),
      new THREE.MeshBasicMaterial({ color: 0x2563eb })
    );
    shoeSole.position.set(0, -0.51, 0.06);
    legPivot.add(shoeSole);

    return legPivot;
  };

  const leftLeg = buildLeg(-0.2);
  const rightLeg = buildLeg(0.2);
  group.add(leftLeg, rightLeg);

  // 몸통 (달리기 트랙 자켓 / 콘서트 티셔츠)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.88;
  const outfitObj = OUTFIT_OPTIONS.find((o) => o.id === outfitStyle) || OUTFIT_OPTIONS[0];
  const hoodieMat = new THREE.MeshStandardMaterial({
    color: outfitObj.baseHex,
    roughness: 0.5,
  });
  const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.43, 0.78, 16), hoodieMat);
  bodyGroup.add(bodyMesh);

  const jacketStripeGroup = new THREE.Group();
  const blueAccentMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
  const navyCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.065, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 })
  );
  navyCollar.rotation.x = Math.PI / 2;
  navyCollar.position.y = 0.36;
  const zipperLine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.06), blueAccentMat);
  zipperLine.position.set(0, 0, 0.39);
  const chestPatch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.05), blueAccentMat);
  chestPatch.position.set(0.15, 0.14, 0.37);
  const shoulderBarL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), blueAccentMat);
  shoulderBarL.position.set(-0.34, 0.34, 0);
  const shoulderBarR = shoulderBarL.clone();
  shoulderBarR.position.x = 0.34;
  jacketStripeGroup.add(navyCollar, zipperLine, chestPatch, shoulderBarL, shoulderBarR);
  jacketStripeGroup.visible = outfitStyle === 'track_jacket';
  bodyGroup.add(jacketStripeGroup);

  const teeLogoMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.032, 8, 20, Math.PI * 1.4),
    new THREE.MeshBasicMaterial({
      color: outfitStyle === 'white_tee' ? '#2563eb' : '#93c5fd',
    })
  );
  teeLogoMesh.position.set(0, 0.08, 0.39);
  teeLogoMesh.rotation.z = Math.PI * 0.3;
  teeLogoMesh.visible = outfitStyle !== 'track_jacket';
  bodyGroup.add(teeLogoMesh);

  // 양손으로 펼쳐 드는 공식 CNBLUE 슬로건
  const heldSloganGroup = buildCnblueSloganMesh(THREE);
  heldSloganGroup.position.set(0, 0.08, 0.54);
  heldSloganGroup.visible = isHoldingSlogan;
  bodyGroup.add(heldSloganGroup);

  // 머리 & 헤어
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.39, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 })
  );
  headMesh.position.y = 0.68;
  bodyGroup.add(headMesh);

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairStyle === 'short' ? 0x1e1b18 : 0x261c19,
    roughness: 0.82,
  });
  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.41, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairMesh.position.y = 0.72;
  hairMesh.rotation.x = -0.15;
  bodyGroup.add(hairMesh);

  // 여성 긴 생머리 파츠
  const longHairGroup = new THREE.Group();
  const backHairMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.44, 0.88, 18, 1, false, Math.PI * 0.58, Math.PI * 0.84),
    hairMat
  );
  backHairMain.position.set(0, 0.34, -0.04);
  const backHairFill = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.76, 0.16), hairMat);
  backHairFill.position.set(0, 0.34, -0.34);
  const sideLockL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.72, 10), hairMat);
  sideLockL.position.set(-0.34, 0.42, 0.08);
  sideLockL.rotation.z = 0.08;
  const sideLockR = sideLockL.clone();
  sideLockR.position.x = 0.34;
  sideLockR.rotation.z = -0.08;
  longHairGroup.add(backHairMain, backHairFill, sideLockL, sideLockR);
  longHairGroup.visible = hairStyle === 'long';
  bodyGroup.add(longHairGroup);

  // 여성 포니테일 파츠
  const ponytailGroup = new THREE.Group();
  const ponySideL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.36, 8), hairMat);
  ponySideL.position.set(-0.33, 0.58, 0.12);
  ponySideL.rotation.z = 0.12;
  const ponySideR = ponySideL.clone();
  ponySideR.position.x = 0.33;
  ponySideR.rotation.z = -0.12;

  const scrunchie = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.036, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
  );
  scrunchie.position.set(0, 0.72, -0.41);

  const ponytailPivot = new THREE.Group();
  ponytailPivot.position.set(0, 0.72, -0.43);
  const ponyUpper = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), hairMat);
  ponyUpper.scale.set(0.95, 1.35, 1.0);
  ponyUpper.position.set(0, -0.1, -0.09);
  ponyUpper.rotation.x = 0.42;
  const ponyTailCone = new THREE.Mesh(new THREE.ConeGeometry(0.145, 0.58, 12), hairMat);
  ponyTailCone.position.set(0, -0.42, -0.16);
  ponyTailCone.rotation.x = Math.PI + 0.12;
  ponytailPivot.add(ponyUpper, ponyTailCone);

  ponytailGroup.add(ponySideL, ponySideR, scrunchie, ponytailPivot);
  ponytailGroup.visible = hairStyle === 'ponytail';
  bodyGroup.add(ponytailGroup);

  // 공식 화이트 데님 캡 모자
  const capGroup = new THREE.Group();
  capGroup.position.set(0, 0.79, 0);
  const capCrownMat = new THREE.MeshStandardMaterial({
    color: capStyle === 'official_cap' ? 0xf1f5f9 : 0x1e3a8a,
    roughness: 0.65,
  });
  const capBrimMat = new THREE.MeshStandardMaterial({
    color: capStyle === 'official_cap' ? 0xcbd5e1 : 0x172554,
    roughness: 0.65,
  });
  const capCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.425, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
    capCrownMat
  );
  const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.055, 18), capBrimMat);
  capBrim.position.set(0, 0.02, 0.28);
  capBrim.rotation.x = 0.12;
  const denimPatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.06, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 })
  );
  denimPatch.position.set(0.14, 0.02, 0.53);
  const capLogo = new THREE.Mesh(
    new THREE.TorusGeometry(0.085, 0.024, 6, 16, Math.PI * 1.45),
    new THREE.MeshBasicMaterial({ color: 0x2563eb })
  );
  capLogo.position.set(0, 0.15, 0.4);
  capLogo.rotation.z = Math.PI * 0.28;
  capGroup.add(capCrown, capBrim, denimPatch, capLogo);
  capGroup.visible = capStyle !== 'none';
  bodyGroup.add(capGroup);

  // 눈
  const eyeGeo = new THREE.SphereGeometry(0.048, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.13, 0.67, 0.36);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.13, 0.67, 0.36);
  bodyGroup.add(leftEye, rightEye);

  // 눈물 흘리기 파츠 (기본 숨김, 'cry' 액션 시 표시 & 애니메이션)
  const cryGroup = new THREE.Group();
  cryGroup.visible = false;
  const tearStreamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.82,
  });
  const tearDropMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.95,
  });
  const tearStreamL = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.19, 0.02), tearStreamMat);
  tearStreamL.position.set(-0.13, 0.54, 0.378);
  tearStreamL.rotation.x = 0.25;
  const tearStreamR = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.19, 0.02), tearStreamMat);
  tearStreamR.position.set(0.13, 0.54, 0.378);
  tearStreamR.rotation.x = 0.25;

  const tearDropGeo = new THREE.SphereGeometry(0.036, 8, 8);
  const tearDropL = new THREE.Mesh(tearDropGeo, tearDropMat);
  tearDropL.scale.set(0.85, 1.35, 0.85);
  tearDropL.position.set(-0.13, 0.6, 0.39);
  const tearDropR = new THREE.Mesh(tearDropGeo, tearDropMat);
  tearDropR.scale.set(0.85, 1.35, 0.85);
  tearDropR.position.set(0.13, 0.6, 0.39);

  cryGroup.add(tearStreamL, tearStreamR, tearDropL, tearDropR);
  bodyGroup.add(cryGroup);

  // 공식 뛰봉 3D 조립 헬퍼
  const lightstickMat = new THREE.MeshStandardMaterial({
    color: options.lightstickColor,
    emissive: options.lightstickColor,
    emissiveIntensity: 1.15,
    roughness: 0.14,
    metalness: 0.22,
  });

  const createLightstickAttachment = () => {
    const stickObj = createTtuibongMesh(THREE, lightstickMat);
    stickObj.stickPivot.position.set(0, -0.36, 0.28);
    stickObj.stickPivot.rotation.x = 0.5;
    return stickObj;
  };

  const createFanAttachment = (isLeftHand: boolean) => {
    const fanPivot = new THREE.Group();
    fanPivot.position.set(isLeftHand ? -0.02 : 0.02, -0.36, 0.36);
    fanPivot.rotation.x = 0.48;
    fanPivot.rotation.y = isLeftHand ? 0.14 : -0.14;
    const fanMesh = buildEbddFanMesh(THREE);
    fanPivot.add(fanMesh);
    return fanPivot;
  };

  // 왼팔 + 화이트 손목 아대 + 왼손 MD
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.45, 0.24, 0);
  const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 10);
  const leftArm = new THREE.Mesh(armGeo, hoodieMat);
  leftArm.position.set(0, -0.2, 0.06);
  leftArm.rotation.x = -0.35;
  leftArmPivot.add(leftArm);

  const wristbandGroup = new THREE.Group();
  const leftBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.118, 0.118, 0.11, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
  );
  leftBand.position.set(0, -0.34, 0.16);
  leftBand.rotation.x = -0.35;
  const leftBandStripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.015, 6, 14),
    new THREE.MeshBasicMaterial({ color: 0x1d4ed8 })
  );
  leftBandStripe.rotation.x = Math.PI / 2 - 0.35;
  leftBandStripe.position.set(0, -0.34, 0.16);
  wristbandGroup.add(leftBand, leftBandStripe);
  wristbandGroup.visible = hasWristband;
  leftArmPivot.add(wristbandGroup);

  const leftStickObj = createLightstickAttachment();
  leftStickObj.stickPivot.visible = !isHoldingSlogan && leftHandItem === 'lightstick';
  const leftFanGroup = createFanAttachment(true);
  leftFanGroup.visible = !isHoldingSlogan && leftHandItem === 'fan';
  leftArmPivot.add(leftStickObj.stickPivot, leftFanGroup);
  if (isHoldingSlogan) {
    leftArmPivot.rotation.x = -0.88;
    leftArmPivot.rotation.z = -0.12;
  }
  bodyGroup.add(leftArmPivot);

  // 오른팔 + 로열블루 손목 아대 + 오른손 MD
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.45, 0.24, 0);
  const rightArm = new THREE.Mesh(armGeo, hoodieMat);
  rightArm.position.set(0, -0.2, 0.08);
  rightArm.rotation.x = -0.45;
  rightArmPivot.add(rightArm);

  const rightWristbandGroup = new THREE.Group();
  const rightBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.118, 0.118, 0.11, 12),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.55 })
  );
  rightBand.position.set(0, -0.34, 0.18);
  rightBand.rotation.x = -0.45;
  rightWristbandGroup.add(rightBand);
  rightWristbandGroup.visible = hasWristband;
  rightArmPivot.add(rightWristbandGroup);

  const rightStickObj = createLightstickAttachment();
  rightStickObj.stickPivot.visible = !isHoldingSlogan && rightHandItem === 'lightstick';
  const rightFanGroup = createFanAttachment(false);
  rightFanGroup.visible = !isHoldingSlogan && rightHandItem === 'fan';
  rightArmPivot.add(rightStickObj.stickPivot, rightFanGroup);
  if (isHoldingSlogan) {
    rightArmPivot.rotation.x = -0.88;
    rightArmPivot.rotation.z = 0.12;
  }
  bodyGroup.add(rightArmPivot);
  group.add(bodyGroup);

  // 닉네임 + 말풍선 스프라이트
  const tagTex = createNameTagTexture(THREE, options.name, options.speech, options.isMe);
  const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false });
  const nameSprite = new THREE.Sprite(tagMat);
  nameSprite.position.set(0, 2.52, 0);
  nameSprite.scale.set(2.7, 1.0, 1);
  group.add(nameSprite);

  group.userData = {
    leftLeg,
    rightLeg,
    leftArmPivot,
    bodyGroup,
    bodyMesh,
    rightArmPivot,
    stickHead: rightStickObj.stickHead,
    rightStickHead: rightStickObj.stickHead,
    leftStickHead: leftStickObj.stickHead,
    leftStickGroup: leftStickObj.stickPivot,
    leftFanGroup,
    rightStickGroup: rightStickObj.stickPivot,
    rightFanGroup,
    heldSloganGroup,
    isHoldingSlogan,
    leftHandItem,
    rightHandItem,
    nameSprite,
    hoodieMat,
    lightstickMat,
    hairMesh,
    longHairGroup,
    ponytailGroup,
    ponytailPivot,
    jacketStripeGroup,
    teeLogoMesh,
    capGroup,
    capCrownMat,
    capBrimMat,
    wristbandGroup,
    rightWristbandGroup,
    cryGroup,
    tearStreamL,
    tearStreamR,
    tearDropL,
    tearDropR,
    lastSpeech: options.speech || '',
  };

  return group;
}

function createCnblueBadgeTexture(THREE: any) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(128, 64, 108, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CNBLUE', 128, 66);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 씨엔블루 3인 멤버(강민혁·정용화·이정신) 치비 캐릭터 + 악기 생성 헬퍼
export function buildBandMemberMesh(
  THREE: any,
  member: {
    id: 'minhyuk' | 'yonghwa' | 'jungshin';
    name: string;
    roleLabel: string;
    quote: string;
  }
) {
  const root = new THREE.Group();

  const spotRing = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 1.05, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    })
  );
  spotRing.rotation.x = -Math.PI / 2;
  spotRing.position.y = 0.02;
  root.add(spotRing);

  const charGroup = new THREE.Group();

  const buildLeg = (sideX: number) => {
    const leg = new THREE.Group();
    leg.position.set(sideX, 0.54, 0);
    const pant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.14, 0.36, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    pant.position.y = -0.17;
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.14, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    shoe.position.set(0, -0.42, 0.06);
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.27, 0.045, 0.39),
      new THREE.MeshBasicMaterial({ color: 0x2563eb })
    );
    sole.position.set(0, -0.48, 0.06);
    leg.add(pant, shoe, sole);
    return leg;
  };

  const leftLeg = buildLeg(-0.21);
  const rightLeg = buildLeg(0.21);
  charGroup.add(leftLeg, rightLeg);

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.92;

  const jacketMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.45, 0.82, 18), jacketMat);
  bodyGroup.add(torso);

  const blueTrimMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.38 });
  const navyCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.07, 8, 22),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  navyCollar.rotation.x = Math.PI / 2;
  navyCollar.position.y = 0.38;

  const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.06), blueTrimMat);
  zipper.position.set(0, 0, 0.41);

  const badgeTex = createCnblueBadgeTexture(THREE);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.12),
    new THREE.MeshBasicMaterial({ map: badgeTex })
  );
  badge.position.set(0.16, 0.14, 0.41);
  badge.rotation.y = 0.25;

  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.28), blueTrimMat);
  stripeL.position.set(-0.36, 0.35, 0);
  const stripeR = stripeL.clone();
  stripeR.position.x = 0.36;
  bodyGroup.add(navyCollar, zipper, badge, stripeL, stripeR);

  // 치비 비율 큰 머리 + 이전 3D 눈/볼터치 복원
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.55 })
  );
  head.position.y = 0.75;
  bodyGroup.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-0.15, 0.15].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), eyeMat);
    eye.position.set(ex, 0.73, 0.42);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), glintMat);
    glint.position.set(ex - 0.018, 0.75, 0.468);
    bodyGroup.add(eye, glint);
  });

  const blushMat = new THREE.MeshBasicMaterial({ color: 0xfda4af });
  const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), blushMat);
  blushL.position.set(-0.26, 0.65, 0.39);
  blushL.rotation.y = -0.32;
  const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), blushMat);
  blushR.position.set(0.26, 0.65, 0.39);
  blushR.rotation.y = 0.32;
  bodyGroup.add(blushL, blushR);

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x16161a,
    roughness: 0.82,
  });
  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.472, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairMesh.position.y = 0.78;
  hairMesh.rotation.x = -0.18;
  bodyGroup.add(hairMesh);

  // 뒷머리 & 옆머리 부드러운 라운드 커버 (공통)
  const backHairCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.41, 0.36, 18, 1, false, Math.PI * 0.55, Math.PI * 0.9),
    hairMat
  );
  backHairCap.position.set(0, 0.62, -0.05);
  bodyGroup.add(backHairCap);

  [-0.41, 0.41].forEach((sx) => {
    const sideLock = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), hairMat);
    sideLock.scale.set(0.55, 1.45, 0.9);
    sideLock.position.set(sx, 0.72, 0.04);
    bodyGroup.add(sideLock);
  });

  if (member.id === 'minhyuk' || member.id === 'yonghwa') {
    // 정용화 & 강민혁: 뾰족한 뿔 없이 부드럽게 감싸는 라운드 쉼표/시스루 앞머리
    const roundedBangs = [
      { x: -0.24, y: 0.94, z: 0.33, rx: 0.28, rz: 0.35, sx: 1.05, sy: 0.58, sz: 0.52 },
      { x: -0.1, y: 0.98, z: 0.39, rx: 0.22, rz: 0.14, sx: 1.15, sy: 0.52, sz: 0.48 },
      { x: 0.06, y: 0.98, z: 0.39, rx: 0.22, rz: -0.12, sx: 1.15, sy: 0.52, sz: 0.48 },
      { x: 0.23, y: 0.94, z: 0.33, rx: 0.28, rz: -0.34, sx: 1.05, sy: 0.58, sz: 0.52 },
    ];
    roundedBangs.forEach((b) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 14), hairMat);
      puff.scale.set(b.sx, b.sy, b.sz);
      puff.position.set(b.x, b.y, b.z);
      puff.rotation.set(b.rx, 0, b.rz);
      bodyGroup.add(puff);
    });
  } else {
    // 이정신: 뾰족한 스파이크 없이 깔끔하고 볼륨감 있는 라운드 업스타일
    const smoothTopPuffs = [
      { x: -0.16, y: 1.08, z: 0.2, sx: 1.15, sy: 0.65, sz: 0.95, rx: -0.1, rz: 0.18 },
      { x: 0.02, y: 1.11, z: 0.23, sx: 1.25, sy: 0.68, sz: 1.0, rx: -0.14, rz: -0.05 },
      { x: 0.18, y: 1.07, z: 0.19, sx: 1.1, sy: 0.62, sz: 0.92, rx: -0.1, rz: -0.2 },
    ];
    smoothTopPuffs.forEach((p) => {
      const topWave = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 14), hairMat);
      topWave.scale.set(p.sx, p.sy, p.sz);
      topWave.position.set(p.x, p.y, p.z);
      topWave.rotation.set(p.rx, 0, p.rz);
      bodyGroup.add(topWave);
    });
  }

  if (member.id === 'yonghwa') {
    // 정용화 머리 위에 얹어진 스타일리시 선글라스
    const sunglassesGroup = new THREE.Group();
    sunglassesGroup.position.set(0, 1.16, 0.19);
    sunglassesGroup.rotation.x = -0.38;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.55,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.1,
      metalness: 0.85,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });
    const glareMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.45,
    });

    [-0.125, 0.125].forEach((lx) => {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.135, 0.032), frameMat);
      rim.position.set(lx, 0, 0);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.105, 0.036), lensMat);
      lens.position.set(lx, -0.004, 0.004);
      const topAccent = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.016, 0.038), accentMat);
      topAccent.position.set(lx, 0.06, 0.004);
      const glare = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.024), glareMat);
      glare.position.set(lx - 0.03, 0.015, 0.025);
      glare.rotation.z = 0.45;
      sunglassesGroup.add(rim, lens, topAccent, glare);
    });

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.028, 0.032), accentMat);
    bridge.position.set(0, 0.022, 0.004);
    sunglassesGroup.add(bridge);

    [-0.22, 0.22].forEach((tx) => {
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.34), frameMat);
      temple.position.set(tx, 0.02, -0.16);
      sunglassesGroup.add(temple);
    });

    bodyGroup.add(sunglassesGroup);
  }

  const armGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.52, 10);
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.48, 0.26, 0);
  const leftArm = new THREE.Mesh(armGeo, jacketMat);
  leftArm.position.set(0, -0.2, 0.12);
  const leftSleeveStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.42, 0.06),
    blueTrimMat
  );
  leftSleeveStripe.position.set(-0.08, -0.18, 0.12);
  leftArmPivot.add(leftArm, leftSleeveStripe);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.48, 0.26, 0);
  const rightArm = new THREE.Mesh(armGeo, jacketMat);
  rightArm.position.set(0, -0.2, 0.12);
  const rightSleeveStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.42, 0.06),
    blueTrimMat
  );
  rightSleeveStripe.position.set(0.08, -0.18, 0.12);
  rightArmPivot.add(rightArm, rightSleeveStripe);

  bodyGroup.add(leftArmPivot, rightArmPivot);
  charGroup.add(bodyGroup);

  if (member.id === 'minhyuk') {
    charGroup.position.set(0, -0.14, -0.38);
    leftLeg.rotation.x = -0.85;
    rightLeg.rotation.x = -0.85;
    leftArmPivot.rotation.x = -0.95;
    leftArmPivot.rotation.z = -0.25;
    rightArmPivot.rotation.x = -0.95;
    rightArmPivot.rotation.z = 0.25;

    const stickMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 });
    const stickL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.46, 8), stickMat);
    stickL.position.set(0.05, -0.42, 0.26);
    stickL.rotation.x = Math.PI * 0.42;
    leftArmPivot.add(stickL);

    const stickR = stickL.clone();
    stickR.position.x = -0.05;
    rightArmPivot.add(stickR);

    const drumKit = new THREE.Group();
    drumKit.position.set(0, 0, 0.58);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2,
    });
    const drumShellMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.45,
      roughness: 0.25,
    });
    const drumHeadMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const cymbalMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.8,
      roughness: 0.22,
    });

    const throne = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    throne.position.set(0, 0.54, -0.96);
    const throneLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.54, 10), chromeMat);
    throneLeg.position.set(0, 0.27, -0.96);
    drumKit.add(throne, throneLeg);

    const kickDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.72, 24),
      drumShellMat
    );
    kickDrum.rotation.x = Math.PI / 2;
    kickDrum.position.set(0, 0.68, 0.12);

    const kickFrontHead = new THREE.Mesh(new THREE.CircleGeometry(0.64, 24), drumHeadMat);
    kickFrontHead.position.set(0, 0.68, 0.49);
    const kickLogoRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x2563eb })
    );
    kickLogoRing.position.set(0, 0.68, 0.5);
    drumKit.add(kickDrum, kickFrontHead, kickLogoRing);

    const snare = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 18), drumHeadMat);
    snare.position.set(-0.38, 0.92, -0.36);
    const snareStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.85, 8), chromeMat);
    snareStand.position.set(-0.38, 0.42, -0.36);
    drumKit.add(snare, snareStand);

    [-0.24, 0.24].forEach((tx, idx) => {
      const tom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.23 - idx * 0.02, 0.23 - idx * 0.02, 0.24, 16),
        drumShellMat
      );
      tom.position.set(tx, 1.38, 0.02);
      tom.rotation.x = -0.28;
      const tomTop = new THREE.Mesh(
        new THREE.CircleGeometry(0.22 - idx * 0.02, 16),
        drumHeadMat
      );
      tomTop.position.set(tx, 1.49, -0.02);
      tomTop.rotation.x = -Math.PI / 2 - 0.28;
      drumKit.add(tom, tomTop);
    });

    const floorTom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.48, 18),
      drumShellMat
    );
    floorTom.position.set(0.56, 0.78, -0.28);
    const floorTomHead = new THREE.Mesh(new THREE.CircleGeometry(0.33, 18), drumHeadMat);
    floorTomHead.rotation.x = -Math.PI / 2;
    floorTomHead.position.set(0.56, 1.03, -0.28);
    drumKit.add(floorTom, floorTomHead);

    const cymbals = [
      { x: -0.76, y: 1.24, z: -0.25, r: 0.3 },
      { x: -0.66, y: 1.72, z: 0.16, r: 0.38 },
      { x: 0.74, y: 1.66, z: 0.12, r: 0.42 },
    ];
    cymbals.forEach((c) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, c.y, 8), chromeMat);
      stand.position.set(c.x, c.y / 2, c.z);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r, 0.02, 20), cymbalMat);
      disc.position.set(c.x, c.y, c.z);
      disc.rotation.z = c.x < 0 ? -0.14 : 0.14;
      drumKit.add(stand, disc);
    });

    root.add(drumKit);
  } else {
    const isBass = member.id === 'jungshin';
    const instrumentGroup = new THREE.Group();
    instrumentGroup.position.set(0.04, -0.16, 0.45);
    instrumentGroup.rotation.z = isBass ? 0.36 : 0.32;
    instrumentGroup.rotation.y = -0.12;

    const guitarBody = new THREE.Mesh(
      new THREE.BoxGeometry(isBass ? 0.56 : 0.52, isBass ? 0.74 : 0.66, 0.11),
      new THREE.MeshStandardMaterial({
        color: isBass ? 0x1e3a8a : 0xdc2626,
        emissive: isBass ? 0x000000 : 0x450a0a,
        emissiveIntensity: isBass ? 0 : 0.35,
        metalness: 0.38,
        roughness: 0.22,
      })
    );
    const pickguard = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.42, 0.125),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    pickguard.position.set(0.05, -0.04, 0);
    instrumentGroup.add(guitarBody, pickguard);

    const neckLen = isBass ? 1.18 : 0.92;
    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, neckLen, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
    );
    neck.position.set(0, 0.3 + neckLen / 2, 0.01);
    instrumentGroup.add(neck);

    const headstock = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.24, 0.07),
      new THREE.MeshStandardMaterial({ color: isBass ? 0x1e3a8a : 0xdc2626, roughness: 0.28 })
    );
    headstock.position.set(-0.02, 0.3 + neckLen + 0.1, 0.01);
    instrumentGroup.add(headstock);

    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.032, 6, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    strap.position.set(-0.08, 0.18, -0.34);
    strap.rotation.y = Math.PI / 2;
    strap.rotation.x = 0.42;
    instrumentGroup.add(strap);

    bodyGroup.add(instrumentGroup);

    leftArmPivot.rotation.x = -1.15;
    leftArmPivot.rotation.z = -0.45;

    if (member.id === 'yonghwa') {
      const yonghwaStickMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x2563eb,
        emissiveIntensity: 1.25,
        roughness: 0.14,
        metalness: 0.22,
      });
      const yonghwaStick = createTtuibongMesh(THREE, yonghwaStickMat);
      yonghwaStick.stickPivot.position.set(0, -0.44, 0.12);
      yonghwaStick.stickPivot.rotation.x = 2.45;
      yonghwaStick.stickPivot.scale.setScalar(0.92);
      rightArmPivot.add(yonghwaStick.stickPivot);
      rightArmPivot.rotation.x = -2.25;
      rightArmPivot.rotation.z = -0.18;
    } else {
      rightArmPivot.rotation.x = -0.95;
      rightArmPivot.rotation.z = 0.32;
    }
  }

  root.add(charGroup);

  const tagTex = createNameTagTexture(THREE, member.name, member.roleLabel, true);
  const tagSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false })
  );
  tagSprite.position.set(0, 2.75, 0);
  tagSprite.scale.set(2.9, 1.08, 1);
  root.add(tagSprite);

  root.traverse((child: any) => {
    child.userData = {
      ...child.userData,
      bandMemberQuote: member.quote,
    };
  });

  root.userData = {
    charGroup,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArmPivot,
    rightArmPivot,
    spotRing,
    tagSprite,
    memberName: member.name,
    memberRoleLabel: member.roleLabel,
    hasLightstick: member.id === 'yonghwa',
  };
  return root;
}
