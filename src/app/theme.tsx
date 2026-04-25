import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { cn } from '@/shared/lib/cn';

import './styles/theme.scss';

const b = cn('theme-provider');

export enum Theme {
    Light = 'light',
    Dark = 'dark',
}

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: Theme.Dark,
    setTheme: () => {},
});

export interface ThemeProviderProps {
    defaultTheme?: Theme;
    children?: React.ReactNode;
}

const THEME_STORAGE_KEY = 'theme';

const getThemeFromStorage = (): Theme | null => {
    if (typeof window === 'undefined') return null;

    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme as Theme | null;
};

const setThemeInStorage = (theme: Theme) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

const ThemeProvider = ({
    defaultTheme = Theme.Dark,
    children,
}: ThemeProviderProps) => {
    const initialTheme = useMemo(() => {
        const theme = getThemeFromStorage();
        return theme ?? defaultTheme;
    }, [defaultTheme]);

    const [theme, setTheme] = useState<Theme>(initialTheme);

    const handleSetTheme = useCallback((theme: Theme) => {
        setTheme(theme);
        setThemeInStorage(theme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
            <div className={b({ theme })}>{children}</div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

export default ThemeProvider;
