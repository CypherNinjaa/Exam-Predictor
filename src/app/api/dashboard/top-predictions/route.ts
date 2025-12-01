import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get topics with freshness scores
    const topics = await prisma.topic.findMany({
      take: 10,
      orderBy: { freshnessScore: 'desc' },
      include: {
        module: true
      }
    })

    const predictions = topics.map(topic => ({
      topic: topic.name,
      probability: topic.freshnessScore,
      module: topic.module.name,
      lastAsked: topic.lastAskedDate 
        ? formatDate(topic.lastAskedDate) 
        : 'Never'
    }))

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Top Predictions Error:', error)
    return NextResponse.json({ predictions: [] })
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.toLocaleString('default', { month: 'short' })
  return `${month} ${year}`
}
