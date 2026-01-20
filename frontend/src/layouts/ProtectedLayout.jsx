/**
 * Protected Layout Component
 * Layout for authenticated pages with navigation
 */

import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-layout">
      {/* Navigation/Header will be added here */}
      <main>
        <Outlet />
      </main>
      {/* Footer will be added here */}
    </div>
  );
};

export default ProtectedLayout;

