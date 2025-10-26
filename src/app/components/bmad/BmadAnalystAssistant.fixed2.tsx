import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Send, Loader2, Database, FileText, Globe, Tag, AlertTriangle } from 'lucide-react';
import { ArchonService } from '../../services/archon';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import ErrorBoundary from '../common/ErrorBoundary';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: {
    id: string;
    name: string;
    type: 'url' | 'document' | 'database';
    content?: string;
  }[];
  isThinking?: boolean;
}

interface BmadAnalystAssistantProps {
  onClose: () => void;
  archonService: ArchonService | null;
  useFallbackMode?: boolean;
}
