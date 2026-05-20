import React from 'react'

type Props = { id?: string; children?: React.ReactNode }

export default function FieldError({ id, children }: Props) {
  if (!children) return null

  return (
    <p className="field-error" id={id}>
      {children}
    </p>
  )
}
