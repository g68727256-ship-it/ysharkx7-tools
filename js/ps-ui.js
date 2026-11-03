/* YSHARKX7 Pack Studio - interface. Depende de script.js (toast, copiar, baixar) e ps-core.js */
(function(){"use strict";
const K=PSCore,te=new TextEncoder(),td=new TextDecoder(),$=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB";
const slug=s=>(s||"pack").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")||"pack";
let P=null,sel=null,tm=null,dirty=false,urlPrev=null,E=null,CR=null,ICON=null;
/* ---------- armazenamento (IndexedDB) ---------- */
const dbp=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error("sem IndexedDB"));const q=indexedDB.open("y7_packstudio",1);q.onupgradeneeded=()=>{const d=q.result;d.createObjectStore("projects",{keyPath:"id"});d.createObjectStore("meta",{keyPath:"id"})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
dbp.catch(()=>{});
const setSt=(m,e)=>{const s=$("st");s.textContent=m;s.style.color=e?"var(--er)":""};
async function save(){if(!P)return;setSt("Salvando…");try{P.updated=Date.now();const d=await dbp;await new Promise((res,rej)=>{const t=d.transaction(["projects","meta"],"readwrite");t.objectStore("projects").put(P);t.objectStore("meta").put({id:P.id,name:P.name,updated:P.updated,count:Object.keys(P.files).length});t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)});dirty=false;setSt("Salvo neste navegador ✔")}catch(e){setSt("Não foi possível salvar: "+(e&&e.name==="QuotaExceededError"?"espaço do navegador cheio. Exporte o ZIP.":"armazenamento indisponível. Exporte o ZIP para não perder o trabalho."),1)}}
function touch(){dirty=true;setSt("Alterações não salvas…");clearTimeout(tm);tm=setTimeout(save,500)}
addEventListener("pagehide",()=>{if(dirty)save()});document.addEventListener("visibilitychange",()=>{if(document.hidden&&dirty)save()});
addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
const idb=async(st,fn)=>{const d=await dbp;return new Promise((res,rej)=>{const q=fn(d.transaction(st,"readwrite").objectStore(st));q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})};
async function recents(){try{const all=await idb("meta",s=>s.getAll());all.sort((a,b)=>b.updated-a.updated);$("rec").innerHTML=all.length?all.map(m=>`<div class="ri"><span><b>${esc(m.name)}</b><br><small>${m.count} arquivos · ${new Date(m.updated).toLocaleString("pt-BR")}</small></span><span><button class="btn sm" data-o="${m.id}">Abrir</button> <button class="btn sec sm" data-x="${m.id}">Excluir</button></span></div>`).join(""):"<p class='note'>Nenhum projeto salvo ainda.</p>"}catch(e){$("rec").innerHTML="<p class='note'>O armazenamento local não está disponível neste navegador (modo privado?). Você pode editar e exportar, mas o projeto não será salvo.</p>"}}
$("rec").onclick=async e=>{const o=e.target.dataset.o,x=e.target.dataset.x;try{if(o){const p=await idb("projects",s=>s.get(o));if(p)setProject(p)}else if(x&&confirm("Excluir este projeto salvo? Não dá para desfazer.")){await idb("projects",s=>s.delete(x));await idb("meta",s=>s.delete(x));if(P&&P.id===x){P=null;$("pname").textContent="Nenhum projeto aberto"}recents()}}catch(err){toast("Erro ao acessar o armazenamento.",1)}};
/* ---------- projeto ---------- */
const need=()=>{if(!P){toast("Abra ou crie um projeto na aba Início.",1);return false}return true};
function setProject(p){P=p;if(!P.dirs)P.dirs=[];sel=null;E=null;$("pname").textContent="Projeto: "+P.name;go("arquivos")}
function mkProject(name,files,dirs){return{id:"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:name||"Meu pack",created:Date.now(),updated:Date.now(),files,dirs:dirs||[]}}
const manifestBytes=(name,desc)=>te.encode(JSON.stringify(K.buildManifest({name,desc,author:"",uh:K.uuid(),um:K.uuid(),ver:[1,0,0],min:[1,20,0],type:"resources"}),null,2));
$("tpls").innerHTML=K.TEMPLATES.map((t,i)=>`<button class="card tpl" data-t="${i}"><h3>${esc(t.n)}</h3><p>${esc(t.d)}</p></button>`).join("");
$("tpls").onclick=async e=>{const b=e.target.closest("[data-t]");if(!b)return;const t=K.TEMPLATES[b.dataset.t],name=$("pn").value.trim()||t.n;const p=mkProject(name,{"manifest.json":manifestBytes(name,t.d)},t.dirs.slice());setProject(p);await save();toast("Projeto criado.")};
$("pimp").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;if(typeof DecompressionStream==="undefined"){toast("Este navegador não suporta importar ZIP. Atualize o Chrome.",1);return}
 setSt("Importando…");try{const files=K.stripRoot(await K.readZip(await f.arrayBuffer()));const n=Object.keys(files).length;if(!n)throw new Error("O ZIP não contém arquivos.");const p=mkProject(f.name.replace(/\.(zip|mcpack)$/i,""),files);setProject(p);await save();toast("Importados "+n+" arquivos.")}catch(err){setSt("");toast("Erro ao importar: "+err.message,1)}};
/* ---------- navegação ---------- */
const R={inicio:recents,arquivos:renderFiles,editor:()=>{},manifest:loadMf,conversor:()=>{},validador:()=>{},extras:xInit,exportar:()=>{}};
function go(n){document.querySelectorAll(".pp").forEach(s=>s.classList.toggle("on",s.id==="p-"+n));document.querySelectorAll("#side button").forEach(b=>b.classList.toggle("on",b.dataset.p===n));R[n]&&R[n]();scrollTo({top:0})}
$("side").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.p)};
/* ---------- arquivos ---------- */
$("ftarget").innerHTML=K.CATS.map(c=>`<option value="${c[1]}">${esc(c[0])}</option>`).join("");
const isDir=p=>!P.files[p];
function paths(){const f=Object.keys(P.files),s=new Set(P.dirs||[]);f.forEach(p=>{const a=p.split("/");for(let i=1;i<a.length;i++)s.add(a.slice(0,i).join("/"))});return[...s].map(p=>({p,d:1})).concat(f.map(p=>({p,d:0}))).sort((a,b)=>a.p<b.p?-1:a.p>b.p?1:0)}
function renderFiles(){if(!P){$("fl").innerHTML="<p class='note'>Abra ou crie um projeto na aba Início.</p>";$("fd").innerHTML="";return}
 const q=$("fq").value.trim().toLowerCase();let rows=paths().filter(r=>!q||r.p.toLowerCase().includes(q));const cut=rows.length>1500;rows=rows.slice(0,1500);
 $("fl").innerHTML=(rows.map(r=>{const a=r.p.split("/");return`<div class="fr${r.p===sel?" on":""}" data-p="${esc(r.p)}" style="padding-left:${8+(a.length-1)*14}px">${r.d?"📁":"📄"} ${esc(a[a.length-1])}</div>`}).join("")||"<p class='note'>Projeto vazio. Adicione arquivos ou crie uma pasta.</p>")+(cut?"<p class='note'>Mostrando 1500 itens. Use o filtro.</p>":"");detail()}
$("fq").oninput=()=>P&&renderFiles();
$("fl").onclick=e=>{const r=e.target.closest(".fr");if(r){sel=r.dataset.p;renderFiles()}};
function detail(){const D=$("fd");if(urlPrev){URL.revokeObjectURL(urlPrev);urlPrev=null}if(!P||!sel){D.innerHTML="<p class='note'>Selecione um arquivo ou pasta na lista.</p>";return}
 const f=P.files[sel];if(!f){const n=Object.keys(P.files).filter(p=>p.startsWith(sel+"/")).length;D.innerHTML=`<b>📁 ${esc(sel)}</b><p>${n} arquivo(s)</p><div class="row"><button class="btn sec sm" data-a="ren">Renomear pasta</button><button class="btn sec sm" data-a="del">Excluir pasta</button></div>`;return}
 const png=/\.png$/i.test(sel);let info=fmt(f.length),img="";if(png){const s=K.pngSize(f);if(s)info+=` · ${s[0]}×${s[1]} px`;urlPrev=URL.createObjectURL(new Blob([f],{type:"image/png"}));img=`<div class="pv"><img src="${urlPrev}" alt="Prévia" style="image-rendering:pixelated"></div>`}
 D.innerHTML=`<b>📄 ${esc(sel)}</b><p>${info}</p>${img}<div class="row"><button class="btn sec sm" data-a="ren">Renomear</button><button class="btn sec sm" data-a="del">Excluir</button><button class="btn sec sm" data-a="rep">Substituir</button><button class="btn sec sm" data-a="dl">Baixar</button>${png?'<button class="btn sm" data-a="edit">Editar imagem</button>':""}</div>`}
$("fd").onclick=async e=>{const a=e.target.dataset.a;if(!a||!P||!sel)return;
 if(a==="rep"){$("frep").click();return}
 if(a==="dl"){baixar(sel.split("/").pop(),new Blob([P.files[sel]]),"application/octet-stream");return}
 if(a==="edit"){await openEditor(P.files[sel],sel);return}
 if(a==="del"){if(!confirm("Excluir "+sel+"? Não dá para desfazer."))return;if(P.files[sel])delete P.files[sel];else{const pre=sel+"/";Object.keys(P.files).forEach(k=>k.startsWith(pre)&&delete P.files[k]);P.dirs=P.dirs.filter(d=>d!==sel&&!d.startsWith(pre))}sel=null;touch();renderFiles();return}
 if(a==="ren"){const np=prompt("Novo caminho:",sel);if(np===null)return;const c=K.cleanPath(np);if(!c){toast("Caminho inválido.",1);return}if(c===sel)return;
  if(P.files[sel]){if(P.files[c]){toast("Já existe um arquivo com esse nome.",1);return}P.files[c]=P.files[sel];delete P.files[sel]}
  else{const pre=sel+"/";if(c.startsWith(pre)||Object.keys(P.files).some(k=>k.startsWith(c+"/"))){toast("Destino inválido ou já existente.",1);return}Object.keys(P.files).filter(k=>k.startsWith(pre)).forEach(k=>{P.files[c+"/"+k.slice(pre.length)]=P.files[k];delete P.files[k]});P.dirs=P.dirs.map(d=>d===sel||d.startsWith(pre)?c+d.slice(sel.length):d)}
  sel=c;touch();renderFiles()}};
$("frep").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f||!P||!sel||!P.files[sel])return;P.files[sel]=new Uint8Array(await f.arrayBuffer());touch();renderFiles();toast("Arquivo substituído.")};
$("fadd").onchange=async e=>{if(!need())return;const t=$("ftarget").value;let n=0;for(const f of e.target.files){P.files[t+f.name.replace(/[\\/]/g,"_")]=new Uint8Array(await f.arrayBuffer());n++}e.target.value="";if(n){touch();renderFiles();toast(n+" arquivo(s) adicionado(s). Arquivos com mesmo nome foram substituídos.")}};
$("fdir").onclick=()=>{if(!need())return;const n=prompt("Nome da nova pasta (ex.: textures/items):");if(n===null)return;const c=K.cleanPath(n);if(!c){toast("Nome inválido.",1);return}if(P.files[c]){toast("Já existe um arquivo com esse nome.",1);return}P.dirs.push(c);touch();sel=c;renderFiles()};
/* ---------- editor de imagem ---------- */
const mk=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c};
async function openEditor(u8,path){try{await setImg(await createImageBitmap(new Blob([u8],{type:"image/png"})),path);go("editor")}catch(e){toast("Não foi possível abrir esta imagem.",1)}}
async function setImg(bmp,path){if(bmp.width>4096||bmp.height>4096){toast("Imagem maior que 4096 px não é suportada.",1);return}const W=mk(bmp.width,bmp.height);W.getContext("2d").drawImage(bmp,0,0);const O=mk(W.width,W.height);O.getContext("2d").drawImage(W,0,0);E={path,W,O,H:[]};$("ezoom").value=Math.max(1,Math.min(32,Math.floor(256/Math.max(W.width,W.height))));drawE()}
function drawE(f){$("edwrap").hidden=!E;if(!E)return;const z=+$("ezoom").value;
 for(const[id,s]of[["ecv",E.W],["ecvb",E.O]]){const c=$(id);c.width=s.width;c.height=s.height;const x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);x.drawImage(s,0,0);c.style.width=s.width*z+"px";c.style.height=s.height*z+"px"}
 ["gw1","gw2"].forEach(i=>{const g=$(i);g.style.setProperty("--z",z+"px");g.classList.toggle("grid",$("egrid").checked&&z>=6)});$("bwrap").hidden=!$("ecmp").checked;
 $("einfo").textContent=(E.path||"Imagem aberta do aparelho")+" — "+E.W.width+"×"+E.W.height+" px (original: "+E.O.width+"×"+E.O.height+")";
 if(f!==false){$("rw").value=E.W.width;$("rh").value=E.W.height;$("cw").value=E.W.width;$("ch").value=E.W.height;$("cx").value=0;$("cy").value=0}}
["ezoom","egrid","ecmp"].forEach(i=>$(i).oninput=()=>E&&drawE(false));
$("eopen").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;try{await setImg(await createImageBitmap(f),null)}catch(err){toast("Não foi possível abrir esta imagem.",1)}};
const push=()=>{E.H.push(E.W);if(E.H.length>15)E.H.shift()};
$("rpre").onchange=()=>{if(!E||!$("rpre").value)return;$("rw").value=$("rh").value=$("rpre").value;$("rpre").value=""};
$("rw").oninput=()=>{if(E&&$("rkeep").checked&&+$("rw").value>0)$("rh").value=Math.max(1,Math.round($("rw").value*E.W.height/E.W.width))};
$("rh").oninput=()=>{if(E&&$("rkeep").checked&&+$("rh").value>0)$("rw").value=Math.max(1,Math.round($("rh").value*E.W.width/E.W.height))};
$("eres").onclick=()=>{if(!E)return;const w=Math.round(+$("rw").value),h=Math.round(+$("rh").value);if(!(w>=1&&h>=1&&w<=4096&&h<=4096)){toast("Tamanho inválido (1 a 4096).",1);return}push();const c=mk(w,h),x=c.getContext("2d");x.imageSmoothingEnabled=$("rmode").value==="smooth";x.drawImage(E.W,0,0,w,h);E.W=c;drawE();toast("Redimensionada para "+w+"×"+h+".")};
$("ecrop").onclick=()=>{if(!E)return;const x=Math.round(+$("cx").value),y=Math.round(+$("cy").value),w=Math.round(+$("cw").value),h=Math.round(+$("ch").value);if(!(x>=0&&y>=0&&w>=1&&h>=1&&x+w<=E.W.width&&y+h<=E.W.height)){toast("A área de recorte precisa caber dentro da imagem.",1);return}push();const c=mk(w,h);c.getContext("2d").drawImage(E.W,x,y,w,h,0,0,w,h);E.W=c;drawE();toast("Recortada.")};
$("eundo").onclick=()=>{if(!E||!E.H.length){toast("Nada para desfazer.",1);return}E.W=E.H.pop();drawE()};
$("ereset").onclick=()=>{if(!E)return;push();const c=mk(E.O.width,E.O.height);c.getContext("2d").drawImage(E.O,0,0);E.W=c;drawE()};
const ePng=()=>new Promise(r=>E.W.toBlob(async b=>r(new Uint8Array(await b.arrayBuffer())),"image/png"));
$("esave").onclick=async()=>{if(!E||!need())return;let p=E.path||prompt("Salvar no pacote como (ex.: textures/items/minha_textura.png):","textures/items/textura.png");if(!p)return;p=K.cleanPath(p);if(!p||!/\.png$/i.test(p)){toast("Use um caminho terminando em .png.",1);return}P.files[p]=await ePng();E.path=p;touch();drawE();toast("Salvo no projeto: "+p)};
$("edl").onclick=async()=>{if(!E)return;baixar(((E.path||"textura").split("/").pop()).replace(/\.png$/i,"")+"_editada.png",new Blob([await ePng()]),"image/png")};
/* ---------- manifest ---------- */
let mfOk="";
function mfObj(){const name=$("mn").value.trim();if(!name)throw new Error("Informe o nome do pacote.");const v=K.parseVer($("mv").value,"A versão do pacote"),m=K.parseVer($("mm").value,"A versão mínima do Minecraft"),h=K.parseUuid($("uh").value,"O UUID do cabeçalho"),u=K.parseUuid($("um").value,"O UUID do módulo");if(h===u)throw new Error("O UUID do cabeçalho e o do módulo devem ser diferentes.");
 const o={name,desc:$("md").value.trim(),author:$("ma").value.trim(),uh:h,um:u,ver:v,min:m,type:$("mt").value};if($("mdep").value.trim()){o.dep=K.parseUuid($("mdep").value,"O UUID da dependência");if(o.dep===h)throw new Error("A dependência não pode ser o próprio pack.");o.depv=K.parseVer($("mdv").value,"A versão da dependência")}return K.buildManifest(o)}
function mshow(){try{mfOk=JSON.stringify(mfObj(),null,2);JSON.parse(mfOk);$("mo").textContent=mfOk;$("mo").style.color="";return true}catch(e){mfOk="";$("mo").textContent="Erro: "+e.message;$("mo").style.color="var(--er)";return false}}
["mn","md","ma","mt","mv","mm","uh","um","mdep","mdv"].forEach(i=>$(i).addEventListener("input",mshow));
function loadMf(){$("mico").textContent=P?(P.files["pack_icon.png"]?"Ícone pack_icon.png encontrado no projeto.":"Sem pack_icon.png no projeto. Crie um em Extras."):"Abra um projeto para aplicar o manifest nele.";
 const raw=P&&P.files["manifest.json"];let j=null;if(raw)try{j=JSON.parse(td.decode(raw))}catch(e){}
 if(j&&j.header){const h=j.header,m=(j.modules||[])[0]||{},d=(j.dependencies||[])[0];$("mn").value=h.name||"";$("md").value=h.description||"";$("ma").value=(j.metadata&&j.metadata.authors&&j.metadata.authors[0])||"";$("mt").value=m.type==="data"?"data":"resources";$("mv").value=(h.version||[1,0,0]).join(".");$("mm").value=(h.min_engine_version||[1,20,0]).join(".");$("uh").value=h.uuid||K.uuid();$("um").value=m.uuid||K.uuid();$("mdep").value=d?d.uuid:"";$("mdv").value=d?(d.version||[1,0,0]).join("."):"1.0.0"}
 else{if(!$("mn").value)$("mn").value=P?P.name:"Meu Resource Pack";if(!$("md").value)$("md").value="Criado com YSHARKX7 Pack Studio";if(!$("uh").value){$("uh").value=K.uuid();$("um").value=K.uuid()}}mshow()}
$("mnew").onclick=()=>{$("uh").value=K.uuid();$("um").value=K.uuid();mshow()};
$("mapp").onclick=()=>{if(!need())return;if(!mshow()){toast("Corrija os campos antes de aplicar.",1);return}P.files["manifest.json"]=te.encode(mfOk);touch();toast("manifest.json salvo no projeto.")};
$("mload").onclick=()=>{if(need())loadMf()};
$("mcp").onclick=()=>mshow()?copiar(mfOk):toast("Corrija os campos antes de copiar.",1);
$("mdl").onclick=()=>mshow()?baixar("manifest.json",mfOk):toast("Corrija os campos antes de baixar.",1);
/* ---------- conversor ---------- */
$("cana").onclick=()=>{if(!need())return;if(!P.files["pack.mcmeta"]&&!Object.keys(P.files).some(k=>k.startsWith("assets/"))){toast("Este projeto não parece ser um pacote Java (sem pack.mcmeta nem assets/).",1);return}CR=K.analyzeJava(P.files);$("crep").textContent=K.report(CR,P.name)};
$("ccre").onclick=async()=>{if(!need())return;let min;try{min=K.parseVer($("cmin").value,"A versão mínima")}catch(e){toast(e.message,1);return}const r=K.analyzeJava(P.files);if(!r.ok.length&&!r.rev.length){toast("Nenhuma textura Java encontrada neste projeto.",1);return}
 CR=r;$("crep").textContent=K.report(r,P.name);const out=K.applyConversion(P.files,r);out["manifest.json"]=te.encode(JSON.stringify(K.buildManifest({name:P.name,desc:"Convertido com YSHARKX7 Pack Studio",author:"",uh:K.uuid(),um:K.uuid(),ver:[1,0,0],min,type:"resources"}),null,2));
 const p=mkProject(P.name+" (Bedrock)",out);await save();setProject(p);await save();toast("Projeto Bedrock criado. O original foi mantido.")};
$("cdl").onclick=()=>{if(!CR){toast("Clique em Analisar primeiro.",1);return}baixar("relatorio_conversao.txt",K.report(CR,P?P.name:"projeto"),"text/plain")};
/* ---------- validador e exportação ---------- */
const kind=()=>{let k=$("vt").value;return k==="auto"?(P.files["manifest.json"]?"bedrock":P.files["pack.mcmeta"]?"java":"bedrock"):k};
const showRes=(el,res)=>{const n={erro:0,aviso:0,ok:0};res.forEach(x=>n[x.l]++);el.innerHTML=`<div><b>${n.erro} erro(s), ${n.aviso} aviso(s)</b></div>`+res.map(x=>`<div class="${x.l}">${x.l==="ok"?"✔":x.l==="aviso"?"⚠️":"✖"} ${esc(x.m)}</div>`).join("")};
$("vrun").onclick=()=>{if(need())showRes($("vr"),K.validate(P.files,kind()))};
async function exp(ext){if(!need())return;if(!Object.keys(P.files).length){toast("O projeto está vazio.",1);return}const res=K.validate(P.files,"bedrock");showRes($("ev"),res);
 if(ext==="mcpack"&&res.some(x=>x.l==="erro")&&!confirm("O pacote tem erros de validação Bedrock. Exportar mesmo assim?"))return;
 try{setSt("Gerando arquivo…");baixar(slug(P.name)+"."+ext,await K.writeZip(P.files),"application/zip");setSt(dirty?"Alterações não salvas…":"Salvo neste navegador ✔")}catch(e){toast("Erro ao exportar: "+e.message,1)}}
$("ezip").onclick=()=>exp("zip");$("empk").onclick=()=>exp("mcpack");
/* ---------- extras ---------- */
function mcmeta(){return JSON.stringify({pack:{pack_format:Math.round(+$("xf").value)||1,description:$("xd").value}},null,2)}
function xInit(){if(!$("xu").value)$("xu").value=K.uuid();$("xo").textContent=mcmeta()}
$("xun").onclick=()=>$("xu").value=K.uuid();$("xuc").onclick=()=>copiar($("xu").value);
["xf","xd"].forEach(i=>$(i).oninput=xInit);
$("xmcp").onclick=()=>copiar(mcmeta());$("xmdl").onclick=()=>baixar("pack.mcmeta",mcmeta());
$("xmadd").onclick=()=>{if(!need())return;P.files["pack.mcmeta"]=te.encode(mcmeta());touch();toast("pack.mcmeta salvo no projeto.")};
$("xi").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;try{const b=await createImageBitmap(f),s=Math.min(b.width,b.height),c=$("xic");c.width=c.height=256;c.style.display="block";c.style.width="128px";const x=c.getContext("2d");x.clearRect(0,0,256,256);x.drawImage(b,(b.width-s)/2,(b.height-s)/2,s,s,0,0,256,256);ICON=c}catch(err){toast("Não foi possível abrir esta imagem.",1)}};
$("xiapp").onclick=()=>{if(!need())return;if(!ICON){toast("Escolha uma imagem primeiro.",1);return}ICON.toBlob(async b=>{P.files[$("xit").value]=new Uint8Array(await b.arrayBuffer());touch();toast($("xit").value+" salvo no projeto (256×256, recorte central).")},"image/png")};
$("xorg").onclick=()=>{if(!need())return;const ch=[];Object.keys(P.files).forEach(k=>{const n=k.toLowerCase().replace(/\s+/g,"_");if(n!==k)ch.push([k,n])});if(!ch.length){toast("Todos os nomes já estão no padrão.");return}
 if(!confirm(ch.length+" arquivo(s) serão renomeados (minúsculas e _ no lugar de espaços). Continuar?"))return;let skip=0;ch.forEach(([a,b])=>{if(P.files[b]){skip++;return}P.files[b]=P.files[a];delete P.files[a]});sel=null;touch();toast((ch.length-skip)+" renomeado(s)"+(skip?", "+skip+" ignorado(s) por conflito de nome.":"."))};
/* ---------- início ---------- */
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
recents();xInit();
})();
