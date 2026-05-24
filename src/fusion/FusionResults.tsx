import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FusionResultsProps {
  data: any[];
  onBack: () => void;
}

export function FusionResults({ data, onBack }: FusionResultsProps) {
  const chartData = useMemo(() => {
    return data
      .filter((trial) => trial.trial_type === 'vergence-training')
      .map((trial, index) => ({
        trial: index + 1,
        breakDistance: trial.break_distance,
        recoveryDistance: trial.recovery_distance,
      }));
  }, [data]);

  const handleDownloadCSV = () => {
    // Generate CSV string manually or use jsPsych data if passed as string
    // Here we reconstruct CSV from the data array
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fusion_training_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '2rem', color: '#fff', backgroundColor: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ marginBottom: '2rem' }}>Training Complete</h1>
      
      <div style={{ width: '80%', height: 400, backgroundColor: '#222', padding: '1rem', borderRadius: '8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="trial" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
            <Legend />
            <Line type="monotone" dataKey="breakDistance" stroke="#ff4d4f" strokeWidth={3} name="Break Distance" />
            <Line type="monotone" dataKey="recoveryDistance" stroke="#52c41a" strokeWidth={3} name="Recovery Distance" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={handleDownloadCSV}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Download CSV
        </button>
        <button 
          onClick={onBack}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
