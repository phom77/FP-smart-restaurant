import { useTranslation } from 'react-i18next';

export default function ManageMenuPage() {
    const { t } = useTranslation();
    return <h1>{t('admin.manage_menu_title')}</h1>;
}
