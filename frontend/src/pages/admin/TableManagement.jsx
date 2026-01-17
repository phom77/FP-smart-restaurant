import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';

const TableManagement = () => {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [sortBy, setSortBy] = useState('table_number');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [newTable, setNewTable] = useState({
        table_number: '',
        capacity: 2,
        location: 'Indoor',
        description: ''
    });
    const [editData, setEditData] = useState({ table_number: '', capacity: 4, status: 'available', location: '', description: '' });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')} ` }
    });

    const fetchTables = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/api/admin/tables?sort_by=${sortBy}`;
            if (filterLocation) url += `&location=${filterLocation}`;

            const response = await axios.get(url, getAuthHeader());
            setTables(response.data.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to fetch tables');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, [filterLocation, sortBy]);

    const handleCreateTable = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/admin/tables`, newTable, getAuthHeader());
            toast.success('Table created successfully');
            fetchTables();
            setIsAddModalOpen(false);
            setNewTable({ table_number: '', capacity: 2, location: 'Indoor', description: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create table');
        }
    };

    const handleUpdateTable = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/api/admin/tables/${selectedTable.id}`, editData, getAuthHeader());
            toast.success('Table updated successfully');
            fetchTables();
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error('Failed to update table');
        }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm(t('table.confirm_delete'))) return;
        try {
            await axios.delete(`${API_URL}/api/admin/tables/${id}`, getAuthHeader());
            toast.success('Table deleted');
            fetchTables();
        } catch (err) {
            toast.error('Failed to delete table');
        }
    };

    const handlePrint = async (table) => {
        try {
            const frontendUrl = window.location.origin;
            const scanUrl = `${frontendUrl}/menu?table=${table.id}&table_number=${encodeURIComponent(table.table_number)}&token=${table.qr_code_token}`;
            const qrImage = await QRCode.toDataURL(scanUrl, { margin: 1, scale: 10 });

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Table ${table.table_number} QR</title>
                        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                        <style>
                            @page { size: auto; margin: 0; }
                            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            
                            html, body { 
                                margin: 0 !important; 
                                padding: 0 !important; 
                                font-family: 'Plus Jakarta Sans', sans-serif;
                                background: #ffffff;
                                height: 100vh;
                                width: 100vw;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                overflow: hidden;
                            }

                            .wrapper {
                                width: 100%;
                                max-width: 400px;
                                text-align: center;
                                padding: 40px;
                                position: relative;
                            }

                            .brand-title {
                                font-size: 24px;
                                font-weight: 800;
                                color: #6366f1;
                                letter-spacing: -0.5px;
                                margin-bottom: 8px;
                            }

                            .brand-subtitle {
                                color: #94a3b8;
                                font-size: 10px;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 1.5px;
                                margin-bottom: 40px;
                            }

                            .table-label {
                                font-size: 14px;
                                font-weight: 700;
                                color: #1e293b;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                margin-bottom: 4px;
                            }

                            .table-number {
                                font-size: 80px;
                                font-weight: 800;
                                color: #6366f1;
                                line-height: 1;
                                margin-bottom: 40px;
                            }

                            .qr-container {
                                background: white;
                                padding: 12px;
                                border: 1px solid #f1f5f9;
                                border-radius: 24px;
                                display: inline-block;
                                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                                margin-bottom: 40px;
                            }

                            .qr-image {
                                display: block;
                                width: 200px;
                                height: 200px;
                            }

                            .instructions {
                                color: #1e293b;
                                font-size: 18px;
                                font-weight: 800;
                                margin-bottom: 8px;
                            }

                            .instruction-steps {
                                color: #64748b;
                                font-size: 11px;
                                font-weight: 600;
                            }

                            @media print { 
                                body { background: white !important; }
                                .no-print { display: none !important; }
                            }
                            
                            .print-btn {
                                position: fixed;
                                top: 20px;
                                right: 20px;
                                background: #6366f1;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 12px;
                                font-weight: 700;
                                cursor: pointer;
                                z-index: 100;
                                font-family: inherit;
                                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                            }
                        </style>
                    </head>
                    <body>
                        <button class="no-print print-btn" onclick="window.print()">Print This QR</button>
                        <div class="wrapper">
                            <div class="brand-title">SMART RESTAURANT</div>
                            <div class="brand-subtitle">Contactless Ordering System</div>
                            
                            <div class="table-label">Table</div>
                            <div class="table-number">${table.table_number}</div>

                            <div class="qr-container">
                                <img src="${qrImage}" class="qr-image" />
                            </div>

                            <div class="instructions">SCAN TO ORDER</div>
                            <div class="instruction-steps">1. Open Camera  |  2. Scan QR  |  3. Enjoy</div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            toast.error('Failed to prepare print preview');
        }
    };

    const handleDownloadPDF = async (id, tableNumber) => {
        try {
            const response = await axios({
                url: `${API_URL}/api/admin/tables/${id}/qr/download?format=pdf`,
                method: 'GET',
                responseType: 'blob',
                ...getAuthHeader()
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Table_${tableNumber}_QR.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download PDF');
        }
    };

    const handleDownloadAll = async () => {
        if (!window.confirm(t('table.batch_zip_confirm'))) return;
        try {
            toast.loading('Generating ZIP...', { id: 'zip' });
            const response = await axios({
                url: `${API_URL}/api/admin/tables/qr/download-all`,
                method: 'GET',
                responseType: 'blob',
                ...getAuthHeader()
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `All_Tables_QR_Codes.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ZIP file downloaded successfully', { id: 'zip' });
        } catch (err) {
            toast.error('Failed to download ZIP', { id: 'zip' });
        }
    };

    const handleDownloadAllPDF = async () => {
        if (!window.confirm(t('table.batch_pdf_confirm'))) return;
        try {
            toast.loading('Generating Bulk PDF...', { id: 'pdf-bulk' });
            const response = await axios({
                url: `${API_URL}/api/admin/tables/qr/download-all-pdf`,
                method: 'GET',
                responseType: 'blob',
                ...getAuthHeader()
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `All_Tables_QR_Print.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Bulk PDF downloaded successfully', { id: 'pdf-bulk' });
        } catch (err) {
            toast.error('Failed to download Bulk PDF', { id: 'pdf-bulk' });
        }
    };

    const handleDownloadPNG = async (id, tableNumber) => {
        try {
            const response = await axios({
                url: `${API_URL}/api/admin/tables/${id}/qr/download?format=png`,
                method: 'GET',
                responseType: 'blob',
                ...getAuthHeader()
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Table_${tableNumber}_QR.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download PNG');
        }
    };

    const handleRegenerateQR = async (id) => {
        if (!window.confirm(t('table.confirm_regenerate'))) return;
        try {
            await axios.post(`${API_URL}/api/admin/tables/${id}/qr/generate`, {}, getAuthHeader());
            toast.success('QR Code refreshed');
            fetchTables();
        } catch (err) {
            toast.error('Failed to regenerate QR');
        }
    };

    const handleRegenerateAllQR = async () => {
        if (!window.confirm(t('table.regenerate_all_confirm'))) return;
        try {
            const response = await axios.post(`${API_URL}/api/admin/tables/qr/regenerate-all`, {}, getAuthHeader());
            toast.success(response.data.message || 'All QR Codes refreshed successfully');
            fetchTables();
        } catch (err) {
            toast.error('Failed to regenerate all QRs');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.patch(`${API_URL}/api/admin/tables/${id}/status`, { status }, getAuthHeader());
            toast.success(`Table marked as ${status}`);
            fetchTables();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const filteredTables = tables.filter(t =>
    (t.table_number.toString().includes(searchQuery) ||
        (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{t('table.title')}</h2>
                        <p className="text-gray-500 text-sm">{t('table.subtitle')}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleDownloadAll}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                title={t('table.batch_zip')}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                <span className="hidden sm:inline">{t('table.batch_zip')}</span>
                                <span className="sm:hidden">ZIP</span>
                            </button>
                            <button
                                onClick={handleDownloadAllPDF}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                title={t('table.batch_pdf')}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <span className="hidden sm:inline">{t('table.batch_pdf')}</span>
                                <span className="sm:hidden">PDF</span>
                            </button>
                            <button
                                onClick={handleRegenerateAllQR}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100 text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                {t('table.qr_all')}
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setNewTable({ table_number: '', capacity: 2, location: 'Indoor', description: '' });
                                setIsAddModalOpen(true);
                            }}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all shadow-emerald-100 whitespace-nowrap"
                        >
                            {t('table.add_table')}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-gray-50">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-full lg:w-auto lg:flex-1">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder={t('table.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm h-full"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                        </div>
                        <div className="w-[1px] bg-gray-200 my-1"></div>
                        <button
                            onClick={fetchTables}
                            className="px-3 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            title="Refresh Data"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer whitespace-nowrap min-w-[140px]"
                        >
                            <option value="">{t('table.all_locations')}</option>
                            <option value="Indoor">Indoor</option>
                            <option value="Outdoor">Outdoor</option>
                            <option value="Patio">Patio</option>
                            <option value="VIP Room">VIP Room</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer whitespace-nowrap min-w-[140px]"
                        >
                            <option value="table_number">{t('table.sort_number')}</option>
                            <option value="capacity">{t('table.sort_capacity')}</option>
                            <option value="created_at">{t('table.sort_newest')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('table.total_tables')}</p>
                            <p className="text-2xl font-black text-gray-800">{tables.length}</p>
                        </div>
                        <div className="bg-emerald-50/30 p-4 rounded-2xl shadow-sm border border-emerald-50">
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('table.available')}</p>
                            <p className="text-2xl font-black text-emerald-600">{tables.filter(t => t.status === 'available').length}</p>
                        </div>
                        <div className="bg-orange-50/30 p-4 rounded-2xl shadow-sm border border-orange-50">
                            <p className="text-orange-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('table.occupied')}</p>
                            <p className="text-2xl font-black text-orange-600">{tables.filter(t => t.status === 'occupied').length}</p>
                        </div>
                        <div className="bg-amber-50/30 p-4 rounded-2xl shadow-sm border border-amber-50">
                            <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('table.reserved')}</p>
                            <p className="text-2xl font-black text-amber-600">{tables.filter(t => t.status === 'reserved').length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTables.map((table) => (
                            <div key={table.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 min-w-[3rem] px-2 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                            <span className="font-black text-lg whitespace-nowrap">{table.table_number}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-tight">{t('table.table_label')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => { setSelectedTable(table); setIsViewModalOpen(true); }}
                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 transition-all transform shadow-sm border border-emerald-100"
                                            title={t('table.view_qr')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => { setSelectedTable(table); setEditData(table); setIsEditModalOpen(true); }}
                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all transform shadow-sm border border-blue-100"
                                            title={t('table.edit')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTable(table.id)}
                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all transform shadow-sm border border-red-100"
                                            title={t('table.delete')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">{t('table.table_label')} {table.table_number}</h3>
                                <p className="text-gray-500 text-sm mb-3">{table.description || t('table.no_description')}</p>

                                <div className="flex justify-center py-4 bg-white rounded-lg border border-gray-100 mb-3">
                                    <QRCode
                                        value={`${window.location.origin}/menu?table=${table.id}&table_number=${encodeURIComponent(table.table_number)}&token=${table.qr_code_token}`}
                                        size={120}
                                        style={{ height: "auto", maxWidth: "100%", width: "120px" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">{t('table.capacity')}</span>
                                        <span className="font-bold text-gray-700">{table.capacity} {t('table.persons')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">{t('table.location')}</span>
                                        <span className="font-medium text-gray-600 px-2 py-0.5 bg-gray-100 rounded-lg">{table.location || t('table.not_set')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">{t('table.token_created')}</span>
                                        <span className="font-medium text-gray-600 text-xs">
                                            {table.token_created_at ? new Date(table.token_created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${table.status === 'available' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                            {table.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )
            }

            {/* Modal Add Table */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('table.modal_add_title')}</h2>
                            <form onSubmit={handleCreateTable} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.table_number')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTable.table_number}
                                        onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder={t('table.table_number_placeholder')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.capacity')}</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newTable.capacity}
                                        onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('table.location')}</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        value={newTable.location}
                                        onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                                    >
                                        <option value="Indoor">Indoor</option>
                                        <option value="Outdoor">Outdoor</option>
                                        <option value="Patio">Patio</option>
                                        <option value="VIP Room">VIP Room</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('table.description')}</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder={t('table.description_placeholder')}
                                        value={newTable.description || ''}
                                        onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                    >
                                        {t('table.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                    >
                                        {t('table.create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal Edit Table */}
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('table.modal_edit_title')}</h2>
                            <form onSubmit={handleUpdateTable} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.table_number')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={editData.table_number}
                                        onChange={(e) => setEditData({ ...editData, table_number: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.capacity')}</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={editData.capacity}
                                        onChange={(e) => setEditData({ ...editData, capacity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.location')}</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        value={editData.location}
                                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                    >
                                        <option value="Indoor">Indoor</option>
                                        <option value="Outdoor">Outdoor</option>
                                        <option value="Patio">Patio</option>
                                        <option value="VIP Room">VIP Room</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.description')}</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder={t('table.description_placeholder')}
                                        value={editData.description || ''}
                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('table.status')}</label>
                                    <select
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    >
                                        <option value="available">{t('table.available')}</option>
                                        <option value="occupied">{t('table.occupied')}</option>
                                        <option value="reserved">{t('table.reserved')}</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                    >
                                        {t('table.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                                    >
                                        {t('table.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal View Table Details */}
            {
                isViewModalOpen && selectedTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">{t('table.modal_view_title')}</h2>
                                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-center p-6 bg-gray-50 rounded-2xl">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🪑</div>
                                        <div className="text-2xl font-black text-gray-900 uppercase">{t('table.table_label')} {selectedTable.table_number}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">{t('table.status')}</p>
                                        <p className={`text-sm font-bold capitalize ${selectedTable.status === 'available' ? 'text-emerald-600' :
                                            selectedTable.status === 'occupied' ? 'text-orange-600' : 'text-amber-600'
                                            }`}>
                                            {t(`table.${selectedTable.status}`)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            {t('table.capacity')}
                                        </p>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{selectedTable.capacity} {t('table.persons')}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" /></svg>
                                        {t('table.location')}
                                    </p>
                                    <p className="text-sm text-gray-800 font-medium">{selectedTable.location || t('table.not_set')}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        {t('table.description')}
                                    </p>
                                    <p className="text-sm text-gray-800 font-medium">{selectedTable.description || t('table.no_description')}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {t('table.token_created')}
                                    </p>
                                    <p className="text-sm text-gray-800 font-medium">{selectedTable.token_created_at ? new Date(selectedTable.token_created_at).toLocaleString() : t('table.default_token')}</p>
                                </div>
                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={() => handleDownloadPDF(selectedTable.id, selectedTable.table_number)}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        {t('table.download_pdf')}
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPNG(selectedTable.id, selectedTable.table_number)}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        {t('table.download_png')}
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm(t('table.confirm_regenerate'))) handleRegenerateQR(selectedTable.id); }}
                                        disabled={selectedTable.status !== 'available'}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedTable.status === 'available'
                                            ? 'bg-white border-2 border-red-50 text-red-500 hover:bg-red-50'
                                            : 'bg-gray-50 border-2 border-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        title={selectedTable.status !== 'available' ? t('table.cannot_regenerate_occupied') : t('table.regenerate_token')}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        {t('table.regenerate_token')}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-full mt-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all border border-gray-200"
                            >
                                {t('table.close')}
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TableManagement;
