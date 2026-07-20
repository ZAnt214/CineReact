const fs = require('fs');
let code = fs.readFileSync('src/db/local_db.ts', 'utf8');

code = code.replace(
  "const DB_PATH = path.join(process.cwd(), 'db_cine_react.json');",
  "const DB_PATH = path.join(process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd(), 'db_cine_react.json');"
);

fs.writeFileSync('src/db/local_db.ts', code);
