// /src/pages/logout.tsx
import { useAuth0 } from '@auth0/auth0-react';

const LogoutPage = () => {
  const { logout } = useAuth0();

  return (
    <div>
      <h1>Logout Page</h1>
      <button onClick={() => logout()}>Log Out</button>
    </div>
  );
};

export default LogoutPage;