import { Droppable } from '@hello-pangea/dnd';
import { CmsSection } from '../../services/cmsService';
import DraggableSection from './DraggableSection';

interface DroppableSectionsListProps {
  sections: CmsSection[];
  onToggle: (sectionId: string, enabled: boolean) => void;
}

export default function DroppableSectionsList({ sections, onToggle }: DroppableSectionsListProps) {
  return (
    <Droppable droppableId="sections">
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`space-y-4 min-h-[200px] p-2 rounded-lg transition-colors ${
            snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-transparent'
          }`}
        >
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📄</div>
              <p className="text-gray-500">No sections found for this page</p>
              <p className="text-sm text-gray-400 mt-2">
                Drag sections here or create new ones
              </p>
            </div>
          ) : (
            sections.map((section, index) => (
              <DraggableSection
                key={section.id}
                section={section}
                index={index}
                onToggle={onToggle}
              />
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
