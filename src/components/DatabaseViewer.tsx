import { useState, useEffect } from 'react';
import { Database, Table, Search, Play, RefreshCw, Download, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface TableInfo {
  name: string;
  type: string;
  sql: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

export function DatabaseViewer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  async function loadTables() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/database/tables');
      const result = await response.json();

      if (result.success) {
        setTables(result.data.tables);
      } else {
        setError(result.error || 'Failed to load tables');
      }
    } catch (err) {
      setError('Network error loading tables');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTableData(tableName: string, limit: number = 50) {
    try {
      setLoading(true);
      setError(null);
      setSelectedTable(tableName);

      const response = await fetch(`/api/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT * FROM ${tableName} LIMIT ${limit}`
        })
      });

      const result = await response.json();

      if (result.success) {
        setTableData(result.data);
      } else {
        setError(result.error || 'Failed to load table data');
      }
    } catch (err) {
      setError('Network error loading table data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function executeCustomQuery() {
    if (!customQuery.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery })
      });

      const result = await response.json();

      if (result.success) {
        setQueryResult(result.data);
        setSuccess(`Query executed successfully! ${result.data.rowCount} rows returned in ${result.data.executionTime}ms`);
      } else {
        setError(result.error || 'Query failed');
      }
    } catch (err) {
      setError('Network error executing query');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV(data: QueryResult, filename: string) {
    const csv = [
      data.columns.join(','),
      ...data.rows.map(row =>
        data.columns.map(col => {
          const val = row[col];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const quickQueries = [
    { label: 'All Signups', query: 'SELECT * FROM signups ORDER BY created_at DESC LIMIT 50' },
    { label: 'All Partners', query: 'SELECT * FROM partnership_activations ORDER BY created_at DESC LIMIT 50' },
    { label: 'Recent Challenges', query: 'SELECT * FROM challenges ORDER BY created_at DESC LIMIT 50' },
    { label: 'Analytics Summary', query: 'SELECT * FROM partner_analytics_daily ORDER BY date DESC LIMIT 100' },
    { label: 'Challenge Completions', query: 'SELECT * FROM challenge_completions ORDER BY completed_at DESC LIMIT 100' },
    { label: 'Engagement Events', query: 'SELECT * FROM engagement_events ORDER BY created_at DESC LIMIT 100' },
  ];

  return (
    <div className="min-h-screen bg-parchment-light py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-primary mb-2 flex items-center gap-3">
              <Database className="w-10 h-10 text-cyan-primary" />
              D1 Database Viewer
            </h1>
            <p className="text-ink-secondary text-lg">
              View and query your Cloudflare D1 database
            </p>
          </div>
          <button
            onClick={loadTables}
            disabled={loading}
            className="px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-coral-primary/10 border-2 border-coral-primary rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-coral-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-coral-primary">Error</p>
              <p className="text-ink-primary text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-coral-primary hover:text-coral-dark">×</button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-forest-green/10 border-2 border-forest-green rounded-lg flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-forest-green flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-forest-green">Success</p>
              <p className="text-ink-primary text-sm">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-forest-green hover:text-forest-green/80">×</button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Tables Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="parchment-card sticky top-8">
              <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
                <Table className="w-5 h-5 text-cyan-primary" />
                Tables ({tables.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => loadTableData(table.name)}
                    className={`w-full text-left px-3 py-2 rounded treasure-border transition-all ${
                      selectedTable === table.name
                        ? 'bg-cyan-primary text-white border-cyan-dark'
                        : 'bg-parchment-light text-ink-primary hover:bg-cyan-light/20 border-cyan-primary/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">{table.name}</div>
                    <div className="text-xs opacity-75">{table.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Queries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="parchment-card"
            >
              <h2 className="font-heading text-xl font-bold text-ink-primary mb-4">Quick Queries</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {quickQueries.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setCustomQuery(q.query);
                      setQueryResult(null);
                    }}
                    className="px-4 py-2 bg-amber-primary/20 text-ink-primary font-heading font-semibold treasure-border hover:bg-amber-primary/30 transition-colors text-sm"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Custom Query */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="parchment-card"
            >
              <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-primary" />
                Custom SQL Query
              </h2>
              <div className="space-y-4">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Enter SQL query... (e.g., SELECT * FROM signups LIMIT 10)"
                  rows={6}
                  className="w-full px-4 py-3 bg-parchment-light border-2 border-cyan-primary/30 rounded-lg text-ink-primary font-mono text-sm focus:outline-none focus:border-cyan-primary resize-vertical"
                />
                <div className="flex gap-3">
                  <button
                    onClick={executeCustomQuery}
                    disabled={loading || !customQuery.trim()}
                    className="px-6 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Execute Query
                  </button>
                  <button
                    onClick={() => {
                      setCustomQuery('');
                      setQueryResult(null);
                    }}
                    className="px-6 py-2 bg-parchment-mid text-ink-primary font-heading font-bold treasure-border hover:bg-parchment-dark transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Query Results */}
            {(queryResult || tableData) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="parchment-card"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-heading text-xl font-bold text-ink-primary">
                    {queryResult ? 'Query Results' : `Table: ${selectedTable}`}
                  </h2>
                  <button
                    onClick={() => {
                      const data = queryResult || tableData;
                      if (data) {
                        exportToCSV(data, `${selectedTable || 'query'}_${Date.now()}.csv`);
                      }
                    }}
                    className="px-4 py-2 bg-amber-primary text-ink-primary font-heading font-bold treasure-border hover:bg-amber-dark transition-colors text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {(() => {
                  const data = queryResult || tableData;
                  if (!data || data.rows.length === 0) {
                    return (
                      <div className="text-center py-12 text-ink-secondary">
                        No data found
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="mb-4 text-sm text-ink-secondary">
                        {data.rowCount} rows • Executed in {data.executionTime}ms
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-cyan-primary/30">
                              {data.columns.map((col) => (
                                <th key={col} className="text-left py-3 px-3 font-heading text-ink-primary bg-cyan-light/10">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.rows.map((row, i) => (
                              <tr key={i} className="border-b border-ink-primary/10 hover:bg-cyan-light/5">
                                {data.columns.map((col) => (
                                  <td key={col} className="py-3 px-3 text-ink-primary">
                                    {row[col] === null ? (
                                      <span className="text-ink-faded italic">null</span>
                                    ) : typeof row[col] === 'object' ? (
                                      <code className="text-xs bg-parchment-dark px-2 py-1 rounded">
                                        {JSON.stringify(row[col])}
                                      </code>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
