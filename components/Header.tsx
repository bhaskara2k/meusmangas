import React, { useState } from 'react';
import { View } from '../types';
import { SearchIcon, CollectionIcon, CompletenessIcon, StatisticsIcon, SunIcon, MoonIcon, UserIcon, LogoutIcon, BookOpenIcon } from './icons/Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import ProfileModal from './ProfileModal';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onProfileClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, userData, logout } = useUser();

  const navItems = [
    { view: View.SEARCH, icon: SearchIcon, label: 'Buscar' },
    { view: View.COLLECTION, icon: CollectionIcon, label: 'Coleção' },
    { view: View.CHAPTERS, icon: BookOpenIcon, label: 'Capítulos' },
    { view: View.COMPLETENESS, icon: CompletenessIcon, label: 'Verificar' },
    { view: View.STATISTICS, icon: StatisticsIcon, label: 'Estatísticas' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/95 border-b border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl transition-all duration-300">
      {/* Brilho sutil no topo */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Premium */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setCurrentView(View.SEARCH)}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary-gradient rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-primary-gradient p-2 rounded-lg shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Meus</span>
              <span className="text-primary-gradient">Mangás</span>
            </h1>
          </div>

          {/* Navigation Premium */}
          <nav className="flex items-center gap-2">
            {/* Nav Buttons */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-gray-200 dark:border-white/10 transition-colors">
              {navItems.map(({ view, icon: Icon, label }) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all duration-300
                    ${currentView === view
                      ? 'text-white shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                    }
                  `}
                >
                  {currentView === view && (
                    <div className="absolute inset-0 bg-primary-gradient rounded-lg" />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${currentView === view ? 'text-white' : ''}`} />
                  <span className="relative z-10 hidden xl:inline">{label}</span>

                  {/* Indicador ativo */}
                  {currentView === view && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button - Same logic */}
            <div className="lg:hidden flex items-center gap-1 bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-gray-200 dark:border-white/10">
              {navItems.map(({ view, icon: Icon }) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`
                    relative p-2.5 rounded-lg transition-all duration-300
                    ${currentView === view
                      ? 'text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                    }
                  `}
                >
                  {currentView === view && (
                    <div className="absolute inset-0 bg-primary-gradient rounded-lg shadow-md" />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-2" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 group overflow-hidden"
              aria-label="Alternar Tema"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-yellow-500 relative z-10" />
              ) : (
                <MoonIcon className="w-5 h-5 text-blue-600 relative z-10" />
              )}
            </button>

            {/* User Info */}
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-primary/20 flex items-center justify-center">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
              <span className="hidden md:inline text-sm font-black text-slate-700 dark:text-gray-300 italic group-hover:text-primary transition-colors">
                {userData?.username || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="relative p-2.5 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-500/20 transition-all duration-300 group overflow-hidden shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <LogoutIcon className="w-5 h-5 text-red-500 dark:text-red-400 relative z-10" />
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </header>
  );
};

export default Header;