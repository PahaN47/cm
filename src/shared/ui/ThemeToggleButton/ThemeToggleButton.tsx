import { Theme, useTheme } from '@/app/theme';

import { Button } from '@/shared/ui/Button';

export const ThemeToggleButton = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            onClick={() =>
                setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light)
            }
        >
            Тема
        </Button>
    );
};
