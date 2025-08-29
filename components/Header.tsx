import React from 'react';
import { View } from '../types';
import { SearchIcon, CollectionIcon, CompletenessIcon, StatisticsIcon, SunIcon, MoonIcon, UserIcon, LogoutIcon } from './icons/Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();

  const baseButtonClass = "flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring";
  const activeButtonClass = "bg-primary text-primary-foreground shadow-lg";
  const inactiveButtonClass = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg border-b border-border">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-wider">
          Meus<span className="text-primary">Mangás</span>
        </h1>
        <nav className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setCurrentView(View.SEARCH)}
            className={`${baseButtonClass} ${currentView === View.SEARCH ? activeButtonClass : inactiveButtonClass}`}
            aria-label="Buscar Mangás"
          >
            <SearchIcon className="w-5 h-5" />
            <span className="hidden md:inline">Buscar</span>
          </button>
          <button 
            onClick={() => setCurrentView(View.COLLECTION)}
            className={`${baseButtonClass} ${currentView === View.COLLECTION ? activeButtonClass : inactiveButtonClass}`}
            aria-label="Ver Coleção"
          >
            <CollectionIcon className="w-5 h-5" />
            <span className="hidden md:inline">Coleção</span>
          </button>
          <button 
            onClick={() => setCurrentView(View.COMPLETENESS)}
            className={`${baseButtonClass} ${currentView === View.COMPLETENESS ? activeButtonClass : inactiveButtonClass}`}
            aria-label="Verificar Completude da Coleção"
          >
            <CompletenessIcon className="w-5 h-5" />
            <span className="hidden md:inline">Verificar</span>
          </button>
          <button 
            onClick={() => setCurrentView(View.STATISTICS)}
            className={`${baseButtonClass} ${currentView === View.STATISTICS ? activeButtonClass : inactiveButtonClass}`}
            aria-label="Ver Estatísticas da Coleção"
          >
            <StatisticsIcon className="w-5 h-5" />
            <span className="hidden md:inline">Estatísticas</span>
          </button>
          <button
            onClick={toggleTheme}
            className={`${baseButtonClass} ${inactiveButtonClass} px-3`}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground px-3">
              <UserIcon className="w-5 h-5" />
              <span className="font-medium">{user?.user_metadata.username}</span>
          </div>

          <button
              onClick={logout}
              className={`${baseButtonClass} ${inactiveButtonClass} px-3 text-red-500 hover:bg-red-500/10 hover:!text-red-500`}
              aria-label="Sair"
          >
              <LogoutIcon className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;