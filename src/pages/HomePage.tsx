import { useNavigate } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { MenuButton } from '../components/MenuButton';
import { OfflineIndicator } from '../components/OfflineIndicator';
import {
  FiUser,
  FiMessageSquare,
  FiMail,
  FiFileText,
  FiFile,
} from 'react-icons/fi';

export const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Очистити дані сесії (якщо є)
    localStorage.removeItem('agentInfo');
    // Перенаправити на сторінку логіну
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <Header onLogout={handleLogout} />
      <div className="max-w-[600px] mx-auto px-6 py-8">
        <h1 className="text-[32px] font-bold text-[#1d1d1f] text-center mb-8">
          Welcome!
        </h1>
        <div className="flex flex-col gap-0">
          <MenuButton
            icon={FiUser}
            label="Agent Info"
            onClick={() => navigate({ to: '/agent-info' })}
          />
          <MenuButton
            icon={FiMessageSquare}
            label="Quick Quote"
            onClick={() => navigate({ to: '/quick-quote' as any })}
          />
          <MenuButton
            icon={FiMessageSquare}
            label="Quote life"
            onClick={() => navigate({ to: '/quote-life' as any })}
          />
          <MenuButton
            icon={FiMail}
            label="Quotes Mailbox"
            onClick={() => navigate({ to: '/quotes-mailbox' as any })}
          />
          <MenuButton
            icon={FiFileText}
            label="Illustration History"
            onClick={() => navigate({ to: '/illustration-history' as any })}
          />
          <MenuButton
            icon={FiFile}
            label="Generate Mock PDF"
            onClick={() => navigate({ to: '/generate-pdf' as any })}
          />
        </div>
      </div>
    </div>
  );
};

