import * as THREE from "three";
import {RoomEnvironment} from "three/examples/jsm/environments/RoomEnvironment.js";
import {Reflector} from "three/examples/jsm/objects/Reflector.js";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {OutputPass} from "three/examples/jsm/postprocessing/OutputPass.js";
import CARDBACK from "./cb.js";
const badge=(t,cls)=>{const b=document.getElementById("badge");if(b){b.textContent=t;b.className=cls||""}};
function hasWebGL(){try{const c=document.createElement("canvas");return !!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){return false}}
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();return this};
(function(){
if(!hasWebGL()){badge("CSS · no WebGL","css");window.PACK3D=null;return}
let R;try{R=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"})}catch(e){try{R=new THREE.WebGLRenderer({antialias:false})}catch(e2){badge("CSS · WebGL init failed","css");window.PACK3D=null;return}}
const mobile=matchMedia("(pointer:coarse)").matches||Math.min(innerWidth,innerHeight)<700;
const QP=(location.search.match(/[?&]quality=(high|medium|lite)/)||[])[1];const FORCED=!!QP;let tier=QP?{lite:0,medium:1,high:2}[QP]:(mobile?1:2);const TN=["Lite","Medium","High"];
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=.9;R.outputColorSpace=THREE.SRGBColorSpace;R.shadowMap.type=THREE.PCFSoftShadowMap;R.domElement.id="c3d";
R.setClearColor(0x03040a,1);
const W=2.4,H=4.2,D=.32,SEAL=.075,EDGE=.022,TEARV=.86;
let ENV=null;try{ENV=new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(R),.04).texture}catch(e){}
/* geometry */
function zf(u,v){if(v<SEAL||v>1-SEAL){const sd=Math.min(v,1-v)/SEAL;return EDGE*.55+.014*Math.pow(Math.abs(Math.sin(u*W*13)),.6)*(.4+.6*sd)}const vv=(v-.5)/(.5-SEAL);return D*Math.pow(Math.max(0,1-Math.pow(Math.abs(u),5)),.7)*Math.pow(Math.max(0,1-Math.pow(Math.abs(vv),7)),.6)+EDGE}
function geo(v0,v1,back){const nu=mobile?48:96,nv=Math.max(6,Math.round((mobile?110:200)*(v1-v0)));const g=new THREE.PlaneGeometry(W,H*(v1-v0),nu,nv);const p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const u=uv.getX(i)*2-1,v=v0+uv.getY(i)*(v1-v0);p.setXYZ(i,(back?-u:u)*W/2,(v-.5)*H,zf(u,v)*(back?-1:1));uv.setXY(i,back?1-uv.getX(i):uv.getX(i),v)}
 if(back)g.index.array.reverse();g.computeVertexNormals();return g}
const GF=geo(0,1,false),GB=geo(0,1,true);
const MAXA=Math.min(16,R.capabilities.getMaxAnisotropy()||1);
const crinkle=(()=>{const S=512,c=document.createElement("canvas");c.width=c.height=S;const x=c.getContext("2d");const hgt=new Float32Array(S*S);
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let k=0;k<70;k++){const a=rnd()*Math.PI,cx=rnd()*S,cy=rnd()*S,len=40+rnd()*160,amp=(rnd()-.5)*2,ca=Math.cos(a),sa=Math.sin(a);
  for(let t=-len;t<len;t+=1){for(let o=-4;o<=4;o++){const px=(((cx+ca*t-sa*o)|0)+S*4)%S,py=(((cy+sa*t+ca*o)|0)+S*4)%S;hgt[py*S+px]+=amp*(1-Math.abs(o)/5)*(1-Math.abs(t)/len)}}}
 const im=x.createImageData(S,S);for(let y=0;y<S;y++)for(let X=0;X<S;X++){const h=i=>hgt[i];const dx=h(y*S+(X+1)%S)-h(y*S+(X+S-1)%S),dy=h(((y+1)%S)*S+X)-h(((y+S-1)%S)*S+X);const n=1/Math.hypot(dx,dy,1);const o=(y*S+X)*4;
  im.data[o]=(-dx*n*.5+.5)*255;im.data[o+1]=(-dy*n*.5+.5)*255;im.data[o+2]=(n*.5+.5)*255;im.data[o+3]=255}
 x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.4,2.4);t.anisotropy=MAXA;return t})();
const edgeMat=new THREE.MeshStandardMaterial({color:0xb9bec8,metalness:.7,roughness:.35,envMapIntensity:.4,side:THREE.DoubleSide});
function edgeGeo(v0,v1){const a=Math.max(v0,SEAL),b=Math.min(v1,1-SEAL);if(b<=a)return null;const g=new THREE.PlaneGeometry(EDGE*2,H*(b-a),1,4);g.translate(0,((a+b)/2-.5)*H,0);g.rotateY(Math.PI/2);return g}
const GE=edgeGeo(0,1);
const shadowTex=(()=>{const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d");const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,"#000000d0");g.addColorStop(.5,"#00000070");g.addColorStop(1,"#00000000");x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
/* textures */
const loadImg=srcs=>new Promise(res=>{const l=[...srcs];const n=()=>{if(!l.length)return res(null);const im=new Image();im.crossOrigin="anonymous";im.onload=()=>res(im);im.onerror=n;im.src=l.shift()};n();setTimeout(()=>res(null),12000)});
function canvasTex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=MAXA;return t}
const alphaTex=(()=>{const c=document.createElement("canvas");c.width=256;c.height=1024;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,256,1024);x.fillStyle="#000";
 for(const y of[0,1024]){x.beginPath();x.moveTo(0,y);for(let i=0;i<=24;i++)x.lineTo(i*256/24,y+(i%2?(y?-1:1)*16:0));x.lineTo(256,y);x.fill()}return new THREE.CanvasTexture(c)})();
function sealBands(x,w,h){for(const y0 of[0,h*(1-SEAL)]){const g=x.createLinearGradient(0,y0,0,y0+h*SEAL);g.addColorStop(0,"#ddd");g.addColorStop(.5,"#888");g.addColorStop(1,"#eee");x.fillStyle=g;x.fillRect(0,y0,w,h*SEAL);x.fillStyle="#0004";for(let i=0;i<w;i+=7)x.fillRect(i,y0,3,h*SEAL)}}
function safeDraw(x,f){try{f()}catch(e){console.warn("tex draw",e)}}
async function frontTex(s,art){const c=document.createElement("canvas");c.width=512;c.height=896;const x=c.getContext("2d"),w=512,h=896;
 let g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,s.colors[0]);g.addColorStop(.55,s.colors[1]);g.addColorStop(1,s.colors[0]);x.fillStyle=g;x.fillRect(0,0,w,h);
 x.globalAlpha=.12;for(let i=-h;i<w;i+=26){x.fillStyle=i%52?"#fff":"#000";x.beginPath();x.moveTo(i,h);x.lineTo(i+h*.6,0);x.lineTo(i+h*.6+13,0);x.lineTo(i+13,h);x.fill()}x.globalAlpha=1;
 const [logo,ai]=await Promise.all([loadImg(logoSrcs(s)),loadImg(art.imgs.filter(u=>/tcgdex/.test(u)))]);
 // verify CORS-clean by test-drawing
 const clean=im=>{if(!im)return null;try{const t=document.createElement("canvas");t.width=t.height=2;const tx=t.getContext("2d");tx.drawImage(im,0,0,2,2);tx.getImageData(0,0,1,1);return im}catch(e){return null}};
 const L=clean(logo),A=clean(ai);
 if(A)safeDraw(x,()=>{x.save();x.shadowColor="#000a";x.shadowBlur=24;x.beginPath();x.roundRect(52,250,408,480,22);x.fillStyle="#fff";x.fill();x.restore();
  x.save();x.beginPath();x.roundRect(60,258,392,464,18);x.clip();const sw=A.width*.84,sh=sw*464/392;x.drawImage(A,A.width*.08,A.height*.1,sw,sh,60,258,392,464);x.restore()});
 if(L)safeDraw(x,()=>{const r=Math.min(400/L.width,150/L.height);x.shadowColor="#000c";x.shadowBlur=14;x.drawImage(L,w/2-L.width*r/2,165-L.height*r/2,L.width*r,L.height*r);x.shadowBlur=0});
 else{x.fillStyle="#fff";x.font="900 54px Orbitron,sans-serif";x.textAlign="center";x.fillText(s.name.toUpperCase(),w/2,180)}
 x.fillStyle="#fff";x.textAlign="center";x.font="800 26px Outfit,sans-serif";x.shadowColor="#000";x.shadowBlur=8;x.fillText("BOOSTER PACK · "+art.name.toUpperCase().slice(0,22),w/2,775);
 x.font="600 16px Outfit,sans-serif";x.fillText("POKÉMON TRADING CARD GAME · 10 CARDS",w/2,808);x.shadowBlur=0;sealBands(x,w,h);return canvasTex(c)}
function basicFront(s){const c=document.createElement("canvas");c.width=256;c.height=448;const x=c.getContext("2d");const g=x.createLinearGradient(0,0,256,448);g.addColorStop(0,s.colors[0]);g.addColorStop(.55,s.colors[1]);g.addColorStop(1,s.colors[0]);x.fillStyle=g;x.fillRect(0,0,256,448);
 x.fillStyle="#fff";x.textAlign="center";x.font="900 26px Orbitron,sans-serif";x.fillText(s.name.toUpperCase().slice(0,16),128,90);x.fillStyle="#ffffff30";x.fillRect(30,125,196,240);x.font="700 13px Outfit,sans-serif";x.fillStyle="#fff";x.fillText("BOOSTER PACK",128,395);sealBands(x,256,448);return canvasTex(c)}
function backTex(s){const c=document.createElement("canvas");c.width=256;c.height=448;const x=c.getContext("2d");const g=x.createLinearGradient(0,0,0,448);g.addColorStop(0,s.colors[1]);g.addColorStop(1,s.colors[0]);x.fillStyle=g;x.fillRect(0,0,256,448);
 x.fillStyle="#0007";x.fillRect(30,70,196,230);x.fillStyle="#fff9";for(let i=0;i<14;i++)x.fillRect(42,86+i*14,170-(i*37%60),5);x.fillStyle="#fff";x.fillRect(70,330,116,50);x.fillStyle="#000";for(let i=0;i<40;i++)x.fillRect(76+i*2.6,336,i%3?1:2,38);
 sealBands(x,256,448);return canvasTex(c)}
const cbTex=new THREE.TextureLoader().load(CARDBACK);cbTex.colorSpace=THREE.SRGBColorSpace;
async function realTex(url){const im=await loadImg([url]);if(!im)return null;try{const t=document.createElement("canvas");t.width=t.height=2;const x=t.getContext("2d");x.drawImage(im,0,0,2,2);x.getImageData(0,0,1,1)}catch(e){return null}
 const t=new THREE.Texture(im);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=MAXA;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;return t}
const realMat=map=>new THREE.MeshPhysicalMaterial({map,normalMap:crinkle,normalScale:new THREE.Vector2(.22,.22),alphaMap:alphaTex,alphaTest:.5,metalness:.1,roughness:.42,clearcoat:.5,clearcoatRoughness:.25,iridescence:.12,iridescenceIOR:1.3,envMapIntensity:.45,side:THREE.DoubleSide});
let realMats=null;
const mat=map=>new THREE.MeshPhysicalMaterial({map,normalMap:crinkle,normalScale:new THREE.Vector2(.22,.22),alphaMap:alphaTex,alphaTest:.5,metalness:.35,roughness:.32,clearcoat:.8,clearcoatRoughness:.15,iridescence:.35,iridescenceIOR:1.5,envMapIntensity:.6,side:THREE.DoubleSide});
function packMesh(fm,bm,v0=0,v1=1){const g=new THREE.Group();const f=new THREE.Mesh(v0===0&&v1===1?GF:geo(v0,v1,false),fm),b=new THREE.Mesh(v0===0&&v1===1?GB:geo(v0,v1,true),bm);f.castShadow=b.castShadow=true;g.add(f,b);
 const eg=v0===0&&v1===1?GE:edgeGeo(v0,v1);if(eg)for(const sx of[-1,1]){const e=new THREE.Mesh(eg,edgeMat);e.position.x=sx*W/2;g.add(e)}return g}
const glowTex=(()=>{const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d");const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,"#fff");g.addColorStop(.3,"#ffe9a0");g.addColorStop(1,"#ffd54a00");x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
/* ---------- WHEEL STAGE: full-screen ring ---------- */
const WS=new THREE.Scene();WS.environment=ENV;WS.background=new THREE.Color(0x04050d);WS.fog=new THREE.FogExp2(0x04050d,.045);
const WC=new THREE.PerspectiveCamera(42,1,.1,200);
const N=18,RING=11,STEP=Math.PI*2/N,FLOORY=-H/2-.4;
const key=new THREE.SpotLight(0xfff4e0,56,40,.45,.6,1.4);key.position.set(0,11,4);key.target.position.set(0,0,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);WS.add(key,key.target);
WS.add(new THREE.HemisphereLight(0x8090ff,0x110818,.3));
const rimA=new THREE.PointLight(0xff3fd0,22,40);rimA.position.set(-9,3,-2);const rimB=new THREE.PointLight(0x3fd8ff,22,40);rimB.position.set(9,2,-2);WS.add(rimA,rimB);const rimBack=new THREE.DirectionalLight(0xcfe0ff,.5);rimBack.position.set(0,4,-14);WS.add(rimBack);
// light shaft
const shaft=new THREE.Mesh(new THREE.ConeGeometry(2.6,13,32,1,true),new THREE.MeshBasicMaterial({color:0xffe6a8,transparent:true,opacity:.035,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));shaft.position.set(0,4.3,0);WS.add(shaft);
// floor
let refl=null;try{refl=new Reflector(new THREE.CircleGeometry(40,64),{textureWidth:mobile?384:768,textureHeight:mobile?384:768,color:0x3a3f58});refl.rotation.x=-Math.PI/2;refl.position.y=FLOORY;WS.add(refl)}catch(e){}
const fade=new THREE.Mesh(new THREE.CircleGeometry(40,64),new THREE.MeshStandardMaterial({color:0x05060f,transparent:true,opacity:.55,roughness:.3,metalness:.6}));fade.rotation.x=-Math.PI/2;fade.position.y=FLOORY+.005;fade.receiveShadow=true;WS.add(fade);
const ringGlow=new THREE.Mesh(new THREE.RingGeometry(RING-.08,RING+.08,128),new THREE.MeshBasicMaterial({color:0xffd54a,transparent:true,opacity:.35,blending:THREE.AdditiveBlending}));ringGlow.rotation.x=-Math.PI/2;ringGlow.position.set(0,FLOORY+.02,-RING);WS.add(ringGlow);
const spot=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));spot.scale.set(6,6,1);spot.position.set(0,FLOORY+.05,0);WS.add(spot);
// particles
const PC=mobile?500:1400;const pg=new THREE.BufferGeometry();const pp=new Float32Array(PC*3);for(let i=0;i<PC;i++){pp[i*3]=(Math.random()-.5)*60;pp[i*3+1]=Math.random()*20+FLOORY;pp[i*3+2]=(Math.random()-.5)*60-8}
pg.setAttribute("position",new THREE.BufferAttribute(pp,3));const parts=new THREE.Points(pg,new THREE.PointsMaterial({size:.09,map:glowTex,color:0xbfd4ff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));WS.add(parts);
// distant pillars / skyline for depth
for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=30;const m=new THREE.Mesh(new THREE.BoxGeometry(.6,18,.6),new THREE.MeshBasicMaterial({color:i%2?0xff3fd0:0x3fd8ff,transparent:true,opacity:.25,blending:THREE.AdditiveBlending}));m.position.set(Math.sin(a)*r,FLOORY+9,Math.cos(a)*r-RING);WS.add(m)}
let mats=[],back=null,slots=[];const ringG=new THREE.Group();WS.add(ringG);
async function setPacks(s,arts){P.set=s;back=mat(backTex(s));const plain=mat(basicFront(s));mats=arts.map(()=>plain);
 ringG.clear();slots=[];for(let k=0;k<N;k++){const g=packMesh(mats[0],back);ringG.add(g);slots.push(g);const cs=new THREE.Mesh(new THREE.PlaneGeometry(W*1.5,1.6),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:.85}));cs.rotation.x=-Math.PI/2;ringG.add(cs);g.userData.cs=cs}
 enterStage();
 realMats=null;const RL=PACKART[s.dex];if(RL){const rt=await Promise.all(RL.map(realTex));if(rt.every(Boolean)){realMats=rt.map(realMat);P.real=rt.length;return}}P.real=0;
 const fts=await Promise.all(arts.map(a=>frontTex(s,a).catch(()=>null)));mats=fts.map(t=>t?mat(t):plain)}
function enterStage(){const ww=document.getElementById("wheelwrap");if(!ww.contains(R.domElement))ww.prepend(R.domElement);ww.classList.add("three");document.getElementById("vWheel").classList.add("stage");document.body.classList.add("staged")}
function leaveStage(){document.getElementById("vWheel").classList.remove("stage");document.body.classList.remove("staged")}
/* ---------- TEAR SCENE ---------- */
const TS=new THREE.Scene();TS.environment=ENV;TS.background=new THREE.Color(0x05060f);const TC=new THREE.PerspectiveCamera(35,1,.1,100);
{const d=new THREE.DirectionalLight(0xffffff,1.0);d.position.set(3,8,6);TS.add(d,new THREE.AmbientLight(0x8899ff,.18));const rb=new THREE.DirectionalLight(0xcfe0ff,.6);rb.position.set(0,3,-8);TS.add(rb);const a=new THREE.PointLight(0xff4fd8,7,30);a.position.set(-6,2,3);const b=new THREE.PointLight(0x4fe3ff,7,30);b.position.set(6,1,3);TS.add(a,b)}
const tearG=new THREE.Group();TS.add(tearG);let body,strip,pivot,glow,spill,cards=[],tp={p:0,sp:0,dir:1,fin:0,start:0};
const cardMats=[...Array(4)].map(()=>new THREE.MeshStandardMaterial({color:0xdddddd})).concat([new THREE.MeshStandardMaterial({map:cbTex,roughness:.35}),new THREE.MeshStandardMaterial({map:cbTex,roughness:.35})]);
async function tearStart(art,i){tearG.clear();let fm;if(realMats&&i!=null)fm=realMats[packVariant(P.set,i)];else try{fm=mat(await frontTex(P.set,art))}catch(e){fm=back}
 body=packMesh(fm,back,0,TEARV);pivot=new THREE.Group();strip=packMesh(fm,back,TEARV,1);pivot.add(strip);tearG.add(body,pivot);
 glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));glow.position.set(0,(TEARV-.5)*H,0);glow.scale.set(W*1.6,1,1);tearG.add(glow);
 spill=new THREE.PointLight(0xffe29a,0,12);spill.position.set(0,(TEARV-.5)*H+.2,1);tearG.add(spill);
 cards=[];for(let i=0;i<5;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(W*.82,W*.82*1.39,.012),cardMats);c.position.set(0,-.3,0);c.visible=false;tearG.add(c);cards.push(c)}
 tp={p:0,sp:0,dir:1,fin:0,start:performance.now()};document.getElementById("tear").prepend(R.domElement);P.active2=true}
const tearP=(p,dir)=>{tp.p=p;tp.dir=dir||1},tearFinish=()=>{tp.fin=performance.now()};
function tearEnd(){P.active2=false;tearG.clear();leaveStage();document.getElementById("wheelwrap").prepend(R.domElement)}
/* ---------- render / quality ---------- */
const comp=new EffectComposer(R);const rp=new RenderPass(WS,WC);comp.addPass(rp);
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.22,.4,.9);comp.addPass(bloom);comp.addPass(new OutputPass());
function applyTier(){R.setPixelRatio(Math.min(devicePixelRatio,[.7,1.25,1.75][tier]));bloom.enabled=tier>0;if(refl)refl.visible=tier>1||(!mobile&&tier>0);R.shadowMap.enabled=tier>1;key.castShadow=tier>1;
 fade.material.opacity=refl&&refl.visible?.55:.9;parts.visible=true;lastW=0;badge("3D · "+TN[tier],"three");P.tier=TN[tier]}
let lastW=0,lastH=0;function size(el,cam){const w=el.clientWidth||innerWidth,h=el.clientHeight||innerHeight;if(w!==lastW||h!==lastH){R.setSize(w,h,false);comp.setSize(w,h);bloom.resolution.set(w/2,h/2);lastW=w;lastH=h}cam.aspect=w/h;cam.updateProjectionMatrix();return[w,h]}
const ease=t=>1-Math.pow(1-t,3);let ft=16,lastNow=0,slowSince=0,landT=0;
function frame(now){requestAnimationFrame(frame);const T=now/1000;
 if(lastNow){ft=ft*.92+Math.min(now-lastNow,300)*.08;if(!FORCED&&ft>40&&tier>0){if(!slowSince)slowSince=now;else if(now-slowSince>1500){tier--;applyTier();slowSince=0;ft=20}}else slowSince=0}lastNow=now;
 if(P.active2){const [w,h]=size(document.getElementById("tear"),TC);
  const dist=H*h/(435*2*Math.tan(THREE.MathUtils.degToRad(17.5)));TC.position.set(0,0,dist);TC.lookAt(0,0,0);
  const k=Math.min((now-tp.start)/900,1);tearG.rotation.y=(1-ease(k))*Math.PI*1.2+Math.sin(T*1.3)*.04;tearG.rotation.x=Math.sin(T*.9)*.03;
  tp.sp+=((tp.fin?1:tp.p)-tp.sp)*(tp.fin?.3:.35);const p=tp.sp,dir=tp.dir;
  pivot.position.set(dir>0?W/2:-W/2,(TEARV-.5)*H,0);strip.position.set(dir>0?-W/2:W/2,-(TEARV-.5)*H,0);pivot.rotation.set(-p*.7,dir*p*.35,dir*p*.55);
  glow.material.opacity=Math.min(.4,p*.6);glow.scale.set(W*1.4*Math.max(p,.05),.4+p*1,1);spill.intensity=p*3.5;
  if(tp.fin){const f=(now-tp.fin)/1000;pivot.position.x+=dir*f*f*14;pivot.position.y+=f*6;pivot.rotation.z+=dir*f*4;glow.scale.set(W*1.6,1+f*2,1);glow.material.opacity=Math.max(0,.35-f*.3);spill.intensity=Math.max(0,3.5+f*2-f*f*1.5);
   cards.forEach((c,i)=>{const t=Math.max(0,Math.min(1,(f-.25-i*.12)/.6));c.visible=t>0;c.position.set((i-2)*.12*t,-.3+ease(t)*(H*.72),.05+i*.015);c.rotation.z=(i-2)*.06*t});tearG.rotation.y=0;body.position.y=-Math.max(0,f-1)*6}
  rp.scene=TS;rp.camera=TC;bloom.strength=.12;R.toneMappingExposure=.82;comp.render();R.toneMappingExposure=.9;return}
 const vw=document.getElementById("vWheel");if(!vw.classList.contains("on")||!slots.length)return;
 size(document.getElementById("wheelwrap"),WC);
 const c=pos/PW,ci=Math.round(c),landed=state==="landed",vel=typeof speed==="number"?speed:0,av=Math.min(Math.abs(vel)/40,1);
 if(landed&&!landT)landT=now;if(!landed)landT=0;const lt=landT?Math.min((now-landT)/1000,1):0;
 slots.forEach((g,k)=>{const i=ci+k-Math.floor(N/2),dx=i-c,th=dx*STEP,ad=Math.abs(dx);
  g.children[0].material=realMats?realMats[packVariant(P.set,i)]:(mats[((i%4)+4)%4]||mats[0]);
  const front=Math.max(0,1-ad);const lift=front*(.25+ease(lt)*1.2);
  g.position.set(Math.sin(th)*RING,lift+Math.sin(T*1.4+i)*.07,Math.cos(th)*RING-RING+front*(.8+ease(lt)*1.6));
  g.rotation.set(Math.sin(T+i*.7)*.03,th+(landed&&ad<.5?ease(lt)*Math.PI*2:Math.sin(T*.8+i)*.05),-vel*.002);g.visible=Math.cos(th)>-.35;const cs=g.userData.cs;if(cs){cs.visible=g.visible;cs.position.set(g.position.x,FLOORY+.03,g.position.z);cs.rotation.z=-th;const hgt=g.position.y+H/2+.4;cs.material.opacity=.85/(1+hgt*.6);cs.scale.setScalar(1+hgt*.25)}});
 // camera motion: gentle orbit, pulls back with speed, pushes in when landed
 const cz=8.2+av*3-ease(lt)*2.2,cy=1.5+av*1.2-ease(lt)*.5;WC.position.set(Math.sin(T*.25)*.8,cy+Math.sin(T*.4)*.15,cz);WC.lookAt(0,.2+ease(lt)*.8,-1.5);
 parts.rotation.y=T*.02;shaft.material.opacity=.03+ease(lt)*.04;spot.material.opacity=.22+ease(lt)*.2;key.intensity=56+ease(lt)*30;ringGlow.material.opacity=.2+av*.3;
 rp.scene=WS;rp.camera=WC;bloom.strength=.22+ease(lt)*.2;comp.render()}
const P=window.PACK3D={ok:true,get _slots(){return slots},get _mats(){return mats},active:true,setPacks,tearStart,tearP,tearFinish,tearEnd,leaveStage,get tierName(){return TN[tier]}};
applyTier();requestAnimationFrame(frame);
if(document.getElementById("vWheel").classList.contains("on")&&packArts.length)setPacks(set,packArts);
console.log("PACK3D ready",TN[tier]);
})();
