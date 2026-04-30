import React from "react";
import { User, Save, Edit, X, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useProfile } from "../hooks/useProfile";

const LoadingSpinner: React.FC = () => (
  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
);

interface MessageBannerProps {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
}

const MessageBanner: React.FC<MessageBannerProps> = ({ type, message, onDismiss }) => (
  <div className={`p-4 rounded-lg border ${
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
      : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss message"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
      {label}
    </label>
    {children}
  </div>
);

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  disabled = false 
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    placeholder={placeholder}
  />
);

const ReadOnlyField: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
    {children}
  </div>
);

export const Profile: React.FC = () => {
  const {
    user,
    formData,
    isLoading,
    isSubmitting,
    message,
    isEditing,
    showPassword,
    setIsEditing,
    setShowPassword,
    handleInputChange,
    handleSave,
    handleCancel,
    dismissMessage,
  } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  const userInitial = (user.name || user.username)?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Message Banner */}
      {message && (
        <MessageBanner
          type={message.type}
          message={message.text}
          onDismiss={dismissMessage}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              My Profile
            </h1>
            <p className="text-slate-500">Manage your account information</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white/30">
              {userInitial}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{user.name || user.username}</h2>
              <p className="text-white/80 text-sm">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  {user.role}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <FormField label="Full Name">
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(value) => handleInputChange("name", value)}
                  placeholder="Enter your full name"
                />
              ) : (
                <ReadOnlyField>
                  <span className="text-slate-900 dark:text-slate-100">
                    {user.name || "Not provided"}
                  </span>
                </ReadOnlyField>
              )}
            </FormField>

            {/* Username */}
            <FormField label="Username">
              {isEditing ? (
                <Input
                  value={formData.username}
                  onChange={(value) => handleInputChange("username", value)}
                  placeholder="Enter username"
                />
              ) : (
                <ReadOnlyField>
                  <span className="text-slate-900 dark:text-slate-100">
                    {user.username}
                  </span>
                </ReadOnlyField>
              )}
            </FormField>

            {/* Email */}
            <FormField label="Email Address">
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange("email", value)}
                  placeholder="Enter email address"
                />
              ) : (
                <ReadOnlyField>
                  <span className="text-slate-900 dark:text-slate-100">
                    {user.email || "Not provided"}
                  </span>
                </ReadOnlyField>
              )}
            </FormField>

            {/* Password */}
            <FormField label="Password">
              {isEditing ? (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(value) => handleInputChange("password", value)}
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              ) : (
                <ReadOnlyField>
                  <span className="text-slate-900 dark:text-slate-100">••••••••</span>
                  <p className="text-xs text-slate-500 mt-1">
                    Password is hidden for security
                  </p>
                </ReadOnlyField>
              )}
            </FormField>

            {/* Role (Read-only) */}
            <FormField label="Role">
              <ReadOnlyField>
                <span className="text-slate-900 dark:text-slate-100">{user.role}</span>
                <p className="text-xs text-slate-500 mt-1">
                  Role cannot be changed from profile
                </p>
              </ReadOnlyField>
            </FormField>
          </div>

          {/* Account Information */}
          <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Account Status">
                <ReadOnlyField>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {user.status}
                  </span>
                </ReadOnlyField>
              </FormField>
              
              <FormField label="User ID">
                <ReadOnlyField>
                  <code className="text-sm text-slate-600 dark:text-slate-400">
                    {user.id}
                  </code>
                </ReadOnlyField>
              </FormField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};