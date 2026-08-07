import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-2">404</h1>
      <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The requested page could not be found.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl"
      >
        Return Home
      </Link>
    </div>
  );
}


