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

interface HomePageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export const HomePage = ({ onNavigate, onLogout }: HomePageProps) => {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <Header onLogout={onLogout} />
      <div className="max-w-[600px] mx-auto px-6 py-8">
        <h1 className="text-[32px] font-bold text-[#1d1d1f] text-center mb-8">
          Welcome!
        </h1>
        <div className="flex flex-col gap-0">
          <MenuButton
            icon={FiUser}
            label="Agent Info"
            onClick={() => onNavigate('agent-info')}
          />
          <MenuButton
            icon={FiMessageSquare}
            label="Quick Quote"
            onClick={() => onNavigate('quick-quote')}
          />
          <MenuButton
            icon={FiMessageSquare}
            label="Quote life"
            onClick={() => onNavigate('quote-life')}
          />
          <MenuButton
            icon={FiMail}
            label="Quotes Mailbox"
            onClick={() => onNavigate('quotes-mailbox')}
          />
          <MenuButton
            icon={FiFileText}
            label="Illustration History"
            onClick={() => onNavigate('illustration-history')}
          />
          <MenuButton
            icon={FiFile}
            label="Generate Mock PDF"
            onClick={() => onNavigate('generate-pdf')}
          />
        </div>
      </div>
    </div>
  );
};

