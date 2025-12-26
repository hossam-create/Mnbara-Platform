import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, Card, Button, Input, Modal, Form, Tree, Select, 
  Tag, Space, Typography, Row, Col, Statistic, message,
  Popconfirm, Upload, Drawer, Tabs, Alert, Tooltip,
  Progress, Switch, InputNumber, TreeSelect
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  UploadOutlined, DownloadOutlined, ReloadOutlined,
  FolderOpenOutlined, FolderAddOutlined, EyeOutlined,
  BarChartOutlined, SettingOutlined, DatabaseOutlined,
  ExportOutlined, ImportOutlined, SyncOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Line, Column, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  depth: number;
  path?: string;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  hasChildren: boolean;
  productCount: number;
  metadata?: any;
  children?: Category[];
  stats?: {
    productCount: number;
    activeListings: number;
    soldProducts: number;
    avgPrice: number;
    totalRevenue: number;
    viewCount: number;
    favoriteCount: number;
  };
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/categories`, {
        params: {
          includeStats: 'true',
          includeChildren: 'true',
          limit: 1000
        }
      });
      
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      message.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Create or update category
  const handleSaveCategory = async (values: any) => {
    try {
      setLoading(true);
      
      if (editingCategory) {
        await axios.put(`${API_BASE}/categories/${editingCategory.id}`, values);
        message.success('Category updated successfully');
      } else {
        await axios.post(`${API_BASE}/categories`, values);
        message.success('Category created successfully');
      }
      
      setModalVisible(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      message.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/categories/${categoryId}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Table columns
  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <div>
          <Text strong>{name}</Text>
          {record.nameAr && <div><Text type="secondary">{record.nameAr}</Text></div>}
        </div>
      )
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => <Tag color="blue">Level {level}</Tag>
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      render: (count: number) => <Tag color="green">{count.toLocaleString()}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Category) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCategory(record);
              setDrawerVisible(true);
            }}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCategory(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => handleDeleteCategory(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Toggle category status
  const handleToggleStatus = async (categoryId: string, isActive: boolean) => {
    try {
      await axios.patch(`${API_BASE}/categories/${categoryId}/status`, { isActive });
      message.success(`Category ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
    } catch (error) {
      message.error('Failed to update category status');
    }
  };

  // Import categories
  const handleImportCategories = async (file: File) => {
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.post(`${API_BASE}/categories/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      message.success('Categories imported successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to import categories');
    } finally {
      setUploadLoading(false);
    }
  };

  // Export categories
  const handleExportCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'categories.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Categories exported successfully');
    } catch (error) {
      message.error('Failed to export categories');
    }
  };

  return (
    <div className="category-management">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Title level={2}>Category Management</Title>
        <Text type="secondary">Manage your product categories and hierarchy</Text>
      </motion.div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Categories"
              value={categories.length}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Categories"
              value={categories.filter(c => c.isActive).length}
              prefix={<FolderOpenOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={categories.reduce((sum, cat) => sum + cat.productCount, 0)}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Products/Category"
              value={categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + cat.productCount, 0) / categories.length) : 0}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions Bar */}
      <Card style={{ marginTop: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Search
                placeholder="Search categories..."
                allowClear
                style={{ width: 300 }}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                placeholder="Filter by level"
                allowClear
                style={{ width: 150 }}
                onChange={setSelectedLevel}
              >
                <Option value={1}>Level 1</Option>
                <Option value={2}>Level 2</Option>
                <Option value={3}>Level 3</Option>
                <Option value={4}>Level 4+</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingCategory(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                Add Category
              </Button>
              <Upload
                accept=".csv,.xlsx"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImportCategories(file);
                  return false;
                }}
              >
                <Button icon={<ImportOutlined />} loading={uploadLoading}>
                  Import
                </Button>
              </Upload>
              <Button icon={<ExportOutlined />} onClick={handleExportCategories}>
                Export
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card style={{ marginTop: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="List View" key="list">
            <Table
              columns={tableColumns}
              dataSource={categories.filter(cat => {
                if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false;
                }
                if (selectedLevel && cat.level !== selectedLevel) {
                  return false;
                }
                return true;
              })}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          </TabPane>
          <TabPane tab="Tree View" key="tree">
            <Tree
              treeData={treeData}
              defaultExpandAll
              height={600}
              showLine
              showIcon
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveCategory}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            name="nameAr"
            label="Arabic Name"
          >
            <Input placeholder="Enter Arabic name" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
          >
            <Input placeholder="category-slug" />
          </Form.Item>

          <Form.Item
            name="parentId"
            label="Parent Category"
          >
            <TreeSelect
              placeholder="Select parent category"
              treeData={treeData}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please select level' }]}
          >
            <Select placeholder="Select level">
              <Option value={1}>Level 1</Option>
              <Option value={2}>Level 2</Option>
              <Option value={3}>Level 3</Option>
              <Option value={4}>Level 4</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
          >
            <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingCategory(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Category Details Drawer */}
      <Drawer
        title="Category Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        width={600}
      >
        {selectedCategory && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Name:</Text>
                <div>{selectedCategory.name}</div>
              </Col>
              <Col span={12}>
                <Text strong>Arabic Name:</Text>
                <div>{selectedCategory.nameAr || '-'}</div>
              </Col>
              <Col span={12}>
                <Text strong>Slug:</Text>
                <div>{selectedCategory.slug}</div>
              </Col>
              <Col span={12}>
                <Text strong>Level:</Text>
                <div>Level {selectedCategory.level}</div>
              </Col>
              <Col span={12}>
                <Text strong>Products:</Text>
                <div>{selectedCategory.productCount.toLocaleString()}</div>
              </Col>
              <Col span={12}>
                <Text strong>Status:</Text>
                <div>
                  <Tag color={selectedCategory.isActive ? 'green' : 'red'}>
                    {selectedCategory.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <Text strong>Description:</Text>
                <div>{selectedCategory.description || '-'}</div>
              </Col>
            </Row>

            {selectedCategory.stats && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Statistics</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="Active Listings"
                        value={selectedCategory.stats.activeListings}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="Sold Products"
                        value={selectedCategory.stats.soldProducts}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="Average Price"
                        value={selectedCategory.stats.avgPrice}
                        prefix="$"
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="Total Revenue"
                        value={selectedCategory.stats.totalRevenue}
                        prefix="$"
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CategoryManagement;
