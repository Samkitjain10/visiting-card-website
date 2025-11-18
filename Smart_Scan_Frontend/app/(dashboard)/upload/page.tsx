'use client';

import { FileUpload } from '@/components/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function UploadPage() {
  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">Upload Visiting Cards</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Upload images of visiting cards to extract contact information using AI-powered OCR.
        </p>
      </div>

      <FileUpload />

      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Ensure the image is clear and well-lit</p>
          <p>• Make sure text is readable and not blurry</p>
          <p>• For cards with both sides, upload each side separately</p>
          <p>• Supports English and Hindi (Devanagari) text</p>
          <p>• Maximum file size: 10MB per image</p>
        </CardContent>
      </Card>
    </div>
  );
}

