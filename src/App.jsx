import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Copy, Check, Upload, Loader } from 'lucide-react';

const App = () => {
  const [jsonData, setJsonData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = React.useRef(null);

  // Determine if file is large and should use conservative expansion
  const isLargeFile = fileSize > 5 * 1024 * 1024; // 5MB threshold

  const processFile = async (file) => {
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setError('');
    setIsLoading(true);

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          setJsonData(parsed);
        } catch (err) {
          setError('Invalid JSON file: ' + err.message);
          setJsonData(null);
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      reader.readAsText(file);
    }, 100);
  };

  const handleFileLoad = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
        processFile(file);
      } else {
        setError('Please drop a valid JSON file (.json)');
        setJsonData(null);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="w-full mx-auto min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-xl border-2 border-blue-500">
            <div className="flex flex-col items-center gap-4">
              <Upload size={48} className="text-blue-500" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800">Drop JSON file here</h3>
                <p className="text-gray-600 mt-1">Release to open the file</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white h-screen flex flex-col shadow-lg p-2">
        <div className="mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileLoad}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            {isLoading ? <Loader size={12} className="animate-spin" /> : <File size={12} />}
            <span className='text-xs'>
              {isLoading ? 'Loading...' : 'Open JSON File'}
            </span>
          </button>
          
          <span className="ml-4 text-sm text-gray-500">
            or drag & drop a JSON file anywhere
          </span>
          
          {fileName && (
            <p className="mt-2 text-sm text-gray-600">
              Loaded: <span className="font-medium">{fileName}</span>
              <span className="ml-2 text-gray-500">({formatFileSize(fileSize)})</span>
              {isLargeFile && (
                <span className="ml-2 text-orange-600 text-xs">
                  • Large file: limited auto-expansion for performance
                </span>
              )}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader size={48} className="text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Processing JSON file...</h3>
              <p className="text-gray-500">
                Large files may take a moment to load
              </p>
            </div>
          </div>
        )}

        {!jsonData && !error && !isLoading && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <Upload size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No JSON file loaded</h3>
              <p className="text-gray-500">
                Click "Open JSON File" or drag & drop a JSON file to get started
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Optimized for large files (30-100MB+)
              </p>
            </div>
          </div>
        )}

        {jsonData && !isLoading && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto h-[calc(100vh-80px)] border">
            <div className="mb-2 text-xs text-gray-400">
              💡 Double-click any value to copy • Hover for copy button
            </div>
            <TreeNode data={jsonData} name="root" level={0} isLargeFile={isLargeFile} />
          </div>
        )}
      </div>
    </div>
  );
};

const TreeNode = React.memo(({ data, name, level, isLargeFile }) => {
  // Smart auto-expansion: only expand first level for large files, first 2 levels for small files
  const shouldAutoExpand = isLargeFile ? level < 1 : level < 2;
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);
  const [isHovered, setIsHovered] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const indent = level * 20;
  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);
  const isArray = Array.isArray(data);
  const isPrimitive = !isObject && !isArray;
  
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  
  const copyToClipboard = async (e) => {
    e.stopPropagation();
    
    try {
      let textToCopy;
      
      if (isPrimitive) {
        if (typeof data === 'string') {
          textToCopy = data;
        } else {
          textToCopy = String(data);
        }
      } else {
        textToCopy = JSON.stringify(data, null, 2);
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Double-click to copy functionality
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    copyToClipboard(e);
  };
  
  // For large arrays, manage how many items are shown
  const [visibleCount, setVisibleCount] = useState(isLargeFile && isArray ? 100 : (isArray ? data.length : 0));
  React.useEffect(() => {
    // Reset visibleCount if data changes or expansion toggles
    if (isLargeFile && isArray) {
      setVisibleCount(100);
    }
  }, [data, isLargeFile, isArray, isExpanded]);

  // Memoize child entries for performance
  const childEntries = useMemo(() => {
    if (!isExpanded || isPrimitive) return [];
    
    if (isArray) {
      // For very large arrays, show only visibleCount items initially
      const maxItems = isLargeFile ? visibleCount : data.length;
      return data.slice(0, maxItems).map((item, index) => ({
        key: index,
        name: `[${index}]`,
        data: item
      }));
    } else {
      // For large objects, show all keys but they'll lazy-load their content
      return Object.entries(data).map(([key, value]) => ({
        key,
        name: key,
        data: value
      }));
    }
  }, [data, isExpanded, isArray, isLargeFile, isPrimitive, visibleCount]);
  
  const renderValue = (value) => {
    if (value === null) return <span className="text-purple-400">null</span>;
    if (typeof value === 'string') {
      const processedValue = value
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      
      return (
        <span className="text-yellow-300">
          "<pre className="inline whitespace-pre-wrap font-mono">{processedValue}</pre>"
        </span>
      );
    }
    if (typeof value === 'number') return <span className="text-blue-400">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-orange-400">{value.toString()}</span>;
    return value;
  };

  const getIcon = () => {
    if (isPrimitive) return <File size={16} className="text-gray-400" />;
    if (isExpanded) return <FolderOpen size={16} className="text-yellow-400" />;
    return <Folder size={16} className="text-yellow-400" />;
  };

  const getChevron = () => {
    if (isPrimitive) return <span className="w-4" />;
    return isExpanded ? 
      <ChevronDown size={16} className="text-gray-400 cursor-pointer" onClick={toggleExpanded} /> :
      <ChevronRight size={16} className="text-gray-400 cursor-pointer" onClick={toggleExpanded} />;
  };

  return (
    <div>
      <div 
        className="flex items-start gap-1 py-1 hover:bg-gray-800 rounded px-1 cursor-pointer group relative select-none"
        style={{ paddingLeft: `${indent}px` }}
        onClick={!isPrimitive ? toggleExpanded : undefined}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={isPrimitive ? "Double-click to copy" : "Click to expand/collapse, double-click to copy JSON"}
      >
        {/* Sticky container for chevron, icon, key, and ":" */}
        <div
          className="flex items-start gap-1 sticky top-[10px] bg-gray-900 z-10"
          style={{ minWidth: 0 }}
        >
          {getChevron()}
          {getIcon()}
          <span
            className="text-gray-300 ml-1"
            style={{ minWidth: 100, maxWidth: 220, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
          >
            {name}
            {isArray && (
              <span className="text-gray-500">
                [{data.length}]
                {isLargeFile && data.length > 100 && !isExpanded && 
                  <span className="text-orange-400 text-xs ml-1">(showing first 100)</span>
                }
              </span>
            )}
            {isObject && <span className="text-gray-500">{"{"}{Object.keys(data).length}{"}"}</span>}
          </span>
          {isPrimitive && (
            <span className="text-gray-500 mx-2" style={{ alignSelf: 'flex-start' }}>:</span>
          )}
        </div>
        {isPrimitive && (
          <span
            className="flex-1 min-w-0 break-words"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', alignSelf: 'flex-start' }}
          >
            {renderValue(data)}
          </span>
        )}
        
        {isHovered && (
          <button
            onClick={copyToClipboard}
            className="ml-2 p-1 rounded hover:bg-gray-700 transition-colors opacity-70 hover:opacity-100"
            title={isPrimitive ? "Copy value" : "Copy JSON"}
            style={{ alignSelf: 'flex-start' }}
          >
            {copySuccess ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} className="text-gray-400" />
            )}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div>
          {childEntries.map(({ key, name, data: childData }) => (
            <TreeNode 
              key={key} 
              data={childData} 
              name={name} 
              level={level + 1}
              isLargeFile={isLargeFile}
            />
          ))}
          {isArray && isLargeFile && data.length > visibleCount && (
            <div 
              className="pl-4"
              style={{ paddingLeft: `${(level + 1) * 20}px` }}
            >
              <button
                className="text-blue-400 text-xs underline hover:text-blue-300 transition-colors px-2 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setVisibleCount((prev) => Math.min(prev + 100, data.length));
                }}
              >
                Load more ({Math.min(100, data.length - visibleCount)} more)
              </button>
              <span className="text-gray-500 text-xs italic ml-2">
                {data.length - visibleCount} remaining
              </span>
            </div>
          )}
          {isArray && isLargeFile && data.length > 100 && visibleCount >= data.length && (
            <div 
              className="text-gray-500 text-xs italic pl-4"
              style={{ paddingLeft: `${(level + 1) * 20}px` }}
            >
              All {data.length} items loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default App;
