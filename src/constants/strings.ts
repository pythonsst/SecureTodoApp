// src/constants/strings.ts
export const STRINGS = {
  auth: {
    title: 'Welcome Back',
    subtitle: 'Secure your todos with authentication',
    authenticate: 'Authenticate',
    authenticating: 'Authenticating...',
    authenticateBtn: 'Authenticate',
    info: 'Use Face ID, Touch ID, or PIN to unlock',

    pinRequired: 'PIN_REQUIRED',
    pinErrorIncorrect: 'Incorrect PIN. Please try again.',
    pinErrorLength: 'PIN must be at least 4 digits',
    promptMessage: 'Authenticate to access your todos',
    alertFailedTitle: 'Authentication Failed',
  },

  todos: {
    title: 'My Todos',
    emptyTitle: 'No tasks yet',
    emptySubtitle: 'Tap “Add Todo” below to create your first task.',
    add: '+ Add Todo',
    logout: 'Logout',
    deleteConfirmTitle: 'Delete Todo',
    deleteConfirmMessage: 'Are you sure you want to delete this todo?',
    errorUpdate: 'Failed to update todo',
    errorDelete: 'Failed to delete todo',
    errorAdd: 'Failed to add todo',
    cancel: 'Cancel',   
    delete: 'Delete',

  },
  pin: {
    createTitle: 'Create PIN',
    enterTitle: 'Enter PIN',
    createSubtitle: 'Choose a 4-digit PIN to secure your todos',
    enterSubtitle: 'Enter your PIN to continue',
    cancel: 'Cancel',
  },

  todoForm: {
    newTitle: 'New Todo',
    editTitle: 'Edit Todo',
    titleLabel: 'Title *',
    descriptionLabel: 'Description',
    titlePlaceholder: 'Enter todo title',
    descriptionPlaceholder: 'Optional description',
    errorTitleRequired: 'Title is required',
    errorSaveFailed: 'Failed to save todo',
    cancel: 'Cancel',
    update: 'Update',
    create: 'Create',
  },

  todoItem: {
    doneLabel: 'Done',
  },

  errors: {
    generic: 'An error occurred. Please try again.',
  },
};
