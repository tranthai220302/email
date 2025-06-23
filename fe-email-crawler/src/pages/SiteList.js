import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SiteList() {
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8080/email')
      .then(res => setSites(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container">
      <h1>Site List</h1>
      <ul className="site-list">
        {sites.map(site => (
          <li key={site.id} onClick={() => navigate(`/site/${site.id}`)}>
            {site.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SiteList;
