export default function ErrorMessage({ children }) {
  if (!children) return null

  return (
    <div className="alert alert--error" role="alert">
      {children}
    </div>
  )
}
