const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the intelligent search logic
code = code.replace(
  /app\.get\("\/api\/search"[\s\S]*?\/\/ ==========================================\n\/\/ VITE MIDDLEWARE/m,
  `app.get("/api/search", (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Consulta de pesquisa vazia." });
  }
  try {
    const fallbackResults = localDb.getObras().filter(o => 
      o.titulo.toLowerCase().includes(query.toLowerCase()) ||
      o.tipo.toLowerCase().includes(query.toLowerCase()) ||
      o.generos.some(g => g.toLowerCase().includes(query.toLowerCase()))
    );

    res.json({
      type: "local",
      obras: fallbackResults
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro interno no servidor ao realizar a pesquisa." });
  }
});

// ==========================================
// VITE MIDDLEWARE`
);

fs.writeFileSync('server.ts', code);
