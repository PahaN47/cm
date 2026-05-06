import { AuthState, useAuth } from '@/app/auth';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Form } from '@/shared/ui/Form';
import { Input } from '@/shared/ui/Input';
import { Layout } from '@/shared/ui/Layout';
import { validateRequired } from '@/widgets/control-panel/ui/forms/validators';
import { useCallback } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ThemeToggleButton } from '@/shared/ui/ThemeToggleButton';

import './AuthPage.scss';

const b = cn('AuthPage');

export const AuthPage = () => {
    const navigate = useNavigate();

    const { setLogin } = useAuth();

    const { control, register, handleSubmit } = useForm<Required<AuthState>>({
        defaultValues: { login: '' },
    });
    const { errors } = useFormState<Required<AuthState>>({
        control,
    });

    const onSubmit = useCallback(
        ({ login }: Required<AuthState>) => {
            setLogin(login);
            navigate('/');
        },
        [navigate, setLogin],
    );

    return (
        <Layout>
            <Layout.Panel row={[6, 7]} col={[4, 9]}>
                <Form className={b()} onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group className={b('group')}>
                        <Form.Field
                            label="Имя пользователя"
                            component={Input}
                            error={Boolean(errors.login)}
                            {...register('login', {
                                validate: validateRequired,
                            })}
                        />
                        <Button type="submit">Начать</Button>
                    </Form.Group>
                </Form>
            </Layout.Panel>
            <Layout.Panel
                row={[11, 12]}
                col={[1, 12]}
                style={{ display: 'flex', alignItems: 'center', padding: 16 }}
            >
                <ThemeToggleButton />
            </Layout.Panel>
        </Layout>
    );
};
