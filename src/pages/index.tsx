import React from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <nav>
        <ul>
          <li>
            <Link href="/converter">Converter</Link>
          </li>
          <li>
            <Link href="/login">Login</Link>
          </li>
          <li>
            <Link href="/logout">Logout</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HomePage;