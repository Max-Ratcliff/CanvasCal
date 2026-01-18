import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set the worker source to the CDN to avoid complex Vite configuration for now
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | File | null;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  if (!file) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p>No PDF selected.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-white shadow-sm z-10">
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(2.0, s + 0.1))} disabled={scale >= 2.0}>
                <ZoomIn className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
                Page {pageNumber} of {numPages}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-lg"
        >
            <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
            />
        </Document>
      </div>
    </div>
  );
}
