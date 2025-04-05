"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default function GerarIconesPage() {
  const [icons, setIcons] = useState<{ size: number; dataUrl: string }[]>([]);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: session, status } = useSession();

  // Array de tamanhos de ícones para PWA
  const iconSizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    }
    
    const isAdmin = session?.user?.tipoUsuario && [
      'MACOM_ADMIN_GERAL',
      'ADMIN_DM',
      'ADMIN_FDJ',
      'ADMIN_FRATERNA'
    ].includes(session.user.tipoUsuario as string);
    
    if (!isAdmin) {
      redirect('/acesso-negado');
    }
  }, [session, status]);

  const generateIcons = (event: React.FormEvent) => {
    event.preventDefault();
    if (!logoSrc) return;
    
    setIsLoading(true);
    const image = new Image();
    image.onload = () => {
      const generatedIcons = iconSizes.map(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Calcular proporção para manter o aspecto da imagem
          const aspectRatio = image.width / image.height;
          let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
          
          if (aspectRatio > 1) {
            // Imagem mais larga que alta
            drawHeight = size;
            drawWidth = size * aspectRatio;
            offsetX = -(drawWidth - size) / 2;
          } else {
            // Imagem mais alta que larga
            drawWidth = size;
            drawHeight = size / aspectRatio;
            offsetY = -(drawHeight - size) / 2;
          }
          
          // Preencher com fundo branco (opcional)
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, size, size);
          
          // Desenhar a imagem redimensionada
          ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        }
        
        return {
          size,
          dataUrl: canvas.toDataURL('image/png')
        };
      });
      
      setIcons(generatedIcons);
      setIsLoading(false);
    };
    
    image.onerror = () => {
      alert('Erro ao carregar a imagem. Verifique se o arquivo é válido.');
      setIsLoading(false);
    };
    
    image.src = logoSrc;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Gerar Ícones para PWA</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={generateIcons} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o logo (de preferência quadrado)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-jd-primary file:text-white
                hover:file:bg-jd-primary-dark"
            />
          </div>
          
          {logoSrc && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Prévia:</p>
              <div className="border border-gray-300 rounded-lg p-4 inline-block">
                <img 
                  src={logoSrc} 
                  alt="Prévia do logo" 
                  className="max-w-[200px] max-h-[200px]"
                />
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={!logoSrc || isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${!logoSrc || isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-jd-primary hover:bg-jd-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jd-primary'
              }`}
          >
            {isLoading ? 'Gerando ícones...' : 'Gerar ícones'}
          </button>
        </form>
      </div>
      
      {icons.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Ícones gerados</h2>
          <p className="text-sm text-gray-600 mb-4">
            Faça o download de cada ícone e coloque na pasta <code className="bg-gray-100 px-1 py-0.5 rounded">public/icons/</code> do seu projeto.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {icons.map((icon) => (
              <div key={icon.size} className="border rounded-lg p-4 flex flex-col items-center">
                <img 
                  src={icon.dataUrl} 
                  alt={`Ícone ${icon.size}x${icon.size}`} 
                  className="mb-2 border border-gray-200"
                  style={{ width: `${Math.min(icon.size, 100)}px`, height: `${Math.min(icon.size, 100)}px` }}
                />
                <span className="text-sm text-gray-700 mb-2">{icon.size}x{icon.size}</span>
                <a
                  href={icon.dataUrl}
                  download={`icon-${icon.size}x${icon.size}.png`}
                  className="text-xs bg-jd-primary hover:bg-jd-primary-dark text-white py-1 px-2 rounded"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Como usar:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Faça o download de todos os ícones acima</li>
              <li>Coloque-os na pasta <code className="bg-gray-100 px-1 py-0.5 rounded">public/icons/</code> do seu projeto</li>
              <li>Verifique se o arquivo <code className="bg-gray-100 px-1 py-0.5 rounded">manifest.json</code> está configurado corretamente</li>
              <li>Verifique se o <code className="bg-gray-100 px-1 py-0.5 rounded">layout.tsx</code> inclui as tags de favicon e ícones apropriadas</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}