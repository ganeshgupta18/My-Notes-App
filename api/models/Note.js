import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  content: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  color: {
    type: String,
    default: '#1e293b', // Default to slate-800 look
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isTrashed: {
    type: Boolean,
    default: false,
  },
  drawing: {
    type: String, // Base64 PNG image stream
    default: '',
  },
  audio: {
    type: String, // Base64 Audio clip stream
    default: '',
  },
  image: {
    type: String, // Base64 Image attachment stream
    default: '',
  },
  isChecklist: {
    type: Boolean,
    default: false,
  },
  checklistItems: [
    {
      text: { type: String, default: '' },
      completed: { type: Boolean, default: false }
    }
  ],
}, {
  timestamps: true,
});

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
export default Note;
