export default function GlobalLoading() {
  return (
    <div className="loader-screen">
      <div className="loader-orbit">
        <div className="loader-core" />
        <div className="loader-ring loader-ring-a" />
        <div className="loader-ring loader-ring-b" />
      </div>
      <p className="loader-label">Завантажуємо портал...</p>
    </div>
  );
}
