import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export interface AuthState {
    login?: string;
}

export interface AuthContextType extends AuthState {
    setLogin: (login: string) => void;
}

const AuthContext = createContext<AuthContextType>({ setLogin: () => {} });

const AUTH_STORAGE_KEY = 'auth';

const getAuthFromStorage = (): AuthState | null => {
    if (typeof window === 'undefined') return null;

    const auth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return auth as AuthState | null;
};

const setAuthInStorage = (auth: AuthState) => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
    const initialAuth = useMemo(() => {
        const auth = getAuthFromStorage();

        return auth ?? {};
    }, []);

    const [auth, setAuth] = useState<AuthState>(initialAuth);

    const handleAuth = useCallback((login: string) => {
        const safeLogin = `${login.trim()} (${crypto.randomUUID()})`;
        setAuth({ login: safeLogin });
        setAuthInStorage({ login: safeLogin });
    }, []);

    return (
        <AuthContext.Provider
            value={{ login: auth.login, setLogin: handleAuth }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;
