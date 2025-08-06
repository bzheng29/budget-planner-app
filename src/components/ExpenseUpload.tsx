import React, { useState } from 'react';
import './ExpenseUpload.css';

interface ExpenseUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const ExpenseUpload: React.FC<ExpenseUploadProps> = ({ onFileUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|json|xlsx?)$/i)) {
      alert('请上传 CSV、JSON 或 Excel 文件');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  return (
    <div className="expense-upload-container">
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📊</div>
        <p className="upload-text">
          拖放您的支出文件到这里，或点击浏览
        </p>
        <p className="upload-hint">
          支持 CSV、JSON 和 Excel 文件
        </p>
        
        <input
          type="file"
          id="file-upload"
          accept=".csv,.json,.xlsx,.xls"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <label htmlFor="file-upload" className="upload-button">
          选择文件
        </label>
      </div>

      {selectedFile && (
        <div className="selected-file">
          <div className="file-info">
            <span className="file-icon">📄</span>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          
          <button 
            className="upload-confirm-button"
            onClick={handleUpload}
            disabled={isProcessing}
          >
            {isProcessing ? '处理中...' : '上传并分析'}
          </button>
        </div>
      )}

    </div>
  );
};