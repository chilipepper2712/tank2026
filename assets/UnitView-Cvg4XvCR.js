const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./browserAll-BU68seF-.js","./CanvasPool-D8bT_nmR.js","./getPo2TextureFromSource-C6vjFcVT.js","./canvasUtils-uetfUNPf.js","./webworkerAll-DYwYyMX0.js","./Filter-BdrWbwGk.js"])))=>i.map(i=>d[i]);
import{E as et,V as Te,O as Se,h as pt,v as It,D as yt,L as Vt,F as bt,T as Lt,d as rt,M as we,w as Pt,N as Ot,f as ke,u as ve,Q as Gt,W as _e,H as Ce,e as _t,c as Me,C as lt,z as Kt}from"./CanvasPool-D8bT_nmR.js";import{c as Ne}from"./canvasUtils-uetfUNPf.js";import{a as zt,F as Tt,c as st,t as Xt,d as Ut,G as K}from"./Graphics-nYKiPWkb.js";import{B as Ae,G as He}from"./BatchableSprite-Bi_K_O5q.js";import{g as Ie}from"./getPo2TextureFromSource-C6vjFcVT.js";import{s as Le}from"./settings-DVM1srpd.js";const Ge="modulepreload",Be=function(i,t){return new URL(i,t).href},$t={},se=function(t,e,n){let r=Promise.resolve();if(e&&e.length>0){let h=function(c){return Promise.all(c.map(u=>Promise.resolve(u).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const a=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),l=o?.nonce||o?.getAttribute("nonce");r=h(e.map(c=>{if(c=Be(c,n),c in $t)return;$t[c]=!0;const u=c.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(n)for(let S=a.length-1;S>=0;S--){const x=a[S];if(x.href===c&&(!u||x.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${g}`))return;const p=document.createElement("link");if(p.rel=u?"stylesheet":Ge,u||(p.as="script"),p.crossOrigin="",p.href=c,l&&p.setAttribute("nonce",l),document.head.appendChild(p),u)return new Promise((S,x)=>{p.addEventListener("load",S),p.addEventListener("error",()=>x(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return r.then(a=>{for(const o of a||[])o.status==="rejected"&&s(o.reason);return t().catch(s)})},Re={extension:{type:et.Environment,name:"browser",priority:-1},test:()=>!0,load:async()=>{await se(()=>import("./browserAll-BU68seF-.js"),__vite__mapDeps([0,1,2,3,4,5]),import.meta.url)}},We={extension:{type:et.Environment,name:"webworker",priority:0},test:()=>typeof self<"u"&&self.WorkerGlobalScope!==void 0,load:async()=>{await se(()=>import("./webworkerAll-DYwYyMX0.js"),__vite__mapDeps([4,2,1,3,5]),import.meta.url)}};class Ee extends Te{constructor(t,e){const{text:n,resolution:r,style:s,anchor:a,width:o,height:l,roundPixels:h,...c}=t;super({...c}),this.batched=!0,this._resolution=null,this._autoResolution=!0,this._didTextUpdate=!0,this._styleClass=e,this.text=n??"",this.style=s,this.resolution=r??null,this.allowChildren=!1,this._anchor=new Se({_onUpdate:()=>{this.onViewUpdate()}}),a&&(this.anchor=a),this.roundPixels=h??!1,o!==void 0&&(this.width=o),l!==void 0&&(this.height=l)}get anchor(){return this._anchor}set anchor(t){typeof t=="number"?this._anchor.set(t):this._anchor.copyFrom(t)}set text(t){t=t.toString(),this._text!==t&&(this._text=t,this.onViewUpdate())}get text(){return this._text}set resolution(t){this._autoResolution=t===null,this._resolution=t,this.onViewUpdate()}get resolution(){return this._resolution}get style(){return this._style}set style(t){t||(t={}),this._style?.off("update",this.onViewUpdate,this),t instanceof this._styleClass?this._style=t:this._style=new this._styleClass(t),this._style.on("update",this.onViewUpdate,this),this.onViewUpdate()}get width(){return Math.abs(this.scale.x)*this.bounds.width}set width(t){this._setWidth(t,this.bounds.width)}get height(){return Math.abs(this.scale.y)*this.bounds.height}set height(t){this._setHeight(t,this.bounds.height)}getSize(t){return t||(t={}),t.width=Math.abs(this.scale.x)*this.bounds.width,t.height=Math.abs(this.scale.y)*this.bounds.height,t}setSize(t,e){typeof t=="object"?(e=t.height??t.width,t=t.width):e??(e=t),t!==void 0&&this._setWidth(t,this.bounds.width),e!==void 0&&this._setHeight(e,this.bounds.height)}containsPoint(t){const e=this.bounds.width,n=this.bounds.height,r=-e*this.anchor.x;let s=0;return t.x>=r&&t.x<=r+e&&(s=-n*this.anchor.y,t.y>=s&&t.y<=s+n)}onViewUpdate(){this.didViewUpdate||(this._didTextUpdate=!0),super.onViewUpdate()}destroy(t=!1){this._style?.off("update",this.onViewUpdate,this),super.destroy(t),this.owner=null,this._bounds=null,this._anchor=null,(typeof t=="boolean"?t:t?.style)&&this._style.destroy(t),this._style=null,this._text=null}get styleKey(){return`${this._text}:${this._style.styleKey}:${this._resolution}`}}function Pe(i,t){let e=i[0]??{};return(typeof e=="string"||i[1])&&(pt(It,`use new ${t}({ text: "hi!", style }) instead`),e={text:e,style:i[1]}),e}let nt=null,j=null;function ze(i,t){nt||(nt=yt.get().createCanvas(256,128),j=nt.getContext("2d",{willReadFrequently:!0}),j.globalCompositeOperation="copy",j.globalAlpha=1),(nt.width<i||nt.height<t)&&(nt.width=Vt(i),nt.height=Vt(t))}function Yt(i,t,e){for(let n=0,r=4*e*t;n<t;++n,r+=4)if(i[r+3]!==0)return!1;return!0}function qt(i,t,e,n,r){const s=4*t;for(let a=n,o=n*s+4*e;a<=r;++a,o+=s)if(i[o+3]!==0)return!1;return!0}function De(...i){let t=i[0];t.canvas||(t={canvas:i[0],resolution:i[1]});const{canvas:e}=t,n=Math.min(t.resolution??1,1),r=t.width??e.width,s=t.height??e.height;let a=t.output;if(ze(r,s),!j)throw new TypeError("Failed to get canvas 2D context");j.drawImage(e,0,0,r,s,0,0,r*n,s*n);const l=j.getImageData(0,0,r,s).data;let h=0,c=0,u=r-1,g=s-1;for(;c<s&&Yt(l,r,c);)++c;if(c===s)return bt.EMPTY;for(;Yt(l,r,g);)--g;for(;qt(l,r,h,c,g);)++h;for(;qt(l,r,u,c,g);)--u;return++u,++g,j.globalCompositeOperation="source-over",j.strokeRect(h,c,u-h,g-c),j.globalCompositeOperation="copy",a??(a=new bt),a.set(h/n,c/n,(u-h)/n,(g-c)/n),a}class Fe{constructor(t=0,e=0,n=!1){this.first=null,this.items=Object.create(null),this.last=null,this.max=t,this.resetTtl=n,this.size=0,this.ttl=e}clear(){return this.first=null,this.items=Object.create(null),this.last=null,this.size=0,this}delete(t){if(this.has(t)){const e=this.items[t];delete this.items[t],this.size--,e.prev!==null&&(e.prev.next=e.next),e.next!==null&&(e.next.prev=e.prev),this.first===e&&(this.first=e.next),this.last===e&&(this.last=e.prev)}return this}entries(t=this.keys()){const e=new Array(t.length);for(let n=0;n<t.length;n++){const r=t[n];e[n]=[r,this.get(r)]}return e}evict(t=!1){if(t||this.size>0){const e=this.first;delete this.items[e.key],--this.size===0?(this.first=null,this.last=null):(this.first=e.next,this.first.prev=null)}return this}expiresAt(t){let e;return this.has(t)&&(e=this.items[t].expiry),e}get(t){const e=this.items[t];if(e!==void 0){if(this.ttl>0&&e.expiry<=Date.now()){this.delete(t);return}return this.moveToEnd(e),e.value}}has(t){return t in this.items}moveToEnd(t){this.last!==t&&(t.prev!==null&&(t.prev.next=t.next),t.next!==null&&(t.next.prev=t.prev),this.first===t&&(this.first=t.next),t.prev=this.last,t.next=null,this.last!==null&&(this.last.next=t),this.last=t,this.first===null&&(this.first=t))}keys(){const t=new Array(this.size);let e=this.first,n=0;for(;e!==null;)t[n++]=e.key,e=e.next;return t}setWithEvicted(t,e,n=this.resetTtl){let r=null;if(this.has(t))this.set(t,e,!0,n);else{this.max>0&&this.size===this.max&&(r={...this.first},this.evict(!0));let s=this.items[t]={expiry:this.ttl>0?Date.now()+this.ttl:this.ttl,key:t,prev:this.last,next:null,value:e};++this.size===1?this.first=s:this.last.next=s,this.last=s}return r}set(t,e,n=!1,r=this.resetTtl){let s=this.items[t];return n||s!==void 0?(s.value=e,n===!1&&r&&(s.expiry=this.ttl>0?Date.now()+this.ttl:this.ttl),this.moveToEnd(s)):(this.max>0&&this.size===this.max&&this.evict(!0),s=this.items[t]={expiry:this.ttl>0?Date.now()+this.ttl:this.ttl,key:t,prev:this.last,next:null,value:e},++this.size===1?this.first=s:this.last.next=s,this.last=s),this}values(t=this.keys()){const e=new Array(t.length);for(let n=0;n<t.length;n++)e[n]=this.get(t[n]);return e}}function Ve(i=1e3,t=0,e=!1){if(isNaN(i)||i<0)throw new TypeError("Invalid max value");if(isNaN(t)||t<0)throw new TypeError("Invalid ttl value");if(typeof e!="boolean")throw new TypeError("Invalid resetTtl value");return new Fe(i,t,e)}function oe(i){return!!i.tagStyles&&Object.keys(i.tagStyles).length>0}function ae(i){return i.includes("<")}function Oe(i,t){return i.clone().assign(t)}function Ke(i,t){const e=[],n=t.tagStyles;if(!oe(t)||!ae(i))return e.push({text:i,style:t}),e;const r=[t],s=[];let a="",o=0;for(;o<i.length;){const l=i[o];if(l==="<"){const h=i.indexOf(">",o);if(h===-1){a+=l,o++;continue}const c=i.indexOf("<",o+1);if(c!==-1&&c<h){a+=l,o++;continue}const u=i.slice(o+1,h);if(u.startsWith("/")){const g=u.slice(1).trim();if(s.length>0&&s[s.length-1]===g){a.length>0&&(e.push({text:a,style:r[r.length-1]}),a=""),r.pop(),s.pop(),o=h+1;continue}else{a+=i.slice(o,h+1),o=h+1;continue}}else{const g=u.trim();if(n[g]){a.length>0&&(e.push({text:a,style:r[r.length-1]}),a="");const p=r[r.length-1],S=Oe(p,n[g]);r.push(S),s.push(g),o=h+1;continue}else{a+=i.slice(o,h+1),o=h+1;continue}}}else a+=l,o++}return a.length>0&&e.push({text:a,style:r[r.length-1]}),e}const Xe=[10,13],Ue=new Set(Xe),$e=[9,32,8192,8193,8194,8195,8196,8197,8198,8200,8201,8202,8287,12288],Ye=new Set($e),qe=[9,32];new Set(qe);const je=[45,8208,8211,8212,173],Ze=new Set(je),Qe=/(\r\n|\r|\n)/,Je=/(?:\r\n|\r|\n)/;function St(i){return typeof i!="string"?!1:Ue.has(i.charCodeAt(0))}function $(i,t){return typeof i!="string"?!1:Ye.has(i.charCodeAt(0))}function tn(i){return typeof i!="string"?!1:Ze.has(i.charCodeAt(0))}function he(i){return i==="normal"||i==="pre-line"}function le(i){return i==="normal"}function q(i){if(typeof i!="string")return"";let t=i.length-1;for(;t>=0&&$(i[t]);)t--;return t<i.length-1?i.slice(0,t+1):i}function ce(i){const t=[],e=[];if(typeof i!="string")return t;for(let n=0;n<i.length;n++){const r=i[n],s=i[n+1];if($(r)||St(r)){e.length>0&&(t.push(e.join("")),e.length=0),r==="\r"&&s===`
`?(t.push(`\r
`),n++):t.push(r);continue}e.push(r),tn(r)&&s&&!$(s)&&!St(s)&&(t.push(e.join("")),e.length=0)}return e.length>0&&t.push(e.join("")),t}function ue(i,t,e,n){const r=e(i),s=[];for(let a=0;a<r.length;a++){let o=r[a],l=o,h=1;for(;r[a+h];){const c=r[a+h];if(!n(l,c,i,a,t))o+=c,l=c,h++;else break}a+=h-1,s.push(o)}return s}const en=/\r\n|\r|\n/g;function nn(i,t,e,n,r,s,a,o,l){const h=Ke(i,t);if(le(t.whiteSpace))for(let E=0;E<h.length;E++){const B=h[E];h[E]={text:B.text.replace(en," "),style:B.style}}const u=[];let g=[];for(const E of h){const B=E.text.split(Qe);for(let k=0;k<B.length;k++){const C=B[k];C===`\r
`||C==="\r"||C===`
`?(u.push(g),g=[]):C.length>0&&g.push({text:C,style:E.style})}}(g.length>0||u.length===0)&&u.push(g);const p=e?rn(u,t,n,s,o,l):u,S=[],x=[],y=[],m=[],M=[];let N=0;const w=t._fontString,f=a(w);f.fontSize===0&&(f.fontSize=t.fontSize,f.ascent=t.fontSize);let I="",L=!!t.dropShadow,_=t._stroke?.width||0;for(const E of p){let B=0,k=f.ascent,C=f.descent,v="";for(const R of E){const P=R.style._fontString,X=a(P);P!==I&&(n.font=P,I=P);const z=r(R.text,R.style.letterSpacing,n);B+=z,k=Math.max(k,X.ascent),C=Math.max(C,X.descent),v+=R.text;const V=R.style._stroke?.width||0;V>_&&(_=V),!L&&R.style.dropShadow&&(L=!0)}E.length===0&&(k=f.ascent,C=f.descent),S.push(B),x.push(k),y.push(C),M.push(v);const b=t.lineHeight||k+C;m.push(b+t.leading),N=Math.max(N,B)}const H=_,D=N+H+(t.dropShadow?t.dropShadow.distance:0);let A=0;for(let E=0;E<m.length;E++)A+=m[E];A=Math.max(A,m[0]+H);const F=A+(t.dropShadow?t.dropShadow.distance:0),W=t.lineHeight||f.fontSize;return{width:D,height:F,lines:M,lineWidths:S,lineHeight:W+t.leading,maxLineWidth:N,fontProperties:f,runsByLine:p,lineAscents:x,lineDescents:y,lineHeights:m,hasDropShadow:L}}function rn(i,t,e,n,r,s){const{letterSpacing:a,whiteSpace:o,wordWrapWidth:l,breakWords:h}=t,c=he(o),u=l+a,g={};let p="";const S=(y,m)=>{const M=`${y}|${m.styleKey}`;let N=g[M];if(N===void 0){const w=m._fontString;w!==p&&(e.font=w,p=w),N=n(y,m.letterSpacing,e)+m.letterSpacing,g[M]=N}return N},x=[];for(const y of i){const m=sn(y),M=x.length,N=A=>{let F=0,W=A;do{const{token:E,style:B}=m[W];F+=S(E,B),W++}while(W<m.length&&m[W].continuesFromPrevious);return F},w=A=>{const F=[];let W=A;do F.push({token:m[W].token,style:m[W].style}),W++;while(W<m.length&&m[W].continuesFromPrevious);return F};let f=[],I=0,L=!c,_=null;const H=()=>{_&&_.text.length>0&&f.push(_),_=null},D=()=>{if(H(),f.length>0){const A=f[f.length-1];A.text=q(A.text),A.text.length===0&&f.pop()}x.push(f),f=[],I=0,L=!1};for(let A=0;A<m.length;A++){const{token:F,style:W,continuesFromPrevious:E}=m[A],B=S(F,W);if(c){const v=$(F),b=_?.text[_.text.length-1]??f[f.length-1]?.text.slice(-1)??"",R=b?$(b):!1;if(v&&R)continue}const k=!E,C=k?N(A):B;if(C>u&&k)if(I>0&&D(),h){const v=w(A);for(let b=0;b<v.length;b++){const R=v[b].token,P=v[b].style,X=ue(R,h,s,r);for(const z of X){const V=S(z,P);V+I>u&&D(),!_||_.style!==P?(H(),_={text:z,style:P}):_.text+=z,I+=V}}A+=v.length-1}else{const v=w(A);H(),x.push(v.map(b=>({text:b.token,style:b.style}))),L=!1,A+=v.length-1}else if(C+I>u&&k){if($(F)){L=!1;continue}D(),_={text:F,style:W},I=B}else if(E&&!h)!_||_.style!==W?(H(),_={text:F,style:W}):_.text+=F,I+=B;else{const v=$(F);if(I===0&&v&&!L)continue;!_||_.style!==W?(H(),_={text:F,style:W}):_.text+=F,I+=B}}if(H(),f.length>0){const A=f[f.length-1];A.text=q(A.text),A.text.length===0&&f.pop()}(f.length>0||x.length===M)&&x.push(f)}return x}function sn(i){const t=[];let e=!1;for(const n of i){const r=ce(n.text);let s=!0;for(const a of r){const o=$(a)||St(a),l=s&&e&&!o;t.push({token:a,style:n.style,continuesFromPrevious:l}),e=!o,s=!1}}return t}const on={willReadFrequently:!0};function jt(i,t,e,n,r){let s=e[i];return typeof s!="number"&&(s=r(i,t,n)+t,e[i]=s),s}function an(i,t,e,n,r,s,a){const o=e.getContext("2d",on);o.font=t._fontString;let l=0,h="";const c=[],u=Object.create(null),{letterSpacing:g,whiteSpace:p}=t,S=he(p),x=le(p);let y=!S;const m=t.wordWrapWidth+g,M=ce(i);for(let w=0;w<M.length;w++){let f=M[w];if(St(f)){if(!x){c.push(q(h)),y=!S,h="",l=0;continue}f=" "}if(S){const L=$(f),_=$(h[h.length-1]);if(L&&_)continue}const I=jt(f,g,u,o,n);if(I>m)if(h!==""&&(c.push(q(h)),h="",l=0),r(f,t.breakWords)){const L=ue(f,t.breakWords,a,s);for(const _ of L){const H=jt(_,g,u,o,n);H+l>m&&(c.push(q(h)),y=!1,h="",l=0),h+=_,l+=H}}else h.length>0&&(c.push(q(h)),h="",l=0),c.push(q(f)),y=!1,h="",l=0;else I+l>m&&(y=!1,c.push(q(h)),h="",l=0),(h.length>0||!$(f)||y)&&(h+=f,l+=I)}const N=q(h);return N.length>0&&c.push(N),c.join(`
`)}const Zt={willReadFrequently:!0},Z=class T{static get experimentalLetterSpacingSupported(){let t=T._experimentalLetterSpacingSupported;if(t===void 0){const e=yt.get().getCanvasRenderingContext2D().prototype;t=T._experimentalLetterSpacingSupported="letterSpacing"in e||"textLetterSpacing"in e}return t}constructor(t,e,n,r,s,a,o,l,h,c){this.text=t,this.style=e,this.width=n,this.height=r,this.lines=s,this.lineWidths=a,this.lineHeight=o,this.maxLineWidth=l,this.fontProperties=h,c&&(this.runsByLine=c.runsByLine,this.lineAscents=c.lineAscents,this.lineDescents=c.lineDescents,this.lineHeights=c.lineHeights,this.hasDropShadow=c.hasDropShadow)}static measureText(t=" ",e,n=T._canvas,r=e.wordWrap){const s=`${t}-${e.styleKey}-wordWrap-${r}`;if(T._measurementCache.has(s))return T._measurementCache.get(s);if(oe(e)&&ae(t)){const w=nn(t,e,r,T._context,T._measureText,T._measureTextAdvance,T.measureFont,T.canBreakChars,T.wordWrapSplit),f=new T(t,e,w.width,w.height,w.lines,w.lineWidths,w.lineHeight,w.maxLineWidth,w.fontProperties,{runsByLine:w.runsByLine,lineAscents:w.lineAscents,lineDescents:w.lineDescents,lineHeights:w.lineHeights,hasDropShadow:w.hasDropShadow});return T._measurementCache.set(s,f),f}const o=e._fontString,l=T.measureFont(o);l.fontSize===0&&(l.fontSize=e.fontSize,l.ascent=e.fontSize,l.descent=0);const h=T._context;h.font=o;const u=(r?T._wordWrap(t,e,n):t).split(Je),g=new Array(u.length);let p=0;for(let w=0;w<u.length;w++){const f=T._measureText(u[w],e.letterSpacing,h);g[w]=f,p=Math.max(p,f)}const S=e._stroke?.width??0,x=e.lineHeight||l.fontSize,y=T._adjustWidthForStyle(p,e),m=Math.max(x,l.fontSize+S)+(u.length-1)*(x+e.leading),M=T._adjustHeightForStyle(m,e),N=new T(t,e,y,M,u,g,x+e.leading,p,l);return T._measurementCache.set(s,N),N}static _adjustWidthForStyle(t,e){const n=e._stroke?.width||0;let r=t+n;return e.dropShadow&&(r+=e.dropShadow.distance),r}static _adjustHeightForStyle(t,e){let n=t;return e.dropShadow&&(n+=e.dropShadow.distance),n}static _measureText(t,e,n){const{metricWidth:r,metrics:s,letterSpacingVal:a}=T._measureTextCore(t,e,n),o=-(s.actualBoundingBoxLeft??0);let h=(s.actualBoundingBoxRight??0)-o;return s.width>0&&(h+=a),Math.max(r,h)}static _measureTextAdvance(t,e,n){return T._measureTextCore(t,e,n).metricWidth}static _measureTextCore(t,e,n){let r=!1;T.experimentalLetterSpacingSupported&&(T.experimentalLetterSpacing?(n.letterSpacing=`${e}px`,n.textLetterSpacing=`${e}px`,r=!0):(n.letterSpacing="0px",n.textLetterSpacing="0px"));const s=n.measureText(t);let a=s.width,o=0;return a>0&&(r?o=-e:o=(T.graphemeSegmenter(t).length-1)*e,a+=o),{metricWidth:a,metrics:s,letterSpacingVal:o}}static _wordWrap(t,e,n=T._canvas){return an(t,e,n,T._measureTextAdvance,T.canBreakWords,T.canBreakChars,T.wordWrapSplit)}static isBreakingSpace(t,e){return $(t)}static canBreakWords(t,e){return e}static canBreakChars(t,e,n,r,s){return!0}static wordWrapSplit(t){return T.graphemeSegmenter(t)}static measureFont(t){if(T._fonts[t])return T._fonts[t];const e=T._context;e.font=t;const n=e.measureText(T.METRICS_STRING+T.BASELINE_SYMBOL),r=n.actualBoundingBoxAscent??0,s=n.actualBoundingBoxDescent??0,a={ascent:r,descent:s,fontSize:r+s};return T._fonts[t]=a,a}static clearMetrics(t=""){t?delete T._fonts[t]:T._fonts={}}static get _canvas(){if(!T.__canvas){let t;try{const e=new OffscreenCanvas(0,0);if(e.getContext("2d",Zt)?.measureText)return T.__canvas=e,e;t=yt.get().createCanvas()}catch{t=yt.get().createCanvas()}t.width=t.height=10,T.__canvas=t}return T.__canvas}static get _context(){return T.__context||(T.__context=T._canvas.getContext("2d",Zt)),T.__context}};Z.METRICS_STRING="|ÉqÅ";Z.BASELINE_SYMBOL="M";Z.BASELINE_MULTIPLIER=1.4;Z.HEIGHT_MULTIPLIER=2;Z.graphemeSegmenter=(()=>{if(typeof Intl?.Segmenter=="function"){const i=new Intl.Segmenter;return t=>{const e=i.segment(t),n=[];let r=0;for(const s of e)n[r++]=s.segment;return n}}return i=>[...i]})();Z.experimentalLetterSpacing=!1;Z._fonts={};Z._measurementCache=Ve(1e3);let J=Z;const hn=["serif","sans-serif","monospace","cursive","fantasy","system-ui"];function Bt(i){const t=typeof i.fontSize=="number"?`${i.fontSize}px`:i.fontSize;let e=i.fontFamily;Array.isArray(i.fontFamily)||(e=i.fontFamily.split(","));for(let n=e.length-1;n>=0;n--){let r=e[n].trim();!/([\"\'])[^\'\"]+\1/.test(r)&&!hn.includes(r)&&(r=`"${r}"`),e[n]=r}return`${i.fontStyle} ${i.fontVariant} ${i.fontWeight} ${t} ${e.join(",")}`}const Qt=1e5;function mt(i,t,e,n=0,r=0,s=0){if(i.texture===Lt.WHITE&&!i.fill)return rt.shared.setValue(i.color).setAlpha(i.alpha??1).toHexa();if(i.fill){if(i.fill instanceof zt){const a=i.fill,o=t.createPattern(a.texture.source.resource,"repeat");return Ne.applyPatternTransform(o,a.transform,!1),o}else if(i.fill instanceof Tt){const a=i.fill,o=a.type==="linear",l=a.textureSpace==="local";let h=1,c=1;l&&e&&(h=e.width+n,c=e.height+n);let u,g=!1;if(o){const{start:p,end:S}=a;u=t.createLinearGradient(p.x*h+r,p.y*c+s,S.x*h+r,S.y*c+s),g=Math.abs(S.x-p.x)<Math.abs((S.y-p.y)*.1)}else{const{center:p,innerRadius:S,outerCenter:x,outerRadius:y}=a;u=t.createRadialGradient(p.x*h+r,p.y*c+s,S*h,x.x*h+r,x.y*c+s,y*h)}if(g&&l&&e){const p=e.lineHeight/c;for(let S=0;S<e.lines.length;S++){const x=(S*e.lineHeight+n/2)/c;a.colorStops.forEach(y=>{let m=x+y.offset*p;m=Math.max(0,Math.min(1,m)),u.addColorStop(Math.floor(m*Qt)/Qt,rt.shared.setValue(y.color).toHex())})}}else a.colorStops.forEach(p=>{u.addColorStop(p.offset,rt.shared.setValue(p.color).toHex())});return u}}else{const a=t.createPattern(i.texture.source.resource,"repeat"),o=i.matrix.copyTo(we.shared);return o.scale(i.texture.source.pixelWidth,i.texture.source.pixelHeight),a.setTransform(o),a}return Pt("FillStyle not recognised",i),"red"}const Jt=new bt;function ot(i){let t=0;for(let e=0;e<i.length;e++)i.charCodeAt(e)===32&&t++;return t}class ln{getCanvasAndContext(t){const{text:e,style:n,resolution:r=1}=t,s=n._getFinalPadding(),a=J.measureText(e||" ",n),o=Math.ceil(Math.ceil(Math.max(1,a.width)+s*2)*r),l=Math.ceil(Math.ceil(Math.max(1,a.height)+s*2)*r),h=Ot.getOptimalCanvasAndContext(o,l);this._renderTextToCanvas(n,s,r,h,a);const c=n.trim?De({canvas:h.canvas,width:o,height:l,resolution:1,output:Jt}):Jt.set(0,0,o,l);return{canvasAndContext:h,frame:c}}returnCanvasAndContext(t){Ot.returnCanvasAndContext(t)}_renderTextToCanvas(t,e,n,r,s){if(s.runsByLine&&s.runsByLine.length>0){this._renderTaggedTextToCanvas(s,t,e,n,r);return}const{canvas:a,context:o}=r,l=Bt(t),h=s.lines,c=s.lineHeight,u=s.lineWidths,g=s.maxLineWidth,p=s.fontProperties,S=a.height;if(o.resetTransform(),o.scale(n,n),o.textBaseline=t.textBaseline,t._stroke?.width){const f=t._stroke;o.lineWidth=f.width,o.miterLimit=f.miterLimit,o.lineJoin=f.join,o.lineCap=f.cap}o.font=l;let x,y;const m=t.dropShadow?2:1,N=(t._stroke?.width??0)/2;let w=(c-p.fontSize)/2;c-p.fontSize<0&&(w=0);for(let f=0;f<m;++f){const I=t.dropShadow&&f===0,L=I?Math.ceil(Math.max(1,S)+e*2):0,_=L*n;if(I)this._setupDropShadow(o,t,n,_);else{const H=t._gradientBounds,D=t._gradientOffset;if(H){const A={width:H.width,height:H.height,lineHeight:H.height,lines:s.lines};this._setFillAndStrokeStyles(o,t,A,e,N,D?.x??0,D?.y??0)}else D?this._setFillAndStrokeStyles(o,t,s,e,N,D.x,D.y):this._setFillAndStrokeStyles(o,t,s,e,N);o.shadowColor="rgba(0,0,0,0)"}for(let H=0;H<h.length;H++){x=N,y=N+H*c+p.ascent+w,x+=this._getAlignmentOffset(u[H],g,t.align);let D=0;if(t.align==="justify"&&t.wordWrap&&H<h.length-1){const A=ot(h[H]);A>0&&(D=(g-u[H])/A)}t._stroke?.width&&this._drawLetterSpacing(h[H],t,r,x+e,y+e-L,!0,D),t._fill!==void 0&&this._drawLetterSpacing(h[H],t,r,x+e,y+e-L,!1,D)}}}_renderTaggedTextToCanvas(t,e,n,r,s){const{canvas:a,context:o}=s,{runsByLine:l,lineWidths:h,maxLineWidth:c,lineAscents:u,lineHeights:g,hasDropShadow:p}=t,S=a.height;o.resetTransform(),o.scale(r,r),o.textBaseline=e.textBaseline;const x=p?2:1;let y=e._stroke?.width??0;for(const N of l)for(const w of N){const f=w.style._stroke?.width??0;f>y&&(y=f)}const m=y/2,M=[];for(let N=0;N<l.length;N++){const w=l[N],f=[];for(const I of w){const L=Bt(I.style);o.font=L,f.push({width:J._measureText(I.text,I.style.letterSpacing,o),font:L})}M.push(f)}for(let N=0;N<x;++N){const w=p&&N===0,f=w?Math.ceil(Math.max(1,S)+n*2):0,I=f*r;w||(o.shadowColor="rgba(0,0,0,0)");let L=m;for(let _=0;_<l.length;_++){const H=l[_],D=h[_],A=u[_],F=g[_],W=M[_];let E=m;E+=this._getAlignmentOffset(D,c,e.align);let B=0;if(e.align==="justify"&&e.wordWrap&&_<l.length-1){let v=0;for(const b of H)v+=ot(b.text);v>0&&(B=(c-D)/v)}const k=L+A;let C=E+n;for(let v=0;v<H.length;v++){const b=H[v],{width:R,font:P}=W[v];if(o.font=P,o.textBaseline=b.style.textBaseline,b.style._stroke?.width){const z=b.style._stroke;if(o.lineWidth=z.width,o.miterLimit=z.miterLimit,o.lineJoin=z.join,o.lineCap=z.cap,w)if(b.style.dropShadow)this._setupDropShadow(o,b.style,r,I);else{const V=ot(b.text);C+=R+V*B;continue}else{const V=J.measureFont(P),Q=b.style.lineHeight||V.fontSize,ft={width:R,height:Q,lineHeight:Q,lines:[b.text]};o.strokeStyle=mt(z,o,ft,n*2,C-n,L)}this._drawLetterSpacing(b.text,b.style,s,C,k+n-f,!0,B)}const X=ot(b.text);C+=R+X*B}C=E+n;for(let v=0;v<H.length;v++){const b=H[v],{width:R,font:P}=W[v];if(o.font=P,o.textBaseline=b.style.textBaseline,b.style._fill!==void 0){if(w)if(b.style.dropShadow)this._setupDropShadow(o,b.style,r,I);else{const z=ot(b.text);C+=R+z*B;continue}else{const z=J.measureFont(P),V=b.style.lineHeight||z.fontSize,Q={width:R,height:V,lineHeight:V,lines:[b.text]};o.fillStyle=mt(b.style._fill,o,Q,n*2,C-n,L)}this._drawLetterSpacing(b.text,b.style,s,C,k+n-f,!1,B)}const X=ot(b.text);C+=R+X*B}L+=F}}}_setFillAndStrokeStyles(t,e,n,r,s,a=0,o=0){if(t.fillStyle=e._fill?mt(e._fill,t,n,r*2,a,o):null,e._stroke?.width){const l=s+r*2;t.strokeStyle=mt(e._stroke,t,n,l,a,o)}}_setupDropShadow(t,e,n,r){t.fillStyle="black",t.strokeStyle="black";const s=e.dropShadow,a=s.color,o=s.alpha;t.shadowColor=rt.shared.setValue(a).setAlpha(o).toRgbaString();const l=s.blur*n,h=s.distance*n;t.shadowBlur=l,t.shadowOffsetX=Math.cos(s.angle)*h,t.shadowOffsetY=Math.sin(s.angle)*h+r}_getAlignmentOffset(t,e,n){return n==="right"?e-t:n==="center"?(e-t)/2:0}_drawLetterSpacing(t,e,n,r,s,a=!1,o=0){const{context:l}=n,h=e.letterSpacing;let c=!1;if(J.experimentalLetterSpacingSupported&&(J.experimentalLetterSpacing?(l.letterSpacing=`${h}px`,l.textLetterSpacing=`${h}px`,c=!0):(l.letterSpacing="0px",l.textLetterSpacing="0px")),(h===0||c)&&o===0){a?l.strokeText(t,r,s):l.fillText(t,r,s);return}if(o!==0&&(h===0||c)){const x=t.split(" ");let y=r;const m=l.measureText(" ").width;for(let M=0;M<x.length;M++)a?l.strokeText(x[M],y,s):l.fillText(x[M],y,s),y+=l.measureText(x[M]).width+m+o;return}let u=r;const g=J.graphemeSegmenter(t);let p=l.measureText(t).width,S=0;for(let x=0;x<g.length;++x){const y=g[x];a?l.strokeText(y,u,s):l.fillText(y,u,s);let m="";for(let M=x+1;M<g.length;++M)m+=g[M];S=l.measureText(m).width,u+=p-S+h,y===" "&&(u+=o),p=S}}}const ct=new ln,Dt=class it extends ke{constructor(t={}){super(),this.uid=ve("textStyle"),this._tick=0,this._cachedFontString=null,cn(t),t instanceof it&&(t=t._toObject());const r={...it.defaultTextStyle,...t};for(const s in r){const a=s;this[a]=r[s]}this._tagStyles=t.tagStyles??void 0,this.update(),this._tick=0}get align(){return this._align}set align(t){this._align!==t&&(this._align=t,this.update())}get breakWords(){return this._breakWords}set breakWords(t){this._breakWords!==t&&(this._breakWords=t,this.update())}get dropShadow(){return this._dropShadow}set dropShadow(t){this._dropShadow!==t&&(t!==null&&typeof t=="object"?this._dropShadow=this._createProxy({...it.defaultDropShadow,...t}):this._dropShadow=t?this._createProxy({...it.defaultDropShadow}):null,this.update())}get fontFamily(){return this._fontFamily}set fontFamily(t){this._fontFamily!==t&&(this._fontFamily=t,this.update())}get fontSize(){return this._fontSize}set fontSize(t){this._fontSize!==t&&(typeof t=="string"?this._fontSize=parseInt(t,10):this._fontSize=t,this.update())}get fontStyle(){return this._fontStyle}set fontStyle(t){this._fontStyle!==t&&(this._fontStyle=t.toLowerCase(),this.update())}get fontVariant(){return this._fontVariant}set fontVariant(t){this._fontVariant!==t&&(this._fontVariant=t,this.update())}get fontWeight(){return this._fontWeight}set fontWeight(t){this._fontWeight!==t&&(this._fontWeight=t,this.update())}get leading(){return this._leading}set leading(t){this._leading!==t&&(this._leading=t,this.update())}get letterSpacing(){return this._letterSpacing}set letterSpacing(t){this._letterSpacing!==t&&(this._letterSpacing=t,this.update())}get lineHeight(){return this._lineHeight}set lineHeight(t){this._lineHeight!==t&&(this._lineHeight=t,this.update())}get padding(){return this._padding}set padding(t){this._padding!==t&&(this._padding=t,this.update())}get filters(){return this._filters}set filters(t){this._filters!==t&&(this._filters=Object.freeze(t),this.update())}get trim(){return this._trim}set trim(t){this._trim!==t&&(this._trim=t,this.update())}get textBaseline(){return this._textBaseline}set textBaseline(t){this._textBaseline!==t&&(this._textBaseline=t,this.update())}get whiteSpace(){return this._whiteSpace}set whiteSpace(t){this._whiteSpace!==t&&(this._whiteSpace=t,this.update())}get wordWrap(){return this._wordWrap}set wordWrap(t){this._wordWrap!==t&&(this._wordWrap=t,this.update())}get wordWrapWidth(){return this._wordWrapWidth}set wordWrapWidth(t){this._wordWrapWidth!==t&&(this._wordWrapWidth=t,this.update())}get fill(){return this._originalFill}set fill(t){t!==this._originalFill&&(this._originalFill=t,this._isFillStyle(t)&&(this._originalFill=this._createProxy({...st.defaultFillStyle,...t},()=>{this._fill=Xt({...this._originalFill},st.defaultFillStyle)})),this._fill=Xt(t===0?"black":t,st.defaultFillStyle),this.update())}get stroke(){return this._originalStroke}set stroke(t){t!==this._originalStroke&&(this._originalStroke=t,this._isFillStyle(t)&&(this._originalStroke=this._createProxy({...st.defaultStrokeStyle,...t},()=>{this._stroke=Ut({...this._originalStroke},st.defaultStrokeStyle)})),this._stroke=Ut(t,st.defaultStrokeStyle),this.update())}get tagStyles(){return this._tagStyles}set tagStyles(t){this._tagStyles!==t&&(this._tagStyles=t??void 0,this.update())}update(){this._tick++,this._cachedFontString=null,this.emit("update",this)}reset(){const t=it.defaultTextStyle;for(const e in t)this[e]=t[e]}assign(t){for(const e in t){const n=e;this[n]=t[e]}return this}get styleKey(){return`${this.uid}-${this._tick}`}get _fontString(){return this._cachedFontString===null&&(this._cachedFontString=Bt(this)),this._cachedFontString}_toObject(){return{align:this.align,breakWords:this.breakWords,dropShadow:this._dropShadow?{...this._dropShadow}:null,fill:this._fill?{...this._fill}:void 0,fontFamily:this.fontFamily,fontSize:this.fontSize,fontStyle:this.fontStyle,fontVariant:this.fontVariant,fontWeight:this.fontWeight,leading:this.leading,letterSpacing:this.letterSpacing,lineHeight:this.lineHeight,padding:this.padding,stroke:this._stroke?{...this._stroke}:void 0,textBaseline:this.textBaseline,trim:this.trim,whiteSpace:this.whiteSpace,wordWrap:this.wordWrap,wordWrapWidth:this.wordWrapWidth,filters:this._filters?[...this._filters]:void 0,tagStyles:this._tagStyles?{...this._tagStyles}:void 0}}clone(){return new it(this._toObject())}_getFinalPadding(){let t=0;if(this._filters)for(let e=0;e<this._filters.length;e++)t+=this._filters[e].padding;return Math.max(this._padding,t)}destroy(t=!1){if(this.removeAllListeners(),typeof t=="boolean"?t:t?.texture){const n=typeof t=="boolean"?t:t?.textureSource;this._fill?.texture&&this._fill.texture.destroy(n),this._originalFill?.texture&&this._originalFill.texture.destroy(n),this._stroke?.texture&&this._stroke.texture.destroy(n),this._originalStroke?.texture&&this._originalStroke.texture.destroy(n)}this._fill=null,this._stroke=null,this.dropShadow=null,this._originalStroke=null,this._originalFill=null}_createProxy(t,e){return new Proxy(t,{set:(n,r,s)=>(n[r]===s||(n[r]=s,e?.(r,s),this.update()),!0)})}_isFillStyle(t){return(t??null)!==null&&!(rt.isColorLike(t)||t instanceof Tt||t instanceof zt)}};Dt.defaultDropShadow={alpha:1,angle:Math.PI/6,blur:0,color:"black",distance:5};Dt.defaultTextStyle={align:"left",breakWords:!1,dropShadow:null,fill:"black",fontFamily:"Arial",fontSize:26,fontStyle:"normal",fontVariant:"normal",fontWeight:"normal",leading:0,letterSpacing:0,lineHeight:0,padding:0,stroke:null,textBaseline:"alphabetic",trim:!1,whiteSpace:"pre",wordWrap:!1,wordWrapWidth:100};let wt=Dt;function cn(i){const t=i;if(typeof t.dropShadow=="boolean"&&t.dropShadow){const e=wt.defaultDropShadow;i.dropShadow={alpha:t.dropShadowAlpha??e.alpha,angle:t.dropShadowAngle??e.angle,blur:t.dropShadowBlur??e.blur,color:t.dropShadowColor??e.color,distance:t.dropShadowDistance??e.distance}}if(t.strokeThickness!==void 0){pt(It,"strokeThickness is now a part of stroke");const e=t.stroke;let n={};if(rt.isColorLike(e))n.color=e;else if(e instanceof Tt||e instanceof zt)n.fill=e;else if(Object.hasOwnProperty.call(e,"color")||Object.hasOwnProperty.call(e,"fill"))n=e;else throw new Error("Invalid stroke value.");i.stroke={...n,width:t.strokeThickness}}if(Array.isArray(t.fillGradientStops)){if(pt(It,"gradient fill is now a fill pattern: `new FillGradient(...)`"),!Array.isArray(t.fill)||t.fill.length===0)throw new Error("Invalid fill value. Expected an array of colors for gradient fill.");t.fill.length!==t.fillGradientStops.length&&Pt("The number of fill colors must match the number of fill gradient stops.");const e=new Tt({start:{x:0,y:0},end:{x:0,y:1},textureSpace:"local"}),n=t.fillGradientStops.slice(),r=t.fill.map(s=>rt.shared.setValue(s).toNumber());n.forEach((s,a)=>{e.addColorStop(s,r[a])}),i.fill={fill:e}}}let te=!1;function un(i){if(te)return;const t=new Gt({scaleMode:i.scaleMode});i._resourceId!==t._resourceId&&(te=!0,Pt("Text textureStyle: only scaleMode is applied to a text texture, the other fields are ignored"))}function gn(i,t){const{texture:e,bounds:n}=i,r=t._style._getFinalPadding();_e(n,t._anchor,e);const s=t._anchor._x*r*2,a=t._anchor._y*r*2;n.minX-=r-s,n.minY-=r-a,n.maxX-=r-s,n.maxY-=r-a}class dn extends Ae{}class ge{constructor(t){this._renderer=t,t.runners.resolutionChange.add(this),t.runners.contextChange.add(this),this._managedTexts=new He({renderer:t,type:"renderable",onUnload:this.onTextUnload.bind(this),name:"canvasText"})}resolutionChange(){for(const t in this._managedTexts.items){const e=this._managedTexts.items[t];e?._autoResolution&&e.onViewUpdate()}}contextChange(){for(const t in this._managedTexts.items)this._managedTexts.items[t]?.unload()}validateRenderable(t){const e=this._getGpuText(t),n=t.styleKey;return e.currentKey!==n?!0:t._didTextUpdate}addRenderable(t,e){const n=this._getGpuText(t);if(t._didTextUpdate||n.currentKey!==t.styleKey){const r=t._autoResolution?this._renderer.resolution:t.resolution;(n.currentKey!==t.styleKey||t._resolution!==r)&&this._updateGpuText(t),t._didTextUpdate=!1,gn(n,t)}this._renderer.renderPipes.batch.addToBatch(n,e)}updateRenderable(t){const e=this._getGpuText(t);e._batcher.updateElement(e)}_updateGpuText(t){const e=this._getGpuText(t);e.texture&&this._renderer.canvasText.decreaseReferenceCount(e.currentKey),t._resolution=t._autoResolution?this._renderer.resolution:t.resolution,e.texture=this._renderer.canvasText.getManagedTexture(t),e.currentKey=t.styleKey}_getGpuText(t){return t._gpuData[this._renderer.uid]||this.initGpuText(t)}initGpuText(t){const e=new dn;return e.currentKey="--",e.renderable=t,e.transform=t.groupTransform,e.bounds={minX:0,maxX:1,minY:0,maxY:0},e.roundPixels=this._renderer._roundPixels|t._roundPixels,t._gpuData[this._renderer.uid]=e,this._managedTexts.add(t),e}onTextUnload(t){const e=t._gpuData[this._renderer.uid];if(!e)return;const{canvasText:n}=this._renderer;n.getReferenceCount(e.currentKey)>0?n.decreaseReferenceCount(e.currentKey):e.texture&&n.returnTexture(e.texture)}destroy(){this._managedTexts.destroy(),this._renderer=null}}ge.extension={type:[et.WebGLPipes,et.WebGPUPipes,et.CanvasPipes],name:"text"};class de{constructor(t,e){this._activeTextures={},this._renderer=t,this._retainCanvasContext=e}getTexture(t,e,n,r){typeof t=="string"&&(pt("8.0.0","CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments"),t={text:t,style:n,resolution:e}),t.style instanceof wt||(t.style=new wt(t.style)),typeof t.text!="string"&&(t.text=t.text.toString());const{text:s,style:a,textureStyle:o,autoGenerateMipmaps:l}=t,h=t.resolution??this._renderer.resolution,{frame:c,canvasAndContext:u}=ct.getCanvasAndContext({text:s,style:a,resolution:h}),g=Ie(u.canvas,c.width,c.height,h,l,o?.scaleMode);if(a.trim&&(c.pad(a.padding),g.frame.copyFrom(c),g.frame.scale(1/h),g.updateUvs()),a.filters){const p=this._applyFilters(g,a.filters);return this.returnTexture(g),ct.returnCanvasAndContext(u),p}return this._renderer.texture.initSource(g._source),this._retainCanvasContext||ct.returnCanvasAndContext(u),g}returnTexture(t){const e=t.source,n=e.resource;if(this._retainCanvasContext&&n?.getContext){const r=n.getContext("2d");r&&ct.returnCanvasAndContext({canvas:n,context:r})}e.resource=null,e.uploadMethodId="unknown",e.alphaMode="no-premultiply-alpha",Ce.returnTexture(t)}renderTextToCanvas(){pt("8.10.0","CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead")}getManagedTexture(t){t._resolution=t._autoResolution?this._renderer.resolution:t.resolution;const e=t.styleKey;if(this._activeTextures[e])return this._increaseReferenceCount(e),this._activeTextures[e].texture;const n=this.getTexture({text:t.text,style:t.style,resolution:t._resolution,textureStyle:t.textureStyle,autoGenerateMipmaps:t.autoGenerateMipmaps});return this._activeTextures[e]={texture:n,usageCount:1},n}decreaseReferenceCount(t){const e=this._activeTextures[t];e&&(e.usageCount--,e.usageCount===0&&(this.returnTexture(e.texture),this._activeTextures[t]=null))}getReferenceCount(t){return this._activeTextures[t]?.usageCount??0}_increaseReferenceCount(t){this._activeTextures[t].usageCount++}_applyFilters(t,e){const n=this._renderer.renderTarget.renderTarget,r=this._renderer.filter.generateFilteredTexture({texture:t,filters:e});return this._renderer.renderTarget.bind({target:n,clear:!1}),r}destroy(){this._renderer=null;for(const t in this._activeTextures)this._activeTextures[t]&&this.returnTexture(this._activeTextures[t].texture);this._activeTextures=null}}class pe extends de{constructor(t){super(t,!0)}}pe.extension={type:[et.CanvasSystem],name:"canvasText"};class fe extends de{constructor(t){super(t,!1)}}fe.extension={type:[et.WebGLSystem,et.WebGPUSystem],name:"canvasText"};_t.add(pe);_t.add(fe);_t.add(ge);class Yn extends Ee{constructor(...t){const e=Pe(t,"Text");super(e,wt),this.renderPipeId="text",e.textureStyle&&(this.textureStyle=e.textureStyle instanceof Gt?e.textureStyle:new Gt(e.textureStyle),un(this.textureStyle)),this.autoGenerateMipmaps=e.autoGenerateMipmaps??Me.defaultOptions.autoGenerateMipmaps}updateBounds(){const t=this._bounds,e=this._anchor;let n=0,r=0;if(this._style.trim){const{frame:s,canvasAndContext:a}=ct.getCanvasAndContext({text:this.text,style:this._style,resolution:1});ct.returnCanvasAndContext(a),n=s.width,r=s.height}else{const s=J.measureText(this._text,this._style);n=s.width,r=s.height}t.minX=-e._x*n,t.maxX=t.minX+n,t.minY=-e._y*r,t.maxY=t.minY+r}}_t.add(Re,We);const pn=`# TANK 2026 · CHỮ TIẾNG VIỆT
#
# Toàn bộ chữ người chơi đọc trong game nằm ở file này.
# Mỗi dòng:  khoá = chữ
#   - Chỉ sửa phần SAU dấu "=". Không đổi khoá (phần trước dấu "=").
#   - {n}, {name}, {time}... là chỗ game tự điền số hoặc tên. Giữ nguyên, có thể dời chỗ trong câu.
#   - Mỗi chữ nằm trên đúng một dòng. Không xuống dòng giữa câu.
#   - Dòng bắt đầu bằng # là ghi chú, game bỏ qua.
# Dịch sang tiếng khác: chép file này thành en.txt (hoặc ja.txt...), dịch phần sau dấu "=".
# Mở game với ?lang=en để xem. Khoá nào thiếu trong file dịch thì game dùng tiếng Việt.


# ============================================================
# CHUNG
# ============================================================
class.tank = Xe tăng
class.apc = Xe bọc thép
common.back = Quay lại
common.again = Chơi lại
common.skipTraining = Bỏ qua huấn luyện
# đơn vị đi kèm số: "3 lần", "2 lượt", "40 m"
unit.times = {n} lần
unit.runs = {n} lượt
unit.meters = {n} m


# ============================================================
# MENU CHÍNH
# ============================================================
menu.title = TANK 2026
# ô huấn luyện ở đầu hàng chọn màn (2 chữ cái cho vừa ô)
menu.trainingChip = HL
menu.trainingChipTip = Huấn luyện tân binh
menu.locked = Chưa mở khóa
menu.building = Đang xây dựng
# dòng dưới hàng chọn màn
menu.infoTraining = {title} · {area} · khoảng 2 phút · chọn xe để bắt đầu
menu.info = Màn {n} · {title} · {area} · {task}
# thẻ chọn xe
menu.tank.role = Tuyến đầu, cân bằng
menu.apc.role = Cơ động, đánh vòng sườn, diệt drone
menu.stat.fire = Hỏa lực
menu.stat.armour = Giáp
menu.stat.speed = Cơ động
menu.permNone = Chưa có nâng cấp
menu.perm = Đã nâng cấp: {list}
# ba nút dưới thẻ xe
menu.nav = Hồ sơ người chơi
menu.navStory = Chiến dịch
menu.navUp = Cẩm nang
menu.navCareer = Hồ sơ
# hai ô hướng dẫn điều khiển
menu.hintPhone = Điện thoại
menu.hintPhoneText = Kéo góc dưới trái để lái · Chạm địch để khóa, chạm đất để nhắm · Giữ BẮN · TÊN LỬA tự tìm mục tiêu
menu.hintPc = Máy tính
menu.hintPcText = WASD lái · Chuột ngắm · Space bắn · Q tên lửa · R sửa xe · F yểm trợ · E pháo sáng
menu.unlockAll = Mở mọi màn để thử
# màn hình dọc trên điện thoại
rotate.title = Xoay ngang điện thoại
rotate.text = Game thiết kế cho màn hình ngang.


# ============================================================
# XEM LẠI NHIỆM VỤ (nút tờ giấy cạnh nút tạm dừng)
# ============================================================
mission.title = NHIỆM VỤ
mission.resume = Tiếp tục


# ============================================================
# CHỌN ĐỒNG ĐỘI (trước mỗi màn)
# ============================================================
prep.title = ĐỒNG ĐỘI
prep.sub = {cls} mang được {n} đồng đội · đã chọn {picked}/{n}. Đồng đội bị hạ là mất trong màn đó.
prep.droid = Droid sửa chữa đi kèm (từ Kit sửa chữa cấp 3), không chiếm chỗ.
prep.go = Xuất kích


# ============================================================
# BẢN TIN TRƯỚC TRẬN
# ============================================================
brief.area = Màn {n} · {area}
brief.situation = TÌNH HÌNH
brief.task = NHIỆM VỤ
brief.lose = THUA KHI
brief.note = LƯU Ý
brief.weather = THỜI TIẾT
brief.go = VÀO TRẬN
# truyện trước nhiệm vụ: các khung hiện lần lượt trước phần lệnh
brief.storyNext = TIẾP
brief.storySkip = Bỏ qua
brief.storyStep = {k}/{of}


# ============================================================
# THỜI TIẾT (mỗi lần vào màn rút thăm; bản tin báo trước, chỉ ở màn có thể mưa)
# ============================================================
weather.clear.brief = Trời quang.
weather.rain.brief = Mưa, trời tối hơn, thỉnh thoảng có sấm chớp.


# ============================================================
# TRONG TRẬN: NÚT VÀ THANH TRÊN MÀN HÌNH
# ============================================================
hud.armour = Giáp
# chữ trên xe mình trong 3 giây đầu trận
hud.you = XE CỦA BẠN
hud.pause = Tạm dừng và cài đặt
hud.missile = Tên lửa chống tăng
hud.missileTip = TÊN LỬA
hud.repair = Sửa xe
hud.repairTip = SỬA XE
hud.fire = Bắn
hud.fireTip = BẮN
hud.air = Gọi yểm trợ
hud.airTip = YỂM TRỢ
hud.flare = Bắn pháo sáng
hud.flareTip = PHÁO SÁNG
# gợi ý hiện cạnh nút pháo sáng, lần đầu chơi màn đêm
hud.flareHint = Bắn pháo sáng để nhìn trong đêm.
hud.mission = Xem nhiệm vụ

# chữ nổi trên xe khi trúng đạn: mặt giáp bị trúng
hit.front = TRƯỚC
hit.side = HÔNG
hit.rear = SAU
hit.top = TỪ TRÊN
# chữ nổi trên xe
float.noKits = HẾT KIT SỬA
float.fullHp = XE CÒN NGUYÊN
float.repairCancel = HỦY SỬA
float.repaired = +{n}% GIÁP
float.missiles = +2 TÊN LỬA
float.drone = +1 DRONE TẤN CÔNG
float.kit = +1 KIT SỬA
float.noTarget = KHÔNG CÓ MỤC TIÊU
float.infantry = BỘ BINH!
float.mine = MÌN!
float.kamikaze = DRONE CẢM TỬ
float.noFlares = HẾT PHÁO SÁNG

# thông báo giữa màn hình (toast)
toast.upgradesFull = Đã đủ nâng cấp · +1 kit sửa
toast.upgrade = NÂNG CẤP · {name} cấp {n} (trong màn này)
toast.lostLayers = Mất {list} · xe nhẹ và nhanh trở lại
layer.plate = GIÁP PHỤ
layer.cageAT = LỒNG CHỐNG TĂNG
layer.cageUAV = LỒNG CHỐNG UAV
toast.airReady = YỂM TRỢ ĐÃ SẴN SÀNG · bấm YỂM TRỢ (phím F)
toast.airNotReady = Yểm trợ chưa sẵn sàng · {n}/{of} xe
toast.airNoTarget = Không có mục tiêu cho yểm trợ
toast.airIn = A-10 VÀO VÙNG · 2 giây
toast.lastTwo = Còn 2 địch cuối · mũi tên chỉ hướng
toast.holdStart = Bắt đầu cố thủ · địch sẽ dồn quân tới
# chuyển chặng ở màn 10 (nếu vừa có tiếp viện thì thêm dòng stageRelief phía trước)
toast.stage = CHẶNG {n}/{of} · {title}
toast.stageRelief = TIẾP VIỆN + A-10 ĐÃ TỚI
toast.stageHold = {title} {n} GIÂY
toast.relief = TIẾP VIỆN ĐÃ TỚI · A-10 VÀO VÙNG
toast.support = XE TĂNG PHE TA TIẾN VÀO HỖ TRỢ
toast.kamikazeWave = Bầy drone cảm tử đang tới
toast.wave = Địch tăng viện đang tới
toast.truckIn = Xe tiếp tế tới điểm tập kết ({n}/{of})

# chuỗi hạ liên tiếp (chữ to giữa màn hình)
streak.2 = DOUBLE-KILL
streak.5 = ÁT CHỦ BÀI
streak.10 = HUYỀN THOẠI
streak.sub = {n} MỤC TIÊU LIÊN TIẾP


# ============================================================
# TẠM DỪNG VÀ CÀI ĐẶT
# ============================================================
set.title = TẠM DỪNG
set.loadout = Nâng cấp trong trận: {list}
set.loadoutNone = Chưa có nâng cấp nào
set.zoom = Zoom
set.look = Camera đón hướng ngắm
set.offscreen = Mũi tên chỉ địch ngoài màn hình
set.hitMarks = Vệt đỏ báo hướng trúng đạn
set.ranges = Vòng tầm bắn của địch
set.pixel = Kiểu pixel (nét sắc, chạy nhẹ hơn)
set.volume = Âm lượng
set.mute = Tắt tiếng
set.voxel = Xe voxel (thử nghiệm, áp dụng khi chơi lại)
set.lighting = Ánh sáng, bóng mây (áp dụng khi chơi lại)
set.fps = Hiện FPS
set.testNew = Thêm địch mới để thử: bộ binh, drone cảm tử (áp dụng khi chơi lại)
set.ai = AI địch (thử nghiệm, áp dụng khi chơi lại)
set.aiLevel = cấp {n}
set.aiAuto = theo màn
set.touchDebug = Hiện thông tin cảm ứng (để báo lỗi điều khiển)
set.resume = Tiếp tục
set.quit = Về menu
set.reset = Mặc định


# ============================================================
# KẾT QUẢ SAU TRẬN
# ============================================================
result.won = NHIỆM VỤ HOÀN THÀNH
result.dead = XE ĐÃ BỊ PHÁ HỦY
result.failed = NHIỆM VỤ THẤT BẠI
result.sub = Màn {n} · {title} · hạ {kills}/{total} mục tiêu · {time}
result.convoyLost = mất đoàn xe
result.next = Màn tiếp
result.changeClass = Đổi class
result.keepLost = Thua thì các nâng cấp nhặt trong màn không được giữ lại.
result.keepMaxed = Xe đã đạt cấp tối đa mọi nâng cấp.
result.keepPicked = Chọn 1 nâng cấp đã nhặt trong màn để giữ vĩnh viễn cho class này:
result.keepRandom = Màn này không nhặt được nâng cấp nào. Chọn 1 trong 3:
result.keepChoice = {name} → cấp {n}
result.kept = Đã giữ {name} cấp {n}. Nâng cấp hiện có: {list}
# sau màn huấn luyện
result.trainedTitle = TỐT NGHIỆP TÂN BINH
result.trainedSub = Huấn luyện xong trong {time} · hạ {n} mục tiêu
result.trainedNote = Kỹ năng đủ rồi. Vào chiến dịch: chọn đồng đội rồi xuất kích màn 1.
result.toCampaign = Vào chiến dịch
# 6 ô số liệu
stats.accuracy = chính xác
stats.shells = {hits}/{shots} phát pháo
stats.kills = hạ
stats.noKills = chưa hạ xe nào
stats.flank = hạ từ hông, đuôi
stats.flankNote = bắn vào chỗ giáp mỏng
stats.dealt = sát thương
stats.taken = nhận {n}
stats.absorbed = giáp phụ đỡ {n}
stats.driven = đã lái
stats.flattened = san phẳng {area}
stats.streak = chuỗi dài nhất
stats.streakNone = liên tiếp
# tên vũ khí trong dòng "pháo 3 · tên lửa 1"
stats.wCannon = pháo
stats.wMissile = tên lửa
stats.wMg = súng máy
stats.wAir = A-10


# ============================================================
# CHIẾN DỊCH (danh sách comic)
# ============================================================
story.title = CHIẾN DỊCH
story.sub = Đã mở {n}/{of} màn
story.cardHead = MÀN {n} · {area}
story.comicSoon = Comic sắp có


# ============================================================
# MÀN HÌNH NÂNG CẤP
# ============================================================
up.section = NÂNG CẤP
up.sub = {cls}: đã giữ {n}/{of} cấp · nhặt thùng vàng trong màn, thắng thì giữ vĩnh viễn 1 món
up.level = cấp {n}/{of}
up.soon = sắp có
up.allies = ĐỒNG ĐỘI
up.reset = Xóa tiến trình nâng cấp
up.resetAsk = Xóa toàn bộ nâng cấp đã giữ của cả hai class?
up.allyHp = Máu
up.allyFire = Hỏa lực
up.allyRange = Tầm
up.allyRepair = sửa {n}% máu xe/giây
up.allyShot = {dmg} mỗi {s} giây
up.allyBurst = {dmg} × {burst} mỗi {s} giây
up.allyDroidNote = . Đi kèm khi Kit sửa chữa đạt cấp 3, không chiếm chỗ
# nhóm nâng cấp
group.fire = Hỏa lực
group.protect = Bảo vệ
group.move = Cơ động
group.support = Hỗ trợ
# từng món: tên, mỗi cấp làm gì, đơn vị của dãy số
upg.cannon.name = Pháo chính
upg.cannon.per = +12% sát thương, nạp nhanh hơn 10%
upg.cannon.unit = sát thương mỗi phát
upg.missile.name = Tên lửa
upg.missile.per = +1 quả mỗi màn, nạp nhanh hơn 12%; cấp 2 thêm 1 ô bệ phóng
upg.missile.unit = quả mỗi màn
upg.mg.name = Súng máy
upg.mg.per = +15% sát thương, +10% tầm
upg.mg.unit = sát thương/giây
upg.plate.name = Giáp phụ
upg.plate.per = +15% máu dạng lớp giáp ngoài; xe chậm 5% khi còn lớp này
upg.plate.unit = điểm giáp ngoài
upg.cageAT.name = Lồng chống tăng
upg.cageAT.per = Giảm 30% sát thương vào hông và đuôi; chậm 4% khi còn lồng
upg.cageAT.unit = điểm lồng
upg.cageUAV.name = Lồng chống UAV
upg.cageUAV.per = Chặn đạn từ drone; chậm 3% khi còn lồng
upg.cageUAV.unit = điểm lồng
upg.engine.name = Động cơ
upg.engine.per = +8% tốc độ
upg.engine.unit = % tốc độ gốc
upg.tracks.name = Xích và hộp số
upg.tracks.per = Thân xe xoay nhanh hơn 12%, bớt ì
upg.tracks.unit = °/giây xoay thân
upg.stab.name = Bộ ổn định pháo
upg.stab.per = Chụm tâm nhanh hơn 15%
upg.stab.unit = giây chụm tâm
upg.kit.name = Kit sửa chữa
upg.kit.per = +5% máu hồi mỗi lượt sửa; cấp 3 có thêm droid sửa chữa đi theo xe
upg.kit.unit = % máu mỗi kit
# món đã thiết kế, chưa làm
upg.thermal.name = Kính ảnh nhiệt
upg.thermal.note = Thấy địch trong bóng tối và khói. Làm cùng giai đoạn ngày đêm.
upg.smoke.name = Đạn khói
upg.smoke.note = Thả màn khói che xe khi rút lui. Làm cùng giai đoạn ngày đêm.

# đồng đội: tên và vai trò
ally.attackDrone.name = Drone tấn công
ally.attackDrone.role = Bay theo xe, bắn loạt nhẹ vào mọi mục tiêu trong tầm
ally.interceptor.name = Drone đánh chặn
ally.interceptor.role = Ưu tiên bắn hạ drone địch, tầm xa
ally.robot.name = Robot chống tăng
ally.robot.role = Đi bộ cạnh xe, bắn rocket chống tăng chậm mà đau
ally.repairDroid.name = Droid sửa chữa
ally.repairDroid.role = Tự sửa xe khi ở gần, xe vẫn bắn được


# ============================================================
# CẨM NANG (menu chính → Cẩm nang): thùng, giáp, địch, rồi nâng cấp
# ============================================================
guide.title = CẨM NANG
guide.nav.armour = Giáp địch
guide.nav.mine = Giáp phe ta
guide.nav.foes = Phương tiện địch
guide.nav.up = Nâng cấp
guide.nav.crates = Thùng tiếp tế

guide.crates.title = THÙNG TIẾP TẾ
guide.crates.intro = Thùng thả dù xuống chiến trường, rơi ra khi hạ địch, hoặc giấu trong công trình (phá nhà mới thấy). Lái lại gần, thùng tự hút vào xe.
guide.crate.up.name = Thùng vàng
guide.crate.up.text = Nâng cấp ngẫu nhiên, dùng được ngay trong màn. Thắng màn thì chọn giữ lại vĩnh viễn một món.
guide.crate.kit.name = Thùng xanh
guide.crate.kit.text = +1 kit sửa xe (tối đa 5 kit).
guide.crate.mis.name = Thùng tên lửa
guide.crate.mis.text = +2 tên lửa chống tăng.
guide.crate.drone.name = Thùng drone
guide.crate.drone.text = +1 drone tấn công bay theo xe cho tới khi bị bắn rơi, không chiếm chỗ đồng đội.

guide.armour.title = GIÁP XE TĂNG ĐỊCH
guide.armour.front = MẶT TRƯỚC
guide.armour.side = HÔNG
guide.armour.rear = MẶT SAU
guide.armour.top = ĐỘT NÓC
# {x} là hệ số sát thương của đạn pháo bắn vào mặt đó (nhỏ hơn 1: giáp dày, lớn hơn 1: giáp mỏng)
guide.armour.frontNote = giáp dày nhất · sát thương ×{x}
guide.armour.sideNote = giáp vừa · sát thương ×{x}
guide.armour.rearNote = giáp mỏng · sát thương ×{x}
guide.armour.atgm = tên lửa ATGM: {dmg} sát thương
# chú thích dưới bản vẽ
guide.armour.legend = Vùng gạch: lớp giáp, càng dày càng khó xuyên
guide.armour.caption = HÌNH 1 · XE TĂNG ĐỊCH · MẶT BẰNG
guide.armour.note = Bắn vào các phần có giáp mỏng hoặc không có giáp phản ứng nổ ERA làm tăng độ sát thương của đạn pháo. Tên lửa chống tăng ATGM mặc định tấn công đột nóc phương tiện địch gây thiệt hại tối đa.

guide.mine.title = GIÁP CỦA PHE TA
guide.mine.intro = Lắp được cho cả xe tăng và xe bọc thép qua nâng cấp. Lớp giáp bị bắn mất dần, mất hết thì xe nhẹ và nhanh trở lại.

guide.foes.title = PHƯƠNG TIỆN ĐỊCH
guide.foes.intro = Máu, tốc độ và tầm bắn khi chưa tính độ khó của từng màn.
guide.stat.hp = Máu
guide.stat.speed = Tốc độ
guide.stat.range = Tầm bắn
unit.mps = {n} m/s
guide.foe.tank = Giáp trước rất dày. Vòng sang hông hoặc ra sau, hoặc dùng tên lửa đánh nóc.
guide.foe.apc = Nhanh, giáp mỏng, súng liên thanh yếu. Pháo hay súng máy đều hạ được.
guide.foe.td = Pháo mạnh nhất, giáp trước dày nhất, nhưng chậm và nòng xoay hẹp. Hay phục chỗ cao và hẻm hẹp.
guide.foe.technical = Bán tải nhanh, vỏ mỏng. Bắn 2 tên lửa rồi chạy đi nạp. Súng máy trên xe tự hạ được.
guide.foe.infantry = Nấp trong nhà. Dấu ! đỏ là sắp bắn RPG, dấu vàng là mang mìn. Cán qua là chết.
guide.foe.drone = Bay vòng quanh xe và bắn loạt nhẹ. Súng máy tự hạ, lồng chống UAV đỡ đạn.
guide.foe.kamikaze = Đi theo bầy, khóa xe 1,5 giây rồi bổ nhào. Thấy vòng đỏ trên xe thì đổi hướng, bắn sớm.


# ============================================================
# HỒ SƠ CHIẾN ĐẤU
# ============================================================
career.title = HỒ SƠ CHIẾN ĐẤU
career.reset = Xóa hồ sơ chiến đấu
career.resetAsk = Xóa toàn bộ hồ sơ chiến đấu (mọi chỉ số đã ghi)?
career.empty = Chưa có trận nào. Đánh xong một màn (thắng hay thua) là hồ sơ bắt đầu ghi.
career.played = trận
career.won = thắng
career.kills = xe địch hạ
career.accuracy = chính xác pháo
career.driven = đã lái
career.gFire = Hỏa lực
career.gSurvive = Sống sót
career.gMove = Cơ động
career.gHonours = Chiến công
career.accuracyRow = Độ chính xác pháo
career.missiles = Tên lửa đã phóng
career.killsBy = Hạ bằng {weapon}
career.killsOther = Hạ cách khác (mìn, nổ lan)
career.killsType = Hạ {type}
career.flank = Hạ từ hông, đuôi
career.dealt = Sát thương gây ra
career.longest = Phát hạ xa nhất
career.taken = Sát thương vào thân xe
career.absorbed = Giáp phụ, lồng đỡ được
career.hitSides = Trúng đạn trước · hông · sau
career.repaired = Máu đã sửa
career.kitsUsed = Kit sửa đã dùng
career.deaths = Xe bị phá hủy
career.alliesLost = Đồng đội mất
career.distance = Quãng đường
career.time = Thời gian chiến đấu
career.flattened = Công trình san phẳng
career.crates = Thùng hàng nhặt
career.bestTime = Nhanh nhất màn {n}
career.bestStreak = Chuỗi hạ dài nhất
career.strikes = A-10 đã gọi
career.asTank = Lái xe tăng
career.asApc = Lái xe bọc thép
career.classRow = {missions} trận · {kills} hạ

# tên vũ khí (hồ sơ)
weapon.cannon = Pháo chính
weapon.missile = Tên lửa
weapon.mg = Súng máy
weapon.air = A-10
weapon.other = Khác (mìn, nổ dây chuyền)
# tên các loại địch (hồ sơ)
enemy.tank = Xe tăng
enemy.apc = Xe bọc thép
enemy.td = Pháo diệt tăng
enemy.technical = Bán tải tên lửa
enemy.infantry = Bộ binh
enemy.drone = Drone
enemy.kamikaze = Drone cảm tử
enemy.robot = Robot


# ============================================================
# HUẤN LUYỆN TÂN BINH (màn 0)
# Mỗi bài: title = tên bài, touch = chữ khi chơi điện thoại, pc = chữ khi chơi máy tính.
# Thẻ hiện ở trên cùng, rộng khoảng 2 dòng: giữ mỗi câu ngắn.
# ============================================================
train.drive.title = LÁI XE
train.drive.touch = Đặt ngón cái ở góc dưới bên trái rồi kéo về hướng muốn đi. Lái vào vòng xanh.
train.drive.pc = W A S D để lái. Lái vào vòng xanh.
train.lock.title = KHÓA VÀ BẮN
train.lock.touch = Chạm vào xe địch để khóa: nòng tự xoay theo. Giữ BẮN khi vòng quanh nút chuyển xanh.
train.lock.pc = Rê chuột vào xe địch để ngắm, Space để bắn.
train.flank.title = ĐÁNH SƯỜN
train.flank.touch = Giáp trước xe tăng rất dày: bắn thẳng mặt chỉ còn nửa sức, bắn hông đủ sức, bắn sau lưng gấp rưỡi. Vòng sang hông rồi bắn.
train.flank.pc = Giáp trước xe tăng rất dày: bắn thẳng mặt chỉ còn nửa sức, bắn hông đủ sức, bắn sau lưng gấp rưỡi. Vòng sang hông rồi bắn.
train.missile.title = TÊN LỬA
train.missile.touch = Bấm TÊN LỬA: tên lửa bay vượt vật cản rồi bổ xuống nóc xe, nơi giáp mỏng nhất. Hạ chiếc xe tăng này.
train.missile.pc = Phím Q bắn tên lửa: bay vượt vật cản rồi bổ xuống nóc xe, nơi giáp mỏng nhất. Hạ chiếc xe tăng này.
train.crate.title = THÙNG TIẾP TẾ
train.crate.touch = Thùng thả dù: xanh lá là kit sửa, vàng là nâng cấp. Lái lại gần, thùng tự hút vào xe.
train.crate.pc = Thùng thả dù: xanh lá là kit sửa, vàng là nâng cấp. Lái lại gần, thùng tự hút vào xe.
train.repair.title = SỬA XE
train.repair.touch = Xe vừa trúng đạn. Dừng hẳn lại rồi bấm SỬA XE. Đứng yên tới khi sửa xong, lái đi là hủy.
train.repair.pc = Xe vừa trúng đạn. Dừng hẳn lại rồi bấm R. Đứng yên tới khi sửa xong, lái đi là hủy.
train.air.title = GỌI A-10
train.air.touch = Hạ đủ 15 xe địch thì được gọi A-10, lần này cấp sẵn. Lại gần nhóm xe rồi bấm YỂM TRỢ. Vòng đỏ là chỗ bom rơi, xe nào sót thì bắn nốt.
train.air.pc = Hạ đủ 15 xe địch thì được gọi A-10, lần này cấp sẵn. Lại gần nhóm xe rồi bấm F. Vòng đỏ là chỗ bom rơi, xe nào sót thì bắn nốt.
train.live.title = THỰC CHIẾN
train.live.touch = Một tổ địch thật ở làng phía đông, lần này chúng bắn trả. Dấu ! đỏ là lính tên lửa sắp bắn: né đi, súng máy trên xe tự diệt lính trong tầm.
train.live.pc = Một tổ địch thật ở làng phía đông, lần này chúng bắn trả. Dấu ! đỏ là lính tên lửa sắp bắn: né đi, súng máy trên xe tự diệt lính trong tầm.
# khi làm xong một bài, và khi xong cả khóa
train.passed = Đạt.
train.doneStep = XONG
train.doneTitle = TỐT NGHIỆP TÂN BINH
train.doneText = Đủ kỹ năng ra chiến trường. Vào chiến dịch thôi.


# ============================================================
# CÁC MÀN CHƠI
# Mỗi màn: title = tên, area = khu vực, situation / task / lose / note = 4 mục bản tin.
# ============================================================
level.0.title = Huấn luyện tân binh
level.0.area = Bãi tập sa mạc
level.0.situation = Bãi tập ngoài căn cứ. Xe mục tiêu đứng yên, không bắn trả. Cuối bài có một tổ địch thật.
level.0.task = Làm lần lượt từng bài: lái, khóa và bắn, đánh sườn, tên lửa, nhặt thùng, sửa xe, gọi A-10, rồi thực chiến.
level.0.lose = Không thua được: xe không bị phá hủy trong bãi tập.
level.0.note = Khoảng 2 phút. Đã quen tay thì bấm Bỏ qua, lúc nào cũng được.

level.1.title = Khu phố 7
level.1.area = Đô thị
level.1.situation = Địch chiếm khu phố. Ba tổ cơ giới đang tuần tra, hai pháo diệt tăng phục quanh khu trung tâm.
level.1.task = Tiêu diệt toàn bộ lực lượng địch.
level.1.lose = Xe bị phá hủy.
level.1.note = Tiếng pháo kéo địch trong 200 m tới. Còn 2 địch cuối thì có mũi tên chỉ hướng.

level.2.title = Ngã tư đại lộ
level.2.area = Đô thị
level.2.situation = Địch giữ ngã tư đại lộ. Bộ binh chống tăng nấp trong các dãy nhà quanh ngã tư.
level.2.task = Chiếm ngã tư: đứng trong vùng 20 giây khi trong vùng không còn địch.
level.2.lose = Xe bị phá hủy.
level.2.note = Bộ binh lộ diện khi xe áp sát hoặc drone phát hiện. Dấu ! đỏ: sắp bắn RPG.

level.3.title = Đoàn xe tiếp tế
level.3.area = Đô thị
level.3.situation = Ba xe tiếp tế từ phía tây bắc phải ra cửa ngõ phía đông. Tuyến đường có bộ binh phục kích và ba tổ cơ giới tuần tra.
level.3.task = Hộ tống đoàn xe tới điểm tập kết. Đoàn xe dừng khi có địch phía trước: dọn đường cho họ.
level.3.lose = Mất 2 xe tiếp tế, hoặc xe mình bị phá hủy.
level.3.note = Xe tiếp tế có súng máy, chỉ diệt được drone và bộ binh.

level.4.title = Bến cảng
level.4.area = Khu công nghiệp
level.4.situation = Địch giữ bến cảng phía đông: bãi container, kho hàng, bồn dầu. Chúng biết nấp sau container và nhà kho.
level.4.task = Tiêu diệt toàn bộ địch.
level.4.lose = Xe bị phá hủy.
level.4.note = Địch bắn xong sẽ lùi vào chỗ khuất để nạp đạn: chờ nó ló ra, hoặc vòng sườn. Lối giữa các dãy container chỉ xe bọc thép lọt.

level.5.title = Cố thủ quảng trường
level.5.area = Đô thị · ban đêm
level.5.situation = Tiếp viện ta đang trên đường tới. Địch sẽ dồn quân từ mép tây và mép bắc để chiếm lại quảng trường.
level.5.task = Chiếm quảng trường và cố thủ 120 giây.
level.5.lose = Xe bị phá hủy.
level.5.note = Giữ được 60 giây thì ba xe tăng phe ta tiến vào hỗ trợ. Đồng hồ chỉ chạy khi giữ vùng. Rút ra sửa xe được, nhưng địch chiếm vùng thì đồng hồ tụt. Drone cảm tử đi theo bầy: thấy vòng đỏ trên xe thì đổi hướng, bắn sớm. Ban đêm: nhìn đèn pha và đèn phanh để biết xe địch đang hướng nào. Bấm PHÁO SÁNG (phím E) để soi chỗ đang ngắm, mỗi màn 4 quả. Địch đang săn mình cũng sẽ bắn pháo sáng lên đầu xe mình.

level.6.title = Mũi tấn công
level.6.area = Đô thị
level.6.situation = Tổ xe tăng phe ta (3 xe, màu xanh lam) xuất phát cùng ta, đánh theo trục phố phía nam rồi bẻ lên bắc. Ta đánh dọc đại lộ.
level.6.task = Cùng phe ta tiêu diệt toàn bộ địch.
level.6.lose = Xe mình bị phá hủy.
level.6.note = Không bắn trúng quân mình. Phe ta mất hết thì không thua, nhưng phải một mình gánh cả khu. Địch biết ẩn nấp.

level.7.title = Đường mòn cát
level.7.area = Sa mạc · ban đêm
level.7.situation = Đoàn tiếp tế phải băng qua sa mạc theo đường mòn, qua hai làng ốc đảo. Bộ binh nấp trong nhà đất, một số mang mìn. Đồi cát che tầm nhìn.
level.7.task = Hộ tống 3 xe tiếp tế tới điểm tập kết phía đông bắc.
level.7.lose = Mất 2 xe tiếp tế, hoặc xe mình bị phá hủy.
level.7.note = Nhà đất húc đổ được. Lính có dấu vàng là mang mìn: bắn từ xa thì nổ to, cán qua thì xe dính mìn. Bán tải tên lửa bắn 2 quả rồi chạy đi nạp, súng máy tự bắn được nó. Núi đá có dốc cát để lên, đứng trên cao bắn xa hơn. Ban đêm: nhìn đèn pha và đèn phanh để biết xe địch đang hướng nào. Bấm PHÁO SÁNG (phím E) để soi chỗ đang ngắm, mỗi màn 4 quả. Địch đang săn mình cũng sẽ bắn pháo sáng lên đầu xe mình.

level.8.title = Ốc đảo
level.8.area = Sa mạc
level.8.situation = Ta giữ được nguồn nước duy nhất của vùng. Địch sẽ đánh vào từ cả bốn hướng theo các đường mòn.
level.8.task = Chiếm bờ nam ốc đảo, cố thủ 40 giây. Tiếp viện và A-10 tới thì cùng dọn sạch địch.
level.8.lose = Xe bị phá hủy.
level.8.note = Đồng hồ chỉ chạy khi giữ vùng; địch chiếm vùng thì đồng hồ tụt. Địch dồn dập từ 4 hướng, có bầy drone cảm tử. Núp sau xác xe để trụ.

level.9.title = Đèo gió
level.9.area = Đồi núi · ban đêm
level.9.situation = Địch giữ trạm gác trên đèo, pháo diệt tăng phục trên hai vách núi nhìn xuống hẻm. Tổ xe tăng phe ta (3 xe) đánh vòng lên cao nguyên phía đông.
level.9.task = Cùng phe ta chiếm trạm gác đèo: đứng trong vùng 25 giây khi không còn địch trong vùng.
level.9.lose = Xe mình bị phá hủy.
level.9.note = Đi thẳng vào hẻm là ăn đạn từ trên cao. Leo dốc lên vách để bắn ngang tầm, hoặc theo phe ta lên cao nguyên. Suối chỉ qua được ở cầu. AI địch cấp 3: đánh vòng sườn. Ban đêm: nhìn đèn pha và đèn phanh để biết xe địch đang hướng nào. Bấm PHÁO SÁNG (phím E) để soi chỗ đang ngắm, mỗi màn 4 quả. Địch đang săn mình cũng sẽ bắn pháo sáng lên đầu xe mình.

level.10.title = Pháo đài
level.10.area = Đồi núi
level.10.situation = Sở chỉ huy địch đóng trong pháo đài đá giữa thung lũng, hai dãy núi hai bên. Đây là trận cuối.
level.10.task = Chặng 1: chiếm sân cổng nam pháo đài (20 giây). Chặng 2: cố thủ 45 giây trước phản kích. Chặng 3: cùng tiếp viện và A-10 tiêu diệt toàn bộ địch.
level.10.lose = Xe mình bị phá hủy.
level.10.note = Tường pháo đài không phá được, chỉ vào qua 4 cổng. Pháo diệt tăng phục trên sườn núi phía đông. Phản kích tới từ phía bắc và cả sau lưng. Đủ mặt mọi loại địch, AI cấp 3. Đánh bại đợt địch đầu tiên ở chặng cố thủ thì ba xe tăng phe ta tiến vào hỗ trợ.
# tên 3 chặng màn 10 (hiện trong thông báo chuyển chặng)
level.10.stage1 = Chiếm cổng
level.10.stage2 = Cố thủ
level.10.stage3 = Tiêu diệt toàn bộ

# ---------- truyện trước nhiệm vụ: intro.<màn>.<khung> ----------
intro.0.1 = Trung úy Dan Jeager, biệt danh Con Bọ, lính xe tăng, đang bị điều tra vì tội chống đối sĩ quan cấp trên sau trận đồi 204 thất thủ. Một đêm tháng Mười, Con Bọ bất ngờ được đưa tới doanh trại sư đoàn tấn công cơ giới King Tiger, chỉ huy bởi trung tướng Ivan Krugger.
intro.0.2 = Trung tướng Ivan Krugger là người bảo lãnh cho Con Bọ về đơn vị. Sư đoàn King Tiger phụ trách chiến trường phía Đông của Daria, chống lại kẻ thù truyền kiếp là đế quốc Panzor hùng mạnh. "Ta cần một tanker thiện chiến để chiếm lại thành phố", ông chỉ tay về chiếc Centurion số hiệu 131: "Ta biết ta đã có hắn rồi."
`,kt=Object.assign({"./vi.txt":pn});function me(i){const t=new Map;for(const e of i.split(/\r?\n/)){const n=e.trim();if(!n||n.startsWith("#"))continue;const r=n.indexOf("=");r>0&&t.set(n.slice(0,r).trim(),n.slice(r+1).trim())}return t}const vt=new URLSearchParams(location.search).get("lang")??"vi",xe=me(kt["./vi.txt"]??""),fn=kt[`./${vt}.txt`]?me(kt[`./${vt}.txt`]):xe,mn=kt[`./${vt}.txt`]?vt:"vi",xn=new Set;function Y(i,t){let e=fn.get(i)??xe.get(i);return e===void 0?(xn.add(i),`⟨${i}⟩`):(t&&(e=e.replace(/\{(\w+)\}/g,(n,r)=>r in t?String(t[r]):n)),e)}function qn(i=document){for(const t of i.querySelectorAll("[data-t]"))t.textContent=Y(t.dataset.t);for(const t of i.querySelectorAll("[data-t-aria]"))t.setAttribute("aria-label",Y(t.dataset.tAria));for(const t of i.querySelectorAll("[data-t-title]"))t.title=Y(t.dataset.tTitle);document.documentElement.lang=mn}const ee=10,jn=5,ut=.78,Ct=.75,G=Math.PI/180,Zn=480,Qn={concrete:1,brick:2,wood:3,steel:4,stone:5,tree:6,car:7,shophouse:8,shed:9,mud:10},Jn={1:{name:"Bê tông",top:9409175,side:6053733,debris:[11185327,8224901,13092285],dust:10724252,size:[2,4.5],chunks:3,windows:2764857},2:{name:"Gạch",top:10902080,side:7288615,debris:[12149823,9061936,13666916],dust:10844518,size:[2,3.5],chunks:3,windows:3876383},3:{name:"Gỗ",top:10254409,side:6703918,debris:[12029531,8215866,13873274],dust:9402967,size:[1.6,1.8],chunks:3,splinter:!0},4:{name:"Thép",top:6978955,side:4411483,palette:[11887919,4157327,5209930,10107442],debris:[9280423,5661550],size:[1.5,2.5],chunks:1,spark:!0},5:{name:"Đá",top:9208689,side:6116937,debris:[10655871,7432537,5787973],dust:9077360,size:[2.5,5],chunks:2},6:{name:"Cây",top:5208634,side:3496488,debris:[6262597,4155950,8018486],size:[1.6,2.4],chunks:3,splinter:!0},7:{name:"Ô tô",top:12077114,side:7023138,palette:[12077114,14276300,4022156,13674554],debris:[10134440,2895667,13227740],size:[1.5,3],chunks:2,spark:!0},8:{name:"Nhà phố",top:10262672,side:14207386,sidePalette:[15128226,15647648,11127762,13032619],debris:[14207386,10262672,13220256],dust:12892580,size:[2,4],chunks:3,windows:2962232},10:{name:"Nhà đất",top:12098156,side:13084792,sidePalette:[13611139,12754284,14204820,12162154],debris:[13084792,10256216,14205600],dust:13811096,size:[2,4],chunks:3},9:{name:"Nhà xưởng",top:10134696,side:7305856,debris:[11055798,7305856],size:[1.5,3],chunks:2,spark:!0}},ti=.55,ei={1:{name:"Nhà nhỏ",hp:12},2:{name:"Nhà thấp tầng",hp:45},3:{name:"Nhà cao tầng",hp:1/0}},ni={heavy:8,light:2},ii=.45,ri={tank:{id:"tank",name:"Xe tăng",hp:165,speed:130,hullTurn:90*G,hullInertia:.25,turretTurn:70*G,turretInertia:.15,facing:{front:.5,side:1,rear:1.6},heavy:!0,radius:15,aimTime:.8,size:[34,26],weapon:{dmg:44,speed:560,range:560,reload:.9,burst:1,burstGap:0,blast:24,spread:.012},colors:{body:5662010,top:8294736,turret:10335071}},apc:{id:"apc",name:"Xe bọc thép",hp:105,speed:210,hullTurn:150*G,hullInertia:.15,turretTurn:140*G,turretInertia:.1,facing:{front:.7,side:1,rear:1.5},heavy:!1,radius:9,aimTime:.5,size:[32,18],weapon:{dmg:24,speed:640,range:480,reload:1.02,burst:3,burstGap:.09,blast:12,spread:.02,light:!0,ap:.62},colors:{body:5069898,top:7637612,turret:9678216}}},si={tank:{id:"e-tank",name:"Xe tăng địch",hp:115,speed:70,hullTurn:60*G,hullInertia:.3,turretTurn:50*G,turretInertia:.2,facing:{front:.5,side:1,rear:1.6},heavy:!0,radius:15,aimTime:1,size:[34,26],weapon:{dmg:17,speed:380,range:300,reload:2.2,burst:1,burstGap:0,blast:16,spread:.03},colors:{body:7223853,top:10245439,turret:11953226}},apc:{id:"e-apc",name:"Xe bọc thép địch",hp:55,speed:125,hullTurn:120*G,hullInertia:.2,turretTurn:110*G,turretInertia:.15,facing:{front:.8,side:1,rear:1.4},heavy:!1,radius:14,aimTime:.6,size:[34,20],weapon:{dmg:5,speed:460,range:260,reload:1.8,burst:3,burstGap:.12,blast:8,spread:.05,light:!0},colors:{body:7029812,top:9396040,turret:11038810}},td:{id:"e-td",name:"Pháo diệt tăng",hp:150,speed:55,hullTurn:35*G,hullInertia:.4,turretTurn:30*G,turretInertia:.2,fixedGun:12*G,facing:{front:.3,side:1.2,rear:1.8},heavy:!0,radius:16,aimTime:1.2,size:[38,26],weapon:{dmg:34,speed:520,range:380,reload:3.2,burst:1,burstGap:0,blast:22,spread:.02},colors:{body:6173734,top:8341299,turret:9392699}},drone:{id:"e-drone",name:"Drone",hp:22,speed:150,hullTurn:360*G,hullInertia:.1,turretTurn:360*G,turretInertia:.05,facing:{front:1,side:1,rear:1},heavy:!1,radius:11,aimTime:.3,size:[18,18],flying:!0,soft:!0,weapon:{dmg:3,speed:420,range:210,reload:1.3,burst:2,burstGap:.15,blast:0,spread:.06,light:!0,overhead:!0},colors:{body:3815478,top:6051923,turret:14964543}},infantry:{id:"e-inf",name:"Bộ binh chống tăng",hp:20,speed:35,hullTurn:360*G,hullInertia:.05,turretTurn:240*G,turretInertia:.05,facing:{front:1,side:1,rear:1},heavy:!1,radius:6,aimTime:.6,size:[8,8],soft:!0,weapon:{dmg:23,speed:260,range:250,reload:7,burst:1,burstGap:0,blast:10,spread:.03,rpg:!0},colors:{body:5917238,top:8022602,turret:4016686}},technical:{id:"e-tech",name:"Bán tải tên lửa",hp:45,speed:165,hullTurn:150*G,hullInertia:.15,turretTurn:160*G,turretInertia:.1,facing:{front:1,side:1.1,rear:1.2},heavy:!1,radius:11,aimTime:.6,size:[26,14],soft:!0,weapon:{dmg:35,speed:320,range:400,reload:8,burst:2,burstGap:.6,blast:14,spread:.03,rpg:!0},colors:{body:9071178,top:11569758,turret:4868670}},kamikaze:{id:"e-kami",name:"Drone cảm tử",hp:55,speed:170,hullTurn:300*G,hullInertia:.1,turretTurn:300*G,turretInertia:.05,facing:{front:1,side:1,rear:1},heavy:!1,radius:11,aimTime:.3,size:[18,18],flying:!0,soft:!0,weapon:{dmg:0,speed:1,range:0,reload:99,burst:0,burstGap:0,blast:0,spread:0},colors:{body:3025705,top:4867136,turret:14964543}}},oi={id:"f-tank",name:"Xe tăng phe ta",hp:90,speed:80,hullTurn:70*G,hullInertia:.3,turretTurn:60*G,turretInertia:.2,facing:{front:.5,side:1,rear:1.6},heavy:!0,radius:15,aimTime:.9,size:[34,26],weapon:{dmg:22,speed:520,range:380,reload:2.6,burst:1,burstGap:0,blast:20,spread:.025},colors:{body:3954022,top:5929614,turret:8035762}},ai={id:"a-truck",name:"Xe tiếp tế",hp:120,speed:70,hullTurn:90*G,hullInertia:.2,turretTurn:300*G,turretInertia:.05,facing:{front:1,side:1.1,rear:1.2},heavy:!1,radius:12,aimTime:.3,size:[30,16],weapon:{dmg:2.5,speed:1,range:220,reload:.12,burst:0,burstGap:0,blast:0,spread:0},colors:{body:5595199,top:8029784,turret:4015408}},hi={reveal:90,droneReveal:300,telegraph:2.5,mgMul:.6,afterShot:5,cageCut:.7},li={lockRange:170,lockTime:1.5,stagger:.5,dive:330,lead:.85,direct:20,halo:40,haloDmg:10,hitRadius:16,cageCut:.75,cageCost:15},ci={kitHeal:.1,kitTime:6,startKits:3,maxKits:5,stationRate:.08,stationPool:.6,stationRadius:55,dropEvery:[50,70],dropDist:[250,450]},ui={tank:1,apc:2},gi=.03,At={body:4151900,top:6260100,turret:8827054},di={attackDrone:{id:"a-drone",name:"Drone tấn công",title:Y("ally.attackDrone.name"),role:Y("ally.attackDrone.role"),hp:30,speed:210,hullTurn:360*G,hullInertia:.1,turretTurn:360*G,turretInertia:.05,facing:{front:1,side:1,rear:1},heavy:!1,radius:10,aimTime:.3,size:[16,16],flying:!0,soft:!0,weapon:{dmg:6,speed:500,range:240,reload:1,burst:3,burstGap:.1,blast:0,spread:.04,light:!0,overhead:!0},colors:At},interceptor:{id:"a-intercept",name:"Drone đánh chặn",title:Y("ally.interceptor.name"),role:Y("ally.interceptor.role"),hp:25,speed:240,hullTurn:360*G,hullInertia:.1,turretTurn:360*G,turretInertia:.05,facing:{front:1,side:1,rear:1},heavy:!1,radius:10,aimTime:.2,size:[16,16],flying:!0,soft:!0,weapon:{dmg:5,speed:600,range:300,reload:.5,burst:2,burstGap:.08,blast:0,spread:.02,light:!0,overhead:!0},colors:At},robot:{id:"a-robot",name:"Robot chống tăng",title:Y("ally.robot.name"),role:Y("ally.robot.role"),hp:70,speed:150,hullTurn:220*G,hullInertia:.1,turretTurn:200*G,turretInertia:.08,facing:{front:1,side:1,rear:1.2},heavy:!1,radius:10,aimTime:.5,size:[18,16],soft:!0,weapon:{dmg:28,speed:420,range:360,reload:3.5,burst:1,burstGap:0,blast:14,spread:.02},colors:At},repairDroid:{id:"a-repair",name:"Droid sửa chữa",title:Y("ally.repairDroid.name"),role:Y("ally.repairDroid.role"),hp:60,speed:150,hullTurn:260*G,hullInertia:.1,turretTurn:200*G,turretInertia:.08,facing:{front:1,side:1,rear:1},heavy:!1,radius:9,aimTime:.5,size:[16,14],soft:!0,weapon:{dmg:0,speed:1,range:0,reload:99,burst:0,burstGap:0,blast:0,spread:0},colors:{body:4151900,top:10473834,turret:15460307}}},pi=["attackDrone","interceptor","robot"],yn=34,fi=14,mi={range:240,rate:10,dmg:2.9,hit:.8},xi={dmg:77,range:420,speed:300,turn:3.2,perLoad:2,reloadEach:6,ammo:6,blast:26,gap:.35,cruise:46},bn=(i,t,e)=>i<t?t:i>e?e:i,Tn=(i,t)=>Math.atan2(Math.sin(i-t),Math.cos(i-t)),yi=(i,t)=>i+Math.random()*(t-i),bi=i=>i[Math.random()*i.length|0];function Ti(i){let t=i|0;const e=()=>{t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296};return{next:e,range:(n,r)=>n+e()*(r-n)}}function Si(i,t,e,n,r,s){const a=Tn(e,i),o=r>.01?n/r:1e6,l=Math.sign(a)*Math.min(n,Math.sqrt(2*o*Math.abs(a)));t+=bn(l-t,-o*s,o*s);let h=t*s;return Math.sign(h)===Math.sign(a)&&Math.abs(h)>=Math.abs(a)&&(h=a,t=0),[i+h,t]}function at(i,t){const e=n=>Math.max(0,Math.min(255,Math.round(n*t)));return e(i>>16&255)<<16|e(i>>8&255)<<8|e(i&255)}class O{constructor(t,e,n,r,s){this.X=t,this.Y=e,this.Z=n,this.ox=r,this.oy=s,this.data=new Uint8Array(t*e*n)}X;Y;Z;ox;oy;data;i(t,e,n){const r=Math.floor(t)+this.ox,s=Math.floor(e)+this.oy,a=Math.floor(n);return r<0||s<0||a<0||r>=this.X||s>=this.Y||a>=this.Z?-1:(a*this.Y+s)*this.X+r}get(t,e,n){const r=this.i(t,e,n);return r<0?0:this.data[r]}set(t,e,n,r){const s=this.i(t,e,n);s>=0&&(this.data[s]=r)}box(t,e,n,r,s,a,o){for(let l=s;l<a;l++)for(let h=n;h<r;h++)for(let c=t;c<e;c++)this.set(c,h,l,o);return this}cylZ(t,e,n,r,s,a){for(let o=r;o<s;o++)for(let l=Math.floor(e-n);l<=e+n;l++)for(let h=Math.floor(t-n);h<=t+n;h++)(h+.5-t)**2+(l+.5-e)**2<=n*n&&this.set(h,l,o,a);return this}cylX(t,e,n,r,s,a){for(let o=r;o<s;o++)for(let l=Math.floor(e-n);l<=e+n;l++)for(let h=Math.floor(t-n);h<=t+n;h++)(h+.5-t)**2+(l+.5-e)**2<=n*n&&this.set(o,h,l,a);return this}cylY(t,e,n,r,s,a){for(let o=r;o<s;o++)for(let l=Math.floor(e-n);l<=e+n;l++)for(let h=Math.floor(t-n);h<=t+n;h++)(h+.5-t)**2+(l+.5-e)**2<=n*n&&this.set(h,o,l,a);return this}paint(t){for(let e=0;e<this.Z;e++)for(let n=0;n<this.Y;n++)for(let r=0;r<this.X;r++){const s=(e*this.Y+n)*this.X+r,a=this.data[s];a&&(this.data[s]=t(r-this.ox,n-this.oy,e,a))}return this}}const tt=[[0,0,1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]],ne=[-.8,-.35],Sn=(i,t,e)=>{let n=Math.imul(i*73856093^t*19349663^e*83492791,2654435761);return n^=n>>>15,(n>>>0)/4294967296};function wn(i){const t=[];for(let e=0;e<i.Z;e++)for(let n=0;n<i.Y;n++)for(let r=0;r<i.X;r++){const s=i.data[(e*i.Y+n)*i.X+r];if(!s)continue;const a=r-i.ox,o=n-i.oy,l=.96+Sn(a,o,e)*.08;tt.forEach(([h,c,u],g)=>{i.get(a+h,o+c,e+u)||t.push({x:a,y:o,z:e,d:g,c:s,v:l})})}return t}const kn=(i,t)=>`rgb(${Math.min(255,(i>>16&255)*t)|0},${Math.min(255,(i>>8&255)*t)|0},${Math.min(255,(i&255)*t)|0})`;function vn(i,t=48,e=3){const n=i.map(({m:x,pal:y})=>{const m=wn(x),M=[];for(let N=0;N<t;N++){const w=N/t*Math.PI*2,f=Math.cos(w),I=Math.sin(w),L=(k,C,v)=>[(k*f-C*I)*e,((k*I+C*f)*ut-v*Ct)*e],_=m.filter(k=>k.d===0||tt[k.d][0]*I+tt[k.d][1]*f>.02),H=k=>{const C=k.x+.5,v=k.y+.5;return(C*I+v*f)*1e3+k.z*2+(k.d===0?1:0)};_.sort((k,C)=>H(k)-H(C));let D=1e9,A=1e9,F=-1e9,W=-1e9;const E=_.map(k=>{const{x:C,y:v,z:b,d:R}=k;let P;if(R===0)P=[L(C,v,b+1),L(C+1,v,b+1),L(C+1,v+1,b+1),L(C,v+1,b+1)];else{const[z,V]=tt[R],Q=z?C+(z>0?1:0):C,ft=z?Q:C+1,Nt=V?v+(V>0?1:0):v,Ft=V?Nt:v+1;P=[L(Q,Nt,b),L(ft,Ft,b),L(ft,Ft,b+1),L(Q,Nt,b+1)]}for(const[z,V]of P)D=Math.min(D,z),A=Math.min(A,V),F=Math.max(F,z),W=Math.max(W,V);let X=1.06;if(R){const z=tt[R][0]*f-tt[R][1]*I,V=tt[R][0]*I+tt[R][1]*f;X=.6+.32*Math.max(0,z*ne[0]+V*ne[1]),X*=.82+.18*Math.min(1,b/5)}return{pts:P,col:kn(y[k.c]??16711935,X*k.v)}}),B=2;M.push({w:Math.ceil(F-D)+B*2,h:Math.ceil(W-A)+B*2,ax:-D+B,ay:-A+B,draw:(k,C,v)=>{k.lineWidth=.6,k.lineJoin="round";for(const{pts:b,col:R}of E){k.beginPath(),k.moveTo(b[0][0]+C,b[0][1]+v);for(let P=1;P<4;P++)k.lineTo(b[P][0]+C,b[P][1]+v);k.closePath(),k.fillStyle=R,k.strokeStyle=R,k.fill(),k.stroke()}}})}return M}),r=2048,s=[];let a=0,o=0,l=0;for(const x of n){const y=[];for(const m of x)a+m.w+2>r&&(a=0,o+=l+2,l=0),y.push([a+1,o+1]),a+=m.w+2,l=Math.max(l,m.h);s.push(y)}const h=o+l+2,c=document.createElement("canvas");c.width=r,c.height=h;const u=c.getContext("2d",{willReadFrequently:!0});n.forEach((x,y)=>x.forEach((m,M)=>m.draw(u,s[y][M][0]+m.ax,s[y][M][1]+m.ay)));const g=document.createElement("canvas");g.width=r,g.height=h;const p=g.getContext("2d",{willReadFrequently:!0});p.drawImage(c,0,0),p.globalCompositeOperation="source-in",p.fillStyle="rgba(16,14,10,0.7)",p.fillRect(0,0,r,h),u.globalCompositeOperation="destination-over";for(const[x,y]of[[-1,0],[1,0],[0,-1],[0,1]])u.drawImage(g,x,y);u.globalCompositeOperation="source-over";const S=Lt.from(c);return n.map((x,y)=>({n:t,s:e,textures:x.map((m,M)=>{const[N,w]=s[y][M];return new Lt({source:S.source,frame:new bt(N,w,m.w,m.h),defaultAnchor:{x:m.ax/m.w,y:m.ay/m.h}})})}))}const ie=(i,t)=>(Math.round(t/(Math.PI*2)*i.n)%i.n+i.n)%i.n,d={base:1,camo:2,track:3,tread:4,wheel:5,metal:6,dark:7,lens:8,rust:9,cage:10,light:11,tyre:12,hub:13,era:14,hatch:15,pod:16,camo2:17,net:18},Mt=(i,t,e)=>Math.sin(i*.33+t*.18+e*.12)+Math.sin(t*.41-i*.13)*.7,gt=(i,t,e)=>Math.sin(i*.45+Math.sin(t*.6)*1.5)*Math.cos(t*.38+e*.3+Math.sin(i*.3));function _n(i){const t=new O(40,32,12,20,16),{base:e,track:n,tread:r,wheel:s,dark:a,rust:o,cage:l,light:h,era:c}=d;for(const u of[-1,1]){const g=u>0?8:-12,p=g+4,S=u>0?11:-12;t.box(-16,16,g,p,0,5,n);for(let x=-15;x<15;x+=2)t.box(x,x+1,g,p,4,5,r);for(const[x,y]of[[-12,2.3],[-8,2.3],[-4,2.3],[0,2.3],[4,2.3],[8,2.3],[12,2.3]])for(let m=0;m<5;m++)for(let M=Math.floor(x-y);M<=x+y;M++)(M+.5-x)**2+(m+.5-2.4)**2<=y*y&&t.set(M,S,m,s);t.cylY(14.5,2.6,2,S,S+1,r)}t.box(-15,15,-8,8,1,5,e),t.box(15,17,-8,8,2,5,e),t.box(-16,15,-12,12,5,9,e);for(const u of[-1,1])t.box(15,17,u>0?8:-12,u>0?12:-8,5,6,e);t.box(15,16,2,6,7,8,a),t.box(15,16,-5,-3,7,8,a),t.box(14,15,8,10,9,10,h),t.box(14,15,-10,-8,9,10,h);for(let u=-7;u<=6;u+=2)t.box(-15,-8,u,u+1,8,9,a);t.box(10,13,2,5,8,9,d.hatch),t.box(10,13,-6,-3,8,9,d.hatch);for(const u of[-1,1])t.cylZ(-16.5,u*4.5,1.3,5,11,o),t.cylZ(-16.5,u*9,1.2,6,9,a);if(t.paint((u,g,p,S)=>S===e&&Mt(u,g,p)>.75?d.camo:S),i.plate){for(const u of[-1,1])for(const g of[-13,-5,3])t.box(g,g+7,u>0?12:-13,u>0?13:-12,5,9,c);t.box(16,17,-7,7,5,8,c)}if(i.cageAT)for(const u of[-1,1]){const g=u>0?14:-15;t.box(-16,16,g,g+1,9,10,l),t.box(-16,16,g,g+1,2,3,l);for(let p=-15;p<16;p+=3)t.box(p,p+1,g,g+1,3,9,l);for(const p of[-12,0,12])t.box(p,p+1,u>0?12:-14,u>0?14:-12,8,9,l)}return t}function Cn(i){const t=new O(50,24,16,15,12),{base:e,metal:n,dark:r}=d;for(let s=0;s<6;s++)for(let a=-8;a<8;a++)for(let o=-10;o<7;o++){const l=o+.5,h=a+.5,c=s===5?7.3:8.2;(l>=0?Math.abs(h)<=(s===5?7:8)&&l<(s===5?6:7):(l/9.5)**2+(h/c)**2<=1)&&t.set(o,a,s,e)}t.box(6,9,-5,5,1,5,e),t.box(8,9,-4,-2,3,4,r),t.cylX(0,3,1.6,9,14,n),t.cylX(0,3,1.05,14,30,n),t.box(29,31,-2,2,1,5,n),t.box(31,32,-1,1,2,4,n),t.box(32,34,-2,2,1,5,n),t.cylZ(-4,-4.5,2.4,6,8,e),t.cylZ(-4,-4.5,1.3,7,8,r),t.box(-1,2,2,5,6,7,d.hatch),t.box(-14,-9,-6,6,1,5,e);for(const s of[-1,1])t.box(4,6,s>0?8:-9,s>0?9:-8,3,5,r);if(t.box(-5,4,8,11,2,5,d.pod),t.box(4,5,8,11,2,5,r),t.box(-8,-7,5,6,6,15,r),t.paint((s,a,o,l)=>l===e&&Mt(s+3,a,o+9)>.75?d.camo:l),i.cageUAV){for(const[a,o]of[[6,8],[6,-9],[-10,8],[-10,-9]])t.box(a,a+1,o,o+1,5,9,d.net);for(let a=-10;a<=6;a+=4)t.box(a,a+1,-9,9,9,10,d.net);for(const a of[-9,-3,2,8])t.box(-10,7,a,a+1,9,10,d.net)}return t}function Mn(i){const t=new O(38,26,13,19,13),{base:e,tyre:n,hub:r,dark:s,light:a,cage:o,era:l}=d;for(const h of[-12,-6.5,3.5,9.5])for(const c of[-1,1]){const u=c>0?7:-9;t.cylY(h,3.2,3.2,u,u+2,n),t.cylY(h,3.2,1.5,c>0?u+1:u,c>0?u+2:u+1,r)}t.box(-15,14,-5,5,2,4,e),t.box(-15,13,-7,7,4,10,e),t.box(-14,12,-6,6,10,11,e);for(let h=13;h<18;h++){const c=h-13;t.box(h,h+1,-7+(c>3?1:0),7-(c>3?1:0),3+Math.round(c*.6),10-Math.round(c*1.1),e)}t.box(13,16,-5,5,8,9,s),t.box(17,18,4,6,5,6,a),t.box(17,18,-6,-4,5,6,a);for(const h of[-1,1]){for(const c of[-11,-7,-3,1,6])t.box(c,c+1,h>0?6:-7,h>0?7:-6,8,9,s);t.box(14,15,h>0?7:-8,h>0?8:-7,9,12,s)}if(t.box(-15,-14,-4,4,4,9,s),t.box(-15,-14,-3,3,5,8,e),t.box(-12,-8,-5,-1,11,12,d.hatch),t.box(-12,-8,1,5,11,12,d.hatch),t.paint((h,c,u,g)=>g!==e?g:gt(h,c,u)>.45?d.camo:gt(h+9,c-4,u)>.55?d.camo2:g),i.plate){for(const h of[-1,1])for(let c=-14;c<12;c+=3)t.box(c,c+2,h>0?7:-8,h>0?8:-7,6,10,l);for(let h=-6;h<6;h+=3)t.box(14,16,h,h+2,7,8,l)}if(i.cageAT)for(const h of[-1,1]){const c=h>0?10:-11;t.box(-15,15,c,c+1,10,11,o),t.box(-15,15,c,c+1,6,7,o);for(let u=-14;u<15;u+=3)t.box(u,u+1,c,c+1,7,10,o)}return t}function Nn(i){const t=new O(32,18,12,8,9),{base:e,metal:n,dark:r,lens:s}=d;if(t.box(-5,4,-4,4,0,3,e),t.box(4,6,-3,3,0,2,e),t.box(-1,2,-4,-1,3,6,e),t.box(2,3,-3,-2,4,5,s),t.box(3,5,-1,1,1,3,n),t.cylX(0,1.5,.7,5,19,n),t.box(18,20,-1,1,1,3,n),t.box(-4,3,4,6,1,4,d.pod),t.box(3,4,4,6,1,4,r),t.box(-5,-4,-4,-3,3,10,r),t.paint((a,o,l,h)=>h!==e?h:gt(a-1,o+2,l+10)>.45?d.camo:h),i.cageUAV){for(const[o,l]of[[5,5],[5,-6],[-6,5],[-6,-6]])t.box(o,o+1,l,l+1,2,7,d.net);for(const o of[-6,-1,5])t.box(o,o+1,-6,6,7,8,d.net);for(const o of[-6,0,5])t.box(-6,6,o,o+1,7,8,d.net)}return t}const xt={[d.track]:2763044,[d.tread]:4868160,[d.wheel]:7039580,[d.metal]:5592910,[d.dark]:2237215,[d.lens]:14172975,[d.rust]:7227954,[d.cage]:4869184,[d.net]:9145724,[d.light]:15984304,[d.tyre]:2500130,[d.hub]:5595210},An={player:{...xt,[d.base]:7306310,[d.camo]:11112792,[d.camo2]:4937778,[d.era]:6122043,[d.hatch]:6319421,[d.pod]:5200436,[d.wheel]:8227410},enemy:{...xt,[d.base]:9325108,[d.camo]:6048318,[d.camo2]:7157286,[d.era]:8011824,[d.hatch]:8208944,[d.pod]:5914934,[d.hub]:6965818,[d.wheel]:10116162},convoy:{...xt,[d.base]:11574386,[d.camo]:10719078,[d.camo2]:9403994,[d.era]:10259042,[d.hatch]:9272150,[d.pod]:8154188,[d.hub]:9075288,[d.wheel]:10259042},friend:{...xt,[d.base]:5204614,[d.camo]:8096406,[d.camo2]:3887208,[d.era]:4612218,[d.hatch]:4743804,[d.pod]:4149862,[d.hub]:4872810,[d.wheel]:6257816}};function Hn(){const i=new O(36,28,10,18,14),{base:t,track:e,tread:n,wheel:r,dark:s,rust:a}=d;for(const o of[-1,1]){const l=o>0?6:-10,h=o>0?9:-10;i.box(-15,15,l,l+4,0,4,e);for(let c=-14;c<14;c+=2)i.box(c,c+1,l,l+4,3,4,n);for(let c=-11.5;c<=12;c+=3.3)i.cylY(c,1.6,1.4,h,h+1,r);i.box(-15,15,o>0?6:-10,o>0?10:-6,4,5,t);for(let c=-14;c<14;c+=7)i.box(c,c+6,o>0?11:-12,o>0?12:-11,2,8,t)}i.box(-14,14,-6,6,1,4,t),i.box(14,16,-6,6,1,4,t),i.box(-14,12,-9,9,5,8,t),i.box(12,14,-9,9,4,7,t),i.box(13,14,2,5,6,7,s),i.box(13,14,-5,-3,6,7,s);for(let o=-6;o<=5;o+=2)i.box(-13,-6,o,o+1,7,8,s);return i.box(-16,-14,-3,3,3,5,a),i.paint((o,l,h,c)=>c===t&&Mt(o-5,l+3,h)>.8?d.camo:c),i}function In(){const i=new O(40,22,12,12,11),{base:t,metal:e,dark:n}=d;for(let r=-6;r<5;r++){const s=r<-3?5:6;i.box(r,r+1,-s,s,0,5,t)}i.box(5,7,-3,3,1,4,t),i.cylX(0,2.5,.9,7,24,e),i.box(23,25,-2,2,1,4,e),i.cylZ(-4.5,0,2,5,7,t),i.cylZ(-4.5,0,1,6,7,n);for(const r of[-1,1])i.box(-7,4,r>0?8:-9,r>0?9:-8,1,5,t);return i.box(-10,-9,-8,8,1,5,t),i.box(-8,-7,4,5,5,12,n),i.paint((r,s,a,o)=>o===t&&Mt(r,s-2,a+8)>.8?d.camo:o),i}function Ln(){const i=new O(38,28,14,19,14),{base:t,track:e,tread:n,wheel:r,dark:s,metal:a}=d;for(const o of[-1,1]){const l=o>0?8:-12,h=o>0?11:-12;i.box(-16,16,l,l+4,0,5,e);for(let c=-15;c<15;c+=2)i.box(c,c+1,l,l+4,4,5,n);for(const c of[-12,-6,0,6,12])i.cylY(c,2.5,2.4,h,h+1,r);i.cylX(o*10,8.5,1.3,-14,-8,a)}i.box(-15,15,-8,8,1,5,t),i.box(-15,14,-11,11,5,7,t),i.box(-15,-3,-10,10,7,8,t),i.box(-16,-15,-8,8,2,6,t),i.box(-3,7,-10,10,7,13,t);for(let o=7;o<18;o++){const l=Math.max(5,Math.round(13-(o-7)*.8));i.box(o,o+1,-10,10,4,l,t)}i.cylZ(0,6,1.8,13,15,t),i.cylZ(0,6,.9,14,15,s),i.box(15,16,3,6,6,7,s);for(let o=-6;o<=5;o+=2)i.box(-14,-5,o,o+1,7,8,s);return i.paint((o,l,h,c)=>c===t&&gt(o,l,h+3)>.55?d.camo:c),i}function Gn(){const i=new O(32,8,6,3,4);return i.cylX(0,2,2.2,-2,3,d.base),i.cylX(0,2,1,3,27,d.metal),i}function Bn(){const i=new O(38,22,12,19,11),{base:t,tyre:e,hub:n,dark:r,light:s}=d;for(const a of[-11,3,10])for(const o of[-1,1]){const l=o>0?7:-9;i.cylY(a,3,3,l,l+2,e),i.cylY(a,3,1.4,o>0?l+1:l,o>0?l+2:l+1,n)}i.box(-16,13,-5,5,2,4,t),i.box(-16,9,-7,7,4,10,t),i.box(-15,8,-6,6,10,11,t);for(let a=9;a<19;a++){const o=a-9;i.box(a,a+1,-7,7,3+Math.round(o*.2),Math.max(5,10-Math.round(o*.55)),t)}i.box(17,18,4,6,4,5,s),i.box(17,18,-6,-4,4,5,s);for(let a=4;a<10;a+=2)i.box(a,a+1,2,6,9,10,r);i.box(-16,-15,-4,4,4,9,r),i.box(-16,-15,-3,3,5,8,t);for(const a of[-1,1])i.box(-12,-4,a>0?7:-8,a>0?8:-7,7,9,d.hatch);return i.paint((a,o,l,h)=>h===t&&gt(a+4,o,l)>.5?d.camo:h),i}function Rn(){const i=new O(16,10,6,4,5);return i.box(-3,2,-2,3,0,2,d.base),i.box(-1,1,-3,-2,1,3,d.dark),i.box(2,11,0,1,1,2,d.metal),i.box(-1,1,2,4,0,2,d.hatch),i}function Wn(){const i=new O(30,16,10,15,8),{base:t,tyre:e,hub:n,dark:r,light:s}=d;for(const a of[8.5,-8])for(const o of[-1,1]){const l=o>0?5:-7;i.cylY(a,2.2,2.2,l,l+2,e),i.cylY(a,2.2,1,o>0?l+1:l,o>0?l+2:l+1,n)}i.box(-13,13,-5,5,2,3,r),i.box(7,13,-5,5,3,6,t),i.box(0,7,-5,5,3,9,t),i.box(1,6,-5,5,6,8,r),i.box(1,6,-4,4,6,8,t),i.box(6,7,-4,4,6,8,r),i.box(-13,0,-5,5,3,4,t);for(const a of[-1,1])i.box(-13,0,a>0?4:-5,a>0?5:-4,4,6,t);return i.box(-13,-12,-5,5,4,6,t),i.box(13,14,-5,5,3,5,r),i.box(13,14,3,5,5,6,s),i.box(13,14,-5,-3,5,6,s),i.paint((a,o,l,h)=>h===t&&gt(a*1.4,o*1.6,l)>.35?d.camo:h),i}function En(){const i=new O(16,8,8,6,4);i.box(-1,1,-1,1,0,3,d.metal);for(const t of[-1.4,1.4])i.cylX(t,4,1,-5,6,d.pod);return i.box(6,7,-2,2,3,5,d.dark),i.box(-2,0,2,3,3,5,d.dark),i}function Pn(){const i=new O(36,18,14,18,9),{base:t,tyre:e,hub:n,dark:r,light:s}=d;for(const a of[10,-5.5,-11])for(const o of[-1,1]){const l=o>0?5:-7;i.cylY(a,3,3,l,l+2,e),i.cylY(a,3,1.4,o>0?l+1:l,o>0?l+2:l+1,n)}i.box(-15,14,-3,3,2,3,r),i.box(-15,14,-4,4,3,4,r),i.box(8,15,-6,6,4,9,t);for(let a=15;a<18;a++)i.box(a,a+1,-5,5,4,9-(a-15),t);for(let a=5;a<8;a+=2)i.box(17,18,-4,4,a,a+1,r);i.box(16,17,4,6,7,8,s),i.box(16,17,-6,-4,7,8,s),i.box(-15,8,-6,6,4,12,t),i.box(-14,8,-5,5,12,13,t),i.box(7,8,-5,-1,9,11,r),i.box(7,8,1,5,9,11,r);for(const a of[-1,1]){const o=a>0?5:-6;for(const l of[3,-2,-8])i.box(l,l+3,o,o+1,9,11,r);i.box(-13,-6,a>0?6:-7,a>0?7:-6,5,7,d.hatch)}return i.box(-16,-15,-4,4,5,11,r),i.box(-16,-15,-3,3,6,10,t),i.cylX(0,8,2.6,-17,-16,e),i.cylX(0,8,1.2,-17,-16,n),i.box(-6,-2,-3,1,13,14,d.hatch),i}function zn(){const i=new O(14,8,5,3,4);return i.cylZ(0,0,2.2,0,1,d.dark),i.box(-1,2,-2,2,1,3,d.base),i.box(2,10,0,1,2,3,d.metal),i}const Rt={tank:{hull:_n,turret:Cn,x:1,z:9},apc:{hull:Mn,turret:Nn,x:-1,z:11},pz4:{hull:Hn,turret:In,x:1,z:8},patria:{hull:Bn,turret:Rn,x:3,z:11},su100:{hull:Ln,turret:Gn,x:12,z:8},hilux:{hull:Wn,turret:En,x:-6,z:4},mastiff:{hull:Pn,turret:zn,x:-2,z:13}},ye={tank:["tank","player"],apc:["apc","player"],"f-tank":["tank","friend"],"e-tank":["pz4","enemy"],"e-apc":["patria","enemy"],"e-td":["su100","enemy"],"e-tech":["hilux","enemy"],"a-truck":["mastiff","convoy"]},Wt=new Map,be=(i,t,e,n)=>`${i}|${t}|${e}|${e==="hull"?`${+n.plate}${+n.cageAT}`:`${+n.cageUAV}`}`;function Et(i,t,e,n){const r=be(i,t,e,n);let s=Wt.get(r);if(!s){const a=performance.now(),o=e==="hull"?Rt[i].hull(n):Rt[i].turret(n);[s]=vn([{m:o,pal:An[t]}]),performance.now()-a,Wt.set(r,s)}return s}function re(i,t,e){const n=performance.now(),r=Et(i,t,"hull",e),s=Et(i,t,"turret",e);return{hull:r,turret:s,ms:performance.now()-n}}const ht=[];let Ht=!1;const dt={plate:!1,cageAT:!1,cageUAV:!1};function Dn(i,t){ht.push([i,t,"hull",dt],[i,t,"turret",dt]);{for(const n of[!1,!0])for(const r of[!1,!0])ht.push([i,t,"hull",{plate:n,cageAT:r,cageUAV:!1}]);ht.push([i,t,"turret",{...dt,cageUAV:!0}]);for(const[,[n,r]]of Object.entries(ye))r!=="player"&&ht.push([n,r,"hull",dt],[n,r,"turret",dt])}if(Ht)return;Ht=!0;const e=()=>{let n=ht.shift();for(;n&&Wt.has(be(n[0],n[1],n[2],n[3]));)n=ht.shift();if(!n){Ht=!1;return}Et(n[0],n[1],n[2],n[3]),setTimeout(e,80)};setTimeout(e,300)}class Fn{constructor(t,e,n){this.kind=t,this.side=e,this.set=re(t,e,n),this.gearKey=`${+n.plate}${+n.cageAT}${+n.cageUAV}`,this.root.addChild(this.hull,this.turret),this.scale()}kind;side;root=new lt;hull=new Kt;turret=new Kt;set;gearKey="";scale(){const t=1/this.set.hull.s;this.hull.scale.set(t),this.turret.scale.set(t)}setGear(t){const e=`${+t.plate}${+t.cageAT}${+t.cageUAV}`;e!==this.gearKey&&(this.gearKey=e,this.set=re(this.kind,this.side,t),this.scale(),this.hull.texture=this.turret.texture)}set turretVisible(t){this.turret.visible=t}sync(t,e,n=0){const r=this.set.hull.textures[ie(this.set.hull,t)],s=this.set.turret.textures[ie(this.set.turret,e)];this.hull.texture!==r&&(this.hull.texture=r,this.hull.anchor.copyFrom(r.defaultAnchor)),this.turret.texture!==s&&(this.turret.texture=s,this.turret.anchor.copyFrom(s.defaultAnchor));const a=Rt[this.kind],o=n*1.5,l=Math.cos(t)*a.x-Math.cos(e)*o,h=Math.sin(t)*a.x-Math.sin(e)*o;this.turret.position.set(l,h*ut-a.z*Ct)}}const U=i=>-i*Ct/ut;class wi{constructor(t,e){this.spec=t;const[n,r]=t.size,s=t.colors;this.root.scale.y=ut;const a=t.flying?yn:0;this.shadow.ellipse(t.flying?0:1,t.flying?0:2,n*.62,r*.68).fill({color:0,alpha:t.flying?.22:.32}),this.root.addChild(this.shadow);const o=Le.voxel?ye[t.id]:void 0;if(o&&(e||o[1]!=="player")){this.vox=new Fn(o[0],o[1],{plate:!1,cageAT:!1,cageUAV:!1}),this.vox.root.scale.y=1/ut,e&&(this.heading=new K().moveTo(26,-8).lineTo(35,0).lineTo(26,8).stroke({width:3,color:15774268,alpha:.8,join:"round",cap:"round"}),this.root.addChild(this.heading),Dn(o[0],"player")),this.root.addChild(this.vox.root);return}if(t.id==="e-kami"){this.top.y=U(a);const c=new K;c.poly([11,0,-7,-10,-4,0,-7,10]).fill(s.top).poly([11,0,-4,0,-7,10]).fill({color:0,alpha:.25}),c.rect(-5,-1.6,15,3.2).fill(s.body).circle(10,0,2.4).fill(s.turret),c.rect(-8,-4,1.4,8).fill({color:13617856,alpha:.6}),this.rotor=c,this.top.addChild(c),this.root.addChild(this.top);return}if(t.id==="a-truck"||t.id==="e-tech"){const c=t.id==="e-tech";this.tracks.y=U(2),this.top.y=U(10),this.turret.y=U(15);const u=new K;for(const p of[-n/2+5,-n/2+11,n/2-6])u.rect(p-2.5,-r/2-1,5,3).rect(p-2.5,r/2-2,5,3);u.fill(1908249),this.tracks.addChild(u);const g=new K().rect(-n/2,-r/2+1,n,r-2).fill(s.body);g.rect(-n/2+1,-r/2+2,n*.62,r-4).fill(c?3813672:11906182);for(let p=-n/2+4;p<n*.1;p+=4)g.rect(p,-r/2+2,1,r-4);g.fill({color:0,alpha:.18}),g.rect(n/2-9,-r/2+2,8,r-4).fill(s.top).rect(n/2-3,-r/2+3,2,r-6).fill(2240827),g.rect(-n/2,-r/2+1,n,1.2).fill({color:16777215,alpha:.2}),this.top.addChild(g),c?(this.barrel.rect(-6,-3,14,6).fill(s.turret).rect(-6,-3,14,1.5).fill({color:16777215,alpha:.18}).rect(7,-2.5,2,5).fill(1908249),this.barrel.x=-n/2+8):(this.barrel.rect(0,-1,9,2).fill(s.turret).circle(0,0,2.4).fill(s.turret),this.barrel.x=n/2-6),this.turret.addChild(this.barrel),this.turret.x=0,this.root.addChild(this.tracks,this.top,this.turret),this.truck=!0;return}if(t.id==="e-inf"){this.top.y=U(6),this.turret.y=U(8),this.top.addChild(new K().ellipse(0,0,3.4,4.6).fill(s.body).circle(0,0,2.6).fill(s.top).circle(-.6,-.6,1).fill({color:16777215,alpha:.2})),this.barrel.rect(-4,1.5,12,2.6).fill(s.turret).rect(7,1.1,2.2,3.4).fill(2763300),this.turret.addChild(this.barrel),this.root.addChild(this.top,this.turret),this.infantry=!0;return}if(t.flying){this.top.y=U(a);const c=new K;c.moveTo(-8,-8).lineTo(8,8).moveTo(8,-8).lineTo(-8,8).stroke({width:2,color:at(s.body,.8)});for(const[u,g]of[[-8,-8],[8,-8],[8,8],[-8,8]])c.circle(u,g,5).fill({color:s.top,alpha:.35}).circle(u,g,1.4).fill(s.body);c.rect(-5,-4,10,8).fill(s.body).rect(-5,-4,10,2).fill({color:16777215,alpha:.15}),c.circle(4,0,1.8).fill(s.turret),this.rotor=c,this.top.addChild(c),this.root.addChild(this.top);return}this.tracks.y=U(2),this.side.y=U(5),this.top.y=U(9),this.turret.y=U(13);const l=new K().rect(-n/2-1,-r/2-1,n+2,r+2).fill(1908249);for(const c of[-r/2-1,r/2-4]){for(let u=-n/2;u<n/2;u+=3)l.rect(u,c,1.4,5);l.fill({color:3816243,alpha:.9})}this.tracks.addChild(l),this.side.addChild(new K().rect(-n/2+2,-r/2+3,n-4,r-6).fill(s.body));const h=new K().rect(-n/2+2,-r/2+3,n-4,r-6).fill(s.top);h.rect(-n/2+2,-r/2+3,n-4,1.4).fill({color:16777215,alpha:.18}).rect(-n/2+2,r/2-4.4,n-4,1.4).fill({color:0,alpha:.25});for(let c=0;c<4;c++)h.rect(-n/2+4+c*2.2,-r/2+6,1,r-12);if(h.fill({color:0,alpha:.3}),h.rect(n/2-3,-r/2+4,1.6,2).rect(n/2-3,r/2-6,1.6,2).fill(15984304),e&&h.poly([n/2+2,0,n/2-8,-7,n/2-8,7]).fill(15774268),this.top.addChild(h),t.fixedGun!==void 0)this.barrel.rect(0,-2.6,28,5.2).fill(s.turret).rect(24,-3.4,5,6.8).fill(at(s.turret,.7)).rect(-3,-5,6,10).fill(at(s.turret,.85)),this.barrel.x=n/2-10,this.turret.addChild(this.barrel);else{const u=new K().poly([-8,-5,-5,-8,7,-8,10,-5,10,5,7,8,-5,8,-8,5]).fill(s.turret);u.rect(-8,8-3.5,18,3.5).fill({color:0,alpha:.22}).rect(-6,-8,14,1.4).fill({color:16777215,alpha:.2}),u.circle(-2.5,-2,2.6).fill(at(s.turret,.72)).circle(-2.5,-2,1.2).fill(at(s.turret,1.15)),u.rect(2,3,3,2).fill(2240827),this.turret.addChild(u),this.barrel.rect(0,-2.2,22,4.4).fill(s.turret).rect(0,-2.2,22,1.2).fill({color:16777215,alpha:.15}).rect(19,-3,4,6).fill(at(s.turret,.7)),this.barrel.x=6,this.turret.addChild(this.barrel)}e&&(this.heading=new K().moveTo(26,-8).lineTo(35,0).lineTo(26,8).stroke({width:3,color:15774268,alpha:.8,join:"round",cap:"round"}),this.root.addChildAt(this.heading,1)),this.root.addChild(this.tracks,this.side,this.top,this.turret)}spec;root=new lt;shadow=new K;tracks=new lt;side=new lt;top=new lt;turret=new lt;barrel=new K;heading;rotor;infantry=!1;truck=!1;vox;sync(t,e,n,r,s,a,o,l){if(this.root.x=t,this.root.y=e*ut-(this.spec.flying?0:n*Ct),this.root.zIndex=e+(n>0&&!this.spec.flying?ee:0),this.spec.flying){this.root.zIndex=e+1e5,this.rotor&&(this.rotor.rotation=r+Math.sin(l*40)*.05),this.top.y=U(n+Math.sin(l*3+t)*2);return}if(this.vox){this.vox.sync(r,s,a),this.heading&&(this.heading.rotation=r,this.heading.visible=!o),o&&(this.vox.turretVisible=!1,this.root.tint=2894117);return}if(this.infantry){this.turret.rotation=s,this.root.zIndex=e+ee;return}if(this.truck){this.tracks.rotation=this.top.rotation=r,this.turret.rotation=s,o&&(this.root.tint=2894117);return}this.tracks.rotation=this.side.rotation=this.top.rotation=r,this.heading&&(this.heading.rotation=r,this.heading.visible=!o),this.turret.rotation=this.spec.fixedGun!==void 0?r:s,this.barrel.x=(this.spec.fixedGun!==void 0?this.spec.size[0]/2-10:6)-a*4,this.spec.fixedGun!==void 0&&(this.barrel.rotation=s-r),o&&(this.turret.visible=!1,this.root.tint=2894117)}get voxel(){return!!this.vox}setGear(t){this.vox?.setGear(t)}destroy(){this.root.destroy({children:!0})}}export{xi as A,pi as B,ee as C,G as D,si as E,oi as F,ui as G,hi as I,ut as K,ii as L,Qn as M,ri as P,ci as R,Yn as T,wi as U,Fn as V,Ct as Z,se as _,ei as a,Jn as b,mi as c,Ti as d,bn as e,jn as f,di as g,yn as h,ai as i,Zn as j,Tn as k,Si as l,ti as m,ni as n,fi as o,bi as p,gi as q,yi as r,at as s,Y as t,li as u,re as v,ye as w,qn as x,xn as y,Dn as z};
