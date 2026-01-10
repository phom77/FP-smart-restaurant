import { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: '', image_url: '', sort_order: 0 });
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
        if (!window.confirm("Delete this category?")) return;
        try {
            await axios.delete(`${API_URL}/api/admin/categories/${id}`, getAuthHeader());
            fetchCategories();
            if (editingId === id) resetForm();
        } catch (err) {
            setError('Failed to delete category');
        }
    };

    const handleEdit = (cat) => {
        setNewItem({
            name: cat.name,
            image_url: cat.image_url || '',
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

    const resetForm = () => {
        setNewItem({ name: '', image_url: '', sort_order: 0 });
        setEditingId(null);
        setError('');
    };

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
            setError(err.response?.data?.error || 'Failed to save category');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg relative">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">Category Management</h2>

            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className={`mb-8 p-4 md:p-6 border-2 rounded-2xl transition-colors ${editingId ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <h3 className={`text-lg font-bold ${editingId ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {editingId ? 'Edit Category' : '✨ Add New Category'}
                    </h3>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors w-full md:w-auto">
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Category Name"
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                        value={newItem.name}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Image URL (Optional)"
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                        value={newItem.image_url}
                        onChange={e => setNewItem({ ...newItem, image_url: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Sort Order"
                        className="border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors w-full"
                        value={newItem.sort_order}
                        onChange={e => setNewItem({ ...newItem, sort_order: parseInt(e.target.value) || 0 })}
                    />
                </div>
                <button
                    type="submit"
                    className={`mt-4 w-full md:w-auto px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-white ${editingId
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                        }`}
                >
                    {editingId ? '💾 Update Category' : '+ Add Category'}
                </button>
            </form>

            {/* List */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[600px] table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b text-left text-gray-600 font-semibold w-[15%]">Order</th>
                            <th className="p-4 border-b text-left text-gray-600 font-semibold w-[30%]">Name</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-[30%]">Image</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold w-[25%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat.id} className={`border-b hover:bg-gray-50 transition-colors last:border-b-0 ${editingId === cat.id ? 'bg-amber-50' : ''}`}>
                                <td className="p-4 border-b border-gray-100 text-left font-bold text-gray-500">
                                    <span className="bg-gray-100 px-3 py-1 rounded-lg">#{cat.sort_order}</span>
                                </td>
                                <td className="p-4 border-b border-gray-100 font-bold text-gray-800 text-lg">{cat.name}</td>
                                <td className="p-4 border-b border-gray-100 text-center">
                                    <div className="flex justify-center items-center h-full">
                                        {cat.image_url ? (
                                            <img src={cat.image_url} alt={cat.name} className="h-12 w-12 object-cover rounded-lg shadow-sm" />
                                        ) : (
                                            <span className="text-gray-300 text-xs">No Image</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleView(cat)}
                                            className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="View"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Edit"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Delete"
                                        >
                                            Delete
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
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl h-[80vh] md:h-[65vh] flex flex-col overflow-hidden animate-fade-in border border-gray-100" onClick={e => e.stopPropagation()}>

                            {/* 1. Header Image (Mobile: 35%, Desktop: 45%) */}
                            <div className="relative h-[35%] md:h-[45%] shrink-0 group">
                                <img
                                    src={viewCategory.image_url || 'https://via.placeholder.com/800x600?text=No+Image'}
                                    alt={viewCategory.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                                <div className="absolute top-4 right-4 z-10">
                                    <button onClick={closeView} className="bg-white text-black hover:bg-gray-100 rounded-full p-2.5 shadow-lg transition-all">
                                        ✕
                                    </button>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-end gap-3 mb-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold text-black bg-white/90 backdrop-blur-sm shadow-sm uppercase tracking-wider">
                                            Order #{viewCategory.sort_order}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                        {viewCategory.name}
                                    </h3>
                                </div>
                            </div>

                            {/* 2. Content */}
                            <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-white flex flex-col">
                                <div className="flex-1">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                        <span className="w-8 h-[2px] bg-emerald-500/50"></span>
                                        Category Details
                                    </h4>
                                    <p className="text-gray-500 font-light text-base md:text-lg">
                                        This category contains items that appear at position <strong className="text-gray-800 font-bold">#{viewCategory.sort_order}</strong> in the public menu.
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-auto border-t border-gray-100 pt-6">
                                    <button
                                        onClick={() => { handleEdit(viewCategory); closeView(); }}
                                        className="flex-1 group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-1 rounded-2xl shadow-lg transition-all"
                                    >
                                        <div className="bg-transparent h-full w-full rounded-xl flex items-center justify-center gap-2 py-3">
                                            <span className="font-bold text-base md:text-lg tracking-wide">Edit Category</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={closeView}
                                        className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-800 rounded-2xl font-bold py-3 md:py-4 text-base md:text-lg transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CategoryManagement;
