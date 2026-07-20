const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(/Gerenciamento de Obras/g, "Gerenciamento de Universos");
code = code.replace(/Adicionar Nova Obra/g, "Adicionar Universo");
code = code.replace(/Nome da Obra/g, "Nome do Universo");
code = code.replace(/Obras Cadastradas/g, "Universos Cadastrados");
code = code.replace(/obra/g, "universo");
code = code.replace(/Obra/g, "Universo");

fs.writeFileSync('src/components/AdminPanel.tsx', code);
