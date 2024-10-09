'use client';

import { Provider } from 'react-redux';
import store from '@/app/redux-store/store/store-redux';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

export default Providers;