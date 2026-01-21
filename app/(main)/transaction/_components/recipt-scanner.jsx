"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scanReceipt, scanReceiptSimple } from "@/actions/transaction";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleReceiptScan = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast.info("Scanning receipt...");
      setProgress(30);

      // Try the main scan function first
      // Flow: DeepSeek extracts receipt data → Only description sent to FastAPI → Returns predictions
      let scannedData;
      try {
        scannedData = await scanReceipt(file);
        console.log("✅ Receipt scanning result:", scannedData);
      } catch (error) {
        console.warn("Main scanner failed, using fallback:", error);
        // If main scanner fails, use the simple fallback
        scannedData = await scanReceiptSimple(file);
        toast.info("Using basic scanning mode");
      }

      // Validate scanned data - check for null/undefined specifically (0 is a valid amount)
      const hasAmount = scannedData.amount !== null && scannedData.amount !== undefined && scannedData.amount !== '';
      const hasDescription = scannedData.description && scannedData.description.trim().length > 0;
      
      if (!hasAmount || !hasDescription) {
        console.error("❌ Validation failed - insufficient data:", {
          amount: scannedData.amount,
          description: scannedData.description,
          hasAmount,
          hasDescription,
          fullData: scannedData
        });
        throw new Error(
          `Could not extract sufficient data from receipt. ` +
          `${!hasAmount ? 'Amount is missing. ' : ''}` +
          `${!hasDescription ? 'Description is missing. ' : ''}` +
          `Please try with a clearer image or enter details manually.`
        );
      }

      setProgress(100);

      // Auto-fill the form with the scanned data
      // scannedData includes: amount, date, description (from DeepSeek) + category, type (from FastAPI)
      onScanComplete(scannedData);
      
      // Show success message
      toast.success("Receipt scanned successfully!");
      
    } catch (error) {
      console.error("Receipt scanning error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = "Failed to process receipt";
      let errorDescription = "Please enter details manually";
      
      if (error.message) {
        errorMessage = error.message;
        // If the error message already contains details, don't add the generic description
        if (error.message.includes("missing") || error.message.includes("extract")) {
          errorDescription = "You can still create the transaction by filling the form manually";
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleReceiptScan(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleReceiptScan(files[0]);
    }
  };

  return (
    <div className="space-y-4 p-6 border border-cyan-200 rounded-lg bg-cyan-50">
      <div className="flex items-center gap-2">
        <Scan className="h-5 w-5 text-cyan-600" />
        <h3 className="font-semibold text-cyan-800">Receipt Scanner</h3>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isProcessing 
            ? 'border-cyan-400 bg-cyan-100' 
            : 'border-cyan-300 hover:border-cyan-400 cursor-pointer bg-white'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
            </div>
            <div>
              <p className="text-cyan-700 font-medium">Processing your receipt...</p>
              <p className="text-sm text-cyan-600 mt-2">
                {progress > 0 ? `Progress: ${progress}%` : 'Analyzing...'}
              </p>
              <div className="w-full bg-cyan-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-cyan-100 rounded-full">
                <Camera className="h-8 w-8 text-cyan-600" />
              </div>
            </div>
            <div>
              <p className="text-cyan-700 font-medium">Upload receipt image</p>
              <p className="text-sm text-cyan-600 mt-2">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-cyan-500 mt-1">
                Supports JPG, PNG • Max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        type="button"
        className="w-full bg-gradient-to-r from-cyan-600 to-navy-600 hover:from-cyan-700 hover:to-navy-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Receipt...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Scan Receipt
          </>
        )}
      </Button>

      <div className="bg-white rounded-lg p-4 border border-cyan-200">
        <h4 className="font-medium text-cyan-800 text-sm mb-2">How it works</h4>
        <ul className="text-xs text-cyan-600 space-y-1">
          <li>• Upload receipt image</li>
          <li>• AI extracts amount, date, and merchant automatically</li>
          <li>• Form fields filled automatically</li>
        </ul>
      </div>

      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
        <h4 className="font-medium text-yellow-800 text-sm mb-1">Tips for best results:</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Use clear, well-lit images with good contrast</li>
          <li>• Ensure text is sharp and not blurry</li>
          <li>• Take photos directly above the receipt</li>
          <li>• Avoid shadows, glare, and folded receipts</li>
        </ul>
      </div>
    </div>
  );
}