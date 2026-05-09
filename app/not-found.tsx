export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <p className="text-5xl font-light text-gray-300 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Pair Not Found</h1>
        <p className="text-gray-500 text-sm">No diamond pair matches this lot number.</p>
      </div>
    </main>
  );
}
