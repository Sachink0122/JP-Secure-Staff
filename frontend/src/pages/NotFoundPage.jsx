/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
};

export default NotFoundPage;

