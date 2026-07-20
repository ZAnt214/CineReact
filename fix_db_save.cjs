const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const db = localDb.getDb\(\);\n\s*db.reacts = db.reacts.filter\(\(r: any\) => r.obraId !== obraId\);\n\s*db.reacts.push\(\.\.\.validReacts\);\n\s*localDb.saveDb\(db\);/, `
      // manual replace using the exported methods
      const oldReacts = localDb.getReacts().filter(r => r.obraId === obraId);
      for (const old of oldReacts) {
        localDb.deleteReact(old.id);
      }
      for (const valid of validReacts) {
        localDb.saveReact(valid);
      }
`);
fs.writeFileSync('server.ts', code);
