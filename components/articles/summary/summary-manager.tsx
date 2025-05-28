"use client";

import { useEffect, useCallback } from "react";
import { SummaryDot } from "./summary-dot";

interface Summary {
  id: string;
  dotIndex: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SummaryManagerProps {
  articleId: string;
  summaries: Summary[];
  onSummaryClick: (dotIndex: number) => void;
}

export function SummaryManager({ 
  articleId, 
  summaries, 
  onSummaryClick 
}: SummaryManagerProps) {

  const insertSummaryDots = useCallback(() => {
    const articleElement = document.querySelector('article[data-article-content="true"]');
    if (!articleElement) return;

    // Remove existing summary dots to avoid duplicates
    const existingDots = articleElement.querySelectorAll('.summary-dot-container');
    existingDots.forEach(dot => dot.remove());

    // Get all paragraph elements
    const paragraphs = articleElement.querySelectorAll('p');
    if (paragraphs.length === 0) return;

    const totalDots = Math.ceil(paragraphs.length / 4);
    let dotIndex = 0;

    // Insert dots every 4 paragraphs
    for (let i = 3; i < paragraphs.length; i += 4) {
      const paragraph = paragraphs[i];
      const isCompleted = summaries.some(summary => summary.dotIndex === dotIndex);
      
      // Create a container for the dot
      const dotContainer = document.createElement('div');
      dotContainer.className = 'summary-dot-container relative';
      dotContainer.setAttribute('data-dot-index', dotIndex.toString());
      
      // Create the dot element with absolute positioning to the far right
      const dotElement = document.createElement('div');
      dotElement.className = 'summary-dot-wrapper absolute -right-16 top-0';
      
      // Insert the container after the paragraph
      if (paragraph.parentNode) {
        paragraph.parentNode.insertBefore(dotContainer, paragraph.nextSibling);
        dotContainer.appendChild(dotElement);
        
        // Render the React component into the dot element
        import('react-dom/client').then(({ createRoot }) => {
          const root = createRoot(dotElement);
          root.render(
            <SummaryDot
              dotIndex={dotIndex}
              totalDots={totalDots}
              isCompleted={isCompleted}
              onClick={onSummaryClick}
              className=""
            />
          );
        });
      }
      
      dotIndex++;
    }

    // Add final dot after the last paragraph if we haven't reached the total
    if (dotIndex < totalDots && paragraphs.length > 0) {
      const lastParagraph = paragraphs[paragraphs.length - 1];
      const isCompleted = summaries.some(summary => summary.dotIndex === dotIndex);
      
      const dotContainer = document.createElement('div');
      dotContainer.className = 'summary-dot-container relative';
      dotContainer.setAttribute('data-dot-index', dotIndex.toString());
      
      const dotElement = document.createElement('div');
      dotElement.className = 'summary-dot-wrapper absolute -right-16 top-0';
      
      if (lastParagraph.parentNode) {
        lastParagraph.parentNode.insertBefore(dotContainer, lastParagraph.nextSibling);
        dotContainer.appendChild(dotElement);
        
        import('react-dom/client').then(({ createRoot }) => {
          const root = createRoot(dotElement);
          root.render(
            <SummaryDot
              dotIndex={dotIndex}
              totalDots={totalDots}
              isCompleted={isCompleted}
              onClick={onSummaryClick}
              className=""
            />
          );
        });
      }
    }
  }, [summaries, onSummaryClick]);

  // Insert dots when component mounts or summaries change
  useEffect(() => {
    // Add a small delay to ensure the article content is fully rendered
    const timer = setTimeout(() => {
      insertSummaryDots();
    }, 500);

    return () => clearTimeout(timer);
  }, [insertSummaryDots]);

  // Re-insert dots when summaries change (to update completion status)
  useEffect(() => {
    insertSummaryDots();
  }, [summaries, insertSummaryDots]);

  // This component doesn't render anything directly - it manages DOM insertion
  return null;
}

export type { Summary }; 