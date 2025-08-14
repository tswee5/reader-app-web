declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
  }
  
  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export default pdfParse;
} 