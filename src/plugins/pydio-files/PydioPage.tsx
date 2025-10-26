import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import AdminLayout from '../layouts/AdminLayout';
import { createPydioService, PydioFile } from '../services/pydio';
import { getServiceConfig } from '../services/serviceConfig';

const PydioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('files');
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<PydioFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PydioFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['']);

  // Check if Pydio is configured
  const isPydioConfigured = () => {
    const config = getServiceConfig('pydio');
    return config.enabled && config.baseUrl && config.username && config.password;
  };

  // Load files from current path
  const loadFiles = async () => {
    if (!isPydioConfigured()) {
      setError('Pydio is not configured. Please configure it in the API Configurations page.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pydioService = await createPydioService();
      if (!pydioService) {
        setError('Failed to connect to Pydio. Please check your configuration.');
        setIsLoading(false);
        return;
      }

      const filesList = await pydioService.listFiles(currentPath);
      setFiles(filesList);
    } catch (err) {
      setError('An error occurred while loading files.');
      console.error('Error loading files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for files
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const pydioService = await createPydioService();
      if (!pydioService) {
        setError('Failed to connect to Pydio. Please check your configuration.');
        setIsSearching(false);
        return;
      }

      const results = await pydioService.search(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('An error occurred while searching.');
      console.error('Error searching files:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const pydioService = await createPydioService();
      if (!pydioService) {
        setError('Failed to connect to Pydio. Please check your configuration.');
        setIsUploading(false);
        return;
      }

      const file = event.target.files[0];
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const success = await pydioService.uploadFile(currentPath, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (success) {
        // Reload files after successful upload
        loadFiles();
      } else {
        setError('Failed to upload file.');
      }
    } catch (err) {
      setError('An error occurred during upload.');
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle file download
  const handleFileDownload = async (filePath: string, fileName: string) => {
    setError(null);

    try {
      const pydioService = await createPydioService();
      if (!pydioService) {
        setError('Failed to connect to Pydio. Please check your configuration.');
        return;
      }

      const blob = await pydioService.downloadFile(filePath);
      if (!blob) {
        setError('Failed to download file.');
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('An error occurred during download.');
      console.error('Error downloading file:', err);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }

    setIsCreatingFolder(true);
    setError(null);

    try {
      const pydioService = await createPydioService();
      if (!pydioService) {
        setError('Failed to connect to Pydio. Please check your configuration.');
        setIsCreatingFolder(false);
        return;
      }

      const success = await pydioService.createDirectory(currentPath, newFolderName);
      if (success) {
        setNewFolderName('');
        loadFiles();
      } else {
        setError('Failed to create folder.');
      }
    } catch (err) {
      setError('An error occurred while creating the folder.');
      console.error('Error creating folder:', err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Delete selected files
  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.length} item(s)?`)) {
      return;
    }

    setError(null);

    try {
      const pydioService = await createPydioService();
      if (!pydioService) {
        setError('Failed to connect to Pydio. Please check your configuration.');
        return;
      }

      let success = true;
      for (const filePath of selectedFiles) {
        const result = await pydioService.delete(filePath);
        if (!result) {
          success = false;
        }
      }

      if (success) {
        setSelectedFiles([]);
        loadFiles();
      } else {
        setError('Failed to delete some items.');
      }
    } catch (err) {
      setError('An error occurred during deletion.');
      console.error('Error deleting files:', err);
    }
  };

  // Navigate to folder
  const navigateToFolder = (path: string) => {
    setCurrentPath(path);
    
    // Update breadcrumbs
    const parts = path.split('/').filter(p => p);
    const crumbs = [''];
    let currentCrumb = '';
    
    for (const part of parts) {
      currentCrumb += '/' + part;
      crumbs.push(currentCrumb);
    }
    
    setBreadcrumbs(crumbs);
  };

  // Navigate to parent folder
  const navigateToParent = () => {
    const parts = currentPath.split('/').filter(p => p);
    if (parts.length === 0) {
      return; // Already at root
    }
    
    parts.pop();
    const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
    navigateToFolder(parentPath);
  };

  // Toggle file selection
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      } else {
        return [...prev, filePath];
      }
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load files on mount and when path changes
  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Pydio File Manager</h1>
        
        {!isPydioConfigured() ? (
          <Card>
            <CardHeader>
              <CardTitle>Pydio Not Configured</CardTitle>
              <CardDescription>
                Please configure Pydio in the API Configurations page before using this feature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/admin/config'}>
                Go to API Configurations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs defaultValue="files" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Files</CardTitle>
                        <CardDescription>
                          Browse and manage your files
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={navigateToParent}
                          disabled={currentPath === '/'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                          Up
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={loadFiles}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M21 2v6h-6" />
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                            <path d="M3 22v-6h6" />
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                          </svg>
                          Refresh
                        </Button>
                        {selectedFiles.length > 0 && (
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteSelected}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete ({selectedFiles.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Breadcrumbs */}
                    <div className="flex items-center space-x-2 mb-4 text-sm">
                      {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <span>/</span>}
                          <button
                            className="hover:underline"
                            onClick={() => navigateToFolder(crumb)}
                          >
                            {index === 0 ? 'Root' : crumb.split('/').pop()}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {/* New folder input */}
                    <div className="flex space-x-2 mb-4">
                      <Input
                        placeholder="New folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button 
                        onClick={handleCreateFolder}
                        disabled={isCreatingFolder || !newFolderName.trim()}
                      >
                        {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                      </Button>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                        {error}
                      </div>
                    )}
                    
                    {isLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFiles(files.map(f => f.filepath));
                                  } else {
                                    setSelectedFiles([]);
                                  }
                                }}
                                checked={selectedFiles.length === files.length && files.length > 0}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Modified</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {files.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                No files found in this directory
                              </TableCell>
                            </TableRow>
                          ) : (
                            files.map((file) => (
                              <TableRow key={file.filepath}>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.filepath)}
                                    onChange={() => toggleFileSelection(file.filepath)}
                                  />
                                </TableCell>
                                <TableCell>
                                  {file.isFolder ? (
                                    <button
                                      className="flex items-center text-blue-500 hover:underline"
                                      onClick={() => navigateToFolder(file.filepath)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                      </svg>
                                      {file.filename}
                                    </button>
                                  ) : (
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14 2 14 8 20 8" />
                                      </svg>
                                      {file.filename}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{file.isFolder ? '--' : formatFileSize(file.size)}</TableCell>
                                <TableCell>{new Date(file.modificationDate).toLocaleString()}</TableCell>
                                <TableCell>
                                  {!file.isFolder && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFileDownload(file.filepath, file.filename)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                      </svg>
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="search" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Files</CardTitle>
                    <CardDescription>
                      Search for files across all directories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2 mb-6">
                      <Input
                        placeholder="Search query"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                        {error}
                      </div>
                    )}
                    
                    {isSearching ? (
                      <div className="text-center py-8">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((file) => (
                            <TableRow key={file.filepath}>
                              <TableCell>
                                {file.isFolder ? (
                                  <button
                                    className="flex items-center text-blue-500 hover:underline"
                                    onClick={() => navigateToFolder(file.filepath)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {file.filename}
                                  </button>
                                ) : (
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    {file.filename}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{file.filepath}</TableCell>
                              <TableCell>{file.isFolder ? '--' : formatFileSize(file.size)}</TableCell>
                              <TableCell>
                                {file.isFolder ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateToFolder(file.filepath)}
                                  >
                                    Open
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileDownload(file.filepath, file.filename)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="7 10 12 15 17 10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : searchQuery && !isSearching ? (
                      <div className="text-center py-8">No results found</div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="upload" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Files</CardTitle>
                    <CardDescription>
                      Upload files to the current directory: {currentPath}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                        {error}
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </div>
                    
                    {isUploading && (
                      <div className="mb-4">
                        <div className="text-sm mb-1">Uploading: {uploadProgress}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => setActiveTab('files')}
                      variant="outline"
                    >
                      Back to Files
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default PydioPage;
