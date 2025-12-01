# AI Chat Feature - AmityMate.ai

## Overview

The AI Chat feature provides students with an intelligent exam preparation assistant powered by Google's Gemini AI. The chat is fully integrated with the user's academic profile, providing context-aware responses based on their subjects and syllabus.

## Features

### ✅ Implemented

1. **Database-Backed Chat History**

   - PostgreSQL storage via Prisma ORM
   - Persistent conversations across sessions
   - Full message history

2. **Clerk Authentication Integration**

   - User-specific conversations
   - Secure API endpoints
   - Activity logging for analytics

3. **Gemini AI Integration**

   - Context-aware responses using user's subjects and syllabus
   - Support for both Gemini Flash (fast) and Pro (advanced) models
   - Personalized exam preparation assistance

4. **Responsive UI**

   - AmityMate design system (violet/purple theme)
   - Mobile-friendly with bottom navigation
   - Collapsible sidebar for chat history
   - Header visibility toggle
   - Typing indicators and loading states

5. **Activity Tracking**
   - Logs chat creation and message sending
   - Analytics for user engagement
   - Metadata tracking (conversation ID, message length)

## Database Schema

### ChatConversation

```prisma
model ChatConversation {
  id        String   @id @default(cuid())
  userId    String
  title     String
  modelUsed String   @default("gemini-3.0")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User          @relation(...)
  messages ChatMessage[]
}
```

### ChatMessage

```prisma
model ChatMessage {
  id             String           @id @default(cuid())
  conversationId String
  role           String           // "user" or "model"
  text           String           @db.Text
  createdAt      DateTime         @default(now())

  conversation ChatConversation @relation(...)
}
```

### ActivityType Updates

Added to enum:

- `CHAT_CREATED` - When a new conversation is created
- `CHAT_MESSAGE_SENT` - When a user sends a message

## API Endpoints

### `GET /api/chat/conversations`

Fetch all conversations for the authenticated user.

**Response:**

```json
[
	{
		"id": "clxxx",
		"title": "Explain machine learning",
		"updatedAt": "2025-01-20T10:30:00Z"
	}
]
```

### `POST /api/chat/conversations`

Create a new conversation.

**Request:**

```json
{
	"title": "First message text"
}
```

**Response:**

```json
{
	"id": "clxxx",
	"userId": "user_xxx",
	"title": "First message text",
	"modelUsed": "gemini-3.0",
	"createdAt": "2025-01-20T10:30:00Z",
	"updatedAt": "2025-01-20T10:30:00Z"
}
```

### `GET /api/chat/conversations/[id]`

Fetch a specific conversation with all messages.

**Response:**

```json
{
	"id": "clxxx",
	"title": "Explain machine learning",
	"messages": [
		{
			"id": "msg1",
			"role": "user",
			"text": "Explain machine learning",
			"createdAt": "2025-01-20T10:30:00Z"
		},
		{
			"id": "msg2",
			"role": "model",
			"text": "Machine learning is...",
			"createdAt": "2025-01-20T10:30:05Z"
		}
	]
}
```

### `DELETE /api/chat/conversations/[id]`

Delete a conversation and all its messages.

**Response:**

```json
{
	"success": true
}
```

### `POST /api/chat/conversations/[id]/messages`

Send a message and get AI response.

**Request:**

```json
{
	"message": "What is data normalization?"
}
```

**Response:**

```json
{
	"id": "msg_xxx",
	"response": "Data normalization is...",
	"createdAt": "2025-01-20T10:30:00Z"
}
```

## AI Context System

The chat AI receives rich context about the user:

1. **User Profile**

   - Name and email
   - Role (student/admin)

2. **Academic Data**

   - Enrolled subjects
   - Subject codes
   - Syllabus topics from modules
   - Available up to 5 subjects per request

3. **System Prompt**
   - Role: Exam preparation assistant for Amity University Patna
   - Focus: Understanding concepts, practice questions, study tips
   - Guidelines: Concise, structured, motivational
   - Context-aware: Uses user's syllabus topics

## Usage Flow

1. **User opens chat page** → Fetch conversations from `/api/chat/conversations`
2. **User clicks conversation** → Load messages from `/api/chat/conversations/[id]`
3. **User types message** →
   - If new chat: POST to `/api/chat/conversations` to create
   - POST to `/api/chat/conversations/[id]/messages` to send
4. **AI processes** →
   - Fetch user's subjects and topics
   - Build context-aware prompt
   - Generate response via Gemini
   - Save both user and AI messages
5. **Display response** → Update UI with typing indicator and final message

## Error Handling

- **No API key**: Returns fallback message about configuration
- **AI generation fails**: Saves error message to chat history
- **Unauthorized access**: Returns 401 status
- **Conversation not found**: Returns 404 status
- **Missing fields**: Returns 400 with validation error

## Design System

Colors:

- Background: `#0f0f23` (bg-background)
- Primary: `violet-500` (#8b5cf6)
- Accent: `purple-600`
- Text: White on dark
- Muted: `gray-400`, `gray-500`

Components:

- `Button` from `@/components/ui` (variants: primary, ghost, outline)
- `Card` from `@/components/ui` (variants: glass, default)
- `Navbar`, `MobileHeader`, `BottomNav` from `@/components/layout`

Icons:

- Lucide React only (NO emojis)
- Sparkles for AI
- MessageSquare for chats
- Send, Plus, Trash2, etc.

## Environment Variables

Required in `.env`:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
```

## Future Enhancements

Potential improvements:

- [ ] Streaming responses for real-time typing effect
- [ ] File upload (PDF syllabus, notes)
- [ ] Voice input
- [ ] Export conversation as PDF
- [ ] Share conversation with peers
- [ ] Model selection (Flash vs Pro) in UI
- [ ] Chat folders/categories
- [ ] Search within conversations
- [ ] Pin important conversations
- [ ] Rich text formatting in messages (Markdown)
- [ ] Code syntax highlighting
- [ ] Math equation rendering (KaTeX)
- [ ] Suggested follow-up questions
- [ ] Chat analytics dashboard

## Testing Checklist

- [ ] User can create new chat
- [ ] User can view chat history
- [ ] User can send messages
- [ ] AI responds with relevant context
- [ ] User can delete conversations
- [ ] Activity is logged correctly
- [ ] Mobile responsive design works
- [ ] Header toggle functions
- [ ] Sidebar toggle functions
- [ ] Error messages display properly
- [ ] Typing indicators show
- [ ] Messages persist after refresh

## Migration Notes

**From:** localStorage-based mock chat
**To:** PostgreSQL + Gemini AI integration

**Breaking Changes:**

- Chat history stored in DB (old localStorage data won't migrate)
- Requires `GEMINI_API_KEY` environment variable
- Requires Clerk authentication
- New database tables: `ChatConversation`, `ChatMessage`

**Database Migration:**

```bash
npx prisma generate
npx prisma db push
```

## Support

For issues or questions:

1. Check that `GEMINI_API_KEY` is set in `.env`
2. Verify database connection (Railway PostgreSQL)
3. Ensure Clerk authentication is configured
4. Check browser console for errors
5. Review API responses in Network tab

---

**Last Updated:** January 20, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
