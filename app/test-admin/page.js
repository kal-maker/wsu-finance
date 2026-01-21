export default function TestAdmin() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Admin Page</h1>
      <p>If you can see this, the route works.</p>
      <a href="/admin" className="text-cyan-500 underline">
        Go to Admin Dashboard
      </a>
    </div>
  )
}