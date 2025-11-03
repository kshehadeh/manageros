'use client'

export function AnimatedGeometricPattern() {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden'>
      {/* Animated interconnected lines */}
      <svg
        className='absolute inset-0 h-full w-full'
        viewBox='0 0 1200 800'
        preserveAspectRatio='xMidYMid slice'
        xmlns='http://www.w3.org/2000/svg'
      >
        {/* Network of interconnected lines */}
        <g className='interconnected-lines' opacity='0.08'>
          {/* Horizontal moving lines */}
          <path
            d='M-100 160 L1300 160'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-1'
          />
          <path
            d='M-100 320 L1300 320'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-2'
          />
          <path
            d='M-100 480 L1300 480'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-3'
          />
          <path
            d='M-100 640 L1300 640'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-4'
          />
          {/* Vertical moving lines */}
          <path
            d='M240 -100 L240 900'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-5'
          />
          <path
            d='M480 -100 L480 900'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-6'
          />
          <path
            d='M720 -100 L720 900'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-7'
          />
          <path
            d='M960 -100 L960 900'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-8'
          />
          {/* Diagonal lines forming triangles and polygons */}
          <path
            d='M-200 -200 L1400 1000'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-diagonal-1'
          />
          <path
            d='M1400 -200 L-200 1000'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-diagonal-2'
          />
          <path
            d='M-200 400 L1400 -200'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-diagonal-3'
          />
          <path
            d='M-200 400 L1400 1000'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-diagonal-4'
          />
          {/* Additional connecting lines */}
          <path
            d='M300 -200 L900 1000'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-diagonal-5'
          />
          <path
            d='M900 -200 L300 1000'
            stroke='white'
            strokeWidth='1'
            fill='none'
            className='line-path-diagonal-6'
          />
        </g>
      </svg>
    </div>
  )
}
