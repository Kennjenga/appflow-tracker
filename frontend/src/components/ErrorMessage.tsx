import React from 'react'

type Props = { children?: React.ReactNode }

export default function ErrorMessage({ children }: Props) {
  if (!children) return null

  return (
    <div className="flex gap-3 items-start bg-error-container border border-[#ffdad6] text-on-error-container rounded p-3 mb-4 text-sm font-semibold" role="alert">
      {children}
    </div>
  )
}
