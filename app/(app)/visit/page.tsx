'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Redirect to new visit
export default function VisitPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/visit/new')
  }, [router])
  return null
}
