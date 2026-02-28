import { Routes, Route, Navigate } from 'react-router-dom';
import Entry from './components/Entry';
import { getLatestDate } from './data/entries';
import './styles.css';
export default function App() {
  const latest = getLatestDate();
  return (
    <Routes>
      <Route path="/" element={latest ? <Navigate to={`/entry/${latest}`} replace /> : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'1.5rem',color:'#888'}}>Meridian is listening...</div>} />
      <Route path="/entry/:date" element={<Entry />} />
    </Routes>
  );
}
