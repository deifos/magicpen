"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Book } from "lucide-react";
import { GenerationResult } from "@/types/generation";
import Image from "next/image";

interface BookViewProps {
  results: GenerationResult[];
  onClose: () => void;
}

export function BookView({ results, onClose }: BookViewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Filter only completed results with both text and image
  const pages = results.filter(
    (result) =>
      result.status === "completed" &&
      result.transcribedText &&
      result.generatedImages.length > 0
  );

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % pages.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
  };

  if (pages.length === 0) {
    return null;
  }

  const currentResult = pages[currentPage];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
      >
        <X size={32} />
      </button>

      {/* Book Container */}
      <div className="relative w-full max-w-4xl mx-auto px-8">
        {/* Page Counter */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-lg">
          <div className="flex items-center gap-2">
            <Book size={20} />
            <span>
              Page {currentPage + 1} of {pages.length}
            </span>
          </div>
        </div>

        {/* Navigation Arrows */}
        {pages.length > 1 && (
          <>
            <button
              onClick={prevPage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={nextPage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Book Page */}
        <div
          className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg shadow-2xl overflow-hidden"
          style={{ minHeight: "600px" }}
        >
          {/* Page Header */}
          <div className="bg-gradient-to-r from-amber-700 to-yellow-800 text-white p-4 text-center">
            <h2 className="text-2xl font-serif">Your Magical Story</h2>
          </div>

          {/* Page Content */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[500px]">
            {/* Image Side */}
            <div className="flex items-center justify-center">
              <div className="relative rounded-lg overflow-hidden shadow-lg bg-white p-4">
                <div className="relative w-full h-80">
                  <Image
                    src={currentResult.generatedImages[0].url}
                    alt="Story illustration"
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <div className="absolute inset-0 border-4 border-amber-200 rounded-lg pointer-events-none"></div>
              </div>
            </div>

            {/* Text Side */}
            <div className="flex flex-col justify-center">
              <div className="bg-white rounded-lg p-6 shadow-inner border-2 border-amber-200">
                <div className="font-serif text-gray-800 text-lg leading-relaxed">
                  {currentResult.transcribedText
                    .split("\n")
                    .map((line, index) => (
                      <p key={index} className="mb-4 last:mb-0">
                        {line}
                      </p>
                    ))}
                </div>

                {/* Decorative elements */}
                <div className="mt-6 flex justify-center">
                  <div className="flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-amber-400 rounded-full"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Footer with decorative border */}
          <div className="border-t-4 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-200 p-4">
            <div className="flex justify-between items-center text-amber-800">
              <div className="text-sm">📚 Your Magical Adventure</div>
              <div className="text-sm">Page {currentPage + 1}</div>
            </div>
          </div>
        </div>

        {/* Page Dots Indicator */}
        {pages.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentPage
                    ? "bg-amber-400"
                    : "bg-gray-400 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
