import React from 'react';
import Navbar from '../components/Navbar';


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto p-8">
       
        
        <div className="text-center my-12">
          <h1 className="text-4xl font-bold text-jd-primary mb-4">
            Bem-vindo ao AgendaJD
          </h1>
          <p className="text-lg text-jd-primary-dark mb-8">
            Seu flanelógrafo digital e sistema de agenda para a Loja Jacques DeMolay
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-jd-primary text-white py-3 px-6 rounded hover:bg-jd-primary-dark transition-colors">
              Ver Eventos
            </button>
            <button className="bg-jd-secondary text-jd-primary py-3 px-6 rounded hover:bg-jd-secondary-dark transition-colors">
              Acessar Mural
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-12">
          <div className="bg-white rounded-lg p-6 shadow-jd">
            <h2 className="text-2xl font-bold text-jd-primary text-center mb-2">
              Eventos e Agenda
            </h2>
            <p className="text-center">
              Acompanhe todos os eventos e sincronize com seu Google Calendar.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-jd">
            <h2 className="text-2xl font-bold text-jd-primary text-center mb-2">
              Recados no Mural
            </h2>
            <p className="text-center">
              Fique por dentro de todos os recados e anúncios importantes.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-jd">
            <h2 className="text-2xl font-bold text-jd-primary text-center mb-2">
              Notificações
            </h2>
            <p className="text-center">
              Receba notificações sobre eventos, aniversários e recados.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-jd-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center flex-wrap">
            <div>
              <h3 className="text-jd-accent text-xl font-bold">AgendaJD</h3>
              <p className="text-jd-secondary-dark">
                Desenvolvido para a Loja Jacques DeMolay
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-jd-secondary-dark">
                &copy; {new Date().getFullYear()} - Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
