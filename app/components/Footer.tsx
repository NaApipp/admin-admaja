export default function Footer() {
  return (
    <footer className="w-full flex items-center justify-center px-4 mt-auto">
      <div className="w-full max-w-[85rem] mx-auto border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm flex flex-col sm:flex-row justify-between items-center gap-2 text-gray-500 dark:text-gray-400">
        <p>© 2026 Admaja. All rights reserved.</p>
        <a
          href="mailto:support@admajaskanifo.org"
          className="hover:text-gray-700 dark:hover:text-white transition-colors duration-300 font-medium"
        >
          Contact Support
        </a>
      </div>
    </footer>
  );
}