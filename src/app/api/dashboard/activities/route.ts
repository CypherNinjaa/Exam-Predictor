import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const logs = await prisma.processingLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    const activities = logs.map(log => ({
      id: log.id,
      action: getActionText(log.status, log.fileType),
      details: log.fileName,
      time: getTimeAgo(log.createdAt)
    }))

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Activities Error:', error)
    return NextResponse.json({ activities: [] })
  }
}

function getActionText(status: string, fileType: string): string {
  const typeMap: Record<string, string> = {
    exam_paper: 'Exam Paper',
    syllabus: 'Syllabus',
    lecture_note: 'Lecture Notes'
  }
  const type = typeMap[fileType] || fileType

  switch (status) {
    case 'completed': return `✅ Processed ${type}`
    case 'processing': return `⏳ Processing ${type}`
    case 'pending': return `📥 Uploaded ${type}`
    case 'failed': return `❌ Failed to process ${type}`
    default: return `${type} ${status}`
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
