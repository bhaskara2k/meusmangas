import { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export const useThemeColor = () => {
    const { userData } = useUser();

    useEffect(() => {
        if (userData?.themeColor) {
            // Aplicar a cor no CSS
            document.documentElement.style.setProperty('--primary', userData.themeColor);

            // Separar H, S, L para permitir cálculos (como degradês inteligentes)
            const [h, s, l] = userData.themeColor.split(' ');
            document.documentElement.style.setProperty('--primary-h', h.replace('deg', ''));
            document.documentElement.style.setProperty('--primary-s', s);
            document.documentElement.style.setProperty('--primary-l', l);
        }
    }, [userData?.themeColor]);

    return userData?.themeColor || '263.4 70% 50.4%';
};
