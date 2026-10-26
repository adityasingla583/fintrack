import React from 'react'

const MainLayout = ({ children }) => {
  return (
    <div className='container mx-auto px-4 mt-4 mb-16'>
      {children}
    </div>
  )
}

export default MainLayout
