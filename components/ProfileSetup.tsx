import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface ProfileSetupProps {
    onComplete: () => void;
}

const THEME_COLORS = [
    { name: 'Roxo', value: '263.4 70% 50.4%', class: 'bg-[#8b5cf6]' },
    { name: 'Azul', value: '217.2 91.2% 59.8%', class: 'bg-[#3b82f6]' },
    { name: 'Verde', value: '142.1 76.2% 36.3%', class: 'bg-[#10b981]' },
    { name: 'Rosa', value: '322.2 93.9% 48.2%', class: 'bg-[#ec4899]' },
    { name: 'Laranja', value: '24.6 95% 53.1%', class: 'bg-[#f97316]' },
    { name: 'Vermelho', value: '0 72.2% 50.6%', class: 'bg-[#ef4444]' },
    { name: 'Ciano', value: '188.7 78.5% 41.2%', class: 'bg-[#06b6d4]' },
    { name: 'Amarelo', value: '47.9 95.8% 51.2%', class: 'bg-[#eab308]' },
];

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
    const [username, setUsername] = useState('');
    const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user = auth.currentUser;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('Usuário não autenticado');
            return;
        }

        if (username.trim().length < 3) {
            setError('O nome de usuário deve ter pelo menos 3 caracteres');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            // Verificar se username já existe
            const usernameQuery = query(
                collection(db, 'users'),
                where('username', '==', username.trim())
            );
            const usernameSnapshot = await getDocs(usernameQuery);

            if (!usernameSnapshot.empty) {
                setError('Este nome de usuário já está em uso. Escolha outro.');
                setLoading(false);
                return;
            }

            // Atualizar perfil do usuário
            await updateProfile(user, {
                displayName: username.trim()
            });

            // Salvar dados no Firestore
            await setDoc(doc(db, 'users', user.uid), {
                username: username.trim(),
                email: user.email || '',
                themeColor: selectedColor.value,
                createdAt: new Date().toISOString(),
                photoURL: user.photoURL || null
            });

            // Aplicar cor imediatamente
            document.documentElement.style.setProperty('--primary', selectedColor.value);

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Erro ao configurar perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background de mangá com opacidade */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/manga-background.jpg)',
                    opacity: 0.05
                }}
            />

            {/* Conteúdo do setup */}
            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-10 space-y-8 relative z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter">
                        Meus<span className="text-primary italic">Mangás</span>
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 font-bold">
                        Personalize sua experiência
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Campo de Username */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="username">
                            Nome de Usuário
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Como quer ser chamado?"
                            required
                            minLength={3}
                            className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                        />
                    </div>

                    {/* Seletor de Cor */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1 block">
                            Cor dos Botões
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {THEME_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`
                                        relative h-12 rounded-xl transition-all duration-300
                                        ${color.class}
                                        ${selectedColor.value === color.value
                                            ? 'ring-4 ring-slate-900 dark:ring-white scale-110 shadow-lg'
                                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                                        }
                                    `}
                                    aria-label={`Selecionar cor ${color.name}`}
                                >
                                    {selectedColor.value === color.value && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white mix-blend-difference" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</p>}

                    {/* Botão de Salvar */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-4 bg-primary-gradient text-white font-black rounded-2xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-sm"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Começar Jornada'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
