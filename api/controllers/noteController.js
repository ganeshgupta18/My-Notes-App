import Note from '../models/Note.js';
import Notification from '../models/Notification.js';

// --- Notes Controllers ---

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.json({ success: true, notes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createNote = async (req, res) => {
  const { title, content, tags, color, drawing, audio, image, isChecklist, checklistItems } = req.body;
  try {
    const note = await Note.create({
      userId: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
      tags: tags || [],
      color: color || '#1e293b',
      drawing: drawing || '',
      audio: audio || '',
      image: image || '',
      isChecklist: isChecklist || false,
      checklistItems: checklistItems || [],
    });

    await Notification.create({
      userId: req.user._id,
      type: 'success',
      message: `Created note "${note.title}".`,
    });

    return res.status(201).json({ success: true, note });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const { title, content, tags, color, isPinned, isArchived, isTrashed, drawing, audio, image, isChecklist, checklistItems } = req.body;

    let notificationMsg = '';
    if (isPinned !== undefined && isPinned !== note.isPinned) {
      notificationMsg = isPinned ? `Pinned note "${note.title}"` : `Unpinned note "${note.title}"`;
    } else if (isArchived !== undefined && isArchived !== note.isArchived) {
      notificationMsg = isArchived ? `Archived note "${note.title}"` : `Unarchived note "${note.title}"`;
    } else if (isTrashed !== undefined && isTrashed !== note.isTrashed) {
      notificationMsg = isTrashed ? `Moved note "${note.title}" to Trash` : `Restored note "${note.title}"`;
    } else {
      notificationMsg = `Updated note "${title || note.title}"`;
    }

    note.title = title !== undefined ? title : note.title;
    note.content = content !== undefined ? content : note.content;
    note.tags = tags !== undefined ? tags : note.tags;
    note.color = color !== undefined ? color : note.color;
    note.isPinned = isPinned !== undefined ? isPinned : note.isPinned;
    note.isArchived = isArchived !== undefined ? isArchived : note.isArchived;
    note.isTrashed = isTrashed !== undefined ? isTrashed : note.isTrashed;
    note.drawing = drawing !== undefined ? drawing : note.drawing;
    note.audio = audio !== undefined ? audio : note.audio;
    note.image = image !== undefined ? image : note.image;
    note.isChecklist = isChecklist !== undefined ? isChecklist : note.isChecklist;
    note.checklistItems = checklistItems !== undefined ? checklistItems : note.checklistItems;

    // Auto un-pin or un-archive if note is sent to trash
    if (isTrashed === true) {
      note.isPinned = false;
      note.isArchived = false;
    }

    await note.save();

    await Notification.create({
      userId: req.user._id,
      type: 'info',
      message: notificationMsg,
    });

    return res.json({ success: true, note });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await note.deleteOne();

    await Notification.create({
      userId: req.user._id,
      type: 'warning',
      message: `Permanently deleted note "${note.title}".`,
    });

    return res.json({ success: true, message: 'Note deleted permanently' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearTrash = async (req, res) => {
  try {
    const result = await Note.deleteMany({ userId: req.user._id, isTrashed: true });
    
    await Notification.create({
      userId: req.user._id,
      type: 'warning',
      message: `Cleared ${result.deletedCount} note(s) from Trash.`,
    });

    return res.json({ success: true, message: 'Trash cleared successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Notifications Controllers ---

export const getNotifications = async (req, res) => {
  try {
    // Return last 20 notifications
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
