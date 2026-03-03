// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { HiFlag, HiCheckCircle, HiXCircle, HiEye } from 'react-icons/hi';
import axios from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { status: statusFilter };
      const response = await axios.get('/admin/reports', { params });
      setReports(response.data.reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    const resolution = prompt('Enter resolution notes:');
    if (resolution === null) return;

    try {
      await axios.put(`/admin/reports/${reportId}/status`, {
        status,
        resolution
      });
      alert(`Report marked as ${status}`);
      fetchReports();
    } catch (error) {
      alert('Failed to update report status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'user': return '👤';
      case 'post': return '📝';
      case 'comment': return '💬';
      default: return '🚩';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Report Management</h1>

      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('reviewing')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'reviewing' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Under Review
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === 'resolved' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === '' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All Reports
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
            No reports found
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                      {getTypeIcon(report.reportedItemType)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">
                          {report.reporter?.firstName} {report.reporter?.lastName}
                        </p>
                        <span className="text-sm text-gray-500">reported</span>
                        <p className="font-semibold capitalize">{report.reportedItemType}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                    {report.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Reason</p>
                  <p className="font-medium mb-2">{report.reason}</p>
                  
                  {report.description && (
                    <>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{report.description}</p>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Report ID: {report._id}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(report.status === 'pending' || report.status === 'reviewing') && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report._id, 'resolved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                        >
                          <HiCheckCircle className="w-5 h-5" />
                          <span>Resolve</span>
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, 'dismissed')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        >
                          <HiXCircle className="w-5 h-5" />
                          <span>Dismiss</span>
                        </button>
                      </>
                    )}
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                      <HiEye className="w-5 h-5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;