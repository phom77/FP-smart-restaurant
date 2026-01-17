import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const MenuManagement = () => {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true,
        is_chef_recommendation: false
    });
    const [imageFile, setImageFile] = useState(null);
    const [editingId, setEditingId] = useState(null); // ID being edited

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [itemRes, catRes] = await Promise.all([
                axios.get(`${API_URL}/api/menu/items`),
                axios.get(`${API_URL}/api/categories`)
            ]);
            setItems(itemRes.data.data);
            setCategories(catRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleImageUpload = async () => {
        if (!imageFile) return null;
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const res = await axios.post(`${API_URL}/api/admin/upload/image`, formData, {
                headers: {
                    ...getAuthHeader().headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data.data.url;
        } catch (err) {
            console.error('Upload failed', err);
            throw new Error('Image upload failed');
        }
    };

    const handleEdit = (item) => {
        setNewItem({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category_id: item.category_id,
            image_url: item.image_url || '',
            is_available: item.is_available,
            is_chef_recommendation: item.is_chef_recommendation || false
        });
        setEditingId(item.id);
        setImageFile(null); // Reset file input
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setNewItem({ name: '', description: '', price: '', category_id: '', image_url: '', is_available: true, is_chef_recommendation: false });
        setImageFile(null);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            let imageUrl = newItem.image_url;
            if (imageFile) {
                // If new file chosen, upload it
                imageUrl = await handleImageUpload();
            }

            const itemToSave = { ...newItem, image_url: imageUrl, price: parseFloat(newItem.price) };

            if (editingId) {
                // Update
                await axios.put(`${API_URL}/api/admin/menu-items/${editingId}`, itemToSave, getAuthHeader());
            } else {
                // Create
                await axios.post(`${API_URL}/api/admin/menu-items`, itemToSave, getAuthHeader());
            }

            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || err.message || t('menu.failed_save'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('menu.confirm_delete'))) return;
        try {
            await axios.delete(`${API_URL}/api/admin/menu-items/${id}`, getAuthHeader());
            fetchData();
            if (editingId === id) resetForm();
        } catch (err) {
            setError(t('menu.failed_delete'));
        }
    };

    const [viewItem, setViewItem] = useState(null);

    const handleView = (item) => {
        setViewItem(item);
    };

    const closeView = () => {
        setViewItem(null);
    };

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg relative">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">{t('menu.title')}</h2>

            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className={`mb-8 p-4 md:p-6 border-2 rounded-2xl transition-colors ${editingId ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <h3 className={`text-lg font-bold ${editingId ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {editingId ? t('menu.edit_title') : t('menu.add_title')}
                    </h3>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors w-full md:w-auto">
                            {t('menu.cancel_edit')}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder={t('menu.item_name')}
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                        value={newItem.name}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder={t('menu.price')}
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                        value={newItem.price}
                        onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                        required
                    />
                    <select
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                        value={newItem.category_id}
                        onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                        required
                    >
                        <option value="">{t('menu.select_category')}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    {/* Availability Toggle */}
                    <div className="flex items-center space-x-2 border-2 border-gray-200 p-3 rounded-xl bg-white w-full">
                        <input
                            type="checkbox"
                            checked={newItem.is_available}
                            onChange={e => setNewItem({ ...newItem, is_available: e.target.checked })}
                            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <label className="text-sm font-semibold text-gray-600">{t('menu.available')}</label>
                    </div>

                    {/* Chef Recommendation Toggle */}
                    <div className="flex items-center space-x-2 border-2 border-gray-200 p-3 rounded-xl bg-white w-full">
                        <input
                            type="checkbox"
                            checked={newItem.is_chef_recommendation}
                            onChange={e => setNewItem({ ...newItem, is_chef_recommendation: e.target.checked })}
                            className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                        />
                        <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                            <span>👨‍🍳</span>
                            <span>Chef's Choice</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-4 border-2 border-gray-200 p-2.5 rounded-xl bg-white col-span-1 md:col-span-2 w-full">
                        <span className="text-sm font-semibold text-gray-600 whitespace-nowrap pl-1">{t('menu.image')}:</span>

                        <label className="cursor-pointer bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-300">
                            {t('menu.choose_file')}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    if (e.target.files[0]) setImageFile(e.target.files[0]);
                                }}
                                className="hidden"
                            />
                        </label>

                        <span className="text-sm text-gray-500 italic truncate flex-1">
                            {imageFile ? imageFile.name : (newItem.image_url ? t('menu.current_image') : t('menu.no_file'))}
                        </span>

                        {(newItem.image_url || imageFile) && (
                            <div className="flex items-center gap-2">
                                {newItem.image_url && !imageFile && (
                                    <img src={newItem.image_url} alt="Current" className="h-9 w-9 object-cover rounded-lg shadow-sm border border-gray-100" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        if (!imageFile) setNewItem({ ...newItem, image_url: '' });
                                    }}
                                    className="bg-red-50 text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                                    title="Remove Image"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    <textarea
                        placeholder={t('menu.description')}
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors col-span-1 md:col-span-2 w-full"
                        rows="3"
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    />
                </div>
                <button
                    type="submit"
                    className={`mt-4 w-full md:w-auto px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-white ${editingId
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                        }`}
                >
                    {editingId ? t('menu.update') : t('menu.save')}
                </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-32">{t('menu.table_image')}</th>
                            <th className="p-4 border-b text-left text-gray-600 font-semibold">{t('menu.table_name')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-40">{t('menu.table_category')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-32">{t('menu.table_price')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-32">{t('menu.table_status')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-32">Chef's Choice</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-56">{t('menu.table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className={`border-b hover:bg-gray-50 transition-colors last:border-b-0 ${editingId === item.id ? 'bg-amber-50' : ''}`}>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex justify-center">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="h-14 w-14 object-cover rounded-xl shadow-sm" />
                                        ) : (
                                            <span className="text-gray-300 text-xs">No Image</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 border-b border-gray-100 font-bold text-gray-800 text-lg">{item.name}</td>
                                <td className="p-4 border-b border-gray-100 text-center">
                                    <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-sm font-medium">
                                        {item.category?.name || '-'}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-gray-100 text-center text-emerald-600 font-bold text-base">
                                    {item.price.toLocaleString()}đ
                                </td>
                                <td className="p-4 border-b border-gray-100 text-center">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.is_available ? t('menu.active') : t('menu.hidden')}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-gray-100 text-center">
                                    {item.is_chef_recommendation ? (
                                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 flex items-center gap-1 justify-center">
                                            <span>👨‍🍳</span>
                                            <span>Yes</span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleView(item)}
                                            className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            title={t('menu.view')}
                                        >
                                            {t('menu.view')}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                            title={t('menu.edit')}
                                        >
                                            {t('menu.edit')}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                            title={t('menu.delete')}
                                        >
                                            {t('menu.delete')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {viewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeView}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[90vh] md:h-[75vh] flex flex-col overflow-hidden animate-fade-in border border-gray-100" onClick={e => e.stopPropagation()}>

                        {/* 1. Header Image Section (Mobile: 35%, Desktop: 45%) */}
                        <div className="relative h-[35%] md:h-[45%] shrink-0 group">
                            <img
                                src={viewItem.image_url || 'https://via.placeholder.com/800x600?text=No+Image'}
                                alt={viewItem.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                            {/* Close Button (Floating) */}
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={closeView}
                                    className="bg-white text-black hover:bg-gray-100 rounded-full p-2.5 shadow-lg transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Title & Category Badge */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div>
                                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-500/90 text-white backdrop-blur-sm mb-3 shadow-lg border border-white/20">
                                            {viewItem.category?.name || t('menu.modal_uncategorized')}
                                        </span>
                                        <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight">
                                            {viewItem.name}
                                        </h3>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <div className="text-3xl md:text-4xl font-black text-emerald-400 drop-shadow-sm">
                                            {viewItem.price.toLocaleString()}đ
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Content Body */}
                        <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-white flex flex-col relative">
                            {/* Status and Details */}
                            <div className="flex items-center gap-4 mb-6 md:mb-8">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${viewItem.is_available ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${viewItem.is_available ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="font-bold text-sm uppercase tracking-wide">
                                        {viewItem.is_available ? t('menu.modal_available') : t('menu.modal_unavailable')}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex-1">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    <span className="w-8 h-[2px] bg-emerald-500/50"></span>
                                    {t('menu.modal_desc_label')}
                                </h4>
                                <p className="text-gray-600 leading-relaxed text-base md:text-lg font-light text-justify">
                                    {viewItem.description || t('menu.modal_desc_empty')}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => { handleEdit(viewItem); closeView(); }}
                                    className="flex-1 group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-1 rounded-2xl shadow-lg transition-all"
                                >
                                    <div className="bg-transparent h-full w-full rounded-xl flex items-center justify-center gap-2 py-3">
                                        <span className="font-bold text-base md:text-lg tracking-wide">{t('menu.modal_edit')}</span>
                                    </div>
                                </button>
                                <button
                                    onClick={closeView}
                                    className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-800 rounded-2xl font-bold py-3 md:py-4 text-base md:text-lg transition-all"
                                >
                                    {t('menu.modal_close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
