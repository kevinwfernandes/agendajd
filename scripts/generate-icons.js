// Script para gerar ícones para PWA
// Para executar: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const SOURCE_LOGO = path.join(__dirname, '../public/logojd.jpeg');
const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Certifique-se de que o diretório exista
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateIcons() {
  console.log('Carregando imagem fonte...');
  const image = await loadImage(SOURCE_LOGO);

  console.log('Gerando ícones...');
  for (const size of SIZES) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Definir um fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Calcular proporções para manter a relação de aspecto
    const aspectRatio = image.width / image.height;
    let drawWidth, drawHeight, drawX, drawY;
    
    if (aspectRatio > 1) {
      // Imagem mais larga que alta
      drawWidth = size;
      drawHeight = size / aspectRatio;
      drawX = 0;
      drawY = (size - drawHeight) / 2;
    } else {
      // Imagem mais alta que larga
      drawHeight = size;
      drawWidth = size * aspectRatio;
      drawX = (size - drawWidth) / 2;
      drawY = 0;
    }
    
    // Desenhar a imagem no canvas
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    
    // Salvar a imagem como PNG
    const outputFile = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    
    console.log(`Gerado: ${outputFile}`);
  }
  
  console.log('Todos os ícones foram gerados com sucesso!');
}

generateIcons().catch(err => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
}); 