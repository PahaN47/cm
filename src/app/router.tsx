import { createHashRouter } from 'react-router-dom';
import { AuthPage, HomePage } from '@/pages/home';

/** Hash routing so static builds work when opening `index.html` (file:// or `/index.html` on a static server). */
export const router = createHashRouter([
    {
        path: '/',
        element: <HomePage />,
    },
    {
        path: '/auth',
        element: <AuthPage />,
    },
]);
