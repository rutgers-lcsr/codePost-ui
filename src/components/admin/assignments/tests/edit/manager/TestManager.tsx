import { useEffect, useState, useCallback } from 'react';
import { Button, Empty, Spin, message, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AssignmentType, TestCategoryType } from '../../../../../../infrastructure/types';
import { TestCategory } from '../../../../../../infrastructure/testCategory';
import { TestCategoryUI } from './TestCategoryUI';
import { loadIDList } from '../../../../../../infrastructure/generics';
import styles from '../../../rubric/RubricSideBar.module.css'; // Reusing styles

interface IProps {
  assignment: AssignmentType;
  onSave?: () => void;
}

export const TestManager = (props: IProps) => {
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      if (props.assignment.testCategories) {
        const cats = await loadIDList(props.assignment.testCategories, TestCategory);
        setCategories(cats.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0)));
        if (cats.length > 0 && !activeCategoryId) {
          setActiveCategoryId(cats[0].id);
        }
      }
    } catch (e) {
      message.error('Failed to load test categories');
    } finally {
      setLoading(false);
    }
  }, [props.assignment.id, props.assignment.testCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    try {
      const newCat = await TestCategory.create({
        id: -1,
        name: `New Test Category ${categories.length + 1}`,
        assignment: props.assignment.id,
        testScript: '',
        maxPoints: 10, // Default
        sortKey: categories.length,
        targetFileName: null,

      });
      setCategories([...categories, newCat]);
      setActiveCategoryId(newCat.id);
      message.success('Category created');
    } catch (e) {
      message.error('Failed to create category');
    }
  };

  const handleDeleteCategory = async (cat: TestCategoryType) => {
    try {
      await TestCategory.delete(cat);
      const newCats = categories.filter((c) => c.id !== cat.id);
      setCategories(newCats);
      if (activeCategoryId === cat.id) {
        setActiveCategoryId(newCats.length > 0 ? newCats[0].id : undefined);
      }
      message.success('Category deleted');
    } catch (e) {
      message.error('Failed to delete category');
    }
  };

  const handleUpdateCategory = (updated: TestCategoryType) => {
    setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
  };

  if (loading && categories.length === 0) return <Spin />;

  const sortedCategories = categories; // Already sorted
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 200px)',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <div
        className={styles.sidebarContainer}
        style={{ width: 250, borderRight: '1px solid #f0f0f0', background: '#fafafa' }}
      >
        <div
          className={styles.sidebarHeader}
          style={{
            padding: '10px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span className={styles.sidebarTitle} style={{ fontWeight: 600 }}>
            Test Categories
          </span>
          <Tooltip title="Add new category">
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddCategory} />
          </Tooltip>
        </div>

        <ul
          className={styles.sidebarList}
          style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', height: '100%' }}
        >
          {sortedCategories.map((cat, _) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <li
                key={cat.id}
                className={isActive ? styles.sidebarItemActive : ''}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  background: isActive ? '#e6f7ff' : 'transparent',
                  borderRight: isActive ? '3px solid #1890ff' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Untitled</span>}
                </div>
                {isActive && (
                  <Popconfirm
                    title="Delete category?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                    placement="right"
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                )}
              </li>
            );
          })}
          {sortedCategories.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c', fontSize: '13px' }}>
              No categories yet
            </div>
          )}
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        {activeCategory ? (
          <TestCategoryUI
            key={activeCategory.id}
            category={activeCategory}
            assignment={props.assignment}
            onUpdate={handleUpdateCategory}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Select or create a test category"
            style={{ marginTop: 100 }}
          >
            <Button type="primary" onClick={handleAddCategory}>
              Create Category
            </Button>
          </Empty>
        )}
      </div>
    </div>
  );
};
