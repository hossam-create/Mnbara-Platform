import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Tree, Spin, Button, Card, Typography, Tag } from 'antd';
import { LoadingOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const { Title, Text } = Typography;

interface CategoryNode {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  level: number;
  depth?: number;
  path?: string;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  hasChildren: boolean;
  productCount: number;
  children?: CategoryNode[];
  stats?: {
    productCount: number;
    activeListings: number;
    avgPrice: number;
  };
}

interface LazyCategoryTreeProps {
  onCategorySelect?: (category: CategoryNode) => void;
  maxDepth?: number;
  initialLoadLevel?: number;
  showStats?: boolean;
  expandLevel?: number;
  className?: string;
}

const LazyCategoryTree: React.FC<LazyCategoryTreeProps> = ({
  onCategorySelect,
  maxDepth = 4,
  initialLoadLevel = 2,
  showStats = true,
  expandLevel = 1,
  className = ''
}) => {
  const [treeData, setTreeData] = useState<CategoryNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedNodes, setLoadedNodes] = useState<Set<string>>(new Set());
  const cacheRef = useRef<Map<string, CategoryNode[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Fetch root categories
  const fetchRootCategories = useCallback(async () => {
    try {
      setLoading(true);
      abortControllerRef.current = new AbortController();
      
      const response = await axios.get(`${API_BASE}/categories`, {
        params: {
          level: 1,
          includeChildren: 'false',
          includeStats: showStats ? 'true' : 'false',
          sort: 'displayOrder',
          signal: abortControllerRef.current.signal
        }
      });

      if (response.data.success) {
        const rootCategories = response.data.data.map((cat: CategoryNode) => ({
          ...cat,
          children: cat.hasChildren ? [] : undefined
        }));
        
        setTreeData(rootCategories);
        
        // Auto-expand first level if specified
        if (expandLevel >= 1) {
          const firstLevelKeys = rootCategories
            .filter(cat => cat.hasChildren)
            .slice(0, 10) // Limit initial expansion
            .map(cat => cat.id);
          setExpandedKeys(firstLevelKeys);
          
          // Pre-load children for expanded nodes
          firstLevelKeys.forEach(key => {
            loadChildren(key);
          });
        }
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching root categories:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE, showStats, expandLevel]);

  // Load children for a specific node
  const loadChildren = useCallback(async (parentId: string) => {
    if (loadingKeys.has(parentId) || loadedNodes.has(parentId)) {
      return;
    }

    // Check cache first
    const cached = cacheRef.current.get(parentId);
    if (cached) {
      updateTreeWithChildren(parentId, cached);
      setLoadedNodes(prev => new Set([...prev, parentId]));
      return;
    }

    try {
      setLoadingKeys(prev => new Set([...prev, parentId]));
      
      const response = await axios.get(`${API_BASE}/categories`, {
        params: {
          parentId,
          includeStats: showStats ? 'true' : 'false',
          sort: 'displayOrder',
          limit: 100
        }
      });

      if (response.data.success) {
        const children = response.data.data.map((cat: CategoryNode) => ({
          ...cat,
          children: cat.hasChildren ? [] : undefined
        }));

        // Cache the result
        cacheRef.current.set(parentId, children);
        
        // Update tree with children
        updateTreeWithChildren(parentId, children);
        setLoadedNodes(prev => new Set([...prev, parentId]));
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoadingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentId);
        return newSet;
      });
    }
  }, [API_BASE, showStats, loadingKeys, loadedNodes]);

  // Update tree data with loaded children
  const updateTreeWithChildren = useCallback((parentId: string, children: CategoryNode[]) => {
    setTreeData(prevData => {
      const updateNode = (nodes: CategoryNode[]): CategoryNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: children.length > 0 ? children : undefined
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNode(node.children)
            };
          }
          return node;
        });
      };
      return updateNode(prevData);
    });
  }, []);

  // Handle node expansion
  const handleExpand = useCallback((expandedKeys: string[], info: any) => {
    setExpandedKeys(expandedKeys);
    
    if (info.expanded && info.node.hasChildren) {
      loadChildren(info.node.key);
    }
  }, [loadChildren]);

  // Handle node selection
  const handleSelect = useCallback((selectedKeys: string[], info: any) => {
    setSelectedKeys(selectedKeys);
    
    if (info.node && onCategorySelect) {
      const category = findNodeInTree(treeData, info.node.key);
      if (category) {
        onCategorySelect(category);
      }
    }
  }, [onCategorySelect, treeData]);

  // Find node in tree
  const findNodeInTree = useCallback((nodes: CategoryNode[], nodeId: string): CategoryNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children) {
        const found = findNodeInTree(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Build tree data for Ant Design Tree
  const antTreeData = useMemo(() => {
    const buildTreeNode = (node: CategoryNode): any => {
      const isLoading = loadingKeys.has(node.id);
      const isLoaded = loadedNodes.has(node.id);
      
      return {
        title: (
          <div className="lazy-tree-node">
            <div className="node-content">
              <span className="node-title">
                {node.name}
                {node.nameAr && <span className="node-title-ar"> / {node.nameAr}</span>}
              </span>
              {showStats && (
                <div className="node-stats">
                  <Tag size="small" color="blue">{node.productCount}</Tag>
                  {node.stats && (
                    <>
                      <Tag size="small" color="green">{node.stats.activeListings}</Tag>
                      <Tag size="small" color="orange">${node.stats.avgPrice.toFixed(0)}</Tag>
                    </>
                  )}
                </div>
              )}
            </div>
            {node.hasChildren && (
              <div className="node-actions">
                {isLoading ? (
                  <Spin size="small" indicator={<LoadingOutlined />} />
                ) : (
                  <Button
                    type="text"
                    size="small"
                    icon={expandedKeys.includes(node.id) ? <MinusOutlined /> : <PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (expandedKeys.includes(node.id)) {
                        setExpandedKeys(prev => prev.filter(key => key !== node.id));
                      } else {
                        setExpandedKeys(prev => [...prev, node.id]);
                        loadChildren(node.id);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ),
        key: node.id,
        children: node.children?.map(buildTreeNode),
        isLeaf: !node.hasChildren,
        icon: node.hasChildren ? (
          loadingKeys.has(node.id) ? <LoadingOutlined /> : null
        ) : null
      };
    };

    return treeData.map(buildTreeNode);
  }, [treeData, loadingKeys, loadedNodes, expandedKeys, showStats, loadChildren]);

  // Expand/Collapse all
  const expandAll = useCallback(() => {
    const getAllExpandableKeys = (nodes: CategoryNode[]): string[] => {
      const keys: string[] = [];
      nodes.forEach(node => {
        if (node.hasChildren) {
          keys.push(node.id);
          if (node.children) {
            keys.push(...getAllExpandableKeys(node.children));
          }
        }
      });
      return keys;
    };

    const allKeys = getAllExpandableKeys(treeData);
    setExpandedKeys(allKeys);
    
    // Load children for all expandable nodes
    allKeys.forEach(key => {
      if (!loadedNodes.has(key)) {
        loadChildren(key);
      }
    });
  }, [treeData, loadedNodes, loadChildren]);

  const collapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setLoadedNodes(new Set());
  }, []);

  // Load initial data
  useEffect(() => {
    fetchRootCategories();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRootCategories]);

  return (
    <div className={`lazy-category-tree ${className}`}>
      <Card
        className="tree-container"
        title={
          <div className="tree-header">
            <Title level={4}>Category Tree</Title>
            <div className="tree-actions">
              <Button size="small" onClick={expandAll}>
                Expand All
              </Button>
              <Button size="small" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button size="small" onClick={clearCache}>
                Clear Cache
              </Button>
            </div>
          </div>
        }
        size="small"
      >
        {loading ? (
          <div className="tree-loading">
            <Spin size="large" />
            <Text>Loading categories...</Text>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Tree
                treeData={antTreeData}
                onExpand={handleExpand}
                onSelect={handleSelect}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                showLine
                showIcon
                virtual
                height={600}
                className="category-tree"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </Card>
    </div>
  );
};

export default LazyCategoryTree;
