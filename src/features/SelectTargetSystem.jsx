import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaSync, FaCheckCircle } from 'react-icons/fa';

const SelectTargetSystem = () => {
  const navigate = useNavigate();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.targetSystems.list({ limit: 50 });
      const items = Array.isArray(list) ? list : list.systems || [];
      setSystems(items);
    } catch (e) {
      setError(e.message || 'Failed to load target systems');
      setSystems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const handleNext = () => {
    if (selectedId) {
      navigate(`/agents/select-type/${selectedId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <button onClick={() => navigate('/agents')} className="group text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 transition-colors">
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Agents</span>
          </button>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Select Target System</h1>
          <p className="text-gray-500">Choose which target system this agent will manage.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{systems.length} systems found</div>
          <button onClick={fetchSystems} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : systems.length === 0 ? (
          <div className="p-12 bg-white rounded border border-gray-200 text-center text-gray-500">No target systems available. Ask an admin to add one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map((sys) => (
              <div key={sys.id || sys._id} className={`bg-white rounded-lg border ${selectedId === (sys.id || sys._id) ? 'border-blue-600' : 'border-gray-200'} hover:shadow-md transition cursor-pointer`} onClick={() => setSelectedId(sys.id || sys._id)}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{sys.name}</h3>
                    {selectedId === (sys.id || sys._id) && <FaCheckCircle className="text-blue-600" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{sys.type || 'Target System'}</p>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">
                      <span>URL: </span>
                      <span className="font-medium text-gray-700 break-all">{sys.base_url || sys.host || 'n/a'}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span>Env: </span>
                      <span className="font-medium text-gray-700">{sys.environment || 'n/a'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => navigate('/agents')} className="px-4 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
          <button onClick={handleNext} disabled={!selectedId} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
};

export default SelectTargetSystem;
