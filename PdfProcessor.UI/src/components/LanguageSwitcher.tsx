import { useLocale } from '../context/LocaleContext';
import foFlag from '../assets/flags/fo.svg';
import gbFlag from '../assets/flags/gb.svg';

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLocale();

  const buttonClasses = `flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors text-xs`;
  const activeClasses = 'bg-primary text-primary-foreground';
  const inactiveClasses = 'hover:bg-muted';

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setLocale('fo')}
        className={`${buttonClasses} ${
          locale === 'fo' ? activeClasses : inactiveClasses
        }`}
        title="Føroyskt"
      >
        <img 
          src={foFlag} 
          alt="Faroese flag" 
          className="w-4 h-3 rounded"
        />
        <span className="hidden sm:inline">Føroyskt</span>
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`${buttonClasses} ${
          locale === 'en' ? activeClasses : inactiveClasses
        }`}
        title="English"
      >
        <img 
          src={gbFlag} 
          alt="UK flag" 
          className="w-4 h-3 rounded"
        />
        <span className="hidden sm:inline">English</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher; 