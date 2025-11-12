# MagicPen API Documentation

## Generate Storybook Page Endpoint

**Endpoint:** `POST /api/generate`

**Description:** Accepts an image with handwritten text, performs OCR, and generates an illustrated storybook page.

---

## Request

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageUrl` | string | Optional* | URL to an image file (JPEG, PNG) |
| `imageBase64` | string | Optional* | Base64-encoded image data (include data URI prefix) |
| `styleUrl` | string | Optional | URL to style reference image (defaults to Style 1) |
| `previousContext` | string | Optional | Previously transcribed text for incremental story building |

**Note:** Either `imageUrl` OR `imageBase64` is required (not both).

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "transcription": "The cat was happy",
  "generationPrompt": "A joyful cat with a big smile, looking delighted and content, children's storybook illustration style, warm and cheerful atmosphere",
  "uploadedImageUrl": "https://v3b.fal.media/files/...",
  "generatedImages": [
    {
      "url": "https://v3b.fal.media/files/...",
      "content_type": "image/png"
    }
  ],
  "timestamp": "2025-01-12T10:30:00.000Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Either imageUrl or imageBase64 is required"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "Failed to process request",
  "message": "Error details..."
}
```

---

## Usage Examples

### Example 1: Basic Usage with Image URL

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/handwriting.jpg"
  }'
```

### Example 2: With Base64 Image

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### Example 3: Incremental Story Building

```bash
# First capture
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/page1.jpg"
  }'
# Returns: { "transcription": "A big cat sat on a mat", ... }

# Second capture (with context)
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/page2.jpg",
    "previousContext": "A big cat sat on a mat"
  }'
# Returns: { "transcription": "The cat was happy", ... }
```

### Example 4: Custom Style

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/handwriting.jpg",
    "styleUrl": "https://v3b.fal.media/files/b/panda/9zG6V8gEHgbrtSwC7pgLA_style2.png"
  }'
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
async function generateStoryPage(imageFile: File, previousText?: string) {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(imageFile);
  });

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      previousContext: previousText,
    }),
  });

  const result = await response.json();
  return result;
}

// Usage
const file = document.querySelector('input[type="file"]').files[0];
const result = await generateStoryPage(file);
console.log('Transcription:', result.transcription);
console.log('Generated Image:', result.generatedImages[0].url);
```

### Using Axios

```typescript
import axios from 'axios';

async function generateStoryPage(imageUrl: string, styleUrl?: string) {
  const response = await axios.post('/api/generate', {
    imageUrl,
    styleUrl: styleUrl || 'https://v3b.fal.media/files/b/lion/IEP3uGaGWS72ZkUem9cKV_style1.png',
  });

  return response.data;
}

// Usage
const result = await generateStoryPage('https://example.com/handwriting.jpg');
console.log('Generated:', result);
```

---

## Style Options

### Available Styles

| Style | URL |
|-------|-----|
| Style 1 (Default) | `https://v3b.fal.media/files/b/lion/IEP3uGaGWS72ZkUem9cKV_style1.png` |
| Style 2 | `https://v3b.fal.media/files/b/panda/9zG6V8gEHgbrtSwC7pgLA_style2.png` |

---

## Features

✅ **OCR with Spelling Correction**: Reads handwriting and fixes spelling errors
✅ **Context-Aware**: Supports incremental story building (only transcribes new text)
✅ **AI-Generated Illustrations**: Creates storybook-style artwork
✅ **Style References**: Apply different artistic styles
✅ **Base64 or URL**: Flexible image input methods

---

## Rate Limits & Notes

- Maximum request duration: 60 seconds
- Recommended image formats: JPEG, PNG
- Image size: No strict limit, but smaller images process faster
- For best OCR results: Clear handwriting, good lighting, high contrast

---

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `Either imageUrl or imageBase64 is required` | No image provided | Include `imageUrl` or `imageBase64` in request |
| `Failed to process request` | Server error | Check image format and try again |
| Timeout | Image too large or processing too slow | Reduce image size or simplify content |

---

## Support

For issues or questions, please open an issue on GitHub or contact support.
