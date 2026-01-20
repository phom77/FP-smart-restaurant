import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const ModifierManagement = () => {
    const { t } = useTranslation();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingModifier, setEditingModifier] = useState(null);
    const [activeGroupId, setActiveGroupId] = useState(null);

    const [groupData, setGroupData] = useState({ name: '', min_selection: 0, max_selection: 1 });
    const [modifierData, setModifierData] = useState({ name: '', price_modifier: 0, is_available: true });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/modifiers/groups`, getAuthHeader());
            if (res.data.success) {
                setGroups(res.data.data);
            }
        } catch (err) {
            console.error(err);
            toast.error(t('common.failed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/admin/modifiers/groups`, groupData, getAuthHeader());
            toast.success(t('common.save_success') || 'Saved');
            fetchGroups();
            setIsGroupModalOpen(false);
            setGroupData({ name: '', min_selection: 0, max_selection: 1 });
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/api/admin/modifiers/groups/${editingGroup.id}`, groupData, getAuthHeader());
            toast.success(t('common.save_success') || 'Updated');
            fetchGroups();
            setIsGroupModalOpen(false);
            setEditingGroup(null);
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm(t('common.confirm_delete') || 'Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/api/admin/modifiers/groups/${id}`, getAuthHeader());
            toast.success(t('common.delete_success') || 'Deleted');
            fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    const handleCreateModifier = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...modifierData, group_id: activeGroupId };
            await axios.post(`${API_URL}/api/admin/modifiers`, payload, getAuthHeader());
            toast.success(t('common.save_success') || 'Modifier Added');
            fetchGroups();
            setIsModifierModalOpen(false);
            setModifierData({ name: '', price_modifier: 0, is_available: true });
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    const handleUpdateModifier = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/api/admin/modifiers/${editingModifier.id}`, modifierData, getAuthHeader());
            toast.success(t('common.save_success') || 'Updated');
            fetchGroups();
            setIsModifierModalOpen(false);
            setEditingModifier(null);
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    const handleDeleteModifier = async (id) => {
        if (!window.confirm(t('common.confirm_delete') || 'Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/api/admin/modifiers/${id}`, getAuthHeader());
            toast.success(t('common.delete_success') || 'Deleted');
            fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    if (loading && groups.length === 0) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>;
    }

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t('modifiers.list_title')}</h2>
                <button
                    onClick={() => {
                        setEditingGroup(null);
                        setGroupData({ name: '', min_selection: 0, max_selection: 1 });
                        setIsGroupModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    {t('modifiers.add_group')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groups.map((group) => (
                    <div key={group.id} className="border-2 border-gray-100 rounded-2xl p-5 hover:border-emerald-100 transition-colors bg-gray-50/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                                <p className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-md border border-gray-100 inline-block mt-1">
                                    {t('modifiers.selection_hint', { min: group.min_selection, max: group.max_selection })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingGroup(group);
                                        setGroupData({ name: group.name, min_selection: group.min_selection, max_selection: group.max_selection });
                                        setIsGroupModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            {group.modifiers && group.modifiers.length > 0 ? (
                                group.modifiers.map((mod) => (
                                    <div key={mod.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${mod.is_available ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                                            <span className="font-semibold text-gray-700 text-sm">{mod.name}</span>
                                            {mod.price_modifier > 0 && (
                                                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-50 text-emerald-600 font-bold">
                                                    +{mod.price_modifier.toLocaleString()}đ
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingModifier(mod);
                                                    setModifierData({ name: mod.name, price_modifier: mod.price_modifier, is_available: mod.is_available });
                                                    setIsModifierModalOpen(true);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteModifier(mod.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-400 italic text-center py-4 bg-white/50 rounded-xl border border-dashed border-gray-200">
                                    {t('modifiers.no_options')}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setActiveGroupId(group.id);
                                setEditingModifier(null);
                                setModifierData({ name: '', price_modifier: 0, is_available: true });
                                setIsModifierModalOpen(true);
                            }}
                            className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            {t('modifiers.add_option')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Group Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-slideUp">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined">settings_input_component</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {editingGroup ? t('modifiers.edit_group') : t('modifiers.add_group')}
                            </h3>
                        </div>
                        <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{t('modifiers.group_name')}</label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-100 p-3.5 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all placeholder:text-gray-300"
                                    value={groupData.name}
                                    onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                                    placeholder={t('modifiers.placeholder_name')}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{t('modifiers.min_selection')}</label>
                                    <input
                                        type="number"
                                        className="w-full border-2 border-gray-100 p-3.5 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                                        value={groupData.min_selection}
                                        onChange={(e) => setGroupData({ ...groupData, min_selection: parseInt(e.target.value) })}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{t('modifiers.max_selection')}</label>
                                    <input
                                        type="number"
                                        className="w-full border-2 border-gray-100 p-3.5 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                                        value={groupData.max_selection}
                                        onChange={(e) => setGroupData({ ...groupData, max_selection: parseInt(e.target.value) })}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsGroupModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    {t('modifiers.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {t('modifiers.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modifier Modal */}
            {isModifierModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-slideUp">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined">add_task</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {editingModifier ? t('modifiers.edit_option') : t('modifiers.add_option')}
                            </h3>
                        </div>
                        <form onSubmit={editingModifier ? handleUpdateModifier : handleCreateModifier} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{t('modifiers.option_name')}</label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-100 p-3.5 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-300"
                                    value={modifierData.name}
                                    onChange={(e) => setModifierData({ ...modifierData, name: e.target.value })}
                                    placeholder={t('modifiers.placeholder_option')}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{t('modifiers.price_modifier')}</label>
                                <input
                                    type="number"
                                    className="w-full border-2 border-gray-100 p-3.5 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                    value={modifierData.price_modifier}
                                    onChange={(e) => setModifierData({ ...modifierData, price_modifier: parseFloat(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={modifierData.is_available}
                                    onChange={(e) => setModifierData({ ...modifierData, is_available: e.target.checked })}
                                    className="w-6 h-6 accent-blue-600 rounded-lg cursor-pointer"
                                />
                                <label htmlFor="isAvailable" className="text-sm font-bold text-gray-700 cursor-pointer">{t('modifiers.available')}</label>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModifierModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    {t('modifiers.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {t('modifiers.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModifierManagement;
