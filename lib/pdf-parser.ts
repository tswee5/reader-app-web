export interface ParsedPDF {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  date_published?: string;
  lead_image_url?: string;
  domain: string;
  word_count: number;
  page_count: number;
}

export async function parsePDF(file: File): Promise<ParsedPDF> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text content from PDF
    const content = await extractTextFromPDF(arrayBuffer);
    
    // Get file name without extension
    const fileName = file.name.replace(/\.pdf$/i, '');
    
    // Count words
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    
    // Generate excerpt (first 200 characters)
    const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content;
    
    return {
      title: fileName,
      content: content,
      excerpt: excerpt,
      author: undefined,
      date_published: undefined,
      lead_image_url: undefined,
      domain: 'pdf',
      word_count: wordCount,
      page_count: 1, // We'll get this from the PDF metadata later
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF");
  }
}

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Convert ArrayBuffer to Buffer for pdf-parse
  const buffer = Buffer.from(arrayBuffer);
  
  try {
    // Dynamic import to avoid SSR issues
    const pdfParse = (await import('pdf-parse')).default as any;
    const data = await pdfParse(buffer);
    
    return data.text || "No text content found in PDF";
  } catch (error) {
    console.error("Error parsing PDF with pdf-parse:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Alternative implementation using a web-based PDF parser
export async function parsePDFWithWebParser(file: File): Promise<ParsedPDF> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Use PDF.js for client-side parsing
        // This would require adding pdfjs-dist to your dependencies
        const content = await extractTextWithPDFJS(arrayBuffer);
        
        const fileName = file.name.replace(/\.pdf$/i, '');
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content;
        
        resolve({
          title: fileName,
          content: content,
          excerpt: excerpt,
          author: undefined,
          date_published: undefined,
          lead_image_url: undefined,
          domain: 'pdf',
          word_count: wordCount,
          page_count: 1,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read PDF file"));
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextWithPDFJS(arrayBuffer: ArrayBuffer): Promise<string> {
  // This would be implemented with PDF.js
  // For now, return a placeholder
  return "PDF content extraction using PDF.js will be implemented.";
} 