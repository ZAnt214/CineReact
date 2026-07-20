const fs = require('fs');
let code = fs.readFileSync('src/components/ObraDetails.tsx', 'utf8');

code = code.replace(
  /const \[visibleRelatedCount, setVisibleRelatedCount\] = useState\(20\);/,
  ''
);

code = code.replace(
  /const \[activeReactId, setActiveReactId\] = useState<string \| null>\(null\);/,
  `const [activeReactId, setActiveReactId] = useState<string | null>(null);
  const [visibleRelatedCount, setVisibleRelatedCount] = useState(20);`
);

fs.writeFileSync('src/components/ObraDetails.tsx', code);
