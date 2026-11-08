export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-display text-lg font-extrabold uppercase tracking-wide text-slate-300">
          Football <span className="text-volt">Hub</span>
          <span className="ml-3 font-sans text-sm font-normal normal-case tracking-normal text-slate-500">Your gateway to the world of football.</span>
        </p>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Interactive Football Hub. All rights reserved.</p>
      </div>
    </footer>
  );
}
