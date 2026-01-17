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
    const [imageFiles, setImageFiles] = useState([]); // Array of new files
    const [previewImages, setPreviewImages] = useState([]); // Previews for new files
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
            const timestamp = Date.now();
            const [itemRes, catRes] = await Promise.all([
                axios.get(`${API_URL}/api/menu/items?limit=100&t=${timestamp}`),
                axios.get(`${API_URL}/api/categories?t=${timestamp}`)
            ]);
            console.log('Fetched items count:', itemRes.data.data.length);
            setItems(itemRes.data.data);
            setCategories(catRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleImageUpload = async () => {
        if (!imageFiles || imageFiles.length === 0) return [];

        const formData = new FormData();
        Array.from(imageFiles).forEach((file) => {
            formData.append('images', file);
        });

        try {
            const res = await axios.post(`${API_URL}/api/admin/upload/images`, formData, {
                headers: {
                    ...getAuthHeader().headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data.data.urls;
        } catch (err) {
            console.error('Upload failed', err);
            throw new Error('Image upload failed');
        }
    };

    const handleEdit = (item) => {
        console.log('Editing item:', item);
        setNewItem({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category_id: item.category_id,
            image_url: item.image_url || '',
            images: Array.isArray(item.images) ? item.images : [], // Validate array
            is_available: item.is_available,
            is_chef_recommendation: item.is_chef_recommendation || false
        });
        setEditingId(item.id);
        setImageFiles([]); // Reset file input
        setPreviewImages([]);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setNewItem({ name: '', description: '', price: '', category_id: '', image_url: '', images: [], is_available: true, is_chef_recommendation: false });
        setImageFiles([]);
        setPreviewImages([]);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            let uploadedUrls = [];
            if (imageFiles.length > 0) {
                // If new files chosen, upload them
                uploadedUrls = await handleImageUpload();
            }

            // Combine existing images (if they are URLs in newItem.images) with new uploaded URLs
            // Note: newItem.images might contain existing URLs
            const finalImages = [...(newItem.images || []), ...uploadedUrls];

            // Set primary image if not set
            let primaryImageUrl = newItem.image_url;
            if (!primaryImageUrl && finalImages.length > 0) {
                primaryImageUrl = finalImages[0];
            }
            // If primary image was removed but we have other images, pick the first one
            if (primaryImageUrl === '' && finalImages.length > 0) {
                primaryImageUrl = finalImages[0];
            }

            const itemToSave = { ...newItem, image_url: primaryImageUrl, images: finalImages, price: parseFloat(newItem.price) };

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
        console.log('Deleting item ID:', id);
        if (!window.confirm(t('menu.confirm_delete'))) return;
        try {
            await axios.delete(`${API_URL}/api/admin/menu-items/${id}`, getAuthHeader());
            console.log('Delete successful');
            fetchData();
            if (editingId === id) resetForm();
        } catch (err) {
            console.error('Delete failed:', err);
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
                    {/* Name - Full Width */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('menu.item_name')}</label>
                        <input
                            type="text"
                            placeholder={t('menu.item_name')}
                            className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('menu.price')}</label>
                        <input
                            type="number"
                            placeholder={t('menu.price')}
                            className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                            value={newItem.price}
                            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('menu.select_category')}</label>
                        <div className="relative">
                            <select
                                className="appearance-none border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full bg-white pr-10"
                                value={newItem.category_id}
                                onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                                required
                            >
                                <option value="">{t('menu.select_category')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Toggles Container */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
                        {/* Availability Toggle */}
                        <div
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${newItem.is_available ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                            onClick={() => setNewItem({ ...newItem, is_available: !newItem.is_available })}
                        >
                            <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newItem.is_available ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'}`}>
                                    {newItem.is_available && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`font-bold ${newItem.is_available ? 'text-emerald-700' : 'text-gray-600'}`}>{t('menu.available')}</span>
                            </label>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${newItem.is_available ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${newItem.is_available ? 'translate-x-6' : ''}`} />
                            </div>
                        </div>

                        {/* Chef Recommendation Toggle */}
                        <div
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${newItem.is_chef_recommendation ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                            onClick={() => setNewItem({ ...newItem, is_chef_recommendation: !newItem.is_chef_recommendation })}
                        >
                            <label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newItem.is_chef_recommendation ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'}`}>
                                    {newItem.is_chef_recommendation && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`font-bold ${newItem.is_chef_recommendation ? 'text-emerald-700' : 'text-gray-600'}`}>{t('menu.chefs_choice')}</span>
                            </label>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${newItem.is_chef_recommendation ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${newItem.is_chef_recommendation ? 'translate-x-6' : ''}`} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 border-2 border-gray-100 shadow-sm p-6 rounded-xl bg-white col-span-1 md:col-span-2 w-full">
                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
                            <div className="flex-1">
                                <span className="block text-sm font-bold text-gray-700 mb-1">{t('menu.image')}</span>
                                <p className="text-xs text-gray-500">{t('menu.image_help')}</p>
                            </div>

                            <label className="cursor-pointer bg-emerald-50 text-emerald-600 font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-100 transition-all text-sm border-2 border-emerald-100 hover:border-emerald-200 shadow-sm flex items-center gap-2 active:scale-95">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {t('menu.choose_file')}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={e => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const files = Array.from(e.target.files);
                                            setImageFiles(prev => [...prev, ...files]);

                                            // Create previews
                                            const newPreviews = files.map(file => URL.createObjectURL(file));
                                            setPreviewImages(prev => [...prev, ...newPreviews]);

                                            // Reset input 
                                            e.target.value = '';
                                        }
                                    }}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Image Gallery / Previews */}
                        <div className="flex flex-wrap gap-3 mt-2">
                            {/* Existing Images */}
                            {newItem.images && newItem.images.length > 0 && newItem.images.map((imgUrl, idx) => (
                                <div key={`exist-${idx}`} className="relative group">
                                    <img src={imgUrl} alt="Existing" className={`h-20 w-20 object-cover rounded-lg shadow-sm border ${newItem.image_url === imgUrl ? 'border-emerald-500 border-2' : 'border-gray-100'}`} />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newImages = newItem.images.filter((_, i) => i !== idx);
                                            let newPrimary = newItem.image_url;
                                            if (newItem.image_url === imgUrl) {
                                                newPrimary = newImages.length > 0 ? newImages[0] : '';
                                            }
                                            setNewItem({ ...newItem, images: newImages, image_url: newPrimary });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    {newItem.image_url === imgUrl && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-emerald-500/80 text-white text-[10px] text-center font-bold">Main</span>
                                    )}
                                    {newItem.image_url !== imgUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, image_url: imgUrl })}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Set Main
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* New File Previews */}
                            {previewImages.map((preview, idx) => (
                                <div key={`new-${idx}`} className="relative group">
                                    <img src={preview} alt="New Preview" className="h-20 w-20 object-cover rounded-lg shadow-sm border border-blue-200" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newFiles = imageFiles.filter((_, i) => i !== idx);
                                            const newPreviews = previewImages.filter((_, i) => i !== idx);
                                            setImageFiles(newFiles);
                                            setPreviewImages(newPreviews);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-[10px] text-center font-bold">New</div>
                                </div>
                            ))}
                        </div>
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
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-32">{t('menu.chefs_choice')}</th>
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
                                            <span>{t('common.yes')}</span>
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
                                src={viewItem.currentImage || viewItem.image_url || 'https://via.placeholder.com/800x600?text=No+Image'}
                                alt={viewItem.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                            {/* Image Navigation Buttons */}
                            {viewItem.images && viewItem.images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const current = viewItem.currentImage || viewItem.image_url;
                                            const idx = viewItem.images.indexOf(current);
                                            const prevIdx = (idx - 1 + viewItem.images.length) % viewItem.images.length;
                                            setViewItem({ ...viewItem, currentImage: viewItem.images[prevIdx] });
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const current = viewItem.currentImage || viewItem.image_url;
                                            const idx = viewItem.images.indexOf(current);
                                            const nextIdx = (idx + 1) % viewItem.images.length;
                                            setViewItem({ ...viewItem, currentImage: viewItem.images[nextIdx] });
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </>
                            )}

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

                            {/* Image Gallery Thumbnails */}
                            {viewItem.images && viewItem.images.length > 1 && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Gallery</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {viewItem.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setViewItem({ ...viewItem, currentImage: img })}
                                                className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${(viewItem.currentImage || viewItem.image_url) === img
                                                    ? 'border-emerald-500 opacity-100 ring-2 ring-emerald-200'
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

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
