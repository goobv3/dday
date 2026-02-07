import React, { useState, useEffect } from 'react';
import Countdown from './components/Countdown';
import Checklist from './components/Checklist';
import Quote from './components/Quote';
import './styles/theme.css';

function App() {
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHeaderEditMode, setIsHeaderEditMode] = useState(false);

  // State for D-Day Form (Moved to top to prevent Hook Order Error)
  const [isAddingDDay, setIsAddingDDay] = useState(false);
  const [newDDayForm, setNewDDayForm] = useState({ label: '', date: '', color: '--neon-cyan' });

  // --- Initial Load ---
  useEffect(() => {
    fetch('http://goob.iptime.org:3000/api/data')
      .then(res => res.json())
      .then(data => {
        setAppData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load app data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (error) return (
    <div className="error-screen" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
      <h2>⚠️ Connection Error</h2>
      <p>{error}</p>
      <p>Please ensure the server is running on port 3000.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
    </div>
  );
  if (!appData) return <div className="loading-screen">No Data Found</div>;

  // Derived State
  const rawActiveProject = appData.projects.find(p => p.id === appData.currentProjectId) || appData.projects[0];
  // Ensure dDayConfig exists to prevent crashes
  const activeProject = rawActiveProject ? {
    ...rawActiveProject,
    dDayConfig: rawActiveProject.dDayConfig || []
  } : null;

  if (!activeProject) return <div className="error">No Projects Found. Please reset data.</div>;

  // --- Handlers ---

  const handleProjectSelect = (projectId) => {
    setAppData(prev => ({ ...prev, currentProjectId: projectId }));
  };

  const handleAddProject = () => {
    const title = prompt("새로운 프로젝트 이름을 입력하세요 (예: 다이어트 계획):");
    if (!title) return;

    const newProject = {
      id: `p-${Date.now()}`,
      title: title,
      subtitle: "D-DAY DASHBOARD",
      theme: 'neon-blue',
      dDayConfig: [
        { id: `d-${Date.now()}-1`, label: '목표 날짜', date: new Date(Date.now() + 86400000 * 30).toISOString(), color: '--neon-cyan' }
      ],
      categories: [
        {
          id: `c-${Date.now()}-1`,
          label: '기본 카테고리',
          items: []
        }
      ]
    };

    setAppData(prev => {
      const newData = {
        ...prev,
        projects: [...prev.projects, newProject],
        currentProjectId: newProject.id
      };
      // Auto-save new project
      saveData(newData);
      return newData;
    });
  };

  const handleDeleteProject = (projectId) => {
    if (!confirm("정말 이 프로젝트를 삭제하시겠습니까? (복구 불가)")) return;

    setAppData(prev => {
      const remaining = prev.projects.filter(p => p.id !== projectId);
      // If we deleted the active one, switch to the first available
      const nextId = remaining.length > 0 ? remaining[0].id : null;

      // Prevent deleting the last project? Or allow empty?
      if (remaining.length === 0) {
        alert("최소 하나의 프로젝트는 존재해야 합니다.");
        return prev;
      }

      const newData = {
        ...prev,
        projects: remaining,
        currentProjectId: projectId === prev.currentProjectId ? nextId : prev.currentProjectId
      };
      // Auto-save deletion
      saveData(newData);
      return newData;
    });
  };

  // Helper for saving
  const saveData = (data) => {
    fetch('http://goob.iptime.org:3000/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => {
      if (!res.ok) console.error("Auto-save failed");
    }).catch(err => console.error("Auto-save error", err));
  };


  const updateActiveProject = (updatedProject, autoSave = false) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        projects: prev.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
      };

      if (autoSave) {
        saveData(newData);
      }

      return newData;
    });
  };

  // Sync to Server (Still kept for manual fallback or initial load check if needed, but mostly replaced by autoSave)
  const saveToServer = async () => {
    // Re-implement using current state if needed, but manual button is gone? 
    // User requested "Except save button, all actions auto save". 
    // So we might keep this for manual backup if desired, or remove button.
    // For now, let's keep the function for potential manual use.
    try {
      const res = await fetch('http://goob.iptime.org:3000/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      if (!res.ok) {
        return { error: `Server Error ${res.status}: ${res.statusText}` };
      }
      return true;
    } catch (e) {
      console.error(e);
      return { error: e.message };
    }
  };

  const handleTitleChange = (e, field) => {
    const val = e.target.value;
    // Debounce/Blur will handle save, here just update state locally
    updateActiveProject({ ...activeProject, [field]: val }, false);
  };

  const handleTitleBlur = () => {
    // Trigger save on blur
    updateActiveProject(activeProject, true);
  };

  const handleAddDDay = () => {
    if (!newDDayForm.label || !newDDayForm.date) {
      alert("제목과 날짜를 입력해주세요.");
      return;
    }
    const newDDay = {
      id: `d-${Date.now()}`,
      label: newDDayForm.label,
      date: new Date(newDDayForm.date).toISOString(),
      color: newDDayForm.color
    };

    const newConfig = [...(activeProject.dDayConfig || []), newDDay];
    updateActiveProject({ ...activeProject, dDayConfig: newConfig }, true);

    // Reset and close
    setNewDDayForm({ label: '', date: '', color: '--neon-cyan' });
    setIsAddingDDay(false);
  };

  return (
    <div className="app-container">
      {/* --- Project Switcher --- */}
      <div className="project-controls">
        <select
          className="project-selector"
          value={activeProject.id}
          onChange={(e) => handleProjectSelect(e.target.value)}
        >
          {appData.projects.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <button className="add-project-btn" onClick={handleAddProject} title="새 프로젝트 추가">+</button>
        {appData.projects.length > 1 && (
          <button className="del-project-btn" onClick={() => handleDeleteProject(activeProject.id)} title="현재 프로젝트 삭제">🗑️</button>
        )}
      </div>

      <header className="app-header">
        <div className="header-content" onClick={() => setIsHeaderEditMode(!isHeaderEditMode)} title="클릭하여 제목 수정">
          {isHeaderEditMode ? (
            <div className="header-inputs">
              <input
                className="title-input neon-text"
                value={activeProject.title}
                onChange={(e) => handleTitleChange(e, 'title')}
                onBlur={handleTitleBlur}
                autoFocus
              />
              <input
                className="subtitle-input"
                value={activeProject.subtitle}
                onChange={(e) => handleTitleChange(e, 'subtitle')}
                onBlur={handleTitleBlur}
              />
            </div>
          ) : (
            <>
              <h1 className="main-title neon-text">{activeProject.title}</h1>
              <div className="subtitle">{activeProject.subtitle}</div>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        <section className="section-quote">
          <Quote />
        </section>

        <section className="section-countdown">
          {/* D-Day Management */}
          {isHeaderEditMode && (
            <div className="dday-controls" style={{ textAlign: 'center', marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
              {!isAddingDDay ? (
                <button onClick={() => setIsAddingDDay(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'var(--neon-cyan)', border: '1px dashed var(--neon-cyan)', borderRadius: '8px', cursor: 'pointer' }}>
                  + D-Day 추가
                </button>
              ) : (
                <div className="dday-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    placeholder="제목 (예: 필기시험)"
                    value={newDDayForm.label}
                    onChange={e => setNewDDayForm({ ...newDDayForm, label: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#1e293b', color: 'white' }}
                  />
                  <input
                    type="date"
                    value={newDDayForm.date}
                    onChange={e => setNewDDayForm({ ...newDDayForm, date: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#1e293b', color: 'white' }}
                  />
                  <div className="color-options" style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { name: 'Cyan', val: '--neon-cyan' },
                      { name: 'Pink', val: '--neon-pink' },
                      { name: 'Green', val: '--neon-green' },
                      { name: 'Purple', val: '--neon-purple' },
                      { name: 'Yellow', val: '--neon-yellow' }
                    ].map(c => (
                      <div
                        key={c.name}
                        onClick={() => setNewDDayForm({ ...newDDayForm, color: c.val })}
                        style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: `var(${c.val})`,
                          cursor: 'pointer',
                          border: newDDayForm.color === c.val ? '2px solid white' : 'none',
                          boxShadow: newDDayForm.color === c.val ? `0 0 10px var(${c.val})` : 'none'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={handleAddDDay} style={{ padding: '0.4rem 1rem', background: 'var(--neon-blue)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>저장</button>
                    <button onClick={() => setIsAddingDDay(false)} style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer' }}>취소</button>
                  </div>
                </div>
              )}

              {activeProject.dDayConfig?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {activeProject.dDayConfig.map(d => (
                    <div key={d.id} style={{ background: 'rgba(0,0,0,0.5)', padding: '0.3rem 0.8rem', borderRadius: '20px', display: 'flex', gap: '0.5rem', alignItems: 'center', border: `1px solid var(${d.color})` }}>
                      <span style={{ color: 'white', fontSize: '0.85rem' }}>{d.label}</span>
                      <button onClick={() => {
                        if (!confirm("삭제하시겠습니까?")) return;
                        const newConfig = activeProject.dDayConfig.filter(x => x.id !== d.id);
                        updateActiveProject({ ...activeProject, dDayConfig: newConfig }, true);
                      }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Countdown dDays={activeProject.dDayConfig} />
        </section>

        <section className="section-checklist">
          {/* Dynamic Section Title? */}
          <h2>Checklist</h2>
          <Checklist
            project={activeProject}
            onUpdate={updateActiveProject}
            onSaveRequest={saveToServer}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2026 Big Data Analyst Journey | Powered by React & Passion</p>
      </footer>

      <style>{`
        .app-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .project-controls {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .project-selector {
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--neon-cyan);
            color: var(--neon-cyan);
            padding: 0.3rem 0.5rem;
            border-radius: 4px;
            font-family: inherit;
        }
        .add-project-btn, .del-project-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid var(--border-color);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .add-project-btn:hover {
            background: var(--neon-cyan);
            color: black;
        }
        .del-project-btn:hover {
            background: var(--neon-pink);
            border-color: var(--neon-pink);
        }
        
        .app-header {
          text-align: center;
          margin-bottom: 3rem;
          cursor: pointer;
        }
        
        .header-inputs {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
        }
        .title-input {
            background: transparent;
            border: none;
            border-bottom: 1px dashed var(--neon-cyan);
            font-size: 2rem;
            text-align: center;
            color: var(--neon-cyan);
            width: 100%;
        }
        .subtitle-input {
             background: transparent;
            border: none;
            border-bottom: 1px dashed var(--text-secondary);
            text-align: center;
            color: var(--text-secondary);
             width: 100%;
        }

        .main-title {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          letter-spacing: -0.05em;
        }
        
        .subtitle {
          color: var(--text-secondary);
          letter-spacing: 0.2em;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .main-content {
          flex: 1;
        }

        .section-checklist h2 {
          color: var(--text-primary);
          border-left: 4px solid var(--neon-cyan);
          padding-left: 1rem;
          margin-bottom: 1rem;
          margin-top: 3rem;
        }

        .app-footer {
          text-align: center;
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        @media (max-width: 600px) {
          .main-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
