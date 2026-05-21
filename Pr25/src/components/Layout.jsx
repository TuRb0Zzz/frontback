import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Главная</Link>
        <Link to="/about">О нас</Link>
      </nav>
      <main>{children}</main>
    </div>
  )
}