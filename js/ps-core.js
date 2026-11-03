/* YSHARKX7 Pack Studio - núcleo (ZIP, manifest, validação, conversão). Sem dependências. */
(function(g){
const te=new TextEncoder(),td=new TextDecoder();
const CT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const cleanPath=p=>{const s=String(p).replace(/\\/g,"/").split("/").filter(x=>x&&x!==".");return s.some(x=>x==="..")||!s.length?null:s.join("/")};
const pipe=async(u8,S)=>new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(S)).arrayBuffer());
const UR=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function uuid(){if(g.crypto&&crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;return[...b].map(x=>x.toString(16).padStart(2,"0")).join("").replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,"$1-$2-$3-$4-$5")}
function parseVer(s,n){const p=String(s).trim().split(".");if(p.length!==3||p.some(x=>!/^\d{1,6}$/.test(x)))throw new Error(n+" deve ter o formato 1.0.0 (três números inteiros).");return p.map(Number)}
function parseUuid(v,n){v=String(v).trim().toLowerCase();if(!UR.test(v))throw new Error(n+" não é um UUID válido.");return v}
function buildManifest(o){const m={format_version:2,header:{name:o.name,description:o.desc||"",uuid:o.uh,version:o.ver,min_engine_version:o.min},modules:[{type:o.type,uuid:o.um,version:o.ver}]};
 if(o.author)m.metadata={authors:[o.author]};if(o.dep)m.dependencies=[{uuid:o.dep,version:o.depv}];return m}
async function readZip(buf,max){max=max||300e6;const u=new Uint8Array(buf),dv=new DataView(buf);let e=-1;
 for(let i=u.length-22;i>=Math.max(0,u.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break}
 if(e<0)throw new Error("Arquivo ZIP inválido ou corrompido.");
 const n=dv.getUint16(e+10,true),cd=dv.getUint32(e+16,true);if(n===0xFFFF||cd===0xFFFFFFFF)throw new Error("ZIP64 não é suportado.");
 const out={};let p=cd,tot=0;
 for(let i=0;i<n;i++){if(dv.getUint32(p,true)!==0x02014b50)throw new Error("Índice do ZIP corrompido.");
  const fl=dv.getUint16(p+8,true),m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),us=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
  const name=td.decode(u.subarray(p+46,p+46+nl));p+=46+nl+el+cl;
  if(fl&1)throw new Error("ZIP protegido por senha não é suportado.");
  if(name.endsWith("/")||/(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/.test(name))continue;
  const cp=cleanPath(name);if(!cp)continue;tot+=us;if(tot>max)throw new Error("O pacote é grande demais para o navegador (limite de "+Math.round(max/1e6)+" MB).");
  if(dv.getUint32(lo,true)!==0x04034b50)throw new Error("Entrada do ZIP corrompida: "+name);
  const ds=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),raw=u.subarray(ds,ds+cs);
  if(us===0)out[cp]=new Uint8Array(0);else if(m===0)out[cp]=raw.slice();else if(m===8)out[cp]=await pipe(raw,new DecompressionStream("deflate-raw"));
  else throw new Error("Método de compressão não suportado em "+name);}
 return out}
function stripRoot(f){const k=Object.keys(f);if(!k.length||f["manifest.json"]||f["pack.mcmeta"])return f;const t=new Set(k.map(x=>x.split("/")[0]));
 if(t.size!==1||k.some(x=>!x.includes("/")))return f;const r=[...t][0]+"/",o={};k.forEach(x=>o[x.slice(r.length)]=f[x]);return o}
async function writeZip(files){const parts=[],cd=[];let off=0;const d=new Date(),dt=(d.getHours()<<11|d.getMinutes()<<5|d.getSeconds()>>1)&0xFFFF,dd=((d.getFullYear()-1980)<<9|(d.getMonth()+1)<<5|d.getDate())&0xFFFF;
 for(const [name,data] of Object.entries(files)){const nb=te.encode(name),crc=crc32(data);let c=data,m=0;
  if(data.length>64&&!/\.(png|ogg|jpe?g|zip)$/i.test(name)&&typeof CompressionStream!=="undefined"){try{const z=await pipe(data,new CompressionStream("deflate-raw"));if(z.length<data.length){c=z;m=8}}catch(e){}}
  const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,m,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);h.setUint32(14,crc,true);h.setUint32(18,c.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nb.length,true);
  const q=new DataView(new ArrayBuffer(46));q.setUint32(0,0x02014b50,true);q.setUint16(4,20,true);q.setUint16(6,20,true);q.setUint16(8,0x0800,true);q.setUint16(10,m,true);q.setUint16(12,dt,true);q.setUint16(14,dd,true);q.setUint32(16,crc,true);q.setUint32(20,c.length,true);q.setUint32(24,data.length,true);q.setUint16(28,nb.length,true);q.setUint32(42,off,true);
  parts.push(h.buffer,nb,c);cd.push(q.buffer,nb);off+=30+nb.length+c.length}
 const sz=cd.reduce((a,b)=>a+b.byteLength,0),n=Object.keys(files).length,e=new DataView(new ArrayBuffer(22));
 e.setUint32(0,0x06054b50,true);e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,sz,true);e.setUint32(16,off,true);
 return new Blob([...parts,...cd,e.buffer],{type:"application/zip"})}
function pngSize(u){const s=[137,80,78,71,13,10,26,10];if(!u||u.length<24||s.some((x,i)=>u[i]!==x))return null;const v=new DataView(u.buffer,u.byteOffset,u.byteLength);return[v.getUint32(16),v.getUint32(20)]}
const p2=n=>n>0&&(n&(n-1))===0;
function validate(files,kind){const r=[],add=(l,m)=>r.push({l,m}),keys=Object.keys(files);
 if(!keys.length){add("erro","O pacote está vazio.");return r}
 if(kind==="java"){const mc=files["pack.mcmeta"];if(!mc)add("erro","pack.mcmeta não encontrado na raiz.");else try{const j=JSON.parse(td.decode(mc));Number.isInteger(j&&j.pack&&j.pack.pack_format)?add("ok","pack.mcmeta válido (pack_format "+j.pack.pack_format+")."):add("erro","pack.mcmeta sem pack.pack_format numérico.")}catch(e){add("erro","pack.mcmeta não é JSON válido: "+e.message)}
  keys.some(k=>k.startsWith("assets/"))?add("ok","Pasta assets/ encontrada."):add("erro","Pasta assets/ não encontrada.");
  files["pack.png"]?add("ok","pack.png encontrado."):add("aviso","pack.png ausente (ícone opcional).")}
 else{const mf=files["manifest.json"];if(!mf)add("erro","manifest.json não encontrado na raiz do pacote.");else try{const j=JSON.parse(td.decode(mf)),h=j.header||{},ids=[];
   [1,2].includes(j.format_version)?add("ok","format_version "+j.format_version+"."):add("erro","format_version ausente ou inesperado (use 2).");
   h.name?add("ok","Nome: "+h.name):add("erro","header.name ausente.");
   if(!UR.test(h.uuid||""))add("erro","header.uuid ausente ou inválido.");else ids.push(h.uuid.toLowerCase());
   const okv=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isInteger);
   okv(h.version)?add("ok","header.version válida."):add("erro","header.version deve ser [x, y, z].");
   okv(h.min_engine_version)?add("ok","min_engine_version: "+h.min_engine_version.join(".")):add("aviso","min_engine_version ausente ou inválida.");
   if(!Array.isArray(j.modules)||!j.modules.length)add("erro","modules ausente ou vazio.");else j.modules.forEach((m,i)=>{if(!UR.test(m.uuid||""))add("erro","modules["+i+"].uuid inválido.");else ids.push(m.uuid.toLowerCase());
    ["resources","data","client_data","script","interface","world_template"].includes(m.type)?add("ok","Módulo "+i+": "+m.type):add("aviso","Tipo de módulo incomum em modules["+i+"]: "+m.type);if(!okv(m.version))add("erro","modules["+i+"].version inválida.")});
   if(new Set(ids).size!==ids.length)add("erro","Há UUIDs repetidos entre header e módulos.")}catch(e){add("erro","manifest.json não é JSON válido: "+e.message)}
  files["pack_icon.png"]?add("ok","pack_icon.png encontrado."):add("aviso","pack_icon.png ausente (o pack aparece sem ícone).");
  keys.some(k=>k.startsWith("textures/"))||add("aviso","Pasta textures/ não encontrada (normal em behavior packs).")}
 let bad=0,np=0;for(const k of keys){if(/\.png$/i.test(k)){const s=pngSize(files[k]);if(!s){add("erro","Não é um PNG válido: "+k);bad++}else if(kind!=="java"&&/^textures\/(blocks|items)\//.test(k)&&!(p2(s[0])&&p2(s[1])))np++}
  if(/[A-Z\s]/.test(k)&&kind!=="java"&&/^textures\//.test(k)){add("aviso","Nome com maiúscula ou espaço (evite): "+k)}}
 if(np)add("aviso",np+" textura(s) de blocos/itens com tamanho que não é potência de 2.");
 if(!r.some(x=>x.l==="erro"))add("ok","Nenhum erro encontrado nas verificações acima. Teste o pacote no jogo.");return r}
const TEX="assets/minecraft/textures/",MAPS=[["block/","blocks/"],["blocks/","blocks/"],["item/","items/"],["items/","items/"],["entity/","entity/"],["models/armor/","models/armor/"],["environment/","environment/"],["particle/","particle/"],["gui/","gui/"]];
function analyzeJava(files){const ok=[],rev=[],bad=[];
 for(const p of Object.keys(files).sort()){const l=p.toLowerCase();
  if(p==="pack.png"){ok.push({from:p,to:"pack_icon.png"});continue}
  if(p==="pack.mcmeta"){bad.push({from:p,why:"Substituído pelo manifest.json (gerado na conversão)."});continue}
  if(p.startsWith(TEX)&&l.endsWith(".png")){const r=p.slice(TEX.length),m=MAPS.find(x=>r.startsWith(x[0]));m?ok.push({from:p,to:"textures/"+m[1]+r.slice(m[0].length)}):rev.push({from:p,to:"textures/"+r});continue}
  let w="Sem equivalente direto no Bedrock; precisa de adaptação manual.";
  if(l.endsWith(".png.mcmeta"))w="Animação do Java; no Bedrock usa-se flipbook_textures.json (manual).";
  else if(/\/(models|blockstates)\//.test(l)&&l.endsWith(".json"))w="Modelos e blockstates do Java não funcionam no Bedrock.";
  else if(l.endsWith(".ogg")||l.endsWith("sounds.json"))w="Sons: o Bedrock usa sound_definitions.json (manual).";
  else if(/\/lang\//.test(l))w="Idiomas: o Bedrock usa arquivos .lang em texts/ (manual).";
  else if(/\/shaders\/|\/optifine\/|\.properties$/.test(l))w="Shaders, OptiFine e .properties não são compatíveis.";
  else if(p.startsWith("assets/")&&!p.startsWith("assets/minecraft/"))w="Namespace de mod ou outro pack; não convertido.";
  bad.push({from:p,why:w})}
 return{ok,rev,bad}}
function applyConversion(files,r){const o={};[...r.ok,...r.rev].forEach(x=>o[x.to]=files[x.from]);return o}
function report(r,name){const L=["RELATÓRIO DE CONVERSÃO JAVA → BEDROCK","Projeto: "+name,"Gerado por YSHARKX7 Pack Studio","",
 "Texturas com pasta equivalente: "+r.ok.length,"Texturas para revisar (pasta sem equivalente direto): "+r.rev.length,"Arquivos não convertidos: "+r.bad.length,"",
 "ATENÇÃO: esta é uma reorganização de pastas, não uma conversão perfeita. Muitos nomes de arquivo de blocos e itens diferem entre Java e Bedrock, e texturas com nome diferente do original podem não aparecer no jogo sem registro em terrain_texture.json e item_texture.json. Os nomes NÃO foram traduzidos automaticamente. Teste no jogo.",""];
 if(r.rev.length){L.push("PARA REVISAR:");r.rev.slice(0,200).forEach(x=>L.push("  "+x.from+" → "+x.to));if(r.rev.length>200)L.push("  ... e mais "+(r.rev.length-200));L.push("")}
 if(r.bad.length){const g={};r.bad.forEach(x=>(g[x.why]=g[x.why]||[]).push(x.from));L.push("NÃO CONVERTIDOS:");for(const w in g){L.push("  ["+g[w].length+"] "+w);g[w].slice(0,5).forEach(f=>L.push("      "+f));if(g[w].length>5)L.push("      ...")}}
 return L.join("\n")}
const CATS=[["Raiz do pacote",""],["Espadas (textures/items/)","textures/items/"],["Armaduras (textures/models/armor/)","textures/models/armor/"],["Ferramentas (textures/items/)","textures/items/"],["Céus (textures/environment/)","textures/environment/"],["Partículas (textures/particle/)","textures/particle/"],["Inventário (textures/gui/)","textures/gui/"],["HUD (textures/ui/)","textures/ui/"],["Blocos (textures/blocks/)","textures/blocks/"],["Itens (textures/items/)","textures/items/"],["Fontes (font/)","font/"],["Interfaces JSON (ui/)","ui/"]];
const D=["textures/blocks","textures/items","textures/entity"];
const TEMPLATES=[
{n:"Pacote em branco",d:"Estrutura básica de resource pack.",dirs:D},
{n:"PvP",d:"Foco em espadas, armaduras, partículas e HUD.",dirs:["textures/items","textures/models/armor","textures/particle","textures/ui","textures/gui"]},
{n:"BedWars",d:"Blocos, itens, armaduras e HUD.",dirs:["textures/blocks","textures/items","textures/models/armor","textures/ui"]},
{n:"SkyWars",d:"Blocos, itens e céu.",dirs:["textures/blocks","textures/items","textures/environment"]},
{n:"Sky PvP",d:"Céu, partículas, itens e HUD.",dirs:["textures/environment","textures/particle","textures/items","textures/ui"]},
{n:"16x",d:"Texturas de 16×16 (padrão do jogo).",dirs:D},
{n:"32x",d:"Texturas de 32×32. Redimensione suas imagens no editor.",dirs:D},
{n:"64x",d:"Texturas de 64×64. Pode pesar em aparelhos fracos.",dirs:D},
{n:"Minimalista",d:"Poucas pastas: blocos e itens.",dirs:["textures/blocks","textures/items"]},
{n:"Colorido",d:"Blocos, itens e entidades.",dirs:D},
{n:"Céus personalizados",d:"Pasta de ambiente (céu, nuvens).",dirs:["textures/environment"]}];
const API={crc32,cleanPath,uuid,parseVer,parseUuid,buildManifest,readZip,stripRoot,writeZip,pngSize,validate,analyzeJava,applyConversion,report,CATS,TEMPLATES};
if(typeof module!=="undefined")module.exports=API;else g.PSCore=API;
})(typeof window!=="undefined"?window:globalThis);
