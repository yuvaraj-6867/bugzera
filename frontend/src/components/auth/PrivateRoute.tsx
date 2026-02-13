import { Navigate, Outlet } from 'react-router-dom'

const PrivateRoute = () => {
  const token = localStorage.getItem('authToken')

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // If token exists, render the child routes
  return <Outlet />
}

export default PrivateRoute
