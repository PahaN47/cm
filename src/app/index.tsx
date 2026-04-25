import React from 'react';

import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';
import ThemeProvider from './theme';
import { ActivityLogProvider } from '@/features/activity-log';
import AuthProvider from './auth';
import { useMemo } from 'react';

import './styles/index.scss';

export function App() {
    /* eslint-disable react/jsx-key */
    return useMemo(
        () =>
            [
                <AuthProvider />,
                <ThemeProvider />,
                <Provider store={store}>{null}</Provider>,
                <ActivityLogProvider />,
            ].reduceRight(
                (prev, provider) => React.cloneElement(provider, {}, prev),
                <RouterProvider router={router} />,
            ),
        [],
    );
    /* eslint-enable react/jsx-key */
}
