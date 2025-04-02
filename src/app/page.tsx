import React from 'react';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center my-12">
          <h1 className="text-3xl font-bold text-jd-primary mb-4">Bem-vindo ao AgendaJD</h1>
          <p className="text-lg text-jd-primary-dark mb-8">
            Seu flanelógrafo digital e sistema de agenda para a Loja Jacques DeMolay
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-jd-primary text-white hover:bg-jd-primary-light px-6 py-3 rounded shadow-jd">Ver Eventos</button>
            <button className="bg-jd-secondary text-jd-primary hover:bg-jd-secondary-dark px-6 py-3 rounded shadow-jd">Acessar Mural</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 my-12">
          <div className="rounded-lg p-6 bg-white shadow-jd border border-jd-secondary-dark">
            <div className="text-jd-primary text-3xl mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-jd-primary text-center mb-2">Eventos e Agenda</h2>
            <p className="text-center">
              Acompanhe todos os eventos e sincronize com seu Google Calendar.
            </p>
          </div>
          
          <div className="rounded-lg p-6 bg-white shadow-jd border border-jd-secondary-dark">
            <div className="text-jd-cyan text-3xl mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-jd-primary text-center mb-2">Recados no Mural</h2>
            <p className="text-center">
              Fique por dentro de todos os recados e anúncios importantes.
            </p>
          </div>
          
          <div className="rounded-lg p-6 bg-white shadow-jd border border-jd-secondary-dark">
            <div className="text-jd-accent text-3xl mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-jd-primary text-center mb-2">Notificações</h2>
            <p className="text-center">
              Receba notificações sobre eventos, aniversários e recados.
            </p>
          </div>
        </div>

        <div className="bg-jd-primary rounded-lg p-8 text-white my-12">
          <div className="md:flex items-center">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-jd-accent mb-4">Nossa Identidade Visual</h2>
              <p className="mb-4">
                As cores do AgendaJD foram inspiradas no emblema da Loja Jacques DeMolay,
                refletindo os valores e a tradição da organização.
              </p>
              <div className="flex space-x-2 mb-4">
                <div className="w-8 h-8 rounded bg-jd-primary-light"></div>
                <div className="w-8 h-8 rounded bg-jd-primary"></div>
                <div className="w-8 h-8 rounded bg-jd-primary-dark"></div>
                <div className="w-8 h-8 rounded bg-jd-accent"></div>
                <div className="w-8 h-8 rounded bg-jd-cyan"></div>
                <div className="w-8 h-8 rounded bg-jd-secondary"></div>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-8">
              <div className="w-full h-48 bg-jd-secondary rounded-lg flex items-center justify-center">
                <span className="text-jd-primary text-xl font-bold">Logo da Loja</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-jd-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="md:flex justify-between items-center">
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
