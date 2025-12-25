import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Тут можна додати валідацію та логіку авторизації
    if (!email || !password) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    // Тимчасово просто перенаправляємо на головну сторінку
    // Пізніше можна додати реальну авторизацію
    navigate({ to: '/home' });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo та Welcome */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                N
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#1d1d1f] mb-2">
              Welcome To NFL
            </h1>
            <p className="text-[#6e6e73] text-sm">
              National FARM • LIFE
            </p>
          </div>

          {/* Форма логіну */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="Введіть ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FormField
              label="Password"
              name="password"
              type="password"
              placeholder="Введіть пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth>
              Увійти
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

