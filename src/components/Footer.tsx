export default function Footer() {
    return (
        <footer className="mt-20 border-t border-white/10 py-10 text-center">
            <p className="text-sm font-medium text-slate-500">
                Built for football fans • Fast • Clean • Maintainable
            </p>
            <p className="mt-2 text-xs text-slate-600">
                © {new Date().getFullYear()} Interactive Football Hub. All rights reserved.
            </p>
        </footer>
    );
}
