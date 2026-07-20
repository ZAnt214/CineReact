const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// There's a duplicate fragment at the end of the canais map block
code = code.replace(
  /                  \}\)\}\n                        title=\{canal\.titulo\}[\s\S]*?                  \}\)\}/,
  "                  })}"
);

fs.writeFileSync('src/App.tsx', code);
