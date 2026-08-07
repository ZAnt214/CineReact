const BRAND_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@600;700&family=Sora:wght@700;800&display=swap';

async function ensureBrandFontsLoaded() {
  if (typeof document === 'undefined') return;

  const linkId = 'cinereact-brand-fonts';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = BRAND_FONT_URL;
    document.head.appendChild(link);
  }

  await Promise.all([
    document.fonts.load('600 40px "Plus Jakarta Sans"'),
    document.fonts.load('700 40px "Plus Jakarta Sans"'),
    document.fonts.load('800 44px Sora'),
    document.fonts.load('700 34px "JetBrains Mono"'),
    document.fonts.load('400 13px Inter'),
  ]).catch(() => undefined);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => setTimeout(resolve, 150));
}

export async function downloadBrandLogoFile(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Não foi possível baixar o arquivo.');

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadBrandLogoAsPng(url: string, filename: string, width = 1600) {
  await ensureBrandFontsLoaded();

  const response = await fetch(url);
  if (!response.ok) throw new Error('Não foi possível gerar o PNG.');

  const svgText = await response.text();
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Falha ao renderizar o logo.'));
      img.src = svgUrl;
    });

    const ratio = image.height / image.width || 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round(width * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível.');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });

    if (!pngBlob) throw new Error('Falha ao exportar PNG.');

    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = filename.replace(/\.svg$/i, '.png');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
