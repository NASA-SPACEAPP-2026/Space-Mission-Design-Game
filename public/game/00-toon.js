/* ===== TOON: look cartoon globale (ombreggiatura a fasce + sottile contorno nero) per tutte le scene 3D =====
   1) ogni MeshStandardMaterial diventa un MeshToonMaterial (stessa luce e stesse ombre morbide: la mappa d'ombra e' quella di prima, cambia solo la rampa di luce);
   2) contorno "a scafo rovesciato" con spessore costante in pixel: gli oggetti statici di una scena finiscono in UNA sola mesh di contorno (1 chiamata di disegno),
      quelli animati / istanziati hanno il loro scafo. Il contorno non proietta ombre e non riceve ombre. TOON.setOutline(false) lo spegne. */
(function(){ const T=window.THREE; if(!T||T.__toon) return; T.__toon=1;
  const Std=T.MeshStandardMaterial; let RAMP=null; const ramp=()=>RAMP||(RAMP=(()=>{ const t=new T.DataTexture(new Uint8Array([105,172,236]),3,1,T.LuminanceFormat); t.minFilter=t.magFilter=T.NearestFilter; t.needsUpdate=true; return t; })());
  const DROP=['roughness','metalness','envMap','envMapIntensity','roughnessMap','metalnessMap','flatShading','normalScale'];
  function ToonStd(p){ p=Object.assign({},p||{}); DROP.forEach(k=>delete p[k]); p.gradientMap=ramp(); const m=new T.MeshToonMaterial(p); m.userData.toon=1; return m; }
  ToonStd.prototype=Std.prototype; T.MeshStandardMaterial=ToonStd;
  /* ---- contorno ---- */
  const U={uRes:{value:new T.Vector2(1280,800)},uW:{value:1.4},uRef:{value:40}}; let ON=true, WIDTH=0.88;
  const fogU=Object.assign(T.UniformsUtils.clone(T.UniformsLib.fog),U);
  const OUTM=new T.ShaderMaterial({uniforms:fogU,side:T.BackSide,fog:true,toneMapped:false,
    vertexShader:'attribute vec3 onrm; uniform vec2 uRes; uniform float uW; uniform float uRef;\n#include <fog_pars_vertex>\nvoid main(){ vec3 n=onrm; vec4 p=vec4(position,1.0);\n#ifdef USE_INSTANCING\n n=mat3(instanceMatrix)*n; p=instanceMatrix*p;\n#endif\n vec4 mvPosition=modelViewMatrix*p; vec4 cp=projectionMatrix*mvPosition; vec3 vn=normalize(normalMatrix*n); vec2 d=(projectionMatrix*vec4(vn,0.0)).xy; float l=length(d); d=l>1e-5?d/l:vec2(0.0); float k=clamp(uRef/max(cp.w,0.001),0.3,1.0); cp.xy+=d*uW*k*2.0/uRes*cp.w; gl_Position=cp;\n#include <fog_vertex>\n}',
    fragmentShader:'#include <fog_pars_fragment>\nvoid main(){ gl_FragColor=vec4(0.012,0.016,0.026,1.0);\n#include <fog_fragment>\n}'});
  /* normali "morbide" per il contorno: media delle normali nei vertici coincidenti, cosi' gli spigoli vivi dei cubi non si aprono */
  function onrm(geo){ let a=geo.attributes.onrm; if(a) return a; if(!geo.attributes.normal) geo.computeVertexNormals(); const P=geo.attributes.position, N=geo.attributes.normal, n=P.count, mp=new Map(), key=new Array(n);
    for(let i=0;i<n;i++){ const k=Math.round(P.getX(i)*1000)+','+Math.round(P.getY(i)*1000)+','+Math.round(P.getZ(i)*1000); key[i]=k; let s=mp.get(k); if(!s){ s=[0,0,0]; mp.set(k,s); } s[0]+=N.getX(i); s[1]+=N.getY(i); s[2]+=N.getZ(i); }
    const out=new Float32Array(n*3); for(let i=0;i<n;i++){ const s=mp.get(key[i]), l=Math.hypot(s[0],s[1],s[2])||1; out[i*3]=s[0]/l; out[i*3+1]=s[1]/l; out[i*3+2]=s[2]/l; }
    a=new T.BufferAttribute(out,3); geo.setAttribute('onrm',a); return a; }
  const FLAT={PlaneGeometry:1,CircleGeometry:1,RingGeometry:1,ShapeGeometry:1};
  const V3=new T.Vector3(), Q=new T.Quaternion(), S3=new T.Vector3(), P3=new T.Vector3();
  function eligible(o,minDim){ if(!o.isMesh||o.userData.ol||o.userData.noOL||o.visible===false) return false; const m=o.material; if(!m||Array.isArray(m)||m.transparent||m.side===T.BackSide||(m.side===T.DoubleSide&&o.geometry&&o.geometry.type==='LatheGeometry')||m.isMeshBasicMaterial||m.isShaderMaterial||m.isPointsMaterial) return false;
    const g=o.geometry; if(!g||FLAT[g.type]||!g.attributes.position) return false; if(!g.boundingBox) g.computeBoundingBox(); o.matrixWorld.decompose(P3,Q,S3); if(g.type==='SphereGeometry'&&P3.y<.02) return false; /* colline interrate: il corpo non si vede, il contorno si */ const sz=g.boundingBox.getSize(V3), d=[sz.x*Math.abs(S3.x),sz.y*Math.abs(S3.y),sz.z*Math.abs(S3.z)].sort((a,b)=>a-b); return d[0]>=minDim&&d[2]>d[0]*0.0; }
  function walk(root,fn,skipDyn){ (function rec(o){ if(o.userData&&o.userData.noOL) return; if(skipDyn&&o.userData&&o.userData.dyn) return; fn(o); for(let i=0;i<o.children.length;i++) rec(o.children[i]); })(root); }
  const SZ=new T.Vector2(); const onBefore=function(r,sc,cm){ if(!r||!r.getDrawingBufferSize) return; U.uRef.value=(cm&&cm.userData&&cm.userData.olRef)||40; r.getDrawingBufferSize(SZ); U.uRes.value.copy(SZ); U.uW.value=WIDTH*r.getPixelRatio(); OUTM.uniformsNeedUpdate=true; };
  const mk=(geo,inst)=>{ const m=inst?new T.InstancedMesh(geo,OUTM,inst.count):new T.Mesh(geo,OUTM); if(inst){ m.instanceMatrix=inst.instanceMatrix; m.frustumCulled=false; } m.userData.ol=1; m.userData.keep=true; m.userData.dyn=true; m.castShadow=false; m.receiveShadow=false; m.raycast=()=>{}; m.onBeforeRender=onBefore; return m; };
  /* contorno unico per tutto cio' che e' fermo dentro root (da chiamare PRIMA dell'unione per materiale) */
  function outlineStatic(root,opt){ if(!ON) return null; opt=opt||{}; const minDim=opt.minDim==null?.05:opt.minDim; root.updateMatrixWorld(true); const inv=new T.Matrix4().copy(root.matrixWorld).invert(), L=[]; let nV=0;
    walk(root,o=>{ if(o.isInstancedMesh||!eligible(o,minDim)) return; let p=o.parent, dyn=false; while(p&&p!==root){ if(p.userData.dyn){ dyn=true; break; } p=p.parent; } if(dyn||o.userData.dyn||o.userData.ols) return; L.push(o); nV+=o.geometry.attributes.position.count; },true);
    if(!L.length) return null; const pos=new Float32Array(nV*3), nor=new Float32Array(nV*3), idx=[]; let v=0; const M4=new T.Matrix4(), NM=new T.Matrix3();
    L.forEach(o=>{ const g=o.geometry, P=g.attributes.position, N=onrm(g).array; M4.multiplyMatrices(inv,o.matrixWorld); NM.getNormalMatrix(M4); const e=NM.elements, m=M4.elements, n=P.count;
      for(let i=0;i<n;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i); pos[(v+i)*3]=m[0]*x+m[4]*y+m[8]*z+m[12]; pos[(v+i)*3+1]=m[1]*x+m[5]*y+m[9]*z+m[13]; pos[(v+i)*3+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
        const a=N[i*3], b=N[i*3+1], c=N[i*3+2]; let X=e[0]*a+e[3]*b+e[6]*c, Y=e[1]*a+e[4]*b+e[7]*c, Z=e[2]*a+e[5]*b+e[8]*c; const l=Math.hypot(X,Y,Z)||1; nor[(v+i)*3]=X/l; nor[(v+i)*3+1]=Y/l; nor[(v+i)*3+2]=Z/l; }
      if(g.index){ const I=g.index.array; for(let i=0;i<I.length;i++) idx.push(I[i]+v); } else for(let i=0;i<n;i++) idx.push(v+i);
      o.userData.ols=1;  v+=n; });
    const G=new T.BufferGeometry(); G.setAttribute('position',new T.BufferAttribute(pos,3)); G.setAttribute('normal',new T.BufferAttribute(nor,3)); G.setAttribute('onrm',new T.BufferAttribute(nor,3)); G.setIndex(new T.BufferAttribute(nV>65000?new Uint32Array(idx):new Uint16Array(idx),1));
    const m=mk(G); root.add(m); return m; }
  /* contorno individuale per animati e istanziati (da chiamare DOPO l'unione) */
  function outlineEach(root,opt){ if(!ON) return; opt=opt||{}; const minDim=opt.minDim==null?.05:opt.minDim; root.updateMatrixWorld(true); const todo=[];
    walk(root,o=>{ if(!o.isMesh||o.userData.ols||o.userData.noOL||o.userData.ol||o.userData.skipOL) return; if(o.isInstancedMesh){ const m=o.material; if(m&&!Array.isArray(m)&&!m.transparent&&!m.isMeshBasicMaterial&&!m.isShaderMaterial&&o.geometry.attributes.position&&!FLAT[o.geometry.type]){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); todo.push(o); } return; } if(eligible(o,minDim)) todo.push(o); });
    todo.forEach(o=>{ onrm(o.geometry); const m=mk(o.geometry,o.isInstancedMesh?o:null); o.add(m); o.userData.ols=1; }); }
  window.TOON={ramp,outlineStatic,outlineEach,mat:OUTM,onrm,setOutline:v=>{ ON=!!v; },get on(){ return ON; },setWidth:w=>{ WIDTH=w; } };
})();
