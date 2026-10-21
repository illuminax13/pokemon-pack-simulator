/* ---------- F7: value-aware best pull + interactive 3D booster box ---------- */
function rRank(c){const r=String(c.rarity||"").toLowerCase();
 if(/mega hyper/.test(r))return 100;if(/iconic/.test(r))return 97;if(/enchanted/.test(r))return 95;
 if(/hyper|gold|secret|rainbow|black white/.test(r))return 92;
 if(/special illustration|futuristic|rgb|gallery v/.test(r))return 85;
 if(/epic/.test(r))return 78;if(/shiny ultra/.test(r))return 62;
 if(/ultra|vmax|vstar|\bgx\b|\bex\b|holo v\b|rare v\b|lv\.x|prime|legend/.test(r)&&!/legendary/.test(r))return 72;
 if(/legendary/.test(r))return 70;if(/illustration/.test(r))return 65;
 if(/radiant|amazing|ace spec|shiny|star/.test(r))return 58;if(/double/.test(r))return 55;
 if(/super rare/.test(r))return 40;if(/holo/.test(r))return 35;
 return (TIERS[c.tier||tier(c.rarity)]||0)*8+(c.rev?1:0)}
function bestCmp(s){const pv=c=>{try{const r=typeof priceOf==="function"?priceOf(c,s):null;return r&&r.v>0?r.v:null}catch(e){return null}};
 /* transitive: priced cards by market price (rarity breaks ties); cards without a price yet fall back to rarity rank after them */
 return (a,b)=>{const pa=pv(a),pb=pv(b);if(pa!=null&&pb!=null){const d=Math.round(pb*100)-Math.round(pa*100);return d||rRank(b)-rRank(a)}if(pa!=null||pb!=null)return pa!=null?-1:1;return rRank(b)-rRank(a)}}
function bestOf(list,s){return list&&list.length?list.slice().sort(bestCmp(s))[0]:null}
/* box summary: re-rank hits + best pull when prices arrive */
function bxResort(B){if(!B||!B.hitList||!$("bxhits"))return;const s=B.s,cmp=bestCmp(s),sig=l=>l.map(x=>x.k+":"+x.c.id+(x.c.rev?"r":"")).join();
 const nh=B.hitList.slice().sort((a,b)=>cmp(a.c,b.c)||a.k-b.k);
 if(sig(nh)!==sig(B.hitList)){B.hitList=nh;$("bxhits").innerHTML=nh.map((x,j)=>bxThumb(x.c,x.k,j,1)).join("")}
 const pool=nh.length?nh:(B.allList||[]),best=pool.length?pool.slice().sort((a,b)=>cmp(a.c,b.c)||a.k-b.k)[0]:null;
 if(best&&B.best&&best.c!==B.best.c){B.best=best;const bb=document.querySelector("#boxv .bbc"),bi=document.querySelector("#boxv .bbi");
  if(bb){bb.innerHTML=`<button class="bxt bbimg t${BXT(best.c.tier)}" aria-label="Zoom best pull">${img(best.c.imgs,best.c.name,best.c.rarity).replace("<img ",'<img decoding="async" ')}</button>`;bb.firstChild.onclick=()=>openZoom([zItem(B.best.c,s)],0)}
  if(bi)bi.innerHTML=`<b>${esc(best.c.name)}</b><br>${esc(best.c.rarity)}${best.c.rev?(s.game==="lor"?" · Foil":" · Reverse holo"):""}<br>Pack #${best.k+1}<br><span class="pr" id="bxbestp"></span>`}}
/* persistence: resume a half-opened box */
const BXK="ppsBox";
function boxSave(){const B=BOX;if(!B)return;try{let m={};try{m=JSON.parse(localStorage.getItem(BXK)||"{}")||{}}catch(e){}
 if(!B.done.includes(0)&&!B.fly){delete m[B.s.dex]}else{const strip=c=>{const o={...c};delete o.imgs;return o};
  m[B.s.dex]={t:Date.now(),prod:B.prod,wrap:B.wrap?1:0,lid:B.lid?1:0,done:B.done,packs:B.packs.map(p=>({c:p.map(strip),g:p.god||null}))}}
 Object.keys(m).sort((a,b)=>m[b].t-m[a].t).slice(3).forEach(k=>delete m[k]);localStorage.setItem(BXK,JSON.stringify(m))}catch(e){}}
function boxRestore(s){let m;try{m=(JSON.parse(localStorage.getItem(BXK)||"{}")||{})[s.dex]}catch(e){}const d=cache[s.dex];if(!m||!m.packs||!d||!m.done.includes(0))return false;
 try{const by={};Object.values(d.pools||{}).forEach(l=>Array.isArray(l)&&l.forEach(c=>{if(c&&c.id)by[c.id]=c}));
  const hyd=c=>({...c,imgs:(by[c.id]&&by[c.id].imgs)||[]});const packs=m.packs.map(p=>{const a=p.c.map(hyd);if(p.g)a.god=p.g;return a});
  BOX={s,prod:m.prod,packs,done:m.done.slice(),res:packs.map((p,k)=>m.done[k]?p:undefined),gen:0,showAll:BOX?BOX.showAll:false,t0:0,fast:0,wrap:m.wrap,lid:m.lid};return true}catch(e){return false}}
/* ---- 3D box ---- */
const BX3={};
function bxShape(B){const n=B.prod.name||"";return /elite/i.test(n)?"etb":/bundle/i.test(n)?"bundle":"box"}
function box3dBuild(B,host){if(!host)return;const s=B.s,shape=bxShape(B),arts=(PACKART[s.dex]||[]),art=i=>arts.length?arts[i%arts.length]:"",lor=s.game==="lor";
 const [W,D,H,LH]={box:[300,200,150,44],etb:[220,124,206,68],bundle:[150,66,214,26]}[shape],W2=W+6,D2=D+6;
 const logo=img(logoSrcs(s),s.name,"").replace("<img ",'<img decoding="async" draggable="false" class="bxlogo" ');
 const label=esc(`${B.prod.real?B.prod.name:"Virtual booster box"} · ${B.prod.n} packs`),brand=lor?"Disney Lorcana":"Pokémon TCG";
 const fans=`<div class="bxart">${[0,1,2].map(i=>`<img src="${art(i)}" alt="" draggable="false" decoding="async">`).join("")}</div>`;
 const F=(c,w,h,tf,inner="",n="")=>`<div class="f ${c}"${n?` data-n="${n}"`:""} style="width:${w}px;height:${h}px;transform:translate(-50%,-50%) ${tf}">${inner}</div>`,wr=`<i class="wr"></i>`;
 const off=`translate3d(0,${LH/2}px,${D2/2}px)`;
 host.className="bx3d "+shape+(B.wrap?" torn":"")+(B.lid?" open":"");host.style.cssText=`--c0:${s.colors[0]};--c1:${s.colors[1]||s.colors[0]}`;
 host.innerHTML=`<div class="bxscene" aria-label="Sealed ${label}. Swipe across to tear the wrap, then swipe up to open the lid."><div class="bxshadow"></div><div class="bxfloat"><div class="bxobj">
 <div class="bxbd"><div class="bxin"></div>${F("o fr",W,H,`translateZ(${D/2}px)`,`${fans}<div class="bxlbl">${label}</div>${wr}<i class="strip"></i>`,"0,0,1")}${F("o bk",W,H,`rotateY(180deg) translateZ(${D/2}px)`,`<div class="bxvt">${brand}</div>${wr}`,"0,0,-1")}
 ${F("o sd",D,H,`rotateY(-90deg) translateZ(${W/2}px)`,`<div class="bxvt">${esc(s.name)}</div>${wr}`,"-1,0,0")}${F("o sd",D,H,`rotateY(90deg) translateZ(${W/2}px)`,`<div class="bxvt">${brand}</div>${wr}`,"1,0,0")}
 ${F("bt",W,D,`rotateX(-90deg) translateZ(${H/2}px)`,"","0,1,0")}</div>
 <div class="bxlid">${F("o lt",W2,D2,`${off} rotateX(90deg) translateZ(${LH/2}px)`,`${shape==="box"?fans:""}${logo}${wr}`,"0,-1,0")}${F("lu",W2,D2,`${off} rotateX(-90deg) translateZ(${LH/2-1}px)`,"","0,1,0")}
 ${F("o lf",W2,LH,`${off} translateZ(${D2/2}px)`,`<div class="bxvt">${shape==="box"?esc(s.name):brand}</div>${wr}<i class="strip"></i>`,"0,0,1")}${F("o lb",W2,LH,`${off} rotateY(180deg) translateZ(${D2/2}px)`,"","0,0,-1")}
 ${F("o ls",D2,LH,`${off} rotateY(-90deg) translateZ(${W2/2}px)`,wr,"-1,0,0")}${F("o ls",D2,LH,`${off} rotateY(90deg) translateZ(${W2/2}px)`,wr,"1,0,0")}</div>
 </div></div><div class="bxfx"></div></div><div class="bxleftn"></div><div class="bxpips" aria-hidden="true"></div><p class="bxhint"></p>`;
 const sc=host.querySelector(".bxscene"),obj=host.querySelector(".bxobj"),lid=host.querySelector(".bxlid");
 const X=Object.assign(BX3,{wrs:[...host.querySelectorAll(".wr,.strip")],sh:null,B,host,sc,obj,lid,W,D,H,LH,D2,shape,art,rx:0,ry:0,drx:0,dry:0,tp:0,ang:B.lid?112:0,packs:0});
 X.fit=()=>{const w=sc.clientWidth||340,h=sc.clientHeight||340;X.k=Math.min(1.25,(w-24)/(Math.max(W,D)*1.2),h/((H+LH)*1.75+(shape==="box"?D*.5:D*.2)));host.style.setProperty("--k",X.k.toFixed(3));X.apply()};
 X.base=()=>B.lid?[-52,-8]:[-20,-24];
 X.apply=()=>{const [bx,by]=X.base(),g=(typeof GY!=="undefined"&&GY.st==="on")?[GY.y*9,GY.x*14]:[0,0],rx=Math.max(-62,Math.min(8,bx+X.drx+g[0])),ry=by+X.dry+g[1];X.cam=[rx,ry];X.vis();
  const k=X.k*(B.lid?.88:1);obj.style.transform=`translate3d(0,${(H*.18+(B.lid?H*.42:0))*X.k}px,0) scale3d(${k},${k},${k}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;const sh=Math.round((50+ry*1.4)/3)*3;if(sh!==X.sh&&!B.wrap){X.sh=sh;X.wrs.forEach(w=>{if(w.tagName==="I"&&w.className==="wr")w.style.backgroundPosition=`${sh}% 0,0 0`})}};
 X.lidT=a=>{lid.style.transform=`translate3d(0,${-H/2-1}px,${-D2/2}px) rotateX(${a.toFixed(1)}deg)`;X.vis()};
 X.vis=()=>{const [ax,ay]=X.cam||[0,0],r=Math.PI/180,cx=Math.cos(ax*r),sx=Math.sin(ax*r),cy=Math.cos(ay*r),sy=Math.sin(ay*r),cl=Math.cos(X.ang*r),sl=Math.sin(X.ang*r);
  /* world z of each face normal, Rx(cam)·Ry(cam)·[Rx(lid)]·n: cull back faces ourselves so it also paints right where WebKit flattens */
  for(const f of X.faces){let [x,y,z]=f.n;if(f.l){const y2=cl*y-sl*z,z2=sl*y+cl*z;y=y2;z=z2}const z1=-sy*x+cy*z,wz=sx*y+cx*z1,v=wz>.015;if(v!==f.v){f.v=v;f.e.style.visibility=v?"":"hidden"}}
  const behind=X.ang>90,bd=X.host.querySelector(".bxbd");if(behind!==X.behind){X.behind=behind;if(behind)bd.before(lid);else bd.after(lid)}};
 bxFaces(X);X.behind=null;X.cam=X.base();X.lidT(X.ang);if(B.lid||B.wrap)bxPacks(X);if(!B.wrap)requestAnimationFrame(()=>bxCurl(X,0,0,0,1));bxStatus(X);X.fit();requestAnimationFrame(X.fit);bxGestures(X)}
function bxFaces(X){X.faces=[...X.host.querySelectorAll(".f[data-n]")].map(e=>({e,n:e.dataset.n.split(",").map(Number),l:!!e.closest(".bxlid"),v:null}))}
function bxStatus(X){const B=X.B,left=boxLeft(),n=B.prod.n,h=X.host.querySelector(".bxhint");
 X.host.querySelector(".bxleftn").textContent=`${left} of ${n} packs left`;
 X.host.querySelector(".bxpips").innerHTML=B.done.map(d=>`<i${d?' class="x"':""}></i>`).join("");
 h.innerHTML=!B.wrap?"👆 <b>Swipe across</b> the box to tear the wrap":!B.lid?"☝️ <b>Swipe up</b> to open the lid":left?"Tap a pack to pull it out — or Open All":"Box empty!";
 const a=$("bxall");if(a){a.disabled=!B.lid||!left;a.textContent=`⚡ Open All (${left})`}}
function bxPacks(X){const B=X.B,{W,D,H}=X,n=B.prod.n,inn=X.host.querySelector(".bxin");if(X.packs)return;X.packs=1;
 const cols=n>=30?3:n>=16?2:1,per=Math.ceil(n/cols),cw=(W-12)/cols;let ph=Math.min(H-8,(cw-6)/.571),pw=ph*.571;if(pw>cw-4){pw=cw-4;ph=pw/.571}
 const step=Math.min(14,(D-14)/Math.max(1,per)),z0=-(D/2-8),rnd=k=>{const x=Math.sin(k*91.7+B.s.dex.length*7.3)*43758.5;return x-Math.floor(x)};let h="";
 B.packs.forEach((p,k)=>{if(B.done[k])return;const c=Math.floor(k/per),i=k%per,x=-W/2+6+cw*(c+.5)+(rnd(k)-.5)*4,z=per>1?z0+i*(D-16)/(per-1):0,y=H/2-ph/2-2-rnd(k+9)*5,r=(rnd(k+3)-.5)*3;
  X["p"+k]=`translate3d(${(x-pw/2).toFixed(1)}px,${(y-ph/2).toFixed(1)}px,${Math.min(D/2-6,z).toFixed(1)}px) rotateZ(${r.toFixed(1)}deg)`;
  h+=`<img class="bxp" data-k="${k}" data-c="${c}" src="${X.art(k)}" alt="Pack ${k+1}" draggable="false" decoding="async" style="width:${pw.toFixed(0)}px;height:${ph.toFixed(0)}px;transform:${X["p"+k]}">`});
 const walls=`<div class="f in" data-n="0,0,1" style="width:${W}px;height:${H}px;transform:translate(-50%,-50%) translateZ(${-(D/2-1)}px)"></div><div class="f in" data-n="1,0,0" style="width:${D}px;height:${H}px;transform:translate(-50%,-50%) rotateY(90deg) translateZ(${-(W/2-1)}px)"></div><div class="f in" data-n="-1,0,0" style="width:${D}px;height:${H}px;transform:translate(-50%,-50%) rotateY(-90deg) translateZ(${-(W/2-1)}px)"></div><div class="f in ib" data-n="0,-1,0" style="width:${W}px;height:${D}px;transform:translate(-50%,-50%) rotateX(90deg) translateZ(${-(H/2-1)}px)"></div>`;
 inn.innerHTML=walls+h;bxFaces(X);X.vis()}
function bxCurl(X,x,y,burst,prep){const fx=X.host.querySelector(".bxfx");if(!fx)return;
 if(!X.cps){X.cps=[];X.cpi=0;for(let j=0;j<20;j++){const e=document.createElement("i");e.className="cp";fx.appendChild(e);X.cps.push(e)}}
 if(prep)return;/* pooled plastic shards animated with WAAPI (transform/opacity only, no DOM churn mid-swipe) */
 const m=burst?10:1;for(let j=0;j<m;j++){const e=X.cps[X.cpi++%X.cps.length],a=Math.random()*Math.PI*2,d=burst?60+Math.random()*120:30+Math.random()*50,
  dx=Math.cos(a)*d,dy=Math.sin(a)*d*.6-30-Math.random()*40,r=Math.random()*540-270,sc=.6+Math.random()*.8;
  try{e.getAnimations().forEach(q=>q.cancel());e.animate([{transform:`translate(${x}px,${y}px) rotate(0deg) scale(1)`,opacity:1},{transform:`translate(${(x+dx).toFixed(0)}px,${(y+dy).toFixed(0)}px) rotate(${r.toFixed(0)}deg) scale(${sc.toFixed(2)})`,opacity:0}],{duration:900+Math.random()*200,easing:"cubic-bezier(.2,.7,.3,1)",fill:"forwards"})}catch(_){}}}
function bxSfx(n,a){try{if(typeof sfx!=="undefined"&&sfx[n])sfx[n](a)}catch(e){}}
function bxHap(p){try{if(typeof haptic==="function")haptic(p)}catch(e){}}
function bxTorn(X,px,py){const B=X.B;if(B.wrap)return;B.wrap=1;X.host.classList.add("torn");bxCurl(X,px,py,1);bxSfx("rip");bxHap([12,30,18]);boxSave();bxStatus(X);
 const pr=document.querySelector("#boxv .bxprods");if(pr)pr.remove();setTimeout(()=>{X.wrs.forEach(e=>e.remove());X.wrs=[];if(X.B===BOX&&!X.packs&&X.host.isConnected)bxPacks(X)},520)}
function bxLidTo(X,open){const B=X.B;X.lid.classList.add("ease");X.ang=open?112:0;X.lidT(X.ang);setTimeout(()=>X.lid.classList.remove("ease"),600);
 if(open&&!B.lid){B.lid=1;X.host.classList.add("open");bxSfx("snap");bxHap(15);boxSave();X.obj.classList.add("ease");X.apply();setTimeout(()=>X.obj.classList.remove("ease"),650);bxStatus(X)}}
function bxPull(X,k){const B=X.B,e=X.host.querySelector(`.bxp[data-k="${k}"]`);if(!e||B.done[k]||X.busy)return;X.busy=1;bxSfx("tick");bxHap(10);
 e.classList.add("lift");e.style.transform=X["p"+k]+` translate3d(0,${-X.H*1.15}px,30px)`;setTimeout(()=>{X.busy=0;boxOne(k)},430)}
function box3dOpenAll(){const X=BX3,B=BOX;if(!B||!B.lid||B.fly||X.B!==B||X.busy)return;X.busy=1;const ks=[];B.done.forEach((d,k)=>{if(!d)ks.push(k)});
 ks.slice(-8).reverse().forEach((k,j)=>setTimeout(()=>{const e=X.host.querySelector(`.bxp[data-k="${k}"]`);if(e){e.classList.add("lift");e.style.transform=X["p"+k]+` translate3d(0,${-X.H*1.3}px,60px)`;bxSfx("tick")}},j*60));
 setTimeout(()=>{X.busy=0;if(BOX===B){const v=$("boxv");if(v)v.scrollTop=0;boxFast()}},Math.min(8,ks.length)*60+380)}
function bxGestures(X){const sc=X.sc,B=X.B;let d=null;
 sc.onpointerdown=e=>{if(e.button>0)return;d={x:e.clientX,y:e.clientY,t:performance.now(),lx:e.clientX,mode:null,id:e.pointerId,moved:0,r:sc.getBoundingClientRect()};try{sc.setPointerCapture(e.pointerId)}catch(_){}X.obj.classList.remove("ease");X.lid.classList.remove("ease")};
 sc.onpointermove=e=>{if(!d||e.pointerId!==d.id)return;const dx=e.clientX-d.x,dy=e.clientY-d.y,r=d.r;d.moved=Math.max(d.moved,Math.hypot(dx,dy));
  if(!d.mode&&d.moved>8)d.mode=!B.wrap&&Math.abs(dx)>Math.abs(dy)?"tear":B.wrap&&!B.lid&&dy<0&&Math.abs(dy)>Math.abs(dx)?"lid":"rot";
  X.dry=Math.max(-28,Math.min(28,dx*(d.mode==="rot"?.18:.05)));X.drx=Math.max(-14,Math.min(14,-dy*(d.mode==="rot"?.1:.02)));X.apply();
  if(d.mode==="tear"){const run=Math.abs(e.clientX-d.lx);if(run>44){d.lx=e.clientX;bxCurl(X,e.clientX-r.left,e.clientY-r.top);bxSfx("crinkle",.03+run/900);if(Math.random()<.4)bxHap(6)}
   const tp=Math.max(X.tp,Math.min(1,Math.abs(dx)/(r.width*.55)));if(tp-X.tp>.015||tp>=1){X.tp=tp;const ci=`scaleX(${(1-tp).toFixed(3)})`;X.wrs.forEach(w=>w.style.transform=ci)}if(X.tp>=1)bxTorn(X,e.clientX-r.left,e.clientY-r.top)}
  if(d.mode==="lid"){if(!X.packs)bxPacks(X);X.ang=Math.max(0,Math.min(112,-dy/(r.height*.45)*112));X.lidT(X.ang);if(X.ang>20&&!d.cr){d.cr=1;bxSfx("crinkle",.05)}}};
 const up=e=>{if(!d||e.pointerId!==d.id)return;const m=d.mode,tap=d.moved<9&&performance.now()-d.t<500;d=null;
  if(m==="lid")bxLidTo(X,X.ang>40);
  if(tap&&B.lid){const t=document.elementFromPoint(e.clientX,e.clientY);let p=t&&t.closest&&t.closest(".bxp");
   /* forgiving tap: anywhere on the open box pulls the front pack of the nearest row */
   if(!p&&t&&t.closest&&t.closest(".bxobj")){let bd=1e9;const qs=[...X.host.querySelectorAll(".bxp:not(.lift)")];qs.forEach(q=>{const r=q.getBoundingClientRect(),dd=Math.abs(r.left+r.width/2-e.clientX);if(dd<bd){bd=dd;p=q}});
    if(p){const c=p.dataset.c;p=qs.filter(q=>q.dataset.c===c).pop()}}
   if(p)bxPull(X,+p.dataset.k)}
  else if(tap&&!B.wrap){const h=X.host.querySelector(".bxhint");h.classList.remove("nudge");void h.offsetWidth;h.classList.add("nudge")}
  X.drx=X.dry=0;X.obj.classList.add("ease");X.apply();setTimeout(()=>X.obj.classList.remove("ease"),650)};
 sc.onpointerup=up;sc.onpointercancel=up;
 /* keyboard / switch access: Enter or Space steps through tear -> lid -> pull front pack */
 sc.tabIndex=0;sc.setAttribute("role","button");sc.onkeydown=e=>{if(e.key!=="Enter"&&e.key!==" ")return;e.preventDefault();const r=sc.getBoundingClientRect();
  if(!B.wrap)bxTorn(X,r.width/2,r.height/2);else if(!B.lid){if(!X.packs)bxPacks(X);bxLidTo(X,1)}else{const q=[...X.host.querySelectorAll(".bxp:not(.lift)")].pop();if(q)bxPull(X,+q.dataset.k)}}}
{const gt=gyroTick;gyroTick=function(){const r=gt.apply(this,arguments);try{if(BX3.host&&BX3.host.isConnected&&$("boxv").classList.contains("on"))BX3.apply()}catch(e){}return r}}
addEventListener("resize",()=>{if(BX3.host&&BX3.host.isConnected)BX3.fit()});
