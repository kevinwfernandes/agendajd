"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

export default function GerarIconesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gerados, setGerados] = useState<{ size: number, url: string }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoSrc, setLogoSrc] = useState('/logojd.jpeg');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !isAdmin()) {
      router.push('/');
    }
  }, [status, router]);

  const isAdmin = () => {
    if (!session || !session.user) return false;
    
    const adminTypes = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'];
    return adminTypes.includes(session.user.tipoUsuario as string);
  };

  const generateIcons = async () => {
    if (!canvasRef.current) return;
    
    setIsLoading(true);
    setGerados([]);
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const newGerados: { size: number, url: string }[] = [];
        
        for (const size of sizes) {
          const canvas = canvasRef.current;
          if (!canvas) continue;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          // Configurar tamanho do canvas
          canvas.width = size;
          canvas.height = size;
          
          // Limpar o canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          
          // Calcular proporções para manter a relação de aspecto
          const aspectRatio = img.width / img.height;
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
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          // Converter para URL de dados
          const dataUrl = canvas.toDataURL('image/png');
          newGerados.push({ size, url: dataUrl });
        }
        
        setGerados(newGerados);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        console.error('Erro ao carregar a imagem');
        setIsLoading(false);
      };
      
      img.src = logoSrc;
    } catch (error) {
      console.error('Erro ao gerar ícones:', error);
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoSrc(event.target.result as string);
      }
    };
    
    reader.readAsDataURL(file);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jd-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jd-light flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-jd-primary mb-6">Gerar Ícones para PWA</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Selecione o logo</h2>
          
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 rounded-md w-full"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Pré-visualização</h3>
            <div className="border rounded-md p-4 flex justify-center">
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="max-h-40 object-contain"
                />
              )}
            </div>
          </div>
          
          <button
            onClick={generateIcons}
            disabled={isLoading}
            className={`px-4 py-2 bg-jd-primary text-white rounded-md ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-jd-primary-dark'
            } transition-colors`}
          >
            {isLoading ? 'Gerando...' : 'Gerar Ícones'}
          </button>
        </div>
        
        {gerados.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Ícones Gerados</h2>
            <p className="mb-4 text-gray-600">
              Clique nos ícones para baixá-los. Em seguida, adicione-os à pasta <code>/public/icons/</code> do seu projeto.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gerados.map(({ size, url }) => (
                <div key={size} className="flex flex-col items-center">
                  <a 
                    href={url} 
                    download={`icon-${size}x${size}.png`}
                    className="border rounded-md p-2 hover:bg-gray-50 transition-colors"
                  >
                    <img src={url} alt={`Icon ${size}x${size}`} className="w-16 h-16 object-contain" />
                  </a>
                  <span className="text-sm mt-1">{size}x{size}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Como usar:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Baixe todos os ícones clicando em cada um.</li>
                <li>Coloque os ícones na pasta <code>/public/icons/</code> do seu projeto.</li>
                <li>Verifique se o <code>manifest.json</code> está configurado corretamente.</li>
                <li>Reinicie seu servidor Next.js.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
      
      {/* Canvas escondido usado para renderização */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
} 