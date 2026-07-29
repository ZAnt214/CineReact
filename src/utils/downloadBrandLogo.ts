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
