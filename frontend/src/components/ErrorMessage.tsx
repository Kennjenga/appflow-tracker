import React from 'react'

type Props = { children?: React.ReactNode }

export default function ErrorMessage({ children }: Props) {
  if (!children) return null

  return (
    <div className="alert alert--error" role="alert">
      {children}
    </div>
  )
}
