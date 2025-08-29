import React, { useState } from 'react';
import { supabase } from '../supabase';

const LoginView: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError("Email ou senha inválidos.");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          setError("Este e-mail já está em uso.");
        } else if (error.message.includes("profiles_username_key")) {
          setError("Este nome de usuário já está em uso.");
        }
        else {
          setError(error.message);
        }
      }
    }
    setLoading(false);
  };
  
  const toggleView = () => {
      setIsLoginView(!isLoginView);
      setError(null);
      setUsername('');
      setEmail('');
      setPassword('');
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-wider">
            Meus<span className="text-primary">Mangás</span>
          </h1>
           <p className="text-muted-foreground mt-2">
            {isLoginView ? 'Faça login na sua conta' : 'Crie uma nova conta'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && (
             <div>
              <label className="text-sm font-medium text-muted-foreground" htmlFor="username">Usuário</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu nome de usuário"
                required
                className="mt-1 w-full pl-4 pr-4 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200"
              />
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-muted-foreground" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="mt-1 w-full pl-4 pr-4 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha (mínimo 6 caracteres)"
              required
              className="mt-1 w-full pl-4 pr-4 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200"
            />
          </div>
          
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isLoginView ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="text-center text-sm">
          <button onClick={toggleView} className="text-primary hover:underline">
            {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;