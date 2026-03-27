import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import cmsService, { CmsPage, CmsSection } from '../../services/cmsService';
import DroppableSectionsList from '../../components/admin/DroppableSectionsList';

export default function CmsManager() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadSections(selectedPage.id);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const pagesData = await cmsService.getAllPages();
      setPages(pagesData);
      if (pagesData.length > 0 && !selectedPage) {
        setSelectedPage(pagesData[0]);
      }
    } catch (err) {
      setError('Failed to load pages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (pageId: string) => {
    try {
      setLoading(true);
      const sectionsData = await cmsService.getSectionsByPageId(pageId);
      setSections(sectionsData);
    } catch (err) {
      setError('Failed to load sections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = async (sectionId: string, enabled: boolean) => {
    try {
      await cmsService.updateSection(sectionId, { enabled });
      setSections(prev => 
        prev.map(section => 
          section.id === sectionId ? { ...section, enabled } : section
        )
      );
    } catch (err) {
      setError('Failed to update section');
      console.error(err);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    const updatedSections = items.map((section, index) => ({
      ...section,
      sortOrder: index
    }));
    setSections(updatedSections);

    // Update backend
    try {
      await cmsService.reorderSections(
        updatedSections.map(section => ({ id: section.id, sortOrder: section.sortOrder }))
      );
    } catch (err) {
      setError('Failed to reorder sections');
      console.error(err);
      // Revert on error
      setSections(sections);
    }
  };

  if (loading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Page</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedPage?.id === page.id
                  ? 'border-brand-blue bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{page.title}</h3>
              <p className="text-sm text-gray-500 mt-1">/{page.slug}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  page.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {page.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sections Management */}
      {selectedPage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Sections for {selectedPage.title}
            </h2>
            <div className="text-sm text-gray-500">
              {sections.length} sections
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <DroppableSectionsList 
              sections={sections} 
              onToggle={toggleSection} 
            />
          </DragDropContext>
        </div>
      )}
    </div>
  );
}
