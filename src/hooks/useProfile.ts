import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store";
import { userService, User, UpdateUserPayload } from "../services/api";

interface ProfileFormData {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface ProfileMessage {
  type: "success" | "error";
  text: string;
}

interface UseProfileReturn {
  // State
  user: User | null;
  formData: ProfileFormData;
  isLoading: boolean;
  isSubmitting: boolean;
  message: ProfileMessage | null;
  isEditing: boolean;
  showPassword: boolean;

  // Actions
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  setIsEditing: (editing: boolean) => void;
  setShowPassword: (show: boolean) => void;
  handleInputChange: (field: keyof ProfileFormData, value: string) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  dismissMessage: () => void;
}

const validateForm = (data: ProfileFormData): string | null => {
  if (!data.username.trim()) {
    return "Username is required";
  }
  if (!data.name.trim()) {
    return "Name is required";
  }
  if (data.email && !isValidEmail(data.email)) {
    return "Please enter a valid email address";
  }
  if (data.password && data.password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  return null;
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const useProfile = (): UseProfileReturn => {
  const { updateUser } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<ProfileMessage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = useCallback((userData: User) => {
    setFormData({
      name: userData.name || "",
      username: userData.username || "",
      email: userData.email || "",
      password: "",
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const response = await userService.getMe();

      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        updateUser(userData);
        resetForm(userData);
      } else {
        setMessage({
          type: "error",
          text: "Failed to load profile data",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        type: "error",
        text: "Failed to load profile data. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateUser, resetForm]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;

    const validationError = validateForm(formData);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const payload: UpdateUserPayload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim() || null,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const response = await userService.update(user.id, payload);

      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        updateUser(updatedUser);
        resetForm(updatedUser);
        setIsEditing(false);

        const passwordUpdated = formData.password.trim() !== "";
        setMessage({
          type: "success",
          text: passwordUpdated
            ? "Profile and password updated successfully!"
            : "Profile updated successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to update profile. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to update profile. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, formData, updateUser, resetForm]);

  const handleCancel = useCallback(() => {
    if (user) {
      resetForm(user);
    }
    setIsEditing(false);
    setMessage(null);
  }, [user, resetForm]);

  const handleInputChange = useCallback(
    (field: keyof ProfileFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const dismissMessage = useCallback(() => {
    setMessage(null);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    user,
    formData,
    isLoading,
    isSubmitting,
    message,
    isEditing,
    showPassword,
    setFormData,
    setIsEditing,
    setShowPassword,
    handleInputChange,
    handleSave,
    handleCancel,
    dismissMessage,
  };
};
