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

## SEO e anúncios
- `sitemap.xml` e `robots.txt` estão na raiz do projeto. Em site de projeto no GitHub Pages (`usuario.github.io/projeto/`), os buscadores só leem o `robots.txt` da raiz do domínio; envie o `sitemap.xml` no Google Search Console.
- Os espaços "Espaço reservado para Google AdSense (inativo)" são apenas marcação. O AdSense NÃO está integrado: exige aprovação do Google e página de privacidade atualizada.
- `404.html` usa o caminho `/ysharkx7-tools/`. Se mudar o nome do repositório ou usar domínio próprio, ajuste esse caminho.

## Pack Studio
`tools/pack-studio.html` + `js/ps-core.js` (ZIP, validação, conversão) + `js/ps-ui.js` (interface) + `css/pack-studio.css`.
Projetos ficam no IndexedDB do navegador (limite depende do aparelho; limpar dados do site apaga tudo). Exporte o ZIP para ter backup.
Importar/exportar ZIP usa DecompressionStream/CompressionStream (Chrome/Edge/Firefox/Safari atuais).
