import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Packages() {
  const { t } = useTranslation();
  return (
    <div className="container py-8 pb-4">
      <h1 className="text-2xl font-semibold">{t('common.packages', 'Packages')}</h1>
    </div>
  );
}
