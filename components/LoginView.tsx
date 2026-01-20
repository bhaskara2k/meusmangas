import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import ProfileSetup from './ProfileSetup';

const LoginView: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Verificar se precisa mostrar setup ao montar
  useEffect(() => {
    const needsSetup = localStorage.getItem('needsProfileSetup');
    if (needsSetup === 'true' && auth.currentUser) {
      console.log('🔄 Detectado flag de setup no localStorage');
      setShowProfileSetup(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: username.trim()
        });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: username.trim(),
          email: email,
          themeColor: '#8b5cf6',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Email ou senha inválidos.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/invalid-email') {
        setError("E-mail inválido.");
      } else {
        setError(err.message || "Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('🔍 Usuário autenticado:', user.uid);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        console.log('📄 Documento existe?', userDoc.exists());

        if (!userDoc.exists()) {
          console.log('✨ Novo usuário! Mostrando tela de setup...');
          // Marcar no localStorage que precisa mostrar setup
          localStorage.setItem('needsProfileSetup', 'true');
          setShowProfileSetup(true);
        } else {
          console.log('👤 Usuário existente! Login completo.');
          // Garantir que não há flag de setup
          localStorage.removeItem('needsProfileSetup');
        }
      } catch (firestoreError: any) {
        console.error('❌ Erro ao verificar usuário no Firestore:', firestoreError);
        // Se houver erro ao verificar, assumir que é novo usuário
        console.log('⚠️ Assumindo novo usuário devido ao erro');
        localStorage.setItem('needsProfileSetup', 'true');
        setShowProfileSetup(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelado.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para este site.");
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError("Já existe uma conta com este e-mail usando outro método de login.");
      } else {
        console.error('❌ Erro no login Google:', err);
        setError(err.message || "Erro ao fazer login com Google.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleProfileSetupComplete = () => {
    // Remover flag do localStorage
    localStorage.removeItem('needsProfileSetup');
    setShowProfileSetup(false);
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setUsername('');
    setEmail('');
    setPassword('');
  }

  if (showProfileSetup) {
    console.log('🎨 Renderizando ProfileSetup! Estado:', showProfileSetup);
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background de mangá */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/manga-background.jpg)',
          opacity: 0.08
        }}
      />

      {/* Efeitos de luz animados */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Conteúdo */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
          {/* Brilho no topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-wider">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Meus</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Mangás</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              {isLoginView ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div className="space-y-2 group">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="username">
                  Usuário
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome de usuário"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-white/10"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
            )}

            <div className="space-y-2 group">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-white/10"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-white/10"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-shake">
                <p className="text-sm text-red-400 text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    {isLoginView ? 'Entrar' : 'Criar Conta'}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divisor */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs font-semibold text-gray-500 bg-slate-900/40 uppercase tracking-wider">ou</span>
            </div>
          </div>

          {/* Botão Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="relative w-full px-6 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-red-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center gap-3">
              {googleLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{isLoginView ? 'Continuar com Google' : 'Cadastre-se com Google'}</span>
                </>
              )}
            </span>
          </button>

          {/* Link */}
          <div className="text-center pt-2">
            <button
              onClick={toggleView}
              className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium group"
            >
              {isLoginView ? (
                <>
                  Não tem uma conta? <span className="text-purple-400 group-hover:underline">Cadastre-se</span>
                </>
              ) : (
                <>
                  Já tem uma conta? <span className="text-purple-400 group-hover:underline">Faça login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animações */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginView;