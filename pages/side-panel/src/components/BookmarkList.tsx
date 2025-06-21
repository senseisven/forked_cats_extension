/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react';
import { FaTrash, FaPen, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { t } from '@extension/i18n';

interface Bookmark {
  id: number;
  title: string;
  content: string;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onBookmarkSelect: (content: string) => void;
  onBookmarkUpdateTitle?: (id: number, title: string) => void;
  onBookmarkUpdate?: (id: number, title: string, content: string) => void;
  onBookmarkDelete?: (id: number) => void;
  onBookmarkReorder?: (draggedId: number, targetId: number) => void;
  onBookmarkAdd?: (title: string, content: string) => void;
  isDarkMode?: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onBookmarkSelect,
  onBookmarkUpdateTitle,
  onBookmarkUpdate,
  onBookmarkDelete,
  onBookmarkReorder,
  onBookmarkAdd,
  isDarkMode = false,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentEditRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEditClick = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
    setEditContent(bookmark.content);
  };

  const handleSaveEdit = (id: number) => {
    if (onBookmarkUpdate && editTitle.trim() && editContent.trim()) {
      onBookmarkUpdate(id, editTitle, editContent);
    } else if (onBookmarkUpdateTitle && editTitle.trim()) {
      onBookmarkUpdateTitle(id, editTitle);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAddClick = () => {
    setShowAddForm(true);
    setNewTitle('');
    setNewContent('');
  };

  const handleAddSave = () => {
    if (onBookmarkAdd && newTitle.trim() && newContent.trim()) {
      onBookmarkAdd(newTitle.trim(), newContent.trim());
      setShowAddForm(false);
      setNewTitle('');
      setNewContent('');
    }
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
    setNewTitle('');
    setNewContent('');
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    // Add more transparent effect
    e.currentTarget.classList.add('opacity-25');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-25');
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;

    if (onBookmarkReorder) {
      onBookmarkReorder(draggedId, targetId);
    }
  };

  // Focus the input field when entering edit mode or add mode
  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  useEffect(() => {
    if (showAddForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showAddForm]);

  return (
    <div className="p-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t('quickStart')}</h3>
        <button
          onClick={handleAddClick}
          className={`rounded-md p-1.5 text-xs ${
            isDarkMode
              ? 'bg-slate-700 text-sky-400 hover:bg-slate-600'
              : 'bg-[#8b7355]/20 text-[#8b7355] hover:bg-[#8b7355]/30'
          } transition-colors`}
          aria-label={t('addTemplate')}
          type="button">
          <FaPlus size={12} />
        </button>
      </div>

      {/* Add new template form */}
      {showAddForm && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-[#d4c4a8] bg-[#ede2c7]/50'
          }`}>
          <div className="mb-3">
            <label className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('templateTitle')}
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t('templateTitlePlaceholder')}
              className={`w-full rounded border px-3 py-2 text-sm ${
                isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-[#d4c4a8] bg-white text-gray-700'
              }`}
            />
          </div>
          <div className="mb-3">
            <label className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('templateContent')}
            </label>
            <textarea
              ref={contentTextareaRef}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder={t('templateContentPlaceholder')}
              rows={3}
              className={`w-full rounded border px-3 py-2 text-sm ${
                isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-[#d4c4a8] bg-white text-gray-700'
              }`}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleAddCancel}
              className={`rounded px-3 py-1.5 text-xs ${
                isDarkMode
                  ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              } border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}
              type="button">
              {t('cancel')}
            </button>
            <button
              onClick={handleAddSave}
              disabled={!newTitle.trim() || !newContent.trim()}
              className={`rounded px-3 py-1.5 text-xs ${
                isDarkMode
                  ? 'bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-600'
                  : 'bg-[#8b7355] text-white hover:bg-[#6d5a44] disabled:bg-gray-300'
              } disabled:cursor-not-allowed`}
              type="button">
              {t('save')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bookmarks.map(bookmark => (
          <div
            key={bookmark.id}
            draggable={editingId !== bookmark.id}
            onDragStart={e => handleDragStart(e, bookmark.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, bookmark.id)}
            className={`group relative rounded-lg p-3 ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-[#ede2c7]/30'
            } border ${isDarkMode ? 'border-slate-700' : 'border-[#d4c4a8]'}`}>
            {editingId === bookmark.id ? (
              <div className="space-y-3">
                <div>
                  <label className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('templateTitle')}
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className={`w-full rounded border px-3 py-2 text-sm ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-700 text-gray-200'
                        : 'border-[#d4c4a8] bg-white text-gray-700'
                    }`}
                  />
                </div>
                <div>
                  <label className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('templateContent')}
                  </label>
                  <textarea
                    ref={contentEditRef}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className={`w-full rounded border px-3 py-2 text-sm ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-700 text-gray-200'
                        : 'border-[#d4c4a8] bg-white text-gray-700'
                    }`}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className={`rounded px-3 py-1.5 text-xs ${
                      isDarkMode
                        ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                        : 'bg-white text-gray-500 hover:bg-gray-100'
                    } border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}
                    type="button">
                    {t('cancelEdit')}
                  </button>
                  <button
                    onClick={() => handleSaveEdit(bookmark.id)}
                    disabled={!editTitle.trim() || !editContent.trim()}
                    className={`rounded px-3 py-1.5 text-xs ${
                      isDarkMode
                        ? 'bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-600'
                        : 'bg-[#8b7355] text-white hover:bg-[#6d5a44] disabled:bg-gray-300'
                    } disabled:cursor-not-allowed`}
                    type="button">
                    {t('saveEdit')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onBookmarkSelect(bookmark.content)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onBookmarkSelect(bookmark.content);
                      }
                    }}
                    className="w-full text-left">
                    <div
                      className={`truncate pr-10 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {bookmark.title}
                    </div>
                  </button>
                </div>
              </>
            )}

            {editingId !== bookmark.id && (
              <>
                {/* Edit button - top right */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleEditClick(bookmark);
                  }}
                  className={`absolute right-[28px] top-1/2 z-10 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                    isDarkMode
                      ? 'bg-slate-700 text-sky-400 hover:bg-slate-600'
                      : 'bg-white text-[#8b7355] hover:bg-gray-100'
                  }`}
                  aria-label={t('editBookmark')}
                  type="button">
                  <FaPen size={14} />
                </button>

                {/* Delete button - bottom right */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (onBookmarkDelete) {
                      onBookmarkDelete(bookmark.id);
                    }
                  }}
                  className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                    isDarkMode
                      ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      : 'bg-white text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label={t('deleteBookmark')}
                  type="button">
                  <FaTrash size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkList;
