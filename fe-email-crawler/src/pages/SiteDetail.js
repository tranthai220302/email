import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:8080/email/${siteId}`)
      .then((res) => setKeywords(res.data))
      .catch((err) => console.error(err));
  }, [siteId]);

  const handleCrawl = async () => {
    setLoading(true);
    try {
      const updated = await axios.get(
        `http://localhost:8080/email/${siteId}/crawl`,
      );
      console.log(updated.data);
      setKeywords(updated.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const home = () => {
    navigate('/');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,  
    });
  };

  return (
    <div className="container">
      <h1>Site Detail - ID {siteId}</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="crawl-btn" onClick={handleCrawl} disabled={loading}>
          {loading ? 'Crawling...' : 'Crawl Data'}
        </button>
        <button className="crawl-btn" onClick={home}>
          Home
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody>
          {keywords?.map((k) => (
            <tr key={k.id}>
              <td>{k.key}</td>
              <td>{k.value || '-'}</td>
              <td>{k.updateTime ? formatTime(k.updateTime) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SiteDetail;
