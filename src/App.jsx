/**
 * Enterprise JSON Editor - Advanced Edition
 * Professional-grade JSON editor with features rivaling jsoncrack.com
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import JSONEditor from "jsoneditor";
import Editor from "@monaco-editor/react";
import { 
  FileText, 
  Download, 
  Upload, 
  Copy, 
  Search, 
  Sun, 
  Moon, 
  Settings, 
  Code, 
  FolderTree,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Network,
  FileJson,
  FileCode,
  FileText as FileTextIcon,
  Database,
  Zap,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  SortDesc,
  Layers,
  GitBranch,
  History,
  Save,
  RefreshCw,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
  BarElement
} from 'chart.js';
import * as d3 from 'd3';
import "jsoneditor/dist/jsoneditor.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
  BarElement
);

const STORAGE_KEY = "enterprise_json_editor_data_v3";
const THEME_KEY = "enterprise_json_editor_theme_v3";

export default function App() {
  const treeContainer = useRef(null);
  const treeEditor = useRef(null);
  const monacoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Core State
  const [theme, setTheme] = useState(
    localStorage.getItem(THEME_KEY) || "light"
  );
  const [jsonText, setJsonText] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });

  // Advanced State
  const [isValid, setIsValid] = useState(true);
  const [selectedPath, setSelectedPath] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("split");
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [visualData, setVisualData] = useState(null);
  const [treeUpdateTrigger, setTreeUpdateTrigger] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60);
  const [isTreeUpdating, setIsTreeUpdating] = useState(false);

  // Initialize JSONEditor with enhanced options
  useEffect(() => {
    if (!treeContainer.current) return;
    
    // Destroy existing editor if it exists
    if (treeEditor.current) {
      treeEditor.current.destroy();
      treeEditor.current = null;
    }
    
    const options = {
      mode: "tree",
      modes: ["tree", "view", "form", "code"],
      onEvent: (node, event) => {
        if (event && event.type === "click") {
          try {
            const path = node && node.path ? node.path.join(".") : null;
            setSelectedPath(path);
            if (path) {
              toast.success(`Selected: ${path}`);
              updatePerformanceMetrics('nodeSelection');
            }
          } catch (e) {
            setSelectedPath(null);
          }
        }
      },
      onChange: () => {
        try {
          const startTime = performance.now();
          const obj = treeEditor.current.get();
          const txt = JSON.stringify(obj, null, 2);
          setJsonText(txt);
          setIsValid(true);
          setValidationErrors([]);
          
          if (autoSave) {
          localStorage.setItem(STORAGE_KEY, txt);
          }
          
          if (monacoRef.current) {
            const monacoEditor = monacoRef.current.getModel();
            if (monacoEditor) {
              monacoRef.current.setValue(txt);
            }
          }
          
          const endTime = performance.now();
          updatePerformanceMetrics('jsonUpdate', endTime - startTime);
        } catch (err) {
          setIsValid(false);
          setValidationErrors([err.message]);
        }
      },
      onCreateMenu: (items, node) => {
        if (node && node.path) {
          items.push({
            text: "Copy Path",
            icon: "copy",
            click: () => copyToClipboard(node.path.join("."))
          });
          items.push({
            text: "Copy Value",
            icon: "content-copy",
            click: () => copyToClipboard(JSON.stringify(node.value))
          });
          items.push({
            text: "Export Node",
            icon: "download",
            click: () => exportNode(node)
          });
        }
        return items;
      },
      history: true,
      search: true,
      enableSort: true,
      enableFilter: true,
      colorPicker: true,
      colorPickerOptions: {
        left: 0,
        top: 0
      },
      onError: (err) => {
        console.error('JSONEditor error:', err);
        toast.error('Tree editor error occurred');
      }
    };

    try {
    treeEditor.current = new JSONEditor(treeContainer.current, options);
      
      // Set initial data
      try {
        if (jsonText.trim()) {
          const parsedData = JSON.parse(jsonText);
          treeEditor.current.set(parsedData);
        } else {
          treeEditor.current.set({});
        }
    } catch (e) {
      treeEditor.current.set({});
      }
      
      // Force refresh
      setTimeout(() => {
        if (treeEditor.current) {
          treeEditor.current.expandAll();
        }
      }, 100);
      
    } catch (e) {
      console.error('Failed to initialize JSONEditor:', e);
      toast.error('Failed to initialize tree editor');
    }

    return () => {
      if (treeEditor.current) {
        try {
        treeEditor.current.destroy();
        } catch (e) {
          console.warn('Error destroying JSONEditor:', e);
        }
        treeEditor.current = null;
      }
    };
  }, [viewMode]); // Add viewMode dependency to reinitialize when switching views

  // Enhanced theme effect
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    
      if (window.monaco) {
        window.monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "light");
    }
  }, [theme]);

  // Enhanced JSON text change effect
  useEffect(() => {
    if (!jsonText.trim()) {
      // Handle empty state
      setIsValid(true);
      setValidationErrors([]);
      setVisualData(null);
      setIsTreeUpdating(false);
      
      // Update tree editor with empty object
      if (treeEditor.current) {
        treeEditor.current.set({});
      }
      return;
    }
    
    try {
      const startTime = performance.now();
      const parsed = JSON.parse(jsonText);
      setIsValid(true);
      setValidationErrors([]);
      
      // Show tree updating state
      setIsTreeUpdating(true);
      
      // Update tree editor immediately
      if (treeEditor.current) {
        treeEditor.current.set(parsed);
        // Force tree refresh and expand
        setTimeout(() => {
          if (treeEditor.current) {
            try {
              treeEditor.current.expandAll();
            } catch (e) {
              console.warn('Error expanding tree:', e);
            }
          }
          setIsTreeUpdating(false);
        }, 300);
      } else {
        setIsTreeUpdating(false);
      }
      
      if (autoSave) {
      localStorage.setItem(STORAGE_KEY, jsonText);
      }
      
      // Update search results
      updateSearchResults(parsed);
      
      // Update visual data
      setVisualData(parsed);
      
      // Trigger tree update
      setTreeUpdateTrigger(prev => prev + 1);
      
      const endTime = performance.now();
      updatePerformanceMetrics('jsonParse', endTime - startTime);
    } catch (err) {
      setIsValid(false);
      setValidationErrors([err.message]);
      setIsTreeUpdating(false);
    }
  }, [jsonText, autoSave]);

  // Performance monitoring
  const updatePerformanceMetrics = useCallback((operation, duration = 0) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      [operation]: {
        count: (prev[operation]?.count || 0) + 1,
        lastDuration: duration,
        averageDuration: prev[operation] 
          ? (prev[operation].averageDuration + duration) / 2 
          : duration,
        timestamp: Date.now()
      }
    }));
  }, []);

  // Advanced search
  const updateSearchResults = useCallback((data) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const flattenedData = flattenObject(data);
      const results = flattenedData.filter(item => 
        item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.value.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 50);
      setSearchResults(results);
    } catch (err) {
      console.warn('Search error:', err);
    }
  }, [searchQuery]);

  // Flatten object for search
  const flattenObject = useCallback((obj, prefix = '') => {
    const flattened = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        flattened.push({
          key,
          path,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          type: Array.isArray(value) ? 'array' : typeof value
        });
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattened.push(...flattenObject(value, path));
        }
      }
    }
    return flattened;
  }, []);

  // Enhanced Monaco editor handlers
  const handleEditorMount = (editor, monaco) => {
    monacoRef.current = editor;
    
    if (window.monaco) {
      window.monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "light");
    }
  };

  const handleCodeChange = (val) => {
    setJsonText(val);
    
    if (!val.trim()) {
      // Handle empty state
      setIsValid(true);
      setValidationErrors([]);
      setVisualData(null);
      setIsTreeUpdating(false);
      
      // Update tree with empty object
      if (treeEditor.current) {
        treeEditor.current.set({});
      }
      return;
    }
    
    try {
      const obj = JSON.parse(val);
      // Show tree updating state
      setIsTreeUpdating(true);
      
      // Update tree immediately when code changes
      if (treeEditor.current) {
        treeEditor.current.set(obj);
        // Force tree refresh
        setTimeout(() => {
          if (treeEditor.current) {
            try {
              treeEditor.current.expandAll();
            } catch (e) {
              console.warn('Error expanding tree:', e);
            }
          }
          setIsTreeUpdating(false);
        }, 300);
      } else {
        setIsTreeUpdating(false);
      }
      setIsValid(true);
      setValidationErrors([]);
      
      if (autoSave) {
      localStorage.setItem(STORAGE_KEY, val);
      }
      
      // Update visual data
      setVisualData(obj);
    } catch (err) {
      setIsValid(false);
      setValidationErrors([err.message]);
      setIsTreeUpdating(false);
    }
  };

  // Enhanced utility functions
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const formatJSON = () => {
    try {
      const startTime = performance.now();
      const formatted = JSON.stringify(JSON.parse(jsonText), null, 2);
      setJsonText(formatted);
      const endTime = performance.now();
      updatePerformanceMetrics('format', endTime - startTime);
      toast.success("JSON formatted successfully");
    } catch (e) {
      toast.error("Cannot format invalid JSON");
    }
  };

  const minifyJSON = () => {
    try {
      const startTime = performance.now();
      const min = JSON.stringify(JSON.parse(jsonText));
      setJsonText(min);
      const endTime = performance.now();
      updatePerformanceMetrics('minify', endTime - startTime);
      toast.success("JSON minified successfully");
    } catch (e) {
      toast.error("Cannot minify invalid JSON");
    }
  };

  // Advanced export functions
  const exportToFormat = (format) => {
    try {
      const data = JSON.parse(jsonText);
      let content, filename, mimeType;
      
      switch (format) {
        case 'yaml':
          content = convertToYAML(data);
          filename = 'data.yaml';
          mimeType = 'text/yaml';
          break;
        case 'xml':
          content = convertToXML(data);
          filename = 'data.xml';
          mimeType = 'text/xml';
          break;
        case 'csv':
          content = convertToCSV(data);
          filename = 'data.csv';
          mimeType = 'text/csv';
          break;
        case 'sql':
          content = convertToSQL(data);
          filename = 'data.sql';
          mimeType = 'text/sql';
          break;
        default:
          content = JSON.stringify(data, null, 2);
          filename = 'data.json';
          mimeType = 'application/json';
      }
      
      const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
      a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  // Format conversion functions
  const convertToYAML = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${convertToYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}- ${JSON.stringify(item)}\n`;
        });
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }
    
    return yaml;
  };

  const convertToXML = (obj, rootName = 'root') => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
    
    const addNode = (data, indent = 1) => {
      const spaces = '  '.repeat(indent);
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          xml += `${spaces}<${key}>\n${addNode(value, indent + 1)}${spaces}</${key}>\n`;
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            xml += `${spaces}<${key}>${JSON.stringify(item)}</${key}>\n`;
          });
        } else {
          xml += `${spaces}<${key}>${value}</${key}>\n`;
        }
      }
      
      return '';
    };
    
    addNode(obj);
    xml += `</${rootName}>`;
    return xml;
  };

  const convertToCSV = (obj) => {
    const flatten = (data, prefix = '') => {
      const result = {};
      for (const [key, value] of Object.entries(data)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, flatten(value, newKey));
        } else {
          result[newKey] = value;
        }
      }
      return result;
    };
    
    const flattened = flatten(obj);
    const headers = Object.keys(flattened);
    const values = Object.values(flattened);
    
    return [headers.join(','), values.join(',')].join('\n');
  };

  const convertToSQL = (obj) => {
    const tableName = 'json_data';
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    
    const addColumns = (data, prefix = '') => {
      for (const [key, value] of Object.entries(data)) {
        const columnName = prefix ? `${prefix}_${key}` : key;
        const columnType = Array.isArray(value) ? 'TEXT' : 
                          typeof value === 'number' ? 'REAL' : 'TEXT';
        sql += `  ${columnName} ${columnType},\n`;
      }
    };
    
    addColumns(obj);
    sql = sql.slice(0, -2) + '\n);\n\n';
    
    // Add sample INSERT statement
    sql += `INSERT INTO ${tableName} VALUES (1, ${Object.values(obj).map(v => 
      typeof v === 'string' ? `'${v}'` : v
    ).join(', ')});\n`;
    
    return sql;
  };

  const exportNode = (node) => {
    try {
      const content = JSON.stringify(node.value, null, 2);
      const filename = `${node.path?.join('_') || 'node'}.json`;
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Node exported successfully');
    } catch (err) {
      toast.error('Node export failed');
    }
  };

  // Enhanced file operations
  const handleUploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target.result);
      toast.success(`File "${file.name}" loaded successfully`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
    
    e.target.value = "";
  };

  // Handle JSON paste events
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    try {
      // Try to parse as JSON
      JSON.parse(pastedText);
      // If valid JSON, update the text
      setJsonText(pastedText);
      toast.success("JSON pasted successfully");
    } catch (err) {
      // If not valid JSON, let the default paste behavior happen
      return;
    }
  };

  // Handle panel resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const container = document.querySelector('.split-layout');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const newEditorWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Limit editor width between 20% and 80%
      if (newEditorWidth >= 20 && newEditorWidth <= 80) {
        setEditorWidth(newEditorWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+R to reset panel sizes
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        setEditorWidth(60);
        toast.success("Panel sizes reset to default (Ctrl+R)");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Enhanced search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      try {
        const data = JSON.parse(jsonText);
        updateSearchResults(data);
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Enhanced copy operations
  const copySelectedPath = async () => {
    if (!selectedPath) {
      toast.error("Select a node in the tree first");
      return;
    }
    await copyToClipboard(selectedPath);
  };

  const copySelectedValue = async () => {
    if (!selectedPath) {
      toast.error("Select a node in the tree first");
      return;
    }
    
    try {
      const parts = selectedPath.split(".");
      let obj = treeEditor.current.get();
      for (const part of parts) {
        if (obj && typeof obj === "object") obj = obj[part];
        else obj = undefined;
      }
      await copyToClipboard(JSON.stringify(obj));
    } catch (e) {
      toast.error("Copy failed");
    }
  };

  const clearData = () => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      setJsonText("{}");
      toast.success("Data cleared");
    }
  };

  // Performance analysis
  const analyzePerformance = () => {
    try {
      const data = JSON.parse(jsonText);
      const analysis = {
        size: new Blob([jsonText]).size,
        depth: getMaxDepth(data),
        nodeCount: countNodes(data),
        memoryEstimate: estimateMemoryUsage(data)
      };
      
      toast.success(`Analysis complete: ${analysis.nodeCount} nodes, ${analysis.depth} levels deep`);
      console.log('Performance Analysis:', analysis);
    } catch (err) {
      toast.error("Performance analysis failed");
    }
  };

  const getMaxDepth = (obj, depth = 0) => {
    if (typeof obj !== 'object' || obj === null) return depth;
    return Math.max(depth, ...Object.values(obj).map(v => getMaxDepth(v, depth + 1)));
  };

  const countNodes = (obj) => {
    if (typeof obj !== 'object' || obj === null) return 1;
    return 1 + Object.values(obj).map(v => countNodes(v)).reduce((sum, count) => sum + count, 0);
  };

  const estimateMemoryUsage = (obj) => {
    const size = new Blob([JSON.stringify(obj)]).size;
    return `${(size / 1024).toFixed(2)} KB`;
  };

  // Visual tab functions
  const generateTreeMap = () => {
    if (!visualData) return null;
    
    try {
      const data = visualData;
      const treeMapData = {
        name: "root",
        children: Object.entries(data).map(([key, value]) => ({
          name: key,
          size: typeof value === 'object' ? Object.keys(value).length : 1,
          type: typeof value,
          children: typeof value === 'object' && value !== null ? 
            Object.entries(value).map(([k, v]) => ({
              name: k,
              size: typeof v === 'object' ? Object.keys(v).length : 1,
              type: typeof v
            })) : []
        }))
      };
      
      return treeMapData;
    } catch (err) {
      console.error('Error generating tree map:', err);
      return null;
    }
  };

  const generateNetworkData = () => {
    if (!visualData) return null;
    
    try {
      const data = visualData;
      const nodes = [];
      const links = [];
      let nodeId = 0;
      
      const processNode = (obj, parentId = null, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          const currentNodeId = nodeId++;
          
          nodes.push({
            id: currentNodeId,
            label: key,
            type: typeof value,
            path: currentPath,
            size: typeof value === 'object' && value !== null ? Object.keys(value).length : 1
          });
          
          if (parentId !== null) {
            links.push({
              source: parentId,
              target: currentNodeId,
              label: key
            });
          }
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            processNode(value, currentNodeId, currentPath);
          }
        }
      };
      
      processNode(data);
      return { nodes, links };
    } catch (err) {
      console.error('Error generating network data:', err);
      return null;
    }
  };

  const generateChartData = () => {
    if (!visualData) return null;
    
    try {
      const data = visualData;
      const chartData = {
        labels: [],
        datasets: []
      };
      
      const processData = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'number') {
            chartData.labels.push(currentPath);
            chartData.datasets.push({
              label: currentPath,
              value: value,
              type: 'number'
            });
          } else if (typeof value === 'string') {
            chartData.labels.push(currentPath);
            chartData.datasets.push({
              label: currentPath,
              value: value.length,
              type: 'string'
            });
          } else if (typeof value === 'object' && value !== null) {
            processData(value, currentPath);
          }
        }
      };
      
      processData(data);
      return chartData;
    } catch (err) {
      console.error('Error generating chart data:', err);
      return null;
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast.success(`Switched to ${theme === "dark" ? "light" : "dark"} theme`);
  };

  // Chart data preparation functions
  const prepareChartData = (data) => {
    if (!data || typeof data !== 'object') return null;
    
    try {
      // Data Types Distribution
      const types = {};
      const countTypes = (obj) => {
        for (const [key, value] of Object.entries(obj)) {
          const type = typeof value;
          types[type] = (types[type] || 0) + 1;
          if (type === 'object' && value !== null && !Array.isArray(value)) {
            countTypes(value);
          }
        }
      };
      countTypes(data);
      
      // Structure Depth Analysis
      const depths = {};
      const maxDepth = getMaxDepth(data);
      for (let i = 1; i <= maxDepth; i++) {
        depths[i] = 0;
      }
      
      const countAtDepth = (obj, depth = 1) => {
        depths[depth] = (depths[depth] || 0) + 1;
        if (depth < maxDepth) {
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              countAtDepth(value, depth + 1);
            }
          }
        }
      };
      countAtDepth(data);
      
      // Property Distribution
      const properties = {};
      const countProperties = (obj) => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            const propCount = Object.keys(value).length;
            properties[propCount] = (properties[propCount] || 0) + 1;
            countProperties(value);
          }
        }
      };
      countProperties(data);
      
      return { types, depths, properties, maxDepth };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return null;
    }
  };

  // D3 Force Graph Component
  const ForceGraph = ({ data }) => {
    const svgRef = useRef();

  useEffect(() => {
      if (!data || !svgRef.current) return;
      
      try {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        
        const width = 800;
        const height = 600;
        
        // Create nodes and links
        const nodes = [];
        const links = [];
        
        const processNode = (obj, parentId = null, depth = 0) => {
          if (depth > 3) return; // Limit depth for performance
          
          for (const [key, value] of Object.entries(obj)) {
            const nodeId = `${parentId ? parentId + '.' : ''}${key}`;
            nodes.push({
              id: nodeId,
              name: key,
              type: typeof value,
              size: typeof value === 'object' && value !== null ? Object.keys(value).length : 1,
              depth: depth
            });
            
            if (parentId) {
              links.push({
                source: parentId,
                target: nodeId
              });
            }
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              processNode(value, nodeId, depth + 1);
            }
          }
        };
        
        processNode(data);
        
        if (nodes.length === 0) {
          svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#666")
            .text("No data to visualize");
          return;
        }
        
        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id(d => d.id).distance(100))
          .force("charge", d3.forceManyBody().strength(-300))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collision", d3.forceCollide().radius(30));
        
        // Create links
        const link = svg.append("g")
          .selectAll("line")
          .data(links)
          .enter().append("line")
          .attr("stroke", "#999")
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 2);
        
        // Create nodes
        const node = svg.append("g")
          .selectAll("g")
          .data(nodes)
          .enter().append("g")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        
        // Add circles to nodes
        node.append("circle")
          .attr("r", d => Math.max(8, Math.min(20, d.size * 2)))
          .attr("fill", d => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            return colors[d.depth % colors.length];
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
        
        // Add labels to nodes
        node.append("text")
          .text(d => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name)
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("font-size", "10px")
          .attr("fill", "#fff")
          .attr("font-weight", "bold");
        
        // Update positions on simulation tick
        simulation.on("tick", () => {
          link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
          
          node
            .attr("transform", d => `translate(${d.x},${d.y})`);
        });
        
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        
        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }
        
        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
        
        return () => simulation.stop();
      } catch (error) {
        console.error('Error rendering force graph:', error);
        if (svgRef.current) {
          const svg = d3.select(svgRef.current);
          svg.selectAll("*").remove();
          svg.append("text")
            .attr("x", 400)
            .attr("y", 300)
            .attr("text-anchor", "middle")
            .attr("fill", "#ef4444")
            .text("Graph error: " + error.message);
        }
      }
    }, [data]);
    
    return (
      <div className="force-graph-container">
        <h4>Interactive Data Flow Graph</h4>
        <p className="graph-description">Drag nodes to explore relationships. Node size indicates complexity.</p>
        <svg ref={svgRef} width="800" height="600" className="force-graph"></svg>
      </div>
    );
  };

  return (
    <div className={`app ${theme === "dark" ? "dark" : ""}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#f9fafb" : "#111827",
            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`
          }
        }}
      />
      
      {/* Enhanced Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <Code className="w-6 h-6 text-blue-600" />
            <span className="logo-text">Enterprise JSON Editor - Advanced</span>
          </div>
          <div className="version-badge">v2.0.0</div>
        </div>
        
        <div className="header-center">
          <div className="view-mode-selector">
            <button
              className={`view-btn ${viewMode === "split" ? "active" : ""}`}
              onClick={() => setViewMode("split")}
              title="Split View - Editor Left, Tree Right (Resizable)"
            >
              <div className="split-icon">
                <div className="split-left"></div>
                <div className="split-right"></div>
              </div>
              Split
            </button>
            <button
              className={`view-btn ${viewMode === "visual" ? "active" : ""}`}
              onClick={() => setViewMode("visual")}
              title="Visualization Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
              Visual
            </button>
          </div>
          
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="header-right">
          <button
            className="advanced-btn"
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            title="Advanced Features"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Enhanced Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="tool-group">
            <button onClick={formatJSON} className="tool-btn primary" title="Format JSON">
              <FileText className="w-4 h-4" />
              Format
            </button>
            <button onClick={minifyJSON} className="tool-btn" title="Minify JSON">
              <Code className="w-4 h-4" />
              Minify
            </button>
          </div>

          <div className="tool-separator" />

          <div className="tool-group">
            <button onClick={() => fileInputRef.current?.click()} className="tool-btn" title="Upload JSON file">
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>

          <div className="tool-separator" />

          <div className="tool-group">
            <button onClick={() => exportToFormat('json')} className="tool-btn" title="Export as JSON">
              <FileJson className="w-4 h-4" />
              JSON
            </button>
            <button onClick={() => exportToFormat('yaml')} className="tool-btn" title="Export as YAML">
              <FileTextIcon className="w-4 h-4" />
              YAML
            </button>
            <button onClick={() => exportToFormat('xml')} className="tool-btn" title="Export as XML">
              <FileCode className="w-4 h-4" />
              XML
            </button>
          </div>

          <div className="tool-separator" />

          <div className="tool-group">
            <button onClick={copySelectedPath} className="tool-btn" title="Copy selected path" disabled={!selectedPath}>
              <Copy className="w-4 h-4" />
              Copy Path
            </button>
            <button onClick={copySelectedValue} className="tool-btn" title="Copy selected value" disabled={!selectedPath}>
              <Copy className="w-4 h-4" />
              Copy Value
            </button>
          </div>

          <div className="tool-separator" />

          <div className="search-container">
            <Search className="w-4 h-4 search-icon" />
          <input
              placeholder="Advanced search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="search-input"
          />
            <button onClick={handleSearch} className="search-btn" title="Search">
              Go
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="status-indicator">
            {isValid ? (
              <div className="status valid">
                <CheckCircle className="w-4 h-4" />
                <span>Valid JSON</span>
              </div>
            ) : (
              <div className="status invalid">
                <AlertCircle className="w-4 h-4" />
                <span>Invalid JSON</span>
              </div>
            )}
          </div>
          
          <button onClick={analyzePerformance} className="tool-btn info" title="Analyze Performance">
            <BarChart3 className="w-4 h-4" />
            Analyze
          </button>
          
          <button onClick={clearData} className="tool-btn danger" title="Clear all data">
            Clear
          </button>
        </div>
      </div>

      {/* Advanced Panel */}
      {showAdvancedPanel && (
        <div className="advanced-panel">
          <div className="advanced-header">
            <h3>Advanced Features</h3>
            <button onClick={() => setShowAdvancedPanel(false)} className="close-btn">×</button>
        </div>
          <div className="advanced-content">
            <div className="advanced-section">
              <h4>Performance Metrics</h4>
              <div className="metrics-display">
                {Object.entries(performanceMetrics).map(([key, metric]) => (
                  <div key={key} className="metric-item">
                    <span className="metric-label">{key}:</span>
                    <span className="metric-value">{metric.count} calls</span>
                    <span className="metric-avg">Avg: {metric.averageDuration?.toFixed(2)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Settings</h3>
            <button onClick={() => setShowSettings(false)} className="close-btn">×</button>
          </div>
          <div className="settings-content">
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
                Auto-save to localStorage
              </label>
            </div>
            <div className="setting-group">
              <label>Font Size: {fontSize}px</label>
              <input
                type="range"
                min="10"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={wordWrap}
                  onChange={(e) => setWordWrap(e.target.checked)}
                />
                Word Wrap
              </label>
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                />
                Show Line Numbers
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="search-results-header">
            <Search className="w-4 h-4" />
            <span>Search Results ({searchResults.length})</span>
            <button onClick={() => setSearchResults([])} className="close-btn">×</button>
          </div>
          <div className="search-results-content">
            {searchResults.map((result, index) => (
              <div key={index} className="search-result-item" onClick={() => {
                setSelectedPath(result.path);
                toast.success(`Navigated to: ${result.path}`);
              }}>
                <div className="result-path">{result.path}</div>
                <div className="result-value">{result.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <div className="error-header">
            <AlertCircle className="w-4 h-4" />
            <span>JSON Validation Errors</span>
          </div>
          {validationErrors.map((error, index) => (
            <div key={index} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Main Editor Area */}
      <div className="editor-container">
        {viewMode === "split" && (
          <div className={`split-layout ${isResizing ? 'resizing' : ''}`}>
            <div 
              className="code-panel" 
              style={{ width: `${editorWidth}%` }}
            >
              <div className="panel-header">
                <Code className="w-4 h-4" />
                <span>Code Editor</span>
              </div>
              {!jsonText.trim() ? (
                <div className="empty-editor">
                  <div className="empty-content">
                    <FileJson className="w-16 h-16 text-gray-400" />
                    <h3>Welcome to Enterprise JSON Editor</h3>
                    <p>Start by pasting JSON data, uploading a file, or typing your JSON structure</p>
                    <div className="empty-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => {
                          const sampleData = JSON.stringify({
                            message: "Hello World",
                            timestamp: new Date().toISOString(),
                            example: true
                          }, null, 2);
                          setJsonText(sampleData);
                          toast.success("Sample data loaded");
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Load Sample Data
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        Upload JSON File
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
          <Editor
            height="100%"
            defaultLanguage="json"
            value={jsonText}
            onChange={handleCodeChange}
                  onPaste={handlePaste}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
                    fontSize: fontSize,
                    wordWrap: wordWrap ? "on" : "off",
                    lineNumbers: showLineNumbers ? "on" : "off",
              formatOnPaste: true,
              formatOnType: true,
              automaticLayout: true,
                    scrollBeyondLastLine: false,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: "line",
            }}
          />
              )}
        </div>
            
            <div 
              className="resize-handle"
              onMouseDown={(e) => {
                setIsResizing(true);
                e.preventDefault();
              }}
              onDoubleClick={() => {
                setEditorWidth(60);
                toast.success("Panel sizes reset to default");
              }}
              title="Drag to resize • Double-click to reset"
            />
            
            <div 
              className="tree-panel" 
              style={{ width: `${100 - editorWidth}%` }}
            >
              <div className="panel-header">
                <FolderTree className="w-4 h-4" />
                <span>Tree View</span>
                {isTreeUpdating && (
                  <div className="tree-updating">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
      </div>
                )}
                {selectedPath && (
                  <div className="selected-path">
                    Selected: <code>{selectedPath}</code>
    </div>
                )}
              </div>
              <div ref={treeContainer} className="tree-container" />
              {!jsonText.trim() && (
                <div className="empty-tree">
                  <div className="empty-tree-content">
                    <FolderTree className="w-16 h-16 text-gray-400" />
                    <h3>Tree View</h3>
                    <p>Add some JSON data to see the interactive tree structure</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === "visual" && (
          <div className="visual-panel full-width">
            <div className="panel-header">
              <BarChart3 className="w-4 h-4" />
              <span>Advanced Data Visualization</span>
            </div>
            <div className="visual-content">
              {visualData ? (
                <div className="visual-dashboard">
                  {/* Overview Cards */}
                  <div className="overview-cards">
                    <div className="overview-card primary">
                      <div className="card-icon">
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="card-content">
                        <div className="card-value">{countNodes(visualData)}</div>
                        <div className="card-label">Total Nodes</div>
                      </div>
                    </div>
                    
                    <div className="overview-card success">
                      <div className="card-icon">
                        <GitBranch className="w-6 h-6" />
                      </div>
                      <div className="card-content">
                        <div className="card-value">{getMaxDepth(visualData)}</div>
                        <div className="card-label">Max Depth</div>
                      </div>
                    </div>
                    
                    <div className="overview-card warning">
                      <div className="card-icon">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="card-content">
                        <div className="card-value">{estimateMemoryUsage(visualData)}</div>
                        <div className="card-label">Data Size</div>
                      </div>
                    </div>
                    
                    <div className="overview-card info">
                      <div className="card-icon">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="card-content">
                        <div className="card-value">{Object.keys(visualData).length}</div>
                        <div className="card-label">Root Properties</div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Force Graph */}
                  <div className="visual-section">
                    <h3>🕸️ Interactive Data Flow Graph</h3>
                    <div className="force-graph-wrapper">
                      <ForceGraph data={visualData} />
                    </div>
                  </div>

                  {/* Real Charts Section */}
                  <div className="visual-section">
                    <h3>📊 Data Analytics Charts</h3>
                    <div className="charts-grid">
                      {/* Data Types Doughnut Chart */}
                      <div className="chart-container">
                        <h4>Data Types Distribution</h4>
                        {(() => {
                          try {
                            const chartData = prepareChartData(visualData);
                            if (!chartData || !chartData.types) return <div>No data available</div>;
                            
                            const doughnutData = {
                              labels: Object.keys(chartData.types).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
                              datasets: [{
                                data: Object.values(chartData.types),
                                backgroundColor: [
                                  '#3b82f6',
                                  '#10b981',
                                  '#f59e0b',
                                  '#ef4444',
                                  '#8b5cf6',
                                  '#06b6d4'
                                ],
                                borderWidth: 2,
                                borderColor: '#fff'
                              }]
                            };
                            
                            return (
                              <Doughnut 
                                data={doughnutData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom'
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                                          return `${context.label}: ${context.parsed} (${percentage}%)`;
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            );
                          } catch (error) {
                            console.error('Error rendering doughnut chart:', error);
                            return <div>Chart error: {error.message}</div>;
                          }
                        })()}
                      </div>

                      {/* Structure Depth Bar Chart */}
                      <div className="chart-container">
                        <h4>Structure Depth Analysis</h4>
                        {(() => {
                          try {
                            const chartData = prepareChartData(visualData);
                            if (!chartData || !chartData.depths) return <div>No data available</div>;
                            
                            const barData = {
                              labels: Object.keys(chartData.depths).map(depth => `Level ${depth}`),
                              datasets: [{
                                label: 'Node Count',
                                data: Object.values(chartData.depths),
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderColor: '#3b82f6',
                                borderWidth: 2,
                                borderRadius: 4
                              }]
                            };
                            
                            return (
                              <Bar 
                                data={barData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      title: {
                                        display: true,
                                        text: 'Number of Nodes'
                                      }
                                    },
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Depth Level'
                                      }
                                    }
                                  }
                                }}
                              />
                            );
                          } catch (error) {
                            console.error('Error rendering bar chart:', error);
                            return <div>Chart error: {error.message}</div>;
                          }
                        })()}
                      </div>

                      {/* Property Distribution Line Chart */}
                      <div className="chart-container">
                        <h4>Property Distribution Trend</h4>
                        {(() => {
                          try {
                            const chartData = prepareChartData(visualData);
                            if (!chartData || !chartData.properties) return <div>No data available</div>;
                            
                            const sortedProps = Object.entries(chartData.properties)
                              .sort(([a], [b]) => parseInt(a) - parseInt(b))
                              .slice(0, 20); // Limit to first 20 for readability
                            
                            if (sortedProps.length === 0) return <div>No property data available</div>;
                            
                            const lineData = {
                              labels: sortedProps.map(([count]) => `${count} props`),
                              datasets: [{
                                label: 'Frequency',
                                data: sortedProps.map(([, freq]) => freq),
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 4,
                                pointHoverRadius: 6
                              }]
                            };
                            
                            return (
                              <Line 
                                data={lineData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      title: {
                                        display: true,
                                        text: 'Frequency'
                                      }
                                    },
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Property Count'
                                      }
                                    }
                                  }
                                }}
                              />
                            );
                          } catch (error) {
                            console.error('Error rendering line chart:', error);
                            return <div>Chart error: {error.message}</div>;
                          }
                        })()}
                      </div>

                      {/* Radar Chart for Data Complexity */}
                      <div className="chart-container">
                        <h4>Data Complexity Radar</h4>
                        {(() => {
                          try {
                            const chartData = prepareChartData(visualData);
                            if (!chartData) return <div>No data available</div>;
                            
                            const complexity = {
                              labels: ['Depth', 'Diversity', 'Size', 'Relationships', 'Complexity'],
                              datasets: [{
                                label: 'Current Data',
                                data: [
                                  Math.min(100, (chartData.maxDepth / 10) * 100), // Normalize depth
                                  Math.min(100, (Object.keys(chartData.types || {}).length / 6) * 100), // Normalize types
                                  Math.min(100, (countNodes(visualData) / 1000) * 100), // Normalize size
                                  Math.min(100, (Object.keys(chartData.properties || {}).length / 50) * 100), // Normalize properties
                                  Math.min(100, (chartData.maxDepth * Object.keys(chartData.types || {}).length) / 10) // Complexity score
                                ],
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                borderColor: '#8b5cf6',
                                borderWidth: 3,
                                pointBackgroundColor: '#8b5cf6',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: '#8b5cf6'
                              }]
                            };
                            
                            return (
                              <Radar 
                                data={complexity}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    r: {
                                      beginAtZero: true,
                                      max: 100,
                                      ticks: {
                                        stepSize: 20
                                      }
                                    }
                                  }
                                }}
                              />
                            );
                          } catch (error) {
                            console.error('Error rendering radar chart:', error);
                            return <div>Chart error: {error.message}</div>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>

// Functional Tree Map but not very functional
                  <div className="visual-section">
                    <h3>🌳 Interactive Tree Map</h3>
                    <div className="tree-map-container">
                      <div className="tree-map">
                        {Object.entries(visualData).map(([key, value]) => (
                          <div 
                            key={key} 
                            className={`tree-map-node ${selectedPath === key ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedPath(key);
                              toast.success(`Selected: ${key}`);
                            }}
                          >
                            <div className="node-header">
                              <FolderTree className="w-4 h-4" />
                              <span className="node-name">{key}</span>
                              <span className="node-type">({typeof value})</span>
                            </div>
                            <div className="node-details">
                              {typeof value === 'object' && value !== null ? (
                                <div className="node-stats">
                                  <span className="stat-item">
                                    <strong>{Object.keys(value).length}</strong> properties
                                  </span>
                                  <span className="stat-item">
                                    <strong>{countNodes(value)}</strong> total nodes
                                  </span>
                                  <span className="stat-item">
                                    <strong>{getMaxDepth(value)}</strong> levels deep
                                  </span>
                                </div>
                              ) : (
                                <div className="node-value">
                                  Value: <code>{String(value).substring(0, 100)}</code>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="visual-section">
                    <h3>🚀 Quick Actions</h3>
                    <div className="quick-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => {
                          setViewMode('split');
                          toast.success('Switched to split view');
                        }}
                      >
                        <Maximize2 className="w-4 h-4" />
                        Edit & Navigate
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => {
                          if (treeEditor.current) {
                            treeEditor.current.expandAll();
                            toast.success('All nodes expanded');
                          }
                        }}
                      >
                        <FolderTree className="w-4 h-4" />
                        Expand All
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => {
                          if (treeEditor.current) {
                            treeEditor.current.collapseAll();
                            toast.success('All nodes collapsed');
                          }
                        }}
                      >
                        <Minimize2 className="w-4 h-4" />
                        Collapse All
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => {
                          const analysis = {
                            nodes: countNodes(visualData),
                            depth: getMaxDepth(visualData),
                            size: estimateMemoryUsage(visualData),
                            timestamp: new Date().toISOString()
                          };
                          console.log('JSON Analysis:', analysis);
                          toast.success('Analysis logged to console');
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                        Export Analysis
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="visual-placeholder">
                  <BarChart3 className="w-16 h-16 text-gray-400" />
                  <h3>No Data Available</h3>
                  <p>Load some JSON data to see advanced visualizations</p>
                  <div className="visual-features">
                    <div className="feature-item">
                      <Network className="w-6 h-6" />
                      <span>Interactive Force Graph</span>
                    </div>
                    <div className="feature-item">
                      <BarChart3 className="w-6 h-6" />
                      <span>Real Charts & Graphs</span>
                    </div>
                    <div className="feature-item">
                      <GitBranch className="w-6 h-6" />
                      <span>Data Flow Analysis</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        onChange={handleUploadFile}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
      />
    </div>
  );
}
