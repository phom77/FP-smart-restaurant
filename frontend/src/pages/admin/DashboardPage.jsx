import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
    const { t } = useTranslation();
    return <h1>{t('admin.dashboard_title')}</h1>;
}
