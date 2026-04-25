import { createBrowserRouter } from 'react-router-dom';
import { AuthPage, HomePage } from '@/pages/home';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <HomePage />,
    },
    {
        path: '/auth',
        element: <AuthPage />,
    },
]);
