import React, { Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'

import Home from './pages/Home'

const About = lazy(() => import('./pages/About'))

function App() {
  return (
    <Layout>
      <Suspense fallback={<div style={{ padding: '2rem' }}>Загрузка страницы "О нас"...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App