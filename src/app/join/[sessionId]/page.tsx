'use client'

import { useParams } from 'next/navigation'
import { JoinView } from '../../_components/join/JoinView'

export default function JoinPage() {
  const params = useParams()
  const sessionIdParam = params.sessionId
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : (sessionIdParam ?? '')
  return <JoinView sessionId={sessionId} />
}
