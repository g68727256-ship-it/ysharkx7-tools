/* YSHARKX7 Tools - núcleo comum: cabeçalho, rodapé, toast, copiar, baixar */
const R = document.body.dataset.root || "";
const TOOLS = [
  {n:"Gerador de Nomes",d:"Nomes com estilos, prefixos e códigos de cor.",u:"tools/nomes.html",i:"✨",t:"Java e Bedrock"},
  {n:"Gerador de Manifest Bedrock",d:"manifest.json válido com UUIDs automáticos.",u:"tools/manifest.html",i:"📦",t:"Bedrock"},
  {n:"Paletas de Cores",d:"Paletas aleatórias ou manuais com HEX.",u:"tools/paletas.html",i:"🎨",t:"Java e Bedrock"},
  {n:"Central Minecraft Java",d:"Mods, FPS, resource packs, versões.",u:"tools/java.html",i:"☕",t:"Java"},
  {n:"Central Minecraft Bedrock",d:"Estrutura de pastas, texturas, conversão.",u:"tools/bedrock.html",i:"🧱",t:"Bedrock"},
  {n:"Guia de otimização de FPS",d:"Configurações para Java e Bedrock.",u:"tools/fps.html",i:"⚡",t:"Java e Bedrock"}
];
function toast(msg, err){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.id="toast";t.setAttribute("role","status");document.body.appendChild(t)}
  t.textContent=msg;t.className="show"+(err?" err":"");clearTimeout(t._h);t._h=setTimeout(()=>t.className="",2200)}
async function copiar(txt){try{await navigator.clipboard.writeText(txt);toast("Copiado!")}catch(e){
  try{const a=document.createElement("textarea");a.value=txt;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();toast("Copiado!")}catch(e2){toast("Não foi possível copiar. Selecione o texto manualmente.",1)}}}
function baixar(nome,conteudo,tipo){const b=new Blob([conteudo],{type:tipo||"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Download iniciado: "+nome)}
function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(x=>x.toString(16).padStart(2,"0")).join("");return h.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,"$1-$2-$3-$4-$5")}
function pref(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem("y7_"+k));localStorage.setItem("y7_"+k,JSON.stringify(v))}catch(e){return null}}
document.body.insertAdjacentHTML("afterbegin",`<header class="top"><div class="wrap bar"><a class="logo" href="${R}index.html">YSHARKX7 <b>Tools</b></a>
<button id="menuBtn" aria-label="Abrir menu" aria-expanded="false">☰</button>
<nav id="nav" aria-label="Principal"><ul><li><a href="${R}index.html#ferramentas">Ferramentas</a></li><li><a href="${R}index.html#categorias">Categorias</a></li><li><a href="${R}index.html#tutoriais">Tutoriais</a></li><li><a href="${R}pages/contato.html">Contato</a></li></ul></nav></div></header>`);
document.body.insertAdjacentHTML("beforeend",`<footer><div class="wrap"><p><b>YSHARKX7 Tools</b> — ferramentas gratuitas para Minecraft. Projeto independente, não afiliado à Mojang Studios nem à Microsoft. Minecraft é marca registrada de seus respectivos donos.</p>
<a href="${R}pages/privacidade.html">Privacidade</a><a href="${R}pages/termos.html">Termos de uso</a><a href="${R}pages/contato.html">Contato</a></div></footer>`);
const mb=document.getElementById("menuBtn"),nv=document.getElementById("nav");
mb.onclick=()=>{const o=nv.classList.toggle("open");mb.setAttribute("aria-expanded",o)};
nv.onclick=e=>{if(e.target.tagName==="A")nv.classList.remove("open")};
