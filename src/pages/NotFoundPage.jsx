import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="not-found-page fade-in">
      <div className="not-found-content glass">
        <div className="error-code">404</div>
        <div className="error-icon-wrapper">
          <AlertTriangle size={60} className="error-icon" />
          <div className="glow-effect"></div>
        </div>
        <h1>{t('page_not_found', 'Sahifa topilmadi')}</h1>
        <p>
          {t('not_found_desc', 'Siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko\'chirilgan.')}
        </p>
        <div className="not-found-actions">
          <button className="btn-secondary glass" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>{t('back', 'Orqaga')}</span>
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>
            <Home size={18} />
            <span>{t('home', 'Asosiy sahifa')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
