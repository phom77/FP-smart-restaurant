import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const CategoryManagement = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: '', description: '', sort_order: 0 });
    const [editingId, setEditingId] = useState(null); // ID of item being edited
    const [viewCategory, setViewCategory] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/categories`);
            setCategories(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('category.confirm_delete'))) return;
        try {
            await axios.delete(`${API_URL}/api/admin/categories/${id}`, getAuthHeader());
            fetchCategories();
            if (editingId === id) resetForm();
        } catch (err) {
            setError(t('category.failed_delete'));
        }
    };

    const handleEdit = (cat) => {
        setNewItem({
            name: cat.name,
            description: cat.description || '',
            sort_order: cat.sort_order
        });
        setEditingId(cat.id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };



    const handleView = (cat) => {
        setViewCategory(cat);
    };

    const closeView = () => {
        setViewCategory(null);
    };

    const getNextSortOrder = () => {
        if (categories.length === 0) return 1;
        const maxOrder = Math.max(...categories.map(c => c.sort_order || 0));
        return maxOrder + 1;
    };

    const resetForm = () => {
        setNewItem({ name: '', description: '', sort_order: getNextSortOrder() });
        setEditingId(null);
        setError('');
    };

    // Update sort order when categories load or when switching to Add mode
    useEffect(() => {
        if (!editingId && categories.length > 0) {
            setNewItem(prev => ({ ...prev, sort_order: getNextSortOrder() }));
        }
    }, [categories, editingId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingId) {
                // Update existing
                await axios.put(`${API_URL}/api/admin/categories/${editingId}`, newItem, getAuthHeader());
            } else {
                // Create new
                await axios.post(`${API_URL}/api/admin/categories`, newItem, getAuthHeader());
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.error || t('category.failed_save'));
        }
    };

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg relative">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">{t('category.title')}</h2>

            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className={`mb-8 p-4 md:p-6 border-2 rounded-2xl transition-colors ${editingId ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <h3 className={`text-lg font-bold ${editingId ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {editingId ? t('category.edit_title') : t('category.add_title')}
                    </h3>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors w-full md:w-auto">
                            {t('category.cancel_edit')}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* Name - Full Width */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('category.cat_name')}</label>
                        <input
                            type="text"
                            placeholder={t('category.cat_name')}
                            className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('category.description')}</label>
                        <textarea
                            placeholder={t('category.description')}
                            className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                            rows="3"
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className={`mt-4 w-full md:w-auto px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-white ${editingId
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                        }`}
                >
                    {editingId ? t('category.update') : t('category.save')}
                </button>
            </form>

            {/* List */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[600px] table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b text-left text-gray-600 font-semibold w-[20%]">{t('category.table_order')}</th>
                            <th className="p-4 border-b text-left text-gray-600 font-semibold w-[50%]">{t('category.table_name')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-[30%]">{t('category.table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat.id} className={`border-b hover:bg-gray-50 transition-colors last:border-b-0 ${editingId === cat.id ? 'bg-amber-50' : ''}`}>
                                <td className="p-4 border-b border-gray-100 text-left font-bold text-gray-500">
                                    <span className="bg-gray-100 px-3 py-1 rounded-lg">#{cat.sort_order}</span>
                                </td>
                                <td className="p-4 border-b border-gray-100 font-bold text-gray-800 text-lg">{cat.name}</td>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleView(cat)}
                                            className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            title={t('category.view')}
                                        >
                                            {t('category.view')}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                            title={t('category.edit')}
                                        >
                                            {t('category.edit')}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                            title={t('category.delete')}
                                        >
                                            {t('category.delete')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table >
            </div >

            {/* View Modal */}
            {
                viewCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeView}>
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 transform transition-all scale-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">
                                        {t('category.modal_title')}
                                    </h4>
                                    <h3 className="text-3xl font-extrabold text-gray-900">
                                        {viewCategory.name}
                                    </h3>
                                </div>
                                <button onClick={closeView} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 font-medium">{t('category.table_order')}</span>
                                        <span className="bg-emerald-100 text-emerald-800 text-xl font-bold px-4 py-2 rounded-xl">
                                            #{viewCategory.sort_order}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h5 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('category.description')}</h5>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {viewCategory.description || t('common.no_description')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { handleEdit(viewCategory); closeView(); }}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/30"
                                >
                                    {t('category.modal_edit')}
                                </button>
                                <button
                                    onClick={closeView}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                                >
                                    {t('category.modal_close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CategoryManagement;
