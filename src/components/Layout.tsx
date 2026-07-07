import { Outlet } from 'react-router-dom';
import Header from './Header';
import { motion } from 'framer-motion';

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col">
      <Header />
      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.main>
      <footer className="border-t border-slate-200/50 py-4 text-center text-xs text-slate-400 font-light">
        © 2026 FitAI. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;