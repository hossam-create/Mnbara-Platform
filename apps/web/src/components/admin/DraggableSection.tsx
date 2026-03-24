import { Draggable } from '@hello-pangea/dnd';
import { CmsSection } from '../../services/cmsService';

interface DraggableSectionProps {
  section: CmsSection;
  index: number;
  onToggle: (sectionId: string, enabled: boolean) => void;
}

export default function DraggableSection({ section, index, onToggle }: DraggableSectionProps) {
  return (
    <Draggable draggableId={section.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border rounded-lg p-4 transition-all ${
            snapshot.isDragging 
              ? 'shadow-lg border-brand-blue bg-blue-50' 
              : 'border-gray-200 hover:shadow-md bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div
                {...provided.dragHandleProps}
                className="cursor-move text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>

              {/* Section Info */}
              <div>
                <h3 className="font-medium text-gray-900">{section.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Type: {section.type}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    {section.items.length} items
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggle(section.id, !section.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  section.enabled ? 'bg-brand-blue' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    section.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              
              <span className={`text-sm font-medium ${
                section.enabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {section.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
