import React from 'react'

const ThreeDotLoader = () => (
    <div className="flex space-x-1 justify-center items-center py-4">
        <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
        <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
        <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce'></div>
    </div>
)

export default ThreeDotLoader
