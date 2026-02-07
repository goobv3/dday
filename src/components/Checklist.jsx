import React, { useState, useEffect } from 'react';

const Checklist = ({ project, onUpdate, onSaveRequest }) => {
  // Use project categories directly. 
  // 'activeTab' now refers to the category ID.
  const categories = project.categories || [];
  const [activeTabId, setActiveTabId] = useState(categories.length > 0 ? categories[0].id : null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Save Status Feedback
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success, error

  // If active tab doesn't exist (deleted), switch to first
  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === activeTabId)) {
      setActiveTabId(categories[0].id);
    }
  }, [categories, activeTabId]);

  const activeCategory = categories.find(c => c.id === activeTabId);

  // --- Handlers ---

  const handleManualSave = async () => {
    setSaveStatus('saving');
    const success = await onSaveRequest();
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateCategory = (categoryId, newItems, autoSave = false) => {
    const newCategories = categories.map(c =>
      c.id === categoryId ? { ...c, items: newItems } : c
    );
    onUpdate({ ...project, categories: newCategories }, autoSave);
  };

  const updateCategoryLabel = (categoryId, newLabel) => {
    const newCategories = categories.map(c =>
      c.id === categoryId ? { ...c, label: newLabel } : c
    );
    onUpdate({ ...project, categories: newCategories }, true);
  };

  const addCategory = () => {
    const name = prompt("새 카테고리 이름:");
    if (!name) return;
    const newCat = {
      id: `c-${Date.now()}`,
      label: name,
      items: []
    };
    onUpdate({ ...project, categories: [...categories, newCat] }, true);
    setActiveTabId(newCat.id);
  };

  const deleteCategory = (categoryId) => {
    if (!confirm("이 카테고리와 모든 항목을 삭제포함시겠습니까?")) return;
    const newCategories = categories.filter(c => c.id !== categoryId);
    onUpdate({ ...project, categories: newCategories }, true);
  };

  // --- Item Actions (Delegated to Category Update) ---

  const toggleSubItem = (parentId, subId) => {
    if (isEditMode) return;
    if (!activeCategory) return;

    const newItems = activeCategory.items.map(parent => {
      if (parent.id !== parentId) return parent;
      return {
        ...parent,
        subItems: parent.subItems.map(sub =>
          sub.id === subId ? { ...sub, checked: !sub.checked } : sub
        )
      };
    });
    updateCategory(activeTabId, newItems, true); // Auto-save
  };

  const toggleExpand = (parentId) => {
    if (!activeCategory) return;
    const newItems = activeCategory.items.map(parent =>
      parent.id === parentId ? { ...parent, isExpanded: !parent.isExpanded } : parent
    );
    updateCategory(activeTabId, newItems, true); // Auto-save (preference)
  };

  // --- Edit Actions ---

  const updateLabel = (parentId, subId, newText) => {
    if (!activeCategory) return;
    const newItems = activeCategory.items.map(parent => {
      if (parent.id !== parentId) return parent;
      if (subId === null) {
        // Parent Label
        return { ...parent, label: newText };
      } else {
        // Sub Label
        return {
          ...parent,
          subItems: parent.subItems.map(sub =>
            sub.id === subId ? { ...sub, label: newText } : sub
          )
        };
      }
    });
    // Don't auto-save on every keystroke, wait for blur
    // But passing false here means we update state locally
    updateCategory(activeTabId, newItems, false);
  };

  const handleLabelBlur = () => {
    // Trigger save on blur
    updateCategory(activeTabId, activeCategory.items, true);
  };

  const updateDate = (parentId, newDate) => {
    if (!activeCategory) return;
    const newItems = activeCategory.items.map(parent =>
      parent.id === parentId ? { ...parent, targetDate: newDate } : parent
    );
    updateCategory(activeTabId, newItems, true);
  };

  const addSubItem = (parentId) => {
    if (!activeCategory) return;
    const newItems = activeCategory.items.map(parent => {
      if (parent.id !== parentId) return parent;
      const newId = `${parentId}-${parent.subItems.length + 1}-${Date.now()}`;
      return {
        ...parent,
        isExpanded: true,
        subItems: [...parent.subItems, { id: newId, label: '새로운 할 일', checked: false }]
      };
    });
    updateCategory(activeTabId, newItems, true);
  };

  const deleteItem = (parentId, subId) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    if (!activeCategory) return;

    let newItems;
    if (subId === null) {
      // Delete Parent
      newItems = activeCategory.items.filter(p => p.id !== parentId);
    } else {
      // Delete SubItem
      newItems = activeCategory.items.map(parent => {
        if (parent.id !== parentId) return parent;
        return {
          ...parent,
          subItems: parent.subItems.filter(s => s.id !== subId)
        };
      });
    }
    updateCategory(activeTabId, newItems, true);
  };

  const addParentItem = () => {
    if (!activeCategory) return;
    const newId = `new-${Date.now()}`;
    const newItem = {
      id: newId,
      label: '새로운 목표',
      targetDate: '',
      isExpanded: true,
      subItems: []
    };
    updateCategory(activeTabId, [...activeCategory.items, newItem], true);
  };

  // --- Helpers ---

  const getDDay = (dateString) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = target - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    let urgencyClass = '';
    if (days >= 0 && days <= 3) urgencyClass = 'urgency-critical';
    else if (days > 3 && days <= 7) urgencyClass = 'urgency-warning';

    if (days === 0) return { label: 'D-Day', urgency: 'urgency-critical' };
    if (days < 0) return { label: `D+${Math.abs(days)}`, urgency: 'passed' };
    return { label: `D-${days}`, urgency: urgencyClass };
  };

  const calculateTotalProgress = () => {
    if (!activeCategory) return 0;
    let totalSubs = 0;
    let checkedSubs = 0;

    activeCategory.items.forEach(p => {
      p.subItems.forEach(s => {
        totalSubs++;
        if (s.checked) checkedSubs++;
      });
    });

    if (totalSubs === 0) return 0;
    return Math.round((checkedSubs / totalSubs) * 100);
  };

  const calculateParentProgress = (subItems) => {
    if (subItems.length === 0) return 0;
    const checked = subItems.filter(s => s.checked).length;
    return Math.round((checked / subItems.length) * 100);
  };

  if (!activeCategory && categories.length > 0) return <div>Category error</div>;

  return (
    <div className="checklist-container card">
      <div className="checklist-header">
        <div className="tabs-container">
          <div className="tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`tab-btn ${activeTabId === cat.id ? 'active' : ''}`}
                onClick={() => setActiveTabId(cat.id)}
                onDoubleClick={() => {
                  if (isEditMode) {
                    const newName = prompt("카테고리 이름 수정:", cat.label);
                    if (newName) updateCategoryLabel(cat.id, newName);
                  }
                }}
                title={isEditMode ? "더블클릭하여 이름 수정" : ""}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {isEditMode && (
            <button className="add-tab-btn" onClick={addCategory} title="카테고리 추가">+</button>
          )}
        </div>

        <div className="header-actions">
          {/* Save Status Indicator */}
          <div className={`save-status ${saveStatus}`}>
            {saveStatus === 'saving' && '⏳ 저장 중...'}
            {saveStatus === 'success' && '✅ 저장됨'}
            {saveStatus === 'error' && '❌ 저장 실패'}
          </div>

          <button
            className={`edit-toggle-btn ${isEditMode ? 'editing' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? '완료' : '편집'}
          </button>
        </div>
      </div>

      {activeCategory && (
        <>
          <div className="total-progress">
            <div className="progress-info">
              <span>나의 달성률 ({activeCategory.label})</span>
              <span className="percent">{calculateTotalProgress()}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${calculateTotalProgress()}%` }}></div>
            </div>
          </div>

          <div className="list-content">
            {activeCategory.items.map(parent => {
              const progress = calculateParentProgress(parent.subItems);
              const ddayInfo = getDDay(parent.targetDate);

              return (
                <div key={parent.id} className="parent-item-container">
                  <div className="parent-header">
                    <div className="parent-left">
                      <button
                        className={`expand-btn ${parent.isExpanded ? 'open' : ''}`}
                        onClick={() => toggleExpand(parent.id)}
                      >
                        ▶
                      </button>
                      {isEditMode ? (
                        <input
                          className="edit-input big"
                          value={parent.label}
                          onChange={(e) => updateLabel(parent.id, null, e.target.value)}
                          onBlur={handleLabelBlur}
                        />
                      ) : (
                        <span className="parent-label">{parent.label}</span>
                      )}
                    </div>

                    <div className="parent-right">
                      {isEditMode ? (
                        <div className="edit-actions">
                          <input
                            type="date"
                            className="date-input"
                            value={parent.targetDate || ''}
                            onChange={(e) => updateDate(parent.id, e.target.value)}
                          />
                          <button className="icon-btn delete" onClick={() => deleteItem(parent.id, null)}>🗑️</button>
                        </div>
                      ) : (
                        <>
                          {ddayInfo && (
                            <span className={`d-day-badge ${ddayInfo.urgency}`}>
                              {ddayInfo.label} ({parent.targetDate})
                            </span>
                          )}
                          <div className="mini-progress-ring" style={{ '--p': progress }}>
                            {progress}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {parent.isExpanded && (
                    <div className="sub-items-list">
                      {parent.subItems.map(sub => (
                        <div key={sub.id} className={`sub-item ${sub.checked ? 'completed' : ''}`}>
                          {isEditMode ? (
                            <div className="edit-sub-row">
                              <span className="sub-bullet">└</span>
                              <input
                                className="edit-input small"
                                value={sub.label}
                                onChange={(e) => updateLabel(parent.id, sub.id, e.target.value)}
                                onBlur={handleLabelBlur}
                              />
                              <button className="icon-btn delete-small" onClick={() => deleteItem(parent.id, sub.id)}>×</button>
                            </div>
                          ) : (
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={sub.checked}
                                onChange={() => toggleSubItem(parent.id, sub.id)}
                              />
                              <span className="checkmark small"></span>
                              <span className="sub-text">{sub.label}</span>
                            </label>
                          )}
                        </div>
                      ))}

                      {isEditMode && (
                        <button className="add-sub-btn" onClick={() => addSubItem(parent.id)}>
                          + 할 일 추가
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isEditMode && (
              <button className="add-parent-btn" onClick={addParentItem}>
                + 새로운 과목/목표 추가
              </button>
            )}

            {isEditMode && (
              <div style={{ textAlign: 'right', marginTop: '2rem' }}>
                <button className="del-btn-danger" onClick={() => deleteCategory(activeTabId)}>이 카테고리 삭제</button>
              </div>
            )}
          </div>
        </>
      )}

      {!activeCategory && categories.length === 0 && (
        <div className="empty-state">
          <p>카테고리가 없습니다.</p>
          {isEditMode && <button className="add-tab-btn-large" onClick={addCategory}>+ 첫 카테고리 추가</button>}
        </div>
      )}

      <style>{`
        .checklist-container {
          padding: 2rem;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1rem;
        }

        .tabs-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.5rem;
          border-radius: 12px;
          flex-wrap: wrap; /* Allow wrapping for many cats */
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.6rem 1.2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .tab-btn.active {
          background: var(--neon-cyan);
          color: #000;
          font-weight: 700;
          box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
        }

        .add-tab-btn {
            background: rgba(255,255,255,0.1);
            color: var(--neon-cyan);
            border: 1px dashed var(--neon-cyan);
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .save-status {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-secondary);
            padding: 0.5rem;
            transition: all 0.3s;
        }
        .save-status.success { color: #10b981; }
        .save-status.error { color: #ef4444; }

        .edit-toggle-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .edit-toggle-btn:hover {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }
        .edit-toggle-btn.editing {
          background: var(--neon-pink);
          border-color: var(--neon-pink);
          color: white;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.4);
        }

        /* Reusing other styles from previous implementation via global or just repeating crucial ones */
        .total-progress {
          margin-bottom: 2.5rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .progress-fill {
          height: 10px;
          background: linear-gradient(90deg, var(--neon-blue), var(--neon-cyan));
          border-radius: 5px;
        }
        .progress-track {
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            overflow: hidden;
        }
        .progress-info { display: flex; justify-content: space-between; margin-bottom: 0.8rem; font-weight: 500;}
        .progress-info .percent { color: var(--neon-cyan); font-weight: 700; font-family: monospace; }
        
        .list-content { display: flex; flex-direction: column; gap: 1rem; }
        
        .parent-item-container {
             background: rgba(30, 41, 59, 0.4);
             border: 1px solid rgba(255, 255, 255, 0.05);
             border-radius: 12px;
             overflow: hidden;
        }
        .parent-header {
             display: flex; justify-content: space-between; align-items: center;
             padding: 1.2rem; background: rgba(15, 23, 42, 0.6);
        }
        .parent-left { display: flex; gap: 1rem; align-items: center; flex: 1; }
        .parent-label { font-size: 1.1rem; font-weight: 700; color: white; }
        
        .sub-items-list { padding: 1rem 1.5rem 1.5rem 3.5rem; display: flex; flex-direction: column; gap: 0.8rem; background: rgba(0,0,0,0.1); }
        .sub-item { display: flex; align-items: center; }
        .checkbox-label { display: flex; align-items: center; cursor: pointer; }
        .checkbox-label input { display: none; }
        .sub-text { color: #e2e8f0; }
        .sub-item.completed .sub-text { text-decoration: line-through; opacity: 0.5; }
        
        .checkmark.small { width: 18px; height: 18px; border: 2px solid #94a3b8; border-radius: 4px; margin-right: 12px; display: inline-block; position: relative; }
        .checkbox-label input:checked + .checkmark.small { background: var(--neon-cyan); border-color: var(--neon-cyan); }
        
        .edit-input { background: rgba(0,0,0,0.5); border: 1px solid #475569; color: white; padding: 0.4rem; border-radius: 4px; }
        .add-sub-btn, .add-parent-btn { width: 100%; padding: 0.8rem; background: rgba(255,255,255,0.05); border: 1px dashed #475569; color: #94a3b8; cursor: pointer; margin-top: 1rem; }
        .add-parent-btn { margin-top: 2rem; }

        .expand-btn { background: transparent; border: none; color: white; cursor: pointer; width: 20px; }
        .expand-btn.open { transform: rotate(90deg); color: var(--neon-cyan); }

        .del-btn-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
        .del-btn-danger:hover { background: #ef4444; color: white; }
        
        .d-day-badge {
             background: rgba(255,255,255,0.1);
             padding: 0.2rem 0.6rem;
             border-radius: 12px;
             font-size: 0.8rem;
             color: var(--neon-cyan);
             border: 1px solid var(--neon-cyan);
             margin-right: 1rem;
        }
        .d-day-badge.passed {
            color: #94a3b8;
            border-color: #475569;
            text-decoration: line-through;
        }
        .d-day-badge.urgency-warning {
            color: #fbbf24; /* Amber-400 */
            border-color: #fbbf24;
            box-shadow: 0 0 5px rgba(251, 191, 36, 0.5);
            animation: pulse-border 2s infinite;
        }
        .d-day-badge.urgency-critical {
            color: #ef4444; /* Red-500 */
            border-color: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
            animation: blink-text 1s infinite alternate;
        }

        @keyframes pulse-border {
            0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(251, 191, 36, 0); }
            100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes blink-text {
            from { opacity: 1; }
            to { opacity: 0.6; }
        }
        
        @media (max-width: 600px) {
            .checklist-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
            .header-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

export default Checklist;
