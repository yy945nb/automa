import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import PopupApp from './App';
import Home from './pages/Home';

const router = createHashRouter([
  {
    path: '/',
    element: <PopupApp />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
]);

const PopupRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export { router };
export default PopupRouter;
