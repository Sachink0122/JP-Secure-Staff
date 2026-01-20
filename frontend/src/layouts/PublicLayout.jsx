/**
 * Public Layout Component
 * Layout for unauthenticated pages (login, etc.)
 */

import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Outlet />
    </div>
  );
};

export default PublicLayout;

