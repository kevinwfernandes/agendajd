"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { NotificacoesDropdown } from './NotificacoesDropdown';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = session?.user?.tipoUsuario && [
    'MACOM_ADMIN_GERAL',
    'ADMIN_DM',
    'ADMIN_FDJ',
    'ADMIN_FRATERNA'
  ].includes(session.user.tipoUsuario as string);

  const menuItems = [
    { href: '/', label: 'Início' },
    { href: '/calendario', label: 'Calendário' },
    { href: '/recados', label: 'Recados' },
  ];

  const adminMenuItems = [
    { href: '/admin/usuarios', label: 'Usuários' },
    { href: '/admin/classes', label: 'Classes' },
    { href: '/admin/notificacoes', label: 'Notificações' },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-xl font-bold text-jd-primary">AgendaJD</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {menuItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'border-jd-primary text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.label}
                </Link>
              ))}
              
              {isAdmin && (
                <div className="relative group">
                  <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                    Admin <span className="ml-1">▼</span>
                  </button>
                  <div className="absolute left-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    {adminMenuItems.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className={`${
                          pathname === item.href
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-100'
                        } block px-4 py-2 text-sm`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {session ? (
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              <NotificacoesDropdown />
              
              <Link 
                href="/perfil" 
                className="p-2 text-gray-600 hover:text-jd-primary"
                title="Meu Perfil"
              >
                <UserCircleIcon className="h-6 w-6" />
              </Link>
              
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-gray-600 hover:text-red-600"
                title="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex sm:items-center">
              <Link 
                href="/login"
                className="text-jd-primary hover:text-jd-primary-dark px-3 py-2 rounded-md text-sm font-medium"
              >
                Entrar
              </Link>
            </div>
          )}
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-jd-primary"
            >
              <span className="sr-only">Abrir menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${
                pathname === item.href
                  ? 'bg-jd-primary-light text-jd-primary'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 ${
                pathname === item.href ? 'border-jd-primary' : 'border-transparent'
              } text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          
          {isAdmin && (
            <>
              <div className="pl-3 pr-4 py-2 font-medium text-gray-500">
                Admin
              </div>
              {adminMenuItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'bg-jd-primary-light text-jd-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } block pl-6 pr-4 py-2 border-l-4 ${
                    pathname === item.href ? 'border-jd-primary' : 'border-transparent'
                  } text-base font-medium`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </div>
        
        {session ? (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                {session.user.image ? (
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={session.user.image}
                    alt={session.user.name || "Usuário"}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-jd-primary flex items-center justify-center text-white">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {session.user.name}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {session.user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link 
                href="/perfil"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Meu Perfil
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sair
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="mt-3 space-y-1">
              <Link 
                href="/login"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Entrar
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 