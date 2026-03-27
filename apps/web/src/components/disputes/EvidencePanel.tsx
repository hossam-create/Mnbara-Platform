import { Dispute } from '../../services/disputeService';
import { disputeService } from '../../services/disputeService';
import EvidenceUploadBox from './EvidenceUploadBox';
import EvidenceList from './EvidenceList';
import EvidenceFileItem from './EvidenceFileItem';
import { useState } from 'react';

interface EvidencePanelProps {
  dispute: Dispute;
}

export default function EvidencePanel({ dispute }: EvidencePanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Convert dispute evidence to file format for EvidenceList
  const evidenceFiles = (dispute as any).evidence?.map((evidence: any, index: number) => ({
    id: evidence.id || `evidence-${index}`,
    fileName: evidence.name || evidence.fileName || 'Evidence File',
    fileType: evidence.type || 'document',
    uploadStatus: evidence.status || 'uploaded',
    uploadDate: evidence.createdAt || new Date().toISOString()
  })) || [];

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      // Convert files to evidence format for backend
      const evidenceData = files.map(file => ({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        size: file.size,
        contentType: file.type,
        uploadedAt: new Date().toISOString()
      }));

      // Upload evidence to backend
      const updatedDispute = await disputeService.addEvidence(dispute.id, evidenceData);
      
      if (updatedDispute) {
        alert('Evidence uploaded successfully!');
        // Refresh dispute data - this would typically be handled by parent component
        window.location.reload();
      } else {
        alert('Failed to upload evidence. Please try again.');
      }
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <EvidenceUploadBox
        onFileSelect={handleFileSelect}
        maxFiles={5}
        disabled={dispute.status === 'RESOLVED' || isUploading}
      />

      {/* Evidence List */}
      <EvidenceList
        files={evidenceFiles}
        maxFiles={5}
      />

      {/* Additional Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Evidence Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure photos are clear and show relevant details</li>
          <li>• Include timestamps and context in screenshots</li>
          <li>• Remove personal information from documents</li>
          <li>• Only upload relevant evidence for your dispute</li>
        </ul>
      </div>
    </div>
  );
}
