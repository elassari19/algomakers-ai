import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Eye, Edit, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState, convertFromRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  createdAt: string;
}

export const TemplatesTab: React.FC = ({}) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateForm, setTemplateForm] = useState<{
    name: string;
    subject: string;
    content: string;
    type: string;
  }>({
    name: '',
    subject: '',
    content: '',
    type: 'MARKETING',
  });
  const [editorState, setEditorState] = useState<EditorState>(EditorState.createEmpty());
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [editTemplateDialog, setEditTemplateDialog] = useState(false);
  const [deleteTemplateDialog, setDeleteTemplateDialog] = useState(false);
  const [createTemplateDialog, setCreateTemplateDialog] = useState(false);

  // Helper functions for WYSIWYG editor
  const convertHtmlToEditorState = (html: string): EditorState => {
    const blocksFromHtml = htmlToDraft(html);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    return EditorState.createWithContent(contentState);
  };

  const convertEditorStateToHtml = (editorState: EditorState): string => {
    const contentState = editorState.getCurrentContent();
    return draftToHtml(convertToRaw(contentState));
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
      type: '',
    });
    setEditorState(EditorState.createEmpty());
  };

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emails?type=templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const contentHtml = convertEditorStateToHtml(editorState);
      if (!templateForm.name || !templateForm.subject || !contentHtml.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...templateForm,
          content: contentHtml,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev => [data.template, ...prev]);
        setCreateTemplateDialog(false);
        resetForm();
        toast.success('Template created successfully');
      } else {
        toast.error(data.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleEditTemplate = async () => {
    try {
      const contentHtml = convertEditorStateToHtml(editorState);
      if (!selectedTemplate || !templateForm.name || !templateForm.subject || !contentHtml.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch(`/api/emails/${selectedTemplate.id}?type=templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...templateForm,
          content: contentHtml,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? data.template : t));
        setEditTemplateDialog(false);
        setSelectedTemplate(null);
        resetForm();
        toast.success('Template updated successfully');
      } else {
        toast.error(data.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      if (!selectedTemplate) return;

      const response = await fetch(`/api/emails/${selectedTemplate.id}?type=templates`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
        setDeleteTemplateDialog(false);
        setSelectedTemplate(null);
        toast.success('Template deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
    });
    setEditorState(convertHtmlToEditorState(template.content));
    setEditTemplateDialog(true);
  };

  return (
    <>
      <div >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Email Templates</h3>
            <p className="text-sm text-zinc-400">Create and manage reusable email templates</p>
          </div>
          <Dialog open={createTemplateDialog} onOpenChange={setCreateTemplateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Create Email Template
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Template Name</label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    placeholder="e.g., Weekly Newsletter"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Template Type</label>
                  <Input
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    placeholder="e.g., Marketing"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Subject Line</label>
                  <Input
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    placeholder="Use {{variables}} for dynamic content"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Email Content</label>
                  <div className="border border-zinc-600 rounded-md bg-zinc-800">
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={setEditorState}
                      toolbar={{
                        options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'emoji', 'history'],
                        inline: {
                          options: ['bold', 'italic', 'underline', 'strikethrough'],
                        },
                        blockType: {
                          options: ['Normal', 'H1', 'H2', 'H3', 'Blockquote'],
                        },
                        fontSize: {
                          options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
                        },
                        list: {
                          options: ['unordered', 'ordered'],
                        },
                        textAlign: {
                          options: ['left', 'center', 'right', 'justify'],
                        },
                        colorPicker: {
                          colors: ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#808080', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0'],
                        },
                        link: {
                          options: ['link', 'unlink'],
                        },
                      }}
                      editorStyle={{
                        backgroundColor: '#27272a', // zinc-800
                        color: '#ffffff',
                        minHeight: '200px',
                        padding: '10px',
                        borderRadius: '0.375rem',
                      }}
                      toolbarStyle={{
                        backgroundColor: '#ffffff', // white background
                        border: '1px solid #e5e7eb', // light gray border
                        borderBottom: 'none',
                        borderTopLeftRadius: '0.375rem',
                        borderTopRightRadius: '0.375rem',
                        color: '#000000',
                      }}
                      toolbarClassName="rdw-editor-toolbar"
                      wrapperClassName="rdw-editor-wrapper"
                      editorClassName="rdw-editor-main"
                      placeholder="Email content with {{variables}} for personalization..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateTemplate}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    Create Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCreateTemplateDialog(false)}
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-zinc-400">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Mail className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No templates found</p>
              <p className="text-sm text-zinc-500">Create your first email template to get started</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="bg-zinc-800/50 border-zinc-700/60 hover:bg-zinc-800/70 transition-colors">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-white truncate">{template.name}</h4>
                      <Badge
                        className={
                          template.type === 'MARKETING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          template.type === 'TRANSACTIONAL' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        }
                      >
                        {template.type}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setPreviewDialog(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(template)}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setDeleteTemplateDialog(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">{template.subject}</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Template Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-400">Template Name:</label>
                <p className="text-white font-medium">{selectedTemplate.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Subject:</label>
                <p className="text-white font-medium">{selectedTemplate.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Content:</label>
                <div className="mt-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-600/30">
                  <div
                    className="text-sm text-zinc-200 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                <div>
                  <p className="text-sm text-zinc-400">Type: <span className="text-white font-medium">{selectedTemplate.type}</span></p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Created: <span className="text-white font-medium">{new Date(selectedTemplate.createdAt).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editTemplateDialog} onOpenChange={setEditTemplateDialog}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Email Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Template Name</label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                placeholder="e.g., Weekly Newsletter"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Template Type</label>
              <Input
                value={templateForm.type}
                onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                placeholder="e.g., Marketing"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Subject Line</label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                placeholder="Use {{variables}} for dynamic content"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email Content</label>
              <div className="border border-zinc-600 rounded-md bg-zinc-800">
                <Editor
                  editorState={editorState}
                  onEditorStateChange={setEditorState}
                  toolbar={{
                    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'emoji', 'history'],
                    inline: {
                      options: ['bold', 'italic', 'underline', 'strikethrough'],
                    },
                    blockType: {
                      options: ['Normal', 'H1', 'H2', 'H3', 'Blockquote'],
                    },
                    fontSize: {
                      options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
                    },
                    list: {
                      options: ['unordered', 'ordered'],
                    },
                    textAlign: {
                      options: ['left', 'center', 'right', 'justify'],
                    },
                    colorPicker: {
                      colors: ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#808080', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0'],
                    },
                    link: {
                      options: ['link', 'unlink'],
                    },
                  }}
                  toolbarStyle={{
                    backgroundColor: '#ffffff', // white background
                    border: '1px solid #e5e7eb', // light gray border
                    borderBottom: 'none',
                    borderTopLeftRadius: '0.375rem',
                    borderTopRightRadius: '0.375rem',
                    color: '#000000',
                  }}
                  editorStyle={{
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="Email content with {{variables}} for personalization..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleEditTemplate}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                Update Template
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditTemplateDialog(false)}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <AlertDialog open={deleteTemplateDialog} onOpenChange={setDeleteTemplateDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Template
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Are you sure you want to delete the template "{selectedTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
            </AlertDialog>
      <style dangerouslySetInnerHTML={{
        __html: `
          .rdw-editor-wrapper {
            background: transparent !important;
            border: none !important;
          }
          .rdw-editor-main {
            background: #27272a !important;
            color: #ffffff !important;
            border: 1px solid #374151 !important;
            border-top: none !important;
            border-bottom-left-radius: 0.375rem !important;
            border-bottom-right-radius: 0.375rem !important;
          }
          .rdw-editor-toolbar {
            background: #18181b !important;
            border: 1px solid #374151 !important;
            border-bottom: none !important;
            border-top-left-radius: 0.375rem !important;
            border-top-right-radius: 0.375rem !important;
          }
          .rdw-option-wrapper {
            background: #ffffff !important;
            border: none !important;
            color: #ffffff !important;
          }
          .rdw-option-wrapper:hover {
            background: #ffffff !important;
            box-shadow: none !important;
          }
          .rdw-option-active {
            background: rgba(59, 130, 246, 0.3) !important;
            color: #000000 !important;
          }
          .rdw-dropdown-wrapper {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
          }
          .rdw-dropdown-optionwrapper {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
          }
          .rdw-dropdownoption-default {
            color: #000000 !important;
          }
          .rdw-dropdownoption-highlighted {
            background: #374151 !important;
          }
          .rdw-colorpicker-modal {
            background: #18181b !important;
            border: 1px solid #374151 !important;
          }
          .rdw-colorpicker-modal-header {
            color: #ffffff !important;
          }
          .rdw-link-modal {
            background: #18181b !important;
            border: 1px solid #374151 !important;
          }
          .rdw-link-modal-header {
            color: #ffffff !important;
          }
          .rdw-link-modal-input {
            background: #27272a !important;
            border: 1px solid #374151 !important;
            color: #ffffff !important;
          }
          .rdw-link-modal-input:focus {
            border-color: #3b82f6 !important;
          }
          .rdw-link-modal-btn {
            background: #3b82f6 !important;
            color: #ffffff !important;
            border: none !important;
          }
          .rdw-link-modal-btn:hover {
            background: #2563eb !important;
          }
          .rdw-emoji-modal {
            background: #18181b !important;
            border: 1px solid #374151 !important;
          }
          .rdw-editor-placeholder {
            color: #71717a !important;
          }
          /* Icon colors - make them black for visibility on white toolbar */
          .rdw-option-wrapper svg {
            fill: #000000 !important;
            opacity: 0.8 !important;
          }
          .rdw-option-wrapper:hover svg {
            fill: #000000 !important;
            opacity: 1 !important;
          }
          .rdw-option-active svg {
            fill: #000000 !important;
            opacity: 1 !important;
          }
          .rdw-dropdown-carettoopen svg,
          .rdw-dropdown-carettoclose svg {
            fill: #000000 !important;
            opacity: 0.8 !important;
          }
          .rdw-dropdown-wrapper:hover .rdw-dropdown-carettoopen svg,
          .rdw-dropdown-wrapper:hover .rdw-dropdown-carettoclose svg {
            fill: #000000 !important;
            opacity: 1 !important;
          }
        `
      }} />
    </>
  );
};