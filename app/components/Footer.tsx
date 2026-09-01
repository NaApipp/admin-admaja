export default function Footer() {
    return (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-4">
            <div className="w-full max-w-[85rem] mx-auto border-t border-white py-6 text-center text-sm flex justify-between">
                <p>© 2026 Admaja. All rights reserved.</p>
                <a href="mailto:[EMAIL_ADDRESS]" className="hover:text-white/50 transition-colors duration-300 cursor-pointer font-bold">Contact Support</a>
            </div>
        </div>
    );
}