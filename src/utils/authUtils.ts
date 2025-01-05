// src/utilities/auth.ts

import { Omit } from 'utility-types'; // Ensure this import for type operations if necessary
import { LogoutOptions } from '@auth0/auth0-react'; // Make sure to import the correct type

interface ExtendedLogoutOptions extends Omit<LogoutOptions, 'onRedirect'> {
  returnTo?: string;
}

export const performLogout = (logout: (options?: ExtendedLogoutOptions) => void) => {
  logout({ returnTo: window.location.origin });
};