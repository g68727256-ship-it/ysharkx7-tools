# YSHARKX7 Tools
Site estático (HTML/CSS/JS puro).

## Testar
Abra `index.html` no navegador. Para testar no celular: na pasta do projeto rode `python3 -m http.server 8000` e acesse `http://IP-DO-PC:8000` (mesmo Wi-Fi). Ou publique no GitHub Pages e abra o link no celular.

## Publicar no GitHub Pages
1. Crie um repositório público (ex.: `ysharkx7-tools`).
2. Envie todos os arquivos (Add file > Upload files).
3. Settings > Pages > Deploy from a branch > main / (root) > Save.
4. Em 1-2 min: `https://SEU-USUARIO.github.io/ysharkx7-tools/`.

## Ferramentas atuais
Nomes, Manifest, Paletas, Central Java, Central Bedrock, Guia de FPS.

## Adicionar nova ferramenta
1. Copie `tools/paletas.html` para `tools/nova.html` e edite.
2. Adicione um item no array `TOOLS` em `script.js` (n, d, u, i, t). Remova `soon:1` quando estiver pronta.
