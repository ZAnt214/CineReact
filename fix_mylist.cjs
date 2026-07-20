const fs = require('fs');
let code = fs.readFileSync('src/components/MyList.tsx', 'utf8');

code = code.replace(/Obras Favoritas/g, "Universos Favoritos");
code = code.replace(/Essas são as obras que você curtiu/g, "Esses são os universos que você favoritou");
code = code.replace(/obras na lista/g, "universos na lista");

fs.writeFileSync('src/components/MyList.tsx', code);
